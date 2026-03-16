# Beads Workflow Optimizer API Reference

## Overview

The Beads Workflow Optimizer provides a comprehensive API for workflow management, analysis, and optimization. This reference covers all available functions, classes, and usage patterns.

## Core Classes

### WorkflowAnalyzer

Analyzes task dependencies and identifies optimization opportunities.

```python
class WorkflowAnalyzer:
    def __init__(self, issues: List[Dict])
    def analyze_dependencies(self) -> Dict
    def find_parallel_groups(self) -> List[List[Dict]]
    def detect_circular_dependencies(self) -> Optional[List[str]]
    def generate_recommendations(self) -> List[str]
```

#### Methods

- `analyze_dependencies()`: Analyzes task dependencies and identifies blocking issues
- `find_parallel_groups()`: Finds groups of tasks that can be executed in parallel
- `detect_circular_dependencies()`: Detects circular dependency chains
- `generate_recommendations()`: Generates optimization recommendations

### WorkflowOptimizer

Optimizes task execution order and parallel processing.

```python
class WorkflowOptimizer:
    def __init__(self, analysis: Dict)
    def optimize_workflow(self) -> Dict
    def create_execution_order(self) -> List[Dict]
    def calculate_efficiency(self) -> float
```

#### Methods

- `optimize_workflow()`: Optimizes workflow based on analysis results
- `create_execution_order()`: Creates optimal execution order
- `calculate_efficiency()`: Calculates workflow execution efficiency

### ParallelExecutor

Executes tasks in parallel when dependencies allow.

```python
class ParallelExecutor:
    def __init__(self, optimized_workflow: Dict)
    def execute_parallel_groups(self) -> Dict
    def monitor_execution(self) -> Dict
    def handle_failures(self) -> Dict
```

#### Methods

- `execute_parallel_groups()`: Executes tasks in parallel groups
- `monitor_execution()`: Monitors parallel execution progress
- `handle_failures()`: Handles task execution failures

### WorkflowSync

Synchronizes Beads workflow with git.

```python
class WorkflowSync:
    def __init__(self, issues: List[Dict])
    def sync_with_git(self) -> bool
    def backup_data(self) -> bool
    def commit_changes(self) -> bool
```

#### Methods

- `sync_with_git()`: Synchronizes Beads with git repository
- `backup_data()`: Creates backup of current Beads state
- `commit_changes()`: Commits Beads changes to git

## Command-Line Interface

### Basic Commands

#### Workflow Analysis
```bash
# Analyze current workflow
scripts/analyze.py

# Analyze with custom configuration
scripts/analyze.py --config custom-config.json
```

#### Workflow Optimization
```bash
# Optimize workflow
scripts/optimize.py

# Optimize with performance tuning
scripts/optimize.py --max-parallel=8 --timeout=300
```

#### Parallel Execution
```bash
# Execute tasks in parallel
scripts/parallel.py

# Execute with monitoring
scripts/parallel.py --monitor --log-file workflow.log
```

#### Workflow Sync
```bash
# Sync with git
scripts/sync.py

# Sync with verbose output
scripts/sync.py --verbose
```

### Advanced Commands

#### Custom Analysis
```bash
# Run custom analysis script
python scripts/custom-analysis.py

# Analyze specific issues
scripts/analyze.py --issues issue-123,issue-456
```

#### Performance Monitoring
```bash
# Monitor workflow performance
scripts/monitor.py --duration=30m

# Generate performance report
scripts/report.py --output performance-report.html
```

#### Integration Commands
```bash
# Integrate with CI/CD
scripts/ci-integration.py --provider github

# Setup webhooks
scripts/webhook-setup.py --url https://example.com/webhook
```

## Configuration

### Configuration File Structure

```json
{
  "workflow": {
    "parallel_threshold": 4,
    "auto_optimize": true,
    "sync_frequency": "commit"
  },
  "execution": {
    "max_parallel_tasks": 8,
    "timeout_seconds": 300,
    "retry_attempts": 3
  },
  "logging": {
    "level": "info",
    "file": "workflow.log",
    "format": "json"
  },
  "monitoring": {
    "enabled": true,
    "metrics_interval": 60,
    "alerts": {
      "errors": true,
      "performance": true
    }
  }
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BEADS_PARALLEL_THRESHOLD` | Parallel execution threshold | 4 |
| `BEADS_AUTO_OPTIMIZE` | Enable automatic optimization | true |
| `BEADS_SYNC_FREQUENCY` | Sync frequency | commit |
| `BEADS_MAX_PARALLEL` | Maximum parallel tasks | 8 |
| `BEADS_TIMEOUT` | Task timeout in seconds | 300 |
| `BEADS_RETRY_ATTEMPTS` | Retry attempts for failed tasks | 3 |
| `BEADS_LOG_LEVEL` | Logging level | info |
| `BEADS_LOG_FILE` | Log file path | workflow.log |

## Data Structures

### Issue Structure

