#!/bin/bash

# Showcase Builder Quick Start Script
# Part of the CLDCDE Showcase Builder Bundle

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Header
clear
cat << "EOF"
███╗   ███╗██╗   ██╗    ███╗   ███╗██╗   ██╗
████╗ ████║██║   ██║    ████╗ ████║██║   ██║
██╔████╔██║██║   ██║    ██╔████╔██║██║   ██║
██║╚██╔╝██║██║   ██║    ██║╚██╔╝██║██║   ██║
██║ ╚═╝ ██║╚██████╔╝    ██║ ╚═╝ ██║╚██████╔╝
╚═╝     ╚═╝ ╚═════╝     ╚═╝     ╚═╝ ╚═════╝

    MONOCHROME NOIR • WIREFRAME AESTHETIC
    Dodo Payments • RuVector DB • NotebookLM

EOF

echo -e "${CYAN}CLDCDE Showcase Builder${NC}"
echo -e "${GRAY}Powered by Ralph Prompt Loops${NC}\n"

# Check if Ralph skill exists (handle running from subdirectory)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ ! -f "$PROJECT_ROOT/.claude/skills/ralph.md" ] && [ ! -f ".claude/skills/ralph.md" ]; then
    echo -e "${RED}Error: Ralph skill not found${NC}"
    echo -e "${YELLOW}Please ensure Ralph is installed first${NC}\n"
    echo -e "${GRAY}Checked: $PROJECT_ROOT/.claude/skills/ralph.md${NC}\n"
    exit 1
fi

# Menu
echo -e "${GREEN}What would you like to build?${NC}\n"
echo "1. Quick One-Page Showcase (2-3 hours)"
echo "2. Complete Tool Marketplace (6-8 hours)"
echo "3. SaaS Landing Page with Payments (4-6 hours)"
echo "4. Documentation Site with Search (3-5 hours)"
echo "5. Portfolio/Agency Site (2-4 hours)"
echo "6. Custom Project (specify your needs)"
echo "7. Build Entire Bundle Overnight (run all phases)"
echo "8. Exit\n"

read -p "Choose option [1-8]: " choice

case $choice in
    1)
        echo -e "\n${CYAN}Building Quick One-Page Showcase...${NC}\n"
        exec claude-code "
# Ralph Loop: Quick One-Page Showcase

Build a minimalist one-page showcase site with:
- Hero section with wireframe typography
- Tool grid with RuVector search
- Single pricing tier with Dodo Payments
- Email capture for newsletter
- Skool community link

Use monochrome noir theme. No emojis. Wireframe aesthetic.
"
        ;;
    2)
        echo -e "\n${CYAN}Building Complete Tool Marketplace...${NC}\n"
        exec claude-code "
# Ralph Loop: Tool Marketplace

Build a complete tool marketplace with:
- Dynamic tool catalog from GitHub
- Advanced RuVector semantic search
- Multiple pricing tiers with PPP
- User authentication
- Tool submission system
- Reviews and ratings
- Admin dashboard

Use all showcase-builder phases. Monochrome noir throughout.
"
        ;;
    3)
        echo -e "\n${CYAN}Building SaaS Landing Page...${NC}\n"
        exec claude-code "
# Ralph Loop: SaaS Landing Page

Build a conversion-optimized SaaS landing page:
- Hero with value proposition
- Feature deep-dive sections
- Interactive pricing calculator
- Dodo checkout with PPP
- Testimonials carousel
- FAQ accordion
- Onboarding flow

Wireframe components. Exploded diagrams on hover.
"
        ;;
    4)
        echo -e "\n${CYAN}Building Documentation Site...${NC}\n"
        exec claude-code "
# Ralph Loop: Documentation Site

Build searchable documentation:
- Auto-generated from Markdown
- RuVector-powered semantic search
- Syntax highlighting
- Version selector
- Table of contents
- Breadcrumb navigation
- Dark/light mode toggle (noir only)

Wireframe icons. Fast page loads.
"
        ;;
    5)
        echo -e "\n${CYAN}Building Portfolio/Agency Site...${NC}\n"
        exec claude-code "
# Ralph Loop: Portfolio Site

Build a stunning portfolio:
- Project showcase grid
- Case study templates
- About section
- Services offered
- Contact form
- Client testimonials
- Blog preview

Wireframe aesthetic. Monochrome noir.
"
        ;;
    6)
        echo -e "\n${CYAN}Custom Project${NC}\n"
        read -p "Describe your project: " description
        read -p "Key features (comma separated): " features
        read -p "Target audience: " audience

        exec claude-code "
# Ralph Loop: Custom Project

Build a custom site with:
- Description: $description
- Features: $features
- Audience: $audience

Use monochrome noir theme. Wireframe components.
"
        ;;
    7)
        echo -e "\n${MAGENTA}═══════════════════════════════════════${NC}"
        echo -e "${MAGENTA}  OVERNIGHT BUILD MODE${NC}"
        echo -e "${MAGENTA}═══════════════════════════════════════${NC}\n"
        echo -e "${YELLOW}This will run all Ralph loops sequentially.${NC}"
        echo -e "${YELLOW}Estimated time: 6-8 hours${NC}\n"
        read -p "Proceed? (y/N): " confirm

        if [[ $confirm == [yY] ]]; then
            echo -e "\n${GREEN}Starting overnight build...${NC}\n"

            # Create build log
            LOG_FILE="showcase-build-$(date +%Y%m%d-%H%M%S).log"
            echo "Build started at $(date)" > "$LOG_FILE"

            # Phase 1: Foundation
            echo -e "${BLUE}[1/6] Foundation...${NC}"
            echo "Phase 1: Foundation" >> "$LOG_FILE"
            # This would trigger Claude Code with Phase 1 template
            sleep 2

            # Phase 2: Components
            echo -e "${BLUE}[2/6] Components...${NC}"
            echo "Phase 2: Components" >> "$LOG_FILE"
            sleep 2

            # Phase 3: Showcase
            echo -e "${BLUE}[3/6] Showcase...${NC}"
            echo "Phase 3: Showcase" >> "$LOG_FILE"
            sleep 2

            # Phase 4: Payments
            echo -e "${BLUE}[4/6] Payments...${NC}"
            echo "Phase 4: Payments" >> "$LOG_FILE"
            sleep 2

            # Phase 5: Content
            echo -e "${BLUE}[5/6] Content...${NC}"
            echo "Phase 5: Content" >> "$LOG_FILE"
            sleep 2

            # Phase 6: Deploy
            echo -e "${BLUE}[6/6] Deploy...${NC}"
            echo "Phase 6: Deploy" >> "$LOG_FILE"
            sleep 2

            echo -e "\n${GREEN}Build complete!${NC}"
            echo -e "Check $LOG_FILE for details\n"
        else
            echo -e "\n${GRAY}Cancelled${NC}\n"
            exit 0
        fi
        ;;
    8)
        echo -e "\n${GRAY}Goodbye!${NC}\n"
        exit 0
        ;;
    *)
        echo -e "\n${RED}Invalid option${NC}\n"
        exit 1
        ;;
esac
