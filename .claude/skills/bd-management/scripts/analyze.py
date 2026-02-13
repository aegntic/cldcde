#!/usr/bin/env python3
"""
Beads Workflow Analysis Script
Analyzes task dependencies and identifies optimization opportunities
"""

import json
import sys
import os
from pathlib import Path
from typing import Dict, List, Set, Optional

def load_beads_data():
    """Load Beads data from .beads directory"""
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

def analyze_dependencies(issues: List[Dict]) -> Dict:
    """Analyze task dependencies and identify blocking issues"""
    blocking_issues = []
    ready_issues = []
    dependency_map = {}

    # Build dependency map
    for issue in issues:
        issue_id = issue.get('id')
        depends_on = issue.get('deps', {}).get('blocks', [])
        dependency_map[issue_id] = depends_on

    # Analyze each issue
    for issue in issues:
        issue_id = issue.get('id')
        status = issue.get('status', 'open')

        if status == 'blocked':
            blocking_issues.append(issue)
        elif status == 'open':
            # Check if this issue is blocked by others
            is_blocked = False
            for other_issue in issues:
                if other_issue.get('id') != issue_id and issue_id in dependency_map.get(other_issue.get('id'), []):
                    is_blocked = True
                    break

            if not is_blocked:
                ready_issues.append(issue)

    return {
        'blocking_issues': blocking_issues,
        'ready_issues': ready_issues,
        'dependency_map': dependency_map,
        'total_issues': len(issues),
        'ready_count': len(ready_issues),
        'blocked_count': len(blocking_issues)
    }

def find_parallel_groups(issues: List[Dict], dependency_map: Dict) -> List[List[Dict]]:
    """Find groups of issues that can be executed in parallel"""
    parallel_groups = []
    remaining_issues = issues.copy()

    while remaining_issues:
        current_group = []
        issues_to_remove = []

        for issue in remaining_issues:
            issue_id = issue.get('id')
            # Check if this issue depends on any issue in current group
            can_add = True
            for other_issue in current_group:
                other_id = other_issue.get('id')
                if issue_id in dependency_map.get(other_id, []):
                    can_add = False
                    break

            if can_add:
                current_group.append(issue)
                issues_to_remove.append(issue)

        if current_group:
            parallel_groups.append(current_group)
            for issue in issues_to_remove:
                remaining_issues.remove(issue)
        else:
            # No more parallel groups possible
            break

    return parallel_groups

def main():
    """Main analysis function"""
    print("🔍 Analyzing Beads workflow...")

    try:
        issues = load_beads_data()
        analysis = analyze_dependencies(issues)

        print(f"\n📊 Workflow Analysis Results:")
        print(f"Total issues: {analysis['total_issues']}")
        print(f"Ready for execution: {analysis['ready_count']}")
        print(f"Blocked issues: {analysis['blocked_count']}")

        if analysis['blocked_count'] > 0:
            print(f"\n⚠️  Blocked Issues:")
            for issue in analysis['blocking_issues'][:3]:  # Show first 3
                print(f"  - {issue.get('title', 'Untitled')} (ID: {issue.get('id')})")
            if len(analysis['blocking_issues']) > 3:
                print(f"  ... and {len(analysis['blocking_issues']) - 3} more")

        if analysis['ready_count'] > 0:
            print(f"\n✅ Ready for Execution:")
            for issue in analysis['ready_issues'][:3]:  # Show first 3
                print(f"  - {issue.get('title', 'Untitled')} (ID: {issue.get('id')})")
            if len(analysis['ready_issues']) > 3:
                print(f"  ... and {len(analysis['ready_issues']) - 3} more")

        # Find parallel execution groups
        parallel_groups = find_parallel_groups(issues, analysis['dependency_map'])
        print(f"\n🚀 Parallel Execution Groups: {len(parallel_groups)}")
        for i, group in enumerate(parallel_groups[:2]):  # Show first 2 groups
            print(f"  Group {i+1}: {len(group)} tasks")
            for issue in group[:2]:  # Show first 2 in each group
                print(f"    - {issue.get('title', 'Untitled')} (ID: {issue.get('id')})")
            if len(group) > 2:
                print(f"    ... and {len(group) - 2} more")
        if len(parallel_groups) > 2:
            print(f"  ... and {len(parallel_groups) - 2} more groups")

        # Save analysis results
        output_file = Path('.beads') / 'workflow_analysis.json'
        with open(output_file, 'w') as f:
            json.dump(analysis, f, indent=2)

        print(f"\n📁 Analysis saved to: {output_file}")

    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()