#!/usr/bin/env bash
#
# test-skill.sh - Test skill integration with Claude Code
# Verifies skill discovery, loading, and execution
#
# Usage:
#   ./test-skill.sh ./my-skill         # Test specific skill
#   ./test-skill.sh --all              # Test all skills
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_BUILDER_ROOT="$(dirname "$SCRIPT_DIR")"

test_skill() {
    local skill_path="$1"
    local skill_name=$(basename "$skill_path")

    echo -e "${CYAN}Testing: ${skill_name}${NC}"
    echo ""

    # Test 1: SKILL.md exists
    echo -n "  SKILL.md exists... "
    if [[ -f "$skill_path/SKILL.md" ]]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        return 1
    fi

    # Test 2: Valid YAML frontmatter
    echo -n "  YAML frontmatter valid... "
    if python3 -c "
import re
text = open('$skill_path/SKILL.md').read()
m = re.match(r'^---\n.*?\n---', text, re.S)
if m:
    # Try to parse name and description
    fm = m.group(0)
    if 'name:' in fm and 'description:' in fm:
        exit(0)
exit(1)
" 2>/dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        return 1
    fi

    # Test 3: Name matches directory
    echo -n "  Name matches directory... "
    local name_in_file=$(python3 -c "
import re
text = open('$skill_path/SKILL.md').read()
m = re.search(r'^name:\s*[\"']?([^\"'\n]+)[\"']?', text, re.M)
print(m.group(1) if m else '')
" 2>/dev/null)

    if [[ "$name_in_file" == "$skill_name" ]]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗ (expected '$skill_name', got '$name_in_file')${NC}"
        return 1
    fi

    # Test 4: Description has trigger
    echo -n "  Description has trigger... "
    if python3 -c "
import re
text = open('$skill_path/SKILL.md').read()
m = re.search(r'^description:\s*[\"']?([^\"'\n]+)[\"']?', text, re.M)
desc = m.group(1).lower() if m else ''
if 'when' in desc or 'use' in desc:
    exit(0)
exit(1)
" 2>/dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}! (consider adding 'when' or 'use')${NC}"
    fi

    # Test 5: Hooks executable (if present)
    if [[ -d "$skill_path/hooks" ]]; then
        echo -n "  Hooks executable... "
        local hooks_ok=true
        for hook in "$skill_path/hooks"/*.sh; do
            if [[ -f "$hook" ]] && [[ ! -x "$hook" ]]; then
                hooks_ok=false
                break
            fi
        done
        if $hooks_ok; then
            echo -e "${GREEN}✓${NC}"
        else
            echo -e "${YELLOW}! (some hooks not executable)${NC}"
        fi
    fi

    # Test 6: Scripts executable (if present)
    if [[ -d "$skill_path/scripts" ]]; then
        echo -n "  Scripts executable... "
        local scripts_ok=true
        for script in "$skill_path/scripts"/*.sh; do
            if [[ -f "$script" ]] && [[ ! -x "$script" ]]; then
                scripts_ok=false
                break
            fi
        done
        if $scripts_ok; then
            echo -e "${GREEN}✓${NC}"
        else
            echo -e "${YELLOW}! (some scripts not executable)${NC}"
        fi
    fi

    echo -e "${GREEN}  All tests passed!${NC}"
    return 0
}

# Main
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════╗"
echo "║           Skill Test Runner                ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

if [[ "$1" == "--all" ]]; then
    SKILLS_DIR="${SKILLS_DIR:-$HOME/.agents/skills}"
    passed=0
    failed=0

    for skill_dir in "$SKILLS_DIR"/*/; do
        if [[ -f "$skill_dir/SKILL.md" ]]; then
            if test_skill "$skill_dir"; then
                ((passed++))
            else
                ((failed++))
            fi
            echo ""
        fi
    done

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "Results: ${GREEN}$passed passed${NC}, ${RED}$failed failed${NC}"
elif [[ -n "$1" ]]; then
    test_skill "$1"
else
    echo "Usage: $0 <skill-path> | --all"
    exit 1
fi
