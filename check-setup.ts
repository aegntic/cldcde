#!/usr/bin/env bun

import { existsSync, readFileSync } from 'fs'

console.log(`
╔═╗ ╦   ╔═╗ ╦ ╦ ╔╦╗ ╔═╗     ╔═╗ ╔═╗ 
║   ║   ╠═╣ ║ ║ ║║║ ╠═      ║   ║   
╚═╝ ╚═╝ ╩ ╩ ╚═╝ ╚╩╝ ╚═╝     ╚═╝ ╚═╝ 

Setup Check v1.0
${'='.repeat(50)}
`)

interface CheckResult {
  name: string
  status: 'ok' | 'missing' | 'error'
  message?: string
}

const results: CheckResult[] = []

// Check .env file
if (existsSync('.env')) {
  const env = readFileSync('.env', 'utf-8')
  const vars = new Set<string>()
  
  env.split('\n').forEach(line => {
    const [key] = line.split('=')
    if (key && !line.startsWith('#')) {
      vars.add(key.trim())
    }
  })
  
  results.push({
    name: '.env file',
    status: 'ok',
    message: `Found with ${vars.size} variables`
  })
  
  // Check required variables
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY']
  required.forEach(key => {
    results.push({
      name: key,
      status: vars.has(key) ? 'ok' : 'missing',
      message: vars.has(key) ? 'Configured' : 'Required for core functionality'
    })
  })
  
  // Check optional variables
  const optional = ['OPENROUTER_API_KEY', 'X_BEARER_TOKEN', 'GITHUB_TOKEN']
  optional.forEach(key => {
    results.push({
      name: key,
      status: vars.has(key) ? 'ok' : 'missing',
      message: vars.has(key) ? 'Configured' : 'Optional - enhances functionality'
    })
  })
} else {
  results.push({
    name: '.env file',
    status: 'missing',
    message: 'Run setup wizard to create'
  })
}

// Check deployment files
const deploymentFiles = [
  { name: 'wrangler-ultra.toml', desc: 'Cloudflare config' },
  { name: 'dist/index.html', desc: 'Frontend build' },
  { name: 'dist/index.js', desc: 'Frontend bundle' }
]

deploymentFiles.forEach(file => {
  results.push({
    name: file.name,
    status: existsSync(file.name) ? 'ok' : 'missing',
    message: existsSync(file.name) ? file.desc : 'Run: bun run build'
  })
})

// Check database schemas
const schemas = [
  'supabase/schema.sql',
  'supabase/mailing-list-schema.sql',
  'supabase/github-integration-schema.sql',
  'supabase/news-updates-schema.sql',
  'supabase/monitoring-agent-schema.sql'
]

const schemasExist = schemas.every(s => existsSync(s))
results.push({
  name: 'Database schemas',
  status: schemasExist ? 'ok' : 'missing',
  message: schemasExist ? `${schemas.length} schema files ready` : 'Some schemas missing'
})

// Test API endpoint
async function testAPI() {
  try {
    const response = await fetch('https://cldcde-api.aegntic.workers.dev/health')
    const data = await response.json()
    
    results.push({
      name: 'API deployment',
      status: data.status === 'healthy' ? 'ok' : 'error',
      message: `${data.status} - ${data.message || 'Check failed'}`
    })
  } catch (error) {
    results.push({
      name: 'API deployment',
      status: 'error',
      message: 'Not deployed or not accessible'
    })
  }
}

// Display results
async function displayResults() {
  await testAPI()
  
  console.log('\n .▄▄ · ▄▄▄▄▄ ▄▄▄· ▄▄▄▄▄▄• ▄▌.▄▄ · ')
  console.log(' ▐█ ▀. •██  ▐█ ▀█ •██  █▪██▌▐█ ▀. ')
  console.log(' ▄▀▀▀█▄ ▐█.▪▄█▀▀█  ▐█.▪█▌▐█▌▄▀▀▀█▄')
  console.log(' ▐█▄▪▐█ ▐█▌·▐█ ▪▐▌ ▐█▌·▐█▄█▌▐█▄▪▐█')
  console.log('  ▀▀▀▀  ▀▀▀  ▀  ▀  ▀▀▀  ▀▀▀  ▀▀▀▀ ')
  console.log('='.repeat(50))
  
  results.forEach(result => {
    const icon = result.status === 'ok' ? '✓' : result.status === 'missing' ? '○' : '✗'
    const prefix = result.status === 'ok' ? '\x1b[32m' : result.status === 'missing' ? '\x1b[33m' : '\x1b[31m'
    const reset = '\x1b[0m'
    
    console.log(`${prefix}${icon}${reset} ${result.name.padEnd(25)} ${result.message || ''}`)
  })
  
  console.log('\n' + '='.repeat(50))
  
  const missing = results.filter(r => r.status === 'missing')
  const errors = results.filter(r => r.status === 'error')
  
  if (missing.length === 0 && errors.length === 0) {
    console.log('✅ Everything is configured correctly!')
  } else {
    if (missing.length > 0) {
      console.log(`\n⚠️  ${missing.length} items need configuration:`)
      console.log('   Run: bun setup-wizard-simple.ts')
    }
    if (errors.length > 0) {
      console.log(`\n❌ ${errors.length} errors detected`)
    }
  }
  
  console.log('\nQUICK COMMANDS:')
  console.log('- Setup wizard:    bun setup-wizard-simple.ts')
  console.log('- Build frontend:  bun run build')
  console.log('- Deploy API:      bunx wrangler deploy -c wrangler-ultra.toml')
  console.log('- Deploy frontend: bunx wrangler pages deploy dist --project-name=cldcde')
}

displayResults()