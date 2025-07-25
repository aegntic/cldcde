#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Checking CLDCDE Pro build...${NC}"

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo -e "${RED}Error: Rust is not installed${NC}"
    echo "Please install Rust from https://rustup.rs/"
    exit 1
fi

# Try to build the web-dashboard
echo -e "\n${YELLOW}Building web-dashboard...${NC}"
if cd /home/tabs/ae-co-system/mux-pro/enhanced-tmux-orchestrator && cargo build -p web-dashboard 2>&1 | tee build.log; then
    echo -e "\n${GREEN}✓ Build successful!${NC}"
    echo -e "\n${GREEN}Your one-click GitHub setup wizard is ready!${NC}"
    echo -e "\nAccess it at:"
    echo -e "  ${GREEN}http://localhost:8083/setup/github${NC}"
    echo -e "\nTo start the server, run:"
    echo -e "  ${GREEN}cargo run -p web-dashboard${NC}"
else
    echo -e "\n${RED}✗ Build failed${NC}"
    echo -e "\nCheck build.log for details"
    
    # Try to extract the main error
    if grep -q "cannot find" build.log; then
        echo -e "\n${YELLOW}Possible missing dependencies detected${NC}"
    fi
fi