#!/bin/bash
# Quick deployment script for n8n + n8n-mcp stack

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
COMPOSE_FILE="docker-compose.n8n.yml"
ENV_FILE=".env"
ENV_EXAMPLE=".env.n8n.example"

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to generate random token
generate_token() {
    openssl rand -hex 32
}

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check openssl for token generation
    if ! command -v openssl &> /dev/null; then
        print_error "OpenSSL is not installed. Please install OpenSSL first."
        exit 1
    fi
    
    print_info "All prerequisites are installed."
}

# Function to setup environment
setup_environment() {
    print_info "Setting up environment..."
    
    # Check if .env exists
    if [ -f "$ENV_FILE" ]; then
        print_warn ".env file already exists. Backing up to .env.backup"
        cp "$ENV_FILE" ".env.backup"
    fi
    
    # Copy example env file
    if [ -f "$ENV_EXAMPLE" ]; then
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        print_info "Created .env file from example"
    else
        print_error ".env.n8n.example file not found!"
        exit 1
    fi
    
    # Generate encryption key
    ENCRYPTION_KEY=$(generate_token)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/N8N_ENCRYPTION_KEY=/N8N_ENCRYPTION_KEY=$ENCRYPTION_KEY/" "$ENV_FILE"
    else
        sed -i "s/N8N_ENCRYPTION_KEY=/N8N_ENCRYPTION_KEY=$ENCRYPTION_KEY/" "$ENV_FILE"
    fi
    print_info "Generated n8n encryption key"
    
    # Generate MCP auth token
    MCP_TOKEN=$(generate_token)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/MCP_AUTH_TOKEN=/MCP_AUTH_TOKEN=$MCP_TOKEN/" "$ENV_FILE"
    else
        sed -i "s/MCP_AUTH_TOKEN=/MCP_AUTH_TOKEN=$MCP_TOKEN/" "$ENV_FILE"
    fi
    print_info "Generated MCP authentication token"
    
    print_warn "Please update the following in .env file:"
    print_warn "  - N8N_BASIC_AUTH_PASSWORD (current: changeme)"
    print_warn "  - N8N_API_KEY (get from n8n UI after first start)"
}

# Function to build images
build_images() {
    print_info "Building n8n-mcp image..."
    
    if docker compose version &> /dev/null; then
        docker compose -f "$COMPOSE_FILE" build
    else
        docker-compose -f "$COMPOSE_FILE" build
    fi
    
    print_info "Image built successfully"
}

# Function to start services
start_services() {
    print_info "Starting services..."
    
    if docker compose version &> /dev/null; then
        docker compose -f "$COMPOSE_FILE" up -d
    else
        docker-compose -f "$COMPOSE_FILE" up -d
    fi
    
    print_info "Services started"
}

# Function to show status
show_status() {
    print_info "Checking service status..."
    
    if docker compose version &> /dev/null; then
        docker compose -f "$COMPOSE_FILE" ps
    else
        docker-compose -f "$COMPOSE_FILE" ps
    fi
    
    echo ""
    print_info "Services are starting up. This may take a minute..."
    print_info "n8n will be available at: http://localhost:5678"
    print_info "n8n-mcp will be available at: http://localhost:3000"
    echo ""
    print_warn "Next steps:"
    print_warn "1. Access n8n at http://localhost:5678"
    print_warn "2. Log in with admin/changeme (or your custom password)"
    print_warn "3. Go to Settings > n8n API > Create API Key"
    print_warn "4. Update N8N_API_KEY in .env file"
    print_warn "5. Restart n8n-mcp: docker-compose -f $COMPOSE_FILE restart n8n-mcp"
}

# Function to stop services
stop_services() {
    print_info "Stopping services..."
    
    if docker compose version &> /dev/null; then
        docker compose -f "$COMPOSE_FILE" down
    else
        docker-compose -f "$COMPOSE_FILE" down
    fi
    
    print_info "Services stopped"
}

# Function to view logs
view_logs() {
    SERVICE=$1
    
    if [ -z "$SERVICE" ]; then
        if docker compose version &> /dev/null; then
            docker compose -f "$COMPOSE_FILE" logs -f
        else
            docker-compose -f "$COMPOSE_FILE" logs -f
        fi
    else
        if docker compose version &> /dev/null; then
            docker compose -f "$COMPOSE_FILE" logs -f "$SERVICE"
        else
            docker-compose -f "$COMPOSE_FILE" logs -f "$SERVICE"
        fi
    fi
}

# Main script
case "${1:-help}" in
    setup)
        check_prerequisites
        setup_environment
        build_images
        start_services
        show_status
        ;;
    start)
        start_services
        show_status
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        start_services
        show_status
        ;;
    status)
        show_status
        ;;
    logs)
        view_logs "${2}"
        ;;
    build)
        build_images
        ;;
    *)
        echo "n8n-mcp Quick Deploy Script"
        echo ""
        echo "Usage: $0 {setup|start|stop|restart|status|logs|build}"
        echo ""
        echo "Commands:"
        echo "  setup    - Initial setup: create .env, build images, and start services"
        echo "  start    - Start all services"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  status   - Show service status"
        echo "  logs     - View logs (optionally specify service: logs n8n-mcp)"
        echo "  build    - Build/rebuild images"
        echo ""
        echo "Examples:"
        echo "  $0 setup          # First time setup"
        echo "  $0 logs n8n-mcp   # View n8n-mcp logs"
        echo "  $0 restart        # Restart all services"
        ;;
esac