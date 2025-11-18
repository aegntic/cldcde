#!/usr/bin/env bun

import { warmCache } from '../src/cache/strategies'
import { CACHE_PREFIXES, CACHE_TTL, generateCacheKey } from '../src/cache/upstash'
import { runQuery } from '../src/db/neo4j'

/**
 * Cache warming script to pre-populate frequently accessed data
 */

interface WarmingTask {
  name: string
  key: string
  ttl: number
  fetcher: () => Promise<any>
}

async function warmPopularExtensions() {
  console.log('Warming popular extensions cache...')
  
  const tasks: WarmingTask[] = [
    // Most downloaded extensions
    {
      name: 'Extensions - Most Downloaded',
      key: generateCacheKey(CACHE_PREFIXES.EXTENSIONS_LIST, {
        sort: 'downloads',
        page: '1',
        limit: '20'
      }),
      ttl: CACHE_TTL.LISTS,
      fetcher: async () => {
        const result = await runQuery(
          `MATCH (e:Extension)
           RETURN e.id as id, e.name as name, e.description as description,
                  e.category as category, e.platform as platform, e.version as version,
                  e.author as author, e.downloads as downloads, e.rating as rating,
                  e.createdAt as createdAt, e.updatedAt as updatedAt,
                  e.installScript as installScript, e.repository as repository,
                  e.tags as tags
           ORDER BY e.downloads DESC
           LIMIT 20`
        )
        
        const extensions = result.records.map(record => record.toObject())
        
        const countResult = await runQuery('MATCH (e:Extension) RETURN count(e) as total')
        const total = countResult.records[0]?.get('total')?.toNumber() || 0
        
        return {
          extensions,
          pagination: {
            page: 1,
            limit: 20,
            total,
            totalPages: Math.ceil(total / 20),
            hasNext: total > 20,
            hasPrev: false
          }
        }
      }
    },
    
    // Top rated extensions
    {
      name: 'Extensions - Top Rated',
      key: generateCacheKey(CACHE_PREFIXES.EXTENSIONS_LIST, {
        sort: 'rating',
        page: '1',
        limit: '20'
      }),
      ttl: CACHE_TTL.LISTS,
      fetcher: async () => {
        const result = await runQuery(
          `MATCH (e:Extension)
           RETURN e.id as id, e.name as name, e.description as description,
                  e.category as category, e.platform as platform, e.version as version,
                  e.author as author, e.downloads as downloads, e.rating as rating,
                  e.createdAt as createdAt, e.updatedAt as updatedAt,
                  e.installScript as installScript, e.repository as repository,
                  e.tags as tags
           ORDER BY e.rating DESC
           LIMIT 20`
        )
        
        const extensions = result.records.map(record => record.toObject())
        
        const countResult = await runQuery('MATCH (e:Extension) RETURN count(e) as total')
        const total = countResult.records[0]?.get('total')?.toNumber() || 0
        
        return {
          extensions,
          pagination: {
            page: 1,
            limit: 20,
            total,
            totalPages: Math.ceil(total / 20),
            hasNext: total > 20,
            hasPrev: false
          }
        }
      }
    },
    
    // Recent extensions
    {
      name: 'Extensions - Recent',
      key: generateCacheKey(CACHE_PREFIXES.EXTENSIONS_LIST, {
        sort: 'created',
        page: '1',
        limit: '20'
      }),
      ttl: CACHE_TTL.LISTS,
      fetcher: async () => {
        const result = await runQuery(
          `MATCH (e:Extension)
           RETURN e.id as id, e.name as name, e.description as description,
                  e.category as category, e.platform as platform, e.version as version,
                  e.author as author, e.downloads as downloads, e.rating as rating,
                  e.createdAt as createdAt, e.updatedAt as updatedAt,
                  e.installScript as installScript, e.repository as repository,
                  e.tags as tags
           ORDER BY e.createdAt DESC
           LIMIT 20`
        )
        
        const extensions = result.records.map(record => record.toObject())
        
        const countResult = await runQuery('MATCH (e:Extension) RETURN count(e) as total')
        const total = countResult.records[0]?.get('total')?.toNumber() || 0
        
        return {
          extensions,
          pagination: {
            page: 1,
            limit: 20,
            total,
            totalPages: Math.ceil(total / 20),
            hasNext: total > 20,
            hasPrev: false
          }
        }
      }
    }
  ]
  
  for (const task of tasks) {
    try {
      await warmCache(task.key, task.fetcher, { ttl: task.ttl })
      console.log(`✓ Warmed: ${task.name}`)
    } catch (error) {
      console.error(`✗ Failed: ${task.name}`, error)
    }
  }
}

