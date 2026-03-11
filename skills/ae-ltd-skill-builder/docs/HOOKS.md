# Hooks System

Hooks are executable scripts that run at specific points in the skill lifecycle, enabling automation, validation, and state management.

## Available Hooks

| Hook | When It Runs | Use Case |
|------|--------------|----------|
| `pre-task.sh` | Before skill execution | Validate environment, check prerequisites |
| `post-task.sh` | After skill completes | Cleanup, logging, notifications |
| `pre-edit.sh` | Before file modification | Backup, validation, locks |
| `post-edit.sh` | After file modification | Format, lint, test, commit |
| `session-end.sh` | When session ends | Save state, archive, cleanup |

## Hook Structure

```bash
#!/usr/bin/env bash
#
# hook-name.sh - Brief description
#
# Use cases:
#   - Purpose 1
#   - Purpose 2
#
# Environment variables available:
#   VAR_NAME - Description
#

set -e  # Exit on error

# Hook logic here

exit 0  # Success (0) or failure (1)
```

## Environment Variables

### All Hooks
- `SKILL_NAME` - Name of the skill
- `SKILL_PATH` - Path to skill directory

### pre-task / post-task
- `SKILL_ARGS` - Arguments passed to skill
- `WORKING_DIR` - Current working directory
- `SKILL_SUCCESS` - "true" or "false" (post-task only)
- `SKILL_DURATION` - Execution time in seconds (post-task only)

### pre-edit / post-edit
- `EDIT_FILE` - Path to file being edited
- `EDIT_TYPE` - "create", "modify", or "delete"
- `EDIT_SUCCESS` - "true" or "false" (post-edit only)

### session-end
- `SESSION_ID` - Unique session identifier
- `SESSION_START` - Session start timestamp
- `SKILLS_USED` - Comma-separated list of used skills
- `FILES_EDITED` - Number of files edited
- `COMMANDS_RUN` - Number of commands run

## Hook Examples

### pre-task.sh - Environment Validation

```bash
#!/usr/bin/env bash
# Validate required tools before skill runs

# Check for Docker
if [[ "$REQUIRES_DOCKER" == "true" ]]; then
    if ! command -v docker &>/dev/null; then
        echo "Error: Docker is required for this skill"
        exit 1
    fi
fi

# Check for API keys
if [[ -z "$API_KEY" ]]; then
    echo "Error: API_KEY environment variable not set"
    echo "Set it with: export API_KEY=your-key"
    exit 1
fi

exit 0
```

### post-task.sh - Auto-Commit

```bash
#!/usr/bin/env bash
# Auto-commit changes after successful skill execution

if [[ "$SKILL_SUCCESS" != "true" ]]; then
    exit 0
fi

if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
    git add -A
    git commit -m "Auto-commit from $SKILL_NAME skill

Co-Authored-By: Claude <noreply@anthropic.com>"
fi

exit 0
```

### pre-edit.sh - Backup

```bash
#!/usr/bin/env bash
# Create backup before editing files

BACKUP_DIR="$HOME/.agents/backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

if [[ -f "$EDIT_FILE" ]]; then
    BACKUP_NAME="$(basename "$EDIT_FILE").$(date +%H%M%S).bak"
    cp "$EDIT_FILE" "$BACKUP_DIR/$BACKUP_NAME"
    echo "Backup created: $BACKUP_DIR/$BACKUP_NAME"
fi

exit 0
```

### post-edit.sh - Auto-Format

```bash
#!/usr/bin/env bash
# Format code after editing

case "$EDIT_FILE" in
    *.py)
        black "$EDIT_FILE" 2>/dev/null || true
        ruff check --fix "$EDIT_FILE" 2>/dev/null || true
        ;;
    *.js|*.ts|*.jsx|*.tsx)
        prettier --write "$EDIT_FILE" 2>/dev/null || true
        ;;
    *.go)
        gofmt -w "$EDIT_FILE" 2>/dev/null || true
        ;;
    *.json)
        jq '.' "$EDIT_FILE" > /tmp/formatted.json && mv /tmp/formatted.json "$EDIT_FILE"
        ;;
esac

exit 0
```

### session-end.sh - Session Summary

```bash
#!/usr/bin/env bash
# Generate session summary

SUMMARY_DIR="$HOME/.agents/sessions"
mkdir -p "$SUMMARY_DIR"

cat > "$SUMMARY_DIR/$SESSION_ID.md" << EOF
# Session Summary

**ID:** $SESSION_ID
**Started:** $SESSION_START
**Ended:** $(date -Iseconds)

## Statistics
- Skills Used: ${SKILLS_USED:-0}
- Files Edited: ${FILES_EDITED:-0}
- Commands Run: ${COMMANDS_RUN:-0}
EOF

exit 0
```

## Exit Codes

| Code | Meaning | Effect |
|------|---------|--------|
| 0 | Success | Continue with operation |
| 1 | Failure | Abort operation (show error) |

## Best Practices

1. **Make hooks executable**
   ```bash
   chmod +x hooks/*.sh
   ```

2. **Handle errors gracefully**
   ```bash
   if ! optional_command; then
       echo "Warning: Optional command failed"
       # Don't exit 1 for non-critical failures
   fi
   ```

3. **Use proper shebang**
   ```bash
   #!/usr/bin/env bash  # Portable
   ```

4. **Log for debugging**
   ```bash
   LOG_FILE="$HOME/.agents/logs/hooks.log"
   echo "[$(date -Iseconds)] $SKILL_NAME: hook message" >> "$LOG_FILE"
   ```

5. **Keep hooks fast**
   - Avoid long-running operations
   - Use background processes for async work

6. **Test hooks independently**
   ```bash
   # Test a hook directly
   SKILL_NAME="test" EDIT_FILE="test.txt" ./hooks/pre-edit.sh
   ```
