#!/usr/bin/env python3
"""
Debt-Sentinel: Architectural Pattern Enforcer
Prevents technical debt by blocking anti-patterns before they enter the codebase

Usage:
    python3 debt-sentinel.py --check <file_path> [content]
    python3 debt-sentinel.py --init
    python3 debt-sentinel.py --session-end
"""

import sys
import re
import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple

# Configuration
PLUGIN_DIR = Path("/a0/usr/plugins/debt-sentinel")
ANTI_PATTERNS_FILE = PLUGIN_DIR / "ANTI_PATTERNS.md"
DEBT_FILE = PLUGIN_DIR / "DEBT.md"
SESSION_LOG = PLUGIN_DIR / ".session_debt.json"
ARCHITECTURE_FILE = PLUGIN_DIR / "ARCHITECTURE.md"


class DebtSentinel:
    def __init__(self):
        self.patterns = self._load_patterns()
        self.session_debt = self._load_session_debt()

    def _load_patterns(self) -> List[Dict]:
        """Parse ANTI_PATTERNS.md and extract pattern definitions"""
        patterns = []

        if not ANTI_PATTERNS_FILE.exists():
            return patterns

        content = ANTI_PATTERNS_FILE.read_text()
        sections = content.split("---")

        for section in sections:
            pattern = self._parse_pattern_section(section)
            if pattern:
                patterns.append(pattern)

        return patterns

    def _parse_pattern_section(self, section: str) -> Dict | None:
        """Parse a single pattern section from markdown"""
        lines = section.strip().split("\n")
        pattern = {}

        for line in lines:
            line = line.strip()
            if line.startswith("### "):
                pattern["id"] = line.replace("### ", "").strip()
            elif line.startswith("**Severity:**"):
                pattern["severity"] = line.replace("**Severity:**", "").strip()
            elif line.startswith("**Interest Rate:**"):
                try:
                    pattern["interest_rate"] = int(
                        line.replace("**Interest Rate:**", "").strip()
                    )
                except:
                    pattern["interest_rate"] = 5
            elif line.startswith("**Regex:**"):
                regex_str = line.replace("**Regex:**", "").strip()
                if regex_str and regex_str != "N/A":
                    try:
                        pattern["regex"] = re.compile(regex_str, re.IGNORECASE)
                    except re.error:
                        pass
            elif line.startswith("**Description:**"):
                pattern["description"] = line.replace("**Description:**", "").strip()
            elif line.startswith("**Fix Suggestion:**"):
                pattern["fix"] = line.replace("**Fix Suggestion:**", "").strip()

        return pattern if "id" in pattern else None

    def _load_session_debt(self) -> Dict:
        """Load current session debt tracking"""
        if SESSION_LOG.exists():
            try:
                return json.loads(SESSION_LOG.read_text())
            except:
                pass
        return {"violations": [], "start_time": datetime.now().isoformat()}

    def check_content(self, file_path: str, content: str) -> Tuple[bool, List[Dict]]:
        """
        Check content against all patterns
        Returns: (is_valid, list_of_violations)
        """
        violations = []

        for pattern in self.patterns:
            if "regex" in pattern and pattern["regex"]:
                matches = pattern["regex"].findall(content)
                if matches:
                    violations.append(
                        {
                            "pattern_id": pattern.get("id", "UNKNOWN"),
                            "severity": pattern.get("severity", "warning"),
                            "interest_rate": pattern.get("interest_rate", 5),
                            "description": pattern.get("description", ""),
                            "fix": pattern.get("fix", ""),
                            "file": file_path,
                            "matches": len(matches),
                            "timestamp": datetime.now().isoformat(),
                        }
                    )

        # Critical violations block the edit
        has_critical = any(v["severity"] == "critical" for v in violations)

        return not has_critical, violations

    def log_violation(self, violation: Dict, overridden: bool = False):
        """Log a violation to the debt ledger"""
        violation["overridden"] = overridden
        violation["debt_score"] = violation["interest_rate"] * (2 if overridden else 1)

        self.session_debt["violations"].append(violation)
        self._save_session_debt()

        # Also append to DEBT.md
        self._append_to_debt_md(violation)

    def _append_to_debt_md(self, violation: Dict):
        """Append violation to DEBT.md ledger"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        entry = f"""
