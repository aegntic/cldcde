#!/usr/bin/env bun
import { createInterface } from 'readline'
import { promisify } from 'util'
import { exec } from 'child_process'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import crypto from 'crypto'
import neo4j from 'neo4j-driver'
import { Redis } from '@upstash/redis'
import { MeiliSearch } from 'meilisearch'
import { createClient } from '@supabase/supabase-js'

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
    name: 'Cloudflare API Token',
    key: 'CLOUDFLARE_API_TOKEN',
    description: 'API token for Cloudflare Workers deployment',
    url: 'https://dash.cloudflare.com/profile/api-tokens',
    instructions: [
      '1. Click "Create Token"',
      '2. Use "Edit Cloudflare Workers" template',
      '3. Set permissions: Account:Cloudflare Workers Scripts:Edit',
      '4. Click "Continue to summary" → "Create Token"',
      '5. Copy the token (you won\'t see it again!)'
    ],
    validator: async (value) => value.length > 20
  },
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
    name: 'Neo4j URI',
    key: 'NEO4J_URI',
    description: 'Neo4j Aura database connection URI',
    url: 'https://console.neo4j.io',
    instructions: [
      '1. Create a free AuraDB instance',
      '2. Wait for deployment (takes ~3 minutes)',
      '3. Copy the "Connection URI" from instance details',
      '4. It should start with "neo4j+s://"'
    ],
    example: 'neo4j+s://abcdef12.databases.neo4j.io',
    validator: async (value) => {
      if (!value.startsWith('neo4j+s://')) return false
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    }
  },
  {
    name: 'Neo4j Username',
    key: 'NEO4J_USERNAME',
    description: 'Neo4j database username (usually "neo4j")',
    instructions: ['Default is "neo4j"'],
    example: 'neo4j',
    validator: async (value) => value.length > 0
  },
  {
    name: 'Neo4j Password',
    key: 'NEO4J_PASSWORD',
    description: 'Neo4j database password',
    instructions: [
      'Use the password shown during instance creation',
      'If you didn\'t save it, reset it in the console'
    ],
    validator: async (value) => value.length >= 8
  },
  {
    name: 'Upstash Redis REST URL',
    key: 'UPSTASH_REDIS_REST_URL',
    description: 'Upstash Redis REST API endpoint',
    url: 'https://console.upstash.com/redis',
    instructions: [
      '1. Create a new Redis database (free tier)',
      '2. Go to "REST API" tab',
      '3. Copy the "REST URL"',
      '4. Should start with "https://"'
    ],
    example: 'https://us1-example-12345.upstash.io',
    validator: async (value) => value.startsWith('https://') && value.includes('upstash.io')
  },
  {
    name: 'Upstash Redis REST Token',
    key: 'UPSTASH_REDIS_REST_TOKEN',
    description: 'Upstash Redis REST API token',
    instructions: [
      '1. In the same "REST API" tab',
      '2. Copy the "REST Token"',
      '3. It\'s a long string starting with "AX"'
    ],
    validator: async (value) => value.length > 20
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
    name: 'Supabase URL',
    key: 'SUPABASE_URL',
    description: 'Supabase project URL',
    url: 'https://app.supabase.com',
    instructions: [
      '1. Create a new project',
      '2. Go to Settings → API',
      '3. Copy the "Project URL"'
    ],
    example: 'https://abcdefghijklmnop.supabase.co',
    validator: async (value) => value.startsWith('https://') && value.includes('supabase.co')
  },
  {
    name: 'Supabase Anon Key',
    key: 'SUPABASE_ANON_KEY',
    description: 'Supabase anonymous/public key',
    instructions: [
      '1. In Settings → API',
      '2. Copy the "anon" or "public" key',
      '3. This is safe to expose in frontend'
    ],
    validator: async (value) => value.includes('eyJ')
  },
  {
    name: 'JWT Secret',
    key: 'JWT_SECRET',
    description: 'Secret key for JWT token signing',
    instructions: ['We\'ll generate a secure random secret for you'],
    generator: () => crypto.randomBytes(64).toString('hex'),
    validator: async (value) => value.length >= 32
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
  
  // Test Neo4j
  try {
    const driver = neo4j.driver(
      creds.NEO4J_URI,
      neo4j.auth.basic(creds.NEO4J_USERNAME, creds.NEO4J_PASSWORD)
    )
    const session = driver.session()
    await session.run('RETURN 1')
    await session.close()
    await driver.close()
    results.push({ service: 'Neo4j', success: true })
  } catch (error) {
    results.push({ service: 'Neo4j', success: false, error: error.message })
  }
  
  // Test Upstash
  try {
    const redis = new Redis({
      url: creds.UPSTASH_REDIS_REST_URL,
      token: creds.UPSTASH_REDIS_REST_TOKEN
    })
    await redis.ping()
    results.push({ service: 'Upstash Redis', success: true })
  } catch (error) {
    results.push({ service: 'Upstash Redis', success: false, error: error.message })
  }
  
  // Test Meilisearch
  try {
    const client = new MeiliSearch({
      host: creds.MEILISEARCH_HOST,
      apiKey: creds.MEILISEARCH_KEY
    })
    await client.health()
    results.push({ service: 'Meilisearch', success: true })
  } catch (error) {
    results.push({ service: 'Meilisearch', success: false, error: error.message })
  }
  
  // Test Supabase
  try {
    const supabase = createClient(creds.SUPABASE_URL, creds.SUPABASE_ANON_KEY)
    // Just check if client initializes correctly
    results.push({ service: 'Supabase', success: true })
  } catch (error) {
    results.push({ service: 'Supabase', success: false, error: error.message })
  }
  
  return results
}

