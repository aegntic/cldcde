---
name: fileio-swarm-advanced
description: Advanced File I/O and shared state management for Claude Code multi-agent swarm operations with atomic operations, conflict resolution, and concurrent access control
location: user
version: 1.0.0
author: Claude Code
category: file-management
tags: [file-io, shared-state, swarm-coordination, concurrent-access, atomic-operations]
dependencies: []
requires:
  - node: >=16.0.0
  - python: >=3.8
---

# Advanced File I/O for Multi-Agent Swarm Operations

A comprehensive skill for managing shared state and data persistence in Claude Code multi-agent swarm operations. This skill provides atomic file operations, conflict resolution, concurrent access control, and progress tracking capabilities essential for coordinating multiple agents working on shared resources.

## Core Features

### 🔄 Shared State Management
- Atomic read-write operations with file locking
- State synchronization across multiple agents
- Conflict detection and resolution strategies
- Version control integration for state changes

### 📁 Multi-Format Support
- JSON, YAML, TOML, CSV, Markdown file handling
- Binary file operations with integrity checks
- Configurable serialization/deserialization
- Format validation and schema enforcement

### 🔒 Concurrent Access Control
- File-based locking mechanisms
- Deadlock detection and prevention
- Graceful conflict resolution
- Agent identity and priority management

### 📊 Progress Tracking & Logging
- Real-time progress monitoring
- Comprehensive operation logging
- Performance metrics and analytics
- Error tracking and recovery suggestions

### 🛡️ Data Integrity & Validation
- Checksum verification for file integrity
- Schema validation for structured data
- Backup and recovery mechanisms
- Data consistency checks

## Quick Start

```typescript
// Initialize swarm file manager
const swarmFileManager = new SwarmFileManager({
  workspace: '/workspace/swarm-data',
  agentId: 'agent-001',
  lockTimeout: 30000,
  maxRetries: 3
});

// Create shared state
await swarmFileManager.createSharedState('project-status', {
  phase: 'development',
  agents: ['agent-001', 'agent-002'],
  progress: 0.25
});

// Atomic state update
const updated = await swarmFileManager.updateSharedState('project-status',
  (state) => ({
    ...state,
    progress: Math.min(state.progress + 0.1, 1.0),
    lastUpdate: new Date().toISOString()
  })
);

// Progress tracking
const tracker = swarmFileManager.createProgressTracker('data-processing', {
  totalItems: 1000,
  agents: 3
});

await tracker.updateProgress(250); // 25% complete
```

## Installation & Setup

1. Copy this skill to your Claude Code skills directory
2. Install dependencies: `npm install fs-extra lockfile crypto`
3. Create workspace directory for swarm operations
4. Configure agent identities and permissions

## Usage Examples

### Shared State Management

```typescript
// Agent 1: Initialize shared state
await swarmFileManager.createSharedState('task-queue', {
  tasks: [],
  completed: 0,
  failed: 0,
  status: 'initializing'
});

// Agent 2: Add tasks to queue
await swarmFileManager.updateSharedState('task-queue', (state) => ({
  ...state,
  tasks: [
    ...state.tasks,
    { id: 'task-001', agent: 'agent-002', priority: 'high' }
  ]
}));

// Agent 3: Process and update status
const result = await swarmFileManager.updateSharedState('task-queue', (state) => {
  const task = state.tasks.find(t => t.id === 'task-001');
  if (task && task.status !== 'completed') {
    return {
      ...state,
      tasks: state.tasks.map(t =>
        t.id === 'task-001'
          ? { ...t, status: 'completed', completedAt: Date.now() }
          : t
      ),
      completed: state.completed + 1
    };
  }
  return state;
});
```

### Progress Tracking

```typescript
// Initialize progress tracker
const tracker = swarmFileManager.createProgressTracker('batch-processing', {
  totalItems: 5000,
  batchSize: 100,
  agents: ['agent-001', 'agent-002', 'agent-003']
});

// Agent reports progress
await tracker.reportProgress({
  agentId: 'agent-001',
  completed: 1200,
  errors: 2,
  currentBatch: 13
});

// Get overall progress
const progress = await tracker.getProgress();
// Returns: { total: 5000, completed: 2400, percentage: 48, activeAgents: 3 }
```

### Conflict Resolution

```typescript
// Configure conflict resolution strategy
const conflictResolver = new ConflictResolver({
  strategy: 'merge-priority', // 'merge-priority', 'timestamp', 'manual'
  priorityOrder: ['agent-001', 'agent-002', 'agent-003']
});

// Resolve conflicts automatically
const resolved = await conflictResolver.resolve('shared-config.json', {
  agentAChanges: { timeout: 5000 },
  agentBChanges: { retries: 3, timeout: 10000 }
});
// Result: { timeout: 10000, retries: 3 }
```

## API Reference

### SwarmFileManager

Main class for managing file operations in swarm environments.

#### Constructor
```typescript
new SwarmFileManager(options: SwarmFileManagerOptions)
```

#### Methods

##### `createSharedState(name: string, data: any, options?: StateOptions)`
Creates a new shared state file with initial data.

##### `getSharedState(name: string): Promise<any>`
Retrieves current shared state data.

##### `updateSharedState(name: string, updater: Function, options?: UpdateOptions)`
Atomically updates shared state using provided updater function.