```python
{
  "id": "string",
  "title": "string",
  "description": "string",
  "type": "bug|feature|task|epic|chore",
  "priority": 1-5,
  "status": "open|in_progress|blocked|closed",
  "labels": ["string"],
  "deps": {
    "blocks": ["string"],
    "related": ["string"],
    "parent-child": ["string"],
    "discovered-from": ["string"]
  },
  "assignee": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Analysis Results

```python
{
  "blocking_issues": [Issue],
  "ready_issues": [Issue],
  "dependency_map": {
    "issue_id": ["dependent_issue_ids"]
  },
  "total_issues": int,
  "ready_count": int,
  "blocked_count": int
}
```

### Optimization Results

```python
{
  "parallel_groups": [[Issue]],
  "execution_order": [Issue],
  "recommendations": ["string"],
  "efficiency_score": float
}
```

### Execution Results

```python
{
  "results": [bool],  # Success/failure for each task
  "success_count": int,
  "failure_count": int,
  "total_tasks": int,
  "execution_time": float,
  "parallel_groups_executed": int
}
```

## Error Handling

### Common Error Codes

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `BD_ANALYSIS_FAILED` | Workflow analysis failed | Check issue data format |
| `BD_OPTIMIZATION_FAILED` | Workflow optimization failed | Verify analysis data |
| `BD_EXECUTION_FAILED` | Task execution failed | Check task dependencies |
| `BD_SYNC_FAILED` | Git sync failed | Verify git repository |
| `BD_CONFIG_INVALID` | Invalid configuration | Check config file format |

### Error Recovery

```python
# Handle analysis errors
try:
    analysis = analyzer.analyze_dependencies()
except BDAnalysisError as e:
    log_error(e)
    recover_from_analysis_error()

# Handle execution errors
try:
    results = executor.execute_parallel_groups()
except BDExecutionError as e:
    log_error(e)
    retry_failed_tasks(results['failed_tasks'])
```

## Extending the System

### Custom Analysis Plugins

```python
# Create custom analysis plugin
class CustomAnalysisPlugin:
    def analyze(self, issues: List[Dict]) -> Dict:
        """Custom analysis logic"""
        pass

    def get_name(self) -> str:
        """Plugin name"""
        return "custom-analysis"
```

### Custom Execution Handlers

```python
# Create custom execution handler
class CustomExecutionHandler:
    def execute(self, task: Dict) -> bool:
        """Custom task execution logic"""
        pass

    def get_task_type(self) -> str:
        """Task type this handler supports"""
        return "custom-task"
```

### Integration Adapters

```python
# Create integration adapter
class GitHubAdapter:
    def sync_issues(self, issues: List[Dict]) -> bool:
        """Sync issues with GitHub"""
        pass

    def get_repository_issues(self) -> List[Dict]:
        """Get issues from GitHub"""
        pass
```

## Examples

### Basic Workflow Analysis

```python
from workflow_analyzer import WorkflowAnalyzer

# Load issues
issues = load_beads_issues()

# Analyze workflow
analyzer = WorkflowAnalyzer(issues)
analysis = analyzer.analyze_dependencies()

print(f"Ready issues: {analysis['ready_count']}")
print(f"Blocked issues: {analysis['blocked_count']}")
```

### Parallel Execution

```python
from parallel_executor import ParallelExecutor

# Load optimized workflow
optimized = load_optimized_workflow()

# Execute in parallel
executor = ParallelExecutor(optimized)
results = executor.execute_parallel_groups()

print(f"Success rate: {results['success_count'] / results['total_tasks'] * 100:.1f}%")
```

### Custom Configuration

```python
from config_manager import ConfigManager

# Load custom configuration
config = ConfigManager.load('custom-config.json')

# Apply configuration
WorkflowAnalyzer.set_config(config)
WorkflowOptimizer.set_config(config)
ParallelExecutor.set_config(config)
```

## Performance Considerations

### Large Workflows

For workflows with 100+ tasks:
- Use incremental analysis
- Implement pagination for results
- Optimize data structures for memory efficiency
- Consider distributed execution

### Real-time Optimization

For dynamic workflows:
- Implement change detection
- Use incremental updates
- Cache frequently accessed data
- Implement lazy loading for large datasets

## Security Considerations

### Data Protection
- Encrypt sensitive issue data
- Implement access controls
- Validate all input data
- Use secure file permissions

### Execution Safety
- Implement sandboxed execution
- Validate task commands
- Monitor resource usage
- Implement timeout mechanisms

## Testing

### Unit Tests

```python
# Test workflow analysis
def test_dependency_analysis():
    issues = create_test_issues()
    analyzer = WorkflowAnalyzer(issues)
    analysis = analyzer.analyze_dependencies()
    assert analysis['ready_count'] == 3

# Test parallel execution
def test_parallel_execution():
    optimized = create_optimized_workflow()
    executor = ParallelExecutor(optimized)
    results = executor.execute_parallel_groups()
    assert results['success_count'] == 3
```

### Integration Tests

```python
# Test git sync
def test_git_sync():
    issues = load_test_issues()
    sync = WorkflowSync(issues)
    result = sync.sync_with_git()
    assert result is True
```

## Changelog

### v1.0.0
- Initial release with core workflow optimization
- Basic parallel execution support
- Git synchronization
- Dependency analysis

### v1.1.0
- Enhanced parallel execution
- Custom configuration support
- Performance monitoring
- Error recovery mechanisms

### v1.2.0
- Advanced dependency management
- Circular dependency detection
- Custom analysis plugins
- Integration adapters

## Support

For issues and support:
- Check the [troubleshooting guide](TROUBLESHOOTING.md)
- Review the [examples](../resources/examples/)
- Contact support at beads@example.com

## License

This API is provided under the MIT License. See LICENSE file for details.