import { 
  getRedisClient, 
  isCircuitOpen, 
  recordSuccess, 
  recordFailure,
  recordCacheHit,
  recordCacheMiss,
  recordLatency
} from './upstash'

/**
 * Cache strategies implementation for different caching patterns
 */

export interface CacheOptions {
  ttl: number // Time to live in seconds
  staleWhileRevalidate?: number // Stale-while-revalidate time in seconds
  tags?: string[] // Cache tags for invalidation
}

export interface CachedData<T> {
  data: T
  timestamp: number
  stale?: boolean
}

/**
 * Cache-aside pattern implementation
 * @param key - Cache key
 * @param fetcher - Function to fetch data if not in cache
 * @param options - Cache options
 * @returns Cached or fresh data
 */
export async function cacheAside<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions
): Promise<T> {
  const startTime = Date.now()

  // Check circuit breaker
  if (isCircuitOpen()) {
    console.warn('Circuit breaker is open, bypassing cache')
    return fetcher()
  }

  try {
    const redis = getRedisClient()
    
    // Try to get from cache
    const cached = await redis.get<CachedData<T>>(key)
    
    if (cached) {
      recordCacheHit()
      recordLatency(Date.now() - startTime)
      
      // Check if data is stale
      const age = Date.now() - cached.timestamp
      const isStale = age > (options.ttl * 1000)
      
      if (!isStale) {
        recordSuccess()
        return cached.data
      }
      
      // Stale-while-revalidate logic
      if (options.staleWhileRevalidate && age < ((options.ttl + options.staleWhileRevalidate) * 1000)) {
        // Return stale data and refresh in background
        refreshInBackground(key, fetcher, options).catch(err => 
          console.error('Background refresh failed:', err)
        )
        recordSuccess()
        return cached.data
      }
    }
    
    recordCacheMiss()
    
    // Fetch fresh data
    const freshData = await fetcher()
    
    // Store in cache
    const cacheData: CachedData<T> = {
      data: freshData,
      timestamp: Date.now()
    }
    
    await redis.setex(key, options.ttl, cacheData)
    
    // Store tags for invalidation
    if (options.tags && options.tags.length > 0) {
      await storeCacheTags(key, options.tags)
    }
    
    recordSuccess()
    recordLatency(Date.now() - startTime)
    
    return freshData
  } catch (error) {
    recordFailure()
    console.error('Cache-aside error:', error)
    
    // Fallback to fetcher on cache error
    return fetcher()
  }
}

/**
 * Write-through cache pattern
 * @param key - Cache key
 * @param data - Data to cache
 * @param options - Cache options
 */
export async function writeThrough<T>(
  key: string,
  data: T,
  options: CacheOptions
): Promise<void> {
  if (isCircuitOpen()) {
    console.warn('Circuit breaker is open, skipping cache write')
    return
  }

  try {
    const redis = getRedisClient()
    
    const cacheData: CachedData<T> = {
      data,
      timestamp: Date.now()
    }
    
    await redis.setex(key, options.ttl, cacheData)
    
    if (options.tags && options.tags.length > 0) {
      await storeCacheTags(key, options.tags)
    }
    
    recordSuccess()
  } catch (error) {
    recordFailure()
    console.error('Write-through cache error:', error)
  }
}

/**
 * Cache warmup function
 * @param key - Cache key
 * @param fetcher - Function to fetch data
 * @param options - Cache options
 */
export async function warmCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions
): Promise<void> {
  try {
    const data = await fetcher()
    await writeThrough(key, data, options)
  } catch (error) {
    console.error('Cache warmup error:', error)
  }
}

/**
 * Refresh cache in background
 * @param key - Cache key
 * @param fetcher - Function to fetch fresh data
 * @param options - Cache options
 */
async function refreshInBackground<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions
): Promise<void> {
  try {
    const freshData = await fetcher()
    
    const cacheData: CachedData<T> = {
      data: freshData,
      timestamp: Date.now()
    }
    
    const redis = getRedisClient()
    await redis.setex(key, options.ttl, cacheData)
    
    console.log(`Background refresh completed for key: ${key}`)
  } catch (error) {
    console.error(`Background refresh failed for key: ${key}`, error)
  }
}

/**
 * Store cache tags for invalidation
 * @param key - Cache key
 * @param tags - Array of tags
 */
async function storeCacheTags(key: string, tags: string[]): Promise<void> {
  const redis = getRedisClient()
  
  // Store key in each tag set
  const promises = tags.map(tag => 
    redis.sadd(`tag:${tag}`, key)
  )
  
  await Promise.all(promises)
}

/**
 * Invalidate cache by tags
 * @param tags - Array of tags to invalidate
 */
export async function invalidateByTags(tags: string[]): Promise<void> {
  if (tags.length === 0) return

  try {
    const redis = getRedisClient()
    
    // Get all keys for each tag
    const keyPromises = tags.map(tag => 
      redis.smembers(`tag:${tag}`)
    )
    
    const keyArrays = await Promise.all(keyPromises)
    const allKeys = [...new Set(keyArrays.flat())]
    
    if (allKeys.length > 0) {
      // Delete all keys
      await redis.del(...allKeys)
      
      // Clean up tag sets
      const tagKeys = tags.map(tag => `tag:${tag}`)
      await redis.del(...tagKeys)
    }
  } catch (error) {
    console.error('Tag invalidation error:', error)
  }
}

/**
 * Batch get multiple cache keys
 * @param keys - Array of cache keys
 * @returns Map of key to cached data
 */
export async function batchGet<T>(keys: string[]): Promise<Map<string, T | null>> {
  const result = new Map<string, T | null>()
  
  if (keys.length === 0) return result
  
  if (isCircuitOpen()) {
    console.warn('Circuit breaker is open, returning empty cache')
    keys.forEach(key => result.set(key, null))
    return result
  }

  try {
    const redis = getRedisClient()
    const values = await redis.mget<CachedData<T>[]>(...keys)
    
    keys.forEach((key, index) => {
      const cached = values[index]
      if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour max
        result.set(key, cached.data)
      } else {
        result.set(key, null)
      }
    })
    
    recordSuccess()
  } catch (error) {
    recordFailure()
    console.error('Batch get error:', error)
    keys.forEach(key => result.set(key, null))
  }
  
  return result
}

/**
 * Cache with automatic key generation based on function arguments
 * @param prefix - Cache key prefix
 * @param fn - Function to cache
 * @param options - Cache options
 * @returns Cached function
 */
export function memoize<T extends (...args: any[]) => Promise<any>>(
  prefix: string,
  fn: T,
  options: CacheOptions
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    // Generate cache key from arguments
    const key = `${prefix}:${JSON.stringify(args)}`
    
    return cacheAside(key, () => fn(...args), options)
  }) as T
}