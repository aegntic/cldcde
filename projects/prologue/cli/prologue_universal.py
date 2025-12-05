#!/usr/bin/env python3
"""
Prologue Universal Wrapper
Makes Prologue compatible with all AI platforms through unified interface
"""

import os
import sys
import subprocess
import json
from pathlib import Path

# Add CLI directory to path
cli_dir = Path(__file__).parent
sys.path.insert(0, str(cli_dir))

from platform_adapter import PlatformAdapter

def detect_ai_platform():
    """Enhanced platform detection"""
    platform_indicators = {
        'claude_code': ['CLAUDE_CODE', 'claude'],
        'auggie': ['AUGGIE', 'auggie'],
        'gemini': ['GEMINI', 'gemini', 'google'],
        'codex': ['OPENAI', 'codex', 'openai'],
        'opencode': ['OPENCODE', 'opencode'],
        'tunacode': ['TUNACODE', 'tunacode'],
        'cursor': ['CURSOR', 'cursor'],
        'continue': ['CONTINUE', 'continue'],
        'copilot': ['COPILOT', 'copilot', 'github'],
        'vscode': ['VSCODE', 'code', 'vscode']
    }

    # Check environment variables
    env = os.environ
    for platform, indicators in platform_indicators.items():
        for indicator in indicators:
            if any(indicator.lower() in key.lower() for key in env.keys()):
                return platform
            if any(indicator.lower() in value.lower() for value in env.values()):
                return platform

    # Check executable name
    exec_name = os.path.basename(sys.executable).lower()
    for platform, indicators in platform_indicators.items():
        if any(indicator in exec_name for indicator in indicators):
            return platform

    # Check process name
    try:
        import psutil
        current_process = psutil.Process()
        process_name = current_process.name().lower()
        for platform, indicators in platform_indicators.items():
            if any(indicator in process_name for indicator in indicators):
                return platform
    except:
        pass

    # Check parent process
    try:
        parent_process = psutil.Process().parent()
        if parent_process:
            parent_name = parent_process.name().lower()
            for platform, indicators in platform_indicators.items():
                if any(indicator in parent_name for indicator in indicators):
                    return platform
    except:
        pass

    return 'universal'

def create_platform_commands():
    """Generate platform-specific command help"""
    commands = {}
    platforms = {
        'claude_code': {'prefix': '/', 'example': '/prologue'},
        'auggie': {'prefix': '!', 'example': '!prologue'},
        'tunacode': {'prefix': '@', 'example': '@prologue'},
        'gemini': {'prefix': '/', 'example': '/prologue'},
        'codex': {'prefix': '/', 'example': '/prologue'},
        'opencode': {'prefix': '/', 'example': '/prologue'},
        'cursor': {'prefix': '/', 'example': '/prologue'},
        'continue': {'prefix': '/', 'example': '/prologue'},
        'copilot': {'prefix': '/', 'example': '/prologue'},
        'universal': {'prefix': '/', 'example': '/prologue'}
    }

    for platform, config in platforms.items():
        commands[platform] = f"""
{config['example']}                - Launch Prologue interactive menu
{config['example']} install        - Quick install top MCP servers
{config['example']} smart          - Smart auto-discovery
{config['example']} monitor        - Start health monitoring
{config['example']} status         - Check installation status
{config['example']} help           - Show platform-specific help
"""

    return commands

def install_platform_dependencies():
    """Install platform-specific dependencies"""
    dependencies = {
        'rich': {
            'required_for': ['claude_code', 'opencode', 'universal'],
            'install_cmd': [sys.executable, "-m", "pip", "install", "--user", "rich"]
        },
        'psutil': {
            'required_for': ['universal'],
            'install_cmd': [sys.executable, "-m", "pip", "install", "--user", "psutil"]
        }
    }

    for dep, config in dependencies.items():
        try:
            __import__(dep)
        except ImportError:
            try:
                print(f"Installing {dep} for platform compatibility...")
                subprocess.run(config['install_cmd'], check=True, capture_output=True)
                print(f"✅ {dep} installed successfully")
            except subprocess.CalledProcessError:
                print(f"⚠️  Could not install {dep}, some features may be limited")

def generate_platform_config():
    """Generate platform-specific configuration"""
    detected = detect_ai_platform()
    adapter = PlatformAdapter()

    config = {
        'detected_platform': detected,
        'adapter_platform': adapter.platform,
        'compatibility_mode': adapter.compatibility_mode,
        'supports_rich': adapter.compatibility_mode['supports_rich'],
        'supports_interactive': adapter.compatibility_mode['supports_interactive'],
        'command_prefix': adapter.compatibility_mode['command_prefix'],
        'output_format': adapter.compatibility_mode['output_format'],
        'max_output_length': adapter.compatibility_mode['max_output_length'],
        'supports_background': adapter.compatibility_mode['supports_background']
    }

    # Save config for reference
    config_file = cli_dir / "platform_config.json"
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)

    return config

def show_platform_compatibility():
    """Display platform compatibility information"""
    print("🚀 Prologue - Platform Compatibility Check")
    print("=" * 50)

    detected = detect_ai_platform()
    adapter = PlatformAdapter()
    commands = create_platform_commands()

    print(f"🔍 Detected Platform: {detected.upper()}")
    print(f"🔧 Adapter Platform: {adapter.platform.upper()}")
    print(f"📱 Output Format: {adapter.compatibility_mode['output_format']}")
    print(f"🎨 Rich Support: {'Yes' if adapter.compatibility_mode['supports_rich'] else 'No'}")
    print(f"🎮 Interactive Mode: {'Yes' if adapter.compatibility_mode['supports_interactive'] else 'No'}")
    print(f"⚡ Command Prefix: {adapter.compatibility_mode['command_prefix']}")

    print(f"\n📋 Available Commands:")
    print(commands.get(adapter.platform, commands['universal']))

    print(f"\n🌐 Platform Support:")
    supported_platforms = [
        "✅ Claude Code (Primary)",
        "✅ Auggie AI (!prefix)",
        "✅ Gemini AI",
        "✅ OpenAI Codex",
        "✅ OpenCode",
        "✅ TunaCode (@prefix)",
        "✅ Cursor",
        "✅ Continue",
        "✅ GitHub Copilot",
        "✅ Universal (Fallback)"
    ]

    for platform in supported_platforms:
        print(f"  {platform}")

    print(f"\n📧 Need help? mcp@logue.pro")
    print(f"🌐 Learn more: logue.pro")

def main():
    """Main universal entry point"""
    if len(sys.argv) > 1:
        if sys.argv[1] in ['--platform', '--detect', '--compatibility']:
            show_platform_compatibility()
            return
        elif sys.argv[1] in ['--install-deps']:
            install_platform_dependencies()
            return
        elif sys.argv[1] in ['--generate-config']:
            config = generate_platform_config()
            print(f"✅ Platform config generated: {config}")
            return

    # Ensure dependencies are available
    install_platform_dependencies()

    # Generate platform config
    generate_platform_config()

    # Import and run the main interface
    try:
        sys.path.insert(0, str(cli_dir))
        from mcp_unified_interface import PrologueInterface
        interface = PrologueInterface()

        # Show platform info briefly
        detected = detect_ai_platform()
        if detected != 'universal':
            print(f"🎯 Platform detected: {detected.upper()}")
            print(f"Using command prefix: {interface.platform_adapter.compatibility_mode['command_prefix']}")
            print()

        interface.run()

    except Exception as e:
        print(f"❌ Error: {e}")
        print("💡 Try running: python prologue_universal.py --platform")
        sys.exit(1)

if __name__ == "__main__":
    main()