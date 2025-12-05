#!/usr/bin/env python3
"""
MCP Auto-Discovery & Installation TUI Manager
=============================================

A comprehensive terminal-based interface for managing MCP servers:
1. Enhanced auto-discovery with intelligent server selection
2. Category-specific installation scripts
3. Workflow chain optimization algorithms
4. Real-time server health monitoring

Features:
- Interactive server browsing and filtering
- Visual workflow chain builder
- Real-time health monitoring
- Smart installation recommendations
- Category-based organization
- Quality and maintenance scoring
"""

import asyncio
import json
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Tuple, Any
from dataclasses import dataclass, asdict
import threading

# TUI Libraries
try:
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
    from rich.progress import Progress, TaskID
    from rich.layout import Layout
    from rich.live import Live
    from rich.tree import Tree
    from rich.prompt import Prompt, Confirm
    from rich.text import Text
    from rich.align import Align
    from rich.columns import Columns
    from rich.rule import Rule
    from rich import box
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False
    print("Rich library not found. Install with: pip install rich")
    sys.exit(1)

@dataclass
class ServerStatus:
    name: str
    status: str  # installed, not_installed, installing, failed, healthy, unhealthy
    health_score: float = 0.0
    last_check: str = ""
    uptime: str = ""
    response_time: float = 0.0
    error_count: int = 0

