import { inngest, EventNames, FunctionNames } from '../inngest-client'
import type { UserEvent, ExtensionEvent } from '../types'

// Batch email notifications workflow - demonstrates event batching
export const sendBatchNotifications = inngest.createFunction(
  {
    id: 'batch-notifications',
    name: 'Send Batch Email Notifications',
    retries: 3,

    // Batch up to 100 notifications per user with 30-second timeout
    batchEvents: {
      maxSize: 100,
      timeout: '30s',
      key: 'event.data.userId' // Group by user ID
    },

    // Enhanced retry configuration
    retry: {
      attempts: 3,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 30000,
      randomize: true,
    }
  },
  { event: 'notification/send' },
  async ({ events, step }) => {
    console.log(`Processing batch of ${events.length} notifications`)

    // Group notifications by type for better email content
    const notificationsByType = events.reduce((groups, event) => {
      const type = event.data.type || 'general'
      if (!groups[type]) groups[type] = []
      groups[type].push(event.data)
      return groups
    }, {})

    // Send consolidated email per notification type
    const sentEmails = await step.parallel(
      ...Object.entries(notificationsByType).map(([type, notifications]) =>
        async () => {
          return await step.run(`send-${type}-notifications`, async () => {
            const userId = notifications[0].userId
            const userEmail = notifications[0].email

            console.log(`Sending ${notifications.length} ${type} notifications to ${userEmail}`)

            // Integration with email service
            // await emailService.sendBatch({
            //   to: userEmail,
            //   template: `batch-${type}`,
            //   data: { notifications }
            // })

            return {
              sent: true,
              type,
              userId,
              email: userEmail,
              count: notifications.length,
              sentAt: Date.now()
            }
          })
        }
      )
    )

    return {
      success: true,
      batchId: `batch_${Date.now()}`,
      totalNotifications: events.length,
      notificationsByType: Object.fromEntries(
        Object.entries(notificationsByType).map(([type, notifs]) => [type, notifs.length])
      ),
      emailsSent: sentEmails,
      processedAt: Date.now()
    }
  }
)

// Bulk extension analytics update - demonstrates high-performance batch processing
export const updateBulkExtensionAnalytics = inngest.createFunction(
  {
    id: 'bulk-extension-analytics',
    name: 'Update Bulk Extension Analytics',
    retries: 5,

    // Process up to 500 extension events in batches
    batchEvents: {
      maxSize: 500,
      timeout: '60s',
      key: 'event.data.category' // Group by category for optimized processing
    },

    // Concurrency control to prevent database overload
    concurrency: {
      key: 'event.data.category',
      limit: 2, // Max 2 concurrent batches per category
    },

    // Priority for high-value categories
    priority: {
      run: 'event.data.isPremiumCategory ? 200 : 50'
    }
  },
  { event: 'extension/analytics.update' },
  async ({ events, step }) => {
    console.log(`Processing analytics batch of ${events.length} extension events`)

    const category = events[0].data.category

    // Step 1: Aggregate metrics by extension
    const aggregatedMetrics = await step.run('aggregate-metrics', async () => {
      const metrics = {}

      events.forEach(event => {
        const { extensionId, eventType, value = 1 } = event.data

        if (!metrics[extensionId]) {
          metrics[extensionId] = {
            downloads: 0,
            views: 0,
            ratings: 0,
            installs: 0,
            totalEvents: 0
          }
        }

        metrics[extensionId][eventType] = (metrics[extensionId][eventType] || 0) + value
        metrics[extensionId].totalEvents++
      })

      return metrics
    })

    // Step 2: Update database in bulk for efficiency
    const updateResults = await step.run('bulk-database-update', async () => {
      console.log(`Updating ${Object.keys(aggregatedMetrics).length} extensions in bulk`)

      // Integration with database bulk operations
      // const results = await db.extensions.bulkUpdateAnalytics(aggregatedMetrics)

      // Simulate bulk update
      const extensionIds = Object.keys(aggregatedMetrics)
      return {
        updated: extensionIds.length,
        extensions: extensionIds,
        category,
        timestamp: Date.now()
      }
    })

    // Step 3: Update popularity scores and trending
    const trendingUpdates = await step.run('update-trending', async () => {
      console.log(`Calculating trending scores for category ${category}`)

      // Integration with trending algorithm
      // const trending = await trendingService.updateCategoryTrends(category, aggregatedMetrics)

      return {
        category,
        extensionsUpdated: Object.keys(aggregatedMetrics).length,
        trendingRecalculated: true,
        timestamp: Date.now()
      }
    })

    // Step 4: Trigger cache invalidation in parallel
    await step.parallel(
      // Invalidate extension caches
      async () => {
        return await step.run('invalidate-extension-cache', async () => {
          const extensionIds = Object.keys(aggregatedMetrics)

          // Integration with cache service
          // await cacheService.invalidateExtensions(extensionIds)

          return {
            invalidated: extensionIds.length,
            type: 'extension',
            timestamp: Date.now()
          }
        })
      },

      // Update search index
      async () => {
        return await step.run('update-search-index', async () => {
          // Integration with search service
          // await searchService.bulkIndexExtensions(aggregatedMetrics)

          return {
            indexed: Object.keys(aggregatedMetrics).length,
            type: 'search',
            timestamp: Date.now()
          }
        })
      },

      // Update category leaderboard
      async () => {
        return await step.run('update-leaderboard', async () => {
          // Integration with leaderboard service
          // await leaderboardService.updateCategory(category, aggregatedMetrics)

          return {
            category,
            leaderboardUpdated: true,
            timestamp: Date.now()
          }
        })
      }
    )

    return {
      success: true,
      batchId: `analytics_batch_${Date.now()}`,
      category,
      eventsProcessed: events.length,
      extensionsUpdated: Object.keys(aggregatedMetrics).length,
      aggregatedMetrics,
      updateResults,
      trendingUpdates,
      processedAt: Date.now()
    }
  }
)

