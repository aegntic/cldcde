#!/bin/zsh

# Claude CLI Shortcuts Install Script
# This script installs the Claude CLI shortcuts into your shell configuration file (.zshrc)

CONFIG_FILE="$HOME/.zshrc"

# Function to append alias to zshrc if it doesn't already exist
define_alias() {
    ALIAS="$1"
    ALIAS_COMMAND="$2"
    if ! grep -q "$ALIAS" "$CONFIG_FILE"; then
        echo "Adding alias: $ALIAS -> $ALIAS_COMMAND"
        echo "alias $ALIAS='$ALIAS_COMMAND'" >> "$CONFIG_FILE"
    else
        echo "Alias $ALIAS already exists, skipping..."
    fi
}

# Claude CLI Aliases
define_alias "cld" "claude"
define_alias "cldp" "claude --print"
define_alias "cldc" "claude --continue"
define_alias "cldr" "claude --resume"
define_alias "cldv" "claude --verbose"
define_alias "cldd" "claude --debug"
define_alias "cldpc" "claude --print --continue"
define_alias "cldpr" "claude --print --resume"
define_alias "cldvc" "claude --verbose --continue"
define_alias "clds" "claude --model sonnet"
define_alias "cldo" "claude --model opus"
define_alias "clds1" "claude --model claude-3-5-sonnet-20241022"
define_alias "cldo1" "claude --model claude-3-opus-20240229"
define_alias "cldconf" "claude config"
define_alias "cldmcp" "claude mcp"
define_alias "cldup" "claude update"
define_alias "clddoc" "claude doctor"
define_alias "restcldd" "pkill -f 'Claude.app' && sleep 2 && open -a Claude"
define_alias "cldide" "claude --ide"
define_alias "cldsafe" "claude --dangerously-skip-permissions"
define_alias "cldae" "claude --dangerously-skip-permissions"
define_alias "cldaep" "claude --dangerously-skip-permissions --print"
define_alias "cldaec" "claude --dangerously-skip-permissions --continue"
define_alias "cldjson" "claude --print --output-format json"
define_alias "cldstream" "claude --print --output-format stream-json"

# Migration aliases for deprecated commands
# TODO: Remove these after one major release
define_alias "cldex" "echo '⚠️ cldex is deprecated ⇒ use cldism' && cldism \"\$@\""
define_alias "cldlist" "echo '⚠️ cldlist is deprecated ⇒ use cldism-list' && cldism-list \"\$@\""
define_alias "cldshow" "echo '⚠️ cldshow is deprecated ⇒ use cldism-show' && cldism-show \"\$@\""

# Claude CLI Functions
echo "Adding interactive functions to $CONFIG_FILE"
cat << 'EOF' >> "$CONFIG_FILE"

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
    echo -e "\e[36mClaude CLI Shortcuts:\e[0m"
    echo "  cld              - Start Claude (main command)"
    echo "  cldp             - Print mode (non-interactive)"
    echo "  cldc             - Continue conversation"
    echo "  cldr             - Resume a session"
    echo "  cldv             - Verbose mode"
    echo "  cldd             - Debug mode"
    echo "  clds             - Use Sonnet model"
    echo "  cldo             - Use Opus model"
    echo "  cldconf          - Configuration management"
    echo "  cldmcp           - MCP server management"
    echo "  cldup            - Update Claude"
    echo "  clddoc           - Health check"
    echo "  cld-quick \"...\"  - Quick one-liner query"
    echo "  cld-auto \"...\"   - Auto-execute with safety checks"
    echo "  cld-help         - Show this help"
    echo ""
    echo -e "\e[33mExperimental Development (now 'claude-ism'):\e[0m"
    echo "  cldism           - Start multi-approach experiment"
    echo "  cldism-list      - List all experiments"
    echo "  cldism-show      - Show experiment report"
    echo "  cldexhelp        - Experiment system help"
    echo ""
    echo -e "\e[31mDeprecated (backward compatibility):\e[0m"
    echo "  cldex            - ⚠️ Use 'cldism' instead"
    echo "  cldlist          - ⚠️ Use 'cldism-list' instead"
    echo "  cldshow          - ⚠️ Use 'cldism-show' instead"
    echo ""
    echo -e "\e[34mEnhanced Menu:\e[0m"
    echo "  cldisms          - Enhanced launcher menu"
    echo "  ism              - Enhanced launcher menu (alias)"
    echo ""
    echo "For detailed help, see: https://github.com/aegntic/cldcde/blob/main/CLAUDE_CLI_SHORTCUTS.md"
}

