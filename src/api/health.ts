/**
 * Health Check Endpoints for cldcde.cc
 * Comprehensive service health monitoring
 */

import { Hono } from 'hono'
import type { Env } from '../worker'
import { logger } from '../utils/logger'

const app = new Hono<{ Bindings: Env }>()

interface ServiceHealth {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime?: number
  lastChecked: string
  details?: Record<string, any>
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  services: ServiceHealth[]
  metrics?: {
    cpu?: number
    memory?: number
    connections?: number
  }
}

/**
 * Basic health check - for load balancer
 */
app.get('/', async (c) => {
  return c.text('OK', 200)
})

/**
 * Liveness probe - is the service running?
 */
app.get('/live', async (c) => {
  return c.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  })
})

/**
 * Readiness probe - is the service ready to accept traffic?
 */
app.get('/ready', async (c) => {
  const checks = await Promise.allSettled([
    checkD1Database(c.env.DB),
    checkKVCache(c.env.CACHE)
  ])

  const allHealthy = checks.every(check => 
    check.status === 'fulfilled' && check.value.status === 'healthy'
  )

  if (allHealthy) {
    return c.json({ status: 'ready' })
  } else {
    return c.json({ status: 'not_ready' }, 503)
  }
})

/**
 * Detailed health check - comprehensive service status
 */
app.get('/detailed', async (c) => {
  const startTime = Date.now()
  const log = logger.child({ endpoint: '/health/detailed' })

  // Run all health checks in parallel
  const [d1Health, kvHealth, neo4jHealth, r2Health, searchHealth] = await Promise.allSettled([
    checkD1Database(c.env.DB),
    checkKVCache(c.env.CACHE),
    checkNeo4j(c.env),
    checkR2Storage(c.env.STORAGE),
    checkMeilisearch(c.env)
  ])

  const services: ServiceHealth[] = [
    d1Health.status === 'fulfilled' ? d1Health.value : createErrorHealth('D1 Database', d1Health.reason),
    kvHealth.status === 'fulfilled' ? kvHealth.value : createErrorHealth('KV Cache', kvHealth.reason),
    neo4jHealth.status === 'fulfilled' ? neo4jHealth.value : createErrorHealth('Neo4j', neo4jHealth.reason),
    r2Health.status === 'fulfilled' ? r2Health.value : createErrorHealth('R2 Storage', r2Health.reason),
    searchHealth.status === 'fulfilled' ? searchHealth.value : createErrorHealth('Meilisearch', searchHealth.reason)
  ]

  // Determine overall health status
  const unhealthyCount = services.filter(s => s.status === 'unhealthy').length
  const degradedCount = services.filter(s => s.status === 'degraded').length
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  if (unhealthyCount > 0) {
    overallStatus = 'unhealthy'
  } else if (degradedCount > 0) {
    overallStatus = 'degraded'
  }

  const response: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: c.env.RELEASE_VERSION || '1.0.0',
    uptime: process.uptime ? process.uptime() : 0,
    services,
    metrics: await getSystemMetrics(c.env)
  }

  const duration = Date.now() - startTime
  log.info('Health check completed', { 
    status: overallStatus, 
    duration_ms: duration,
    services: services.map(s => ({ name: s.name, status: s.status }))
  })

  const statusCode = overallStatus === 'healthy' ? 200 : 
                     overallStatus === 'degraded' ? 200 : 503

  return c.json(response, statusCode)
})

/**
 * Check D1 Database health
 */
async function checkD1Database(db: D1Database): Promise<ServiceHealth> {
  const start = Date.now()
  
  try {
    const result = await db.prepare('SELECT 1 as health_check').first()
    const responseTime = Date.now() - start

    return {
      name: 'D1 Database',
      status: responseTime < 100 ? 'healthy' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: {
        query: 'SELECT 1',
        result: result
      }
    }
  } catch (error) {
    return {
      name: 'D1 Database',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Check KV Cache health
 */
async function checkKVCache(kv: KVNamespace): Promise<ServiceHealth> {
  const start = Date.now()
  const testKey = 'health:check'
  
  try {
    // Write test
    await kv.put(testKey, new Date().toISOString(), { expirationTtl: 60 })
    
    // Read test
    const value = await kv.get(testKey)
    const responseTime = Date.now() - start

    return {
      name: 'KV Cache',
      status: value && responseTime < 50 ? 'healthy' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: {
        operation: 'read/write',
        success: !!value
      }
    }
  } catch (error) {
    return {
      name: 'KV Cache',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Check Neo4j health
 */
async function checkNeo4j(env: Env): Promise<ServiceHealth> {
  const start = Date.now()
  
  try {
    const response = await fetch(`${env.NEO4J_URI}/db/neo4j/cluster/available`, {
      headers: {
        'Authorization': `Basic ${btoa(`${env.NEO4J_USERNAME}:${env.NEO4J_PASSWORD}`)}`
      }
    })

    const responseTime = Date.now() - start
    const isHealthy = response.ok

    return {
      name: 'Neo4j',
      status: isHealthy && responseTime < 200 ? 'healthy' : 
              isHealthy ? 'degraded' : 'unhealthy',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: {
        statusCode: response.status
      }
    }
  } catch (error) {
    return {
      name: 'Neo4j',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Check R2 Storage health
 */
async function checkR2Storage(storage: R2Bucket): Promise<ServiceHealth> {
  const start = Date.now()
  
  try {
    // List operation to check connectivity
    const list = await storage.list({ limit: 1 })
    const responseTime = Date.now() - start

    return {
      name: 'R2 Storage',
      status: responseTime < 100 ? 'healthy' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: {
        operation: 'list',
        objectCount: list.objects.length
      }
    }
  } catch (error) {
    return {
      name: 'R2 Storage',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Check Meilisearch health
 */
async function checkMeilisearch(env: Env): Promise<ServiceHealth> {
  const start = Date.now()
  
  try {
    const response = await fetch(`${env.MEILISEARCH_HOST}/health`, {
      headers: {
        'Authorization': `Bearer ${env.MEILISEARCH_KEY}`
      }
    })

    const responseTime = Date.now() - start
    const data = await response.json() as { status: string }

    return {
      name: 'Meilisearch',
      status: data.status === 'available' && responseTime < 150 ? 'healthy' : 
              data.status === 'available' ? 'degraded' : 'unhealthy',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: data
    }
  } catch (error) {
    return {
      name: 'Meilisearch',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Get system metrics (placeholder for Cloudflare Workers)
 */
async function getSystemMetrics(env: Env): Promise<HealthCheckResponse['metrics']> {
  // In Cloudflare Workers, we don't have access to traditional system metrics
  // These would come from Cloudflare Analytics API
  return {
    cpu: undefined,
    memory: undefined,
    connections: undefined
  }
}

/**
 * Create error health response
 */
function createErrorHealth(name: string, error: any): ServiceHealth {
  return {
    name,
    status: 'unhealthy',
    lastChecked: new Date().toISOString(),
    details: {
      error: error instanceof Error ? error.message : 'Health check failed'
    }
  }
}

export default app