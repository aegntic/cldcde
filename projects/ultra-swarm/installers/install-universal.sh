#!/bin/bash

# Ultra Sequential Swarm - Universal Installation Script
# Installs across all major AI coding assistant platforms
#
# Author: Mattae Cooper - AI Complex Systems Integrity Strategist
# Organization: Aegntic - Advanced AI Systems Research
# License: See LICENSE.md for licensing terms

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}") && pwd)"
PROJECT_NAME="ultra-sequential-swarm"
VERSION="1.0.0"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# System detection
detect_platforms() {
    echo "${BLUE}🔍 Detecting AI Coding Assistant Platforms...${NC}"

    local platforms=()

    # Check for Claude Code
    if command -v claude >/dev/null 2>&1; then
        platforms+=("Claude Code (MCP Supported)")
    fi

    # Check for common AI CLI tools
    if command -v gemini >/dev/null 2>&1; then
        platforms+=("Gemini CLI (Shell Integration)")
    fi

    if command -v aider >/dev/null 2>&1; then
        platforms+=("Aider (Shell Integration)")
    fi

    if command -v kilo >/dev/null 2>&1; then
        platforms+=("Kilo (Shell Integration)")
    fi

    # Check for VSCode
    if command -v code >/dev/null 2>&1; then
        platforms+=("VSCode (Extension Available)")
    fi

    if [ ${#platforms[@]} -eq 0 ]; then
        echo "${YELLOW}⚠️  No AI coding assistants detected${NC}"
    else
        echo "${GREEN}✅ Detected platforms:${NC}"
        for platform in "${platforms[@]}"; do
            echo "  🤖 $platform"
        done
    fi

    echo
}

# Install MCP server for compatible platforms
install_mcp_server() {
    echo "${BLUE}📦 Installing MCP Server...${NC}"

    # Create MCP directory structure
    local mcp_dir="$HOME/.config/claude-desktop/claude_desktop_config/$PROJECT_NAME"
    mkdir -p "$mcp_dir"

    # Copy MCP server files
    cp "$SCRIPT_DIR/mcp-server/mcp.json" "$mcp_dir/"
    cp "$SCRIPT_DIR/mcp-server/index.js" "$mcp_dir/"

    # Create symlink for easier access
    ln -sf "$mcp_dir/index.js" "$mcp_dir/server.js"

    echo "${GREEN}✅ MCP server installed to: $mcp_dir${NC}"
    echo "${CYAN}📋 Next Steps:${NC}"
    echo "  1. Restart Claude Code"
    echo "  2. Go to Settings → Developer → MCP Servers"
    echo "  3. Enable '$PROJECT_NAME'"
    echo
}

# Install shell integration
install_shell_integration() {
    echo "${BLUE}🔧 Installing Shell Integration...${NC}"

    # Create installation directory
    local install_dir="$HOME/.local/bin"
    mkdir -p "$install_dir"

    # Copy shell script
    cp "$SCRIPT_DIR/shell-integration/ultra-swarm" "$install_dir/"

    # Add to PATH if not already there
    if [[ ":$HOME/.local/bin:" != ":$PATH:" ]]; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc" 2>/dev/null || true
        echo "${GREEN}✅ Added to PATH in .bashrc${NC}"
    fi

    # Initialize shell integration
    "$install_dir/ultra-swarm" init

    echo "${GREEN}✅ Shell integration installed to: $install_dir/ultra-swarm${NC}"
    echo "${CYAN}📋 Usage:${NC}"
    echo "  ultra-swarm suggest \"your context\""
    echo "  ultra-swarm think \"your problem\""
    echo "  ultra-swarm insert \"your context\""
    echo
}

# Install VSCode extension (prepare)
install_vscode_extension() {
    echo "${BLUE}📱 Preparing VSCode Extension...${NC}"

    echo "${YELLOW}VSCode extension requires additional development:${NC}"
    echo "  📦 Extension package: $PROJECT_NAME-vscode"
    echo "  🔧 Development required: TypeScript, VSCode Extension API"
    echo "  📋 Manual installation: vsix file"
    echo
}

# Create desktop entry
create_desktop_entry() {
    echo "${BLUE}🖥 Creating Desktop Entry...${NC}"

    local desktop_dir="$HOME/.local/share/applications"
    mkdir -p "$desktop_dir"

    cat > "$desktop_dir/ultra-swarm.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Ultra Sequential Swarm
Comment=Multi-agent collaborative thinking system
Exec=gnome-terminal -- ultra-swarm
Icon=ultra-swarm
Terminal=true
Categories=Development;IDE;
Keywords=AI;thinking;collaborative;sequential;
EOF

    echo "${GREEN}✅ Desktop entry created${NC}"
}

# Validate installation
validate_installation() {
    echo "${BLUE}🔍 Validating Installation...${NC}"

    local errors=0

    # Check MCP server
    if [ -f "$HOME/.config/claude-desktop/claude_desktop_config/$PROJECT_NAME/mcp.json" ]; then
        echo "${GREEN}✅ MCP server installed${NC}"
    else
        echo "${RED}❌ MCP server not found${NC}"
        ((errors++))
    fi

    # Check shell integration
    if [ -f "$HOME/.local/bin/ultra-swarm" ]; then
        echo "${GREEN}✅ Shell integration installed${NC}"
    else
        echo "${RED}❌ Shell integration not found${NC}"
        ((errors++))
    fi

    if [ $errors -eq 0 ]; then
        echo "${GREEN}🎉 Installation completed successfully!${NC}"
        return 0
    else
        echo "${RED}❌ Installation completed with $errors errors${NC}"
        return 1
    fi
}

# Main installation flow
main() {
    echo "${PURPLE}🧠 Ultra Sequential Swarm - Universal Installer v$VERSION${NC}"
    echo "${CYAN}Mattae Cooper - AI Complex Systems Integrity Strategist${NC}"
    echo "${CYAN}Aegntic - Advanced AI Systems Research${NC}"
    echo

    detect_platforms

    echo "${BLUE}🚀 Installation Options:${NC}"
    echo "  ${GREEN}1)${NC} MCP Server (Claude Code, Cline, Cursor)"
    echo "  ${GREEN}2)${NC} Shell Integration (Gemini CLI, Aider, Kilo)"
    echo "  ${GREEN}3)${NC} VSCode Extension (Development required)"
    echo "  ${GREEN}4)${NC} Complete Installation (MCP + Shell + Desktop)"
    echo "  ${GREEN}5)${NC} Custom Installation"
    echo

    read -p "${YELLOW}Choose installation option (1-5):${NC} " choice

    case "$choice" in
        1)
            install_mcp_server
            validate_installation
            ;;
        2)
            install_shell_integration
            validate_installation
            ;;
        3)
            install_vscode_extension
            echo "${YELLOW}⚠️  Extension requires manual development and packaging${NC}"
            ;;
        4)
            install_mcp_server
            install_shell_integration
            create_desktop_entry
            validate_installation
            ;;
        5)
            echo "${BLUE}🔧 Custom Installation Mode${NC}"
            echo "${CYAN}Available components:${NC}"
            echo "  a) MCP server only"
            echo "  b) Shell integration only"
            echo "  c) Both MCP and shell"
            echo "  d) Desktop entry only"
            echo
            read -p "${YELLOW}Choose custom option (a-d):${NC} " custom_choice

            case "$custom_choice" in
                a)
                    install_mcp_server
                    ;;
                b)
                    install_shell_integration
                    ;;
                c)
                    install_mcp_server
                    install_shell_integration
                    ;;
                d)
                    create_desktop_entry
                    ;;
                *)
                    echo "${RED}Invalid custom option${NC}"
                    exit 1
                    ;;
            esac

            validate_installation
            ;;
        *)
            echo "${RED}Invalid installation option${NC}"
            exit 1
            ;;
    esac

    echo
    echo "${BLUE}📚 Documentation and Support:${NC}"
    echo "  📖 Repository: https://github.com/aegntic/aegntic-MCP"
    echo "  📧 Contact: contact@ae.ltd"
    echo "  🔬 Research: research@aegntic.ai"
    echo "  📢 Media: media@aegntic.ai"
    echo
    echo "${PURPLE}🧠 Mattae Cooper - AI Complex Systems Integrity Strategist${NC}"
    echo "${GRAY}\"Crawl before walking, swarm before consciousness\"${NC}"
}

# Execute main function
main "$@"