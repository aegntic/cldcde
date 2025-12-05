#!/usr/bin/env python3
"""
Prologue - The Brilliant MCP Auto Setup System
A single slash command that presents all Prologue options interactively.
Not built with demo • 🌐 logue.pro • 📧 mcp@logue.pro
"""

import os
import sys
import subprocess
from typing import List, Dict, Any
from pathlib import Path

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import platform adapter first
from platform_adapter import PlatformAdapter

# Initialize platform adapter
platform_adapter = PlatformAdapter()
platform_adapter.check_dependencies()

# Import display components based on platform compatibility
try:
    if platform_adapter.compatibility_mode['supports_rich']:
        from rich.console import Console
        from rich.panel import Panel
        from rich.text import Text
        from rich.table import Table
        from rich.prompt import Prompt, Confirm
        from rich.layout import Layout
        from rich.live import Live
        from rich.progress import Progress, SpinnerColumn, TextColumn
        from rich.style import Style
        RICH_AVAILABLE = True
    else:
        raise ImportError("Rich not supported on this platform")
except ImportError:
    # Fallback to basic display
    RICH_AVAILABLE = False
    Console = None

class PrologueInterface:
    def __init__(self):
        self.platform_adapter = platform_adapter
        self.script_dir = Path(__file__).parent
        self.prologue_manager = self.script_dir / "mcp-tui-manager.py"
        self.database = Path.home() / "comprehensive-mcp-database.json"

        # Initialize console based on platform compatibility
        if RICH_AVAILABLE and self.platform_adapter.compatibility_mode['supports_rich']:
            self.console = Console()
        else:
            self.console = None

    def show_header(self):
        """Display the Prologue header with ASCII art"""
        header = """
    ╔══════════════════════════════════════════════════════════════════════════════════╗
    ║                                                                                  ║
    ║                                                                                  ║
    ║                           🚀 Prologue - The Brilliant MCP Auto Setup                           ║
    ║                        Model Context Protocol Auto-Discovery System                        ║
    ║                                                                                  ║
    ║                                                                                  ║
    ║ ███████████                     █████                                            ║
    ║░░███░░░░░███                   ░░███                                             ║
    ║ ░███    ░███ ████████   ██████  ░███         ██████   ███████ █████ ████  ██████ ║
    ║ ░██████████ ░░███░░███ ███░░███ ░███        ███░░███ ███░░███░░███ ░███  ███░░███║
    ║ ░███░░░░░░   ░███ ░░░ ░███ ░███ ░███       ░███ ░███░███ ░███ ░███ ░███ ░███████ ║
    ║ ░███         ░███     ░███ ░███ ░███      █░███ ░███░███ ░███ ░███ ░███ ░███░░░  ║
    ║ █████        █████    ░░██████  ███████████░░██████ ░░███████ ░░████████░░██████ ║
    ║░░░░░        ░░░░░      ░░░░░░  ░░░░░░░░░░░  ░░░░░░   ░░░░░███  ░░░░░░░░  ░░░░░░  ║
    ║                                                      ███ ░███                    ║
    ║  ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ                      ░░██████                     ║
    ║       ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ ae.ˡᵗᵈ                 ░░░░░░                      ║
    ║                                                                                  ║
    ║                                                                                  ║
    ║           • 33+ Curated Servers Across 17 Categories          ║
    ║           • Smart Auto-Discovery & Quality Filtering          ║
    ║           • Workflow Chain Optimization & Health Monitoring    ║
    ║                 🌐 logue.pro - Not built with demo               ║
    ║                                                                                  ║
    ║                                                                                  ║
    ╚══════════════════════════════════════════════════════════════════════════════════╝
        """

        # Add platform info
        platform_info = f"Platform: {self.platform_adapter.platform.upper()} | "
        platform_info += f"Output: {self.platform_adapter.compatibility_mode['output_format']} | "
        platform_info += f"Prefix: {self.platform_adapter.compatibility_mode['command_prefix']}"

        header = header.replace("    ║                 🌐 logue.pro - Not built with demo               ║",
                              f"    ║                 🌐 logue.pro - Not built with demo               ║\n    ║    {platform_info:^80}║")

        if self.console:
            self.console.print(header, style="cyan")
        else:
            print(self.platform_adapter.adapt_output(header, 'plain'))

    def check_dependencies(self):
        """Check and install required dependencies"""
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=self.console,
        ) as progress:
            task = progress.add_task("Checking dependencies...", total=None)

            # Check Rich library
            try:
                import rich
                progress.update(task, description="✅ Rich library available")
            except ImportError:
                progress.update(task, description="🔧 Installing Rich library...")
                subprocess.run([sys.executable, "-m", "pip", "install", "--user", "--break-system-packages", "rich"], check=True)
                progress.update(task, description="✅ Rich library installed")

            # Check MCP database
            if not self.database.exists():
                progress.update(task, description="📊 Building MCP database...")
                try:
                    subprocess.run([sys.executable, str(self.script_dir / "comprehensive-mcp-database.py")], check=True)
                    progress.update(task, description="✅ Database built successfully")
                except subprocess.CalledProcessError:
                    progress.update(task, description="⚠️  Database build failed, using built-in")

    def get_status_info(self):
        """Get current MCP installation status"""
        try:
            result = subprocess.run([
                sys.executable, "-c",
                f"""
import sys
sys.path.insert(0, '{self.script_dir}')
from mcp_tui_manager import MCPTUIManager

manager = MCPTUIManager()
total = len(manager.servers)
installed = len(manager.installed_servers)
rate = (installed / total * 100) if total > 0 else 0
print(f"{{total}},{{installed}},{{rate:.1f}}")
"""
            ], capture_output=True, text=True, check=True)

            total, installed, rate = result.stdout.strip().split(',')
            return int(total), int(installed), float(rate)
        except:
            return 33, 0, 0.0

    def show_main_menu(self):
        """Display the main menu with all options"""
        total, installed, rate = self.get_status_info()

        # Create menu table
        table = Table(title="📋 Prologue Command Menu", box=None, show_header=False)
        table.add_column("Num", style="cyan bold", width=4)
        table.add_column("Command", style="green bold", width=25)
        table.add_column("Description", style="white")

        menu_options = [
            ("1", "🚀 Launch TUI", "Full interactive terminal interface"),
            ("2", "⚡ Quick Install", "Auto-install top 8 quality servers"),
            ("3", "🧠 Smart Discovery", "Intelligent server selection based on use case"),
            ("4", "🔥 Power User Setup", "Install all high-agentic potential servers"),
            ("5", "📂 Category Install", "Browse and install by functional category"),
            ("6", "🔗 Workflow Builder", "Create optimized server chains and workflows"),
            ("7", "💊 Health Monitor", "Real-time server performance monitoring"),
            ("8", "📊 Installation Status", "View current installation statistics"),
            ("9", "📚 Browse All Servers", "Explore the complete MCP database"),
            ("10", "⚙️ Configuration Manager", "Manage MCP settings and preferences"),
            ("11", "📈 Installation Reports", "Generate detailed installation analytics"),
            ("12", "ℹ️ System Information", "Show version and database info"),
        ]

        for num, command, description in menu_options:
            table.add_row(num, command, description)

        self.console.print(table)

        # Show status bar
        status_text = f"📊 Database: {total} servers | ✅ Installed: {installed} | 📈 Coverage: {rate:.1f}%"
        self.console.print(Panel(status_text, title="Current Status", border_style="blue"))

    def execute_command(self, choice: str):
        """Execute the selected command"""
        commands = {
            "1": self.launch_tui,
            "2": self.quick_install,
            "3": self.smart_discovery,
            "4": self.power_user_setup,
            "5": self.category_install,
            "6": self.workflow_builder,
            "7": self.health_monitor,
            "8": self.show_status,
            "9": self.browse_servers,
            "10": self.config_manager,
            "11": self.installation_reports,
            "12": self.show_info,
        }

        if choice in commands:
            self.console.print(f"\n[bold green]Executing option {choice}...[/bold green]\n")
            commands[choice]()
        else:
            self.console.print("[bold red]Invalid choice! Please try again.[/bold red]")
            input("\nPress Enter to continue...")

    def launch_tui(self):
        """Launch the main TUI interface"""
        if self.mcp_manager.exists():
            subprocess.run([sys.executable, str(self.mcp_manager)])
        else:
            self.console.print("[bold red]MCP TUI Manager not found![/bold red]")

    def quick_install(self):
        """Quick install top servers"""
        try:
            result = subprocess.run([
                sys.executable, "-c",
                f"""
import sys
import asyncio
sys.path.insert(0, '{self.script_dir}')
from mcp_tui_manager import MCPTUIManager

async def quick_install():
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
        print(f'🚀 Installing {{len(selected)}} top servers...')
        await manager.install_servers(selected, 'Quick Install')
    else:
        print('✅ All top servers are already installed!')

asyncio.run(quick_install())
"""
            ], check=True)
        except subprocess.CalledProcessError as e:
            self.console.print(f"[bold red]Error during quick install: {e}[/bold red]")

    def smart_discovery(self):
        """Run smart auto-discovery"""
        try:
            result = subprocess.run([
                sys.executable, "-c",
                f"""
import sys
import asyncio
sys.path.insert(0, '{self.script_dir}')
from mcp_tui_manager import MCPTUIManager

async def smart_discovery():
    manager = MCPTUIManager()
    await manager.smart_core_discovery()

asyncio.run(smart_discovery())
"""
            ], check=True)
        except subprocess.CalledProcessError as e:
            self.console.print(f"[bold red]Error during smart discovery: {e}[/bold red]")

    def power_user_setup(self):
        """Power user setup"""
        try:
            result = subprocess.run([
                sys.executable, "-c",
                f"""
import sys
import asyncio
sys.path.insert(0, '{self.script_dir}')
from mcp_tui_manager import MCPTUIManager

async def power_user():
    manager = MCPTUIManager()
    await manager.power_user_discovery()

asyncio.run(power_user())
"""
            ], check=True)
        except subprocess.CalledProcessError as e:
            self.console.print(f"[bold red]Error during power user setup: {e}[/bold red]")

    def category_install(self):
        """Category-based installation"""
        try:
            result = subprocess.run([
                sys.executable, "-c",
                f"""
import sys
sys.path.insert(0, '{self.script_dir}')
from mcp_tui_manager import MCPTUIManager

manager = MCPTUIManager()
manager.category_installation()
"""
            ], check=True)
        except subprocess.CalledProcessError as e:
            self.console.print(f"[bold red]Error during category installation: {e}[/bold red]")

    def workflow_builder(self):
        """Workflow chain builder"""
        try:
            result = subprocess.run([
                sys.executable, "-c",
                f"""
import sys
sys.path.insert(0, '{self.script_dir}')
from mcp_tui_manager import MCPTUIManager

manager = MCPTUIManager()
manager.workflow_chain_builder()
"""
            ], check=True)
        except subprocess.CalledProcessError as e:
            self.console.print(f"[bold red]Error during workflow building: {e}[/bold red]")

    def health_monitor(self):
        """Start health monitoring"""
        try:
            self.console.print("💊 Starting Health Monitor...")
            self.console.print("Press Ctrl+C to stop monitoring\n")

            result = subprocess.run([
                sys.executable, "-c",
                f"""
import sys
import signal
sys.path.insert(0, '{self.script_dir}')
from mcp_tui_manager import MCPTUIManager

manager = MCPTUIManager()

def signal_handler(sig, frame):
    print('\\n🛑 Monitoring stopped')
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
manager.real_time_monitor()
"""
            ], check=False)
        except KeyboardInterrupt:
            self.console.print("\n🛑 Monitoring stopped by user")

    def show_status(self):
        """Show installation status"""
        total, installed, rate = self.get_status_info()

        status_table = Table(title="📊 MCP Installation Status", box=None)
        status_table.add_column("Metric", style="cyan bold")
        status_table.add_column("Value", style="green")

        status_table.add_row("Total Servers Available", str(total))
        status_table.add_row("Currently Installed", str(installed))
        status_table.add_row("Installation Coverage", f"{rate:.1f}%")
        status_table.add_row("Functional Categories", "17")

        self.console.print(status_table)

    def browse_servers(self):
        """Browse all servers"""
        try:
            result = subprocess.run([
                sys.executable, "-c",
                f"""
import sys
sys.path.insert(0, '{self.script_dir}')
from mcp_tui_manager import MCPTUIManager

manager = MCPTUIManager()
manager.browse_servers()
"""
            ], check=True)
        except subprocess.CalledProcessError as e:
            self.console.print(f"[bold red]Error browsing servers: {e}[/bold red]")

    def config_manager(self):
        """Configuration manager"""
        try:
            result = subprocess.run([
                sys.executable, "-c",
                f"""
import sys
sys.path.insert(0, '{self.script_dir}')
from mcp_tui_manager import MCPTUIManager

manager = MCPTUIManager()
manager.configuration_manager()
"""
            ], check=True)
        except subprocess.CalledProcessError as e:
            self.console.print(f"[bold red]Error in configuration manager: {e}[/bold red]")

    def installation_reports(self):
        """Installation reports"""
        try:
            result = subprocess.run([
                sys.executable, "-c",
                f"""
import sys
sys.path.insert(0, '{self.script_dir}')
from mcp_tui_manager import MCPTUIManager

manager = MCPTUIManager()
manager.installation_reports()
"""
            ], check=True)
        except subprocess.CalledProcessError as e:
            self.console.print(f"[bold red]Error generating reports: {e}[/bold red]")

    def show_info(self):
        """Show system information"""
        info_table = Table(title="ℹ️ System Information", box=None)
        info_table.add_column("Property", style="cyan bold")
        info_table.add_column("Value", style="green")

        info_table.add_row("MCP TUI Manager Version", "1.0.0")
        info_table.add_row("Database Servers", "33+ curated servers")
        info_table.add_row("Functional Categories", "17")
        info_table.add_row("Installation Path", str(self.script_dir))
        info_table.add_row("Script Location", str(self.mcp_manager))
        info_table.add_row("Database File", str(self.database))
        info_table.add_row("Python Version", f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")

        self.console.print(info_table)

    def run(self):
        """Main interface loop"""
        self.check_dependencies()

        while True:
            self.console.clear()
            self.show_header()
            self.show_main_menu()

            # Get user input
            choice = Prompt.ask(
                "\n[cyan bold]Select an option[/cyan bold] (1-12, or 'q' to quit)",
                choices=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "q"],
                default="1"
            )

            if choice.lower() == 'q':
                self.console.print("\n[bold green]👋 Thank you for using MCP TUI Manager![/bold green]")
                break

            self.execute_command(choice)

            # Ask if user wants to continue
            if not Confirm.ask("\n[cyan]Continue?[/cyan]", default=True):
                break

