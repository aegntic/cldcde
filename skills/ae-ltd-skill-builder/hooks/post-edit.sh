#!/usr/bin/env bash
#
# post-edit.sh - Post-edit hook for file modifications
# Runs AFTER Claude edits a file
#
# Use cases:
#   - Validate changes
#   - Format/lint code
#   - Run tests
#   - Update documentation
#   - Commit changes
#
# Environment variables available:
#   EDIT_FILE      - Path to file that was edited
#   EDIT_TYPE      - Type of edit (create, modify, delete)
#   EDIT_SUCCESS   - "true" if edit succeeded
#   SKILL_NAME     - Name of skill triggering the edit (if applicable)
#

set -e

EDIT_FILE="${EDIT_FILE:-}"
EDIT_SUCCESS="${EDIT_SUCCESS:-true}"

# Skip if no file specified
[[ -z "$EDIT_FILE" ]] && exit 0

# Example: Auto-format code after edit
# if [[ "$EDIT_FILE" == *.py ]]; then
#     black "$EDIT_FILE" 2>/dev/null || true
# elif [[ "$EDIT_FILE" == *.js || "$EDIT_FILE" == *.ts ]]; then
#     prettier --write "$EDIT_FILE" 2>/dev/null || true
# elif [[ "$EDIT_FILE" == *.go ]]; then
#     gofmt -w "$EDIT_FILE" 2>/dev/null || true
# fi

# Example: Run linter
# if [[ "$EDIT_FILE" == *.py ]]; then
#     ruff check --fix "$EDIT_FILE" 2>/dev/null || true
# fi

# Example: Validate JSON/YAML
# if [[ "$EDIT_FILE" == *.json ]]; then
#     jq empty "$EDIT_FILE" && echo "✓ Valid JSON"
# elif [[ "$EDIT_FILE" == *.yaml || "$EDIT_FILE" == *.yml ]]; then
#     yamllint "$EDIT_FILE" 2>/dev/null || true
# fi

# Example: Run related tests
# if [[ "$EDIT_FILE" == src/**/*.py ]]; then
#     TEST_FILE="${EDIT_FILE/src/tests}".replace('.py', '_test.py')
#     if [[ -f "$TEST_FILE" ]]; then
#         pytest "$TEST_FILE" -v 2>/dev/null || true
#     fi
# fi

# Example: Update file modification time in index
# touch ~/.agents/cache/file-index

# Example: Log successful edits
# if [[ "$EDIT_SUCCESS" == "true" ]]; then
#     echo "[$(date -Iseconds)] Post-edit: $EDIT_FILE" >> ~/.agents/logs/edits.log
# fi

exit 0
