#!/usr/bin/env bun
import { createInterface } from 'readline'
import { promisify } from 'util'
import { exec } from 'child_process'
import { writeFileSync, existsSync } from 'fs'
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
      '2. Wait for it to finish setting up (~2 minutes)',
      '3. Go to Settings → API',
      '4. Copy the "URL" field'
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

async function testConnection(creds: Record<string, string>): Promise<boolean> {
  if (!creds.SUPABASE_URL || !creds.SUPABASE_ANON_KEY) {
    return false
  }

  try {
    console.log(`${colors.cyan}Testing Supabase connection...${colors.reset}`)
    const supabase = createClient(creds.SUPABASE_URL, creds.SUPABASE_ANON_KEY)
    
    // Try a simple query
    const { error } = await supabase.from('profiles').select('count').limit(1).single()
    
    // If table doesn't exist, that's fine - we'll create it
    if (!error || error.code === 'PGRST116') {
      console.log(`${colors.green}✓ Supabase connection successful${colors.reset}`)
      return true
    } else {
      console.log(`${colors.red}✗ Supabase connection failed: ${error.message}${colors.reset}`)
      return false
    }
  } catch (error: any) {
    console.log(`${colors.red}✗ Supabase connection failed: ${error.message}${colors.reset}`)
    return false
  }
}

async function main() {
  console.clear()
  console.log(`${colors.bright}${colors.magenta}
 ▄▄·▄▄▌  ·▄▄▄▄   ▄▄· ·▄▄▄▄  ▄▄▄ .    ▄▄·  ▄▄· 
▐█ ▌▐██•  ██▪ ██ ▐█ ▌▪██▪ ██ ▀▄.▀·   ▐█ ▌▪▐█ ▌▪
██ ▄▄██▪  ▐█· ▐█▌██ ▄▄▐█· ▐█▌▐▀▀▪▄   ██ ▄▄██ ▄▄
▐███▌▐█▌▐▌██. ██ ▐███▌██. ██ ▐█▄▄▌   ▐███▌▐███▌
·▀▀▀ .▀▀▀ ▀▀▀▀▀• ·▀▀▀ ▀▀▀▀▀•  ▀▀▀  ▀ ·▀▀▀ ·▀▀▀ 
${colors.reset}`)
  
  console.log(`${colors.bright}${colors.blue}Ultra-Simplified Setup - Just 2 Services!${colors.reset}\n`)
  console.log('This wizard sets up:')
  console.log(`${colors.green}1. Supabase${colors.reset} - Database + Auth + Realtime + Search + Monitoring`)
  console.log(`${colors.green}2. Cloudflare${colors.reset} - Hosting + Cache + CDN + Analytics\n`)
  
  console.log(`${colors.yellow}That's it! No more complexity.${colors.reset}\n`)
  
  const collectedCreds: Record<string, string> = {}
  
  // Check for existing .env
  let envFile = '.env'
  if (existsSync('.env')) {
    const overwrite = await question(`${colors.yellow}⚠️  .env file already exists. Overwrite? (y/n): ${colors.reset}`)
    if (overwrite.toLowerCase() !== 'y') {
      envFile = '.env.new'
      console.log(`${colors.cyan}Creating ${envFile} instead${colors.reset}`)
    }
  }
  
  // Cloudflare account (they probably already have this)
  console.log(`\n${colors.cyan}First, let's get your Cloudflare Account ID${colors.reset}`)
  console.log(`${colors.yellow}(You might already have this from previous setup)${colors.reset}\n`)
  
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
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // Get value
    let value = ''
    let isValid = false
    
    while (!isValid) {
      value = await question(`\n${colors.cyan}Enter ${cred.name}: ${colors.reset}`)
      
      if (!value) {
        console.log(`${colors.red}This field is required${colors.reset}`)
        continue
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
  
  // Test connection
  console.log(`\n${colors.bright}${colors.blue}🔍 Testing Setup...${colors.reset}\n`)
  const connectionOk = await testConnection(collectedCreds)
  
  if (!connectionOk) {
    console.log(`\n${colors.yellow}⚠️  Connection test failed. This is normal if Supabase is still setting up.${colors.reset}`)
    const proceed = await question('Continue anyway? (y/n): ')
    if (proceed.toLowerCase() !== 'y') {
      console.log('Setup cancelled.')
      process.exit(1)
    }
  }
  
  // Generate .env content
  const envContent = `# ===================================
# cldcde.cc Ultra-Simple Configuration
# Just 2 services instead of 10+!
# ===================================

# Cloudflare (Hosting + Cache + CDN)
CLOUDFLARE_ACCOUNT_ID=${collectedCreds.CLOUDFLARE_ACCOUNT_ID}

# Supabase (Everything else!)
# - PostgreSQL Database
# - Authentication
# - Realtime subscriptions
# - Full-text search
# - File storage
# - Edge functions
SUPABASE_URL=${collectedCreds.SUPABASE_URL}
SUPABASE_ANON_KEY=${collectedCreds.SUPABASE_ANON_KEY}
SUPABASE_SERVICE_KEY=${collectedCreds.SUPABASE_SERVICE_KEY}

# Environment
NODE_ENV=development
PORT=3000

# That's it! No more services needed.
# No Redis, no Neo4j, no Meilisearch, no Sentry.
# Just Supabase + Cloudflare = Complete platform ✨
`
  
  // Write file
  writeFileSync(envFile, envContent)
  console.log(`\n${colors.green}✓ Configuration saved to ${envFile}${colors.reset}`)
  
  // Show summary
  console.log(`\n${colors.bright}${colors.green}✅ Setup Complete!${colors.reset}\n`)
  
  console.log(`${colors.cyan}What you've just configured:${colors.reset}`)
  console.log('• Database: Supabase PostgreSQL')
  console.log('• Authentication: Supabase Auth') 
  console.log('• Realtime: Supabase Realtime')
  console.log('• Search: Supabase Full-text Search')
  console.log('• File Storage: Supabase Storage')
  console.log('• Hosting: Cloudflare Workers + Pages')
  console.log('• Caching: Cloudflare KV')
  console.log('• CDN: Cloudflare Network')
  console.log('• Analytics: Cloudflare Analytics')
  console.log('• Monitoring: Supabase Dashboard + Cloudflare')
  
  console.log(`\n${colors.cyan}Next steps:${colors.reset}`)
  console.log('1. Set up database: bun run supabase:setup')
  console.log('2. Deploy: bun run deploy')
  console.log('3. Visit your site! 🎉')
  
  console.log(`\n${colors.bright}${colors.magenta}From 10+ services to just 2. That's the power of simplicity! 🚀${colors.reset}`)
  
  rl.close()
}

main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`)
  rl.close()
  process.exit(1)
})