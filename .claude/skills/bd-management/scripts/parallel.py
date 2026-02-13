#!/usr/bin/env python3
"""
Beads Parallel Execution Script
Executes tasks in parallel when dependencies allow
"""

import json
import sys
import os
import subprocess
import threading
from pathlib import Path
from typing import Dict, List

def load_optimization_data():
    """Load workflow optimization data"""
    optimization_file = Path('.beads') / 'workflow_optimization.json'
    if not optimization_file.exists():
        print("❌ No workflow optimization data found. Run 'scripts/optimize.py' first.")
        sys.exit(1)

    with open(optimization_file, 'r') as f:
        return json.load(f)

def execute_task(task: Dict):
    """Execute a single task"""
    task_id = task.get('id', 'unknown')
    task_title = task.get('title', 'Untitled')

    print(f"🚀 Starting task: {task_title} (ID: {task_id})")

    # In a real implementation, this would execute the actual task
    # For now, simulate task execution
    try:
        # Simulate task execution with a delay
        import time
        time.sleep(2)  # Simulate work

        print(f"✅ Completed task: {task_title} (ID: {task_id})")
        return True
    except Exception as e:
        print(f"❌ Task failed: {task_title} (ID: {task_id}) - {e}")
        return False

def execute_parallel_groups(parallel_groups: List[List[Dict]]):
    """Execute tasks in parallel groups"""
    threads = []
    results = []

    for group_index, group in enumerate(parallel_groups):
        print(f"\n🔄 Executing parallel group {group_index + 1} with {len(group)} tasks:")

        group_threads = []
        for task in group:
            thread = threading.Thread(
                target=lambda t=task: results.append(execute_task(t)),
                daemon=True
            )
            group_threads.append(thread)
            thread.start()

        # Wait for all threads in this group to complete
        for thread in group_threads:
            thread.join()

        print(f"✅ Group {group_index + 1} completed")

    return results

def main():
    """Main parallel execution function"""
    print("🚀 Executing Beads tasks in parallel...")

    try:
        optimized = load_optimization_data()
        parallel_groups = optimized.get('parallel_groups', [])

        if not parallel_groups:
            print("❌ No parallel execution groups found. Run optimization first.")
            sys.exit(1)

        print(f"📊 Found {len(parallel_groups)} parallel groups with {sum(len(g) for g in parallel_groups)} total tasks")

        results = execute_parallel_groups(parallel_groups)

        success_count = sum(1 for r in results if r)
        failure_count = len(results) - success_count

        print(f"\n📊 Execution Summary:")
        print(f"Total tasks: {len(results)}")
        print(f"Successful: {success_count}")
        print(f"Failed: {failure_count}")

        # Save execution results
        output_file = Path('.beads') / 'execution_results.json'
        with open(output_file, 'w') as f:
            json.dump({
                'results': results,
                'success_count': success_count,
                'failure_count': failure_count,
                'total_tasks': len(results)
            }, f, indent=2)

        print(f"\n📁 Execution results saved to: {output_file}")

    except Exception as e:
        print(f"❌ Parallel execution failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()