def main():
    """Main entry point"""
    # Handle command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] in ["--help", "-h", "help"]:
            print("""
🚀 Prologue - The Brilliant MCP Auto Setup System

Usage: python mcp-unified-interface.py [option]

Options:
  --help, -h    Show this help message
  --version     Show version information
  --install     Quick install top servers
  --smart       Smart auto-discovery
  --monitor     Start health monitoring
  --status      Check installation status

Without arguments, launches the interactive menu.
""")
            sys.exit(0)
        elif sys.argv[1] in ["--version", "-v"]:
            print("Prologue v1.0.0 - The Brilliant MCP Auto Setup System")
            sys.exit(0)
        elif sys.argv[1] in ["--install", "install"]:
            interface = PrologueInterface()
            interface.quick_install()
            sys.exit(0)
        elif sys.argv[1] in ["--smart", "smart"]:
            interface = PrologueInterface()
            interface.smart_discovery()
            sys.exit(0)
        elif sys.argv[1] in ["--monitor", "monitor"]:
            interface = PrologueInterface()
            interface.health_monitor()
            sys.exit(0)
        elif sys.argv[1] in ["--status", "status"]:
            interface = PrologueInterface()
            interface.show_status()
            sys.exit(0)

    # Launch the interface
    try:
        interface = PrologueInterface()
        interface.run()
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()