## Debt Entry - {timestamp}

**Pattern:** {violation["pattern_id"]}  
**Severity:** {violation["severity"]}  
**File:** {violation["file"]}  
**Interest Rate:** {violation["interest_rate"]}/10  
**Overridden:** {"Yes" if violation["overridden"] else "No"}  
**Debt Score:** {violation["debt_score"]}  

**Description:**  
{violation["description"]}

**Fix Suggestion:**  
{violation["fix"]}

---
"""

        with open(DEBT_FILE, "a") as f:
            f.write(entry)

    def _save_session_debt(self):
        """Save session debt to log file"""
        SESSION_LOG.write_text(json.dumps(self.session_debt, indent=2))

    def calculate_session_score(self) -> Tuple[int, int, int]:
        """Calculate session debt statistics
        Returns: (total_score, critical_count, warning_count)
        """
        total_score = sum(
            v.get("debt_score", 0) for v in self.session_debt["violations"]
        )
        critical = sum(
            1 for v in self.session_debt["violations"] if v["severity"] == "critical"
        )
        warnings = sum(
            1 for v in self.session_debt["violations"] if v["severity"] == "warning"
        )

        return total_score, critical, warnings

    def session_end_report(self):
        """Generate end-of-session report"""
        score, critical, warnings = self.calculate_session_score()

        report = f"""
╔══════════════════════════════════════════════════════════════╗
║              DEBT SENTINEL - SESSION REPORT                  ║
╚══════════════════════════════════════════════════════════════╝

Session Duration: {self.session_debt.get("start_time", "Unknown")}
Total Debt Score: {score}
Critical Violations: {critical}
Warning Violations: {warnings}

"""

        if critical > 0:
            report += f"""
⚠️  WARNING: You accumulated {critical} CRITICAL debt items!
   These represent severe architectural violations.
   
   Would you like me to spawn a cleanup agent to refactor them?
   Type: /debt-cleanup to auto-fix critical issues
"""
        elif warnings > 3:
            report += f"""
💡 You accumulated {warnings} warning-level debt items.
   Consider addressing these before they accumulate interest.
   
   Run: /debt-review to see all issues
"""
        else:
            report += "✅ Clean session! No significant debt accumulated.\n"

        print(report)
        return report


def main():
    sentinel = DebtSentinel()

    if len(sys.argv) < 2:
        print(
            "Usage: debt-sentinel.py --check <file> [content] | --init | --session-end"
        )
        sys.exit(1)

    command = sys.argv[1]

    if command == "--init":
        # Initialize plugin
        PLUGIN_DIR.mkdir(parents=True, exist_ok=True)
        if not DEBT_FILE.exists():
            DEBT_FILE.write_text("# Technical Debt Ledger\n\n")
        print("✅ Debt-Sentinel initialized")
        print(f"   Patterns loaded: {len(sentinel.patterns)}")
        print(f"   Config directory: {PLUGIN_DIR}")

    elif command == "--check":
        if len(sys.argv) < 3:
            print("Error: --check requires file path")
            sys.exit(1)

        file_path = sys.argv[2]
        content = sys.argv[3] if len(sys.argv) > 3 else ""

        # If no content provided, read from stdin
        if not content:
            content = sys.stdin.read()

        is_valid, violations = sentinel.check_content(file_path, content)

        if violations:
            print(f"\n🚨 DEBT SENTINEL ALERT - {len(violations)} violation(s) found:\n")
            for v in violations:
                print(f"  ❌ [{v['severity'].upper()}] {v['pattern_id']}")
                print(f"     {v['description']}")
                print(f"     Fix: {v['fix']}\n")

                # Log the violation
                sentinel.log_violation(v, overridden=False)

            if not is_valid:
                print(
                    "⛔ BLOCKED: Critical violations must be fixed before proceeding."
                )
                print("   To override (not recommended): Use --force flag")
                sys.exit(1)
        else:
            print("✅ No architectural violations detected")
            sys.exit(0)

    elif command == "--session-end":
        sentinel.session_end_report()

    else:
        print(f"Unknown command: {command}")
        sys.exit(1)


if __name__ == "__main__":
    main()
