// Re-export types from supabase.ts for easier imports
export type {
  ActivityType,
  ActivityEvent,
  PresenceState,
  Notification
} from './supabase'

// Additional types for frontend components
export interface ActivityFeedItem extends ActivityEvent {
  formattedTime?: string
  actionText?: string
  iconType?: string
}

export interface RealtimeStats {
  activeUsers: number
  recentDownloads: number
  todayActivities: number
  popularItems: Array<{
    id: string
    name: string
    type: 'extension' | 'mcp'
    downloads: number
  }>
}

export interface ConnectionStatus {
  connected: boolean
  error?: string
  reconnecting?: boolean
  lastConnected?: Date
}