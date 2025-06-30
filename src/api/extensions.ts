import { Hono } from 'hono'
import { z } from 'zod'
import { runQuery } from '../db/neo4j'
import { cachePresets } from '../middleware/cache'
import { invalidateOnExtensionDownload } from '../cache/invalidation'

const extensionRoutes = new Hono()

// Validation schemas
const extensionQuerySchema = z.object({
  search: z.string().optional(),
  category: z.enum(['productivity', 'development', 'content', 'filesystem', 'database']).optional(),
  platform: z.enum(['macos', 'linux', 'windows']).optional(),
  sort: z.enum(['downloads', 'rating', 'created', 'updated', 'name']).default('downloads'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20)
})

// GET /api/extensions - Fetch list of extensions with filtering/pagination
extensionRoutes.get('/', cachePresets.extensionsList, async (c) => {
  try {
    const query = c.req.query()
    const validatedQuery = extensionQuerySchema.parse(query)
    
    const { search, category, platform, sort, page, limit } = validatedQuery
    const offset = (page - 1) * limit

    // Build dynamic Cypher query
    let cypherQuery = 'MATCH (e:Extension)'
    const params: Record<string, any> = {}
    const conditions: string[] = []

    // Add search condition
    if (search) {
      conditions.push('(e.name CONTAINS $search OR e.description CONTAINS $search OR any(tag IN e.tags WHERE tag CONTAINS $search))')
      params.search = search
    }

    // Add category filter
    if (category) {
      conditions.push('e.category = $category')
      params.category = category
    }

    // Add platform filter
    if (platform) {
      conditions.push('$platform IN e.platform')
      params.platform = platform
    }

    // Add WHERE clause if conditions exist
    if (conditions.length > 0) {
      cypherQuery += ' WHERE ' + conditions.join(' AND ')
    }

    // Add ORDER BY clause
    const sortMap = {
      downloads: 'e.downloads DESC',
      rating: 'e.rating DESC',
      created: 'e.createdAt DESC',
      updated: 'e.updatedAt DESC',
      name: 'e.name ASC'
    }
    cypherQuery += ` ORDER BY ${sortMap[sort]}`

    // Add pagination
    cypherQuery += ' SKIP $offset LIMIT $limit'
    params.offset = offset
    params.limit = limit

    // Return fields
    cypherQuery += `
      RETURN e.id as id, e.name as name, e.description as description,
             e.category as category, e.platform as platform, e.version as version,
             e.author as author, e.downloads as downloads, e.rating as rating,
             e.createdAt as createdAt, e.updatedAt as updatedAt,
             e.installScript as installScript, e.repository as repository,
             e.tags as tags
    `

    const result = await runQuery(cypherQuery, params)
    const extensions = result.records.map(record => record.toObject())

    // Get total count for pagination
    let countQuery = 'MATCH (e:Extension)'
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ')
    }
    countQuery += ' RETURN count(e) as total'

    const countResult = await runQuery(countQuery, { search, category, platform })
    const total = countResult.records[0]?.get('total')?.toNumber() || 0
    const totalPages = Math.ceil(total / limit)

    return c.json({
      extensions,
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

    console.error('Extensions list error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// GET /api/extensions/:id - Fetch single extension by ID
extensionRoutes.get('/:id', cachePresets.extensionDetail, async (c) => {
  try {
    const id = c.req.param('id')

    if (!id || typeof id !== 'string') {
      return c.json({ error: 'Invalid extension ID' }, 400)
    }

    const result = await runQuery(
      `MATCH (e:Extension)
       WHERE e.id = $id
       RETURN e.id as id, e.name as name, e.description as description,
              e.category as category, e.platform as platform, e.version as version,
              e.author as author, e.downloads as downloads, e.rating as rating,
              e.createdAt as createdAt, e.updatedAt as updatedAt,
              e.installScript as installScript, e.repository as repository,
              e.tags as tags`,
      { id }
    )

    if (result.records.length === 0) {
      return c.json({ error: 'Extension not found' }, 404)
    }

    const extension = result.records[0].toObject()

    // Increment view count and download count (optional analytics)
    await runQuery(
      'MATCH (e:Extension) WHERE e.id = $id SET e.views = COALESCE(e.views, 0) + 1',
      { id }
    ).catch(err => console.warn('Failed to increment view count:', err))
    
    // Invalidate download-related caches if needed
    // This would be triggered on actual download, not just view

    return c.json({ extension })

  } catch (error) {
    console.error('Extension fetch error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// GET /api/extensions/:id/stats - Get extension statistics
extensionRoutes.get('/:id/stats', async (c) => {
  try {
    const id = c.req.param('id')

    const result = await runQuery(
      `MATCH (e:Extension)
       WHERE e.id = $id
       RETURN e.downloads as downloads, e.rating as rating, 
              COALESCE(e.views, 0) as views`,
      { id }
    )

    if (result.records.length === 0) {
      return c.json({ error: 'Extension not found' }, 404)
    }

    const stats = result.records[0].toObject()
    return c.json({ stats })

  } catch (error) {
    console.error('Extension stats error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export { extensionRoutes }