async function warmPopularMcpServers() {
  console.log('Warming popular MCP servers cache...')
  
  const tasks: WarmingTask[] = [
    // Most downloaded MCP servers
    {
      name: 'MCP - Most Downloaded',
      key: generateCacheKey(CACHE_PREFIXES.MCP_LIST, {
        sort: 'downloads',
        page: '1',
        limit: '20'
      }),
      ttl: CACHE_TTL.LISTS,
      fetcher: async () => {
        const result = await runQuery(
          `MATCH (m:MCPServer)
           RETURN m.id as id, m.name as name, m.description as description,
                  m.category as category, m.platform as platform, m.version as version,
                  m.author as author, m.downloads as downloads, m.rating as rating,
                  m.createdAt as createdAt, m.updatedAt as updatedAt,
                  m.installScript as installScript, m.repository as repository,
                  m.tags as tags
           ORDER BY m.downloads DESC
           LIMIT 20`
        )
        
        const mcpServers = result.records.map(record => record.toObject())
        
        const countResult = await runQuery('MATCH (m:MCPServer) RETURN count(m) as total')
        const total = countResult.records[0]?.get('total')?.toNumber() || 0
        
        return {
          mcpServers,
          pagination: {
            page: 1,
            limit: 20,
            total,
            totalPages: Math.ceil(total / 20),
            hasNext: total > 20,
            hasPrev: false
          }
        }
      }
    },
    
    // Top rated MCP servers
    {
      name: 'MCP - Top Rated',
      key: generateCacheKey(CACHE_PREFIXES.MCP_LIST, {
        sort: 'rating',
        page: '1',
        limit: '20'
      }),
      ttl: CACHE_TTL.LISTS,
      fetcher: async () => {
        const result = await runQuery(
          `MATCH (m:MCPServer)
           RETURN m.id as id, m.name as name, m.description as description,
                  m.category as category, m.platform as platform, m.version as version,
                  m.author as author, m.downloads as downloads, m.rating as rating,
                  m.createdAt as createdAt, m.updatedAt as updatedAt,
                  m.installScript as installScript, m.repository as repository,
                  m.tags as tags
           ORDER BY m.rating DESC
           LIMIT 20`
        )
        
        const mcpServers = result.records.map(record => record.toObject())
        
        const countResult = await runQuery('MATCH (m:MCPServer) RETURN count(m) as total')
        const total = countResult.records[0]?.get('total')?.toNumber() || 0
        
        return {
          mcpServers,
          pagination: {
            page: 1,
            limit: 20,
            total,
            totalPages: Math.ceil(total / 20),
            hasNext: total > 20,
            hasPrev: false
          }
        }
      }
    }
  ]
  
  for (const task of tasks) {
    try {
      await warmCache(task.key, task.fetcher, { ttl: task.ttl })
      console.log(`✓ Warmed: ${task.name}`)
    } catch (error) {
      console.error(`✗ Failed: ${task.name}`, error)
    }
  }
}

