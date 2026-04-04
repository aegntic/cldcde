---
name: RuVector DB Integration
description: |
  High-performance vector database with 50,000+ inserts/sec and HNSW indexing. Native Rust performance with SIMD optimizations. Supports semantic search, knowledge graph operations, and GNN capabilities. Perfect for fast similarity search and real-time recommendations.
---

## Overview

RuVector provides lightning-fast vector operations with advanced graph neural network capabilities. Already integrated into your ecosystem for Obsidian Elite RAG and n8n-mcp.

## Performance Characteristics

- **50,000+ inserts/sec** - 10x faster than traditional vector databases
- **HNSW indexing** - State-of-the-art approximate nearest neighbor search
- **SIMD optimizations** - Hardware-accelerated vector operations
- **GNN capabilities** - Graph neural networks for pattern recognition
- **<100ms query time** - Sub-100 millisecond search responses

## Installation

RuVector is already installed in your environment:

```bash
# Location
~/.cargo/bin/ruvector
node_modules/@ruvector/core
node_modules/@ruvector/gnn

# Version
@ruvector/core@0.1.35
@ruvector/gnn@0.1.35
```

## Quick Start

### Initialize RuVector Client

```typescript
// lib/ruvector.ts
import { RuVectorClient } from '@ruvector/core';

export const ruvector = new RuVectorClient({
  dimension: 1536, // OpenAI embeddings
  collectionName: 'showcase_tools',
  indexPath: '.ruvector/db',
});

await ruvector.initialize();
```

### Insert Vectors

```typescript
// Insert tool embeddings
const tools = await fetchGitHubTools();

for (const tool of tools) {
  const embedding = await generateEmbedding(tool.description);

  await ruvector.insert({
    id: tool.id,
    vector: embedding,
    metadata: {
      name: tool.name,
      description: tool.description,
      category: tool.category,
      stars: tool.stars,
      url: tool.url,
      tags: tool.tags,
    },
  });
}
```

### Semantic Search

```typescript
// Search for similar tools
async function searchTools(query: string, limit = 10) {
  const queryVector = await generateEmbedding(query);

  const results = await ruvector.search(queryVector, {
    limit,
    scoreThreshold: 0.7,
    filters: {
      category: 'development',
    },
  });

  return results.map(result => ({
    tool: result.metadata,
    score: result.score,
  }));
}
```

## Advanced Features

### Hybrid Search

```typescript
// Combine vector search with knowledge graph
async function hybridSearch(query: string) {
  const vectorResults = await ruvector.search(queryVector);

  const graphResults = await ruvector.searchWithGraph(queryVector, {
    graphDepth: 2,
    expandRelated: true,
  });

  return mergeResults(vectorResults, graphResults);
}
```

### Real-time Recommendations

```typescript
// Recommend similar tools
async function recommendTools(toolId: string, limit = 5) {
  const tool = await ruvector.getById(toolId);

  const recommendations = await ruvector.search(tool.vector, {
    limit,
    filters: {
      category: tool.metadata.category,
    },
    exclude: [toolId],
  });

  return recommendations;
}
```

### Graph Neural Network Operations

```typescript
import { RuVectorGNN } from '@ruvector/gnn';

const gnn = new RuVectorGNN({
  modelPath: './models/gnn-tool-classifier',
});

// Classify tools using GNN
const classifications = await gnn.classify({
  nodes: toolVectors,
  edges: relationships,
});

// Pattern recognition
const patterns = await gnn.detectPatterns({
  graph: toolRelationshipGraph,
  patternTypes: ['similar_usage', 'complementary_tools'],
});
```

## Database Schema

### Collection Structure

```typescript
interface ToolDocument {
  id: string;
  vector: number[];
  metadata: {
    name: string;
    description: string;
    category: string;
    stars: number;
    url: string;
    tags: string[];
    price?: number;
    license?: 'MIT' | 'Apache' | 'GPL' | 'Proprietary';
    language: string[];
  };
}
```

### Index Configuration

```typescript
await ruvector.createIndex({
  name: 'tools_index',
  dimension: 1536,
  metric: 'cosine',
  indexType: 'HNSW',
  hnswConfig: {
    M: 16,
    efConstruction: 200,
  },
});
```

## Integration Examples

### Tool Similarity Search

```typescript
// app/api/similar-tools/route.ts
export async function POST(req: Request) {
  const { toolId } = await req.json();

  const recommendations = await ruvector.search(
    (await ruvector.getById(toolId)).vector,
    {
      limit: 6,
      filters: {
        stars: { $gte: 100 },
      },
    }
  );

  return Response.json({
    similar: recommendations.map(r => r.metadata),
  });
}
```

### Category-Based Discovery

```typescript
// app/api/discover/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  const categoryTools = await ruvector.search({
    filter: {
      category,
      stars: { $gte: 50 },
    },
    sort: { stars: 'desc' },
    limit: 20,
  });

  return Response.json({
    tools: categoryTools,
  });
}
```

### Intelligent Search

```typescript
// app/api/search/route.ts
export async function POST(req: Request) {
  const { query, filters } = await req.json();

  const queryVector = await generateEmbedding(query);

  const results = await ruvector.search(queryVector, {
    limit: 10,
    scoreThreshold: 0.6,
    filters: filters || {},
    rerank: true,
    expandMetadata: true,
  });

  return Response.json({
    results,
    totalCount: results.length,
  });
}
```

## Performance Optimization

### Batch Operations

