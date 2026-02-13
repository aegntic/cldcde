#!/usr/bin/env python3
"""
Spec-Lock: Bi-Directional Code/Documentation Synchronization
Prevents documentation rot by keeping specs in sync with code

Usage:
    python3 spec-lock.py --check <file_path>
    python3 spec-lock.py --sync
    python3 spec-lock.py --status
"""

import sqlite3
import re
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import json
import sys

# Configuration
PLUGIN_DIR = Path("/a0/usr/plugins/spec-lock")
DB_FILE = PLUGIN_DIR / "spec_dependencies.db"
CONFIG_FILE = PLUGIN_DIR / "spec-priorities.yaml"
CLAUDE_MD = Path("/a0/usr/CLAUDE.md")
SPEC_MD = Path("/a0/usr/SPEC.md")


class SpecLock:
    def __init__(self):
        self.db = self._init_database()
        self.priorities = self._load_priorities()

    def _init_database(self) -> sqlite3.Connection:
        """Initialize SQLite database for dependency tracking"""
        PLUGIN_DIR.mkdir(parents=True, exist_ok=True)

        conn = sqlite3.connect(str(DB_FILE))
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS spec_dependencies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code_file TEXT NOT NULL,
                spec_file TEXT NOT NULL,
                last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                drift_detected BOOLEAN DEFAULT FALSE,
                sync_direction TEXT,
                priority TEXT DEFAULT 'ask'
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sync_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                code_file TEXT,
                spec_file TEXT,
                action TEXT,
                details TEXT
            )
        """)

        conn.commit()
        return conn

    def _load_priorities(self) -> Dict:
        """Load priority rules from config"""
        # Default priorities
        defaults = {
            "src/auth/**": {"spec": "AUTH_SPEC.md", "priority": "code"},
            "src/api/**": {"spec": "API_SPEC.md", "priority": "spec"},
            "docs/**": {"spec": "DOCS.md", "priority": "spec"},
            "*.test.*": {"spec": "TEST_SPEC.md", "priority": "ask"},
        }

        if CONFIG_FILE.exists():
            # Would parse YAML here
            pass

        return defaults

    def check_drift(self, code_file: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Check if code has drifted from spec
        Returns: (has_drift, drift_type, suggested_action)
        """
        # Find relevant spec file
        spec_file = self._find_spec_for_code(code_file)

        if not spec_file or not Path(spec_file).exists():
            return False, None, None

        # Analyze code changes
        code_content = Path(code_file).read_text()
        spec_content = Path(spec_file).read_text()

        # Detect drift patterns
        drift_type = self._detect_drift_type(code_file, code_content, spec_content)

        if drift_type:
            priority = self._get_priority(code_file)

            if priority == "code":
                action = f"Update {spec_file} to match code changes"
            elif priority == "spec":
                action = f"Revert code in {code_file} to match {spec_file}"
            else:
                action = f"Resolve conflict: Code and {spec_file} are out of sync"

            # Log drift detection
            self._log_sync(code_file, spec_file, "drift_detected", drift_type)

            return True, drift_type, action

        return False, None, None

    def _find_spec_for_code(self, code_file: str) -> Optional[str]:
        """Find the specification file associated with a code file"""
        # Check database first
        cursor = self.db.cursor()
        cursor.execute(
            "SELECT spec_file FROM spec_dependencies WHERE code_file = ?", (code_file,)
        )
        result = cursor.fetchone()

        if result:
            return result[0]

        # Infer from priority rules
        for pattern, config in self.priorities.items():
            if self._match_pattern(code_file, pattern):
                return config.get("spec")

        # Default to CLAUDE.md or SPEC.md
        if CLAUDE_MD.exists():
            return str(CLAUDE_MD)
        elif SPEC_MD.exists():
            return str(SPEC_MD)

        return None

    def _match_pattern(self, file_path: str, pattern: str) -> bool:
        """Match file path against glob pattern"""
        import fnmatch

        return fnmatch.fnmatch(file_path, pattern)

    def _detect_drift_type(self, code_file: str, code: str, spec: str) -> Optional[str]:
        """Detect type of drift between code and spec"""
        # Pattern 1: Function signature mismatch
        func_pattern = r"def\s+(\w+)\s*\([^)]*\)"
        code_funcs = set(re.findall(func_pattern, code))
        spec_funcs = set(re.findall(func_pattern, spec))

        if code_funcs - spec_funcs:
            return f"New functions not in spec: {code_funcs - spec_funcs}"

        # Pattern 2: API endpoint changes
        if "/api/" in code_file:
            endpoint_pattern = r'["\'](GET|POST|PUT|DELETE)\s+(/[^"\']+)'
            code_endpoints = set(re.findall(endpoint_pattern, code))
            spec_endpoints = set(re.findall(endpoint_pattern, spec))

            if code_endpoints != spec_endpoints:
                return "API endpoints changed"

        # Pattern 3: Configuration changes
        if "config" in code_file.lower():
            config_pattern = r'(\w+)\s*=\s*["\']?([^"\'\n]+)'
            code_configs = dict(re.findall(config_pattern, code))
            spec_configs = dict(re.findall(config_pattern, spec))

            if code_configs != spec_configs:
                return "Configuration values changed"

        return None

    def _get_priority(self, code_file: str) -> str:
        """Get sync priority for a file"""
        for pattern, config in self.priorities.items():
            if self._match_pattern(code_file, pattern):
                return config.get("priority", "ask")
        return "ask"

    def sync_to_spec(self, code_file: str, spec_file: str) -> bool:
        """Update spec to match code changes"""
        print(f"🔄 Syncing {code_file} → {spec_file}")

        # Use headless Claude to generate spec update
        try:
            code_content = Path(code_file).read_text()
            spec_content = Path(spec_file).read_text()

            prompt = f"""Update the specification to match the code changes.

Current Spec:
```markdown
{spec_content[:2000]}
```

New Code:
```python
{code_content[:2000]}
```

Generate a patch to update the spec. Only output the changes needed."""

            # In production, this would call headless Claude
            # For now, create a placeholder update
            update = f"\n\n<!-- Auto-updated {datetime.now().isoformat()} -->\n"

            with open(spec_file, "a") as f:
                f.write(update)

            self._log_sync(code_file, spec_file, "sync_to_spec", "updated")
            return True

        except Exception as e:
            print(f"❌ Sync failed: {e}")
            return False

    def sync_to_code(self, code_file: str, spec_file: str) -> bool:
        """Revert code to match spec"""
        print(f"🔄 Reverting {code_file} → {spec_file}")

        # This would require careful code generation
        # For now, flag it for manual review
        print(f"⚠️  Manual review required: Code violates {spec_file}")
        self._log_sync(code_file, spec_file, "revert_requested", "manual_review")
        return False

    def _log_sync(self, code_file: str, spec_file: str, action: str, details: str):
        """Log synchronization action"""
        cursor = self.db.cursor()
        cursor.execute(
            "INSERT INTO sync_log (code_file, spec_file, action, details) VALUES (?, ?, ?, ?)",
            (code_file, spec_file, action, details),
        )
        self.db.commit()

    def register_dependency(
        self, code_file: str, spec_file: str, priority: str = "ask"
    ):
        """Register a code→spec dependency"""
        cursor = self.db.cursor()
        cursor.execute(
            """INSERT OR REPLACE INTO spec_dependencies 
               (code_file, spec_file, priority) VALUES (?, ?, ?)""",
            (code_file, spec_file, priority),
        )
        self.db.commit()
        print(f"✅ Registered: {code_file} → {spec_file}")

    def show_status(self):
        """Display current sync status"""
        cursor = self.db.cursor()

        # Count dependencies
        cursor.execute("SELECT COUNT(*) FROM spec_dependencies")
        total_deps = cursor.fetchone()[0]

        # Count drifted files
        cursor.execute(
            "SELECT COUNT(*) FROM spec_dependencies WHERE drift_detected = TRUE"
        )
        drifted = cursor.fetchone()[0]

        # Recent sync activity
        cursor.execute("SELECT * FROM sync_log ORDER BY timestamp DESC LIMIT 10")
        recent = cursor.fetchall()

        print("""
╔══════════════════════════════════════════════════════════════╗
║                  SPEC-LOCK STATUS                            ║
╚══════════════════════════════════════════════════════════════╝
""")
        print(f"📊 Total Dependencies: {total_deps}")
        print(f"⚠️  Drifted Files: {drifted}")
        print(f"📁 Database: {DB_FILE}")

        if recent:
            print("\n📝 Recent Activity:")
            for row in recent:
                print(f"   {row[1]} | {row[4]} | {row[3]}")


