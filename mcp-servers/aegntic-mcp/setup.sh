#!/bin/bash
# Aegntic MCP Collection Setup Script

echo "🚀 Setting up Aegntic MCP Collection..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.8+ from https://python.org/"
        exit 1
    fi
    
    # Check uv (Python package manager)
    if ! command -v uv &> /dev/null; then
        print_warning "uv is not installed. Installing uv..."
        curl -LsSf https://astral.sh/uv/install.sh | sh
        source ~/.bashrc
    fi
    
    print_status "Requirements check complete ✓"
}

# Setup TypeScript/Node.js servers
setup_node_servers() {
    print_status "Setting up Node.js MCP servers..."
    
    local servers=("dailydoco-pro" "aegnt-27" "comfyui-mcp" "aegntic-auth" "n8n-pro")
    
    for server in "${servers[@]}"; do
        if [ -d "$server" ]; then
            print_status "Setting up $server..."
            cd "$server"
            
            if [ -f "package.json" ]; then
                npm install
                if [ -f "tsconfig.json" ]; then
                    npm run build 2>/dev/null || npx tsc
                fi
            fi
            
            cd ..
        fi
    done
    
    print_status "Node.js servers setup complete ✓"
}

# Setup Python servers
setup_python_servers() {
    print_status "Setting up Python MCP servers..."
    
    local servers=("graphiti-mcp" "just-prompt" "quick-data")
    
    for server in "${servers[@]}"; do
        if [ -d "$server" ]; then
            print_status "Setting up $server..."
            cd "$server"
            
            if [ -f "pyproject.toml" ]; then
                uv sync
            fi
            
            cd ..
        fi
    done
    
    print_status "Python servers setup complete ✓"
}

# Generate configuration template
generate_config() {
    print_status "Generating Claude Desktop configuration template..."
    
    CURRENT_DIR=$(pwd)
    
    cat > claude_desktop_config.json << EOF
{
  "mcpServers": {
    "dailydoco-pro": {
      "command": "node",
      "args": ["${CURRENT_DIR}/dailydoco-pro/dist/index.js"],
      "env": {
        "USER_EMAIL": "your-email@example.com"
      }
    },
    "aegnt-27": {
      "command": "node",
      "args": ["${CURRENT_DIR}/aegnt-27/dist/index.js"],
      "env": {
        "USER_EMAIL": "your-email@example.com"
      }
    },
    "comfyui": {
      "command": "node",
      "args": ["${CURRENT_DIR}/comfyui-mcp/dist/index.js"],
      "env": {
        "COMFYUI_HOST": "http://localhost:8188",
        "COMFYUI_OUTPUT_DIR": "${CURRENT_DIR}/comfyui-outputs",
        "USER_EMAIL": "your-email@example.com",
        "ENABLE_AUTO_REGISTRATION": "true"
      }
    },
    "aegntic-auth": {
      "command": "node",
      "args": ["${CURRENT_DIR}/aegntic-auth/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your-supabase-anon-key",
        "USER_EMAIL": "your-email@example.com",
        "USER_NAME": "Your Name"
      }
    },
    "graphiti": {
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "${CURRENT_DIR}/graphiti-mcp",
        "python",
        "graphiti_mcp_server.py",
        "--transport",
        "stdio",
        "--group-id",
        "your-project"
      ],
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "your-neo4j-password",
        "OPENAI_API_KEY": "your-openai-api-key"
      }
    },
    "n8n-pro": {
      "command": "node",
      "args": ["${CURRENT_DIR}/n8n-pro/dist/mcp/index.js"],
      "env": {
        "N8N_API_URL": "http://localhost:5678",
        "N8N_API_KEY": "your-n8n-api-key"
      }
    },
    "just-prompt": {
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "${CURRENT_DIR}/just-prompt",
        "just-prompt"
      ],
      "env": {
        "OPENROUTER_API_KEY": "your-openrouter-api-key"
      }
    },
    "quick-data": {
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "${CURRENT_DIR}/quick-data",
        "python",
        "main.py"
      ],
      "env": {}
    }
  }
}
EOF
    
    print_status "Configuration template generated: claude_desktop_config.json"
    print_warning "Please edit claude_desktop_config.json with your actual API keys and settings"
}

# Main setup function
main() {
    echo "🎯 Aegntic MCP Collection Setup"
    echo "================================"
    
    check_requirements
    setup_node_servers
    setup_python_servers
    generate_config
    
    echo ""
    print_status "Setup complete! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Edit claude_desktop_config.json with your API keys"
    echo "2. Copy the contents to your Claude Desktop configuration"
    echo "3. Restart Claude Desktop"
    echo "4. Test the MCP servers with Claude"
    echo ""
    echo "For Claude Desktop configuration location:"
    echo "- macOS: ~/Library/Application Support/Claude/claude_desktop_config.json"
    echo "- Linux: ~/.config/claude/claude_desktop_config.json"
    echo "- Windows: %APPDATA%/Claude/claude_desktop_config.json"
    echo ""
    echo "See individual server README files for detailed configuration options."
}

# Run main function
main "$@"