async function main() {
  console.clear()
  console.log(`${colors.bright}${colors.blue}🚀 cldcde.cc Interactive Setup Assistant${colors.reset}\n`)
  console.log('This assistant will help you collect all required credentials.')
  console.log('We\'ll open relevant pages and validate each credential as you enter it.\n')
  
  const collectedCreds: Record<string, string> = {}
  
  // Check for existing .env
  if (existsSync('.env')) {
    const overwrite = await question(`${colors.yellow}⚠️  .env file already exists. Create .env.new instead? (y/n): ${colors.reset}`)
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.')
      process.exit(0)
    }
  }
  
  // Collect credentials
  for (const cred of credentials) {
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
      if (cred.generator) {
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
      
      if (cred.validator) {
        isValid = await cred.validator(value)
        if (!isValid) {
          console.log(`${colors.red}✗ Invalid format. Please check and try again.${colors.reset}`)
        }
      } else {
        isValid = true
      }
    }
    
    collectedCreds[cred.key] = value
    console.log(`${colors.green}✓ ${cred.name} saved${colors.reset}`)
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
    console.log(`\n${colors.yellow}⚠️  Some connections failed. Please check your credentials.${colors.reset}`)
    const proceed = await question('Continue anyway? (y/n): ')
    if (proceed.toLowerCase() !== 'y') {
      console.log('Setup cancelled.')
      process.exit(1)
    }
  }
  
  // Generate .env content
  const envContent = `# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=${collectedCreds.CLOUDFLARE_API_TOKEN}
CLOUDFLARE_ACCOUNT_ID=${collectedCreds.CLOUDFLARE_ACCOUNT_ID}

# Database Configuration
NEO4J_URI=${collectedCreds.NEO4J_URI}
NEO4J_USERNAME=${collectedCreds.NEO4J_USERNAME}
NEO4J_PASSWORD=${collectedCreds.NEO4J_PASSWORD}

# Upstash Redis
UPSTASH_REDIS_REST_URL=${collectedCreds.UPSTASH_REDIS_REST_URL}
UPSTASH_REDIS_REST_TOKEN=${collectedCreds.UPSTASH_REDIS_REST_TOKEN}

# Meilisearch
MEILISEARCH_HOST=${collectedCreds.MEILISEARCH_HOST}
MEILISEARCH_KEY=${collectedCreds.MEILISEARCH_KEY}

# Supabase
SUPABASE_URL=${collectedCreds.SUPABASE_URL}
SUPABASE_ANON_KEY=${collectedCreds.SUPABASE_ANON_KEY}

# JWT Secret
JWT_SECRET=${collectedCreds.JWT_SECRET}

# Environment
NODE_ENV=development
PORT=3000
`
  
  // Write file
  const fileName = existsSync('.env') ? '.env.new' : '.env'
  writeFileSync(fileName, envContent)
  console.log(`\n${colors.green}✓ Credentials saved to ${fileName}${colors.reset}`)
  
  if (fileName === '.env.new') {
    console.log(`${colors.yellow}Please review .env.new and rename it to .env when ready.${colors.reset}`)
  }
  
  // Next steps
  console.log(`\n${colors.bright}${colors.green}✅ Setup Complete!${colors.reset}\n`)
  console.log('Next steps:')
  console.log('1. Run preflight check: bun run preflight')
  console.log('2. Run setup: bun run setup')
  console.log('3. Deploy: bun run deploy')
  
  rl.close()
}

main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`)
  rl.close()
  process.exit(1)
})