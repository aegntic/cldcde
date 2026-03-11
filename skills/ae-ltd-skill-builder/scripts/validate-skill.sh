#!/usr/bin/env bash
#
# validate-skill.sh - Validate skill structure and frontmatter
# Checks YAML syntax, required fields, and best practices
#
# Usage:
#   ./validate-skill.sh                    # Validate all skills
#   ./validate-skill.sh ./my-skill         # Validate specific skill
#   ./validate-skill.sh --json             # Output as JSON
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

OUTPUT_JSON=false
SKILL_PATH="${1:-$HOME/.agents/skills}"

if [[ "$1" == "--json" ]]; then
    OUTPUT_JSON=true
    SKILL_PATH="$HOME/.agents/skills"
elif [[ "$2" == "--json" ]]; then
    OUTPUT_JSON=true
fi

python3 << 'PYTHON_SCRIPT'
import sys
import json
import re
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import List, Optional

@dataclass
class ValidationError:
    file: str
    line: Optional[int]
    code: str
    message: str
    severity: str  # error, warning, info

@dataclass
class ValidationResult:
    path: str
    valid: bool
    errors: List[ValidationError] = field(default_factory=list)
    warnings: List[ValidationError] = field(default_factory=list)

def split_frontmatter(text: str):
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, flags=re.S)
    if m:
        return m.group(1), m.group(2), True
    return "", text, False

def parse_yaml_simple(yaml_str: str) -> dict:
    """Simple YAML parser for frontmatter"""
    result = {}
    for line in yaml_str.splitlines():
        if ':' in line:
            key, _, value = line.partition(':')
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            result[key] = value
    return result

def get_field(fm: str, key: str) -> Optional[str]:
    pat = re.compile(rf"^{re.escape(key)}\s*:\s*(.*)$")
    for line in fm.splitlines():
        m = pat.match(line)
        if m:
            return m.group(1).strip().strip('"').strip("'")
    return None

