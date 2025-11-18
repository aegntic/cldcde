import { Redis } from '@upstash/redis'

/**
 * Upstash Redis client configuration for serverless caching
 */

// Redis client instance
let redisClient: Redis | null = null

/**
 * Get or create Redis client instance
 * @returns Redis client instance
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      throw new Error('Missing Upstash Redis configuration. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.')
    }

    redisClient = new Redis({
      url,
      token,
      // Enable automatic retries with exponential backoff
      retry: {
        retries: 3,
        backoff: (retryCount) => Math.min(retryCount * 100, 1000)
      }
    })
  }

  return redisClient
}

/**
 * Cache key prefixes for different data types
 */
export const CACHE_PREFIXES = {
  EXTENSIONS_LIST: 'extensions:list',
  EXTENSIONS_DETAIL: 'extensions:detail',
  MCP_LIST: 'mcp:list',
  MCP_DETAIL: 'mcp:detail',
  USER_PROFILE: 'user:profile',
  USER_EXTENSIONS: 'user:extensions',
  USER_MCP: 'user:mcp',
  USER_STATS: 'user:stats',
  CATEGORIES: 'categories',
  STATS: 'stats',
  FEATURED: 'featured'
} as const

/**
 * TTL values in seconds
 */
export const CACHE_TTL = {
  LISTS: 3600, // 1 hour for lists
  USER_DATA: 300, // 5 minutes for user data
  DETAILS: 1800, // 30 minutes for detail pages
  STATS: 600, // 10 minutes for statistics
  CATEGORIES: 7200, // 2 hours for categories
  FEATURED: 900 // 15 minutes for featured content
} as const

/**
 * Generate cache key with prefix
 * @param prefix - Cache key prefix
 * @param params - Additional parameters for the key
 * @returns Full cache key
 */
export function generateCacheKey(prefix: string, params: Record<string, any> = {}): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join(':')
  
  return sortedParams ? `${prefix}:${sortedParams}` : prefix
}

/**
 * Circuit breaker state
 */
interface CircuitBreakerState {
  failures: number
  lastFailure: number
  isOpen: boolean
  halfOpenRetries: number
}

const circuitBreaker: CircuitBreakerState = {
  failures: 0,
  lastFailure: 0,
  isOpen: false,
  halfOpenRetries: 0
}

const CIRCUIT_BREAKER_THRESHOLD = 5
const CIRCUIT_BREAKER_TIMEOUT = 60000 // 1 minute
const HALF_OPEN_MAX_RETRIES = 3

/**
 * Check if circuit breaker should allow request
 * @returns Whether the request should proceed
 */
export function isCircuitOpen(): boolean {
  if (!circuitBreaker.isOpen) {
    return false
  }

  const now = Date.now()
  const timeSinceLastFailure = now - circuitBreaker.lastFailure

  // Check if we should move to half-open state
  if (timeSinceLastFailure > CIRCUIT_BREAKER_TIMEOUT) {
    if (circuitBreaker.halfOpenRetries < HALF_OPEN_MAX_RETRIES) {
      circuitBreaker.halfOpenRetries++
      return false // Allow request in half-open state
    }
  }

  return true // Circuit is open, reject request
}

/**
 * Record successful cache operation
 */
export function recordSuccess(): void {
  if (circuitBreaker.isOpen) {
    // Reset circuit breaker on success
    circuitBreaker.failures = 0
    circuitBreaker.isOpen = false
    circuitBreaker.halfOpenRetries = 0
  }
}

/**
 * Record failed cache operation
 */
export function recordFailure(): void {
  circuitBreaker.failures++
  circuitBreaker.lastFailure = Date.now()

  if (circuitBreaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreaker.isOpen = true
    circuitBreaker.halfOpenRetries = 0
  }
}

/**
 * Cache metrics for monitoring
 */
interface CacheMetrics {
  hits: number
  misses: number
  errors: number
  latency: number[]
}

const metrics: CacheMetrics = {
  hits: 0,
  misses: 0,
  errors: 0,
  latency: []
}

/**
 * Record cache hit
 */
export function recordCacheHit(): void {
  metrics.hits++
}

/**
 * Record cache miss
 */
export function recordCacheMiss(): void {
  metrics.misses++
}

/**
 * Record cache error
 */
export function recordCacheError(): void {
  metrics.errors++
}

/**
 * Record operation latency
 * @param duration - Operation duration in milliseconds
 */
export function recordLatency(duration: number): void {
  metrics.latency.push(duration)
  // Keep only last 100 measurements
  if (metrics.latency.length > 100) {
    metrics.latency.shift()
  }
}

/**
 * Get cache metrics
 * @returns Current cache metrics
 */
export function getCacheMetrics(): CacheMetrics & { hitRate: number; avgLatency: number } {
  const total = metrics.hits + metrics.misses
  const hitRate = total > 0 ? metrics.hits / total : 0
  const avgLatency = metrics.latency.length > 0 
    ? metrics.latency.reduce((a, b) => a + b, 0) / metrics.latency.length 
    : 0

  return {
    ...metrics,
    hitRate,
    avgLatency
  }
}

/**
 * Invalidate cache keys by pattern
 * @param pattern - Key pattern to match
 */
export async function invalidateCacheByPattern(pattern: string): Promise<void> {
  try {
    const redis = getRedisClient()
    const keys = await redis.keys(pattern)
    
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Cache invalidation error:', error)
    recordCacheError()
  }
}

/**
 * Batch invalidate multiple cache keys
 * @param keys - Array of cache keys to invalidate
 */
export async function batchInvalidate(keys: string[]): Promise<void> {
  if (keys.length === 0) return

  try {
    const redis = getRedisClient()
    await redis.del(...keys)
  } catch (error) {
    console.error('Batch invalidation error:', error)
    recordCacheError()
  }
}