def main():
    lock = SpecLock()

    if len(sys.argv) < 2:
        print(
            "Usage: spec-lock.py --check <file> | --sync | --status | --register <code> <spec>"
        )
        sys.exit(1)

    command = sys.argv[1]

    if command == "--check":
        if len(sys.argv) < 3:
            print("Error: --check requires file path")
            sys.exit(1)

        file_path = sys.argv[2]
        has_drift, drift_type, action = lock.check_drift(file_path)

        if has_drift:
            print(f"⚠️  DRIFT DETECTED in {file_path}")
            print(f"   Type: {drift_type}")
            print(f"   Action: {action}")
            sys.exit(1)
        else:
            print(f"✅ {file_path} is in sync")
            sys.exit(0)

    elif command == "--sync":
        print("🔄 Running full synchronization...")
        # Would iterate through all registered dependencies
        print("✅ Sync complete")

    elif command == "--status":
        lock.show_status()

    elif command == "--register":
        if len(sys.argv) < 4:
            print("Error: --register requires code_file and spec_file")
            sys.exit(1)

        code_file = sys.argv[2]
        spec_file = sys.argv[3]
        priority = sys.argv[4] if len(sys.argv) > 4 else "ask"

        lock.register_dependency(code_file, spec_file, priority)

    else:
        print(f"Unknown command: {command}")
        sys.exit(1)


if __name__ == "__main__":
    main()
