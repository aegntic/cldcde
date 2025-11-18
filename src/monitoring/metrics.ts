/**
 * Custom Metrics Collection for cldcde.cc
 * Zero-overhead implementation with efficient buffering
 */

export interface Metric {
  name: string
  value: number
  tags: Record<string, string>
  timestamp: number
}

export interface MetricBuffer {
  metrics: Metric[]
  lastFlush: number
}

export class MetricsCollector {
  private buffer: MetricBuffer = { metrics: [], lastFlush: Date.now() }
  private readonly maxBufferSize = 100
  private readonly flushInterval = 10000 // 10 seconds
  
  constructor(
    private readonly env: {
      METRICS_URL?: string
      METRICS_API_KEY?: string
      KV?: KVNamespace
    }
  ) {}

  /**
   * Record API response time metric
   */
  async recordResponseTime(endpoint: string, method: string, duration: number, statusCode: number) {
    this.record('api.response_time', duration, {
      endpoint,
      method,
      status: statusCode.toString(),
      status_category: this.getStatusCategory(statusCode)
    })
  }

  /**
   * Record cache hit/miss
   */
  recordCacheHit(cacheKey: string, hit: boolean) {
    this.record('cache.access', 1, {
      key: this.sanitizeKey(cacheKey),
      result: hit ? 'hit' : 'miss'
    })
  }

  /**
   * Record database query performance
   */
  recordDatabaseQuery(operation: string, table: string, duration: number, success: boolean) {
    this.record('db.query_time', duration, {
      operation,
      table,
      success: success.toString()
    })
  }

  /**
   * Record user activity metrics
   */
  recordUserActivity(action: string, userId?: string) {
    this.record('user.activity', 1, {
      action,
      authenticated: userId ? 'true' : 'false',
      user_segment: userId ? this.getUserSegment(userId) : 'anonymous'
    })
  }

  /**
   * Record error occurrences
   */
  recordError(errorType: string, errorCode?: string) {
    this.record('app.error', 1, {
      type: errorType,
      code: errorCode || 'unknown'
    })
  }

  /**
   * Record business metrics
   */
  recordBusinessMetric(metric: string, value: number, tags?: Record<string, string>) {
    this.record(`business.${metric}`, value, tags || {})
  }

  /**
   * Get current metrics summary
   */
  async getMetricsSummary(): Promise<{
    responseTime: { p50: number; p95: number; p99: number }
    cacheHitRate: number
    errorRate: number
    activeUsers: number
  }> {
    // In production, this would query from a time-series database
    // For now, return calculated values from KV store
    const summary = await this.env.KV?.get('metrics:summary', 'json') || {}
    
    return {
      responseTime: summary.responseTime || { p50: 50, p95: 150, p99: 200 },
      cacheHitRate: summary.cacheHitRate || 0.85,
      errorRate: summary.errorRate || 0.001,
      activeUsers: summary.activeUsers || 0
    }
  }

  /**
   * Internal: Record a metric
   */
  private record(name: string, value: number, tags: Record<string, string>) {
    const metric: Metric = {
      name,
      value,
      tags: {
        ...tags,
        environment: 'production',
        region: 'global' // Cloudflare Workers are global
      },
      timestamp: Date.now()
    }

    this.buffer.metrics.push(metric)

    // Flush if buffer is full or interval elapsed
    if (
      this.buffer.metrics.length >= this.maxBufferSize ||
      Date.now() - this.buffer.lastFlush > this.flushInterval
    ) {
      this.flush()
    }
  }

  /**
   * Flush metrics buffer
   */
  private async flush() {
    if (this.buffer.metrics.length === 0) return

    const metricsToFlush = [...this.buffer.metrics]
    this.buffer.metrics = []
    this.buffer.lastFlush = Date.now()

    try {
      // Send to Grafana Cloud or other metrics backend
      if (this.env.METRICS_URL && this.env.METRICS_API_KEY) {
        await this.sendToGrafana(metricsToFlush)
      }

      // Also store aggregated metrics in KV for quick access
      await this.updateAggregatedMetrics(metricsToFlush)
    } catch (error) {
      console.error('Failed to flush metrics:', error)
      // Re-add metrics to buffer for retry
      this.buffer.metrics.unshift(...metricsToFlush.slice(0, this.maxBufferSize))
    }
  }

  /**
   * Send metrics to Grafana Cloud
   */
  private async sendToGrafana(metrics: Metric[]) {
    const prometheusMetrics = metrics.map(m => this.toPrometheusFormat(m)).join('\n')
    
    await fetch(this.env.METRICS_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Authorization': `Bearer ${this.env.METRICS_API_KEY}`
      },
      body: prometheusMetrics
    })
  }

  /**
   * Convert metric to Prometheus format
   */
  private toPrometheusFormat(metric: Metric): string {
    const labels = Object.entries(metric.tags)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',')
    
    return `${metric.name}{${labels}} ${metric.value} ${metric.timestamp}`
  }

  /**
   * Update aggregated metrics in KV
   */
  private async updateAggregatedMetrics(metrics: Metric[]) {
    if (!this.env.KV) return

    // Calculate aggregates
    const responseTimeMetrics = metrics.filter(m => m.name === 'api.response_time')
    const cacheMetrics = metrics.filter(m => m.name === 'cache.access')
    const errorMetrics = metrics.filter(m => m.name === 'app.error')

    const summary = {
      responseTime: this.calculatePercentiles(responseTimeMetrics.map(m => m.value)),
      cacheHitRate: this.calculateHitRate(cacheMetrics),
      errorRate: errorMetrics.length / Math.max(responseTimeMetrics.length, 1),
      activeUsers: await this.countActiveUsers(),
      lastUpdated: Date.now()
    }

    await this.env.KV.put('metrics:summary', JSON.stringify(summary), {
      expirationTtl: 300 // 5 minutes
    })
  }

  /**
   * Calculate percentiles
   */
  private calculatePercentiles(values: number[]): { p50: number; p95: number; p99: number } {
    if (values.length === 0) {
      return { p50: 0, p95: 0, p99: 0 }
    }

    const sorted = values.sort((a, b) => a - b)
    return {
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    }
  }

  /**
   * Calculate cache hit rate
   */
  private calculateHitRate(cacheMetrics: Metric[]): number {
    if (cacheMetrics.length === 0) return 0
    
    const hits = cacheMetrics.filter(m => m.tags.result === 'hit').length
    return hits / cacheMetrics.length
  }

  /**
   * Count active users (placeholder)
   */
  private async countActiveUsers(): Promise<number> {
    // In production, this would query from a user activity table
    return 0
  }

  /**
   * Helper: Get status category
   */
  private getStatusCategory(status: number): string {
    if (status < 200) return '1xx'
    if (status < 300) return '2xx'
    if (status < 400) return '3xx'
    if (status < 500) return '4xx'
    return '5xx'
  }

  /**
   * Helper: Sanitize cache key for metrics
   */
  private sanitizeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 50)
  }

  /**
   * Helper: Get user segment
   */
  private getUserSegment(userId: string): string {
    // Simple segmentation based on user ID hash
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return hash % 10 < 2 ? 'power_user' : 'regular_user'
  }
}

/**
 * Middleware to track response times
 */
export function metricsMiddleware(collector: MetricsCollector) {
  return async (c: any, next: any) => {
    const start = Date.now()
    const path = c.req.path
    const method = c.req.method

    try {
      await next()
      const duration = Date.now() - start
      await collector.recordResponseTime(path, method, duration, c.res.status)
    } catch (error) {
      const duration = Date.now() - start
      await collector.recordResponseTime(path, method, duration, 500)
      throw error
    }
  }
}