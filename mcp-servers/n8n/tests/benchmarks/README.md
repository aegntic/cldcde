# Performance Benchmarks

This directory contains performance benchmarks for critical operations in the n8n-mcp project.

## Running Benchmarks

### Local Development

```bash
# Run all benchmarks
npm run benchmark

# Watch mode for development
npm run benchmark:watch

# Interactive UI
npm run benchmark:ui

# Run specific benchmark file
npx vitest bench tests/benchmarks/node-loading.bench.ts
```

### CI/CD

Benchmarks run automatically on:
- Every push to `main` branch
- Every pull request
- Manual workflow dispatch

## Benchmark Suites

### 1. Node Loading Performance (`node-loading.bench.ts`)
- Package loading (n8n-nodes-base, @n8n/n8n-nodes-langchain)
- Individual node file loading
- Package.json parsing

### 2. Database Query Performance (`database-queries.bench.ts`)
- Node retrieval by type
- Category filtering
- Search operations (OR, AND, FUZZY modes)
- Node counting and statistics
- Insert/update operations

### 3. Search Operations (`search-operations.bench.ts`)
- Single and multi-word searches
- Exact phrase matching
- Fuzzy search performance
- Property search within nodes
- Complex filtering operations

### 4. Validation Performance (`validation-performance.bench.ts`)
- Node configuration validation (minimal, strict, ai-friendly)
- Expression validation
- Workflow validation
- Property dependency resolution

### 5. MCP Tool Execution (`mcp-tools.bench.ts`)
- Tool execution overhead
- Response formatting
- Complex query handling

## Performance Targets

| Operation | Target | Alert Threshold |
|-----------|--------|-----------------|
| Node loading | <100ms per package | >150ms |
| Database query | <5ms per query | >10ms |
| Search (simple) | <10ms | >20ms |
| Search (complex) | <50ms | >100ms |
| Validation (simple) | <1ms | >2ms |
| Validation (complex) | <10ms | >20ms |
| MCP tool execution | <50ms | >100ms |

## Benchmark Results

- Results are tracked over time using GitHub Actions
- Historical data available at: https://czlonkowski.github.io/n8n-mcp/benchmarks/
- Performance regressions >10% trigger automatic alerts
- PR comments show benchmark comparisons

## Writing New Benchmarks

```typescript
import { bench, describe } from 'vitest';

describe('My Performance Suite', () => {
  bench('operation name', async () => {
    // Code to benchmark
  }, {
    iterations: 100,        // Number of times to run
    warmupIterations: 10,   // Warmup runs (not measured)
    warmupTime: 500,        // Warmup duration in ms
    time: 3000             // Total benchmark duration in ms
  });
});
```

## Best Practices

1. **Isolate Operations**: Benchmark specific operations, not entire workflows
2. **Use Realistic Data**: Load actual n8n nodes for realistic measurements
3. **Warmup**: Always include warmup iterations to avoid JIT compilation effects
4. **Memory**: Use in-memory databases for consistent results
5. **Iterations**: Balance between accuracy and execution time

## Troubleshooting

### Inconsistent Results
- Increase `warmupIterations` and `warmupTime`
- Run benchmarks in isolation
- Check for background processes

### Memory Issues
- Reduce `iterations` for memory-intensive operations
- Add cleanup in `afterEach` hooks
- Monitor memory usage during benchmarks

### CI Failures
- Check benchmark timeout settings
- Verify GitHub Actions runner resources
- Review alert thresholds for false positives