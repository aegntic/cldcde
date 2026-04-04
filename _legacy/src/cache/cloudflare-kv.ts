/**
 * Cloudflare KV caching strategy for edge deployment
 * This integrates with Cloudflare Workers for edge caching
 */

export interface KVCacheOptions {
  namespace: KVNamespace
  ttl?: number
  tags?: string[]
}

/**
 * Generate consistent cache keys
 */
export function generateKVKey(prefix: string, params: Record<string, any> = {}): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join(':')
  
  return sortedParams ? `${prefix}:${sortedParams}` : prefix
}

/**
 * Cache-aside pattern for Cloudflare KV
 */
export async function kvCacheAside<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: KVCacheOptions
): Promise<T> {
  const { namespace, ttl = 3600 } = options

  try {
    // Try to get from cache
    const cached = await namespace.get(key, 'json')
    if (cached) {
      return cached as T
    }
  } catch (error) {
    console.warn('KV cache read error:', error)
  }

  // Fetch fresh data
  const data = await fetcher()

  // Store in cache (fire and forget)
  namespace.put(key, JSON.stringify(data), {
    expirationTtl: ttl,
    metadata: {
      timestamp: Date.now(),
      tags: options.tags || []
    }
  }).catch(error => {
    console.error('KV cache write error:', error)
  })

  return data
}

/**
 * Stale-while-revalidate pattern for KV
 */
export async function kvStaleWhileRevalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: KVCacheOptions & { staleTime?: number }
): Promise<{ data: T; isStale: boolean }> {
  const { namespace, ttl = 3600, staleTime = 300 } = options

  try {
    // Get cached data with metadata
    const { value, metadata } = await namespace.getWithMetadata<any>(key, 'json')
    
    if (value) {
      const age = Date.now() - (metadata?.timestamp || 0)
      const isStale = age > staleTime * 1000

      if (isStale) {
        // Return stale data immediately, refresh in background
        fetcher().then(freshData => {
          namespace.put(key, JSON.stringify(freshData), {
            expirationTtl: ttl,
            metadata: {
              timestamp: Date.now(),
              tags: options.tags || []
            }
          }).catch(console.error)
        }).catch(console.error)
      }

      return { data: value as T, isStale }
    }
  } catch (error) {
    console.warn('KV cache read error:', error)
  }

  // No cache, fetch fresh
  const data = await fetcher()
  
  // Store in cache
  await namespace.put(key, JSON.stringify(data), {
    expirationTtl: ttl,
    metadata: {
      timestamp: Date.now(),
      tags: options.tags || []
    }
  })

  return { data, isStale: false }
}

/**
 * Batch invalidation for KV
 */
export async function kvBatchInvalidate(
  namespace: KVNamespace,
  keys: string[]
): Promise<void> {
  // KV doesn't support batch operations, so we use Promise.all
  await Promise.all(
    keys.map(key => namespace.delete(key).catch(console.error))
  )
}

/**
 * Tag-based invalidation (requires listing keys)
 */
export async function kvInvalidateByTag(
  namespace: KVNamespace,
  tag: string,
  prefix?: string
): Promise<void> {
  const listOptions = prefix ? { prefix } : {}
  const keys: string[] = []

  // List keys and check metadata
  let cursor: string | undefined
  do {
    const result = await namespace.list({ ...listOptions, cursor })
    
    for (const key of result.keys) {
      const { metadata } = await namespace.getWithMetadata(key.name)
      if (metadata?.tags?.includes(tag)) {
        keys.push(key.name)
      }
    }
    
    cursor = result.cursor
  } while (cursor)

  // Delete matching keys
  await kvBatchInvalidate(namespace, keys)
}

/**
 * Worker-specific cache middleware
 */
export function createKVCacheMiddleware(namespace: KVNamespace) {
  return async (request: Request, env: any, ctx: ExecutionContext) => {
    const url = new URL(request.url)
    const cacheKey = generateKVKey('api', {
      path: url.pathname,
      query: url.search
    })

    // Only cache GET requests
    if (request.method !== 'GET') {
      return null
    }

    // Try stale-while-revalidate
    const { data, isStale } = await kvStaleWhileRevalidate(
      cacheKey,
      async () => {
        // This would be replaced with actual fetch logic
        return null
      },
      {
        namespace,
        ttl: 3600,
        staleTime: 300
      }
    )

    if (data) {
      const headers = new Headers({
        'Content-Type': 'application/json',
        'X-Cache': isStale ? 'STALE' : 'HIT',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600'
      })

      return new Response(JSON.stringify(data), { headers })
    }

    return null
  }
}