# Experimental/Development Functions (renamed from cldex to cldism)
cldism() {
    echo -e "\e[34m🔬 Starting Claude multi-approach experiment: $1\e[0m"
    if [[ -z "$1" ]]; then
        echo "Usage: cldism <experiment-name> [description]"
        return 1
    fi
    
    local exp_name="$1"
    local exp_dir="$HOME/.claude-experiments/$exp_name"
    
    # Create experiment directory
    mkdir -p "$exp_dir"
    
    # Create experiment log
    echo "Experiment: $exp_name" > "$exp_dir/experiment.log"
    echo "Started: $(date)" >> "$exp_dir/experiment.log"
    echo "Description: ${2:-'No description provided'}" >> "$exp_dir/experiment.log"
    
    # Start Claude with experiment context
    claude --print "Start a multi-approach experiment for: $exp_name. ${2:-''}" | tee "$exp_dir/output.txt"
}

cldism-list() {
    echo -e "\e[36m📋 Available Claude experiments:\e[0m"
    if [[ -d "$HOME/.claude-experiments" ]]; then
        ls -la "$HOME/.claude-experiments/" | grep "^d" | awk '{print $9}' | grep -v "^\.$\|^\.\.$" | while read exp; do
            echo -e "  \e[32m→\e[0m $exp"
        done
    else
        echo -e "  \e[33m⚠️  No experiments directory found\e[0m"
    fi
}

cldism-show() {
    if [[ -z "$1" ]]; then
        echo "Usage: cldism-show <experiment-name>"
        return 1
    fi
    
    local exp_dir="$HOME/.claude-experiments/$1"
    
    if [[ -d "$exp_dir" ]]; then
        echo -e "\e[34m🔬 Experiment Report: $1\e[0m"
        echo -e "\e[36m===================\e[0m"
        
        if [[ -f "$exp_dir/experiment.log" ]]; then
            cat "$exp_dir/experiment.log"
        fi
        
        echo -e "\e[36m\nOutput:\e[0m"
        if [[ -f "$exp_dir/output.txt" ]]; then
            cat "$exp_dir/output.txt"
        fi
    else
        echo -e "\e[31m❌ Experiment '$1' not found\e[0m"
    fi
}

# Backward compatibility with deprecation warnings
cldex() {
    echo -e "\e[33m⚠️  DEPRECATION WARNING: 'cldex' is deprecated. Use 'cldism' instead.\e[0m"
    echo -e "\e[34m💡 This alias will be removed in a future version.\e[0m"
    cldism "$@"
}

cldlist() {
    echo -e "\e[33m⚠️  DEPRECATION WARNING: 'cldlist' is deprecated. Use 'cldism-list' instead.\e[0m"
    echo -e "\e[34m💡 This alias will be removed in a future version.\e[0m"
    cldism-list "$@"
}

cldshow() {
    echo -e "\e[33m⚠️  DEPRECATION WARNING: 'cldshow' is deprecated. Use 'cldism-show' instead.\e[0m"
    echo -e "\e[34m💡 This alias will be removed in a future version.\e[0m"
    cldism-show "$@"
}

# Enhanced Menu Aliases
alias cldisms='$HOME/claudeism/claude-launcher.sh'
alias ism='$HOME/claudeism/claude-launcher.sh'

EOF

# Apply changes
source "$CONFIG_FILE"
echo "Installation complete! Open a new terminal or source your .zshrc to use the shortcuts."