##### `deleteSharedState(name: string): Promise<boolean>`
Safely removes shared state file.

##### `lockFile(filePath: string, options?: LockOptions): Promise<LockHandle>`
Acquires exclusive lock on file for operations.

##### `createProgressTracker(name: string, config: ProgressConfig): ProgressTracker`
Creates progress tracker for monitoring long-running operations.

### ProgressTracker

Handles progress tracking across multiple agents.

#### Methods

##### `reportProgress(progress: ProgressReport): Promise<void>`
Reports progress from an agent.

##### `getProgress(): Promise<ProgressSummary>`
Gets aggregated progress from all agents.

##### `markComplete(agentId: string): Promise<void>`
Marks agent's work as complete.

##### `reset(): Promise<void>`
Resets progress tracking.

### ConflictResolver

Manages conflict resolution for concurrent file modifications.

#### Methods

##### `resolve(filePath: string, conflicts: ConflictData[]): Promise<ResolvedData>`
Resolves conflicts using configured strategy.

##### `detectConflicts(filePath: string): Promise<ConflictInfo[]>`
Detects potential conflicts in shared files.

## Configuration Options

### SwarmFileManagerOptions
```typescript
interface SwarmFileManagerOptions {
  workspace: string;           // Root directory for swarm operations
  agentId: string;            // Unique identifier for this agent
  lockTimeout?: number;       // Lock timeout in milliseconds (default: 30000)
  maxRetries?: number;        // Max retry attempts (default: 3)
  retryDelay?: number;        // Delay between retries (default: 1000)
  backupEnabled?: boolean;    // Enable automatic backups (default: true)
  logLevel?: 'debug' | 'info' | 'warn' | 'error'; // Log level
}
```

### StateOptions
```typescript
interface StateOptions {
  format?: 'json' | 'yaml' | 'toml';  // File format
  schema?: object;                    // JSON schema for validation
  encryption?: boolean;               // Enable encryption
  ttl?: number;                       // Time to live in milliseconds
  metadata?: object;                  // Additional metadata
}
```

### ProgressConfig
```typescript
interface ProgressConfig {
  totalItems: number;         // Total items to process
  batchSize?: number;         // Batch size for processing
  agents: string[];          // List of participating agents
  updateInterval?: number;    // Progress update interval
  checkpoints?: boolean;      // Enable checkpointing
}
```

## Advanced Features

### Atomic Operations
- ACID-compliant file operations
- Transactional updates with rollback capability
- Isolation levels for concurrent operations

### Backup & Recovery
- Automatic snapshot creation
- Point-in-time recovery
- Incremental backup support
- Disaster recovery procedures

### Performance Optimization
- Batch operations for bulk updates
- Compression for large files
- Caching layer for frequently accessed data
- Asynchronous I/O operations

### Security & Access Control
- File permission management
- Agent authentication and authorization
- Data encryption at rest
- Audit logging for compliance

## Best Practices

1. **Always use atomic updates** for shared state modifications
2. **Implement proper error handling** and retry mechanisms
3. **Use appropriate lock timeouts** to prevent deadlocks
4. **Regularly clean up** stale locks and temporary files
5. **Monitor performance** metrics and optimize bottlenecks
6. **Validate data** before writing to shared state
7. **Use meaningful names** for shared state files
8. **Document state schemas** for team collaboration

## Troubleshooting

### Common Issues

**Deadlocks**: Occur when agents wait indefinitely for locks
- Solution: Implement timeout mechanisms and deadlock detection

**Race Conditions**: Multiple agents modifying state simultaneously
- Solution: Use atomic operations and proper locking

**File Corruption**: Data integrity issues during concurrent access
- Solution: Enable checksums and automatic backups

**Performance Bottlenecks**: Slow file operations with many agents
- Solution: Implement batching and caching strategies

### Debugging

Enable debug logging to trace file operations:
```typescript
const fileManager = new SwarmFileManager({
  workspace: '/workspace',
  agentId: 'debug-agent',
  logLevel: 'debug'
});
```

Monitor system resources and lock status:
```bash
# Check active locks
ls -la /workspace/.locks/

# Monitor file access
tail -f /workspace/.logs/file-operations.log
```

## Integration Examples

### With GitHub Workflow Automation
```typescript
// Integrate with GitHub Actions
const githubIntegration = new GitHubFileIntegration(fileManager);
await githubIntegration.syncWithRepository({
  repo: 'organization/project',
  branch: 'main',
  paths: ['shared-state/', 'progress/']
});
```

### With AgentDB Memory Patterns
```typescript
// Combine with AgentDB for hybrid storage
const hybridStorage = new HybridStorage({
  fileManager: fileManager,
  agentdb: agentdbClient,
  syncStrategy: 'file-primary'
});
```

### With Swarm Orchestration
```typescript
// Coordinate with swarm orchestration system
const swarmCoordinator = new SwarmCoordinator({
  fileManager: fileManager,
  communicationLayer: messageQueue,
  consensusProtocol: 'raft'
});
```

## Contributing

This skill is designed to be extensible. To add new features:

1. Create feature branches from main
2. Add comprehensive tests for new functionality
3. Update documentation with examples
4. Ensure backward compatibility
5. Submit pull requests with detailed descriptions

## License

This skill is part of the Claude Code ecosystem and follows the project's licensing terms.

---

**Generated with Claude Code Advanced Template System**