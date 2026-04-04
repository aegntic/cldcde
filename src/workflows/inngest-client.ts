import { Inngest } from 'inngest'

// Enhanced Inngest client configuration based on latest best practices
export const inngest = new Inngest({
  id: 'cldcde-platform',
  name: 'CLDCDE Platform',
  baseUrl: process.env.INNGEST_EVENT_KEY
    ? `https://api.inngest.com`
    : process.env.INNGEST_BASE_URL || 'http://localhost:8288',

  // Enhanced retry strategy with exponential backoff
  retry: {
    attempts: 5, // Increased from 3 for better reliability
    minTimeout: 1000,
    maxTimeout: 60000, // Increased to 60 seconds
    factor: 2, // Exponential backoff
    randomize: true, // Jitter to prevent thundering herd
  },

  // Rate limiting for API protection
  throttle: {
    limit: 10,
    period: '1m',
  },

  // Logging configuration with detailed context
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  },

  // Event key for production
  eventKey: process.env.INNGEST_EVENT_KEY,

  // Signing key for webhooks
  signingKey: process.env.INNGEST_SIGNING_KEY,

  // Optimistic concurrency for high-throughput scenarios
  dev: process.env.NODE_ENV !== 'production',
})

// Export common event names for consistency
export const EventNames = {
  // User events
  USER_SIGNED_UP: 'user/signed-up',
  USER_PROFILE_UPDATED: 'user/profile-updated',
  USER_INSTALLED_EXTENSION: 'user/installed-extension',
  USER_UNINSTALLED_EXTENSION: 'user/uninstalled-extension',

  // Extension events
  Extension_CREATED: 'extension/created',
  Extension_UPDATED: 'extension/updated',
  Extension_APPROVED: 'extension/approved',
  Extension_FEATURED: 'extension/featured',

  // Content events
  CONTENT_GENERATED: 'content/generated',
  CONTENT_PUBLISHED: 'content/published',
  CONTENT_FLAGGED: 'content/flagged',

  // Monitoring events
  SYSTEM_ALERT: 'system/alert',
  PERFORMANCE_DEGRADED: 'system/performance-degraded',
  ERROR_REPORTED: 'system/error-reported',

  // Innovation tracking
  TREND_DETECTED: 'innovation/trend-detected',
  NEW_REPOSITORY_FOUND: 'innovation/new-repository-found',

  // Background processing
  SYNC_COMPLETED: 'sync/completed',
  SYNC_FAILED: 'sync/failed',
  CRON_TRIGGERED: 'cron/triggered',

  // Batch processing events
  NOTIFICATION_SEND: 'notification/send',
  EXTENSION_ANALYTICS_UPDATE: 'extension/analytics.update',
  USER_ACTIVITY: 'user/activity',
  MODERATION_NEW_SUBMISSION: 'moderation/new-submission',
  MODERATION_APPROVED: 'moderation/approved',
  EXTENSION_WITHDRAWN: 'extension/withdrawn',
  USER_EXTENSION_APPROVED: 'user/extension-approved',
} as const

// Export function names for consistency
export const FunctionNames = {
  // User workflows
  ONBOARD_USER: 'onboard-user',
  UPDATE_USER_RECOMMENDATIONS: 'update-user-recommendations',

  // Extension workflows
  PROCESS_EXTENSION_SUBMISSION: 'process-extension-submission',
  UPDATE_EXTENSION_STATS: 'update-extension-stats',

  // Content workflows
  GENERATE_WEEKLY_DIGEST: 'generate-weekly-digest',
  MODERATE_CONTENT: 'moderate-content',

  // Innovation workflows
  SCAN_GITHUB_TRENDS: 'scan-github-trends',
  UPDATE_INNOVATION_SCORES: 'update-innovation-scores',

  // System workflows
  HEALTH_CHECK: 'system-health-check',
  CLEANUP_EXPIRED_DATA: 'cleanup-expired-data',
} as const

// Utility to create typed event payloads
export function createEvent<T extends Record<string, any>>(
  name: keyof typeof EventNames,
  data: T
) {
  return {
    name: EventNames[name] as string,
    data,
  }
}