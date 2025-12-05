#!/bin/bash
# Install MCP TUI Manager as global command

echo "🚀 Installing MCP TUI Manager as global command..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMAND_NAME="mcp-manager"

# Create global binary directory
sudo mkdir -p /usr/local/bin

# Create the global command script
sudo tee /usr/local/bin/mcp-manager > /dev/null << 'EOF'
#!/bin/bash
# MCP TUI Manager - Global Command
# Usage: mcp-manager [option]

SCRIPT_DIR="/home/tabs/universal-knowledge-synthesizer"
PYTHON_SCRIPT="$SCRIPT_DIR/mcp-tui-manager.py"

# Check dependencies
check_dependencies() {
    if ! python3 -c "import rich" 2>/dev/null; then
        echo "🔧 Installing required dependencies..."
        pip3 install --user --break-system-packages rich
    fi

    if [ ! -f "/home/tabs/comprehensive-mcp-database.json" ]; then
        echo "📊 Building MCP database..."
        python3 "$SCRIPT_DIR/comprehensive-mcp-database.py"
    fi
}

# Help function
show_help() {
    echo "🚀 MCP TUI Manager - Global Command"
    echo "==================================="
    echo ""
    echo "Usage: mcp-manager [option]"
    echo ""
    echo "Commands:"
    echo "  mcp-manager          - Launch interactive TUI"
    echo "  mcp-manager tui      - Launch interactive TUI"
    echo "  mcp-manager install  - Quick install top servers"
    echo "  mcp-manager smart    - Smart auto-discovery"
    echo "  mcp-manager power    - Power user setup"
    echo "  mcp-manager category - Category-based installation"
    echo "  mcp-manager workflow - Workflow chain builder"
    echo "  mcp-manager monitor  - Start health monitoring"
    echo "  mcp-manager status   - Show installation status"
    echo "  mcp-manager browse   - Browse all servers"
    echo "  mcp-manager config   - Configuration manager"
    echo "  mcp-manager reports  - Installation reports"
    echo "  mcp-manager help     - Show this help"
    echo ""
    echo "Examples:"
    echo "  mcp-manager              # Launch TUI"
    echo "  mcp-manager install       # Quick install"
    echo "  mcp-manager monitor       # Start monitoring"
    echo "  mcp-manager status        # Check status"
    echo ""
    echo "Features:"
    echo "  • 33+ curated MCP servers"
    echo "  • 17 functional categories"
    echo "  • Smart auto-discovery"
    echo "  • Workflow optimization"
    echo "  • Real-time health monitoring"
    echo "  • Category-based installation"
    echo "  • Quality-gated selection"
}

# Quick install function
quick_install() {
    echo "🚀 Quick installing top MCP servers..."
    check_dependencies

    python3 -c "
import asyncio
import sys
sys.path.append('$SCRIPT_DIR')
from mcp_tui_manager import MCPTUIManager

async def quick_install():
    try:
        manager = MCPTUIManager()

        # Select top servers
        top_servers = []
        for name, server in manager.servers.items():
            score = (
                server.get('agentic_potential', 0) * 0.5 +
                min(server.get('stars', 0) / 1000, 1) * 0.3 +
                server.get('quality_score', 0) * 0.2
            )
            if score > 0.8 and name not in manager.installed_servers:
                top_servers.append((name, score))

        top_servers.sort(key=lambda x: x[1], reverse=True)
        selected = [name for name, _ in top_servers[:8]]

        if selected:
            print(f'Installing {len(selected)} top servers...')
            manager.install_servers(selected, 'Quick Install')
        else:
            print('All top servers are already installed!')
    except Exception as e:
        print(f'Error: {e}')

asyncio.run(quick_install())
"
}

# Smart discovery function
smart_discovery() {
    echo "🧠 Running smart auto-discovery..."
    check_dependencies

    python3 -c "
import asyncio
import sys
sys.path.append('$SCRIPT_DIR')
from mcp_tui_manager import MCPTUIManager

async def smart_discovery():
    try:
        manager = MCPTUIManager()
        manager.smart_core_discovery()
    except Exception as e:
        print(f'Error: {e}')

asyncio.run(smart_discovery())
"
}

# Power user setup
power_user_setup() {
    echo "⚡ Setting up power user environment..."
    check_dependencies

    python3 -c "
import asyncio
import sys
sys.path.append('$SCRIPT_DIR')
from mcp_tui_manager import MCPTUIManager

async def power_user():
    try:
        manager = MCPTUIManager()
        manager.power_user_discovery()
    except Exception as e:
        print(f'Error: {e}')

asyncio.run(power_user())
"
}

# Category installation
category_install() {
    echo "📂 Category-based installation..."
    check_dependencies

    python3 -c "
import sys
sys.path.append('$SCRIPT_DIR')
from mcp_tui_manager import MCPTUIManager

try:
    manager = MCPTUIManager()
    manager.category_installation()
except Exception as e:
    print(f'Error: {e}')
"
}

# Workflow builder
workflow_builder() {
    echo "🔗 Launching workflow chain builder..."
    check_dependencies

    python3 -c "
import sys
sys.path.append('$SCRIPT_DIR')
from mcp_tui_manager import MCPTUIManager

try:
    manager = MCPTUIManager()
    manager.workflow_chain_builder()
except Exception as e:
    print(f'Error: {e}')
"
}

