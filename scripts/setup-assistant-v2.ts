#!/usr/bin/env bun
import { createInterface } from 'readline'
import { promisify } from 'util'
import { exec } from 'child_process'
import { writeFileSync, existsSync } from 'fs'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { MeiliSearch } from 'meilisearch'

const execAsync = promisify(exec)

// Colors for terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query: string): Promise<string> => {
  return new Promise(resolve => rl.question(query, resolve))
}

interface Credential {
  name: string
  key: string
  description: string
  example?: string
  validator?: (value: string) => Promise<boolean>
  generator?: () => string
  instructions: string[]
  url?: string
}

const credentials: Credential[] = [
  {
    name: 'Cloudflare Account ID',
    key: 'CLOUDFLARE_ACCOUNT_ID',
    description: 'Your Cloudflare account identifier',
    url: 'https://dash.cloudflare.com',
    instructions: [
      '1. Go to Cloudflare dashboard',
      '2. Look in the right sidebar under "Account ID"',
      '3. Or find it in the URL after /accounts/'
    ],
    example: '1234567890abcdef1234567890abcdef',
    validator: async (value) => /^[a-f0-9]{32}$/.test(value)
  },
  {
    name: 'Supabase Project URL',
    key: 'SUPABASE_URL',
    description: 'Your Supabase project URL',
    url: 'https://app.supabase.com',
    instructions: [
      '1. Create a new project (or use existing)',
      '2. Go to Settings → API',
      '3. Copy the "URL" field',
      '4. It should look like https://xxxxx.supabase.co'
    ],
    example: 'https://abcdefghijklmnop.supabase.co',
    validator: async (value) => value.startsWith('https://') && value.includes('supabase.co')
  },
  {
    name: 'Supabase Anon Key',
    key: 'SUPABASE_ANON_KEY',
    description: 'Supabase anonymous/public key for frontend',
    instructions: [
      '1. In Settings → API',
      '2. Copy the "anon" public key',
      '3. This is safe to expose in frontend code'
    ],
    validator: async (value) => value.includes('eyJ') && value.length > 50
  },
  {
    name: 'Supabase Service Key',
    key: 'SUPABASE_SERVICE_KEY',
    description: 'Supabase service key for backend operations',
    instructions: [
      '1. In Settings → API',
      '2. Click "Reveal" next to service_role key',
      '3. Copy the service_role key',
      '4. ⚠️  Keep this SECRET - full database access!'
    ],
    validator: async (value) => value.includes('eyJ') && value.length > 50
  },
  {
    name: 'Meilisearch Host',
    key: 'MEILISEARCH_HOST',
    description: 'Meilisearch Cloud instance URL',
    url: 'https://cloud.meilisearch.com',
    instructions: [
      '1. Create a new project (free tier)',
      '2. Copy the "Host" URL from project overview',
      '3. Should look like "https://ms-xxxx.meilisearch.io"'
    ],
    example: 'https://ms-abc123def456.meilisearch.io',
    validator: async (value) => value.startsWith('https://') && value.includes('meilisearch.io')
  },
  {
    name: 'Meilisearch API Key',
    key: 'MEILISEARCH_KEY',
    description: 'Meilisearch master key',
    instructions: [
      '1. Go to project Settings → API Keys',
      '2. Copy the "Default Admin API Key"',
      '3. Keep this secret!'
    ],
    validator: async (value) => value.length > 20
  },
  {
    name: 'Sentry DSN (Optional)',
    key: 'SENTRY_DSN',
    description: 'Sentry error tracking DSN',
    url: 'https://sentry.io',
    instructions: [
      '1. Create a new project',
      '2. Choose "Browser JavaScript" platform',
      '3. Copy the DSN from setup instructions',
      '4. Or leave empty to skip error tracking'
    ],
    example: 'https://abc123@o123456.ingest.sentry.io/1234567',
    validator: async (value) => !value || value.startsWith('https://') && value.includes('sentry.io')
  }
]

async function openBrowser(url: string) {
  const platform = process.platform
  const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open'
  try {
    await execAsync(`${command} "${url}"`)
  } catch (error) {
    console.log(`${colors.yellow}Could not open browser. Please visit: ${url}${colors.reset}`)
  }
}

async function testConnection(creds: Record<string, string>): Promise<{ service: string; success: boolean; error?: string }[]> {
  const results = []
  
  // Test Supabase
  if (creds.SUPABASE_URL && creds.SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(creds.SUPABASE_URL, creds.SUPABASE_ANON_KEY)
      const { error } = await supabase.from('profiles').select('count').limit(1).single()
      
      // If table doesn't exist, that's fine - we'll create it
      if (!error || error.code === 'PGRST116') {
        results.push({ service: 'Supabase', success: true })
      } else {
        results.push({ service: 'Supabase', success: false, error: error.message })
      }
    } catch (error: any) {
      results.push({ service: 'Supabase', success: false, error: error.message })
    }
  }
  
  // Test Meilisearch
  if (creds.MEILISEARCH_HOST && creds.MEILISEARCH_KEY) {
    try {
      const client = new MeiliSearch({
        host: creds.MEILISEARCH_HOST,
        apiKey: creds.MEILISEARCH_KEY
      })
      await client.health()
      results.push({ service: 'Meilisearch', success: true })
    } catch (error: any) {
      results.push({ service: 'Meilisearch', success: false, error: error.message })
    }
  }
  
  return results
}

