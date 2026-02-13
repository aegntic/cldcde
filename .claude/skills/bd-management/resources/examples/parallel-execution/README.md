# Parallel Execution Example

This example demonstrates maximum parallel task execution with optimized workflow.

## Workflow Structure

```
📁 parallel-execution/
├── issues.json          # Beads issues optimized for parallel execution
├── workflow.log         # Execution log
└── results.json         # Execution results
```

## Issues Configuration

```json
{
  "issues": [
    {
      "id": "task-api-setup",
      "title": "Setup API endpoints",
      "type": "task",
      "status": "open",
      "priority": 5
    },
    {
      "id": "task-db-migration",
      "title": "Run database migrations",
      "type": "task",
      "status": "open",
      "priority": 5
    },
    {
      "id": "task-frontend-build",
      "title": "Build frontend assets",
      "type": "task",
      "status": "open",
      "priority": 4
    },
    {
      "id": "task-testing",
      "title": "Run integration tests",
      "type": "task",
      "status": "open",
      "priority": 3,
      "deps": {
        "blocks": ["task-api-setup", "task-db-migration", "task-frontend-build"]
      }
    },
    {
      "id": "task-deployment",
      "title": "Deploy to staging",
      "type": "task",
      "status": "open",
      "priority": 2,
      "deps": {
        "blocks": ["task-testing"]
      }
    },
    {
      "id": "task-monitoring",
      "title": "Setup monitoring",
      "type": "task",
      "status": "open",
      "priority": 2
    },
    {
      "id": "task-documentation",
      "title": "Update documentation",
      "type": "task",
      "status": "open",
      "priority": 1
    },
    {
      "id": "task-security-audit",
      "title": "Perform security audit",
      "type": "task",
      "status": "open",
      "priority": 4
    }
  ]
}
```

## Parallel Execution Analysis

```
📊 Workflow Analysis Results:
Total issues: 8
Ready for execution: 6
Blocked issues: 0

🚀 Parallel Execution Groups: 3
Group 1: 3 tasks (API setup, DB migration, Frontend build)
Group 2: 2 tasks (Monitoring, Documentation)
Group 3: 1 task (Security audit)

📊 Execution Summary:
Total tasks: 6
Successful: 6
Failed: 0
```

## Optimization Features

### Maximum Parallelism
- **Group 1**: Independent setup tasks (API, DB, Frontend) - can run simultaneously
- **Group 2**: Independent support tasks (Monitoring, Documentation) - can run simultaneously
- **Group 3**: Standalone task (Security audit) - can run independently

### Dependency Management
- Testing depends on all setup tasks (sequential after Group 1)
- Deployment depends on testing (sequential after Group 2)
- No circular dependencies

## Execution Steps

1. **Initialize Beads**: `bd init`
2. **Load issues**: `bd create --from-file issues.json`
3. **Analyze workflow**: `scripts/analyze.py`
4. **Optimize for parallel**: `scripts/optimize.py --max-parallel=4`
5. **Execute in parallel**: `scripts/parallel.py --parallel`
6. **Verify results**: `bd status`

## Performance Benefits

- **Traditional sequential**: ~8 minutes (1 minute per task)
- **Parallel execution**: ~3 minutes (3 minutes for Group 1, 1 minute for Groups 2-3)
- **30% time reduction** with proper parallel optimization

## Monitoring Parallel Execution

```bash
# Monitor execution progress
tail -f workflow.log

# Check parallel group completion
cat results.json | jq '.parallel_groups'
```