#!/bin/bash
# Claude CLI Shortcuts - Comprehensive collection of 40+ shortcuts
# Source: https://github.com/aegntic/cldcde
# Updated for Claude 4 - August 2025

# Add .local/bin to PATH for user-installed tools
export PATH="$HOME/.local/bin:$PATH"

# Basic Commands
alias cld='claude --add-dir "$(pwd)"'
alias cldp="claude --print"
alias cldc="~/.claude/claude-resume-helper.sh continue"
alias cldr="~/.claude/claude-resume-helper.sh resume"
alias cldv="claude --verbose"
alias cldd="claude --debug"

# Quick Combinations
alias cldpc="claude --print --continue"
alias cldpr="claude --print --resume"
alias cldvc="claude --verbose --continue"

# Model Shortcuts
alias clds="claude --model claude-4-sonnet"
alias cldo="claude --model claude-4-opus"
alias clds1="claude --model claude-4-sonnet"
alias cldo1="claude --model claude-4-opus"

# Configuration
alias cldconf="claude config"
alias cldmcp="claude mcp"
alias cldup="claude update"
alias clddoc="claude doctor"
alias restcldd="pkill -f 'Claude.app' && sleep 2 && open -a Claude"

# Advanced Features
alias cldide="claude --ide"
alias cldsafe="claude --dangerously-skip-permissions"
alias cldae="claude --dangerously-skip-permissions"
alias cldaep="claude --dangerously-skip-permissions --print"
alias cldaec="~/.claude/claude-resume-helper.sh continue --dangerously-skip-permissions"
alias cldjson="claude --print --output-format json"
alias cldstream="claude --print --output-format stream-json"

# Utility Functions

# Interactive session picker
cld-session() {
    claude --resume
}

# Quick one-liner with print mode
cld-quick() {
    claude --print "$@"
}

# Continue conversation in print mode
cld-continue-print() {
    claude --print --continue "$@"
}

# Smart auto-execute with safety warnings
cld-auto() {
    echo -e "\e[33m⚠️  Auto-execute mode: Will skip permission checks\e[0m"
    echo -e "\e[34m💡 Best for: file analysis, code review, explanations\e[0m"
    echo -e "\e[31m❌ Avoid for: system changes, network operations, deletions\e[0m"
    claude --dangerously-skip-permissions "$@"
}

# Show Claude CLI Shortcuts help
cld-help() {
    echo "Claude CLI Shortcuts:"
    echo ""
    echo "🔥 Basic Commands:"
    echo "  cld              - Start Claude (main shortcut)"
    echo "  cldp             - Print mode (non-interactive)"
    echo "  cldc             - Continue conversation"
    echo "  cldr             - Resume a session"
    echo "  cldv             - Verbose mode"
    echo "  cldd             - Debug mode"
    echo ""
    echo "⚡ Quick Combinations:"
    echo "  cldpc            - Print + continue"
    echo "  cldpr            - Print + resume"
    echo "  cldvc            - Verbose + continue"
    echo ""
    echo "🤖 Model Shortcuts:"
    echo "  clds             - Quick sonnet model"
    echo "  cldo             - Quick opus model"
    echo "  clds1            - Specific sonnet model"
    echo "  cldo1            - Specific opus model"
    echo ""
    echo "⚙️ Configuration:"
    echo "  cldconf          - Configuration management"
    echo "  cldmcp           - MCP server management"
    echo "  cldup            - Update Claude"
    echo "  clddoc           - Health check"
    echo "  restcldd         - Restart Claude Desktop"
    echo ""
    echo "🚀 Advanced Features:"
    echo "  cldide           - Auto-connect to IDE"
    echo "  cldsafe          - Skip permissions (use carefully!)"
    echo "  cldae            - Auto-execute for safe operations"
    echo "  cldaep           - Auto-execute + print mode"
    echo "  cldaec           - Auto-execute + continue"
    echo "  cldjson          - JSON output"
    echo "  cldstream        - Streaming JSON"
    echo ""
    echo "🛠️ Utility Functions:"
    echo "  cld-session      - Interactive session picker"
    echo "  cld-quick \"...\"  - Quick one-liner with print mode"
    echo "  cld-continue-print - Continue conversation in print mode"
    echo "  cld-auto \"...\"   - Smart auto-execute with safety warnings"
    echo "  cld-help         - Show this help"
    echo ""
    echo "💡 Safety Guidelines:"
    echo "  ✅ Safe for Auto-Execute: code analysis, file reading, explanations"
    echo "  ❌ Risky Operations: file modifications, system commands, deletions"
    echo ""
    echo "For more info: https://github.com/aegntic/cldcde"
}

# Export functions for use in scripts
export -f cld-session cld-quick cld-continue-print cld-auto cld-help

echo "✅ CLDCDE CLI Shortcuts loaded successfully!"
echo "📚 Type 'cld-help' to see all available shortcuts"
echo "🚀 Main shortcut: 'cld' - Start Claude with current directory"