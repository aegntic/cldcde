#!/usr/bin/env bash
#
# pre-task.sh - Pre-task hook for skill execution
# Runs BEFORE a skill is invoked
#
# Use cases:
#   - Validate environment/dependencies
#   - Set up working directory
#   - Check prerequisites
#   - Initialize state
#
# Environment variables available:
#   SKILL_NAME     - Name of the skill being invoked
#   SKILL_PATH     - Path to the skill directory
#   SKILL_ARGS     - Arguments passed to the skill
#   WORKING_DIR    - Current working directory
#
# Exit codes:
#   0  - Continue with skill execution
#   1  - Abort skill execution (error message shown to user)
#

set -e

SKILL_NAME="${SKILL_NAME:-unknown}"
SKILL_PATH="${SKILL_PATH:-.}"

# Log hook execution (optional, for debugging)
# echo "[pre-task] Preparing to run: $SKILL_NAME"

# Example: Check for required environment
# if [[ -z "$REQUIRED_API_KEY" ]]; then
#     echo "Error: REQUIRED_API_KEY not set"
#     exit 1
# fi

# Example: Create working directories
# mkdir -p "$WORKING_DIR/output"

# Example: Validate skill has required files
# if [[ ! -f "$SKILL_PATH/config.json" ]]; then
#     echo "Warning: No config.json found, using defaults"
# fi

exit 0
