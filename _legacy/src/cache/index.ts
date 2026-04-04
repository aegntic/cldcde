/**
 * Cache module exports
 */

// Core functionality
export {
  getRedisClient,
  generateCacheKey,
  CACHE_PREFIXES,
  CACHE_TTL,
  isCircuitOpen,
  recordSuccess,
  recordFailure,
  getCacheMetrics,
  invalidateCacheByPattern,
  batchInvalidate
} from './upstash'

// Caching strategies
export {
  cacheAside,
  writeThrough,
  warmCache,
  invalidateByTags,
  batchGet,
  memoize,
  type CacheOptions,
  type CachedData
} from './strategies'

// Invalidation logic
export {
  invalidateOnLogin,
  invalidateOnExtensionCreate,
  invalidateOnMcpCreate,
  invalidateOnRating,
  invalidateOnExtensionUpdate,
  invalidateOnMcpUpdate,
  invalidateOnProfileUpdate,
  invalidateOnExtensionDownload,
  invalidateOnMcpDownload,
  invalidateAllCaches
} from './invalidation'