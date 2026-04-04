import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { compress } from 'hono/compress'
import { cache } from 'hono/cache'
import extensionRoutes from './api/extensions-v2'
import authRoutes from './api/auth-v2'
import mcpRoutes from './api/mcp-v2'
import userRoutes from './api/users-v2'
import forumRoutes from './api/forums-v2'
import newsRoutes from './api/news-v2'

// Cloudflare Worker Types
export interface Env {
  // KV Namespaces
  CACHE: KVNamespace
  
  // Environment variables
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_KEY: string
  MEILISEARCH_HOST: string
  MEILISEARCH_KEY: string
  SENTRY_DSN?: string
}

const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', cors({
  origin: ['https://cldcde.cc', 'http://localhost:3000'],
  credentials: true
}))
app.use('*', logger())
app.use('*', compress())

// Cache static API responses using Cloudflare KV
app.use('/api/extensions/*', cache({
  cacheName: 'cldcde-cache',
  cacheControl: 'max-age=300, stale-while-revalidate=3600'
}))

// Health check
app.get('/health', async (c) => {
  const services = {
    worker: 'healthy',
    cache: 'checking',
    supabase: 'checking',
    meilisearch: 'checking'
  }

  // Check KV Cache
  try {
    await c.env.CACHE.get('health-check')
    services.cache = 'healthy'
  } catch (e) {
    services.cache = 'unhealthy'
  }

  // Check Supabase
  try {
    const response = await fetch(`${c.env.SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY
      }
    })
    services.supabase = response.ok ? 'healthy' : 'unhealthy'
  } catch (e) {
    services.supabase = 'unhealthy'
  }

  // Check Meilisearch
  try {
    const response = await fetch(`${c.env.MEILISEARCH_HOST}/health`, {
      headers: {
        'Authorization': `Bearer ${c.env.MEILISEARCH_KEY}`
      }
    })
    services.meilisearch = response.ok ? 'healthy' : 'unhealthy'
  } catch (e) {
    services.meilisearch = 'unhealthy'
  }

  const allHealthy = Object.values(services).every(status => status === 'healthy')

  return c.json({ 
    status: allHealthy ? 'healthy' : 'degraded',
    services,
    timestamp: new Date().toISOString()
  })
})

// API version info
app.get('/api', (c) => {
  return c.json({
    name: 'cldcde.cc API',
    version: '2.0.0',
    description: 'Simplified architecture with Supabase + Meilisearch',
    endpoints: {
      auth: '/api/auth',
      extensions: '/api/extensions',
      mcp: '/api/mcp',
      users: '/api/users',
      forums: '/api/forums',
      news: '/api/news',
      search: '/api/search'
    }
  })
})

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/extensions', extensionRoutes)
app.route('/api/mcp', mcpRoutes)
app.route('/api/users', userRoutes)
app.route('/api/forums', forumRoutes)
app.route('/api/news', newsRoutes)

// Serve static files (SPA fallback)
app.get('*', async (c) => {
  // In production, this would serve from Cloudflare Pages
  // For now, return a simple HTML response
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>cldcde.cc - Claude Code Extensions</title>
      <style>
        body {
          background: #0a0a0a;
          color: #00ff00;
          font-family: 'Courier New', monospace;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
        }
        .terminal {
          border: 2px solid #00ff00;
          padding: 2rem;
          border-radius: 8px;
          text-align: center;
        }
        h1 { margin: 0 0 1rem 0; }
        p { margin: 0.5rem 0; }
        a { color: #00ff00; }
      </style>
    </head>
    <body>
      <div class="terminal">
        <h1>cldcde.cc</h1>
        <p>Claude Code Extensions Platform</p>
        <p>API: <a href="/api">/api</a></p>
        <p>Health: <a href="/health">/health</a></p>
        <p>Frontend coming soon...</p>
      </div>
    </body>
    </html>
  `)
})

// Error handling
app.onError((err, c) => {
  console.error('Worker error:', err)
  
  // Send to Sentry if configured
  if (c.env.SENTRY_DSN) {
    // Sentry error reporting would go here
  }
  
  return c.json({
    error: 'Internal server error',
    message: err.message
  }, 500)
})

export default app