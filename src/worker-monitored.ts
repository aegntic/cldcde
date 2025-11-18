/**
 * Monitored Cloudflare Worker for cldcde.cc
 * Integrates comprehensive monitoring, logging, and tracing
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { compress } from 'hono/compress'
import { cache } from 'hono/cache'

// Import routes
import authRoutes from './api/auth'
import extensionRoutes from './api/extensions'
import mcpRoutes from './api/mcp'
import userRoutes from './api/users'
import healthRoutes from './api/health'

// Import monitoring
import { MetricsCollector, metricsMiddleware } from './monitoring/metrics'
import { initSentry, sentryMiddleware } from './monitoring/sentry'
import { logger, requestLoggingMiddleware } from './utils/logger'
import { initTracing, tracingMiddleware } from './monitoring/tracing'

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
  // Monitoring
  SENTRY_DSN?: string
  METRICS_URL?: string
  METRICS_API_KEY?: string
  TRACING_ENDPOINT?: string
  ENVIRONMENT?: string
  RELEASE_VERSION?: string
}

// Initialize monitoring services
function initializeMonitoring(env: Env) {
  // Initialize Sentry
  const sentry = env.SENTRY_DSN ? initSentry({
    dsn: env.SENTRY_DSN,
    environment: env.ENVIRONMENT || 'production',
    release: env.RELEASE_VERSION,
    sampleRate: 1.0,
    tracesSampleRate: 0.1
  }) : null

  // Initialize metrics collector
  const metrics = new MetricsCollector({
    METRICS_URL: env.METRICS_URL,
    METRICS_API_KEY: env.METRICS_API_KEY,
    KV: env.CACHE
  })

  // Initialize tracer
  const tracer = initTracing('cldcde-api', env.TRACING_ENDPOINT)

  return { sentry, metrics, tracer }
}

// Create Hono app with monitoring
export function createApp(env: Env) {
  const app = new Hono<{ Bindings: Env }>()
  const { sentry, metrics, tracer } = initializeMonitoring(env)

  // Global error handler
  app.onError((err, c) => {
    const log = logger.child({ 
      error: err.message,
      path: c.req.path,
      method: c.req.method 
    })
    
    log.error('Unhandled error', err)
    
    if (sentry) {
      sentry.captureException(err, {
        tags: {
          path: c.req.path,
          method: c.req.method
        }
      })
    }

    return c.json({ 
      error: 'Internal Server Error',
      message: env.ENVIRONMENT === 'development' ? err.message : undefined
    }, 500)
  })

  // Monitoring middleware - order matters!
  app.use('*', requestLoggingMiddleware(logger))
  app.use('*', tracingMiddleware(tracer))
  app.use('*', metricsMiddleware(metrics))
  if (sentry) {
    app.use('*', sentryMiddleware(sentry))
  }

  // CORS
  app.use('*', cors({
    origin: ['https://cldcde.cc', 'http://localhost:3000'],
    credentials: true
  }))

  // Compression
  app.use('*', compress())

  // Cache static API responses
  app.use('/api/extensions/*', cache({
    cacheName: 'cldcde-cache',
    cacheControl: 'max-age=3600'
  }))

  // Middleware to attach monitoring to context
  app.use('*', async (c, next) => {
    c.set('metrics', metrics)
    c.set('logger', logger.child({ 
      correlationId: c.get('correlationId'),
      requestId: c.get('requestId')
    }))
    await next()
  })

  // Health checks
  app.route('/health', healthRoutes)

  // Metrics endpoint
  app.get('/metrics', async (c) => {
    const summary = await metrics.getMetricsSummary()
    return c.json(summary)
  })

  // Web Vitals collection endpoint
  app.post('/api/metrics/vitals', async (c) => {
    try {
      const data = await c.req.json()
      const log = c.get('logger') as typeof logger
      
      // Log web vitals for analysis
      log.info('Web Vitals received', {
        metrics: data.metrics,
        performance: data.performance
      })

      // Record in metrics
      for (const vital of data.metrics) {
        metrics.recordBusinessMetric(`web_vitals.${vital.name}`, vital.value, {
          rating: vital.rating,
          navigation_type: vital.navigationType,
          url: data.performance.url
        })
      }

      return c.json({ success: true })
    } catch (error) {
      return c.json({ error: 'Invalid data' }, 400)
    }
  })

  // API Routes
  app.route('/api/auth', authRoutes)
  app.route('/api/extensions', extensionRoutes)
  app.route('/api/mcp', mcpRoutes)
  app.route('/api/users', userRoutes)

  // Serve frontend from R2
  app.get('*', async (c) => {
    const log = c.get('logger') as typeof logger
    const span = c.get('span')
    
    const url = new URL(c.req.url)
    let key = url.pathname.slice(1)
    
    if (!key || key.endsWith('/')) {
      key = key + 'index.html'
    }

    span?.setAttribute('storage.key', key)

    const cacheGetTimer = log.time('cache.get')
    const cachedResponse = await c.env.CACHE.get(`static:${key}`, 'stream')
    cacheGetTimer()

    if (cachedResponse) {
      metrics.recordCacheHit(`static:${key}`, true)
      span?.addEvent('cache.hit')
      
      return new Response(cachedResponse, {
        headers: {
          'content-type': getContentType(key),
          'cache-control': 'public, max-age=31536000, immutable',
          'x-cache': 'HIT'
        }
      })
    }

    metrics.recordCacheHit(`static:${key}`, false)
    span?.addEvent('cache.miss')

    const storageTimer = log.time('storage.get')
    const object = await c.env.STORAGE.get(key)
    storageTimer()
    
    if (!object) {
      // Fallback to index.html for SPA routing
      const index = await c.env.STORAGE.get('index.html')
      if (!index) {
        span?.setStatus('ERROR', 'Not Found')
        return c.text('Not Found', 404)
      }
      
      return new Response(index.body, {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'public, max-age=0, must-revalidate'
        }
      })
    }

    // Cache the response
    const body = await object.arrayBuffer()
    await c.env.CACHE.put(`static:${key}`, body, {
      expirationTtl: 86400 // 24 hours
    })

    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('cache-control', 'public, max-age=31536000, immutable')
    headers.set('x-cache', 'MISS')
    
    return new Response(body, { headers })
  })

  return app
}

// Content type helper
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const types: Record<string, string> = {
    'html': 'text/html; charset=utf-8',
    'js': 'application/javascript; charset=utf-8',
    'css': 'text/css; charset=utf-8',
    'json': 'application/json; charset=utf-8',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'otf': 'font/otf'
  }
  return types[ext || ''] || 'application/octet-stream'
}

// Export for Cloudflare Workers
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const app = createApp(env)
    return app.fetch(request, env, ctx)
  }
}