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

echo ""
echo "✅ Claude Code GitHub CLI extensions have been removed!"
echo ""
echo "💡 To reinstall, run:"
echo "   ./scripts/setup-claude-gh-features.sh"
echo ""