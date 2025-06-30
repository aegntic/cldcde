/**
 * Cache-related type definitions
 */

export interface CacheConfig {
  url: string
  token: string
}

export interface CacheKey {
  prefix: string
  params?: Record<string, any>
}

export interface CacheMetrics {
  hits: number
  misses: number
  errors: number
  hitRate: number
  avgLatency: number
  totalRequests: number
}

export interface CacheInvalidationEvent {
  type: 'login' | 'create' | 'update' | 'delete' | 'rating' | 'download'
  entityType: 'extension' | 'mcp' | 'user'
  entityId: string
  userId?: string
  username?: string
  metadata?: Record<string, any>
}