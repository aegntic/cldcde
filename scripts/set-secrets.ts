#!/usr/bin/env bun
import { $ } from 'bun'
import { config } from 'dotenv'
import { readFileSync } from 'fs'

config()

interface Secret {
  name: string
  envVar: string
  required: boolean
}

const secrets: Secret[] = [
  { name: 'NEO4J_URI', envVar: 'NEO4J_URI', required: true },
  { name: 'NEO4J_USERNAME', envVar: 'NEO4J_USERNAME', required: true },
  { name: 'NEO4J_PASSWORD', envVar: 'NEO4J_PASSWORD', required: true },
  { name: 'JWT_SECRET', envVar: 'JWT_SECRET', required: true },
  { name: 'UPSTASH_REDIS_REST_URL', envVar: 'UPSTASH_REDIS_REST_URL', required: true },
  { name: 'UPSTASH_REDIS_REST_TOKEN', envVar: 'UPSTASH_REDIS_REST_TOKEN', required: true },
  { name: 'MEILISEARCH_KEY', envVar: 'MEILISEARCH_KEY', required: true },
  { name: 'SUPABASE_ANON_KEY', envVar: 'SUPABASE_ANON_KEY', required: true },
  { name: 'SENTRY_DSN', envVar: 'SENTRY_DSN', required: false },
  { name: 'GRAFANA_API_KEY', envVar: 'GRAFANA_API_KEY', required: false }
]

async function setSecrets() {
  console.log('🔐 Setting Cloudflare Worker secrets...\n')
  
  // Check if wrangler is available
  try {
    await $`wrangler --version`.quiet()
  } catch (error) {
    console.error('❌ Wrangler CLI not found. Please install it with: bun add -g wrangler')
    process.exit(1)
  }
  
  const missingRequired: string[] = []
  const results: { secret: string; status: 'set' | 'skipped' | 'failed' }[] = []
  
  for (const secret of secrets) {
    const value = process.env[secret.envVar]
    
    if (!value) {
      if (secret.required) {
        missingRequired.push(secret.envVar)
      }
      results.push({ secret: secret.name, status: 'skipped' })
      continue
    }
    
    try {
      // Write the secret value to stdin to avoid exposing it in command line
      const proc = Bun.spawn(['wrangler', 'secret', 'put', secret.name], {
        stdin: 'pipe',
        stdout: 'pipe',
        stderr: 'pipe'
      })
      
      // Write the secret value
      proc.stdin.write(value)
      proc.stdin.end()
      
      await proc.exited
      
      if (proc.exitCode === 0) {
        results.push({ secret: secret.name, status: 'set' })
        console.log(`✅ ${secret.name} - Set successfully`)
      } else {
        results.push({ secret: secret.name, status: 'failed' })
        console.error(`❌ ${secret.name} - Failed to set`)
      }
    } catch (error) {
      results.push({ secret: secret.name, status: 'failed' })
      console.error(`❌ ${secret.name} - Error: ${error}`)
    }
  }
  
  console.log('\n📊 Summary:')
  console.log(`- Set: ${results.filter(r => r.status === 'set').length}`)
  console.log(`- Skipped: ${results.filter(r => r.status === 'skipped').length}`)
  console.log(`- Failed: ${results.filter(r => r.status === 'failed').length}`)
  
  if (missingRequired.length > 0) {
    console.error('\n⚠️  Missing required environment variables:')
    missingRequired.forEach(env => console.error(`  - ${env}`))
    console.error('\nPlease set these in your .env file')
    process.exit(1)
  }
  
  console.log('\n✅ Secret configuration complete!')
}

// Run if called directly
if (import.meta.main) {
  setSecrets().catch(console.error)
}

export { setSecrets }