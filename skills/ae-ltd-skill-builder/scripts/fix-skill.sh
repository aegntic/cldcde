#!/usr/bin/env bash
#
# fix-skill.sh - Auto-fix common skill issues
# Fixes: naming mismatches, missing frontmatter, empty descriptions
#
# Usage:
#   ./fix-skill.sh              # Fix all skills in ~/.agents/skills
#   ./fix-skill.sh ./my-skill   # Fix specific skill directory
#   ./fix-skill.sh --dry-run    # Show what would be fixed without changing
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DRY_RUN=false
SKILL_PATH="${1:-$HOME/.agents/skills}"

# Parse arguments
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    SKILL_PATH="$HOME/.agents/skills"
elif [[ "$2" == "--dry-run" ]]; then
    DRY_RUN=true
fi

echo -e "${BLUE}=== Skill Fixer ===${NC}"
echo -e "Target: $SKILL_PATH"
echo -e "Dry run: $DRY_RUN"
echo ""

# Python fixer script
python3 << 'PYTHON_SCRIPT'
import sys
from pathlib import Path
import re
import argparse

def split_frontmatter(text: str):
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, flags=re.S)
    if m:
        return m.group(1), m.group(2), True
    return "", text, False

def join_frontmatter(fm: str, body: str):
    fm = fm.strip("\n")
    return f"---\n{fm}\n---\n{body.lstrip()}"

def set_field(fm: str, key: str, value: str):
    lines = fm.splitlines() if fm else []
    pat = re.compile(rf"^{re.escape(key)}\s*:")
    for i, line in enumerate(lines):
        if pat.match(line):
            lines[i] = f"{key}: {value}"
            return "\n".join(lines), True
    lines.append(f"{key}: {value}")
    return "\n".join(lines), False

def get_field(fm: str, key: str):
    pat = re.compile(rf"^{re.escape(key)}\s*:\s*(.*)$")
    for line in fm.splitlines():
        m = pat.match(line)
        if m:
            return m.group(1).strip().strip('"').strip("'")
    return None

def fix_skills(root_path: Path, dry_run: bool = False):
    fixes = []

    # 1) Fix every SKILL.md name to match parent directory (slug)
    for skill_md in root_path.glob("*/SKILL.md"):
        slug = skill_md.parent.name
        text = skill_md.read_text(encoding="utf-8")
        fm, body, has_fm = split_frontmatter(text)

        changes = []

        if not has_fm:
            # Create frontmatter if missing
            fm = f'name: {slug}\ndescription: "Skill for {slug}"'
            new_text = join_frontmatter(fm, body)
            changes.append("added frontmatter")
        else:
            current_name = get_field(fm, "name")
            if current_name != slug:
                fm, _ = set_field(fm, "name", slug)
                changes.append(f"name: '{current_name}' -> '{slug}'")

            # Check description
            desc = get_field(fm, "description")
            if not desc or desc == "":
                fm, _ = set_field(fm, "description", f"Skill for {slug}")
                changes.append("added description")

            new_text = join_frontmatter(fm, body)

        if new_text != text:
            if not dry_run:
                skill_md.write_text(new_text, encoding="utf-8")
            fixes.append({
                "file": str(skill_md),
                "changes": changes
            })

    # 2) Ensure README.md has description
    readme = root_path / "README.md"
    if readme.exists():
        text = readme.read_text(encoding="utf-8")
        fm, body, has_fm = split_frontmatter(text)
        default_desc = "Shared skills index for this agent workspace."

        if not has_fm:
            new_text = join_frontmatter(f"description: {default_desc}", text)
            if not dry_run:
                readme.write_text(new_text, encoding="utf-8")
            fixes.append({
                "file": str(readme),
                "changes": ["added frontmatter with description"]
            })
        else:
            desc = get_field(fm, "description")
            if not desc or desc == "":
                fm, _ = set_field(fm, "description", default_desc)
                new_text = join_frontmatter(fm, body)
                if not dry_run:
                    readme.write_text(new_text, encoding="utf-8")
                fixes.append({
                    "file": str(readme),
                    "changes": ["added description"]
                })

    return fixes

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("path", nargs="?", default=None)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    root = Path(args.path) if args.path else Path.home() / ".agents" / "skills"

    if not root.exists():
        print(f"Error: Path does not exist: {root}")
        sys.exit(1)

    fixes = fix_skills(root, args.dry_run)

    if fixes:
        for fix in fixes:
            print(f"Fixed: {fix['file']}")
            for change in fix['changes']:
                print(f"  - {change}")
        print(f"\nTotal: {len(fixes)} files {'would be ' if args.dry_run else ''}fixed")
    else:
        print("No issues found!")
PYTHON_SCRIPT

echo ""
echo -e "${GREEN}Done.${NC}"
