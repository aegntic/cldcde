#!/usr/bin/env bun

import { readFileSync, writeFileSync, existsSync } from 'fs'
import * as readline from 'readline/promises'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// ASCII Art Banner
const banner = `
╔═╗ ╦   ╔═╗ ╦ ╦ ╔╦╗ ╔═╗     ╔═╗ ╔═╗ 
║   ║   ╠═╣ ║ ║ ║║║ ╠═      ║   ║   
╚═╝ ╚═╝ ╩ ╩ ╚═╝ ╚╩╝ ╚═╝     ╚═╝ ╚═╝ 

Setup Wizard v1.0
${'='.repeat(50)}
`

// Configuration items
interface ConfigItem {
  key: string
  name: string
  description: string
  required: boolean
  secret: boolean
  validation?: (value: string) => boolean
  instructions?: string[]
  testUrl?: string
  category: 'core' | 'ai' | 'social' | 'optional'
}

const configItems: ConfigItem[] = [
  // Core Services
  {
    key: 'SUPABASE_URL',
    name: 'Supabase URL',
    description: 'Your Supabase project URL',
    required: true,
    secret: false,
    category: 'core',
    validation: (v) => v.startsWith('https://') && v.includes('.supabase.co'),
    instructions: [
      '1. Go to https://supabase.com/dashboard',
      '2. Select your project (or create one)',
      '3. Go to Settings > API',
      '4. Copy the "Project URL"'
    ],
    testUrl: '/rest/v1/'
  },
  {
    key: 'SUPABASE_ANON_KEY',
    name: 'Supabase Anon Key',
    description: 'Public anonymous key for Supabase',
    required: true,
    secret: false,
    category: 'core',
    validation: (v) => v.length > 50,
    instructions: [
      '1. In your Supabase project dashboard',
      '2. Go to Settings > API',
      '3. Copy the "anon public" key'
    ]
  },
  {
    key: 'SUPABASE_SERVICE_KEY',
    name: 'Supabase Service Key',
    description: 'Service role key for Supabase (keep secret!)',
    required: true,
    secret: true,
    category: 'core',
    validation: (v) => v.length > 50,
    instructions: [
      '1. In your Supabase project dashboard',
      '2. Go to Settings > API',
      '3. Copy the "service_role" key',
      '⚠️  Keep this secret! It bypasses Row Level Security'
    ]
  },

  // AI Services
  {
    key: 'OPENROUTER_API_KEY',
    name: 'OpenRouter API Key',
    description: 'For AI-powered blog generation (FREE models available)',
    required: false,
    secret: true,
    category: 'ai',
    validation: (v) => v.startsWith('sk-or-'),
    instructions: [
      '1. Sign up at https://openrouter.ai',
      '2. Go to https://openrouter.ai/keys',
      '3. Create a new API key',
      '4. Copy the key (starts with sk-or-)',
      '',
      '✨ Free models available:',
      '   - Google Gemini 2.0 Flash (1M context)',
      '   - Meta Llama 3.2 3B',
      '   - Mistral 7B Instruct'
    ],
    testUrl: 'https://openrouter.ai/api/v1/models'
  },

  // Social APIs
  {
    key: 'X_BEARER_TOKEN',
    name: 'X (Twitter) Bearer Token',
    description: 'For discovering innovative Claude content on X',
    required: false,
    secret: true,
    category: 'social',
    validation: (v) => v.length > 20,
    instructions: [
      '1. Go to https://developer.twitter.com',
      '2. Create a new app in your project',
      '3. Go to "Keys and tokens"',
      '4. Generate a Bearer Token',
      '',
      '📊 Free tier limits:',
      '   - 10,000 tweets/month',
      '   - Read-only access',
      '   - Basic search'
    ],
    testUrl: 'https://api.twitter.com/2/tweets/search/recent?query=claude'
  },
  {
    key: 'GITHUB_TOKEN',
    name: 'GitHub Personal Access Token',
    description: 'For enhanced GitHub innovation tracking',
    required: false,
    secret: true,
    category: 'optional',
    validation: (v) => v.length === 40 || v.startsWith('ghp_'),
    instructions: [
      '1. Go to https://github.com/settings/tokens',
      '2. Click "Generate new token (classic)"',
      '3. Give it a name like "cldcde-tracker"',
      '4. Select scopes: public_repo, read:user',
      '5. Generate and copy the token',
      '',
      '✅ Benefits:',
      '   - 5,000 API calls/hour (vs 60)',
      '   - Better repository insights'
    ],
    testUrl: 'https://api.github.com/rate_limit'
  },

  // OAuth Configurations
  {
    key: 'GITHUB_CLIENT_ID',
    name: 'GitHub OAuth Client ID',
    description: 'For seamless download flow with auto-follow',
    required: false,
    secret: false,
    category: 'optional',
    instructions: [
      '1. Go to https://github.com/settings/developers',
      '2. Create a new OAuth App',
      '3. Set callback URL: https://api.cldcde.cc/api/github/callback',
      '4. Copy the Client ID'
    ]
  },
  {
    key: 'GITHUB_CLIENT_SECRET',
    name: 'GitHub OAuth Client Secret',
    description: 'Secret for GitHub OAuth',
    required: false,
    secret: true,
    category: 'optional',
    instructions: [
      '1. In your GitHub OAuth App',
      '2. Generate a new client secret',
      '3. Copy it immediately (shown only once)'
    ]
  }
]