async function warmCategories() {
  console.log('Warming categories cache...')
  
  // Extension categories
  try {
    const key = generateCacheKey(CACHE_PREFIXES.CATEGORIES, { type: 'extensions' })
    await warmCache(
      key,
      async () => {
        const result = await runQuery(
          `MATCH (e:Extension)
           RETURN e.category as category, count(e) as count
           ORDER BY count DESC`
        )
        
        return result.records.map(record => ({
          category: record.get('category'),
          count: record.get('count').toNumber()
        }))
      },
      { ttl: CACHE_TTL.CATEGORIES }
    )
    console.log('✓ Warmed: Extension categories')
  } catch (error) {
    console.error('✗ Failed: Extension categories', error)
  }
  
  // MCP categories
  try {
    const key = generateCacheKey(CACHE_PREFIXES.CATEGORIES, { type: 'mcp' })
    await warmCache(
      key,
      async () => {
        const result = await runQuery(
          `MATCH (m:MCPServer)
           RETURN m.category as category, count(m) as count
           ORDER BY count DESC`
        )
        
        return result.records.map(record => ({
          category: record.get('category'),
          count: record.get('count').toNumber()
        }))
      },
      { ttl: CACHE_TTL.CATEGORIES }
    )
    console.log('✓ Warmed: MCP categories')
  } catch (error) {
    console.error('✗ Failed: MCP categories', error)
  }
}

async function warmTopUsers() {
  console.log('Warming top users cache...')
  
  try {
    // Get top contributors
    const result = await runQuery(
      `MATCH (u:User)
       OPTIONAL MATCH (u)-[:CREATED]->(e:Extension)
       OPTIONAL MATCH (u)-[:CREATED]->(m:MCPServer)
       WITH u, count(DISTINCT e) as extensionCount, count(DISTINCT m) as mcpCount
       WHERE extensionCount > 0 OR mcpCount > 0
       RETURN u.username as username
       ORDER BY (extensionCount + mcpCount) DESC
       LIMIT 10`
    )
    
    const topUsers = result.records.map(record => record.get('username'))
    
    // Warm each top user's profile
    for (const username of topUsers) {
      try {
        const key = generateCacheKey(CACHE_PREFIXES.USER_PROFILE, { username })
        await warmCache(
          key,
          async () => {
            const userResult = await runQuery(
              `MATCH (u:User)
               WHERE u.username = $username
               RETURN u.id as id, u.username as username, u.createdAt as createdAt,
                      u.profile as profile, u.role as role`,
              { username }
            )
            
            if (userResult.records.length === 0) {
              throw new Error('User not found')
            }
            
            const user = userResult.records[0].toObject()
            
            // Get stats
            const statsResult = await runQuery(
              `MATCH (u:User) WHERE u.username = $username
               OPTIONAL MATCH (u)-[:CREATED]->(e:Extension)
               OPTIONAL MATCH (u)-[:CREATED]->(m:MCPServer)
               RETURN 
                 count(DISTINCT e) as extensionCount,
                 count(DISTINCT m) as mcpCount`,
              { username }
            )
            
            const stats = statsResult.records[0].toObject()
            
            return {
              user: {
                ...user,
                stats: {
                  extensions: stats.extensionCount?.toNumber() || 0,
                  mcpServers: stats.mcpCount?.toNumber() || 0
                }
              }
            }
          },
          { ttl: CACHE_TTL.USER_DATA }
        )
        console.log(`✓ Warmed: User profile - ${username}`)
      } catch (error) {
        console.error(`✗ Failed: User profile - ${username}`, error)
      }
    }
  } catch (error) {
    console.error('✗ Failed: Top users query', error)
  }
}

async function main() {
  console.log('Starting cache warming process...\n')
  
  const startTime = Date.now()
  
  try {
    // Warm caches in parallel where possible
    await Promise.all([
      warmPopularExtensions(),
      warmPopularMcpServers(),
      warmCategories()
    ])
    
    // Warm user caches separately to avoid overload
    await warmTopUsers()
    
    const duration = Date.now() - startTime
    console.log(`\nCache warming completed in ${duration}ms`)
  } catch (error) {
    console.error('Cache warming failed:', error)
    process.exit(1)
  }
}

// Run the script
main().catch(console.error)