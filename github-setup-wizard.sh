#!/bin/bash

# Colors for better UI
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# GitHub OAuth App creation URL
GITHUB_OAUTH_URL="https://github.com/settings/applications/new"

# Clear screen for clean UI
clear

echo -e "${BLUE}${BOLD}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║             CLDCDE Pro - GitHub Setup Wizard              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${YELLOW}This wizard will help you set up GitHub integration in 3 easy steps!${NC}\n"

# Step 1: Check if .env exists
if [ ! -f .env ]; then
    echo -e "${BLUE}Creating .env file from template...${NC}"
    cp .env.example .env 2>/dev/null || echo "# GitHub OAuth Configuration" > .env
    echo -e "${GREEN}✓ Created .env file${NC}\n"
else
    echo -e "${GREEN}✓ Found existing .env file${NC}\n"
fi

# Function to update .env file
update_env() {
    local key=$1
    local value=$2
    
    # Remove existing entry if present
    sed -i.bak "/^$key=/d" .env 2>/dev/null || true
    sed -i.bak "/^export $key=/d" .env 2>/dev/null || true
    
    # Add new entry
    echo "export $key=\"$value\"" >> .env
}

# Step 2: Choose setup method
echo -e "${BOLD}Choose your setup method:${NC}"
echo "1) GitHub OAuth App (Recommended - Full integration)"
echo "2) Personal Access Token (Quick setup - Limited features)"
echo "3) Skip GitHub setup (Use local auth only)"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo -e "\n${BLUE}${BOLD}=== GitHub OAuth App Setup ===${NC}"
        echo -e "${YELLOW}Opening GitHub OAuth App creation page...${NC}\n"
        
        # Generate random state for security
        RANDOM_STATE=$(openssl rand -hex 16 2>/dev/null || date +%s | sha256sum | head -c 32)
        
        # Pre-fill OAuth app details
        APP_NAME="CLDCDE Pro - $(whoami)"
        HOMEPAGE_URL="http://localhost:8083"
        CALLBACK_URL="http://localhost:8083/auth/github/callback"
        
        echo "Use these values in the GitHub form:"
        echo -e "${BOLD}Application name:${NC} $APP_NAME"
        echo -e "${BOLD}Homepage URL:${NC} $HOMEPAGE_URL"
        echo -e "${BOLD}Authorization callback URL:${NC} $CALLBACK_URL"
        echo -e "${BOLD}Description:${NC} Autonomous AI development orchestration system"
        echo ""
        
        # Try to open browser
        if command -v xdg-open > /dev/null; then
            xdg-open "$GITHUB_OAUTH_URL" 2>/dev/null
        elif command -v open > /dev/null; then
            open "$GITHUB_OAUTH_URL" 2>/dev/null
        else
            echo -e "${YELLOW}Please open this URL in your browser:${NC}"
            echo "$GITHUB_OAUTH_URL"
        fi
        
        echo -e "\n${BOLD}After creating the OAuth App, you'll see your Client ID and Client Secret.${NC}"
        echo ""
        
        # Get Client ID
        read -p "Enter your GitHub Client ID: " client_id
        update_env "GITHUB_CLIENT_ID" "$client_id"
        
        # Get Client Secret
        echo ""
        read -s -p "Enter your GitHub Client Secret (hidden): " client_secret
        echo ""
        update_env "GITHUB_CLIENT_SECRET" "$client_secret"
        update_env "GITHUB_REDIRECT_URI" "$CALLBACK_URL"
        
        echo -e "\n${GREEN}✓ OAuth credentials saved to .env${NC}"
        ;;
        
    2)
        echo -e "\n${BLUE}${BOLD}=== Personal Access Token Setup ===${NC}"
        echo -e "${YELLOW}Opening GitHub token creation page...${NC}\n"
        
        TOKEN_URL="https://github.com/settings/tokens/new"
        
        echo "Create a token with these scopes:"
        echo "✓ repo (Full control of private repositories)"
        echo "✓ read:user (Read all user profile data)"
        echo "✓ user:email (Access user email addresses)"
        echo ""
        
        # Try to open browser
        if command -v xdg-open > /dev/null; then
            xdg-open "$TOKEN_URL" 2>/dev/null
        elif command -v open > /dev/null; then
            open "$TOKEN_URL" 2>/dev/null
        else
            echo -e "${YELLOW}Please open this URL in your browser:${NC}"
            echo "$TOKEN_URL"
        fi
        
        echo ""
        read -s -p "Enter your Personal Access Token (hidden): " token
        echo ""
        update_env "GITHUB_TOKEN" "$token"
        
        echo -e "\n${GREEN}✓ Personal Access Token saved to .env${NC}"
        ;;
        
    3)
        echo -e "\n${YELLOW}Skipping GitHub setup. You can use local authentication.${NC}"
        echo "Default credentials: admin / admin123"
        ;;
        
    *)
        echo -e "\n${RED}Invalid choice. Exiting...${NC}"
        exit 1
        ;;