async function main() {
  console.clear()
  console.log(`${colors.bright}${colors.blue}🚀 cldcde.cc Simplified Setup Assistant v2${colors.reset}\n`)
  console.log('This wizard will help you set up the simplified architecture:')
  console.log('- Supabase (Database + Auth + Realtime)')
  console.log('- Meilisearch (Search)')
  console.log('- Cloudflare (Hosting + Cache)')
  console.log('- Sentry (Optional error tracking)\n')
  
  const collectedCreds: Record<string, string> = {}
  
  // Check for existing .env
  let envFile = '.env'
  if (existsSync('.env')) {
    const overwrite = await question(`${colors.yellow}⚠️  .env file already exists. Overwrite (o), create .env.new (n), or cancel (c)? ${colors.reset}`)
    if (overwrite.toLowerCase() === 'c') {
      console.log('Setup cancelled.')
      process.exit(0)
    } else if (overwrite.toLowerCase() === 'n') {
      envFile = '.env.new'
    }
  }
  
  console.log(`\n${colors.cyan}Let's start with the required services:${colors.reset}\n`)
  
  // Collect credentials
  for (const cred of credentials) {
    const isOptional = cred.name.includes('Optional')
    
    console.log(`\n${colors.bright}${colors.cyan}━━━ ${cred.name} ━━━${colors.reset}`)
    console.log(`${colors.yellow}${cred.description}${colors.reset}\n`)
    
    // Show instructions
    cred.instructions.forEach(instruction => {
      console.log(`  ${instruction}`)
    })
    
    if (cred.example) {
      console.log(`\n  ${colors.bright}Example:${colors.reset} ${cred.example}`)
    }
    
    // Open browser if URL provided
    if (cred.url) {
      console.log(`\n${colors.green}Opening browser...${colors.reset}`)
      await openBrowser(cred.url)
      await new Promise(resolve => setTimeout(resolve, 2000)) // Give browser time to open
    }
    
    // Get value
    let value = ''
    let isValid = false
    
    while (!isValid) {
      if (isOptional) {
        value = await question(`\n${colors.cyan}Enter ${cred.name} (or press Enter to skip): ${colors.reset}`)
        if (!value) {
          console.log(`${colors.yellow}Skipped${colors.reset}`)
          break
        }
      } else if (cred.generator) {
        const useGenerated = await question(`\n${colors.magenta}Generate secure value? (y/n): ${colors.reset}`)
        if (useGenerated.toLowerCase() === 'y') {
          value = cred.generator()
          console.log(`${colors.green}✓ Generated: ${value.substring(0, 20)}...${colors.reset}`)
        } else {
          value = await question(`${colors.cyan}Enter ${cred.name}: ${colors.reset}`)
        }
      } else {
        value = await question(`\n${colors.cyan}Enter ${cred.name}: ${colors.reset}`)
      }
      
      if (value && cred.validator) {
        isValid = await cred.validator(value)
        if (!isValid) {
          console.log(`${colors.red}✗ Invalid format. Please check and try again.${colors.reset}`)
        }
      } else if (value || isOptional) {
        isValid = true
      }
    }
    
    if (value) {
      collectedCreds[cred.key] = value
      console.log(`${colors.green}✓ ${cred.name} saved${colors.reset}`)
    }
  }
  
  // Test connections
  console.log(`\n${colors.bright}${colors.blue}🔍 Testing Connections...${colors.reset}\n`)
  const testResults = await testConnection(collectedCreds)
  
  let allSuccess = true
  testResults.forEach(result => {
    if (result.success) {
      console.log(`${colors.green}✓ ${result.service} - Connected successfully${colors.reset}`)
    } else {
      console.log(`${colors.red}✗ ${result.service} - Failed: ${result.error}${colors.reset}`)
      allSuccess = false
    }
  })
  
  if (!allSuccess) {
    console.log(`\n${colors.yellow}⚠️  Some connections failed. This might be normal if services aren't set up yet.${colors.reset}`)
    const proceed = await question('Continue anyway? (y/n): ')
    if (proceed.toLowerCase() !== 'y') {
      console.log('Setup cancelled.')
      process.exit(1)
    }
  }
  
  // Generate .env content
  const envContent = `# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=${collectedCreds.CLOUDFLARE_ACCOUNT_ID || ''}

# Supabase Configuration (Database + Auth + Realtime)
SUPABASE_URL=${collectedCreds.SUPABASE_URL || ''}
SUPABASE_ANON_KEY=${collectedCreds.SUPABASE_ANON_KEY || ''}
SUPABASE_SERVICE_KEY=${collectedCreds.SUPABASE_SERVICE_KEY || ''}

# Meilisearch Configuration (Search)
MEILISEARCH_HOST=${collectedCreds.MEILISEARCH_HOST || ''}
MEILISEARCH_KEY=${collectedCreds.MEILISEARCH_KEY || ''}

# Error Tracking (Optional)
SENTRY_DSN=${collectedCreds.SENTRY_DSN || ''}

# Environment
NODE_ENV=development
PORT=3000
`
  
  // Write file
  writeFileSync(envFile, envContent)
  console.log(`\n${colors.green}✓ Configuration saved to ${envFile}${colors.reset}`)
  
  // Next steps
  console.log(`\n${colors.bright}${colors.green}✅ Setup Complete!${colors.reset}\n`)
  console.log('Next steps:')
  console.log(`1. ${colors.cyan}Set up Supabase database:${colors.reset}`)
  console.log('   bun run supabase:setup')
  console.log(`2. ${colors.cyan}Deploy to Cloudflare:${colors.reset}`)
  console.log('   bun run deploy')
  console.log(`3. ${colors.cyan}Index search data:${colors.reset}`)
  console.log('   bun run search:index')
  
  console.log(`\n${colors.bright}That's it! Just 2 services to manage instead of 10+ 🎉${colors.reset}`)
  
  rl.close()
}

main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`)
  rl.close()
  process.exit(1)
})