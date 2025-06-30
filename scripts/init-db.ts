#!/usr/bin/env bun
import neo4j from 'neo4j-driver'
import { config } from 'dotenv'

config()

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
)

async function initDatabase() {
  const session = driver.session()
  
  try {
    console.log('🗄️  Initializing Neo4j database...')
    
    // Create constraints
    const constraints = [
      'CREATE CONSTRAINT IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (u:User) REQUIRE u.username IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (e:Extension) REQUIRE e.id IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (m:MCPServer) REQUIRE m.id IS UNIQUE'
    ]
    
    for (const constraint of constraints) {
      await session.run(constraint)
      console.log(`✅ ${constraint}`)
    }
    
    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS FOR (e:Extension) ON (e.name)',
      'CREATE INDEX IF NOT EXISTS FOR (e:Extension) ON (e.category)',
      'CREATE INDEX IF NOT EXISTS FOR (e:Extension) ON (e.downloads)',
      'CREATE INDEX IF NOT EXISTS FOR (e:Extension) ON (e.rating)',
      'CREATE INDEX IF NOT EXISTS FOR (m:MCPServer) ON (m.name)',
      'CREATE INDEX IF NOT EXISTS FOR (m:MCPServer) ON (m.category)'
    ]
    
    for (const index of indexes) {
      await session.run(index)
      console.log(`✅ ${index}`)
    }
    
    // Check if we should seed data
    const result = await session.run('MATCH (e:Extension) RETURN count(e) as count')
    const count = result.records[0].get('count').toNumber()
    
    if (count === 0) {
      console.log('📦 Seeding sample data...')
      
      // Sample extensions
      const extensions = [
        {
          id: 'ext-1',
          name: 'Git Helper',
          description: 'Enhanced Git operations with visual diff viewer',
          category: 'Tools',
          platform: ['VSCode', 'JetBrains'],
          version: '1.2.0',
          author: 'claude-community',
          downloads: 15420,
          rating: 4.8,
          tags: ['git', 'vcs', 'productivity'],
          repository: 'https://github.com/claude-community/git-helper'
        },
        {
          id: 'ext-2',
          name: 'Terminal Enhancer',
          description: 'Advanced terminal integration with AI suggestions',
          category: 'Terminal',
          platform: ['VSCode'],
          version: '2.0.1',
          author: 'ai-tools',
          downloads: 8930,
          rating: 4.6,
          tags: ['terminal', 'cli', 'productivity'],
          repository: 'https://github.com/ai-tools/terminal-enhancer'
        }
      ]
      
      // Sample MCP servers
      const mcpServers = [
        {
          id: 'mcp-1',
          name: 'Database Query MCP',
          description: 'Natural language to SQL query generation',
          category: 'Database',
          version: '1.0.0',
          author: 'mcp-community',
          downloads: 5240,
          rating: 4.7,
          tags: ['database', 'sql', 'query'],
          repository: 'https://github.com/mcp-community/database-query-mcp'
        },
        {
          id: 'mcp-2',
          name: 'API Testing MCP',
          description: 'Automated API testing and documentation',
          category: 'Testing',
          version: '0.9.0',
          author: 'test-tools',
          downloads: 3180,
          rating: 4.5,
          tags: ['api', 'testing', 'automation'],
          repository: 'https://github.com/test-tools/api-testing-mcp'
        }
      ]
      
      // Create extensions
      for (const ext of extensions) {
        await session.run(
          'CREATE (e:Extension $props) SET e.createdAt = datetime(), e.updatedAt = datetime()',
          { props: ext }
        )
      }
      
      // Create MCP servers
      for (const mcp of mcpServers) {
        await session.run(
          'CREATE (m:MCPServer $props) SET m.createdAt = datetime(), m.updatedAt = datetime()',
          { props: mcp }
        )
      }
      
      console.log('✅ Sample data created')
    } else {
      console.log(`ℹ️  Database already contains ${count} extensions`)
    }
    
    console.log('✅ Database initialization complete!')
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  } finally {
    await session.close()
    await driver.close()
  }
}

// Run if called directly
if (import.meta.main) {
  initDatabase().catch(console.error)
}

export { initDatabase }