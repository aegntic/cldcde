# Complex Dependencies Example

This example demonstrates handling complex dependency relationships and blocked issues.

## Workflow Structure

```
📁 complex-dependencies/
├── issues.json          # Beads issues with complex dependencies
├── workflow.log         # Execution log
└── results.json         # Execution results
```

## Issues Configuration

```json
{
  "issues": [
    {
      "id": "feature-login",
      "title": "Implement user login",
      "type": "feature",
      "status": "open",
      "priority": 5,
      "deps": {
        "blocks": ["task-db-setup", "task-auth-config"]
      }
    },
    {
      "id": "task-db-setup",
      "title": "Setup database",
      "type": "task",
      "status": "open",
      "priority": 4
    },
    {
      "id": "task-auth-config",
      "title": "Configure authentication",
      "type": "task",
      "status": "open",
      "priority": 4,
      "deps": {
        "blocks": ["task-secrets-setup"]
      }
    },
    {
      "id": "task-secrets-setup",
      "title": "Setup secrets management",
      "type": "task",
      "status": "blocked",
      "priority": 3
    },
    {
      "id": "task-ui-design",
      "title": "Design login UI",
      "type": "task",
      "status": "open",
      "priority": 3
    },
    {
      "id": "task-testing",
      "title": "Write login tests",
      "type": "task",
      "status": "open",
      "priority": 2,
      "deps": {
        "related": ["feature-login"]
      }
    }
  ]
}
```

## Dependency Analysis

```
📊 Workflow Analysis Results:
Total issues: 6
Ready for execution: 3
Blocked issues: 1

⚠️  Blocked Issues:
  - Setup secrets management (ID: task-secrets-setup)

✅ Ready for Execution:
  - Setup database (ID: task-db-setup)
  - Configure authentication (ID: task-auth-config)
  - Design login UI (ID: task-ui-design)
```

## Resolution Strategy

1. **Address blocking issue first**: Resolve `task-secrets-setup` to unblock dependent tasks
2. **Parallel execution**: Once unblocked, `task-auth-config` and `task-ui-design` can run in parallel
3. **Sequential dependencies**: `feature-login` depends on both database and auth config

## Execution Steps

1. **Initialize Beads**: `bd init`
2. **Load issues**: `bd create --from-file issues.json`
3. **Analyze workflow**: `scripts/analyze.py`
4. **Resolve blocking issues**: `bd resolve --manual`
5. **Optimize**: `scripts/optimize.py`
6. **Execute**: `scripts/parallel.py`

## Expected Output

```
📊 Workflow Analysis Results:
Total issues: 6
Ready for execution: 3
Blocked issues: 1

🚀 Parallel Execution Groups: 2
Group 1: 2 tasks (database setup, UI design)
Group 2: 1 task (authentication config)

📊 Execution Summary:
Total tasks: 3
Successful: 3
Failed: 0
```