esac

# Step 3: Configure other settings
echo -e "\n${BLUE}${BOLD}=== Additional Configuration ===${NC}"

# Ask about port
current_port=$(grep "DASHBOARD_PORT" .env | cut -d'"' -f2 || echo "8083")
read -p "Dashboard port (default: $current_port): " port
port=${port:-$current_port}
update_env "DASHBOARD_PORT" "$port"

# Generate JWT secret if not exists
if ! grep -q "JWT_SECRET" .env || grep -q "your-secret-key-change-in-production" .env; then
    echo -e "\n${YELLOW}Generating secure JWT secret...${NC}"
    jwt_secret=$(openssl rand -base64 32 2>/dev/null || date +%s | sha256sum | base64 | head -c 32)
    update_env "JWT_SECRET" "$jwt_secret"
    echo -e "${GREEN}✓ Generated secure JWT secret${NC}"
fi

# Clean up backup files
rm -f .env.bak

# Step 4: Launch options
echo -e "\n${GREEN}${BOLD}=== Setup Complete! ===${NC}"
echo ""
echo "Your configuration has been saved to .env"
echo ""
echo -e "${BOLD}What would you like to do next?${NC}"
echo "1) Start CLDCDE Pro now"
echo "2) View configuration"
echo "3) Exit"
echo ""
read -p "Enter your choice (1-3): " launch_choice

case $launch_choice in
    1)
        echo -e "\n${BLUE}Starting CLDCDE Pro...${NC}"
        echo -e "${YELLOW}Dashboard will be available at: http://localhost:$port${NC}\n"
        
        # Check if cargo is available
        if ! command -v cargo > /dev/null; then
            echo -e "${RED}Error: Cargo not found. Please install Rust first.${NC}"
            echo "Visit: https://rustup.rs/"
            exit 1
        fi
        
        # Source environment and run
        source .env
        cargo run -p web-dashboard
        ;;
        
    2)
        echo -e "\n${BLUE}Current Configuration:${NC}"
        echo "------------------------"
        grep -E "GITHUB_|DASHBOARD_PORT|JWT_SECRET" .env | sed 's/export //' | while read line; do
            key=$(echo $line | cut -d'=' -f1)
            value=$(echo $line | cut -d'"' -f2)
            
            # Hide secrets
            if [[ $key == *"SECRET"* ]] || [[ $key == *"TOKEN"* ]]; then
                if [ -n "$value" ]; then
                    echo "$key=****"
                else
                    echo "$key=(not set)"
                fi
            elif [[ $key == "GITHUB_CLIENT_ID" ]]; then
                if [ -n "$value" ]; then
                    echo "$key=${value:0:10}..."
                else
                    echo "$key=(not set)"
                fi
            else
                echo "$key=$value"
            fi
        done
        echo ""
        echo -e "${GREEN}To start CLDCDE Pro, run:${NC}"
        echo "source .env && cargo run -p web-dashboard"
        ;;
        
    3)
        echo -e "\n${GREEN}Setup complete! To start CLDCDE Pro later, run:${NC}"
        echo "source .env && cargo run -p web-dashboard"
        ;;
esac

echo ""
echo -e "${BLUE}${BOLD}Thank you for using CLDCDE Pro!${NC}"