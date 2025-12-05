#!/bin/bash

# Script to test n8n integration with n8n-mcp server
set -e

# Check for command line arguments
if [ "$1" == "--clear-api-key" ] || [ "$1" == "-c" ]; then
    echo "🗑️  Clearing saved n8n API key..."
    rm -f "$HOME/.n8n-mcp-test/.n8n-api-key"
    echo "✅ API key cleared. You'll be prompted for a new key on next run."
    exit 0
fi

if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  -c, --clear-api-key  Clear the saved n8n API key"
    echo ""
    echo "The script will save your n8n API key on first use and reuse it on"
    echo "subsequent runs. You can override the saved key at runtime or clear"
    echo "it with the --clear-api-key option."
    exit 0
fi

echo "🚀 Starting n8n integration test environment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
N8N_PORT=5678
MCP_PORT=3001
AUTH_TOKEN="test-token-for-n8n-testing-minimum-32-chars"

# n8n data directory for persistence
N8N_DATA_DIR="$HOME/.n8n-mcp-test"
# API key storage file
API_KEY_FILE="$N8N_DATA_DIR/.n8n-api-key"

# Function to detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            echo "$ID"
        else
            echo "linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# Function to check if Docker is installed
check_docker() {
    if command -v docker &> /dev/null; then
        echo -e "${GREEN}✅ Docker is installed${NC}"
        # Check if Docker daemon is running
        if ! docker info &> /dev/null; then
            echo -e "${YELLOW}⚠️  Docker is installed but not running${NC}"
            echo -e "${YELLOW}Please start Docker and run this script again${NC}"
            exit 1
        fi
        return 0
    else
        return 1
    fi
}

# Function to install Docker based on OS
install_docker() {
    local os=$(detect_os)
    echo -e "${YELLOW}📦 Docker is not installed. Attempting to install...${NC}"
    
    case $os in
        "ubuntu"|"debian")
            echo -e "${BLUE}Installing Docker on Ubuntu/Debian...${NC}"
            echo "This requires sudo privileges."
            sudo apt-get update
            sudo apt-get install -y ca-certificates curl gnupg
            sudo install -m 0755 -d /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            sudo chmod a+r /etc/apt/keyrings/docker.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            sudo usermod -aG docker $USER
            echo -e "${GREEN}✅ Docker installed successfully${NC}"
            echo -e "${YELLOW}⚠️  Please log out and back in for group changes to take effect${NC}"
            ;;
        "fedora"|"rhel"|"centos")
            echo -e "${BLUE}Installing Docker on Fedora/RHEL/CentOS...${NC}"
            echo "This requires sudo privileges."
            sudo dnf -y install dnf-plugins-core
            sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
            sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            sudo systemctl start docker
            sudo systemctl enable docker
            sudo usermod -aG docker $USER
            echo -e "${GREEN}✅ Docker installed successfully${NC}"
            echo -e "${YELLOW}⚠️  Please log out and back in for group changes to take effect${NC}"
            ;;
        "macos")
            echo -e "${BLUE}Installing Docker on macOS...${NC}"
            if command -v brew &> /dev/null; then
                echo "Installing Docker Desktop via Homebrew..."
                brew install --cask docker
                echo -e "${GREEN}✅ Docker Desktop installed${NC}"
                echo -e "${YELLOW}⚠️  Please start Docker Desktop from Applications${NC}"
            else
                echo -e "${RED}❌ Homebrew not found${NC}"
                echo "Please install Docker Desktop manually from:"
                echo "https://www.docker.com/products/docker-desktop/"
            fi
            ;;
        "windows")
            echo -e "${RED}❌ Windows detected${NC}"
            echo "Please install Docker Desktop manually from:"
            echo "https://www.docker.com/products/docker-desktop/"
            ;;
        *)
            echo -e "${RED}❌ Unknown operating system: $os${NC}"
            echo "Please install Docker manually from https://docs.docker.com/get-docker/"
            ;;
    esac
    
    # If we installed Docker on Linux, we need to restart for group changes
    if [[ "$os" == "ubuntu" ]] || [[ "$os" == "debian" ]] || [[ "$os" == "fedora" ]] || [[ "$os" == "rhel" ]] || [[ "$os" == "centos" ]]; then
        echo -e "${YELLOW}Please run 'newgrp docker' or log out and back in, then run this script again${NC}"
        exit 0
    fi
    
    exit 1
}

# Check for Docker
if ! check_docker; then
    install_docker
fi

