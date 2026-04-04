import { inngest, EventNames, FunctionNames } from '../inngest-client'
import type { ExtensionEvent, ContentEvent } from '../types'

// Enhanced process extension submission workflow with latest best practices
export const processExtensionSubmission = inngest.createFunction(
  {
    id: FunctionNames.PROCESS_EXTENSION_SUBMISSION,
    name: 'Process Extension Submission',
    retries: 5,

    // Concurrency control per author to prevent abuse
    concurrency: {
      key: 'event.data.authorId',
      limit: 3, // Max 3 concurrent submissions per author
    },

    // Priority processing for premium authors
    priority: {
      run: 'event.data.isPremium ? 100 : 0'
    },

    // Cancellation support
    cancel: [
      {
        event: 'extension/withdrawn',
        if: 'async.data.extensionId == event.data.extensionId',
        timeout: '24h'
      }
    ],

    // Enhanced retry configuration
    retry: {
      attempts: 5,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 60000,
      randomize: true,
    }
  },
  { event: EventNames.Extension_CREATED },
  async ({ event, step }) => {
    const { extensionId, name, authorId, category, version, tags } = event.data

    // Step 1: Validate extension metadata with detailed error handling
    const validation = await step.run('validate-metadata', async () => {
      console.log(`Validating metadata for extension ${extensionId}`)

      try {
        // Integration with your validation service
        // const validation = await validationService.validateExtension(extensionId)

        // Simulate validation with proper error handling
        if (!name || name.length < 3) {
          const error = new Error('Extension name must be at least 3 characters')
          error.name = 'ValidationError'
          // Non-retriable error
          throw error
        }

        if (!authorId) {
          const error = new Error('Author ID is required')
          error.name = 'ValidationError'
          throw error
        }

        return {
          valid: true,
          extensionId,
          validationScore: 0.95,
          warnings: []
        }
      } catch (error) {
        console.error(`Validation failed for extension ${extensionId}:`, error)
        // Re-throw with additional context
        throw new Error(`Validation failed: ${error.message}`)
      }
    })

    // Step 2: Parallel processing for efficiency
    const [securityResult, qualityResult] = await step.parallel(
      // Security scan with retry on service failures
      async () => {
        return await step.run('security-scan', async () => {
          console.log(`Running security scan on extension ${extensionId}`)

          // Integration with security service
          // const scan = await securityService.scanExtension(extensionId)

          // Simulate security scan
          return {
            scanned: true,
            extensionId,
            passed: true,
            issues: [],
            scanId: `scan_${Date.now()}`
          }
        })
      },

      // Quality assessment with detailed metrics
      async () => {
        return await step.run('quality-assessment', async () => {
          console.log(`Assessing quality for extension ${extensionId}`)

          // Integration with quality service
          // const quality = await qualityService.assess(extensionId)

          // Simulate quality assessment
          return {
            assessed: true,
            extensionId,
            score: 0.85,
            metrics: {
              documentation: 0.8,
              codeQuality: 0.9,
              testCoverage: 0.7,
              communityAdoption: 0.6
            }
          }
        })
      }
    )

    // Step 3: Generate preview with timeout handling
    const preview = await step.run('generate-preview', async () => {
      console.log(`Generating preview for extension ${extensionId}`)

      try {
        // Integration with preview service with timeout
        // const preview = await Promise.race([
        //   previewService.generate(extensionId),
        //   new Promise((_, reject) =>
        //     setTimeout(() => reject(new Error('Preview generation timeout')), 30000)
        //   )
        // ])

        return {
          generated: true,
          extensionId,
          previewUrl: `https://previews.cldcde.cc/${extensionId}`,
          thumbnail: `https://thumbnails.cldcde.cc/${extensionId}.png`
        }
      } catch (error) {
        // Preview generation failure shouldn't block the workflow
        console.warn(`Preview generation failed for ${extensionId}:`, error)
        return {
          generated: false,
          extensionId,
          error: error.message
        }
      }
    })

    // Step 4: Send events for moderation and notification (parallel)
    await step.parallel(
      // Notify moderators
      async () => {
        return await step.run('notify-moderators', async () => {
          console.log(`Notifying moderators about new extension ${extensionId}`)

          // Send notification event
          await inngest.send({
            name: 'moderation/new-submission',
            data: {
              extensionId,
              name,
              authorId,
              category,
              validation,
              security: securityResult,
              quality: qualityResult,
              priority: qualityResult.score > 0.8 ? 'high' : 'normal'
            }
          })

          return { notified: true, extensionId }
        })
      },

      // Update author stats
      async () => {
        return await step.run('update-author-stats', async () => {
          console.log(`Updating stats for author ${authorId}`)

          // Integration with stats service
          // await statsService.updateAuthorStats(authorId, { submissions: 1 })

          return { updated: true, authorId, submissions: 1 }
        })
      }
    )

    // Step 5: Wait for moderator approval with timeout
    const approval = await step.waitForEvent('wait-for-moderation', {
      event: 'moderation/approved',
      timeout: '7d', // Wait up to 7 days for moderation
      if: `async.data.extensionId == "${extensionId}"`
    })

    if (approval) {
      // Final approval steps
      await step.run('finalize-approval', async () => {
        console.log(`Finalizing approval for extension ${extensionId}`)

        // Publish extension
        // await extensionService.publish(extensionId)

        // Send celebration email
        await inngest.send({
          name: 'user/extension-approved',
          data: {
            extensionId,
            authorId,
            name
          }
        })

        return { published: true, extensionId }
      })
    }

    return {
      success: true,
      extensionId,
      status: approval ? 'approved' : 'pending_review',
      validation,
      security: securityResult,
      quality: qualityResult,
      preview,
      approved: !!approval,
      message: approval
        ? 'Extension submission processed and approved successfully'
        : 'Extension submission processed and awaiting moderation'
    }
  }
)

// Update extension statistics workflow
export const updateExtensionStats = inngest.createFunction(
  {
    id: FunctionNames.UPDATE_EXTENSION_STATS,
    name: 'Update Extension Statistics',
    retries: 3,
  },
  {
    event: EventNames.USER_INSTALLED_EXTENSION,
    // Also trigger on uninstall
    event: EventNames.USER_UNINSTALLED_EXTENSION
  },
  async ({ event, step }) => {
    const { extensionId, userId } = event.data
    const isInstall = event.name === EventNames.USER_INSTALLED_EXTENSION

    // Update download count
    await step.run('update-download-count', async () => {
      console.log(`Updating download count for extension ${extensionId}`)
      // await statsService.updateDownloads(extensionId, isInstall ? 1 : -1)
      return { updated: true, extensionId, increment: isInstall ? 1 : -1 }
    })

    // Update popularity score
    await step.run('update-popularity', async () => {
      console.log(`Updating popularity score for extension ${extensionId}`)
      // await statsService.updatePopularity(extensionId)
      return { updated: true, extensionId }
    })

    // Update author stats
    await step.run('update-author-stats', async () => {
      console.log(`Updating author stats for extension ${extensionId}`)
      // const author = await db.extensions.getAuthor(extensionId)
      // await statsService.updateAuthorStats(author.id)
      return { updated: true, extensionId }
    })

    // Trend analysis
    await step.run('trend-analysis', async () => {
      console.log(`Running trend analysis for extension ${extensionId}`)
      // await trendAnalysis.analyze(extensionId)
      return { analyzed: true, extensionId }
    })

    return {
      success: true,
      extensionId,
      action: isInstall ? 'installed' : 'uninstalled',
      message: `Extension stats updated after ${isInstall ? 'install' : 'uninstall'}`
    }
  }
)