#!/usr/bin/env bun
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { resolve } from 'path'

config()

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

async function setupSupabase() {
  console.log(`${colors.blue}🚀 Setting up Supabase database...${colors.reset}\n`)

  // Check environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error(`${colors.red}❌ Missing Supabase credentials in .env${colors.reset}`)
    console.log('Please run: bun run setup:wizard')
    process.exit(1)
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  try {
    // First, check if tables already exist
    const { data: tables, error: tableError } = await supabase
      .from('extensions')
      .select('*', { count: 'exact', head: true })

    if (tableError && tableError.message.includes('relation') && tableError.message.includes('does not exist')) {
      // Tables don't exist, need manual setup
      console.log(`${colors.yellow}⚠️  Database tables not found!${colors.reset}`)
      console.log(`\n${colors.cyan}Please follow these steps to set up your database:${colors.reset}\n`)
      
      console.log(`1. Open your Supabase SQL Editor:`)
      console.log(`   ${colors.blue}${process.env.SUPABASE_URL}/project/default/sql/new${colors.reset}\n`)
      
      console.log(`2. Copy ALL contents of:`)
      console.log(`   ${colors.blue}supabase/schema.sql${colors.reset}\n`)
      
      console.log(`3. Paste into the SQL Editor and click "Run"\n`)
      
      console.log(`4. Wait for it to complete (should take ~10 seconds)\n`)
      
      console.log(`5. Run this command again to create sample data:`)
      console.log(`   ${colors.green}bun run supabase:setup${colors.reset}\n`)
      
      console.log(`${colors.yellow}Opening Supabase SQL Editor in your browser...${colors.reset}`)
      
      // Try to open browser
      const { exec } = await import('child_process')
      const url = `${process.env.SUPABASE_URL}/project/default/sql/new`
      
      if (process.platform === 'darwin') {
        exec(`open "${url}"`)
      } else if (process.platform === 'win32') {
        exec(`start "${url}"`)
      } else {
        exec(`xdg-open "${url}"`)
      }
      
      process.exit(0)
    }

    console.log(`${colors.green}✓ Database tables found!${colors.reset}`)

    // Create sample data
    console.log(`\n${colors.cyan}🌱 Creating sample data...${colors.reset}`)
    
    // Check if we need to create sample data
    const { count } = await supabase
      .from('extensions')
      .select('*', { count: 'exact', head: true })

    if (count === 0) {
      // Create sample extensions
      const { error: extError } = await supabase.from('extensions').insert([
        {
          name: 'Claude Code Helper',
          slug: 'claude-code-helper',
          description: 'AI-powered coding assistant for Claude integration',
          category: 'Tools',
          platform: ['VSCode'],
          version: '1.0.0',
          downloads: 1520,
          rating: 4.8,
          tags: ['ai', 'claude', 'productivity'],
          repository: 'https://github.com/example/claude-code-helper'
        },
        {
          name: 'Terminal Theme Pro',
          slug: 'terminal-theme-pro',
          description: 'Beautiful terminal themes for your IDE',
          category: 'Themes',
          platform: ['VSCode', 'JetBrains'],
          version: '2.1.0',
          downloads: 890,
          rating: 4.6,
          tags: ['theme', 'terminal', 'ui'],
          repository: 'https://github.com/example/terminal-theme-pro'
        }
      ])

      if (extError) {
        console.error(`${colors.red}❌ Error creating sample extensions: ${extError.message}${colors.reset}`)
      } else {
        console.log(`${colors.green}✓ Sample extensions created${colors.reset}`)
      }

      // Create sample MCP servers
      const { error: mcpError } = await supabase.from('mcp_servers').insert([
        {
          name: 'Database Query MCP',
          slug: 'database-query-mcp',
          description: 'Natural language database queries',
          category: 'Database',
          version: '1.0.0',
          downloads: 320,
          rating: 4.7,
          tags: ['database', 'sql', 'ai'],
          repository: 'https://github.com/example/database-query-mcp'
        }
      ])

      if (mcpError) {
        console.error(`${colors.red}❌ Error creating sample MCP servers: ${mcpError.message}${colors.reset}`)
      } else {
        console.log(`${colors.green}✓ Sample MCP servers created${colors.reset}`)
      }

      // Create sample forums
      const { error: forumError } = await supabase.from('forums').insert([
        {
          title: 'General Discussion',
          slug: 'general',
          description: 'General chat about Claude and AI coding',
          category: 'General',
          icon: '💬'
        },
        {
          title: 'Extension Development',
          slug: 'extension-dev',
          description: 'Discuss extension development and share tips',
          category: 'Development',
          icon: '🔧'
        }
      ])

      if (forumError) {
        console.error(`${colors.red}❌ Error creating sample forums: ${forumError.message}${colors.reset}`)
      } else {
        console.log(`${colors.green}✓ Sample forums created${colors.reset}`)
      }
    } else {
      console.log(`${colors.yellow}ℹ️  Database already contains data, skipping sample data${colors.reset}`)
    }

    console.log(`\n${colors.green}✅ Supabase setup complete!${colors.reset}`)
    console.log(`\n${colors.cyan}Next steps:${colors.reset}`)
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Enable Row Level Security on tables')
    console.log('3. Set up authentication providers')
    console.log('4. Run: bun run deploy')

  } catch (error: any) {
    console.error(`${colors.red}❌ Setup failed: ${error.message}${colors.reset}`)
    process.exit(1)
  }
}

// Alternative approach if exec_sql RPC doesn't exist
async function setupSupabaseAlternative() {
  console.log(`\n${colors.yellow}⚠️  Note: Automatic schema creation requires SQL execution.${colors.reset}`)
  console.log('Please run the schema manually in Supabase SQL Editor:')
  console.log(`1. Go to ${process.env.SUPABASE_URL}/project/default/sql`)
  console.log('2. Copy contents of supabase/schema.sql')
  console.log('3. Paste and run in SQL Editor')
  console.log('4. Run this script again to create sample data')
}

// Run setup
setupSupabase().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`)
  process.exit(1)
})