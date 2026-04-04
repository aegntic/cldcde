import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

// Types
interface FeaturedItem {
  id: string
  name: string
  description: string
  category: string
  downloads: number
  rating: number
  author: string
  tags: string[]
  type?: 'extension' | 'mcp'
}

interface PlatformStats {
  extensionCount: number
  mcpCount: number
  userCount: number
  totalDownloads: number
}

interface FeaturedContent {
  trending: FeaturedItem[]
  new: FeaturedItem[]
  popularMcp: FeaturedItem[]
  stats: PlatformStats
  lastUpdated: string
}

interface SpecificFeaturedContent {
  type: 'trending' | 'new' | 'popular' | 'curated'
  items: FeaturedItem[]
  count: number
  lastUpdated: string
}

// API functions
const fetchFeaturedContent = async (): Promise<FeaturedContent> => {
  const response = await fetch('/api/featured')
  if (!response.ok) {
    throw new Error('Failed to fetch featured content')
  }
  return response.json()
}

const fetchSpecificFeaturedContent = async (
  type: 'trending' | 'new' | 'popular' | 'curated'
): Promise<SpecificFeaturedContent> => {
  const response = await fetch(`/api/featured/${type}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${type} content`)
  }
  return response.json()
}

// Main hook for homepage featured content
export function useFeaturedContent() {
  const queryClient = useQueryClient()

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['featured'],
    queryFn: fetchFeaturedContent,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    cacheTime: 15 * 60 * 1000, // Keep cache for 15 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000 // Auto-refetch every 5 minutes
  })

  // Manual refresh function
  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries(['featured'])
    refetch()
  }, [queryClient, refetch])

  // Prefetch specific content types
  const prefetchType = useCallback(
    (type: 'trending' | 'new' | 'popular' | 'curated') => {
      queryClient.prefetchQuery({
        queryKey: ['featured', type],
        queryFn: () => fetchSpecificFeaturedContent(type),
        staleTime: 5 * 60 * 1000
      })
    },
    [queryClient]
  )

  return {
    content: data,
    isLoading,
    error,
    refresh,
    isFetching,
    prefetchType
  }
}

// Hook for specific featured content type
export function useFeaturedType(type: 'trending' | 'new' | 'popular' | 'curated') {
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['featured', type],
    queryFn: () => fetchSpecificFeaturedContent(type),
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false
  })

  return {
    items: data?.items || [],
    count: data?.count || 0,
    lastUpdated: data?.lastUpdated,
    isLoading,
    error,
    refetch
  }
}

// Hook with real-time updates integration
export function useFeaturedWithRealtime() {
  const queryClient = useQueryClient()
  const featured = useFeaturedContent()
  const [realtimeUpdate, setRealtimeUpdate] = useState<string | null>(null)

  useEffect(() => {
    // Listen for realtime updates from the activity feed
    const handleRealtimeUpdate = (event: CustomEvent) => {
      const { type, targetId, targetName } = event.detail

      // Update cache based on activity type
      if (type === 'extension_added' || type === 'mcp_added') {
        // Invalidate and refetch featured content
        queryClient.invalidateQueries(['featured'])
        queryClient.invalidateQueries(['featured', 'new'])
        setRealtimeUpdate(`New ${type === 'extension_added' ? 'extension' : 'MCP'}: ${targetName}`)
      } else if (type === 'milestone_reached') {
        // Just update stats
        queryClient.invalidateQueries(['featured'])
        setRealtimeUpdate('Platform milestone reached!')
      }

      // Clear update message after 5 seconds
      setTimeout(() => setRealtimeUpdate(null), 5000)
    }

    // Subscribe to custom events from the realtime feed
    window.addEventListener('realtime:activity', handleRealtimeUpdate as EventListener)

    return () => {
      window.removeEventListener('realtime:activity', handleRealtimeUpdate as EventListener)
    }
  }, [queryClient])

  return {
    ...featured,
    realtimeUpdate
  }
}

// Cache management utilities
export function useFeaturedCacheManagement() {
  const queryClient = useQueryClient()

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries(['featured'])
  }, [queryClient])

  const invalidateType = useCallback(
    (type: 'trending' | 'new' | 'popular' | 'curated') => {
      queryClient.invalidateQueries(['featured', type])
    },
    [queryClient]
  )

  const warmCache = useCallback(async () => {
    // Prefetch all content types
    const types: Array<'trending' | 'new' | 'popular' | 'curated'> = [
      'trending',
      'new',
      'popular',
      'curated'
    ]

    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['featured'],
        queryFn: fetchFeaturedContent,
        staleTime: 5 * 60 * 1000
      }),
      ...types.map(type =>
        queryClient.prefetchQuery({
          queryKey: ['featured', type],
          queryFn: () => fetchSpecificFeaturedContent(type),
          staleTime: 5 * 60 * 1000
        })
      )
    ])
  }, [queryClient])

  return {
    invalidateAll,
    invalidateType,
    warmCache
  }
}