def validate_skill(skill_path: Path) -> ValidationResult:
    result = ValidationResult(path=str(skill_path), valid=True)

    skill_md = skill_path / "SKILL.md"

    # Check SKILL.md exists
    if not skill_md.exists():
        result.errors.append(ValidationError(
            file=str(skill_md),
            line=None,
            code="MISSING_SKILL_MD",
            message="SKILL.md file is required",
            severity="error"
        ))
        result.valid = False
        return result

    text = skill_md.read_text(encoding="utf-8")
    lines = text.splitlines()

    # Check frontmatter
    fm, body, has_fm = split_frontmatter(text)

    if not has_fm:
        result.errors.append(ValidationError(
            file=str(skill_md),
            line=1,
            code="MISSING_FRONTMATTER",
            message="SKILL.md must start with YAML frontmatter (---)",
            severity="error"
        ))
        result.valid = False
        return result

    # Validate name field
    name = get_field(fm, "name")
    if not name:
        result.errors.append(ValidationError(
            file=str(skill_md),
            line=2,
            code="MISSING_NAME",
            message="Frontmatter must contain 'name' field",
            severity="error"
        ))
        result.valid = False
    else:
        # Check name matches directory
        expected_name = skill_path.name
        if name != expected_name:
            result.errors.append(ValidationError(
                file=str(skill_md),
                line=2,
                code="NAME_MISMATCH",
                message=f"Name '{name}' should match directory '{expected_name}'",
                severity="error"
            ))
            result.valid = False

        # Check name length
        if len(name) > 64:
            result.warnings.append(ValidationError(
                file=str(skill_md),
                line=2,
                code="NAME_TOO_LONG",
                message=f"Name exceeds 64 characters ({len(name)} chars)",
                severity="warning"
            ))

    # Validate description field
    desc = get_field(fm, "description")
    if not desc:
        result.errors.append(ValidationError(
            file=str(skill_md),
            line=3,
            code="MISSING_DESCRIPTION",
            message="Frontmatter must contain 'description' field",
            severity="error"
        ))
        result.valid = False
    else:
        # Check description length
        if len(desc) > 1024:
            result.warnings.append(ValidationError(
                file=str(skill_md),
                line=3,
                code="DESCRIPTION_TOO_LONG",
                message=f"Description exceeds 1024 characters ({len(desc)} chars)",
                severity="warning"
            ))

        # Check for "when" trigger
        if "when" not in desc.lower() and "use" not in desc.lower():
            result.warnings.append(ValidationError(
                file=str(skill_md),
                line=3,
                code="DESCRIPTION_NO_TRIGGER",
                message="Description should include 'when' or 'use' for trigger conditions",
                severity="warning"
            ))

    # Check content structure
    body_lower = body.lower()

    required_sections = ["what this skill does"]
    for section in required_sections:
        if section not in body_lower:
            result.warnings.append(ValidationError(
                file=str(skill_md),
                line=None,
                code="MISSING_SECTION",
                message=f"Recommended section '{section}' not found",
                severity="warning"
            ))

    recommended_sections = ["quick start", "troubleshooting"]
    for section in recommended_sections:
        if section not in body_lower:
            result.warnings.append(ValidationError(
                file=str(skill_md),
                line=None,
                code="RECOMMENDED_SECTION",
                message=f"Consider adding '{section}' section",
                severity="info"
            ))

    return result

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("path", nargs="?", default=None)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    root = Path(args.path) if args.path else Path.home() / ".agents" / "skills"

    if not root.exists():
        print(f"Error: Path does not exist: {root}", file=sys.stderr)
        sys.exit(1)

    results = []
    skill_count = 0
    valid_count = 0
    error_count = 0
    warning_count = 0

    # Check if validating single skill or all skills
    if (root / "SKILL.md").exists():
        # Single skill
        result = validate_skill(root)
        results.append(result)
        skill_count = 1
        if result.valid:
            valid_count = 1
        error_count = len(result.errors)
        warning_count = len(result.warnings)
    else:
        # All skills
        for skill_dir in sorted(root.iterdir()):
            if skill_dir.is_dir() and (skill_dir / "SKILL.md").exists():
                result = validate_skill(skill_dir)
                results.append(result)
                skill_count += 1
                if result.valid:
                    valid_count += 1
                error_count += len(result.errors)
                warning_count += len(result.warnings)

    if args.json:
        output = {
            "summary": {
                "total": skill_count,
                "valid": valid_count,
                "errors": error_count,
                "warnings": warning_count
            },
            "results": [
                {
                    "path": r.path,
                    "valid": r.valid,
                    "errors": [asdict(e) for e in r.errors],
                    "warnings": [asdict(e) for e in r.warnings]
                }
                for r in results
            ]
        }
        print(json.dumps(output, indent=2))
    else:
        # Human-readable output
        RED = '\033[0;31m'
        GREEN = '\033[0;32m'
        YELLOW = '\033[1;33m'
        BLUE = '\033[0;34m'
        NC = '\033[0m'

        print(f"{BLUE}=== Skill Validation Report ==={NC}\n")

        for result in results:
            status = f"{GREEN}✓{NC}" if result.valid else f"{RED}✗{NC}"
            name = Path(result.path).name
            print(f"{status} {name}")

            for err in result.errors:
                line_info = f":{err.line}" if err.line else ""
                print(f"  {RED}ERROR{NC} [{err.code}] {err.message}")

            for warn in result.warnings:
                line_info = f":{warn.line}" if warn.line else ""
                print(f"  {YELLOW}WARN{NC} [{warn.code}] {warn.message}")

        print(f"\n{BLUE}Summary:{NC}")
        print(f"  Total skills: {skill_count}")
        print(f"  Valid: {GREEN}{valid_count}{NC}")
        print(f"  Errors: {RED}{error_count}{NC}")
        print(f"  Warnings: {YELLOW}{warning_count}{NC}")

    # Exit with error code if any errors
    sys.exit(0 if error_count == 0 else 1)

if __name__ == "__main__":
    main()
PYTHON_SCRIPT
