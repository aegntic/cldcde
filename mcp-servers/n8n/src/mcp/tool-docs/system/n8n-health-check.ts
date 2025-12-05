import { ToolDocumentation } from '../types';

export const n8nHealthCheckDoc: ToolDocumentation = {
  name: 'n8n_health_check',
  category: 'system',
  essentials: {
    description: 'Check n8n instance health, API connectivity, and available features',
    keyParameters: [],
    example: 'n8n_health_check({})',
    performance: 'Fast - single API call to health endpoint',
    tips: [
      'Use before starting workflow operations to ensure n8n is responsive',
      'Check regularly in production environments for monitoring',
      'Returns version info and feature availability for compatibility checks'
    ]
  },
  full: {
    description: `Performs a comprehensive health check of the configured n8n instance through its API.

This tool verifies:
- API endpoint accessibility and response time
- n8n instance version and build information
- Authentication status and permissions
- Available features and enterprise capabilities
- Database connectivity (as reported by n8n)
- Queue system status (if configured)

Health checks are crucial for:
- Monitoring n8n instance availability
- Detecting performance degradation
- Verifying API compatibility before operations
- Ensuring authentication is working correctly`,
    parameters: {},
    returns: `Health status object containing:
- status: Overall health status ('healthy', 'degraded', 'error')
- version: n8n instance version information
- instanceId: Unique identifier for the n8n instance
- features: Object listing available features and their status
- apiVersion: API version for compatibility checking
- responseTime: API response time in milliseconds
- timestamp: Check timestamp
- details: Additional health metrics from n8n`,
    examples: [
      'n8n_health_check({}) - Standard health check',
      '// Use in monitoring scripts\nconst health = await n8n_health_check({});\nif (health.status !== "healthy") alert("n8n is down!");',
      '// Check before critical operations\nconst health = await n8n_health_check({});\nif (health.responseTime > 1000) console.warn("n8n is slow");'
    ],
    useCases: [
      'Pre-flight checks before workflow deployments',
      'Continuous monitoring of n8n instance health',
      'Troubleshooting connectivity or performance issues',
      'Verifying n8n version compatibility with workflows',
      'Detecting feature availability (enterprise features, queue mode, etc.)'
    ],
    performance: `Fast response expected:
- Single HTTP request to /health endpoint
- Typically responds in <100ms for healthy instances
- Timeout after 10 seconds indicates severe issues
- Minimal server load - safe for frequent polling`,
    bestPractices: [
      'Run health checks before batch operations or deployments',
      'Set up automated monitoring with regular health checks',
      'Log response times to detect performance trends',
      'Check version compatibility when deploying workflows',
      'Use health status to implement circuit breaker patterns'
    ],
    pitfalls: [
      'Requires N8N_API_URL and N8N_API_KEY to be configured',
      'Network issues may cause false negatives',
      'Does not check individual workflow health',
      'Health endpoint might be cached - not real-time for all metrics'
    ],
    relatedTools: ['n8n_diagnostic', 'n8n_list_available_tools', 'n8n_list_workflows']
  }
};