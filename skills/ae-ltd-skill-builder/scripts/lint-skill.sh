#!/usr/bin/env bash
#
# lint-skill.sh - Check skill content quality and best practices
# Analyzes content structure, readability, and Claude optimization
#
# Usage:
#   ./lint-skill.sh                    # Lint all skills
#   ./lint-skill.sh ./my-skill         # Lint specific skill
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SKILL_PATH="${1:-$HOME/.agents/skills}"

python3 << 'PYTHON_SCRIPT'
import sys
import re
from pathlib import Path
from dataclasses import dataclass
from typing import List

@dataclass
class LintResult:
    category: str
    metric: str
    value: any
    status: str  # pass, warn, fail
    suggestion: str

def split_frontmatter(text: str):
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, flags=re.S)
    if m:
        return m.group(1), m.group(2), True
    return "", text, False

def get_field(fm: str, key: str) -> str:
    pat = re.compile(rf"^{re.escape(key)}\s*:\s*(.*)$")
    for line in fm.splitlines():
        m = pat.match(line)
        if m:
            return m.group(1).strip().strip('"').strip("'")
    return ""

def lint_skill(skill_path: Path) -> List[LintResult]:
    results = []
    skill_md = skill_path / "SKILL.md"

    if not skill_md.exists():
        return [LintResult("structure", "SKILL.md exists", False, "fail", "Create SKILL.md")]

    text = skill_md.read_text(encoding="utf-8")
    fm, body, has_fm = split_frontmatter(text)

    # ===== STRUCTURE =====

    # Check file size
    size_kb = len(text.encode('utf-8')) / 1024
    if size_kb < 1:
        results.append(LintResult("structure", "File size", f"{size_kb:.1f}KB", "warn", "Content may be too brief"))
    elif size_kb > 20:
        results.append(LintResult("structure", "File size", f"{size_kb:.1f}KB", "warn", "Consider splitting into docs/"))
    else:
        results.append(LintResult("structure", "File size", f"{size_kb:.1f}KB", "pass", ""))

    # Check sections
    sections = re.findall(r'^##\s+(.+)$', body, re.M)
    results.append(LintResult("structure", "H2 sections", len(sections), "pass" if len(sections) >= 3 else "warn",
                              "Add more sections for better structure" if len(sections) < 3 else ""))

    # Check code blocks
    code_blocks = len(re.findall(r'```', body)) // 2
    results.append(LintResult("structure", "Code blocks", code_blocks, "pass" if code_blocks >= 1 else "warn",
                              "Add code examples" if code_blocks < 1 else ""))

    # ===== CONTENT QUALITY =====

    # Check for "What This Skill Does" section
    has_overview = bool(re.search(r'##\s+what\s+this\s+skill\s+does', body, re.I))
    results.append(LintResult("content", "Overview section", has_overview, "pass" if has_overview else "warn",
                              "Add '## What This Skill Does' section" if not has_overview else ""))

    # Check for Quick Start
    has_quickstart = bool(re.search(r'##\s+quick\s*start', body, re.I))
    results.append(LintResult("content", "Quick Start section", has_quickstart, "pass" if has_quickstart else "warn",
                              "Add '## Quick Start' section" if not has_quickstart else ""))

    # Check for troubleshooting
    has_troubleshooting = bool(re.search(r'##\s+troubleshooting', body, re.I))
    results.append(LintResult("content", "Troubleshooting section", has_troubleshooting, "pass" if has_troubleshooting else "info",
                              "Consider adding troubleshooting" if not has_troubleshooting else ""))

    # Check for step-by-step
    has_steps = bool(re.search(r'##\s+step.by.step|###\s+step\s*\d+', body, re.I))
    results.append(LintResult("content", "Step-by-step guide", has_steps, "pass" if has_steps else "info",
                              "Add step-by-step instructions" if not has_steps else ""))

    # ===== PROGRESSIVE DISCLOSURE =====

    # Check for Level markers
    has_levels = bool(re.search(r'level\s*\d+|###\s+step', body, re.I))
    results.append(LintResult("disclosure", "Progressive structure", has_levels, "pass" if has_levels else "info",
                              "Structure content in levels" if not has_levels else ""))

    # Check for external file references
    has_refs = bool(re.search(r'\[.*\]\([^)]+\.md\)|resources/|docs/|scripts/', body, re.I))
    results.append(LintResult("disclosure", "External references", has_refs, "pass" if has_refs else "info",
                              "Reference external files for large content" if not has_refs else ""))

    # ===== DESCRIPTION QUALITY =====

    desc = get_field(fm, "description")

    # Check for trigger words
    trigger_words = ["when", "use for", "use when", "use if", "invoke", "trigger"]
    has_trigger = any(w in desc.lower() for w in trigger_words)
    results.append(LintResult("description", "Trigger conditions", has_trigger, "pass" if has_trigger else "warn",
                              "Add 'Use when...' to description" if not has_trigger else ""))

    # Check description length
    desc_len = len(desc)
    if desc_len < 50:
        results.append(LintResult("description", "Description length", f"{desc_len} chars", "warn",
                                  "Description too short - add more detail"))
    elif desc_len > 200:
        results.append(LintResult("description", "Description length", f"{desc_len} chars", "warn",
                                  "Consider shortening for better matching"))
    else:
        results.append(LintResult("description", "Description length", f"{desc_len} chars", "pass", ""))

    # ===== CLAUDE OPTIMIZATION =====

    # Check for imperative instructions
    imperative_patterns = [r'\bcreate\b', r'\bgenerate\b', r'\bbuild\b', r'\bimplement\b', r'\badd\b', r'\bconfigure\b']
    has_imperatives = any(re.search(p, body, re.I) for p in imperative_patterns)
    results.append(LintResult("claude", "Actionable language", has_imperatives, "pass" if has_imperatives else "warn",
                              "Use imperative verbs in instructions" if not has_imperatives else ""))

    # Check for examples
    has_examples = bool(re.search(r'example|sample|demo', body, re.I))
    results.append(LintResult("claude", "Examples present", has_examples, "pass" if has_examples else "warn",
                              "Add concrete examples" if not has_examples else ""))

    # Check for expected output
    has_expected = bool(re.search(r'expected\s+output|result|output:', body, re.I))
    results.append(LintResult("claude", "Expected outputs", has_expected, "pass" if has_expected else "info",
                              "Document expected outputs" if not has_expected else ""))

    return results

