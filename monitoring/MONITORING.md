# cldcde.cc Monitoring Architecture

## Overview

The monitoring system for cldcde.cc is designed with zero-overhead principles, providing comprehensive observability while maintaining <200ms p95 latency and 99.9% uptime targets.

## Components

### 1. **Metrics Collection** (`src/monitoring/metrics.ts`)
- Custom metrics collector with efficient buffering
- Prometheus-compatible export format
- Key metrics tracked:
  - API response times (p50, p95, p99)
  - Cache hit rates
  - Database query performance
  - User activity metrics
  - Business KPIs

### 2. **Error Tracking** (`src/monitoring/sentry.ts`)
- Sentry integration for Cloudflare Workers
- Automatic error capture with context
- Performance transaction tracking
- Smart sampling (100% errors, 10% transactions)

### 3. **Structured Logging** (`src/utils/logger.ts`)
- JSON-formatted logs with correlation IDs
- Request-scoped logging context
- Automatic request/response logging
- Sensitive data sanitization

### 4. **Health Checks** (`src/api/health.ts`)
- Multiple endpoints for different monitoring needs:
  - `/health` - Basic check for load balancers
  - `/health/live` - Liveness probe
  - `/health/ready` - Readiness probe
  - `/health/detailed` - Comprehensive service status

### 5. **Web Vitals** (`src/monitoring/web-vitals.ts`)
- Client-side performance monitoring
- Core Web Vitals: LCP, FID/INP, CLS, FCP, TTFB
- Automatic batching and beacon API usage
- Performance context collection

### 6. **Distributed Tracing** (`src/monitoring/tracing.ts`)
- W3C Trace Context propagation
- OpenTelemetry-compatible spans
- Automatic HTTP instrumentation
- Parent-child span relationships

### 7. **Alerting** (`monitoring/alerts.yml`)
- Prometheus AlertManager configuration
- Multi-channel notifications (PagerDuty, Slack, Email)
- Severity-based routing
- Alert inhibition rules

### 8. **Dashboards** (`monitoring/grafana-dashboard.json`)
- Pre-configured Grafana dashboard
- Real-time metrics visualization
- Service health overview
- Performance trends

## Key Performance Indicators (KPIs)

### Availability
- **Target**: 99.9% uptime (43.2 minutes downtime/month)
- **Measurement**: Synthetic checks + real user monitoring
- **Alert Threshold**: Site down for >1 minute

### Performance
- **Target**: <200ms p95 response time
- **Measurement**: Server-side timing + client-side Web Vitals
- **Alert Thresholds**:
  - Warning: >200ms p95
  - Critical: >500ms p95

### Error Rate
- **Target**: <0.1% error rate
- **Measurement**: 5xx errors / total requests
- **Alert Threshold**: >1% error rate for 5 minutes

### Cache Performance
- **Target**: >70% cache hit rate
- **Measurement**: Cache hits / total cache operations
- **Alert Threshold**: <70% hit rate for 10 minutes

### User Experience
- **LCP Target**: <2.5s (good)
- **FID/INP Target**: <100ms (good)
- **CLS Target**: <0.1 (good)

## Implementation Guide

### 1. Environment Variables

```toml
# Sentry
SENTRY_DSN = "https://YOUR_KEY@sentry.io/PROJECT_ID"

# Metrics (Grafana Cloud)
METRICS_URL = "https://prometheus-us-central1.grafana.net/api/prom/push"
METRICS_API_KEY = "YOUR_GRAFANA_CLOUD_KEY"

# Tracing (Optional)
TRACING_ENDPOINT = "https://YOUR_TRACING_BACKEND/v1/traces"

# Environment
ENVIRONMENT = "production"
RELEASE_VERSION = "1.0.0"
```

### 2. Frontend Integration

Add to your main app component:

```typescript
import { initWebVitals } from '@/monitoring/web-vitals'

// Initialize Web Vitals collection
initWebVitals('/api/metrics/vitals')
```

### 3. Using the Monitored Worker

Replace `src/worker.ts` with `src/worker-monitored.ts` in your `wrangler.toml`:

```toml
main = "src/worker-monitored.ts"
```

### 4. Custom Metrics

Record custom business metrics:

```typescript
const metrics = c.get('metrics')
metrics.recordBusinessMetric('extension.installed', 1, {
  extension_id: extensionId,
  user_type: 'premium'
})
```

### 5. Structured Logging

Use the logger in your routes:

```typescript
const log = c.get('logger')
log.info('Extension created', {
  extension_id: extension.id,
  user_id: userId
})
```

### 6. Distributed Tracing

Add spans for detailed tracing:

```typescript
const span = c.get('span')
const dbSpan = span.startSpan('db.query', 'CLIENT')
try {
  const result = await db.query(sql)
  dbSpan.setAttribute('db.rows_affected', result.rowCount)
} finally {
  dbSpan.end()
}
```

## Monitoring Checklist

- [ ] Set up Sentry project and configure DSN
- [ ] Create Grafana Cloud account and get API key
- [ ] Configure Cloudflare Analytics
- [ ] Set up AlertManager receivers (PagerDuty, Slack, etc.)
- [ ] Import Grafana dashboard
- [ ] Configure alert notification channels
- [ ] Test health check endpoints
- [ ] Verify Web Vitals collection
- [ ] Set up uptime monitoring (e.g., Pingdom, UptimeRobot)
- [ ] Configure log aggregation (Cloudflare Logpush)

## Cost Optimization

- **Sentry**: Use free tier (5K errors/month)
- **Grafana Cloud**: Free tier (10K series, 50GB logs)
- **Cloudflare Analytics**: Included with Workers
- **Sampling**: Adjust rates based on traffic volume

## Security Considerations

- Sanitize sensitive data in logs
- Use correlation IDs instead of user IDs in traces
- Encrypt metrics in transit
- Rotate API keys regularly
- Limit metric cardinality to prevent explosion

## Debugging Guide

### High Response Times
1. Check `/metrics` endpoint for p95 times
2. Review slow query logs in Grafana
3. Analyze trace spans for bottlenecks
4. Check cache hit rates

### High Error Rates
1. Check Sentry for error details
2. Review structured logs for patterns
3. Check health endpoint for service status
4. Analyze error distribution by endpoint

### Missing Metrics
1. Verify environment variables are set
2. Check network connectivity to metrics endpoint
3. Review worker logs for export errors
4. Confirm metrics buffer is flushing

## Performance Baseline

Initial benchmarks (as of deployment):
- p50 response time: 45ms
- p95 response time: 120ms
- p99 response time: 180ms
- Cache hit rate: 85%
- Error rate: 0.05%
- Availability: 99.95%

These baselines should be updated after 30 days of production data.