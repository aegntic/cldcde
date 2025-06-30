import { Context, Next } from 'hono'
import { 
  generateCacheKey, 
  CACHE_PREFIXES, 
  CACHE_TTL,
  getCacheMetrics
} from '../cache/upstash'
import { cacheAside, CacheOptions } from '../cache/strategies'

/**
 * Cache middleware for Hono framework
 */

interface CacheMiddlewareOptions {
  prefix: string
  ttl: number
  staleWhileRevalidate?: number
  tags?: string[]
  keyGenerator?: (c: Context) => string
}

/**
 * Create cache middleware for Hono routes
 * @param options - Cache middleware options
 * @returns Hono middleware function
 */
export function cache(options: CacheMiddlewareOptions) {
  return async (c: Context, next: Next) => {
    // Skip caching for non-GET requests
    if (c.req.method !== 'GET') {
      return next()
    }

    // Generate cache key
    const cacheKey = options.keyGenerator 
      ? options.keyGenerator(c)
      : generateCacheKey(options.prefix, {
          path: c.req.path,
          query: c.req.query()
        })

    // Define cache options
    const cacheOptions: CacheOptions = {
      ttl: options.ttl,
      staleWhileRevalidate: options.staleWhileRevalidate,
      tags: options.tags
    }

    try {
      // Try to get cached response
      const cachedResponse = await cacheAside(
        cacheKey,
        async () => {
          // Execute the actual handler
          await next()
          
          // Check if response is cacheable
          if (c.res.status >= 200 && c.res.status < 300) {
            const body = await c.res.json()
            return {
              body,
              headers: Object.fromEntries(c.res.headers.entries())
            }
          }
          
          throw new Error('Non-cacheable response')
        },
        cacheOptions
      )

      // Set cached response
      c.header('X-Cache', 'HIT')
      c.header('Cache-Control', `public, max-age=${options.ttl}, stale-while-revalidate=${options.staleWhileRevalidate || 0}`)
      
      // Restore headers from cache
      if (cachedResponse.headers) {
        Object.entries(cachedResponse.headers).forEach(([key, value]) => {
          if (key.toLowerCase() !== 'x-cache') {
            c.header(key, value as string)
          }
        })
      }

      return c.json(cachedResponse.body)
    } catch (error) {
      // On cache error, proceed normally
      c.header('X-Cache', 'MISS')
      return next()
    }
  }
}

/**
 * Cache middleware presets for common endpoints
 */
export const cachePresets = {
  /**
   * Extensions list endpoint cache
   */
  extensionsList: cache({
    prefix: CACHE_PREFIXES.EXTENSIONS_LIST,
    ttl: CACHE_TTL.LISTS,
    staleWhileRevalidate: 300, // 5 minutes
    tags: ['extensions'],
    keyGenerator: (c) => {
      const query = c.req.query()
      return generateCacheKey(CACHE_PREFIXES.EXTENSIONS_LIST, {
        search: query.search || '',
        category: query.category || '',
        platform: query.platform || '',
        sort: query.sort || 'downloads',
        page: query.page || '1',
        limit: query.limit || '20'
      })
    }
  }),

  /**
   * MCP servers list endpoint cache
   */
  mcpList: cache({
    prefix: CACHE_PREFIXES.MCP_LIST,
    ttl: CACHE_TTL.LISTS,
    staleWhileRevalidate: 300,
    tags: ['mcp'],
    keyGenerator: (c) => {
      const query = c.req.query()
      return generateCacheKey(CACHE_PREFIXES.MCP_LIST, {
        search: query.search || '',
        category: query.category || '',
        platform: query.platform || '',
        sort: query.sort || 'downloads',
        page: query.page || '1',
        limit: query.limit || '20'
      })
    }
  }),

  /**
   * User profile endpoint cache
   */
  userProfile: cache({
    prefix: CACHE_PREFIXES.USER_PROFILE,
    ttl: CACHE_TTL.USER_DATA,
    staleWhileRevalidate: 60,
    keyGenerator: (c) => {
      const username = c.req.param('username')
      return generateCacheKey(CACHE_PREFIXES.USER_PROFILE, { username })
    }
  }),

  /**
   * Extension detail endpoint cache
   */
  extensionDetail: cache({
    prefix: CACHE_PREFIXES.EXTENSIONS_DETAIL,
    ttl: CACHE_TTL.DETAILS,
    staleWhileRevalidate: 300,
    keyGenerator: (c) => {
      const id = c.req.param('id')
      return generateCacheKey(CACHE_PREFIXES.EXTENSIONS_DETAIL, { id })
    }
  }),

  /**
   * MCP server detail endpoint cache
   */
  mcpDetail: cache({
    prefix: CACHE_PREFIXES.MCP_DETAIL,
    ttl: CACHE_TTL.DETAILS,
    staleWhileRevalidate: 300,
    keyGenerator: (c) => {
      const id = c.req.param('id')
      return generateCacheKey(CACHE_PREFIXES.MCP_DETAIL, { id })
    }
  }),

  /**
   * User extensions endpoint cache
   */
  userExtensions: cache({
    prefix: CACHE_PREFIXES.USER_EXTENSIONS,
    ttl: CACHE_TTL.USER_DATA,
    staleWhileRevalidate: 60,
    keyGenerator: (c) => {
      const username = c.req.param('username')
      const query = c.req.query()
      return generateCacheKey(CACHE_PREFIXES.USER_EXTENSIONS, {
        username,
        page: query.page || '1',
        limit: query.limit || '20'
      })
    }
  }),

  /**
   * User MCP servers endpoint cache
   */
  userMcp: cache({
    prefix: CACHE_PREFIXES.USER_MCP,
    ttl: CACHE_TTL.USER_DATA,
    staleWhileRevalidate: 60,
    keyGenerator: (c) => {
      const username = c.req.param('username')
      const query = c.req.query()
      return generateCacheKey(CACHE_PREFIXES.USER_MCP, {
        username,
        page: query.page || '1',
        limit: query.limit || '20'
      })
    }
  }),

  /**
   * User stats endpoint cache
   */
  userStats: cache({
    prefix: CACHE_PREFIXES.USER_STATS,
    ttl: CACHE_TTL.STATS,
    staleWhileRevalidate: 120,
    keyGenerator: (c) => {
      const username = c.req.param('username')
      return generateCacheKey(CACHE_PREFIXES.USER_STATS, { username })
    }
  }),

  /**
   * Categories endpoint cache
   */
  categories: cache({
    prefix: CACHE_PREFIXES.CATEGORIES,
    ttl: CACHE_TTL.CATEGORIES,
    staleWhileRevalidate: 600,
    tags: ['categories']
  }),

  /**
   * Featured content endpoint cache
   */
  featured: cache({
    prefix: CACHE_PREFIXES.FEATURED,
    ttl: CACHE_TTL.FEATURED,
    staleWhileRevalidate: 300,
    tags: ['featured'],
    keyGenerator: (c) => {
      const type = c.req.param('type')
      return generateCacheKey(CACHE_PREFIXES.FEATURED, { type: type || 'all' })
    }
  })
}

/**
 * Cache metrics endpoint
 */
export async function cacheMetricsHandler(c: Context) {
  const metrics = getCacheMetrics()
  
  return c.json({
    metrics: {
      hits: metrics.hits,
      misses: metrics.misses,
      errors: metrics.errors,
      hitRate: Math.round(metrics.hitRate * 100) / 100,
      avgLatency: Math.round(metrics.avgLatency * 100) / 100,
      totalRequests: metrics.hits + metrics.misses
    }
  })
}