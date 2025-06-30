import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { compress } from 'hono/compress'
import { authRoutes } from './api/auth'
import { extensionRoutes } from './api/extensions'
import { mcpRoutes } from './api/mcp'
import { userRoutes } from './api/users'
import { forumsApi } from './api/forums'
import { newsApi } from './api/news'
import { cacheMetricsHandler } from './middleware/cache'

// Cloudflare Worker Types
export interface Env {
  DB: D1Database
  STORAGE: R2Bucket
  CACHE: KVNamespace
  NEO4J_URI: string
  NEO4J_USERNAME: string
  NEO4J_PASSWORD: string
  JWT_SECRET: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  MEILISEARCH_HOST: string
  MEILISEARCH_KEY: string
  UPSTASH_REDIS_REST_URL: string
  UPSTASH_REDIS_REST_TOKEN: string
}

const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', cors({
  origin: ['https://cldcde.cc', 'http://localhost:3000'],
  credentials: true
}))
app.use('*', logger())
app.use('*', compress())

// Health check with service status
app.get('/health', async (c) => {
  const services = {
    worker: 'healthy',
    neo4j: 'checking',
    d1: 'checking',
    cache: 'checking'
  }

  try {
    // Check D1
    await c.env.DB.prepare('SELECT 1').first()
    services.d1 = 'healthy'
  } catch (e) {
    services.d1 = 'unhealthy'
  }

  try {
    // Check KV Cache
    await c.env.CACHE.get('health-check')
    services.cache = 'healthy'
  } catch (e) {
    services.cache = 'unhealthy'
  }

  return c.json({ 
    status: 'ok',
    services,
    timestamp: new Date().toISOString()
  })
})

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/extensions', extensionRoutes)
app.route('/api/mcp', mcpRoutes)
app.route('/api/users', userRoutes)
app.route('/api/forums', forumsApi)
app.route('/api/news', newsApi)

// Cache metrics endpoint
app.get('/api/cache/metrics', cacheMetricsHandler)

// Serve frontend from R2
app.get('*', async (c) => {
  const url = new URL(c.req.url)
  let key = url.pathname.slice(1)
  
  if (!key || key.endsWith('/')) {
    key = key + 'index.html'
  }

  const object = await c.env.STORAGE.get(key)
  
  if (!object) {
    // Fallback to index.html for SPA routing
    const index = await c.env.STORAGE.get('index.html')
    if (!index) {
      return c.text('Not Found', 404)
    }
    return new Response(index.body, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0, must-revalidate'
      }
    })
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('cache-control', 'public, max-age=31536000, immutable')
  
  return new Response(object.body, { headers })
})

export default app