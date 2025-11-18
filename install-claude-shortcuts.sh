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
    cat "$HOME/cldcde-cc-dev/cldcde/CLAUDE_CLI_SHORTCUTS.md"
}
EOF

# Apply changes
source "$CONFIG_FILE"
echo "Installation complete! Open a new terminal or source your .zshrc to use the shortcuts."