// Helper functions
async function checkExistingEnv(): Promise<Record<string, string>> {
  const env: Record<string, string> = {}
  
  if (existsSync('.env')) {
    const content = readFileSync('.env', 'utf-8')
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && !line.startsWith('#')) {
        env[key.trim()] = valueParts.join('=').trim()
      }
    })
  }
  
  return env
}

async function testConnection(url: string, headers?: Record<string, string>): Promise<boolean> {
  try {
    const response = await fetch(url, { headers })
    return response.ok
  } catch {
    return false
  }
}

async function promptForValue(item: ConfigItem, currentValue?: string): Promise<string | null> {
  console.log(`\n→ ${item.name}`)
  console.log(`   ${item.description}`)
  
  if (currentValue) {
    const masked = item.secret ? currentValue.substring(0, 10) + '...' : currentValue
    console.log(`   ✓ Current value: ${masked}`)
    const change = await rl.question(`   Change? (y/N): `)
    if (change.toLowerCase() !== 'y') {
      return currentValue
    }
  }
  
  if (item.instructions) {
    console.log(`\n   Instructions:`)
    item.instructions.forEach(inst => console.log(`   ${inst}`))
  }
  
  console.log()
  const value = await rl.question(`   Enter ${item.name} (or 'skip'): `)
  
  if (value === 'skip' || value === '') {
    return null
  }
  
  if (item.validation && !item.validation(value)) {
    console.log(`   ✗ Invalid format. Please check and try again.`)
    return promptForValue(item, currentValue)
  }
  
  return value
}

async function saveEnv(env: Record<string, string>) {
  const envContent = Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  
  writeFileSync('.env', envContent)
  console.log(`\n✓ Environment variables saved to .env`)
}

async function saveWranglerSecrets(secrets: Record<string, string>) {
  if (Object.keys(secrets).length === 0) return
  
  console.log(`\n${'='.repeat(50)}`)
  console.log(' ▄▄· ▄▄▌       ▄• ▄▌·▄▄▄▄  ·▄▄▄▄▄▌   ▄▄▄· ▄▄▄  ▄▄▄ .')
  console.log('▐█ ▌▪██•  ▪    █▪██▌██▪ ██ ▐▄▄·██•  ▐█ ▀█ ▀▄ █·▀▄.▀·')
  console.log('██ ▄▄██▪   ▄█▀▄█▌▐█▌▐█· ▐█▌██▪ ██▪  ▄█▀▀█ ▐▀▀▄ ▐▀▀▪▄')
  console.log('▐███▌▐█▌▐▌▐█▌.▐▐█▄█▌██. ██ ██▌.▐█▌▐▌▐█ ▪▐▌▐█•█▌▐█▄▄▌')
  console.log('·▀▀▀ .▀▀▀  ▀█▄▀▪▀▀▀ ▀▀▀▀▀• ▀▀▀ .▀▀▀  ▀  ▀ .▀  ▀ ▀▀▀ ')
  console.log('\nRun these commands to add secrets to Cloudflare:')
  console.log()
  
  Object.entries(secrets).forEach(([key, value]) => {
    console.log(`echo "${value}" | wrangler secret put ${key}`)
  })
  
  console.log(`\nNote: These are stored securely in Cloudflare, not in .env`)
}

async function createEnvExample() {
  const example = `# Core Services (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key # Add as Cloudflare secret

# AI Services (Optional)
OPENROUTER_API_KEY=sk-or-your-key # Add as Cloudflare secret

# Social APIs (Optional)
X_BEARER_TOKEN=your-bearer-token # Add as Cloudflare secret
GITHUB_TOKEN=ghp_your-token # Add as Cloudflare secret

# OAuth (Optional)
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret # Add as Cloudflare secret
`
  
  writeFileSync('.env.example', example)
  console.log('✓ Created .env.example for reference')
}

