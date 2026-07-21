# Basic Workflow Example

This example shows a simple Beads workflow with minimal dependencies.

## Workflow Structure

```
📁 basic-workflow/
├── issues.json          # Beads issues for this workflow
├── workflow.log         # Execution log
└── results.json         # Execution results
```

## Issues Configuration

```json
{
  "issues": [
    {
      "id": "task-1",
      "title": "Setup development environment",
      "type": "task",
      "status": "open",
      "priority": 5
    },
    {
      "id": "task-2",
      "title": "Install dependencies",
      "type": "task",
      "status": "open",
      "priority": 4
    },
    {
      "id": "task-3",
      "title": "Run tests",
      "type": "task",
      "status": "open",
      "priority": 3
    }
  ]
}
```

## Execution Steps

1. **Initialize Beads**: `bd init`
2. **Load issues**: `bd create --from-file issues.json`
3. **Analyze workflow**: `scripts/analyze.py`
4. **Optimize**: `scripts/optimize.py`
5. **Execute**: `scripts/parallel.py`

## Expected Output

```
📊 Workflow Analysis Results:
Total issues: 3
Ready for execution: 3
Blocked issues: 0

🚀 Parallel Execution Groups: 1
Group 1: 3 tasks

📊 Execution Summary:
Total tasks: 3
Successful: 3
Failed: 0
```

## Cleanup

```bash
rm -rf .beads workflow.log results.json
```