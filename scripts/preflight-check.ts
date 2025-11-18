#!/usr/bin/env bun
import { existsSync } from 'fs'
import { config } from 'dotenv'
import chalk from 'chalk'

// Note: chalk might not be installed, using basic console colors as fallback
const green = (text: string) => `\x1b[32m${text}\x1b[0m`
const red = (text: string) => `\x1b[31m${text}\x1b[0m`
const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`
const blue = (text: string) => `\x1b[34m${text}\x1b[0m`

interface Check {
  name: string
  check: () => boolean | Promise<boolean>
  fix?: string
}

const checks: Check[] = [
  {
    name: 'Bun installed',
    check: () => true, // If this script runs, bun is installed
  },
  {
    name: '.env file exists',
    check: () => existsSync('.env'),
    fix: 'Copy .env.example to .env and fill in your credentials'
  },
  {
    name: 'All required environment variables set',
    check: () => {
      config()
      const required = [
        'NEO4J_URI',
        'NEO4J_USERNAME', 
        'NEO4J_PASSWORD',
        'JWT_SECRET',
        'CLOUDFLARE_ACCOUNT_ID',
        'CLOUDFLARE_API_TOKEN',
        'UPSTASH_REDIS_REST_URL',
        'UPSTASH_REDIS_REST_TOKEN',
        'MEILISEARCH_HOST',
        'MEILISEARCH_KEY',
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY'
      ]
      const missing = required.filter(key => !process.env[key])
      if (missing.length > 0) {
        console.log(yellow(`\n  Missing: ${missing.join(', ')}`))
        return false
      }
      return true
    },
    fix: 'Edit .env file and add missing variables'
  },
  {
    name: 'Required directories exist',
    check: () => {
      const dirs = ['src', 'frontend', 'scripts', 'migrations']
      return dirs.every(dir => existsSync(dir))
    }
  },
  {
    name: 'Database init script exists',
    check: () => existsSync('scripts/init-db.ts'),
  },
  {
    name: 'D1 migration file exists',
    check: () => existsSync('migrations/001_initial_schema.sql'),
  },
  {
    name: 'Search indexing script exists',
    check: () => existsSync('scripts/index-search.ts'),
  },
  {
    name: 'Cache warming script exists',
    check: () => existsSync('scripts/warm-cache.ts'),
  },
  {
    name: 'TypeScript types configured',
    check: () => existsSync('frontend/src/styled.d.ts'),
  },
  {
    name: 'Worker file exists',
    check: () => existsSync('src/worker.ts'),
  },
  {
    name: 'Wrangler config exists',
    check: () => existsSync('wrangler.toml'),
  }
]

async function runChecks() {
  console.log(blue('🔍 Running preflight checks for cldcde.cc setup...\n'))
  
  let allPassed = true
  
  for (const check of checks) {
    try {
      const passed = await check.check()
      if (passed) {
        console.log(green(`✅ ${check.name}`))
      } else {
        console.log(red(`❌ ${check.name}`))
        if (check.fix) {
          console.log(`   ${yellow(`→ Fix: ${check.fix}`)}`)
        }
        allPassed = false
      }
    } catch (error) {
      console.log(red(`❌ ${check.name} - Error: ${error}`))
      allPassed = false
    }
  }
  
  console.log('\n' + '─'.repeat(50) + '\n')
  
  if (allPassed) {
    console.log(green('✅ All checks passed! You can run the setup script.'))
    console.log(blue('\nNext step: ./scripts/setup-quick.sh'))
  } else {
    console.log(red('❌ Some checks failed. Please fix the issues above.'))
    console.log(yellow('\nFor detailed setup instructions, see INTEGRATION.md'))
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.main) {
  runChecks().catch(console.error)
}

export { runChecks }