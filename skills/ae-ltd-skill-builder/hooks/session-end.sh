#!/usr/bin/env bash
#
# session-end.sh - Session end hook
# Runs when Claude Code session ends
#
# Use cases:
#   - Save session state
#   - Generate session summary
#   - Clean up temporary resources
#   - Archive logs
#   - Sync to remote
#
# Environment variables available:
#   SESSION_ID     - Unique session identifier
#   SESSION_START  - Session start timestamp
#   SKILLS_USED    - Comma-separated list of skills used
#   FILES_EDITED   - Number of files edited
#   COMMANDS_RUN   - Number of commands run
#

set -e

SESSION_ID="${SESSION_ID:-$(date +%s)}"
SESSION_START="${SESSION_START:-$(date -Iseconds)}"

# Example: Generate session summary
# SUMMARY_FILE="$HOME/.agents/sessions/$SESSION_ID.md"
# mkdir -p "$(dirname "$SUMMARY_FILE")"
# cat > "$SUMMARY_FILE" << EOF
# # Session Summary: $SESSION_ID
#
# Started: $SESSION_START
# Ended: $(date -Iseconds)
#
# ## Skills Used
# ${SKILLS_USED:-None}
#
# ## Files Edited
# ${FILES_EDITED:-0} files
#
# ## Commands Run
# ${COMMANDS_RUN:-0} commands
# EOF

# Example: Clean up old sessions (keep last 30)
# SESSIONS_DIR="$HOME/.agents/sessions"
# if [[ -d "$SESSIONS_DIR" ]]; then
#     ls -t "$SESSIONS_DIR"/*.md 2>/dev/null | tail -n +31 | xargs rm -f 2>/dev/null || true
# fi

# Example: Archive logs
# LOGS_DIR="$HOME/.agents/logs"
# ARCHIVE_DIR="$HOME/.agents/archive/$(date +%Y%m)"
# mkdir -p "$ARCHIVE_DIR"
# cp "$LOGS_DIR"/*.log "$ARCHIVE_DIR/" 2>/dev/null || true

# Example: Sync state to remote
# if command -v rclone &>/dev/null; then
#     rclone sync "$HOME/.agents/state" remote:agents-state 2>/dev/null || true
# fi

# Example: Compact databases
# for db in "$HOME/.agents/"*.db; do
#     if [[ -f "$db" ]]; then
#         sqlite3 "$db" "VACUUM;" 2>/dev/null || true
#     fi
# done

# Example: Clear sensitive data
# rm -f "$HOME/.agents/cache/credentials"* 2>/dev/null || true
# rm -f "$HOME/.agents/tmp/"* 2>/dev/null || true

exit 0
