#!/bin/bash
# Safely edit a file with backup and validation

FILE=$1
if [ -z "$FILE" ]; then
    echo "Usage: $0 <file-path>"
    exit 1
fi

# Create backup
BACKUP="${FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$FILE" "$BACKUP"
echo "Backup created: $BACKUP"

# Open editor
${EDITOR:-nano} "$FILE"

echo ""
echo "=== Validating changes ==="
cd /a0/usr/projects/openfang_3

# Quick check
if cargo check --workspace 2>&1 | grep -q "error"; then
    echo "❌ Build failed! Restoring backup..."
    cp "$BACKUP" "$FILE"
    echo "Backup restored."
else
    echo "✅ Changes validated!"
fi
