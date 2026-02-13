---
name: "Beads Workflow Optimizer"
description: "Optimizes Beads workflow activation, parallel processing, and task management. Use when working with Beads issues, managing dependencies, or optimizing development workflows in projects with complex task dependencies."
---

# Beads Workflow Optimizer

## Overview

The Beads Workflow Optimizer skill provides intelligent automation for Beads task management, including workflow activation, parallel processing optimization, and dependency resolution. This skill helps Claude identify optimal task sequences, activate workflows based on dependencies, and maximize parallel execution efficiency.

## Prerequisites

- Beads workflow system initialized in the project (`bd init` completed)
- Active git repository with Beads integration
- Understanding of task dependencies and blocking issues

## What This Skill Does

1. **Workflow Activation**: Automatically identify when to activate Beads workflows based on project state
2. **Parallel Processing**: Optimize task execution for maximum parallelism while respecting dependencies
3. **Dependency Resolution**: Analyze and resolve blocking issues efficiently
4. **Task Prioritization**: Prioritize tasks based on dependencies and project needs
5. **Workflow Sync**: Ensure Beads and git workflows stay synchronized

---

## Quick Start (60 seconds)

### Basic Workflow Activation
```bash
# Check available work and activate optimal workflow
bd ready
```

### Parallel Task Execution
```bash
# Run multiple tasks in parallel when dependencies allow
bd sync --parallel
```

### Dependency Analysis
```bash
# Analyze blocking issues and resolve dependencies
bd blocked
```

### Workflow Optimization
```bash
# Optimize workflow for current project state
bd optimize
```

Expected output:
```
✓ Workflow analysis complete
→ 3 tasks ready for parallel execution
→ 2 blocking issues identified
→ Recommendations generated
```

---

## Configuration

### Basic Configuration
Beads workflow is configured through the project's `.beads/` directory. No additional configuration needed.

### Advanced Configuration
Edit `.beads/config.json` for custom workflow settings:
```json
{
  "parallel_threshold": 4,
  "dependency_analysis": true,
  "auto_optimize": true,
  "sync_frequency": "commit"
}
```

---

## Step-by-Step Guide

### 1. Initialize Workflow
```bash
# Initialize Beads in the project
bd init
```

### 2. Analyze Current State
```bash
# Check available work and project health
bd ready
bd stats
bd blocked
```

### 3. Optimize Workflow
```bash
# Analyze and optimize task dependencies
bd optimize
```

### 4. Execute Tasks
```bash
# Run tasks in parallel when dependencies allow
bd sync --parallel
```

### 5. Monitor Progress
```bash
# Check workflow status and sync
bd status
bd sync
```

---

## Advanced Features

### Parallel Task Execution
```bash
# Execute multiple independent tasks in parallel
bd run --parallel "task1 task2 task3"
```

### Dependency Resolution
```bash
# Automatically resolve blocking dependencies
bd resolve --auto
```

### Workflow Automation
```bash
# Set up automated workflow triggers
bd auto --trigger="git push" --action="bd sync"
```

### Performance Monitoring
```bash
# Monitor workflow performance and bottlenecks
bd monitor --duration=30m
```

---

## Scripts Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/analyze.py` | Analyze task dependencies | `python scripts/analyze.py` |
| `scripts/optimize.py` | Optimize workflow | `python scripts/optimize.py` |
| `scripts/parallel.py` | Execute parallel tasks | `python scripts/parallel.py` |
| `scripts/sync.py` | Sync Beads with git | `python scripts/sync.py` |

---

## Resources

### Templates
- `resources/templates/issue-template.md` - Beads issue template
- `resources/templates/workflow-config.json` - Workflow configuration template

### Examples
- `resources/examples/basic-workflow/` - Simple workflow example
- `resources/examples/complex-dependencies/` - Complex dependency resolution
- `resources/examples/parallel-execution/` - Parallel task execution example

### Schemas
- `resources/schemas/config.schema.json` - Configuration schema validation
- `resources/schemas/issue.schema.json` - Issue structure validation

---

## Troubleshooting

### Issue: Workflow Not Activating
**Symptoms**: `bd ready` shows no available tasks
**Cause**: Beads not initialized or workflow configuration issues
**Solution**:
```bash
# Initialize Beads
bd init

# Check configuration
bd config

# Sync with git
bd sync
```

### Issue: Blocking Issues Not Resolving
**Symptoms**: `bd blocked` shows persistent blocking issues
**Solution**:
```bash
# Analyze dependencies
bd analyze --deep

# Manually resolve dependencies
bd resolve --manual

# Check for circular dependencies
bd check --circular
```

### Issue: Parallel Execution Failing
**Symptoms**: Parallel tasks failing due to dependencies
**Solution**:
```bash
# Reduce parallel threshold
bd config set parallel_threshold 2

# Run sequential for complex dependencies
bd run --sequential
```

---

## API Reference
Complete API documentation: [API_REFERENCE.md](docs/API_REFERENCE.md)

## Related Skills
- [Project Management](../project-management/)
- [Git Workflow Automation](../git-workflow/)
- [Dependency Analysis](../dependency-analyzer/)

## Resources
- [Beads Documentation](https://github.com/aegntic/beads)
- [Workflow Optimization Guide](https://example.com/workflow-guide)
- [Parallel Processing Best Practices](https://example.com/parallel-processing)

---

**Created**: 2025-12-10
**Category**: Development Utilities
**Difficulty**: Intermediate
**Estimated Time**: 15-30 minutes