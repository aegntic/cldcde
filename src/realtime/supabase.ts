import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'

// Environment variables (should be set in .env or deployment config)
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || ''

// Activity feed event types
export type ActivityType = 
  | 'extension_added'
  | 'mcp_added'
  | 'rating_added'
  | 'review_added'
  | 'download'
  | 'user_joined'
  | 'milestone_reached'

export interface ActivityEvent {
  id: string
  type: ActivityType
  timestamp: string
  userId?: string
  username?: string
  targetId?: string
  targetName?: string
  targetType?: 'extension' | 'mcp'
  metadata?: {
    rating?: number
    reviewText?: string
    downloadCount?: number
    milestone?: string
    [key: string]: any
  }
}

export interface PresenceState {
  userId?: string
  username?: string
  currentPage: string
  targetId?: string
  targetType?: 'extension' | 'mcp'
  joinedAt: string
}

// Singleton Supabase client
let supabaseClient: SupabaseClient | null = null

/**
 * Get or create Supabase client instance
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.')
    }
    
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10, // Rate limiting
        },
      },
    })
  }
  
  return supabaseClient
}

/**
 * Subscribe to activity feed channel
 */
export function subscribeToActivityFeed(
  onActivity: (event: ActivityEvent) => void,
  onError?: (error: Error) => void
): RealtimeChannel {
  const client = getSupabaseClient()
  
  const channel = client
    .channel('activity-feed')
    .on('broadcast', { event: 'activity' }, (payload) => {
      try {
        const event = payload.payload as ActivityEvent
        onActivity(event)
      } catch (error) {
        onError?.(new Error('Failed to parse activity event'))
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Connected to activity feed')
      } else if (status === 'CHANNEL_ERROR') {
        onError?.(new Error('Failed to connect to activity feed'))
      } else if (status === 'TIMED_OUT') {
        onError?.(new Error('Connection to activity feed timed out'))
      }
    })
  
  return channel
}

/**
 * Broadcast an activity event
 */
export async function broadcastActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>): Promise<void> {
  const client = getSupabaseClient()
  
  const activityEvent: ActivityEvent = {
    ...event,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  }
  
  await client
    .channel('activity-feed')
    .send({
      type: 'broadcast',
      event: 'activity',
      payload: activityEvent,
    })
}

/**
 * Subscribe to presence channel for "users currently viewing"
 */
export function subscribeToPresence(
  page: string,
  targetId?: string,
  targetType?: 'extension' | 'mcp',
  onPresenceUpdate?: (users: PresenceState[]) => void
): RealtimeChannel {
  const client = getSupabaseClient()
  
  // Create channel name based on page and target
  let channelName = `presence:${page}`
  if (targetId && targetType) {
    channelName = `presence:${targetType}:${targetId}`
  }
  
  const channel = client.channel(channelName, {
    config: {
      presence: {
        key: crypto.randomUUID(), // Unique key for this user
      },
    },
  })
  
  // Track presence state
  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const users = Object.values(state).flat() as PresenceState[]
      onPresenceUpdate?.(users)
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', key, newPresences)
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', key, leftPresences)
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track this user's presence
        const presenceState: PresenceState = {
          currentPage: page,
          targetId,
          targetType,
          joinedAt: new Date().toISOString(),
        }
        
        await channel.track(presenceState)
      }
    })
  
  return channel
}

/**
 * Subscribe to specific entity updates (extension or MCP)
 */
export function subscribeToEntityUpdates(
  entityType: 'extension' | 'mcp',
  entityId: string,
  onUpdate: (data: any) => void
): RealtimeChannel {
  const client = getSupabaseClient()
  
  const channel = client
    .channel(`${entityType}:${entityId}`)
    .on('broadcast', { event: 'update' }, (payload) => {
      onUpdate(payload.payload)
    })
    .subscribe()
  
  return channel
}

/**
 * Connection state management with auto-reconnect
 */
export class RealtimeConnectionManager {
  private client: SupabaseClient
  private channels: Map<string, RealtimeChannel> = new Map()
  private reconnectInterval: NodeJS.Timeout | null = null
  private maxReconnectAttempts = 5
  private reconnectAttempts = 0
  private reconnectDelay = 1000 // Start with 1 second
  
  constructor() {
    this.client = getSupabaseClient()
    this.setupConnectionMonitoring()
  }
  
  private setupConnectionMonitoring() {
    // Monitor connection state
    setInterval(() => {
      const channels = Array.from(this.channels.values())
      channels.forEach(channel => {
        if (channel.state === 'closed' || channel.state === 'errored') {
          this.handleChannelError(channel)
        }
      })
    }, 5000) // Check every 5 seconds
  }
  
  private handleChannelError(channel: RealtimeChannel) {
    console.warn('Channel error detected, attempting reconnect...')
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }
    
    this.reconnectAttempts++
    
    // Exponential backoff
    setTimeout(() => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Reconnected successfully')
          this.reconnectAttempts = 0
          this.reconnectDelay = 1000
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000) // Max 30 seconds
          this.handleChannelError(channel)
        }
      })
    }, this.reconnectDelay)
  }
  
  addChannel(name: string, channel: RealtimeChannel) {
    this.channels.set(name, channel)
  }
  
  removeChannel(name: string) {
    const channel = this.channels.get(name)
    if (channel) {
      channel.unsubscribe()
      this.channels.delete(name)
    }
  }
  
  removeAllChannels() {
    this.channels.forEach(channel => channel.unsubscribe())
    this.channels.clear()
  }
  
  getChannel(name: string): RealtimeChannel | undefined {
    return this.channels.get(name)
  }
}

// Export singleton connection manager
export const connectionManager = new RealtimeConnectionManager()

/**
 * Notification types for the notification system foundation
 */
export interface Notification {
  id: string
  userId: string
  type: 'info' | 'success' | 'warning' | 'error' | 'activity'
  title: string
  message: string
  read: boolean
  createdAt: string
  metadata?: {
    activityType?: ActivityType
    targetId?: string
    targetType?: 'extension' | 'mcp'
    actionUrl?: string
    [key: string]: any
  }
}

/**
 * Subscribe to user notifications
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
): RealtimeChannel {
  const client = getSupabaseClient()
  
  const channel = client
    .channel(`notifications:${userId}`)
    .on('broadcast', { event: 'notification' }, (payload) => {
      const notification = payload.payload as Notification
      onNotification(notification)
    })
    .subscribe()
  
  connectionManager.addChannel(`notifications:${userId}`, channel)
  
  return channel
}

/**
 * Send a notification to a user
 */
export async function sendNotification(
  userId: string,
  notification: Omit<Notification, 'id' | 'createdAt' | 'read'>
): Promise<void> {
  const client = getSupabaseClient()
  
  const fullNotification: Notification = {
    ...notification,
    id: crypto.randomUUID(),
    userId,
    read: false,
    createdAt: new Date().toISOString(),
  }
  
  await client
    .channel(`notifications:${userId}`)
    .send({
      type: 'broadcast',
      event: 'notification',
      payload: fullNotification,
    })
}