# Status function
show_status() {
    echo "📊 MCP Installation Status"
    echo "=========================="
    check_dependencies

    python3 -c "
import sys
sys.path.append('$SCRIPT_DIR')
from mcp_tui_manager import MCPTUIManager

try:
    manager = MCPTUIManager()
    total = len(manager.servers)
    installed = len(manager.installed_servers)
    rate = (installed / total * 100) if total > 0 else 0

    print(f'Total Database: {total} servers')
    print(f'Installed: {installed} servers')
    print(f'Installation Rate: {rate:.1f}%')
    print(f'Categories: {len(manager.categories)}')

    print('\nTop Installed Servers:')
    installed_servers = [(name, manager.servers[name]) for name in manager.installed_servers if name in manager.servers]
    installed_servers.sort(key=lambda x: x[1].get('stars', 0), reverse=True)

    for name, server in installed_servers[:10]:
        print(f'  • {name} ({server.get('stars', 0):,} ⭐)')

except Exception as e:
    print(f'Error: {e}')
"
}

# Browse servers
browse_servers() {
    echo "📚 Browse MCP Servers..."
    check_dependencies

    python3 -c "
import sys
sys.path.append('$SCRIPT_DIR')
from mcp_tui_manager import MCPTUIManager

try:
    manager = MCPTUIManager()
    manager.browse_servers()
except Exception as e:
    print(f'Error: {e}')
"
}

# Configuration manager
config_manager() {
    echo "⚙️ Configuration Manager..."
    check_dependencies

    python3 -c "
import sys
sys.path.append('$SCRIPT_DIR')
from mcp_tui_manager import MCPTUIManager

try:
    manager = MCPTUIManager()
    manager.configuration_manager()
except Exception as e:
    print(f'Error: {e}')
"
}

# Installation reports
installation_reports() {
    echo "📈 Installation Reports..."
    check_dependencies

    python3 -c "
import sys
sys.path.append('$SCRIPT_DIR')
from mcp_tui_manager import MCPTUIManager

try:
    manager = MCPTUIManager()
    manager.installation_reports()
except Exception as e:
    print(f'Error: {e}')
"
}

# Main execution
case "${1:-}" in
    "help"|"-h"|"--help")
        show_help
        ;;
    "tui"|"")
        check_dependencies
        echo "🚀 Launching MCP TUI Manager..."
        cd "$SCRIPT_DIR"
        python3 "$PYTHON_SCRIPT"
        ;;
    "install")
        quick_install
        ;;
    "smart")
        smart_discovery
        ;;
    "power")
        power_user_setup
        ;;
    "category")
        category_install
        ;;
    "workflow")
        workflow_builder
        ;;
    "monitor")
        check_dependencies
        echo "💊 Starting Health Monitor..."
        cd "$SCRIPT_DIR"
        python3 -c "
import sys
sys.path.append('$SCRIPT_DIR')
from mcp_tui_manager import MCPTUIManager
import signal

manager = MCPTUIManager()

def signal_handler(sig, frame):
    print('\n🛑 Monitoring stopped')
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
manager.real_time_monitor()
"
        ;;
    "status")
        show_status
        ;;
    "browse")
        browse_servers
        ;;
    "config")
        config_manager
        ;;
    "reports")
        installation_reports
        ;;
    "version")
        echo "MCP TUI Manager v1.0.0"
        echo "Database: 33+ servers across 17 categories"
        echo "Features: Auto-discovery, Workflow optimization, Health monitoring"
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use 'mcp-manager help' for usage information"
        exit 1
        ;;
esac
EOF

# Make it executable
sudo chmod +x /usr/local/bin/mcp-manager

# Also create shorter command
sudo ln -sf /usr/local/bin/mcp-manager /usr/local/bin/mcp

# Create desktop entry for GUI environments
sudo tee /usr/share/applications/mcp-manager.desktop > /dev/null << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=MCP TUI Manager
Comment=Model Context Protocol Auto-Discovery & Installation Manager
Exec=gnome-terminal -- /usr/local/bin/mcp-manager
Icon=terminal
Terminal=false
Categories=Development;System;
Keywords=MCP;Model Context Protocol;TUI;Terminal;AI;
EOF

# Update desktop database
sudo update-desktop-database 2>/dev/null || true

echo ""
echo "✅ MCP TUI Manager installed globally!"
echo "==================================="
echo ""
echo "🚀 Commands now available:"
echo "  mcp-manager          - Launch interactive TUI"
echo "  mcp                  - Short command (alias)"
echo "  mcp-manager help     - Show all commands"
echo ""
echo "📋 Quick commands:"
echo "  mcp-manager install  - Quick install top servers"
echo "  mcp-manager smart    - Smart auto-discovery"
echo "  mcp-manager power    - Power user setup"
echo "  mcp-manager monitor  - Start health monitoring"
echo "  mcp-manager status   - Check installation status"
echo ""
echo "🎯 Example usage:"
echo "  mcp-manager tui              # Launch TUI"
echo "  mcp-manager install           # Quick install"
echo "  mcp-manager smart             # Smart discovery"
echo "  mcp-manager monitor           # Health monitor"
echo ""
echo "💡 The command is now available from anywhere!"
echo ""