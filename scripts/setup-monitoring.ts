#!/usr/bin/env bun

/**
 * Setup script for cldcde.cc monitoring
 * Configures monitoring secrets and validates setup
 */

import { $ } from 'bun'

console.log('🚀 Setting up monitoring for cldcde.cc...\n')

const required_vars = {
  SENTRY_DSN: 'Sentry DSN (https://...@sentry.io/...)',
  METRICS_URL: 'Grafana Cloud Prometheus endpoint',
  METRICS_API_KEY: 'Grafana Cloud API key',
}

const optional_vars = {
  TRACING_ENDPOINT: 'Tracing backend endpoint (optional)',
  PAGERDUTY_SERVICE_KEY: 'PagerDuty service key (for critical alerts)',
  SLACK_WEBHOOK_URL: 'Slack webhook URL (for warning alerts)',
  SENDGRID_API_KEY: 'SendGrid API key (for email alerts)',
}

// Check if running in CI or interactive mode
const isCI = process.env.CI === 'true'

async function promptForValue(name: string, description: string, required: boolean = true): Promise<string | undefined> {
  if (isCI) {
    const value = process.env[name]
    if (!value && required) {
      throw new Error(`Missing required environment variable: ${name}`)
    }
    return value
  }

  console.log(`\n${name}: ${description}`)
  if (!required) console.log('(Press Enter to skip)')
  
  const value = prompt('> ')
  if (!value && required) {
    console.error(`❌ ${name} is required!`)
    process.exit(1)
  }
  
  return value || undefined
}

async function setupSecrets() {
  console.log('📝 Collecting monitoring configuration...')
  
  const secrets: Record<string, string> = {}
  
  // Collect required secrets
  for (const [name, description] of Object.entries(required_vars)) {
    const value = await promptForValue(name, description)
    if (value) secrets[name] = value
  }
  
  // Collect optional secrets
  console.log('\n📋 Optional configuration:')
  for (const [name, description] of Object.entries(optional_vars)) {
    const value = await promptForValue(name, description, false)
    if (value) secrets[name] = value
  }
  
  // Set Cloudflare secrets
  console.log('\n🔐 Setting Cloudflare Workers secrets...')
  
  for (const [name, value] of Object.entries(secrets)) {
    try {
      await $`echo ${value} | wrangler secret put ${name}`
      console.log(`✅ Set ${name}`)
    } catch (error) {
      console.error(`❌ Failed to set ${name}:`, error)
    }
  }
  
  // Set environment variables
  console.log('\n🔧 Updating wrangler.toml with environment variables...')
  
  try {
    // Read current wrangler.toml
    const wranglerPath = './wrangler.toml'
    const content = await Bun.file(wranglerPath).text()
    
    // Add monitoring environment variables if not present
    const envVars = `
[vars]
ENVIRONMENT = "production"
RELEASE_VERSION = "1.0.0"
`
    
    if (!content.includes('[vars]')) {
      await Bun.write(wranglerPath, content + envVars)
      console.log('✅ Added environment variables to wrangler.toml')
    }
  } catch (error) {
    console.error('❌ Failed to update wrangler.toml:', error)
  }
}

async function validateSetup() {
  console.log('\n🔍 Validating monitoring setup...')
  
  // Check if monitoring files exist
  const files = [
    'src/monitoring/metrics.ts',
    'src/monitoring/sentry.ts',
    'src/monitoring/tracing.ts',
    'src/monitoring/web-vitals.ts',
    'src/utils/logger.ts',
    'src/api/health.ts',
    'monitoring/grafana-dashboard.json',
    'monitoring/alerts.yml',
  ]
  
  let allFilesExist = true
  for (const file of files) {
    const exists = await Bun.file(file).exists()
    if (exists) {
      console.log(`✅ ${file}`)
    } else {
      console.log(`❌ ${file} - Missing!`)
      allFilesExist = false
    }
  }
  
  if (!allFilesExist) {
    console.error('\n❌ Some monitoring files are missing!')
    process.exit(1)
  }
  
  console.log('\n✅ All monitoring files are in place!')
}

async function generateDocs() {
  console.log('\n📚 Generating monitoring documentation...')
  
  const docs = `# cldcde.cc Monitoring Quick Start

## 1. Sentry Setup
- Sign up at https://sentry.io
- Create a new project (JavaScript)
- Copy the DSN from Settings > Client Keys

## 2. Grafana Cloud Setup
- Sign up at https://grafana.com/products/cloud/
- Create a new stack
- Go to Configuration > API Keys
- Create a new API key with "MetricsPublisher" role
- Copy the Prometheus endpoint URL

## 3. Deploy with Monitoring
\`\`\`bash
# Deploy the monitored worker
bun run deploy

# Verify health checks
curl https://cldcde.cc/health/detailed
\`\`\`

## 4. Import Grafana Dashboard
1. Open Grafana
2. Go to Dashboards > Import
3. Upload monitoring/grafana-dashboard.json
4. Select your Prometheus data source

## 5. Configure Alerts
1. Set up notification channels in Grafana
2. Configure AlertManager with your channels
3. Test alerts with: curl https://cldcde.cc/health/test-alert

## Monitoring Endpoints
- \`/health\` - Basic health check
- \`/health/detailed\` - Detailed service status
- \`/metrics\` - Current metrics summary

## Support
For monitoring issues, check:
- Cloudflare Workers logs
- Sentry error tracking
- Grafana dashboards
`
  
  await Bun.write('monitoring/QUICKSTART.md', docs)
  console.log('✅ Generated monitoring/QUICKSTART.md')
}

// Main execution
async function main() {
  try {
    await setupSecrets()
    await validateSetup()
    await generateDocs()
    
    console.log('\n🎉 Monitoring setup complete!')
    console.log('\nNext steps:')
    console.log('1. Deploy with: bun run deploy')
    console.log('2. Import Grafana dashboard from monitoring/grafana-dashboard.json')
    console.log('3. Test health checks at https://cldcde.cc/health/detailed')
    console.log('4. Check monitoring/QUICKSTART.md for detailed instructions')
  } catch (error) {
    console.error('\n❌ Setup failed:', error)
    process.exit(1)
  }
}

main()