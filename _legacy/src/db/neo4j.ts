import neo4j, { Driver, Session } from 'neo4j-driver'

let driver: Driver | null = null

export const initDatabase = async (): Promise<void> => {
  try {
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687'
    const username = process.env.NEO4J_USERNAME || 'neo4j'
    const password = process.env.NEO4J_PASSWORD || 'password'

    driver = neo4j.driver(uri, neo4j.auth.basic(username, password))
    
    // Verify connectivity
    await driver.verifyConnectivity()
    
    // Initialize schema
    await initSchema()
    
    console.log('✅ Neo4j connection established successfully')
  } catch (error) {
    console.warn('⚠️  Neo4j database not available:', error.message)
    console.warn('⚠️  Running in database-free mode. Some features will be limited.')
    driver = null
  }
}

export const getSession = (): Session => {
  if (!driver) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return driver.session()
}

export const closeDatabase = async (): Promise<void> => {
  if (driver) {
    await driver.close()
    driver = null
    console.log('📊 Neo4j connection closed')
  }
}

const initSchema = async (): Promise<void> => {
  const session = getSession()
  
  try {
    // Create constraints and indexes
    const queries = [
      // User constraints
      'CREATE CONSTRAINT user_email IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE',
      'CREATE CONSTRAINT user_username IF NOT EXISTS FOR (u:User) REQUIRE u.username IS UNIQUE',
      
      // Extension constraints
      'CREATE CONSTRAINT extension_id IF NOT EXISTS FOR (e:Extension) REQUIRE e.id IS UNIQUE',
      'CREATE CONSTRAINT extension_name IF NOT EXISTS FOR (e:Extension) REQUIRE e.name IS UNIQUE',
      
      // MCP Server constraints
      'CREATE CONSTRAINT mcp_id IF NOT EXISTS FOR (m:MCPServer) REQUIRE m.id IS UNIQUE',
      
      // Indexes for performance
      'CREATE INDEX user_created_at IF NOT EXISTS FOR (u:User) ON (u.createdAt)',
      'CREATE INDEX extension_created_at IF NOT EXISTS FOR (e:Extension) ON (e.createdAt)',
      'CREATE INDEX extension_category IF NOT EXISTS FOR (e:Extension) ON (e.category)',
      'CREATE INDEX extension_platform IF NOT EXISTS FOR (e:Extension) ON (e.platform)',
      'CREATE INDEX mcp_category IF NOT EXISTS FOR (m:MCPServer) ON (m.category)',
    ]

    for (const query of queries) {
      try {
        await session.run(query)
      } catch (error) {
        // Ignore constraint already exists errors
        if (!error.message.includes('already exists')) {
          console.warn('Schema initialization warning:', error.message)
        }
      }
    }

    // Create sample data for development
    if (process.env.NODE_ENV === 'development') {
      await createSampleData(session)
    }

    console.log('✅ Database schema initialized')
  } finally {
    await session.close()
  }
}

const createSampleData = async (session: Session): Promise<void> => {
  const sampleDataQuery = `
    // Create sample extensions if they don't exist
    MERGE (ext1:Extension {
      id: 'claude-shortcuts',
      name: 'Claude CLI Shortcuts',
      description: 'Comprehensive shortcut system for Claude CLI with auto-execute and experimental development features',
      category: 'productivity',
      platform: ['macos', 'linux', 'windows'],
      version: '1.0.0',
      author: 'iamcatface',
      downloads: 156,
      rating: 4.8,
      createdAt: datetime(),
      updatedAt: datetime(),
      installScript: 'curl -fsSL https://cldcde.cc/install/claude-shortcuts | bash',
      repository: 'https://github.com/iamcatface/claude-shortcuts',
      tags: ['shortcuts', 'productivity', 'cli', 'automation']
    })
    
    MERGE (ext2:Extension {
      id: 'experimental-dev',
      name: 'Experimental Development System',
      description: 'AI-driven parallel development workflow that creates 3 approaches and synthesizes optimal solutions',
      category: 'development',
      platform: ['macos', 'linux', 'windows'],
      version: '1.0.0',
      author: 'iamcatface',
      downloads: 89,
      rating: 4.9,
      createdAt: datetime(),
      updatedAt: datetime(),
      installScript: 'curl -fsSL https://cldcde.cc/install/experimental-dev | bash',
      repository: 'https://github.com/iamcatface/experimental-dev',
      tags: ['development', 'ai', 'automation', 'experimental']
    })
    
    MERGE (ext3:Extension {
      id: 'ai-video-recording',
      name: 'AI Development Video Recording',
      description: 'Complete system for recording, processing, and organizing AI development sessions for YouTube',
      category: 'content',
      platform: ['macos'],
      version: '1.0.0',
      author: 'iamcatface',
      downloads: 67,
      rating: 4.7,
      createdAt: datetime(),
      updatedAt: datetime(),
      installScript: 'curl -fsSL https://cldcde.cc/install/ai-video-recording | bash',
      repository: 'https://github.com/iamcatface/ai-video-recording',
      tags: ['video', 'recording', 'youtube', 'content']
    })
    
    // Create sample MCP servers
    MERGE (mcp1:MCPServer {
      id: 'claude-mcp-filesystem',
      name: 'Enhanced Filesystem MCP',
      description: 'Advanced filesystem operations with safety checks and batch processing',
      category: 'filesystem',
      platform: ['macos', 'linux', 'windows'],
      version: '2.1.0',
      author: 'iamcatface',
      downloads: 234,
      rating: 4.6,
      createdAt: datetime(),
      updatedAt: datetime(),
      installScript: 'bun add @cldcde/filesystem-mcp',
      repository: 'https://github.com/cldcde/filesystem-mcp',
      tags: ['filesystem', 'safety', 'batch-processing']
    })
    
    MERGE (mcp2:MCPServer {
      id: 'claude-mcp-database',
      name: 'Multi-Database MCP',
      description: 'Connect Claude to PostgreSQL, MySQL, MongoDB, and Neo4j databases',
      category: 'database',
      platform: ['macos', 'linux', 'windows'],
      version: '1.3.0',
      author: 'community',
      downloads: 189,
      rating: 4.5,
      createdAt: datetime(),
      updatedAt: datetime(),
      installScript: 'bun add @cldcde/database-mcp',
      repository: 'https://github.com/cldcde/database-mcp',
      tags: ['database', 'postgresql', 'mysql', 'mongodb', 'neo4j']
    })
  `

  try {
    await session.run(sampleDataQuery)
    console.log('✅ Sample data created for development')
  } catch (error) {
    console.warn('Sample data creation warning:', error)
  }
}

// Helper function to run queries with error handling
export const runQuery = async (query: string, params: Record<string, any> = {}) => {
  if (!driver) {
    throw new Error('Database not available. Please check your Neo4j connection.')
  }
  
  const session = getSession()
  
  try {
    const result = await session.run(query, params)
    return result
  } finally {
    await session.close()
  }
}

// Helper function for transactions
export const runTransaction = async (work: (tx: any) => Promise<any>) => {
  if (!driver) {
    throw new Error('Database not available. Please check your Neo4j connection.')
  }
  
  const session = getSession()
  
  try {
    return await session.executeWrite(work)
  } finally {
    await session.close()
  }
}
