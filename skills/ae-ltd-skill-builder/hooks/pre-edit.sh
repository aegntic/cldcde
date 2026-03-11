#!/usr/bin/env bash
#
# pre-edit.sh - Pre-edit hook for file modifications
# Runs BEFORE Claude edits a file
#
# Use cases:
#   - Create backups
#   - Validate file is safe to edit
#   - Check file locks
#   - Log edit intentions
#
# Environment variables available:
#   EDIT_FILE      - Path to file being edited
#   EDIT_TYPE      - Type of edit (create, modify, delete)
#   SKILL_NAME     - Name of skill triggering the edit (if applicable)
#

set -e

EDIT_FILE="${EDIT_FILE:-}"
EDIT_TYPE="${EDIT_TYPE:-modify}"

# Skip if no file specified
[[ -z "$EDIT_FILE" ]] && exit 0

# Example: Create backup before editing
# if [[ -f "$EDIT_FILE" ]]; then
#     BACKUP_DIR="$HOME/.agents/backups/$(date +%Y%m%d)"
#     mkdir -p "$BACKUP_DIR"
#     cp "$EDIT_FILE" "$BACKUP_DIR/$(basename "$EDIT_FILE").$(date +%H%M%S).bak"
# fi

# Example: Prevent editing certain files
# PROTECTED_FILES=(".env" "credentials.json" "secrets.yaml")
# for protected in "${PROTECTED_FILES[@]}"; do
#     if [[ "$(basename "$EDIT_FILE")" == "$protected" ]]; then
#         echo "Error: Cannot edit protected file: $EDIT_FILE"
#         exit 1
#     fi
# done

# Example: Validate file syntax before edit
# if [[ "$EDIT_FILE" == *.json ]] && [[ -f "$EDIT_FILE" ]]; then
#     if ! jq empty "$EDIT_FILE" 2>/dev/null; then
#         echo "Warning: $EDIT_FILE contains invalid JSON"
#     fi
# fi

# Example: Log edit intentions
# echo "[$(date -Iseconds)] Pre-edit: $EDIT_FILE ($EDIT_TYPE)" >> ~/.agents/logs/edits.log

exit 0