# Check for jq (optional but recommended)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq is not installed (optional)${NC}"
    echo -e "${YELLOW}   Install it for pretty JSON output in tests${NC}"
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    
    # Stop n8n container
    if docker ps -q -f name=n8n-test > /dev/null 2>&1; then
        echo "Stopping n8n container..."
        docker stop n8n-test >/dev/null 2>&1 || true
        docker rm n8n-test >/dev/null 2>&1 || true
    fi
    
    # Kill MCP server if running
    if [ -n "$MCP_PID" ] && kill -0 $MCP_PID 2>/dev/null; then
        echo "Stopping MCP server..."
        kill $MCP_PID 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "dist" ]; then
    echo -e "${RED}❌ Error: Must run from n8n-mcp directory${NC}"
    echo "Please cd to /Users/romualdczlonkowski/Pliki/n8n-mcp/n8n-mcp"
    exit 1
fi

# Always build the project to ensure latest changes
echo -e "${YELLOW}📦 Building project...${NC}"
npm run build

# Create n8n data directory if it doesn't exist
if [ ! -d "$N8N_DATA_DIR" ]; then
    echo -e "${YELLOW}📁 Creating n8n data directory: $N8N_DATA_DIR${NC}"
    mkdir -p "$N8N_DATA_DIR"
fi

# Start n8n in Docker with persistent volume
echo -e "\n${GREEN}🐳 Starting n8n container with persistent data...${NC}"
docker run -d \
  --name n8n-test \
  -p ${N8N_PORT}:5678 \
  -v "${N8N_DATA_DIR}:/home/node/.n8n" \
  -e N8N_BASIC_AUTH_ACTIVE=false \
  -e N8N_HOST=localhost \
  -e N8N_PORT=5678 \
  -e N8N_PROTOCOL=http \
  -e NODE_ENV=development \
  -e N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true \
  n8nio/n8n:latest

# Wait for n8n to be ready
echo -e "${YELLOW}⏳ Waiting for n8n to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:${N8N_PORT}/ >/dev/null 2>&1; then
        echo -e "${GREEN}✅ n8n is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ n8n failed to start${NC}"
        exit 1
    fi
    sleep 1
done

# Check for saved API key
if [ -f "$API_KEY_FILE" ]; then
    # Read saved API key
    N8N_API_KEY=$(cat "$API_KEY_FILE" 2>/dev/null || echo "")
    
    if [ -n "$N8N_API_KEY" ]; then
        echo -e "\n${GREEN}✅ Using saved n8n API key${NC}"
        echo -e "${YELLOW}   To use a different key, delete: ${API_KEY_FILE}${NC}"
        
        # Give user a chance to override
        echo -e "\n${YELLOW}Press Enter to continue with saved key, or paste a new API key:${NC}"
        read -r NEW_API_KEY
        
        if [ -n "$NEW_API_KEY" ]; then
            N8N_API_KEY="$NEW_API_KEY"
            # Save the new key
            echo "$N8N_API_KEY" > "$API_KEY_FILE"
            chmod 600 "$API_KEY_FILE"
            echo -e "${GREEN}✅ New API key saved${NC}"
        fi
    else
        # File exists but is empty, remove it
        rm -f "$API_KEY_FILE"
    fi
fi

