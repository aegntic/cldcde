#!/usr/bin/env python3
"""
Beads Sync Script
Synchronizes Beads workflow with git
"""

import json
import sys
import os
import subprocess
from pathlib import Path
from typing import Dict, List

def load_beads_data():
    """Load Beads data"""
    beads_dir = Path('.beads')
    if not beads_dir.exists():
        print("❌ Beads directory not found. Run 'bd init' first.")
        sys.exit(1)

    issues_file = beads_dir / 'issues.json'
    if not issues_file.exists():
        print("❌ No Beads issues found.")
        sys.exit(1)

    with open(issues_file, 'r') as f:
        return json.load(f)

def sync_with_git(issues: List[Dict]):
    """Synchronize Beads with git"""
    print("🔄 Synchronizing Beads with git...")

    try:
        # Check git status
        result = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True)
        if result.returncode != 0:
            print("❌ Git not available or repository not found")
            sys.exit(1)

        # Save current Beads state
        beads_dir = Path('.beads')
        backup_file = beads_dir / 'issues_backup.json'
        with open(backup_file, 'w') as f:
            json.dump(issues, f, indent=2)

        print(f"💾 Backup created: {backup_file}")

        # Commit Beads changes
        subprocess.run(['git', 'add', '.beads/'], check=True)
        subprocess.run(['git', 'commit', '-m', 'Beads workflow sync'], check=True)

        print("✅ Beads synchronized with git")

    except subprocess.CalledProcessError as e:
        print(f"❌ Sync failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

def main():
    """Main sync function"""
    print("🔄 Synchronizing Beads workflow with git...")

    try:
        issues = load_beads_data()
        sync_with_git(issues)

        print("✅ Beads sync completed successfully")

    except Exception as e:
        print(f"❌ Sync failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()