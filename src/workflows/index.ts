// Main entry point for all Inngest workflows
import { inngest } from './inngest-client'

// Import all workflow functions
import { onboardUser, updateUserRecommendations } from './functions/user-workflows'
import { processExtensionSubmission, updateExtensionStats } from './functions/extension-workflows'
import { scanGithubTrends, updateInnovationScores } from './functions/innovation-workflows'
import { generateWeeklyDigest, moderateContent } from './functions/content-workflows'
import { systemHealthCheck, cleanupExpiredData } from './functions/system-workflows'
import { sendBatchNotifications, updateBulkExtensionAnalytics, aggregateUserActivity } from './functions/batch-workflows'

// Export all functions for registration
export const inngestFunctions = [
  // User workflows
  onboardUser,
  updateUserRecommendations,

  // Extension workflows
  processExtensionSubmission,
  updateExtensionStats,

  // Innovation workflows
  scanGithubTrends,
  updateInnovationScores,

  // Content workflows
  generateWeeklyDigest,
  moderateContent,

  // System workflows
  systemHealthCheck,
  cleanupExpiredData,

  // Batch workflows (new)
  sendBatchNotifications,
  updateBulkExtensionAnalytics,
  aggregateUserActivity,
]

// Export the client for sending events
export { inngest }

// Export types and utilities
export * from './types'
export * from './inngest-client'

// Helper function to register all functions with Inngest
export function registerInngestFunctions() {
  return inngestFunctions.map(fn => fn)
}

// Helper function for easy event sending
export async function sendEvent(eventName: string, data: any) {
  return await inngest.send({
    name: eventName,
    data: {
      ...data,
      timestamp: Date.now()
    }
  })
}