// User activity aggregation workflow - demonstrates long-running batch processing
export const aggregateUserActivity = inngest.createFunction(
  {
    id: 'aggregate-user-activity',
    name: 'Aggregate User Activity',
    retries: 3,

    // Batch user activity events
    batchEvents: {
      maxSize: 1000,
      timeout: '5m', // Longer timeout for larger batches
      key: 'event.data.userId' // Group by user
    },

    // Cancellation for user deletion
    cancel: [
      {
        event: 'user/deleted',
        if: 'async.data.userId == event.data.userId'
      }
    ]
  },
  { event: 'user/activity' },
  async ({ events, step }) => {
    const userId = events[0].data.userId
    console.log(`Aggregating ${events.length} activity events for user ${userId}`)

    // Step 1: Process activities with time windows
    const activityAggregates = await step.run('process-activities', async () => {
      const aggregates = {
        daily: {},
        weekly: {},
        monthly: {},
        total: {
          extensionsViewed: 0,
          extensionsInstalled: 0,
          searches: 0,
          logins: 0,
          sessions: new Set()
        }
      }

      events.forEach(event => {
        const { activity, timestamp } = event.data
        const date = new Date(timestamp)

        // Time bucket keys
        const dayKey = date.toISOString().split('T')[0]
        const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        // Initialize buckets if needed
        [dayKey, weekKey, monthKey].forEach(key => {
          ['daily', 'weekly', 'monthly'].forEach(period => {
            if (!aggregates[period][key]) {
              aggregates[period][key] = {
                extensionsViewed: 0,
                extensionsInstalled: 0,
                searches: 0,
                logins: 0,
                sessions: new Set(),
                date: key
              }
            }
          })
        })

        // Increment counters
        const increment = (obj, key, value = 1) => {
          obj[key] = (obj[key] || 0) + value
        }

        const activityType = activity.type
        if (activityType === 'extension_view') increment(aggregates.daily[dayKey].extensionsViewed)
        if (activityType === 'extension_install') increment(aggregates.daily[dayKey].extensionsInstalled)
        if (activityType === 'search') increment(aggregates.daily[dayKey].searches)
        if (activityType === 'login') increment(aggregates.daily[dayKey].logins)

        if (activityType === 'extension_view') increment(aggregates.weekly[weekKey].extensionsViewed)
        if (activityType === 'extension_install') increment(aggregates.weekly[weekKey].extensionsInstalled)
        if (activityType === 'search') increment(aggregates.weekly[weekKey].searches)
        if (activityType === 'login') increment(aggregates.weekly[weekKey].logins)

        if (activityType === 'extension_view') increment(aggregates.monthly[monthKey].extensionsViewed)
        if (activityType === 'extension_install') increment(aggregates.monthly[monthKey].extensionsInstalled)
        if (activityType === 'search') increment(aggregates.monthly[monthKey].searches)
        if (activityType === 'login') increment(aggregates.monthly[monthKey].logins)

        // Total counters
        if (activityType === 'extension_view') increment(aggregates.total.extensionsViewed)
        if (activityType === 'extension_install') increment(aggregates.total.extensionsInstalled)
        if (activityType === 'search') increment(aggregates.total.searches)
        if (activityType === 'login') increment(aggregates.total.logins)

        // Track sessions
        const sessionId = activity.sessionId
        if (sessionId) {
          aggregates.total.sessions.add(sessionId)
          aggregates.daily[dayKey].sessions.add(sessionId)
          aggregates.weekly[weekKey].sessions.add(sessionId)
          aggregates.monthly[monthKey].sessions.add(sessionId)
        }
      })

      // Convert Sets to counts
      Object.values(aggregates.daily).forEach(day => {
        day.sessions = day.sessions.size
      })
      Object.values(aggregates.weekly).forEach(week => {
        week.sessions = week.sessions.size
      })
      Object.values(aggregates.monthly).forEach(month => {
        month.sessions = month.sessions.size
      })
      aggregates.total.sessions = aggregates.total.sessions.size

      return aggregates
    })

    // Step 2: Update user analytics in database
    const updateResults = await step.run('update-user-analytics', async () => {
      console.log(`Updating analytics for user ${userId}`)

      // Integration with user analytics service
      // await userAnalyticsService.update(userId, activityAggregates)

      return {
        userId,
        updated: true,
        periodsUpdated: ['daily', 'weekly', 'monthly', 'total'],
        timestamp: Date.now()
      }
    })

    // Step 3: Generate insights and recommendations
    const insights = await step.run('generate-insights', async () => {
      const { total } = activityAggregates

      // Simple insight generation
      const userInsights = {
        engagementLevel: total.sessions > 10 ? 'high' : total.sessions > 3 ? 'medium' : 'low',
        favoriteActivities: Object.entries({
          extensionsViewed: total.extensionsViewed,
          extensionsInstalled: total.extensionsInstalled,
          searches: total.searches
        })
          .sort(([,a], [,b]) => b - a)
          .slice(0, 2)
          .map(([activity]) => activity),
        recommendation: total.extensionsInstalled === 0
          ? 'Explore trending extensions to get started'
          : total.extensionsViewed > total.extensionsInstalled * 5
          ? 'Consider installing some extensions you\'ve viewed'
          : 'Great engagement! Keep exploring'
      }

      return userInsights
    })

    return {
      success: true,
      userId,
      eventsProcessed: events.length,
      activityAggregates,
      updateResults,
      insights,
      processedAt: Date.now()
    }
  }
)