# If no saved key, prompt for one
if [ -z "$N8N_API_KEY" ]; then
    # Guide user to get API key
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🔑 n8n API Key Setup${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "\nTo enable n8n management tools, you need to create an API key:"
    echo -e "\n${GREEN}Steps:${NC}"
    echo -e "  1. Open n8n in your browser: ${BLUE}http://localhost:${N8N_PORT}${NC}"
    echo -e "  2. Click on your user menu (top right)"
    echo -e "  3. Go to 'Settings'"
    echo -e "  4. Navigate to 'API'"
    echo -e "  5. Click 'Create API Key'"
    echo -e "  6. Give it a name (e.g., 'n8n-mcp')"
    echo -e "  7. Copy the generated API key"
    echo -e "\n${YELLOW}Note: If this is your first time, you'll need to create an account first.${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Wait for API key input
    echo -e "\n${YELLOW}Please paste your n8n API key here (or press Enter to skip):${NC}"
    read -r N8N_API_KEY
    
    # Save the API key if provided
    if [ -n "$N8N_API_KEY" ]; then
        echo "$N8N_API_KEY" > "$API_KEY_FILE"
        chmod 600 "$API_KEY_FILE"
        echo -e "${GREEN}✅ API key saved for future use${NC}"
    fi
fi

# Check if API key was provided
if [ -z "$N8N_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  No API key provided. n8n management tools will not be available.${NC}"
    echo -e "${YELLOW}   You can still use documentation and search tools.${NC}"
    N8N_API_KEY=""
    N8N_API_URL=""
else
    echo -e "${GREEN}✅ API key received${NC}"
    # Set the API URL for localhost access (MCP server runs on host, not in Docker)
    N8N_API_URL="http://localhost:${N8N_PORT}/api/v1"
fi

# Start MCP server
echo -e "\n${GREEN}🚀 Starting MCP server in n8n mode...${NC}"
if [ -n "$N8N_API_KEY" ]; then
    echo -e "${YELLOW}   With n8n management tools enabled${NC}"
fi

N8N_MODE=true \
MCP_MODE=http \
AUTH_TOKEN="${AUTH_TOKEN}" \
PORT=${MCP_PORT} \
N8N_API_KEY="${N8N_API_KEY}" \
N8N_API_URL="${N8N_API_URL}" \
node dist/mcp/index.js > /tmp/mcp-server.log 2>&1 &

MCP_PID=$!

# Show log file location
echo -e "${YELLOW}📄 MCP server logs: /tmp/mcp-server.log${NC}"

# Wait for MCP server to be ready
echo -e "${YELLOW}⏳ Waiting for MCP server to start...${NC}"
for i in {1..10}; do
    if curl -s http://localhost:${MCP_PORT}/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ MCP server is ready!${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ MCP server failed to start${NC}"
        exit 1
    fi
    sleep 1
done

# Show status and test endpoints
echo -e "\n${GREEN}🎉 Both services are running!${NC}"
echo -e "\n📍 Service URLs:"
echo -e "  • n8n:        http://localhost:${N8N_PORT}"
echo -e "  • MCP server: http://localhost:${MCP_PORT}"
echo -e "\n🔑 Auth token: ${AUTH_TOKEN}"
echo -e "\n💾 n8n data stored in: ${N8N_DATA_DIR}"
echo -e "   (Your workflows, credentials, and settings are preserved between runs)"

# Test MCP protocol endpoint
echo -e "\n${YELLOW}🧪 Testing MCP protocol endpoint...${NC}"
echo "Response from GET /mcp:"
curl -s http://localhost:${MCP_PORT}/mcp | jq '.' || curl -s http://localhost:${MCP_PORT}/mcp

# Test MCP initialization
echo -e "\n${YELLOW}🧪 Testing MCP initialization...${NC}"
echo "Response from POST /mcp (initialize):"
curl -s -X POST http://localhost:${MCP_PORT}/mcp \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{}},"id":1}' \
  | jq '.' || echo "(Install jq for pretty JSON output)"

# Test available tools
echo -e "\n${YELLOW}🧪 Checking available MCP tools...${NC}"
if [ -n "$N8N_API_KEY" ]; then
    echo -e "${GREEN}✅ n8n Management Tools Available:${NC}"
    echo "   • n8n_list_workflows - List all workflows"
    echo "   • n8n_get_workflow - Get workflow details"
    echo "   • n8n_create_workflow - Create new workflows"
    echo "   • n8n_update_workflow - Update existing workflows"
    echo "   • n8n_delete_workflow - Delete workflows"
    echo "   • n8n_trigger_webhook_workflow - Trigger webhook workflows"
    echo "   • n8n_list_executions - List workflow executions"
    echo "   • And more..."
else
    echo -e "${YELLOW}⚠️  n8n Management Tools NOT Available${NC}"
    echo "   To enable, restart with an n8n API key"
fi

echo -e "\n${GREEN}✅ Documentation Tools Always Available:${NC}"
echo "   • list_nodes - List available n8n nodes"
echo "   • search_nodes - Search for specific nodes"
echo "   • get_node_info - Get detailed node information"
echo "   • validate_node_operation - Validate node configurations"
echo "   • And many more..."

echo -e "\n${GREEN}✅ Setup complete!${NC}"
echo -e "\n📝 Next steps:"
echo -e "  1. Open n8n at http://localhost:${N8N_PORT}"
echo -e "  2. Create a workflow with the AI Agent node"
echo -e "  3. Add MCP Client Tool node"
echo -e "  4. Configure it with:"
echo -e "     • Transport: HTTP"
echo -e "     • URL: http://host.docker.internal:${MCP_PORT}/mcp"
echo -e "     • Auth Token: ${BLUE}${AUTH_TOKEN}${NC}"
echo -e "\n${YELLOW}Press Ctrl+C to stop both services${NC}"
echo -e "\n${YELLOW}📋 To monitor MCP logs: tail -f /tmp/mcp-server.log${NC}"
echo -e "${YELLOW}📋 To monitor n8n logs: docker logs -f n8n-test${NC}"

# Wait for interrupt
wait $MCP_PID