```typescript
// Bulk insert for better performance
await ruvector.insertBatch(tools.map(tool => ({
  id: tool.id,
  vector: tool.embedding,
  metadata: tool.metadata,
})));

// Batch search
const queries = ['tool1', 'tool2', 'tool3'];
const results = await ruvector.searchBatch(
  queries.map(q => generateEmbedding(q)),
  { limit: 5 }
);
```

### Caching Strategy

```typescript
import { LRUCache } from 'lru-cache';

const searchCache = new LRUCache<string, SearchResult[]>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
});

async function cachedSearch(query: string) {
  const cached = searchCache.get(query);
  if (cached) return cached;

  const results = await ruvector.search(
    await generateEmbedding(query)
  );

  searchCache.set(query, results);
  return results;
}
```

### Index Optimization

```typescript
// Optimize HNSW index for faster searches
await ruvector.optimizeIndex({
  name: 'tools_index',
  optimization: {
    ef: 100, // Higher ef = better recall, slower search
    M: 16,    // Number of bi-directional links
  },
});
```

## Embedding Generation

### OpenAI Embeddings

```typescript
import OpenAI from 'openai';

const openai = new OpenAI();

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536,
  });

  return response.data[0].embedding;
}
```

### Batch Embedding

```typescript
async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const embeddings = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
    dimensions: 1536,
  });

  return embeddings.data.map(e => e.embedding);
}
```

## Advanced Query Patterns

### Multi-Vector Search

```typescript
// Search across multiple text fields
async function multiVectorSearch(tool: Tool) {
  const embeddings = await generateEmbeddingsBatch([
    tool.name,
    tool.description,
    tool.longDescription,
    ...tool.tags,
  ]);

  const results = await ruvector.searchMulti(embeddings, {
    weights: {
      name: 0.3,
      description: 0.5,
      tags: 0.2,
    },
    limit: 10,
  });

  return results;
}
```

### Temporal Search

```typescript
// Search with time-based filtering
async function temporalSearch(query: string, timeRange: string) {
  const results = await ruvector.search(queryVector, {
    filters: {
      createdAt: {
        $gte: new Date(Date.now() - parseTimeRange(timeRange)),
      },
    },
    sort: { createdAt: 'desc' },
  });

  return results;
}
```

## Monitoring

### Performance Metrics

```typescript
// Track RuVector performance
const metrics = await ruvector.getMetrics();

console.log({
  avgQueryTime: metrics.avgQueryTime, // ms
  insertsPerSecond: metrics.insertsPerSecond,
  indexSize: metrics.indexSize,
  memoryUsage: metrics.memoryUsage,
  cacheHitRate: metrics.cacheHitRate,
});
```

### Health Checks

```typescript
// app/api/health/ruvector/route.ts
export async function GET() {
  const health = await ruvector.healthCheck();

  return Response.json({
    status: health.ok ? 'healthy' : 'degraded',
    metrics: health.metrics,
    uptime: health.uptime,
  });
}
```

## Error Handling

### Connection Management

```typescript
// Auto-reconnect on connection failure
ruvector.on('disconnect', async () => {
  console.log('RuVector disconnected, reconnecting...');
  await ruvector.reconnect();
});

ruvector.on('error', (error) => {
  console.error('RuVector error:', error);
  // Fallback to alternative search
  fallbackSearch(query);
});
```

### Fallback Strategy

```typescript
async function robustSearch(query: string) {
  try {
    return await ruvector.search(queryVector);
  } catch (error) {
    console.warn('RuVector search failed, using fallback');
    return await fallbackTextSearch(query);
  }
}
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('RuVector Integration', () => {
  it('should insert and retrieve vectors', async () => {
    await ruvector.insert({
      id: 'test-1',
      vector: testVector,
      metadata: { name: 'Test Tool' },
    });

    const result = await ruvector.getById('test-1');
    expect(result).toBeDefined();
    expect(result.metadata.name).toBe('Test Tool');
  });

  it('should perform similarity search', async () => {
    const results = await ruvector.search(queryVector, { limit: 5 });
    expect(results.length).toBeLessThanOrEqual(5);
  });
});
```

## Best Practices

### Index Maintenance

```typescript
// Regularly optimize index
setInterval(async () => {
  await ruvector.optimizeIndex('tools_index');
}, 1000 * 60 * 60 * 24); // Daily

// Cleanup old data
await ruvector.deleteBefore(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
```

### Memory Management

```typescript
// Monitor memory usage
const memoryStats = await ruvector.getMemoryStats();

if (memoryStats.heapUsed > memoryStats.heapLimit * 0.9) {
  // Trigger cleanup
  await ruvector.compact();
}
```

## Resources

### Internal Documentation
- [RuVector Complete Guide](../../mcp-servers/aegntic-mcp/RUVECTOR_COMPLETE.md)
- [RuVector Integration Guide](../../mcp-servers/aegntic-mcp/RUVECTOR_INTEGRATION_GUIDE.md)
- [Quick Start Script](../../mcp-servers/aegntic-mcp/ruvector-quickstart.js)
- [Test Integration](../../mcp-servers/aegntic-mcp/test-ruvector-integration.js)

### Related Projects
- Obsidian Elite RAG - Advanced RAG with RuVector
- n8n-mcp - Workflow recommendations with RuVector
- CLDCDE Platform - Vector-powered search

---

**Part of the Showcase Builder Bundle**
**Integrated with your existing RuVector installation**
