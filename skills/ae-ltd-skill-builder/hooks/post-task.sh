#!/usr/bin/env bash
#
# post-task.sh - Post-task hook for skill execution
# Runs AFTER a skill completes (success or failure)
#
# Use cases:
#   - Clean up temporary files
#   - Log results/metrics
#   - Update state
#   - Send notifications
#   - Trigger follow-up actions
#
# Environment variables available:
#   SKILL_NAME     - Name of the skill that ran
#   SKILL_PATH     - Path to the skill directory
#   SKILL_SUCCESS  - "true" if skill succeeded, "false" if failed
#   SKILL_DURATION - Duration in seconds
#   WORKING_DIR    - Current working directory
#

set -e

SKILL_NAME="${SKILL_NAME:-unknown}"
SKILL_SUCCESS="${SKILL_SUCCESS:-true}"
SKILL_DURATION="${SKILL_DURATION:-0}"

# Log completion (optional)
# if [[ "$SKILL_SUCCESS" == "true" ]]; then
#     echo "[post-task] ✓ $SKILL_NAME completed in ${SKILL_DURATION}s"
# else
#     echo "[post-task] ✗ $SKILL_NAME failed after ${SKILL_DURATION}s"
# fi

# Example: Clean up temp files
# rm -f /tmp/skill-$$-*.tmp

# Example: Update skill metrics
# echo "$(date -Iseconds),$SKILL_NAME,$SKILL_SUCCESS,$SKILL_DURATION" >> ~/.agents/metrics/skills.log

# Example: Notify on failure
# if [[ "$SKILL_SUCCESS" == "false" ]]; then
#     notify-send "Skill Failed" "$SKILL_NAME encountered an error"
# fi

# Example: Auto-commit changes
# if [[ "$SKILL_SUCCESS" == "true" ]] && [[ -n "$(git status --porcelain)" ]]; then
#     git add -A && git commit -m "Auto-commit from $SKILL_NAME"
# fi

exit 0
