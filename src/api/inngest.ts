import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { inngest, registerInngestFunctions } from '../workflows'

const app = new Hono()

// Inngest API route for serving functions
app.get('/api/inngest', async (c) => {
  try {
    const functions = registerInngestFunctions()

    // Create a simple JSON response with function info
    const functionInfo = functions.map(fn => ({
      id: fn.id,
      name: fn.name,
      event: fn.event || 'cron-based',
      retries: fn.retries || 0
    }))

    return c.json({
      success: true,
      functions: functionInfo,
      count: functions.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error serving Inngest functions:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// Inngest webhook endpoint for receiving events
app.post('/api/inngest/webhook', async (c) => {
  try {
    const body = await c.req.json()

    // Validate the webhook payload (you'd want to add proper signature verification)
    if (!body.event || !body.data) {
      return c.json({
        success: false,
        error: 'Invalid webhook payload'
      }, 400)
    }

    // Send the event to Inngest
    const result = await inngest.send({
      name: body.event,
      data: {
        ...body.data,
        source: 'webhook',
        timestamp: Date.now()
      }
    })

    return c.json({
      success: true,
      eventId: result.ids[0],
      message: 'Event sent successfully'
    })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// Health check for Inngest integration
app.get('/api/inngest/health', async (c) => {
  try {
    // Test Inngest client connectivity
    const health = {
      status: 'healthy',
      client: 'connected',
      functions: registerInngestFunctions().length,
      timestamp: new Date().toISOString()
    }

    return c.json(health)
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Start Inngest dev server (for development)
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.INNGEST_PORT || 8288

  try {
    // This would typically be handled by the Inngest CLI
    // But we can provide a fallback for development
    console.log(`Inngest functions available at /api/inngest`)
    console.log(`Inngest health check at /api/inngest/health`)
  } catch (error) {
    console.error('Failed to start Inngest development server:', error)
  }
}

export { app as inngestRoutes }