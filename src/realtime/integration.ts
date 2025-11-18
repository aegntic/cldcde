import { broadcastActivity, sendNotification } from './supabase'
import { ActivityType } from './types'

/**
 * Helper functions to integrate realtime events with the existing API
 */

/**
 * Broadcast when a new extension is added
 */
export async function broadcastExtensionAdded(extension: {
  id: string
  name: string
  author: string
  authorId?: string
}) {
  await broadcastActivity({
    type: 'extension_added',
    targetId: extension.id,
    targetName: extension.name,
    targetType: 'extension',
    username: extension.author,
    userId: extension.authorId
  })
}

/**
 * Broadcast when a new MCP server is added
 */
export async function broadcastMCPAdded(mcp: {
  id: string
  name: string
  author: string
  authorId?: string
}) {
  await broadcastActivity({
    type: 'mcp_added',
    targetId: mcp.id,
    targetName: mcp.name,
    targetType: 'mcp',
    username: mcp.author,
    userId: mcp.authorId
  })
}

/**
 * Broadcast when a rating is added
 */
export async function broadcastRatingAdded(rating: {
  userId: string
  username: string
  targetId: string
  targetName: string
  targetType: 'extension' | 'mcp'
  rating: number
}) {
  await broadcastActivity({
    type: 'rating_added',
    userId: rating.userId,
    username: rating.username,
    targetId: rating.targetId,
    targetName: rating.targetName,
    targetType: rating.targetType,
    metadata: {
      rating: rating.rating
    }
  })
}

/**
 * Broadcast when a review is added
 */
export async function broadcastReviewAdded(review: {
  userId: string
  username: string
  targetId: string
  targetName: string
  targetType: 'extension' | 'mcp'
  reviewText: string
}) {
  await broadcastActivity({
    type: 'review_added',
    userId: review.userId,
    username: review.username,
    targetId: review.targetId,
    targetName: review.targetName,
    targetType: review.targetType,
    metadata: {
      reviewText: review.reviewText.substring(0, 100) + (review.reviewText.length > 100 ? '...' : '')
    }
  })
}

/**
 * Broadcast when something is downloaded
 */
export async function broadcastDownload(download: {
  targetId: string
  targetName: string
  targetType: 'extension' | 'mcp'
  userId?: string
  username?: string
}) {
  await broadcastActivity({
    type: 'download',
    targetId: download.targetId,
    targetName: download.targetName,
    targetType: download.targetType,
    userId: download.userId,
    username: download.username
  })
}

/**
 * Broadcast when a new user joins
 */
export async function broadcastUserJoined(user: {
  id: string
  username: string
}) {
  await broadcastActivity({
    type: 'user_joined',
    userId: user.id,
    username: user.username
  })
}

/**
 * Broadcast milestone achievements
 */
export async function broadcastMilestone(milestone: {
  targetId: string
  targetName: string
  targetType: 'extension' | 'mcp'
  milestone: string
  downloadCount?: number
}) {
  await broadcastActivity({
    type: 'milestone_reached',
    targetId: milestone.targetId,
    targetName: milestone.targetName,
    targetType: milestone.targetType,
    metadata: {
      milestone: milestone.milestone,
      downloadCount: milestone.downloadCount
    }
  })
}

/**
 * Send notification to extension/MCP author when someone reviews
 */
export async function notifyAuthorOfReview(
  authorId: string,
  reviewer: string,
  targetName: string,
  targetType: 'extension' | 'mcp',
  reviewId: string
) {
  await sendNotification(authorId, {
    type: 'activity',
    title: 'New Review',
    message: `${reviewer} reviewed your ${targetType} "${targetName}"`,
    userId: authorId,
    metadata: {
      activityType: 'review_added',
      targetType,
      actionUrl: `/${targetType}s/${reviewId}`
    }
  })
}

/**
 * Send notification to extension/MCP author when someone rates
 */
export async function notifyAuthorOfRating(
  authorId: string,
  rater: string,
  targetName: string,
  targetType: 'extension' | 'mcp',
  rating: number
) {
  await sendNotification(authorId, {
    type: 'activity',
    title: 'New Rating',
    message: `${rater} rated your ${targetType} "${targetName}" ${rating} stars`,
    userId: authorId,
    metadata: {
      activityType: 'rating_added',
      targetType,
      rating
    }
  })
}

/**
 * Check and broadcast download milestones
 */
export function checkDownloadMilestone(
  currentDownloads: number,
  previousDownloads: number,
  targetId: string,
  targetName: string,
  targetType: 'extension' | 'mcp'
) {
  const milestones = [100, 1000, 10000, 50000, 100000]
  
  for (const milestone of milestones) {
    if (previousDownloads < milestone && currentDownloads >= milestone) {
      broadcastMilestone({
        targetId,
        targetName,
        targetType,
        milestone: `${targetName} reached ${milestone.toLocaleString()} downloads!`,
        downloadCount: milestone
      })
      break
    }
  }
}