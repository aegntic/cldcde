import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRealtimeFeed } from './useRealtimeFeed'
import { useFeaturedContentSimple, useFeaturedTypeSimple, cacheManager } from './useSimpleCache'

// Combined hook for all dynamic content needs
interface DynamicContentOptions {
  enableRealtime?: boolean
  enablePresence?: boolean
  userId?: string
}

export function useDynamicContent(options: DynamicContentOptions = {}) {
  const { enableRealtime = true, enablePresence = false, userId } = options

  // Featured content with caching
  const featured = useFeaturedContentSimple()

  // Real-time activity feed
  const realtime = useRealtimeFeed({
    maxItems: 20,
    enablePresence,
    presencePage: 'homepage',
    userId,
    onConnectionError: (error) => {
      console.error('Realtime connection error:', error)
    }
  })

  // Combine real-time activities with featured content updates
  const latestAdditions = useMemo(() => {
    if (!realtime.activities.length) return []

    // Filter for new additions from activities
    return realtime.activities
      .filter(activity => 
        activity.type === 'extension_added' || 
        activity.type === 'mcp_added'
      )
      .slice(0, 5) // Show latest 5
  }, [realtime.activities])

  // Stats combining featured stats with real-time updates
  const combinedStats = useMemo(() => {
    const baseStats = featured.data?.stats || {
      extensionCount: 0,
      mcpCount: 0,
      userCount: 0,
      totalDownloads: 0
    }

    // Add real-time increments
    const realtimeIncrements = realtime.activities.reduce((acc, activity) => {
      if (activity.type === 'extension_added') acc.extensions++
      if (activity.type === 'mcp_added') acc.mcp++
      if (activity.type === 'user_joined') acc.users++
      if (activity.type === 'download') acc.downloads++
      return acc
    }, { extensions: 0, mcp: 0, users: 0, downloads: 0 })

    return {
      extensionCount: baseStats.extensionCount + realtimeIncrements.extensions,
      mcpCount: baseStats.mcpCount + realtimeIncrements.mcp,
      userCount: baseStats.userCount + realtimeIncrements.users,
      totalDownloads: baseStats.totalDownloads + realtimeIncrements.downloads
    }
  }, [featured.data?.stats, realtime.activities])

  // Check if content needs refresh based on activity
  const shouldRefresh = useCallback(() => {
    const recentActivities = realtime.activities.slice(0, 10)
    const hasNewContent = recentActivities.some(activity => 
      activity.type === 'extension_added' || 
      activity.type === 'mcp_added'
    )
    return hasNewContent
  }, [realtime.activities])

  // Auto-refresh featured content when significant changes detected
  useEffect(() => {
    if (shouldRefresh() && !featured.isLoading) {
      const timer = setTimeout(() => {
        featured.refresh()
      }, 10000) // Wait 10 seconds before refreshing to batch updates

      return () => clearTimeout(timer)
    }
  }, [shouldRefresh, featured.refresh, featured.isLoading])

  return {
    // Featured content
    featured: featured.data,
    isLoadingFeatured: featured.isLoading,
    refreshFeatured: featured.refresh,

    // Real-time data
    activities: realtime.activities,
    latestAdditions,
    presenceUsers: realtime.presenceUsers,
    connectionStatus: realtime.connectionStatus,
    notifications: realtime.notifications,
    unreadCount: realtime.unreadNotificationCount,

    // Combined stats
    stats: combinedStats,

    // Actions
    markNotificationRead: realtime.markNotificationRead,
    clearActivities: realtime.clearActivities,

    // Status
    hasRealtimeUpdates: realtime.activities.length > 0,
    shouldRefresh: shouldRefresh()
  }
}

// Optimized hook for homepage hero section
export function useHomepageHero() {
  const content = useDynamicContent({ enableRealtime: true })

  return {
    stats: content.stats,
    trending: content.featured?.trending.slice(0, 3) || [],
    latestActivity: content.activities[0],
    isLoading: content.isLoadingFeatured,
    connectionStatus: content.connectionStatus
  }
}

// Hook for featured sections with lazy loading
export function useFeaturedSection(
  section: 'trending' | 'new' | 'popular',
  options: { autoRefresh?: boolean } = {}
) {
  const { autoRefresh = false } = options
  const [isExpanded, setIsExpanded] = useState(false)
  
  const featured = useFeaturedContentSimple()
  const realtime = useRealtimeFeed({ maxItems: 10 })

  // Map section to content
  const sectionContent = useMemo(() => {
    if (!featured.data) return []
    
    switch (section) {
      case 'trending':
        return featured.data.trending
      case 'new':
        return featured.data.new
      case 'popular':
        return featured.data.popularMcp
      default:
        return []
    }
  }, [featured.data, section])

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh && realtime.activities.length > 0) {
      const hasRelevantUpdate = realtime.activities.some(activity => {
        if (section === 'new') {
          return activity.type === 'extension_added' || activity.type === 'mcp_added'
        }
        if (section === 'trending') {
          return activity.type === 'download' || activity.type === 'rating_added'
        }
        return false
      })

      if (hasRelevantUpdate) {
        const timer = setTimeout(() => {
          featured.refresh()
        }, 30000) // Refresh after 30 seconds

        return () => clearTimeout(timer)
      }
    }
  }, [autoRefresh, realtime.activities, section, featured.refresh])

  return {
    items: isExpanded ? sectionContent : sectionContent.slice(0, 6),
    totalCount: sectionContent.length,
    isLoading: featured.isLoading,
    isExpanded,
    setIsExpanded,
    hasUpdates: realtime.activities.length > 0,
    refresh: featured.refresh
  }
}