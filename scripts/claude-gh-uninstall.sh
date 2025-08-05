#!/bin/bash

# Claude Code GitHub CLI Extensions Uninstaller
# Removes all Claude-specific aliases

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   Claude Code GitHub CLI Extensions Uninstaller               ║"
echo "║   Removing Claude shortcuts and features                      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    exit 1
fi

echo "🗑️  Removing Claude Code aliases..."

# List of all Claude aliases to remove
aliases=(
    "claude-create"
    "claude-commit"
    "claude-issue"
    "claude-pr"
    "claude-deploy"
    "claude-init"
    "claude-list"
    "claude-status"
    "claude-topics"
    "claude-action"
    "claude-badges"
    "claude-search"
    "claude-clone"
    "claude-ext"
    "claude-mcp"
)

# Remove each alias
for alias in "${aliases[@]}"; do
    if gh alias delete "$alias" 2>/dev/null; then
        echo "  ✓ Removed: gh $alias"
    else
        echo "  - Skipped: gh $alias (not found)"
    fi
done

# Remove reference file
if [ -f ~/.claude-gh-reference.md ]; then
    rm ~/.claude-gh-reference.md
    echo "  ✓ Removed: ~/.claude-gh-reference.md"
fi

# Remove migration aliases from shell configuration files
echo "🗑️  Removing migration aliases from shell configuration files..."
for config_file in ~/.bashrc ~/.zshrc; do
    if [ -f "$config_file" ]; then
        # Remove migration aliases and TODO comments
        sed -i.bak '/# Migration aliases for deprecated cldcde commands/,/alias cldshow=/d' "$config_file" 2>/dev/null || true
        sed -i.bak '/# TODO: Remove these after one major release/d' "$config_file" 2>/dev/null || true
        if [ -f "$config_file.bak" ]; then
            rm "$config_file.bak"
        fi
        echo "  ✓ Cleaned: $config_file"
    fi
done

echo ""
echo "✅ Claude Code GitHub CLI extensions have been removed!"
echo ""
echo "💡 To reinstall, run:"
echo "   ./scripts/setup-claude-gh-features.sh"
echo ""