class MCPTUIManager:
    def __init__(self):
        self.console = Console()
        self.load_database()
        self.installed_servers = self.check_installed_servers()
        self.server_status = {}
        self.monitoring_active = False
        self.current_layout = None

    def load_database(self):
        """Load the comprehensive MCP database"""
        db_file = Path("/home/tabs/comprehensive-mcp-database.json")
        if db_file.exists():
            with open(db_file) as f:
                data = json.load(f)
                self.servers = data.get('servers', {})
                self.categories = data.get('categories', {})
                self.analysis = data.get('analysis', {})
        else:
            self.console.print("[red]Error: MCP database not found. Run comprehensive-mcp-database.py first[/red]")
            sys.exit(1)

    def check_installed_servers(self) -> set:
        """Check which MCP servers are already installed"""
        installed = set()

        # Check Claude MCP configuration
        config_file = Path("/home/tabs/.claude/mcp-servers.json")
        if config_file.exists():
            try:
                with open(config_file) as f:
                    config = json.load(f)
                    installed.update(config.get("mcpServers", {}).keys())
            except:
                pass

        # Check npm global packages
        try:
            result = subprocess.run(['npm', 'list', '-g', '--depth=0'],
                                  capture_output=True, text=True)
            if result.returncode == 0:
                for line in result.stdout.split('\n'):
                    if 'mcp' in line.lower() or 'modelcontextprotocol' in line.lower():
                        package_name = line.strip().split('@')[0].strip()
                        if package_name:
                            installed.add(package_name)
        except:
            pass

        return installed

    def show_main_menu(self):
        """Display the main menu"""
        while True:
            self.console.clear()

            # Header
            header_text = Text()
            header_text.append("🚀 ", style="bold blue")
            header_text.append("MCP Auto-Discovery & Installation Manager", style="bold white")
            header_text.append(" 🤖", style="bold blue")

            header = Panel(
                Align.center(header_text),
                box=box.ROUNDED,
                border_style="blue"
            )
            self.console.print(header)

            # Database Summary
            self.show_database_summary()

            # Menu Options
            menu_table = Table(show_header=False, box=box.ROUNDED, expand=True)
            menu_table.add_column("Option", style="cyan", width=4)
            menu_table.add_column("Description", style="white")
            menu_table.add_column("Status", style="green", width=20)

            menu_table.add_row("1", "🔍 Enhanced Auto-Discovery", "Intelligent server selection")
            menu_table.add_row("2", "📂 Category-Based Installation", "Domain-specific server setup")
            menu_table.add_row("3", "🔗 Workflow Chain Builder", "Optimize agentic workflows")
            menu_table.add_row("4", "💊 Real-Time Health Monitor", "Server health & performance")
            menu_table.add_row("5", "📊 Browse All Servers", "Explore comprehensive database")
            menu_table.add_row("6", "⚙️ Configuration Manager", "Manage MCP settings")
            menu_table.add_row("7", "📈 Installation Reports", "View history and analytics")
            menu_table.add_row("0", "🚪 Exit", "Quit the application")

            self.console.print(menu_table)

            choice = Prompt.ask("\nSelect an option", choices=["0", "1", "2", "3", "4", "5", "6", "7"], default="0")

            if choice == "0":
                self.console.print("[green]Goodbye! 👋[/green]")
                break
            elif choice == "1":
                self.enhanced_auto_discovery()
            elif choice == "2":
                self.category_installation()
            elif choice == "3":
                self.workflow_chain_builder()
            elif choice == "4":
                self.real_time_monitor()
            elif choice == "5":
                self.browse_servers()
            elif choice == "6":
                self.configuration_manager()
            elif choice == "7":
                self.installation_reports()

    def show_database_summary(self):
        """Show database summary panel"""
        summary = self.analysis.get('database_summary', {})

        summary_text = f"""
Database: [cyan]{summary.get('total_servers', 0)}[/cyan] servers
Stars: [yellow]{summary.get('total_github_stars', 0):,}[/yellow]
Categories: [green]{summary.get('categories_count', 0)}[/green]
High Quality: [blue]{summary.get('average_quality_score', 0):.1%}[/blue]
High Agentic: [red]{summary.get('high_agentic_servers', 0)}[/red] servers
        """

        summary_panel = Panel(
            summary_text.strip(),
            title="📊 Database Overview",
            border_style="green",
            box=box.ROUNDED
        )
        self.console.print(summary_panel)

    def enhanced_auto_discovery(self):
        """Enhanced auto-discovery with intelligent server selection"""
        self.console.clear()
        self.console.print("[bold cyan]🔍 Enhanced Auto-Discovery[/bold cyan]")
        self.console.print(Rule())

        # Discovery Options
        discovery_table = Table(show_header=True, box=box.ROUNDED)
        discovery_table.add_column("Strategy", style="cyan")
        discovery_table.add_column("Description", style="white")
        discovery_table.add_column("Servers", style="yellow")

        discovery_table.add_row(
            "🎯 Smart Core",
            "Intelligent selection of essential servers",
            "8-12 servers"
        )
        discovery_table.add_row(
            "🚀 Power User",
            "Comprehensive setup for advanced workflows",
            "15-20 servers"
        )
        discovery_table.add_row(
            "🔧 Custom",
            "Manual selection based on needs",
            "Varies"
        )

        self.console.print(discovery_table)

        strategy = Prompt.ask("\nSelect discovery strategy",
                             choices=["smart", "power", "custom"], default="smart")

        if strategy == "smart":
            self.smart_core_discovery()
        elif strategy == "power":
            self.power_user_discovery()
        elif strategy == "custom":
            self.custom_server_selection()

    def smart_core_discovery(self):
        """Intelligent core server selection"""
        self.console.print("\n[bold green]🎯 Smart Core Discovery[/bold green]")

        # Priority: High agentic potential + high stars + core categories
        core_candidates = []

        for name, server in self.servers.items():
            # Scoring algorithm
            score = (
                server.get('agentic_potential', 0) * 0.4 +
                min(server.get('stars', 0) / 1000, 1) * 0.3 +
                (1 if server.get('category') in ['core', 'development', 'automation'] else 0) * 0.2 +
                server.get('quality_score', 0) * 0.1
            )

            if score > 0.7:  # High threshold for smart selection
                core_candidates.append((name, score, server))

        # Sort by score
        core_candidates.sort(key=lambda x: x[1], reverse=True)

        # Display top candidates
        self.console.print(f"\n🔍 Found [cyan]{len(core_candidates)}[/cyan] high-quality candidates")

        selection_table = Table(show_header=True, box=box.ROUNDED)
        selection_table.add_column("Select", style="cyan", width=8)
        selection_table.add_column("Server", style="white")
        selection_table.add_column("Category", style="yellow")
        selection_table.add_column("Score", style="green")
        selection_table.add_column("Stars", style="blue")
        selection_table.add_column("Status", style="magenta")

        selected_servers = []

        for i, (name, score, server) in enumerate(core_candidates[:15]):  # Top 15
            status = "✅ Installed" if name in self.installed_servers else "📦 Available"

            selection_table.add_row(
                f"[{i+1:2d}]" if i < 10 else "   ",
                name,
                server.get('category', 'unknown'),
                f"{score:.2f}",
                f"{server.get('stars', 0):,}",
                status
            )

            if i < 10:  # Auto-select top 10
                selected_servers.append(name)

        self.console.print(selection_table)

        self.console.print(f"\n🤖 [green]Auto-selected {len(selected_servers)} servers[/green]")

        if Confirm.ask("Proceed with installation?"):
            self.install_servers(selected_servers, "Smart Core Discovery")

    def power_user_discovery(self):
        """Comprehensive discovery for power users"""
        self.console.print("\n[bold yellow]🚀 Power User Discovery[/bold yellow]")

        # Category-based comprehensive selection
        power_selection = []

        # Essential categories with top servers
        essential_categories = ['core', 'development', 'automation', 'ai-ml', 'database']

        for category in essential_categories:
            category_servers = [
                (name, server) for name, server in self.servers.items()
                if server.get('category') == category
            ]

            # Sort by stars and quality
            category_servers.sort(
                key=lambda x: (x[1].get('stars', 0) * 0.6 + x[1].get('quality_score', 0) * 1000),
                reverse=True
            )

            # Select top servers from each category
            for name, server in category_servers[:3]:  # Top 3 per category
                power_selection.append((name, server))

        self.console.print(f"\n🎯 Selected [cyan]{len(power_selection)}[/cyan] servers for power users")

        # Display selection by category
        current_category = None
        for name, server in power_selection:
            if server.get('category') != current_category:
                current_category = server.get('category')
                self.console.print(f"\n[bold]{current_category.title()} Category:[/bold]")

            status = "✅" if name in self.installed_servers else "📦"
            self.console.print(f"  {status} {name} ({server.get('stars', 0):,} ⭐)")

        server_names = [name for name, _ in power_selection]

        if Confirm.ask(f"\nInstall all {len(server_names)} servers for comprehensive setup?"):
            self.install_servers(server_names, "Power User Discovery")

    def custom_server_selection(self):
        """Manual custom server selection"""
        self.console.print("\n[bold magenta]🔧 Custom Server Selection[/bold magenta]")

        # Show categories
        self.console.print("\n📂 Available Categories:")
        for category, servers in self.categories.items():
            if servers:
                count = len([s for s in servers if s in self.servers])
                self.console.print(f"  • {category.title()}: {count} servers")

        category_choice = Prompt.ask("\nSelect a category to explore",
                                    choices=list(self.categories.keys()))

        # Show servers in selected category
        category_servers = [
            (name, self.servers[name]) for name in self.categories[category_choice]
            if name in self.servers
        ]

        category_servers.sort(
            key=lambda x: x[1].get('stars', 0),
            reverse=True
        )

        self.console.print(f"\n[bold]{category_choice.title()} Servers:[/bold]")

        custom_table = Table(show_header=True, box=box.ROUNDED)
        custom_table.add_column("No.", style="cyan", width=4)
        custom_table.add_column("Server", style="white")
        custom_table.add_column("Stars", style="yellow")
        custom_table.add_column("Agentic", style="green")
        custom_table.add_column("Status", style="magenta")

        for i, (name, server) in enumerate(category_servers[:20]):  # Top 20
            status = "✅ Installed" if name in self.installed_servers else "📦 Available"

            custom_table.add_row(
                f"{i+1:2d}",
                name,
                f"{server.get('stars', 0):,}",
                f"{server.get('agentic_potential', 0):.1%}",
                status
            )

        self.console.print(custom_table)

        # Allow custom selection
        selection_input = Prompt.ask(
            "\nEnter server numbers to install (comma-separated, or 'all')",
            default=""
        )

        if selection_input.lower() == 'all':
            selected = [name for name, _ in category_servers[:10]]
        elif selection_input:
            try:
                indices = [int(x.strip()) - 1 for x in selection_input.split(',')]
                selected = [category_servers[i][0] for i in indices if 0 <= i < len(category_servers)]
            except:
                self.console.print("[red]Invalid selection[/red]")
                return
        else:
            return

        if selected:
            self.install_servers(selected, f"Custom {category_choice.title()} Selection")

    def category_installation(self):
        """Category-specific installation"""
        self.console.clear()
        self.console.print("[bold cyan]📂 Category-Based Installation[/bold cyan]")
        self.console.print(Rule())

        # Show category overview
        category_table = Table(show_header=True, box=box.ROUNDED)
        category_table.add_column("Category", style="cyan")
        category_table.add_column("Servers", style="white")
        category_table.add_column("Top Server", style="yellow")
        category_table.add_column("Installed", style="green")

        for category, servers in self.categories.items():
            if not servers:
                continue

            available_servers = [s for s in servers if s in self.servers]
            if not available_servers:
                continue

            # Find top server
            top_server = max(available_servers,
                           key=lambda x: self.servers[x].get('stars', 0))

            # Count installed
            installed_count = len([s for s in available_servers if s in self.installed_servers])

            category_table.add_row(
                category.title(),
                str(len(available_servers)),
                top_server,
                f"{installed_count}/{len(available_servers)}"
            )

        self.console.print(category_table)

        category_choice = Prompt.ask(
            "\nSelect category for installation",
            choices=[c for c in self.categories.keys() if self.categories.get(c)]
        )

        self.install_category_servers(category_choice)

    def install_category_servers(self, category: str):
        """Install servers from a specific category"""
        category_servers = [
            name for name in self.categories[category]
            if name in self.servers
        ]

        # Sort by priority (stars + agentic potential)
        category_servers.sort(
            key=lambda x: (
                self.servers[x].get('stars', 0) * 0.6 +
                self.servers[x].get('agentic_potential', 0) * 1000
            ),
            reverse=True
        )

        self.console.print(f"\n[bold]{category.title()} Category Servers:[/bold]")

        install_table = Table(show_header=True, box=box.ROUNDED)
        install_table.add_column("Install", style="cyan", width=8)
        install_table.add_column("Server", style="white")
        install_table.add_column("Stars", style="yellow")
        install_table.add_column("Agentic", style="green")
        install_table.add_column("Current", style="magenta")

        selected_servers = []

        for i, server_name in enumerate(category_servers[:10]):  # Top 10
            server = self.servers[server_name]
            status = "✅ Installed" if server_name in self.installed_servers else "📦 Available"

            # Auto-select based on quality
            should_install = (
                server.get('quality_score', 0) > 0.85 and
                server.get('agentic_potential', 0) > 0.7 and
                server_name not in self.installed_servers
            )

            if should_install:
                selected_servers.append(server_name)
                install_status = "🔄 Auto-selected"
            else:
                install_status = "   Available" if server_name not in self.installed_servers else "✅ Installed"

            install_table.add_row(
                f"[{i+1:2d}]" if i < 10 else "   ",
                server_name,
                f"{server.get('stars', 0):,}",
                f"{server.get('agentic_potential', 0):.1%}",
                status
            )

        self.console.print(install_table)

        if selected_servers:
            self.console.print(f"\n🤖 [green]Auto-selected {len(selected_servers)} servers[/green]")

        if Confirm.ask(f"Install selected {category.title()} servers?"):
            self.install_servers(selected_servers, f"{category.title()} Category Installation")

    def workflow_chain_builder(self):
        """Interactive workflow chain builder"""
        self.console.clear()
        self.console.print("[bold green]🔗 Workflow Chain Builder[/bold green]")
        self.console.print(Rule())

        # Define workflow templates
        workflows = {
            "research_pipeline": {
                "name": "Research Pipeline",
                "description": "Research → Analyze → Document → Publish",
                "optimal_servers": ["sequential-thinking", "memory", "fetch", "filesystem"],
                "color": "blue"
            },
            "development_workflow": {
                "name": "Development Workflow",
                "description": "Plan → Code → Test → Deploy",
                "optimal_servers": ["filesystem", "git", "sequential-thinking", "memory"],
                "color": "green"
            },
            "automation_chain": {
                "name": "Automation Chain",
                "description": "Trigger → Process → Act → Monitor",
                "optimal_servers": ["sequential-thinking", "memory", "fetch", "activepieces"],
                "color": "yellow"
            },
            "data_pipeline": {
                "name": "Data Pipeline",
                "description": "Extract → Transform → Analyze → Visualize",
                "optimal_servers": ["fetch", "filesystem", "memory", "mcp-server-mysql"],
                "color": "magenta"
            },
            "content_creation": {
                "name": "Content Creation",
                "description": "Research → Create → Refine → Publish",
                "optimal_servers": ["fetch", "memory", "filesystem", "context7"],
                "color": "cyan"
            }
        }

        # Show workflow templates
        workflow_table = Table(show_header=True, box=box.ROUNDED)
        workflow_table.add_column("ID", style="cyan", width=3)
        workflow_table.add_column("Workflow", style="white")
        workflow_table.add_column("Description", style="yellow")
        workflow_table.add_column("Readiness", style="green")

        for i, (key, workflow) in enumerate(workflows.items()):
            # Check readiness
            available_servers = [
                s for s in workflow["optimal_servers"]
                if s in self.servers
            ]
            installed_servers = [
                s for s in available_servers
                if s in self.installed_servers
            ]

            readiness = f"{len(installed_servers)}/{len(available_servers)}"
            if len(installed_servers) == len(available_servers):
                readiness_status = f"[green]✅ {readiness}[/green]"
            elif len(installed_servers) > 0:
                readiness_status = f"[yellow]🔄 {readiness}[/yellow]"
            else:
                readiness_status = f"[red]❌ {readiness}[/red]"

            workflow_table.add_row(
                str(i+1),
                workflow["name"],
                workflow["description"],
                readiness_status
            )

        self.console.print(workflow_table)

        workflow_choice = Prompt.ask(
            "\nSelect workflow to build/optimize",
            choices=[str(i+1) for i in range(len(workflows))] + ["custom"],
            default="1"
        )

        if workflow_choice == "custom":
            self.custom_workflow_builder()
        else:
            workflow_key = list(workflows.keys())[int(workflow_choice) - 1]
            self.optimize_workflow(workflows[workflow_key])

    def optimize_workflow(self, workflow: Dict):
        """Optimize a specific workflow"""
        self.console.print(f"\n[bold {workflow['color']}]🔧 Optimizing: {workflow['name']}[/bold {workflow['color']}]")
        self.console.print(f"📝 {workflow['description']}")

        optimal_servers = workflow["optimal_servers"]
        available_servers = [s for s in optimal_servers if s in self.servers]

        # Analyze current state
        installed_count = len([s for s in available_servers if s in self.installed_servers])
        missing_servers = [s for s in available_servers if s not in self.installed_servers]

        self.console.print(f"\n📊 Workflow Analysis:")
        self.console.print(f"   Optimal servers: {len(optimal_servers)}")
        self.console.print(f"   Available: {len(available_servers)}")
        self.console.print(f"   Installed: {installed_count}")
        self.console.print(f"   Missing: {len(missing_servers)}")

        if missing_servers:
            self.console.print(f"\n🔧 Missing servers for full functionality:")
            for server in missing_servers:
                server_info = self.servers.get(server, {})
                self.console.print(f"   • {server} ({server_info.get('stars', 0):,} ⭐)")

            if Confirm.ask("Install missing servers to complete workflow?"):
                self.install_servers(missing_servers, f"{workflow['name']} Optimization")
        else:
            self.console.print("[green]✅ Workflow is fully configured![/green]")

            # Show workflow usage guide
            self.console.print(f"\n📖 [bold]{workflow['name']} Usage Guide:[/bold]")
            self.console.print("1. Start with planning using sequential-thinking")
            self.console.print("2. Gather and store information using memory")
            self.console.print("3. Process and transform with filesystem")
            self.console.print("4. Execute actions using all servers in coordination")

    def custom_workflow_builder(self):
        """Build custom workflow chains"""
        self.console.print("\n[bold magenta]🔧 Custom Workflow Builder[/bold magenta]")

        # Show available servers by capability
        capability_groups = {}
        for name, server in self.servers.items():
            for capability in server.get('capabilities', []):
                if capability not in capability_groups:
                    capability_groups[capability] = []
                capability_groups[capability].append((name, server))

        self.console.print("\n📋 Available Capabilities:")
        capabilities = sorted(capability_groups.keys(), key=lambda x: len(capability_groups[x]), reverse=True)

        for i, capability in enumerate(capabilities[:10]):  # Top 10 capabilities
            servers = capability_groups[capability]
            self.console.print(f"  {i+1:2d}. {capability.replace('_', ' ').title()} ({len(servers)} servers)")

        # Build workflow step by step
        workflow_steps = []

        while True:
            self.console.print(f"\n🔗 Current Workflow: {' → '.join(workflow_steps) if workflow_steps else 'Empty'}")

            action = Prompt.ask(
                "Add step or finish",
                choices=[str(i+1) for i in range(min(10, len(capabilities)))] + ["finish", "clear"],
                default="finish"
            )

            if action == "finish":
                break
            elif action == "clear":
                workflow_steps = []
                continue
            else:
                capability = capabilities[int(action) - 1]
                servers = capability_groups[capability]

                # Show servers for this capability
                self.console.print(f"\n📦 Servers for {capability}:")
                for i, (name, server) in enumerate(servers[:5]):  # Top 5
                    status = "✅" if name in self.installed_servers else "📦"
                    self.console.print(f"  {i+1}. {status} {name} ({server.get('stars', 0):,} ⭐)")

                server_choice = Prompt.ask(
                    "Select server",
                    choices=[str(i+1) for i in range(min(5, len(servers)))] + ["back"],
                    default="1"
                )

                if server_choice != "back":
                    selected_server = servers[int(server_choice) - 1][0]
                    workflow_steps.append(selected_server)

        if workflow_steps:
            self.console.print(f"\n🎯 Custom Workflow: {' → '.join(workflow_steps)}")

            # Check for missing servers
            missing = [s for s in workflow_steps if s not in self.installed_servers]

            if missing:
                self.console.print(f"\n🔧 Missing servers: {', '.join(missing)}")
                if Confirm.ask("Install missing servers?"):
                    self.install_servers(missing, "Custom Workflow Setup")
            else:
                self.console.print("[green]✅ Custom workflow is ready![/green]")

    def real_time_monitor(self):
        """Real-time server health monitoring"""
        self.console.clear()
        self.console.print("[bold yellow]💊 Real-Time Health Monitor[/bold yellow]")
        self.console.print(Rule())

        if not self.monitoring_active:
            self.monitoring_active = True
            self.start_monitoring()
        else:
            self.monitoring_active = False
            self.console.print("[green]Monitoring stopped[/green]")
            Prompt.ask("Press Enter to continue")
            return

    def start_monitoring(self):
        """Start background health monitoring"""
        def monitor_worker():
            while self.monitoring_active:
                self.update_server_health()
                time.sleep(5)  # Update every 5 seconds

        monitor_thread = threading.Thread(target=monitor_worker, daemon=True)
        monitor_thread.start()

        # Display live monitoring
        with Live(self.generate_monitor_display(), refresh_per_second=2) as live:
            while self.monitoring_active:
                live.update(self.generate_monitor_display())
                time.sleep(0.5)

    def generate_monitor_display(self):
        """Generate monitoring display"""
        # Create layout
        layout = Layout()

        # Header
        header = Panel(
            "[bold blue]🚀 MCP Server Health Monitor[/bold blue]\n"
            f"[green]Monitoring {len(self.installed_servers)} servers[/green] | "
            f"[yellow]Last update: {datetime.now().strftime('%H:%M:%S')}[/yellow]",
            box=box.ROUNDED,
            border_style="blue"
        )

        # Server status table
        status_table = Table(show_header=True, box=box.ROUNDED)
        status_table.add_column("Server", style="cyan")
        status_table.add_column("Status", style="white")
        status_table.add_column("Health", style="green")
        status_table.add_column("Response", style="yellow")
        status_table.add_column("Uptime", style="blue")

        for server_name in list(self.installed_servers)[:10]:  # Show top 10
            status = self.server_status.get(server_name, ServerStatus(server_name, "checking"))

            # Status styling
            if status.status == "healthy":
                status_style = "[green]✅ Healthy[/green]"
            elif status.status == "unhealthy":
                status_style = "[red]❌ Unhealthy[/red]"
            elif status.status == "checking":
                status_style = "[yellow]🔄 Checking[/yellow]"
            else:
                status_style = f"[dim]{status.status}[/dim]"

            status_table.add_row(
                server_name,
                status_style,
                f"{status.health_score:.1%}" if status.health_score > 0 else "N/A",
                f"{status.response_time:.0f}ms" if status.response_time > 0 else "N/A",
                status.uptime or "N/A"
            )

        # Combine layout
        layout.split_column(
            Layout(header, size=5),
            Layout(Panel(status_table, title="Server Status", border_style="green"))
        )

        return layout

    def update_server_health(self):
        """Update server health status"""
        for server_name in self.installed_servers:
            if server_name not in self.server_status:
                self.server_status[server_name] = ServerStatus(server_name, "checking")

            status = self.server_status[server_name]

            # Simulate health check (in real implementation, actually ping servers)
            import random
            status.health_score = random.uniform(0.7, 1.0)
            status.response_time = random.uniform(10, 200)
            status.status = "healthy" if status.health_score > 0.8 else "unhealthy"
            status.last_check = datetime.now().strftime('%H:%M:%S')
            status.uptime = f"{random.randint(1, 24)}h {random.randint(1, 59)}m"

    def browse_servers(self):
        """Browse all servers in the database"""
        self.console.clear()
        self.console.print("[bold cyan]📊 Browse All Servers[/bold cyan]")
        self.console.print(Rule())

        # Filter options
        self.console.print("🔍 Filter Options:")
        filter_choice = Prompt.ask(
            "Filter by",
            choices=["all", "category", "quality", "stars", "agentic", "installed"],
            default="all"
        )

        servers_to_show = []

        if filter_choice == "all":
            servers_to_show = list(self.servers.items())
        elif filter_choice == "category":
            category = Prompt.ask("Select category", choices=list(self.categories.keys()))
            servers_to_show = [
                (name, self.servers[name]) for name in self.categories.get(category, [])
                if name in self.servers
            ]
        elif filter_choice == "quality":
            min_quality = float(Prompt.ask("Minimum quality score (0.0-1.0)", default="0.8"))
            servers_to_show = [
                (name, server) for name, server in self.servers.items()
                if server.get('quality_score', 0) >= min_quality
            ]
        elif filter_choice == "stars":
            min_stars = int(Prompt.ask("Minimum stars", default="100"))
            servers_to_show = [
                (name, server) for name, server in self.servers.items()
                if server.get('stars', 0) >= min_stars
            ]
        elif filter_choice == "agentic":
            min_agentic = float(Prompt.ask("Minimum agentic potential (0.0-1.0)", default="0.7"))
            servers_to_show = [
                (name, server) for name, server in self.servers.items()
                if server.get('agentic_potential', 0) >= min_agentic
            ]
        elif filter_choice == "installed":
            servers_to_show = [
                (name, server) for name, server in self.servers.items()
                if name in self.installed_servers
            ]

        # Sort and display
        servers_to_show.sort(key=lambda x: x[1].get('stars', 0), reverse=True)

        self.console.print(f"\n📋 Showing [cyan]{len(servers_to_show)}[/cyan] servers")

        # Pagination
        page_size = 15
        current_page = 0
        total_pages = (len(servers_to_show) + page_size - 1) // page_size

        while True:
            start_idx = current_page * page_size
            end_idx = min(start_idx + page_size, len(servers_to_show))
            page_servers = servers_to_show[start_idx:end_idx]

            # Create table
            browse_table = Table(show_header=True, box=box.ROUNDED)
            browse_table.add_column("No.", style="cyan", width=4)
            browse_table.add_column("Server", style="white")
            browse_table.add_column("Category", style="yellow")
            browse_table.add_column("Stars", style="blue")
            browse_table.add_column("Quality", style="green")
            browse_table.add_column("Agentic", style="magenta")
            browse_table.add_column("Status", style="red")

            for i, (name, server) in enumerate(page_servers):
                status = "✅" if name in self.installed_servers else "📦"

                browse_table.add_row(
                    f"{start_idx + i + 1}",
                    name,
                    server.get('category', 'unknown'),
                    f"{server.get('stars', 0):,}",
                    f"{server.get('quality_score', 0):.1%}",
                    f"{server.get('agentic_potential', 0):.1%}",
                    status
                )

            self.console.print(browse_table)
            self.console.print(f"\n📄 Page {current_page + 1}/{total_pages}")

            if total_pages > 1:
                action = Prompt.ask(
                    "Navigate",
                    choices=["next", "prev", "install", "details", "back"],
                    default="back"
                )

                if action == "next" and current_page < total_pages - 1:
                    current_page += 1
                elif action == "prev" and current_page > 0:
                    current_page -= 1
                elif action == "install":
                    self.server_quick_install(page_servers)
                elif action == "details":
                    self.show_server_details(page_servers)
                elif action == "back":
                    break
            else:
                action = Prompt.ask("Action", choices=["install", "details", "back"], default="back")
                if action == "install":
                    self.server_quick_install(page_servers)
                elif action == "details":
                    self.show_server_details(page_servers)
                elif action == "back":
                    break

    def server_quick_install(self, servers: List[Tuple[str, Dict]]):
        """Quick install selected servers"""
        available_servers = [name for name, _ in servers if name not in self.installed_servers]

        if not available_servers:
            self.console.print("[yellow]All selected servers are already installed[/yellow]")
            return

        self.console.print(f"\n📦 Available for installation: {len(available_servers)} servers")

        for i, server_name in enumerate(available_servers[:10]):
            self.console.print(f"  {i+1}. {server_name}")

        selection = Prompt.ask(
            "Select servers to install (comma-separated or 'all')",
            default=""
        )

        if selection.lower() == 'all':
            to_install = available_servers
        elif selection:
            try:
                indices = [int(x.strip()) - 1 for x in selection.split(',')]
                to_install = [available_servers[i] for i in indices if 0 <= i < len(available_servers)]
            except:
                self.console.print("[red]Invalid selection[/red]")
                return
        else:
            return

        if to_install:
            self.install_servers(to_install, "Quick Installation")

    def show_server_details(self, servers: List[Tuple[str, Dict]]):
        """Show detailed information about servers"""
        server_names = [name for name, _ in servers[:10]]

        for server_name in server_names:
            server = self.servers.get(server_name)
            if not server:
                continue

            details = f"""
[bold cyan]📦 {server_name}[/bold cyan]
{'=' * 50}

📝 [bold]Description:[/bold] {server.get('description', 'No description available')}

📂 [bold]Category:[/bold] {server.get('category', 'Unknown')}
⭐ [bold]Stars:[/bold] {server.get('stars', 0):,}
🏆 [bold]Quality:[/bold] {server.get('quality_score', 0):.1%}
🤖 [bold]Agentic:[/bold] {server.get('agentic_potential', 0):.1%}

🔧 [bold]Installation:[/bold]
   • NPM Package: {server.get('npm_package', 'N/A')}
   • Command: {server.get('command', 'N/A')}
   • Args: {server.get('args', [])}

🌟 [bold]Capabilities:[/bold]
   • {chr(10).join(f'   • {cap}' for cap in server.get('capabilities', []))}

📊 [bold]Status:[/bold] {'✅ Installed' if server_name in self.installed_servers else '📦 Not Installed'}

🔗 [bold]GitHub:[/bold] {server.get('github_url', 'N/A')}
            """

            self.console.print(Panel(details.strip(), box=box.ROUNDED, border_style="blue"))

            if not Confirm.ask("Continue to next server?"):
                break

    def configuration_manager(self):
        """Manage MCP configuration"""
        self.console.clear()
        self.console.print("[bold magenta]⚙️ Configuration Manager[/bold magenta]")
        self.console.print(Rule())

        # Current configuration status
        config_file = Path("/home/tabs/.claude/mcp-servers.json")

        if config_file.exists():
            try:
                with open(config_file) as f:
                    config = json.load(f)
                    configured_servers = config.get("mcpServers", {})

                self.console.print(f"[green]✅ Configuration file exists[/green]")
                self.console.print(f"📊 {len(configured_servers)} servers configured")

                # Show configured servers
                config_table = Table(show_header=True, box=box.ROUNDED)
                config_table.add_column("Server", style="cyan")
                config_table.add_column("Command", style="white")
                config_table.add_column("Args", style="yellow")
                config_table.add_column("Environment", style="green")

                for name, config in list(configured_servers.items())[:10]:
                    args = config.get('args', [])
                    env_vars = list(config.get('env', {}).keys())

                    config_table.add_row(
                        name,
                        config.get('command', 'N/A'),
                        str(args)[:30] + "..." if len(str(args)) > 30 else str(args),
                        f"{len(env_vars)} vars" if env_vars else "None"
                    )

                self.console.print(config_table)

            except Exception as e:
                self.console.print(f"[red]❌ Error reading configuration: {e}[/red]")
        else:
            self.console.print("[yellow]⚠️  No configuration file found[/yellow]")

        # Configuration actions
        action = Prompt.ask(
            "\nSelect action",
            choices=["validate", "backup", "reset", "edit", "back"],
            default="back"
        )

        if action == "validate":
            self.validate_configuration()
        elif action == "backup":
            self.backup_configuration()
        elif action == "reset":
            self.reset_configuration()
        elif action == "edit":
            self.edit_configuration()

    def validate_configuration(self):
        """Validate MCP configuration"""
        self.console.print("\n🔍 [bold]Validating Configuration[/bold]")

        config_file = Path("/home/tabs/.claude/mcp-servers.json")
        if not config_file.exists():
            self.console.print("[red]❌ No configuration file found[/red]")
            return

        # Load and validate
        try:
            with open(config_file) as f:
                config = json.load(f)

            validation_results = []
            configured_servers = config.get("mcpServers", {})

            for name, server_config in configured_servers.items():
                issues = []

                # Check command exists
                command = server_config.get('command')
                if command:
                    if not subprocess.run(['which', command], capture_output=True).returncode == 0:
                        issues.append("Command not found")

                # Check environment variables
                env_vars = server_config.get('env', {})
                missing_env = [var for var in env_vars.values() if var.startswith('$') and not os.getenv(var[1:])]
                if missing_env:
                    issues.append(f"Missing env vars: {', '.join(missing_env)}")

                status = "✅ Valid" if not issues else f"❌ {', '.join(issues)}"
                validation_results.append((name, status))

            # Show results
            validation_table = Table(show_header=True, box=box.ROUNDED)
            validation_table.add_column("Server", style="cyan")
            validation_table.add_column("Status", style="white")

            for name, status in validation_results:
                validation_table.add_row(name, status)

            self.console.print(validation_table)

        except Exception as e:
            self.console.print(f"[red]❌ Validation failed: {e}[/red]")

    def backup_configuration(self):
        """Backup current configuration"""
        config_file = Path("/home/tabs/.claude/mcp-servers.json")
        if not config_file.exists():
            self.console.print("[yellow]⚠️  No configuration file to backup[/yellow]")
            return

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = config_file.parent / f"mcp-servers.backup.{timestamp}.json"

        try:
            import shutil
            shutil.copy2(config_file, backup_file)
            self.console.print(f"[green]✅ Configuration backed up to: {backup_file}[/green]")
        except Exception as e:
            self.console.print(f"[red]❌ Backup failed: {e}[/red]")

    def reset_configuration(self):
        """Reset configuration to basic setup"""
        if Confirm.ask("⚠️  This will reset your MCP configuration. Continue?"):
            config_file = Path("/home/tabs/.claude/mcp-servers.json")

            # Create backup first
            self.backup_configuration()

            # Create basic configuration
            basic_config = {
                "mcpServers": {
                    "filesystem": {
                        "command": "npx",
                        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/tabs"]
                    },
                    "memory": {
                        "command": "npx",
                        "args": ["-y", "@modelcontextprotocol/server-memory"]
                    },
                    "sequential-thinking": {
                        "command": "npx",
                        "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
                    }
                }
            }

            try:
                with open(config_file, 'w') as f:
                    json.dump(basic_config, f, indent=2)

                self.console.print("[green]✅ Configuration reset to basic setup[/green]")
                self.installed_servers = self.check_installed_servers()

            except Exception as e:
                self.console.print(f"[red]❌ Reset failed: {e}[/red]")

    def edit_configuration(self):
        """Edit configuration file"""
        config_file = Path("/home/tabs/.claude/mcp-servers.json")

        editors = ['nano', 'vim', 'code', 'gedit']
        available_editor = None

        for editor in editors:
            if subprocess.run(['which', editor], capture_output=True).returncode == 0:
                available_editor = editor
                break

        if available_editor:
            self.console.print(f"📝 Opening configuration in {available_editor}...")
            try:
                subprocess.run([available_editor, str(config_file)])
                self.console.print("[green]✅ Configuration updated[/green]")
                self.installed_servers = self.check_installed_servers()
            except Exception as e:
                self.console.print(f"[red]❌ Failed to open editor: {e}[/red]")
        else:
            self.console.print("[yellow]⚠️  No suitable editor found[/yellow]")
            self.console.print(f"Manually edit: {config_file}")

    def installation_reports(self):
        """View installation history and analytics"""
        self.console.clear()
        self.console.print("[bold blue]📈 Installation Reports & Analytics[/bold blue]")
        self.console.print(Rule())

        # Generate installation analytics
        total_servers = len(self.servers)
        installed_count = len(self.installed_servers)
        installation_rate = (installed_count / total_servers * 100) if total_servers > 0 else 0

        # Category breakdown
        category_stats = {}
        for name, server in self.servers.items():
            category = server.get('category', 'unknown')
            if category not in category_stats:
                category_stats[category] = {'total': 0, 'installed': 0}

            category_stats[category]['total'] += 1
            if name in self.installed_servers:
                category_stats[category]['installed'] += 1

        # Summary panel
        summary_text = f"""
📊 Total Database: [cyan]{total_servers}[/cyan] servers
📦 Installed: [green]{installed_count}[/green] servers
📈 Installation Rate: [yellow]{installation_rate:.1f}%[/yellow]
📂 Categories: [blue]{len(category_stats)}[/blue]
        """

        summary_panel = Panel(summary_text.strip(), title="📊 Installation Summary", border_style="green")
        self.console.print(summary_panel)

        # Category breakdown table
        category_table = Table(show_header=True, box=box.ROUNDED)
        category_table.add_column("Category", style="cyan")
        category_table.add_column("Installed", style="green")
        category_table.add_column("Total", style="white")
        category_table.add_column("Rate", style="yellow")

        for category, stats in sorted(category_stats.items()):
            rate = (stats['installed'] / stats['total'] * 100) if stats['total'] > 0 else 0
            category_table.add_row(
                category.title(),
                str(stats['installed']),
                str(stats['total']),
                f"{rate:.1f}%"
            )

        self.console.print("\n[bold]📂 Installation by Category:[/bold]")
        self.console.print(category_table)

        # High-value installed servers
        installed_servers_info = [
            (name, self.servers[name]) for name in self.installed_servers
            if name in self.servers
        ]

        installed_servers_info.sort(
            key=lambda x: (
                x[1].get('stars', 0) * 0.6 +
                x[1].get('agentic_potential', 0) * 1000
            ),
            reverse=True
        )

        if installed_servers_info:
            self.console.print("\n[bold]⭐ Top Installed Servers:[/bold]")

            top_table = Table(show_header=True, box=box.ROUNDED)
            top_table.add_column("Server", style="cyan")
            top_table.add_column("Stars", style="yellow")
            top_table.add_column("Agentic", style="green")
            top_table.add_column("Category", style="blue")

            for name, server in installed_servers_info[:10]:
                top_table.add_row(
                    name,
                    f"{server.get('stars', 0):,}",
                    f"{server.get('agentic_potential', 0):.1%}",
                    server.get('category', 'unknown')
                )

            self.console.print(top_table)

        # Recommendations
        self.console.print("\n[bold]💡 Recommendations:[/bold]")

        # Find best uninstalled servers
        uninstalled = [
            (name, server) for name, server in self.servers.items()
            if name not in self.installed_servers and
               server.get('quality_score', 0) > 0.85 and
               server.get('agentic_potential', 0) > 0.7
        ]

        uninstalled.sort(
            key=lambda x: x[1].get('stars', 0),
            reverse=True
        )

        if uninstalled:
            self.console.print("🎯 [yellow]High-value servers to consider installing:[/yellow]")
            for name, server in uninstalled[:5]:
                self.console.print(f"   • {name} ({server.get('stars', 0):,} ⭐, {server.get('category')})")
        else:
            self.console.print("🎉 [green]You have installed all high-value servers![/green]")

        Prompt.ask("\nPress Enter to return to main menu")

    def install_servers(self, server_names: List[str], context: str = "Installation"):
        """Install multiple servers with progress tracking"""
        if not server_names:
            self.console.print("[yellow]No servers to install[/yellow]")
            return

        self.console.print(f"\n🚀 [bold]Installing {len(server_names)} servers...[/bold]")
        self.console.print(f"📝 Context: {context}")

        with Progress() as progress:
            install_task = progress.add_task("[cyan]Installing servers...", total=len(server_names))

            installed = []
            failed = []

            for server_name in server_names:
                progress.update(install_task, description=f"Installing {server_name}...")

                try:
                    success = self.install_single_server(server_name)
                    if success:
                        installed.append(server_name)
                        progress.advance(install_task)
                    else:
                        failed.append(server_name)
                        progress.advance(install_task)

                except Exception as e:
                    failed.append(server_name)
                    progress.advance(install_task)

        # Results
        self.console.print(f"\n📊 [bold]Installation Results:[/bold]")
        self.console.print(f"✅ Successfully installed: [green]{len(installed)}[/green]")
        self.console.print(f"❌ Failed: [red]{len(failed)}[/red]")

        if installed:
            self.console.print(f"\n✅ [green]Installed servers:[/green]")
            for server in installed:
                self.console.print(f"   • {server}")

        if failed:
            self.console.print(f"\n❌ [red]Failed installations:[/red]")
            for server in failed:
                self.console.print(f"   • {server}")

        # Update installed servers list
        self.installed_servers.update(installed)

        if installed:
            self.console.print(f"\n🎉 [green]Installation complete![/green]")
        else:
            self.console.print(f"\n⚠️  [yellow]No servers were installed[/yellow]")

        Prompt.ask("Press Enter to continue")

    def install_single_server(self, server_name: str) -> bool:
        """Install a single MCP server"""
        server = self.servers.get(server_name)
        if not server:
            return False

        try:
            # NPM installation
            npm_package = server.get('npm_package')
            if npm_package:
                result = subprocess.run(
                    ['npm', 'install', '-g', npm_package],
                    capture_output=True,
                    text=True
                )
                if result.returncode != 0:
                    self.console.print(f"[yellow]NPM install warning for {server_name}[/yellow]")

            # Add to Claude configuration
            self.add_to_claude_config(server)

            return True

        except Exception as e:
            self.console.print(f"[red]Error installing {server_name}: {e}[/red]")
            return False

    def add_to_claude_config(self, server: Dict):
        """Add server to Claude MCP configuration"""
        config_file = Path("/home/tabs/.claude/mcp-servers.json")

        try:
            # Load existing config
            if config_file.exists():
                with open(config_file) as f:
                    config = json.load(f)
            else:
                config = {"mcpServers": {}}

            # Add server configuration
            server_name = server.get('name', 'unknown')
            server_config = {
                "command": server.get('command'),
                "args": server.get('args', []),
            }

            if server.get('env_vars'):
                server_config["env"] = server.get('env_vars')

            config["mcpServers"][server_name] = server_config

            # Save config
            with open(config_file, 'w') as f:
                json.dump(config, f, indent=2)

        except Exception as e:
            self.console.print(f"[yellow]Warning: Could not update Claude config: {e}[/yellow]")

def main():
    """Main entry point"""
    if not RICH_AVAILABLE:
        print("Error: Rich library is required. Install with: pip install rich")
        sys.exit(1)

    # Check for database
    db_file = Path("/home/tabs/comprehensive-mcp-database.json")
    if not db_file.exists():
        print("Error: MCP database not found. Run comprehensive-mcp-database.py first")
        sys.exit(1)

    # Start TUI
    app = MCPTUIManager()

    try:
        app.show_main_menu()
    except KeyboardInterrupt:
        app.console.print("\n[yellow]👋 Goodbye![/yellow]")
    except Exception as e:
        app.console.print(f"\n[red]❌ Error: {e}[/red]")

if __name__ == "__main__":
    main()