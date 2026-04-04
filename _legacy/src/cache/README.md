# Upstash Redis Caching Implementation

This directory contains the Upstash Redis serverless caching implementation for the cldcde.cc platform.

## Architecture

### Core Components

1. **upstash.ts** - Redis client configuration and utilities
   - Redis client singleton
   - Cache key generation
   - Circuit breaker pattern
   - Metrics collection
   - Cache invalidation utilities

2. **strategies.ts** - Caching patterns implementation
   - Cache-aside pattern
   - Write-through pattern
   - Stale-while-revalidate
   - Cache warming
   - Batch operations

3. **invalidation.ts** - Cache invalidation logic
   - User action invalidation
   - Tag-based invalidation
   - Pattern-based invalidation

### Middleware

**middleware/cache.ts** - Hono caching middleware
- Route-specific cache presets
- Automatic cache key generation
- Cache headers management
- Metrics endpoint

## Configuration

### Environment Variables

```bash
UPSTASH_REDIS_REST_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token
```

### Cache TTL Configuration

- **Lists**: 1 hour (extensions, MCP servers)
- **User Data**: 5 minutes (profiles, stats)
- **Details**: 30 minutes (extension/MCP details)
- **Stats**: 10 minutes
- **Categories**: 2 hours

## Usage

### Adding Cache to Routes

```typescript
import { cachePresets } from '../middleware/cache'

// Use preset
extensionRoutes.get('/', cachePresets.extensionsList, handler)

// Custom cache configuration
import { cache } from '../middleware/cache'

app.get('/custom', cache({
  prefix: 'custom',
  ttl: 300,
  staleWhileRevalidate: 60
}), handler)
```

### Cache Invalidation

```typescript
import { invalidateOnExtensionCreate } from '../cache/invalidation'

// After creating an extension
await invalidateOnExtensionCreate(username, category, extensionId)
```

### Manual Cache Operations

```typescript
import { cacheAside, writeThrough } from '../cache/strategies'

// Read with cache-aside
const data = await cacheAside(
  'my-key',
  () => fetchFromDatabase(),
  { ttl: 300, staleWhileRevalidate: 60 }
)

// Write-through cache
await writeThrough('my-key', data, { ttl: 300 })
```

## Cache Warming

Run the cache warming script to pre-populate frequently accessed data:

```bash
bun run scripts/warm-cache.ts
```

This warms:
- Popular extensions (by downloads, rating, recent)
- Popular MCP servers
- Categories
- Top user profiles

## Monitoring

Access cache metrics at `/api/cache/metrics`:

```json
{
  "metrics": {
    "hits": 1234,
    "misses": 567,
    "errors": 12,
    "hitRate": 0.68,
    "avgLatency": 23.45,
    "totalRequests": 1801
  }
}
```

## Circuit Breaker

The implementation includes a circuit breaker pattern that:
- Opens after 5 consecutive failures
- Stays open for 1 minute
- Allows 3 retry attempts in half-open state
- Falls back to direct database queries when open

## Best Practices

1. **Cache Keys**: Use consistent, predictable cache keys
2. **Invalidation**: Always invalidate related caches on updates
3. **TTL**: Choose appropriate TTL based on data volatility
4. **Tags**: Use tags for bulk invalidation of related data
5. **Monitoring**: Regularly check cache metrics for optimization

## Upstash Limits

- Maximum key size: 512KB
- Maximum value size: 512KB
- Connection limit varies by plan
- Request timeout: 30 seconds

## Troubleshooting

### High Miss Rate
- Check if cache warming is running
- Verify TTL values are appropriate
- Check for excessive invalidation

### Circuit Breaker Open
- Check Upstash service status
- Verify credentials are correct
- Check for rate limiting

### Stale Data
- Verify invalidation logic is working
- Check if circuit breaker is causing fallbacks
- Review TTL and stale-while-revalidate settings