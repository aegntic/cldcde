#!/usr/bin/env python3
"""
Prologue Platform Compatibility Adapter
Makes Prologue CLI compatible with multiple AI platforms:
- Claude Code (already supported)
- Auggie AI
- Gemini AI
- OpenAI Codex
- OpenCode
- TunaCode
- And other AI platforms
"""

import os
import sys
import json
import subprocess
from typing import Dict, Any, Optional
from pathlib import Path
import argparse

class PlatformAdapter:
    """Adapts Prologue CLI for different AI platforms"""

    def __init__(self):
        self.platform = self.detect_platform()
        self.compatibility_mode = self.get_compatibility_mode()

    def detect_platform(self) -> str:
        """Detect the current AI platform"""
        # Check environment variables and system indicators
        if 'CLAUDE_CODE' in os.environ or 'claude' in os.path.basename(sys.executable).lower():
            return 'claude_code'
        elif 'AUGGIE' in os.environ or 'auggie' in os.path.basename(sys.executable).lower():
            return 'auggie'
        elif 'GEMINI' in os.environ or 'gemini' in os.path.basename(sys.executable).lower():
            return 'gemini'
        elif 'OPENAI' in os.environ or 'codex' in os.path.basename(sys.executable).lower():
            return 'codex'
        elif 'OPENCODE' in os.environ or 'opencode' in os.path.basename(sys.executable).lower():
            return 'opencode'
        elif 'TUNACODE' in os.environ or 'tunacode' in os.path.basename(sys.executable).lower():
            return 'tunacode'
        else:
            return 'universal'

    def get_compatibility_mode(self) -> Dict[str, Any]:
        """Get compatibility settings for the detected platform"""
        modes = {
            'claude_code': {
                'supports_rich': True,
                'supports_interactive': True,
                'supports_slash_commands': True,
                'command_prefix': '/',
                'output_format': 'rich',
                'max_output_length': 100000,
                'supports_background': True
            },
            'auggie': {
                'supports_rich': False,
                'supports_interactive': True,
                'supports_slash_commands': True,
                'command_prefix': '!',
                'output_format': 'plain',
                'max_output_length': 50000,
                'supports_background': False
            },
            'gemini': {
                'supports_rich': False,
                'supports_interactive': False,
                'supports_slash_commands': True,
                'command_prefix': '/',
                'output_format': 'markdown',
                'max_output_length': 75000,
                'supports_background': False
            },
            'codex': {
                'supports_rich': False,
                'supports_interactive': True,
                'supports_slash_commands': True,
                'command_prefix': '/',
                'output_format': 'plain',
                'max_output_length': 60000,
                'supports_background': True
            },
            'opencode': {
                'supports_rich': True,
                'supports_interactive': True,
                'supports_slash_commands': True,
                'command_prefix': '/',
                'output_format': 'rich',
                'max_output_length': 80000,
                'supports_background': True
            },
            'tunacode': {
                'supports_rich': False,
                'supports_interactive': True,
                'supports_slash_commands': True,
                'command_prefix': '@',
                'output_format': 'plain',
                'max_output_length': 40000,
                'supports_background': False
            },
            'universal': {
                'supports_rich': True,
                'supports_interactive': True,
                'supports_slash_commands': True,
                'command_prefix': '/',
                'output_format': 'adaptive',
                'max_output_length': 100000,
                'supports_background': True
            }
        }

        return modes.get(self.platform, modes['universal'])

    def adapt_command(self, command: str) -> str:
        """Adapt command syntax for the current platform"""
        if self.platform == 'auggie' and command.startswith('/'):
            return command.replace('/', '!', 1)
        elif self.platform == 'tunacode' and command.startswith('/'):
            return command.replace('/', '@', 1)
        return command

    def adapt_output(self, output: str, format_type: str = 'auto') -> str:
        """Adapt output format for the current platform"""
        if format_type == 'auto':
            format_type = self.compatibility_mode['output_format']

        # Strip Rich formatting for platforms that don't support it
        if not self.compatibility_mode['supports_rich'] and format_type == 'rich':
            import re
            # Remove ANSI escape codes
            output = re.sub(r'\x1b\[[0-9;]*m', '', output)
            # Convert Rich tables to plain text
            output = self._convert_tables_to_plain(output)

        # Truncate output if too long
        if len(output) > self.compatibility_mode['max_output_length']:
            output = output[:self.compatibility_mode['max_output_length'] - 100] + "\n...[output truncated]"

        return output

    def _convert_tables_to_plain(self, text: str) -> str:
        """Convert Rich table formatting to plain text"""
        import re
        # Simple table conversion - replace box drawing characters with plain text
        text = re.sub(r'[─│┌┐└┘├┤┬┴┼]', '-', text)
        return text

    def check_dependencies(self) -> bool:
        """Check if platform-specific dependencies are available"""
        if self.compatibility_mode['supports_rich']:
            try:
                import rich
                return True
            except ImportError:
                if self.platform in ['claude_code', 'opencode', 'universal']:
                    # Try to install Rich
                    try:
                        subprocess.run([sys.executable, "-m", "pip", "install", "--user", "rich"],
                                     check=True, capture_output=True)
                        return True
                    except:
                        pass
                # Fall back to plain mode
                self.compatibility_mode['supports_rich'] = False
                self.compatibility_mode['output_format'] = 'plain'
                return False
        return True

    def get_platform_help(self) -> str:
        """Get platform-specific help information"""
        help_text = f"""
Prologue - Platform Compatibility (Detected: {self.platform.upper()})
{'='*60}

Command Prefix: {self.compatibility_mode['command_prefix']}
Output Format: {self.compatibility_mode['output_format']}
Interactive Mode: {'Yes' if self.compatibility_mode['supports_interactive'] else 'No'}
Background Tasks: {'Yes' if self.compatibility_mode['supports_background'] else 'No'}

Platform-Specific Commands:
"""

        if self.platform == 'claude_code':
            help_text += """
  /prologue              - Launch interactive menu
  /prologue install      - Quick install top servers
  /prologue smart        - Smart auto-discovery
  /prologue monitor      - Start health monitoring
  /prologue status       - Check installation status
"""
        elif self.platform == 'auggie':
            help_text += """
  !prologue             - Launch interactive menu
  !prologue install     - Quick install top servers
  !prologue smart       - Smart auto-discovery
  !prologue monitor     - Start health monitoring
  !prologue status      - Check installation status
"""
        elif self.platform == 'tunacode':
            help_text += """
  @prologue             - Launch interactive menu
  @prologue install     - Quick install top servers
  @prologue smart       - Smart auto-discovery
  @prologue monitor     - Start health monitoring
  @prologue status      - Check installation status
"""
        else:
            help_text += """
  /prologue              - Launch interactive menu
  /prologue install      - Quick install top servers
  /prologue smart        - Smart auto-discovery
  /prologue monitor      - Start health monitoring
  /prologue status       - Check installation status
"""

        help_text += f"""

Compatibility Features:
- Auto-detects platform capabilities
- Adapts output formatting automatically
- Falls back gracefully for unsupported features
- Works across {len(self.compatibility_mode)}+ AI platforms

For more help, visit: 🌐 logue.pro
"""
        return help_text

def main():
    """Main entry point for platform adapter"""
    parser = argparse.ArgumentParser(description='Prologue Platform Compatibility Adapter')
    parser.add_argument('--detect', action='store_true', help='Detect current platform')
    parser.add_argument('--help-platform', action='store_true', help='Show platform-specific help')
    parser.add_argument('--command', help='Adapt command for current platform')
    parser.add_argument('--output', help='Adapt output for current platform')
    parser.add_argument('--format', choices=['rich', 'plain', 'markdown', 'auto'],
                       default='auto', help='Output format')

    args = parser.parse_args()

    adapter = PlatformAdapter()

    if args.detect:
        print(f"Detected Platform: {adapter.platform}")
        print(f"Compatibility Mode: {adapter.compatibility_mode}")
    elif args.help_platform:
        print(adapter.get_platform_help())
    elif args.command:
        print(adapter.adapt_command(args.command))
    elif args.output:
        print(adapter.adapt_output(args.output, args.format))
    else:
        print("Prologue Platform Adapter")
        print(f"Detected: {adapter.platform}")
        print("Use --help for usage information")

if __name__ == "__main__":
    main()