import { z } from 'zod'

// Analytics event schemas
export const SearchEventSchema = z.object({
  eventType: z.enum(['search', 'autocomplete', 'click', 'view']),
  query: z.string(),
  timestamp: z.number(),
  userId: z.string().optional(),
  sessionId: z.string(),
  
  // Search-specific fields
  resultsCount: z.number().optional(),
  responseTime: z.number().optional(),
  filters: z.record(z.string()).optional(),
  sort: z.string().optional(),
  page: z.number().optional(),
  
  // Click-specific fields
  resultId: z.string().optional(),
  resultType: z.enum(['extension', 'mcp']).optional(),
  resultPosition: z.number().optional(),
  
  // Context
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
})

export type SearchEvent = z.infer<typeof SearchEventSchema>

// Analytics aggregation
export interface SearchMetrics {
  totalSearches: number
  uniqueUsers: number
  avgResponseTime: number
  avgResultsCount: number
  topQueries: Array<{ query: string; count: number }>
  topClickedResults: Array<{ id: string; name: string; clicks: number }>
  searchesWithNoResults: number
  clickThroughRate: number
  popularFilters: Record<string, number>
  searchVolumeTrend: Array<{ date: string; count: number }>
}

// In-memory analytics buffer
class AnalyticsBuffer {
  private events: SearchEvent[] = []
  private maxBufferSize = 1000
  private flushInterval = 60000 // 1 minute
  private flushTimer: Timer | null = null

  constructor() {
    this.startFlushTimer()
  }

  add(event: SearchEvent) {
    this.events.push(event)
    
    if (this.events.length >= this.maxBufferSize) {
      this.flush()
    }
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  async flush() {
    if (this.events.length === 0) return
    
    const eventsToFlush = [...this.events]
    this.events = []
    
    try {
      // Here you would send events to your analytics service
      // For now, we'll process them locally
      await this.processEvents(eventsToFlush)
    } catch (error) {
      console.error('Failed to flush analytics:', error)
      // Re-add events on failure
      this.events.unshift(...eventsToFlush)
    }
  }

  private async processEvents(events: SearchEvent[]) {
    // Group events by type for batch processing
    const eventsByType = events.reduce((acc, event) => {
      if (!acc[event.eventType]) {
        acc[event.eventType] = []
      }
      acc[event.eventType].push(event)
      return acc
    }, {} as Record<string, SearchEvent[]>)

    // Process each event type
    for (const [eventType, typeEvents] of Object.entries(eventsByType)) {
      console.log(`Processing ${typeEvents.length} ${eventType} events`)
      
      // Here you would typically:
      // 1. Send to analytics service (e.g., Mixpanel, Amplitude)
      // 2. Store in database for reporting
      // 3. Update real-time dashboards
    }
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.flush()
  }
}

// Global analytics buffer
const analyticsBuffer = new AnalyticsBuffer()

// Analytics functions
export function trackSearch(params: {
  query: string
  resultsCount: number
  responseTime: number
  filters?: Record<string, string>
  sort?: string
  page?: number
  userId?: string
  sessionId: string
}) {
  analyticsBuffer.add({
    eventType: 'search',
    query: params.query,
    timestamp: Date.now(),
    userId: params.userId,
    sessionId: params.sessionId,
    resultsCount: params.resultsCount,
    responseTime: params.responseTime,
    filters: params.filters,
    sort: params.sort,
    page: params.page,
  })
}

export function trackAutocomplete(params: {
  query: string
  resultsCount: number
  responseTime: number
  userId?: string
  sessionId: string
}) {
  analyticsBuffer.add({
    eventType: 'autocomplete',
    query: params.query,
    timestamp: Date.now(),
    userId: params.userId,
    sessionId: params.sessionId,
    resultsCount: params.resultsCount,
    responseTime: params.responseTime,
  })
}

export function trackClick(params: {
  query: string
  resultId: string
  resultType: 'extension' | 'mcp'
  resultPosition: number
  userId?: string
  sessionId: string
}) {
  analyticsBuffer.add({
    eventType: 'click',
    query: params.query,
    timestamp: Date.now(),
    userId: params.userId,
    sessionId: params.sessionId,
    resultId: params.resultId,
    resultType: params.resultType,
    resultPosition: params.resultPosition,
  })
}

export function trackView(params: {
  query: string
  resultId: string
  resultType: 'extension' | 'mcp'
  userId?: string
  sessionId: string
}) {
  analyticsBuffer.add({
    eventType: 'view',
    query: params.query,
    timestamp: Date.now(),
    userId: params.userId,
    sessionId: params.sessionId,
    resultId: params.resultId,
    resultType: params.resultType,
  })
}

// Query analysis functions
export function analyzeQuery(query: string): {
  tokens: string[]
  hasSpecialChars: boolean
  language: string
  intent: 'navigational' | 'informational' | 'transactional'
} {
  const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 0)
  const hasSpecialChars = /[^a-zA-Z0-9\s]/.test(query)
  
  // Simple intent detection
  let intent: 'navigational' | 'informational' | 'transactional' = 'informational'
  if (tokens.some(t => ['download', 'install', 'get'].includes(t))) {
    intent = 'transactional'
  } else if (tokens.length === 1 || tokens.some(t => t.includes('.'))) {
    intent = 'navigational'
  }

  return {
    tokens,
    hasSpecialChars,
    language: 'en', // Simple detection, could be enhanced
    intent,
  }
}

// Popular queries tracking
const popularQueriesCache = new Map<string, number>()

export function updatePopularQueries(query: string) {
  const normalizedQuery = query.toLowerCase().trim()
  const count = popularQueriesCache.get(normalizedQuery) || 0
  popularQueriesCache.set(normalizedQuery, count + 1)
  
  // Keep only top 1000 queries
  if (popularQueriesCache.size > 1000) {
    const entries = Array.from(popularQueriesCache.entries())
    entries.sort((a, b) => b[1] - a[1])
    
    popularQueriesCache.clear()
    entries.slice(0, 1000).forEach(([q, c]) => {
      popularQueriesCache.set(q, c)
    })
  }
}

export function getPopularQueries(limit: number = 10): Array<{ query: string; count: number }> {
  const entries = Array.from(popularQueriesCache.entries())
  entries.sort((a, b) => b[1] - a[1])
  
  return entries.slice(0, limit).map(([query, count]) => ({ query, count }))
}

// Search quality metrics
export function calculateSearchQuality(params: {
  query: string
  resultsCount: number
  clickedResults: number
  viewTime: number
}): {
  relevanceScore: number
  engagementScore: number
  qualityScore: number
} {
  // Simple relevance calculation
  const relevanceScore = Math.min(params.resultsCount / 10, 1)
  
  // Engagement based on clicks
  const clickRate = params.resultsCount > 0 ? params.clickedResults / params.resultsCount : 0
  const engagementScore = Math.min(clickRate * 2, 1)
  
  // Overall quality
  const qualityScore = (relevanceScore + engagementScore) / 2
  
  return {
    relevanceScore,
    engagementScore,
    qualityScore,
  }
}

// Export analytics buffer for cleanup
export function flushAnalytics() {
  return analyticsBuffer.flush()
}

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    analyticsBuffer.destroy()
  })
}