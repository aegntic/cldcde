# n8n-mcp Performance Benchmarks

## Overview

The n8n-mcp project includes comprehensive performance benchmarks to ensure optimal performance across all critical operations. These benchmarks help identify performance regressions and guide optimization efforts.

## Running Benchmarks

### Local Development

```bash
# Run all benchmarks
npm run benchmark

# Run in watch mode
npm run benchmark:watch

# Run with UI
npm run benchmark:ui

# Run specific benchmark suite
npm run benchmark tests/benchmarks/node-loading.bench.ts
```

### Continuous Integration

Benchmarks run automatically on:
- Every push to `main` branch
- Every pull request
- Manual workflow dispatch

Results are:
- Tracked over time using GitHub Actions
- Displayed in PR comments
- Available at: https://czlonkowski.github.io/n8n-mcp/benchmarks/

## Benchmark Suites

### 1. Node Loading Performance
Tests the performance of loading n8n node packages and parsing their metadata.

**Key Metrics:**
- Package loading time (< 100ms target)
- Individual node file loading (< 5ms target)
- Package.json parsing (< 1ms target)

### 2. Database Query Performance
Measures database operation performance including queries, inserts, and updates.

**Key Metrics:**
- Node retrieval by type (< 5ms target)
- Search operations (< 50ms target)
- Bulk operations (< 100ms target)

### 3. Search Operations
Tests various search modes and their performance characteristics.

**Key Metrics:**
- Simple word search (< 10ms target)
- Multi-word OR search (< 20ms target)
- Fuzzy search (< 50ms target)

### 4. Validation Performance
Measures configuration and workflow validation speed.

**Key Metrics:**
- Simple config validation (< 1ms target)
- Complex config validation (< 10ms target)
- Workflow validation (< 50ms target)

### 5. MCP Tool Execution
Tests the overhead of MCP tool execution.

**Key Metrics:**
- Tool invocation overhead (< 5ms target)
- Complex tool operations (< 50ms target)

## Performance Targets

| Operation Category | Target | Warning | Critical |
|-------------------|--------|---------|----------|
| Node Loading | < 100ms | > 150ms | > 200ms |
| Database Query | < 5ms | > 10ms | > 20ms |
| Search (simple) | < 10ms | > 20ms | > 50ms |
| Search (complex) | < 50ms | > 100ms | > 200ms |
| Validation | < 10ms | > 20ms | > 50ms |
| MCP Tools | < 50ms | > 100ms | > 200ms |

## Optimization Guidelines

### Current Optimizations

1. **In-memory caching**: Frequently accessed nodes are cached
2. **Indexed database**: Key fields are indexed for fast lookups
3. **Lazy loading**: Large properties are loaded on demand
4. **Batch operations**: Multiple operations are batched when possible

### Future Optimizations

1. **FTS5 Search**: Implement SQLite FTS5 for faster full-text search
2. **Connection pooling**: Reuse database connections
3. **Query optimization**: Analyze and optimize slow queries
4. **Parallel loading**: Load multiple packages concurrently

## Benchmark Implementation

### Writing New Benchmarks

```typescript
import { bench, describe } from 'vitest';

describe('My Performance Suite', () => {
  bench('operation name', async () => {
    // Code to benchmark
  }, {
    iterations: 100,
    warmupIterations: 10,
    warmupTime: 500,
    time: 3000
  });
});
```

### Best Practices

1. **Isolate operations**: Benchmark specific operations, not entire workflows
2. **Use realistic data**: Load actual n8n nodes for accurate measurements
3. **Include warmup**: Allow JIT compilation to stabilize
4. **Consider memory**: Monitor memory usage for memory-intensive operations
5. **Statistical significance**: Run enough iterations for reliable results

## Interpreting Results

### Key Metrics

- **hz**: Operations per second (higher is better)
- **mean**: Average time per operation (lower is better)
- **p99**: 99th percentile (worst-case performance)
- **rme**: Relative margin of error (lower is more reliable)

### Performance Regression Detection

A performance regression is flagged when:
1. Operation time increases by >10% from baseline
2. Multiple related operations show degradation
3. P99 latency exceeds critical thresholds

### Analyzing Trends

1. **Gradual degradation**: Often indicates growing technical debt
2. **Sudden spikes**: Usually from specific code changes
3. **Seasonal patterns**: May indicate cache effectiveness
4. **Outliers**: Check p99 vs mean for consistency

## Troubleshooting

### Common Issues

1. **Inconsistent results**: Increase warmup iterations
2. **High variance**: Check for background processes
3. **Memory issues**: Reduce iteration count
4. **CI failures**: Verify runner resources

### Performance Debugging

1. Use `--reporter=verbose` for detailed output
2. Profile with `node --inspect` for bottlenecks
3. Check database query plans
4. Monitor memory allocation patterns

## Contributing

When submitting performance improvements:

1. Run benchmarks before and after changes
2. Include benchmark results in PR description
3. Explain optimization approach
4. Consider trade-offs (memory vs speed)
5. Add new benchmarks for new features

## References

- [Vitest Benchmark Documentation](https://vitest.dev/guide/features.html#benchmarking)
- [GitHub Action Benchmark](https://github.com/benchmark-action/github-action-benchmark)
- [SQLite Performance Tuning](https://www.sqlite.org/optoverview.html)