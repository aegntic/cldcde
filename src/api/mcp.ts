import { Hono } from 'hono'
import { z } from 'zod'
import { runQuery } from '../db/neo4j'
import { cachePresets } from '../middleware/cache'
import { invalidateOnMcpDownload } from '../cache/invalidation'

const mcpRoutes = new Hono()

// Validation schemas
const mcpQuerySchema = z.object({
  search: z.string().optional(),
  category: z.enum(['filesystem', 'database', 'api', 'tools', 'utilities']).optional(),
  platform: z.enum(['macos', 'linux', 'windows']).optional(),
  sort: z.enum(['downloads', 'rating', 'created', 'updated', 'name']).default('downloads'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20)
})

// GET /api/mcp - Fetch list of MCP servers with filtering/pagination
mcpRoutes.get('/', cachePresets.mcpList, async (c) => {
  try {
    const query = c.req.query()
    const validatedQuery = mcpQuerySchema.parse(query)
    
    const { search, category, platform, sort, page, limit } = validatedQuery
    const offset = (page - 1) * limit

    // Build dynamic Cypher query
    let cypherQuery = 'MATCH (m:MCPServer)'
    const params: Record<string, any> = {}
    const conditions: string[] = []

    // Add search condition
    if (search) {
      conditions.push('(m.name CONTAINS $search OR m.description CONTAINS $search OR any(tag IN m.tags WHERE tag CONTAINS $search))')
      params.search = search
    }

    // Add category filter
    if (category) {
      conditions.push('m.category = $category')
      params.category = category
    }

    // Add platform filter
    if (platform) {
      conditions.push('$platform IN m.platform')
      params.platform = platform
    }

    // Add WHERE clause if conditions exist
    if (conditions.length > 0) {
      cypherQuery += ' WHERE ' + conditions.join(' AND ')
    }

    // Add ORDER BY clause
    const sortMap = {
      downloads: 'm.downloads DESC',
      rating: 'm.rating DESC',
      created: 'm.createdAt DESC',
      updated: 'm.updatedAt DESC',
      name: 'm.name ASC'
    }
    cypherQuery += ` ORDER BY ${sortMap[sort]}`

    // Add pagination
    cypherQuery += ' SKIP $offset LIMIT $limit'
    params.offset = offset
    params.limit = limit

    // Return fields
    cypherQuery += `
      RETURN m.id as id, m.name as name, m.description as description,
             m.category as category, m.platform as platform, m.version as version,
             m.author as author, m.downloads as downloads, m.rating as rating,
             m.createdAt as createdAt, m.updatedAt as updatedAt,
             m.installScript as installScript, m.repository as repository,
             m.tags as tags
    `

    const result = await runQuery(cypherQuery, params)
    const mcpServers = result.records.map(record => record.toObject())

    // Get total count for pagination
    let countQuery = 'MATCH (m:MCPServer)'
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ')
    }
    countQuery += ' RETURN count(m) as total'

    const countResult = await runQuery(countQuery, { search, category, platform })
    const total = countResult.records[0]?.get('total')?.toNumber() || 0
    const totalPages = Math.ceil(total / limit)

    return c.json({
      mcpServers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Invalid query parameters',
        details: error.errors
      }, 400)
    }

    console.error('MCP servers list error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// GET /api/mcp/:id - Fetch single MCP server by ID
mcpRoutes.get('/:id', cachePresets.mcpDetail, async (c) => {
  try {
    const id = c.req.param('id')

    if (!id || typeof id !== 'string') {
      return c.json({ error: 'Invalid MCP server ID' }, 400)
    }

    const result = await runQuery(
      `MATCH (m:MCPServer)
       WHERE m.id = $id
       RETURN m.id as id, m.name as name, m.description as description,
              m.category as category, m.platform as platform, m.version as version,
              m.author as author, m.downloads as downloads, m.rating as rating,
              m.createdAt as createdAt, m.updatedAt as updatedAt,
              m.installScript as installScript, m.repository as repository,
              m.tags as tags`,
      { id }
    )

    if (result.records.length === 0) {
      return c.json({ error: 'MCP server not found' }, 404)
    }

    const mcpServer = result.records[0].toObject()

    // Increment view count (optional analytics)
    await runQuery(
      'MATCH (m:MCPServer) WHERE m.id = $id SET m.views = COALESCE(m.views, 0) + 1',
      { id }
    ).catch(err => console.warn('Failed to increment view count:', err))

    return c.json({ mcpServer })

  } catch (error) {
    console.error('MCP server fetch error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// GET /api/mcp/:id/stats - Get MCP server statistics
mcpRoutes.get('/:id/stats', async (c) => {
  try {
    const id = c.req.param('id')

    const result = await runQuery(
      `MATCH (m:MCPServer)
       WHERE m.id = $id
       RETURN m.downloads as downloads, m.rating as rating, 
              COALESCE(m.views, 0) as views`,
      { id }
    )

    if (result.records.length === 0) {
      return c.json({ error: 'MCP server not found' }, 404)
    }

    const stats = result.records[0].toObject()
    return c.json({ stats })

  } catch (error) {
    console.error('MCP server stats error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// GET /api/mcp/categories - Get available MCP categories with counts
mcpRoutes.get('/categories', cachePresets.categories, async (c) => {
  try {
    const result = await runQuery(
      `MATCH (m:MCPServer)
       RETURN m.category as category, count(m) as count
       ORDER BY count DESC`
    )

    const categories = result.records.map(record => ({
      category: record.get('category'),
      count: record.get('count').toNumber()
    }))

    return c.json({ categories })

  } catch (error) {
    console.error('MCP categories error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export { mcpRoutes }