async function runSetupWizard() {
  console.clear()
  console.log(banner)
  
  console.log('Welcome to the cldcde.cc setup wizard!')
  console.log('This will help you configure all required services.\n')
  
  // Check existing env
  const existingEnv = await checkExistingEnv()
  const newEnv: Record<string, string> = {}
  const secrets: Record<string, string> = {}
  
  // Group by category
  const categories = {
    core: configItems.filter(i => i.category === 'core'),
    ai: configItems.filter(i => i.category === 'ai'),
    social: configItems.filter(i => i.category === 'social'),
    optional: configItems.filter(i => i.category === 'optional')
  }
  
  // Process each category
  for (const [category, items] of Object.entries(categories)) {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`${category.toUpperCase()} SERVICES`)
    console.log('='.repeat(50))
    
    for (const item of items) {
      const currentValue = existingEnv[item.key]
      const value = await promptForValue(item, currentValue)
      
      if (value) {
        if (item.secret) {
          secrets[item.key] = value
        } else {
          newEnv[item.key] = value
        }
        
        // Test connection if possible
        if (item.testUrl) {
          process.stdout.write(`   Testing connection... `)
          const url = item.key === 'SUPABASE_URL' 
            ? value + item.testUrl 
            : item.testUrl
          
          const headers: Record<string, string> = {}
          if (item.key === 'X_BEARER_TOKEN') {
            headers['Authorization'] = `Bearer ${value}`
          } else if (item.key === 'GITHUB_TOKEN') {
            headers['Authorization'] = `token ${value}`
          } else if (item.key === 'OPENROUTER_API_KEY') {
            headers['Authorization'] = `Bearer ${value}`
          }
          
          const success = await testConnection(url, headers)
          console.log(success ? '✓ Connected!' : '✗ Failed (check your key)')
        }
      } else if (item.required) {
        console.log(`   ✗ Skipped required field - setup may not work properly`)
      }
    }
  }
  
  // Save configurations
  await saveEnv({ ...existingEnv, ...newEnv })
  await saveWranglerSecrets(secrets)
  await createEnvExample()
  
  // Summary
  console.log(`\n${'='.repeat(50)}`)
  console.log('·▄▄▄▄        ▐ ▄ ▄▄▄ .▄▄ ')
  console.log('██▪ ██ ▪     •█▌▐█▀▄.▀·██▌')
  console.log('▐█· ▐█▌ ▄█▀▄▐█▐▐▌▐▀▀▪▄▐█·')
  console.log('██. ██ ▐█▌.▐██▐█▌▐█▄▄▌.▀ ')
  console.log('▀▀▀▀▀•  ▀█▄▀▀▀ █▪ ▀▀▀  ▀ ')
  console.log('='.repeat(50))
  console.log('\nConfiguration Summary:')
  
  const allConfigured = Object.keys({ ...newEnv, ...secrets })
  const required = configItems.filter(i => i.required).map(i => i.key)
  const optional = configItems.filter(i => !i.required).map(i => i.key)
  
  console.log(`✓ Core services: ${required.filter(k => allConfigured.includes(k)).length}/${required.length}`)
  console.log(`○ Optional services: ${optional.filter(k => allConfigured.includes(k)).length}/${optional.length}`)
  
  // Database check
  if (newEnv.SUPABASE_URL || existingEnv.SUPABASE_URL) {
    console.log('\n📝 Database Migrations Needed:')
    console.log('Run these SQL files in your Supabase SQL editor:')
    console.log('1. supabase/schema.sql (core tables)')
    console.log('2. supabase/mailing-list-schema.sql')
    console.log('3. supabase/github-integration-schema.sql')
    console.log('4. supabase/news-updates-schema.sql')
    console.log('5. supabase/monitoring-agent-schema.sql')
  }
  
  // Next steps
  console.log('\n📋 Next Steps:')
  console.log('1. Run the database migrations listed above')
  console.log('2. Add secrets to Cloudflare using commands shown above')
  console.log('3. Deploy: bunx wrangler deploy -c wrangler-ultra.toml')
  console.log('4. Deploy frontend: bunx wrangler pages deploy dist --project-name=cldcde')
  console.log('5. Set up cron jobs for monitoring agents (optional)')
  
  console.log('\n💡 Tips:')
  console.log('- You can run this wizard again anytime: bun setup-wizard-simple.ts')
  console.log('- Check .env.example for configuration reference')
  console.log('- All services work on free tiers!')
  
  rl.close()
}

// Run the wizard
runSetupWizard().catch(console.error)