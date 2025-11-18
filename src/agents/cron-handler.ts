import { Hono } from 'hono'
import { createAnthropicMonitor, runScheduledMonitoring } from './anthropic-monitor'
import { createBlogGenerator, runScheduledBlogGeneration } from './blog-generator'
import { innovationCron } from './innovation-cron.js'

const cron = new Hono()

// Cron endpoint for scheduled monitoring
cron.post('/monitor-anthropic', async (c) => {
  // Verify cron secret to prevent unauthorized calls
  const cronSecret = c.req.header('X-Cron-Secret')
  if (cronSecret !== c.env.CRON_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const result = await runScheduledMonitoring({
      SUPABASE_URL: c.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: c.env.SUPABASE_SERVICE_KEY,
      GITHUB_TOKEN: c.env.GITHUB_TOKEN,
      TWITTER_BEARER_TOKEN: c.env.TWITTER_BEARER_TOKEN
    })

    return c.json(result)
  } catch (error) {
    console.error('Cron job failed:', error)
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// Manual trigger endpoint (for testing)
cron.post('/monitor-anthropic/manual', async (c) => {
  // Require authentication
  const user = c.get('user')
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403)
  }

  try {
    const monitor = createAnthropicMonitor({
      SUPABASE_URL: c.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: c.env.SUPABASE_SERVICE_KEY,
      GITHUB_TOKEN: c.env.GITHUB_TOKEN,
      TWITTER_BEARER_TOKEN: c.env.TWITTER_BEARER_TOKEN
    })

    const results = await monitor.monitor()
    
    return c.json({
      success: true,
      totalItems: results.length,
      items: results.map(item => ({
        source: item.source,
        title: item.title,
        url: item.url,
        relevance_score: item.relevance_score,
        published_at: item.published_at
      }))
    })
  } catch (error) {
    console.error('Manual monitoring failed:', error)
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// Get queued content for blog generation
cron.get('/monitor-anthropic/queue', async (c) => {
  // Require authentication
  const user = c.get('user')
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401)
  }

  try {
    const monitor = createAnthropicMonitor({
      SUPABASE_URL: c.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: c.env.SUPABASE_SERVICE_KEY
    })

    const queuedContent = await monitor.getQueuedContent()
    
    return c.json({
      success: true,
      count: queuedContent.length,
      items: queuedContent
    })
  } catch (error) {
    console.error('Failed to fetch queue:', error)
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// Cron endpoint for blog generation
cron.post('/generate-blogs', async (c) => {
  // Verify cron secret
  const cronSecret = c.req.header('X-Cron-Secret')
  if (cronSecret !== c.env.CRON_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const result = await runScheduledBlogGeneration({
      SUPABASE_URL: c.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: c.env.SUPABASE_SERVICE_KEY
    })

    return c.json(result)
  } catch (error) {
    console.error('Blog generation cron job failed:', error)
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// Combined cron job - monitor and generate
cron.post('/monitor-and-generate', async (c) => {
  // Verify cron secret
  const cronSecret = c.req.header('X-Cron-Secret')
  if (cronSecret !== c.env.CRON_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    // First run monitoring
    const monitoringResult = await runScheduledMonitoring({
      SUPABASE_URL: c.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: c.env.SUPABASE_SERVICE_KEY,
      GITHUB_TOKEN: c.env.GITHUB_TOKEN,
      TWITTER_BEARER_TOKEN: c.env.TWITTER_BEARER_TOKEN
    })

    // Then generate blogs from queued content
    const blogResult = await runScheduledBlogGeneration({
      SUPABASE_URL: c.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: c.env.SUPABASE_SERVICE_KEY
    })

    return c.json({
      success: true,
      monitoring: monitoringResult,
      blogGeneration: blogResult
    })
  } catch (error) {
    console.error('Combined cron job failed:', error)
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// Innovation tracker endpoints
cron.post('/innovation/scan', async (c) => {
  // Verify cron secret or admin auth
  const cronSecret = c.req.header('X-Cron-Secret')
  const apiKey = c.req.header('X-API-Key')
  
  if (cronSecret !== c.env.CRON_SECRET && apiKey !== c.env.ADMIN_API_KEY) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    await innovationCron.triggerScan()
    return c.json({
      success: true,
      message: 'Innovation scan triggered successfully'
    })
  } catch (error) {
    console.error('Innovation scan failed:', error)
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// Start innovation cron job on server startup
innovationCron.start()

export default cron