def main():
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / ".agents" / "skills"

    if not root.exists():
        print(f"Error: Path does not exist: {root}", file=sys.stderr)
        sys.exit(1)

    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    NC = '\033[0m'

    print(f"{CYAN}╔════════════════════════════════════════════════════════════════╗{NC}")
    print(f"{CYAN}║                    Skill Lint Report                           ║{NC}")
    print(f"{CYAN}╚════════════════════════════════════════════════════════════════╝{NC}\n")

    skills = []
    if (root / "SKILL.md").exists():
        skills = [root]
    else:
        skills = sorted([d for d in root.iterdir() if d.is_dir() and (d / "SKILL.md").exists()])

    total_score = 0
    max_score = 0

    for skill_path in skills:
        name = skill_path.name
        results = lint_skill(skill_path)

        # Calculate score
        passes = sum(1 for r in results if r.status == "pass")
        warns = sum(1 for r in results if r.status == "warn")
        fails = sum(1 for r in results if r.status == "fail")
        score = int((passes / len(results)) * 100) if results else 0

        total_score += score
        max_score += 100

        # Print header
        score_color = GREEN if score >= 80 else YELLOW if score >= 60 else RED
        print(f"\n{BLUE}━━━ {name} {score_color}[{score}%]{NC} {BLUE}━━━{NC}\n")

        # Group by category
        categories = {}
        for r in results:
            if r.category not in categories:
                categories[r.category] = []
            categories[r.category].append(r)

        for cat, cat_results in categories.items():
            print(f"  {cat.upper()}")
            for r in cat_results:
                if r.status == "pass":
                    icon = f"{GREEN}✓{NC}"
                elif r.status == "warn":
                    icon = f"{YELLOW}!{NC}"
                elif r.status == "fail":
                    icon = f"{RED}✗{NC}"
                else:
                    icon = f"{BLUE}i{NC}"

                print(f"    {icon} {r.metric}: {r.value}")
                if r.suggestion:
                    print(f"        {YELLOW}→ {r.suggestion}{NC}")
            print()

    if len(skills) > 1:
        avg_score = int(total_score / len(skills))
        avg_color = GREEN if avg_score >= 80 else YELLOW if avg_score >= 60 else RED
        print(f"\n{BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{NC}")
        print(f"Average Score: {avg_color}{avg_score}%{NC} across {len(skills)} skills")

if __name__ == "__main__":
    main()
PYTHON_SCRIPT
