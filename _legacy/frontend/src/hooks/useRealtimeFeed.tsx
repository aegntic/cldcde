import { useState, useEffect, useCallback, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import {
  subscribeToActivityFeed,
  subscribeToPresence,
  subscribeToNotifications,
  connectionManager,
  ActivityEvent,
  PresenceState,
  Notification
} from '../../../src/realtime/supabase'
import { ActivityFeedItem, ConnectionStatus } from '../../../src/realtime/types'

interface UseRealtimeFeedOptions {
  maxItems?: number
  enablePresence?: boolean
  presencePage?: string
  presenceTargetId?: string
  presenceTargetType?: 'extension' | 'mcp'
  userId?: string
  onConnectionError?: (error: Error) => void
}

interface UseRealtimeFeedReturn {
  activities: ActivityFeedItem[]
  presenceUsers: PresenceState[]
  notifications: Notification[]
  connectionStatus: ConnectionStatus
  clearActivities: () => void
  markNotificationRead: (id: string) => void
  unreadNotificationCount: number
}

/**
 * Format activity event for display
 */
function formatActivityEvent(event: ActivityEvent): ActivityFeedItem {
  const item: ActivityFeedItem = {
    ...event,
    formattedTime: formatRelativeTime(new Date(event.timestamp)),
  }
  
  // Generate action text based on activity type
  switch (event.type) {
    case 'extension_added':
      item.actionText = `New extension "${event.targetName}" added`
      item.iconType = 'plus'
      break
    case 'mcp_added':
      item.actionText = `New MCP server "${event.targetName}" added`
      item.iconType = 'server'
      break
    case 'rating_added':
      item.actionText = `${event.username || 'Someone'} rated "${event.targetName}" ${event.metadata?.rating} stars`
      item.iconType = 'star'
      break
    case 'review_added':
      item.actionText = `${event.username || 'Someone'} reviewed "${event.targetName}"`
      item.iconType = 'comment'
      break
    case 'download':
      item.actionText = `"${event.targetName}" was downloaded`
      item.iconType = 'download'
      break
    case 'user_joined':
      item.actionText = `${event.username} joined the community`
      item.iconType = 'user'
      break
    case 'milestone_reached':
      item.actionText = event.metadata?.milestone || 'Milestone reached!'
      item.iconType = 'trophy'
      break
    default:
      item.actionText = 'Activity occurred'
      item.iconType = 'activity'
  }
  
  return item
}

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  
  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  
  return date.toLocaleDateString()
}

/**
 * Custom hook for managing realtime activity feed
 */
export function useRealtimeFeed(options: UseRealtimeFeedOptions = {}): UseRealtimeFeedReturn {
  const {
    maxItems = 50,
    enablePresence = false,
    presencePage,
    presenceTargetId,
    presenceTargetType,
    userId,
    onConnectionError
  } = options
  
  const [activities, setActivities] = useState<ActivityFeedItem[]>([])
  const [presenceUsers, setPresenceUsers] = useState<PresenceState[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnecting: false
  })
  
  const channelsRef = useRef<{
    activity?: RealtimeChannel
    presence?: RealtimeChannel
    notifications?: RealtimeChannel
  }>({})
  
  // Handle new activity events
  const handleActivity = useCallback((event: ActivityEvent) => {
    const formattedItem = formatActivityEvent(event)
    
    setActivities(prev => {
      const updated = [formattedItem, ...prev]
      // Keep only the most recent items
      return updated.slice(0, maxItems)
    })
    
    setConnectionStatus(prev => ({
      ...prev,
      connected: true,
      lastConnected: new Date()
    }))
  }, [maxItems])
  
  // Handle connection errors
  const handleError = useCallback((error: Error) => {
    console.error('Realtime connection error:', error)
    
    setConnectionStatus(prev => ({
      ...prev,
      connected: false,
      error: error.message,
      reconnecting: true
    }))
    
    onConnectionError?.(error)
    
    // Attempt reconnection after delay
    setTimeout(() => {
      setConnectionStatus(prev => ({
        ...prev,
        reconnecting: false
      }))
    }, 5000)
  }, [onConnectionError])
  
  // Handle presence updates
  const handlePresenceUpdate = useCallback((users: PresenceState[]) => {
    setPresenceUsers(users)
  }, [])
  
  // Handle notifications
  const handleNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev])
  }, [])
  
  // Subscribe to channels
  useEffect(() => {
    // Subscribe to activity feed
    try {
      const activityChannel = subscribeToActivityFeed(handleActivity, handleError)
      channelsRef.current.activity = activityChannel
      connectionManager.addChannel('activity-feed', activityChannel)
    } catch (error) {
      handleError(error as Error)
    }
    
    // Subscribe to presence if enabled
    if (enablePresence && presencePage) {
      try {
        const presenceChannel = subscribeToPresence(
          presencePage,
          presenceTargetId,
          presenceTargetType,
          handlePresenceUpdate
        )
        channelsRef.current.presence = presenceChannel
        connectionManager.addChannel(`presence-${presencePage}`, presenceChannel)
      } catch (error) {
        console.error('Presence subscription error:', error)
      }
    }
    
    // Subscribe to notifications if userId provided
    if (userId) {
      try {
        const notificationChannel = subscribeToNotifications(userId, handleNotification)
        channelsRef.current.notifications = notificationChannel
      } catch (error) {
        console.error('Notification subscription error:', error)
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (channelsRef.current.activity) {
        connectionManager.removeChannel('activity-feed')
      }
      if (channelsRef.current.presence && presencePage) {
        connectionManager.removeChannel(`presence-${presencePage}`)
      }
      if (channelsRef.current.notifications && userId) {
        connectionManager.removeChannel(`notifications:${userId}`)
      }
    }
  }, [enablePresence, presencePage, presenceTargetId, presenceTargetType, userId, handleActivity, handleError, handlePresenceUpdate, handleNotification])
  
  // Clear activities
  const clearActivities = useCallback(() => {
    setActivities([])
  }, [])
  
  // Mark notification as read
  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }, [])
  
  // Calculate unread notification count
  const unreadNotificationCount = notifications.filter(n => !n.read).length
  
  return {
    activities,
    presenceUsers,
    notifications,
    connectionStatus,
    clearActivities,
    markNotificationRead,
    unreadNotificationCount
  }
}