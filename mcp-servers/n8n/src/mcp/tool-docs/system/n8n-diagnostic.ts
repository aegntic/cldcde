import { ToolDocumentation } from '../types';

export const n8nDiagnosticDoc: ToolDocumentation = {
  name: 'n8n_diagnostic',
  category: 'system',
  essentials: {
    description: 'Diagnose n8n API configuration and troubleshoot why n8n management tools might not be working',
    keyParameters: ['verbose'],
    example: 'n8n_diagnostic({verbose: true})',
    performance: 'Instant - checks environment and configuration only',
    tips: [
      'Run first when n8n tools are missing or failing - shows exact configuration issues',
      'Use verbose=true for detailed debugging info including environment variables',
      'If tools are missing, check that N8N_API_URL and N8N_API_KEY are configured'
    ]
  },
  full: {
    description: `Comprehensive diagnostic tool for troubleshooting n8n API configuration and management tool availability.

This tool performs a detailed check of:
- Environment variable configuration (N8N_API_URL, N8N_API_KEY)
- API connectivity and authentication
- Tool availability status
- Common configuration issues

The diagnostic is essential when:
- n8n management tools aren't showing up in the available tools list
- API calls are failing with authentication or connection errors
- You need to verify your n8n instance configuration`,
    parameters: {
      verbose: {
        type: 'boolean',
        description: 'Include detailed debug information including full environment variables and API response details',
        required: false,
        default: false
      }
    },
    returns: `Diagnostic report object containing:
- status: Overall health status ('ok', 'error', 'not_configured')
- apiUrl: Detected API URL (or null if not configured)
- apiKeyStatus: Status of API key ('configured', 'missing', 'invalid')
- toolsAvailable: Number of n8n management tools available
- connectivity: API connectivity test results
- errors: Array of specific error messages
- suggestions: Array of actionable fix suggestions
- verbose: Additional debug information (if verbose=true)`,
    examples: [
      'n8n_diagnostic({}) - Quick diagnostic check',
      'n8n_diagnostic({verbose: true}) - Detailed diagnostic with environment info',
      'n8n_diagnostic({verbose: false}) - Standard diagnostic without sensitive data'
    ],
    useCases: [
      'Initial setup verification after configuring N8N_API_URL and N8N_API_KEY',
      'Troubleshooting when n8n management tools are not available',
      'Debugging API connection failures or authentication errors',
      'Verifying n8n instance compatibility and feature availability',
      'Pre-deployment checks before using workflow management tools'
    ],
    performance: `Instant response time:
- No database queries
- Only checks environment and makes one test API call
- Verbose mode adds minimal overhead
- Safe to run frequently for monitoring`,
    bestPractices: [
      'Always run diagnostic first when encountering n8n tool issues',
      'Use verbose mode only in secure environments (may expose API URLs)',
      'Check diagnostic before attempting workflow operations',
      'Include diagnostic output when reporting issues',
      'Run after any configuration changes to verify setup'
    ],
    pitfalls: [
      'Verbose mode may expose sensitive configuration details - use carefully',
      'Requires proper environment variables to detect n8n configuration',
      'API connectivity test requires network access to n8n instance',
      'Does not test specific workflow operations, only basic connectivity'
    ],
    relatedTools: ['n8n_health_check', 'n8n_list_available_tools', 'tools_documentation']
  }
};