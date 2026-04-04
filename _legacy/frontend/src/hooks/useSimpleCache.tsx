import { useState, useEffect, useCallback, useRef } from 'react'

// Simple in-memory cache
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>()

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    Array.from(this.cache.keys()).forEach(key => {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    })
  }

  clear(): void {
    this.cache.clear()
  }
}

// Global cache instance
const cache = new SimpleCache()

// Hook for cached API calls
interface UseCachedApiOptions {
  cacheKey: string
  cacheTTL?: number
  refetchInterval?: number
  onError?: (error: Error) => void
}

export function useCachedApi<T>(
  fetcher: () => Promise<T>,
  options: UseCachedApiOptions
) {
  const { cacheKey, cacheTTL = 5 * 60 * 1000, refetchInterval, onError } = options
  
  const [data, setData] = useState<T | null>(() => cache.get<T>(cacheKey))
  const [isLoading, setIsLoading] = useState(!data)
  const [error, setError] = useState<Error | null>(null)
  const [lastFetch, setLastFetch] = useState(0)
  
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchData = useCallback(async (skipCache = false) => {
    // Check cache first unless explicitly skipped
    if (!skipCache) {
      const cached = cache.get<T>(cacheKey)
      if (cached) {
        setData(cached)
        setIsLoading(false)
        return cached
      }
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      
      if (!isMountedRef.current) return

      cache.set(cacheKey, result, cacheTTL)
      setData(result)
      setLastFetch(Date.now())
      
      return result
    } catch (err) {
      if (!isMountedRef.current) return
      
      const error = err as Error
      setError(error)
      onError?.(error)
      
      // Try to use stale data if available
      const staleData = cache.get<T>(cacheKey)
      if (staleData) {
        setData(staleData)
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [cacheKey, cacheTTL, fetcher, onError])

  // Initial fetch
  useEffect(() => {
    if (!data) {
      fetchData()
    }
  }, [])

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval) return

    const interval = setInterval(() => {
      fetchData()
    }, refetchInterval)

    return () => clearInterval(interval)
  }, [refetchInterval, fetchData])

  const refresh = useCallback(() => {
    cache.invalidate(cacheKey)
    return fetchData(true)
  }, [cacheKey, fetchData])

  const invalidate = useCallback(() => {
    cache.invalidate(cacheKey)
    setData(null)
  }, [cacheKey])

  return {
    data,
    isLoading,
    error,
    refresh,
    invalidate,
    lastFetch
  }
}

// Featured content specific hook
export function useFeaturedContentSimple() {
  const fetcher = async () => {
    const response = await fetch('/api/featured')
    if (!response.ok) {
      throw new Error('Failed to fetch featured content')
    }
    return response.json()
  }

  return useCachedApi(fetcher, {
    cacheKey: 'featured:all',
    cacheTTL: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    onError: (error) => console.error('Featured content error:', error)
  })
}

// Hook for specific content types
export function useFeaturedTypeSimple(type: 'trending' | 'new' | 'popular' | 'curated') {
  const fetcher = async () => {
    const response = await fetch(`/api/featured/${type}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${type} content`)
    }
    return response.json()
  }

  return useCachedApi(fetcher, {
    cacheKey: `featured:${type}`,
    cacheTTL: 10 * 60 * 1000, // 10 minutes
    onError: (error) => console.error(`${type} content error:`, error)
  })
}

// Cache management utilities
export const cacheManager = {
  invalidateAll: () => cache.clear(),
  invalidateFeatured: () => cache.invalidatePattern('^featured:'),
  invalidateType: (type: string) => cache.invalidate(`featured:${type}`),
  getCacheKeys: () => Array.from((cache as any).cache.keys())
}