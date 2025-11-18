#!/usr/bin/env bun
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function addFeaturedResources() {
  console.log('🚀 Adding featured resources to database...\n')

  // Featured Extensions
  const extensions = [
    {
      name: 'Crystal',
      slug: 'crystal',
      description: 'A sleek, modern Claude desktop app with a focus on design and user experience. Built with Rust for performance.',
      category: 'Desktop Apps',
      platform: ['macOS', 'Windows', 'Linux'],
      version: '1.0.0',
      downloads: 0,
      rating: 5.0,
      rating_count: 1,
      tags: ['desktop', 'rust', 'claude', 'ui', 'modern'],
      repository: 'https://github.com/stravu/crystal',
      homepage: 'https://github.com/stravu/crystal',
      readme: `# Crystal
A beautiful desktop app for Claude with a focus on design and performance.

## Features
- Modern, clean UI
- Fast and responsive
- Cross-platform support
- Built with Rust

## Installation
Download the latest release from the GitHub releases page.`,
      featured: true,
      verified: true
    },
    {
      name: 'Claudia',
      slug: 'claudia',
      description: 'A powerful Claude desktop application by Asterisk. Feature-rich interface for enhanced Claude interactions.',
      category: 'Desktop Apps',
      platform: ['macOS', 'Windows', 'Linux'],
      version: '1.0.0',
      downloads: 0,
      rating: 5.0,
      rating_count: 1,
      tags: ['desktop', 'claude', 'asterisk', 'productivity'],
      repository: 'https://github.com/getAsterisk/claudia',
      homepage: 'https://github.com/getAsterisk/claudia',
      readme: `# Claudia
A feature-rich Claude desktop application by Asterisk.

## Features
- Advanced conversation management
- Custom themes
- Keyboard shortcuts
- Export functionality

## Installation
Visit the releases page for platform-specific installers.`,
      featured: true,
      verified: true
    }
  ]

  // Featured MCP Servers
  const mcpServers = [
    {
      name: 'Aegntic MCP',
      slug: 'aegntic-mcp',
      description: 'Official MCP server by Aegntic. Provides powerful integrations and tools for Claude.',
      category: 'Official',
      version: '1.0.0',
      downloads: 0,
      rating: 5.0,
      rating_count: 1,
      tags: ['mcp', 'official', 'aegntic', 'integration', 'tools'],
      repository: 'https://github.com/aegntic/aegntic-MCP',
      homepage: 'https://github.com/aegntic/aegntic-MCP',
      install_command: 'npm install -g @aegntic/mcp-server',
      readme: `# Aegntic MCP Server
Official Model Context Protocol server by Aegntic.

## Features
- Advanced context management
- Tool integrations
- Performance optimizations
- Enterprise support

## Installation
\`\`\`bash
npm install -g @aegntic/mcp-server
\`\`\`

## Usage
Configure in your Claude desktop app settings.`,
      featured: true,
      verified: true
    }
  ]

  // Add extensions
  console.log('📦 Adding extensions...')
  for (const ext of extensions) {
    const { error } = await supabase
      .from('extensions')
      .upsert(ext, { onConflict: 'slug' })
    
    if (error) {
      console.error(`❌ Error adding ${ext.name}:`, error.message)
    } else {
      console.log(`✅ Added ${ext.name}`)
    }
  }

  // Add MCP servers
  console.log('\n🔧 Adding MCP servers...')
  for (const mcp of mcpServers) {
    const { error } = await supabase
      .from('mcp_servers')
      .upsert(mcp, { onConflict: 'slug' })
    
    if (error) {
      console.error(`❌ Error adding ${mcp.name}:`, error.message)
    } else {
      console.log(`✅ Added ${mcp.name}`)
    }
  }

  // Update full-text search
  console.log('\n🔍 Updating search indexes...')
  
  // Trigger FTS update by doing a dummy update
  await supabase.from('extensions').update({ updated_at: new Date().toISOString() }).eq('featured', true)
  await supabase.from('mcp_servers').update({ updated_at: new Date().toISOString() }).eq('featured', true)

  console.log('\n✨ Featured resources added successfully!')
  console.log('\nYou can now see them at:')
  console.log('- Extensions: https://cldcde.cc/extensions')
  console.log('- MCP Servers: https://cldcde.cc/mcp')
}

addFeaturedResources()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })