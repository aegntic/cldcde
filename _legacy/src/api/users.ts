import { Hono } from 'hono'
import { z } from 'zod'
import { runQuery } from '../db/neo4j'
import { cachePresets } from '../middleware/cache'

const userRoutes = new Hono()

// Validation schemas
const usernameSchema = z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/)

// GET /api/users/:username - Fetch public user profile
userRoutes.get('/:username', cachePresets.userProfile, async (c) => {
  try {
    const username = c.req.param('username')

    // Validate username format
    const validatedUsername = usernameSchema.parse(username)

    const result = await runQuery(
      `MATCH (u:User)
       WHERE u.username = $username
       RETURN u.id as id, u.username as username, u.createdAt as createdAt,
              u.profile as profile, u.lastLogin as lastLogin,
              u.role as role`,
      { username: validatedUsername }
    )

    if (result.records.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }

    const user = result.records[0].toObject()

    // Get user's extension count
    const extensionCountResult = await runQuery(
      `MATCH (u:User)-[:CREATED]->(e:Extension)
       WHERE u.username = $username
       RETURN count(e) as extensionCount`,
      { username: validatedUsername }
    )

    // Get user's MCP server count
    const mcpCountResult = await runQuery(
      `MATCH (u:User)-[:CREATED]->(m:MCPServer)
       WHERE u.username = $username
       RETURN count(m) as mcpCount`,
      { username: validatedUsername }
    )

    const extensionCount = extensionCountResult.records[0]?.get('extensionCount')?.toNumber() || 0
    const mcpCount = mcpCountResult.records[0]?.get('mcpCount')?.toNumber() || 0

    // Return public profile information
    const publicProfile = {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      profile: user.profile || {
        bio: '',
        website: '',
        github: '',
        twitter: ''
      },
      stats: {
        extensions: extensionCount,
        mcpServers: mcpCount
      },
      role: user.role
    }

    return c.json({ user: publicProfile })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Invalid username format',
        details: error.errors
      }, 400)
    }

    console.error('User profile fetch error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// GET /api/users/:username/extensions - Fetch extensions created by user
userRoutes.get('/:username/extensions', cachePresets.userExtensions, async (c) => {
  try {
    const username = c.req.param('username')
    const validatedUsername = usernameSchema.parse(username)

    // Parse query parameters for pagination
    const page = Math.max(1, parseInt(c.req.query('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(c.req.query('limit') || '20')))
    const offset = (page - 1) * limit

    // Check if user exists
    const userCheck = await runQuery(
      'MATCH (u:User) WHERE u.username = $username RETURN u.id',
      { username: validatedUsername }
    )

    if (userCheck.records.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Get user's extensions
    const result = await runQuery(
      `MATCH (u:User)-[:CREATED]->(e:Extension)
       WHERE u.username = $username
       RETURN e.id as id, e.name as name, e.description as description,
              e.category as category, e.platform as platform, e.version as version,
              e.downloads as downloads, e.rating as rating,
              e.createdAt as createdAt, e.updatedAt as updatedAt,
              e.tags as tags
       ORDER BY e.createdAt DESC
       SKIP $offset LIMIT $limit`,
      { username: validatedUsername, offset, limit }
    )

    const extensions = result.records.map(record => record.toObject())

    // Get total count
    const countResult = await runQuery(
      `MATCH (u:User)-[:CREATED]->(e:Extension)
       WHERE u.username = $username
       RETURN count(e) as total`,
      { username: validatedUsername }
    )

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
        error: 'Invalid username format',
        details: error.errors
      }, 400)
    }

    console.error('User extensions fetch error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// GET /api/users/:username/mcp - Fetch MCP servers created by user
userRoutes.get('/:username/mcp', cachePresets.userMcp, async (c) => {
  try {
    const username = c.req.param('username')
    const validatedUsername = usernameSchema.parse(username)

    // Parse query parameters for pagination
    const page = Math.max(1, parseInt(c.req.query('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(c.req.query('limit') || '20')))
    const offset = (page - 1) * limit

    // Check if user exists
    const userCheck = await runQuery(
      'MATCH (u:User) WHERE u.username = $username RETURN u.id',
      { username: validatedUsername }
    )

    if (userCheck.records.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Get user's MCP servers
    const result = await runQuery(
      `MATCH (u:User)-[:CREATED]->(m:MCPServer)
       WHERE u.username = $username
       RETURN m.id as id, m.name as name, m.description as description,
              m.category as category, m.platform as platform, m.version as version,
              m.downloads as downloads, m.rating as rating,
              m.createdAt as createdAt, m.updatedAt as updatedAt,
              m.tags as tags
       ORDER BY m.createdAt DESC
       SKIP $offset LIMIT $limit`,
      { username: validatedUsername, offset, limit }
    )

    const mcpServers = result.records.map(record => record.toObject())

    // Get total count
    const countResult = await runQuery(
      `MATCH (u:User)-[:CREATED]->(m:MCPServer)
       WHERE u.username = $username
       RETURN count(m) as total`,
      { username: validatedUsername }
    )

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
        error: 'Invalid username format',
        details: error.errors
      }, 400)
    }

    console.error('User MCP servers fetch error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// GET /api/users/:username/stats - Get user statistics
userRoutes.get('/:username/stats', cachePresets.userStats, async (c) => {
  try {
    const username = c.req.param('username')
    const validatedUsername = usernameSchema.parse(username)

    // Check if user exists
    const userCheck = await runQuery(
      'MATCH (u:User) WHERE u.username = $username RETURN u.id',
      { username: validatedUsername }
    )

    if (userCheck.records.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Get comprehensive stats
    const statsResult = await runQuery(
      `MATCH (u:User) WHERE u.username = $username
       OPTIONAL MATCH (u)-[:CREATED]->(e:Extension)
       OPTIONAL MATCH (u)-[:CREATED]->(m:MCPServer)
       RETURN 
         count(DISTINCT e) as extensionCount,
         count(DISTINCT m) as mcpCount,
         sum(e.downloads) as totalExtensionDownloads,
         sum(m.downloads) as totalMcpDownloads,
         avg(e.rating) as avgExtensionRating,
         avg(m.rating) as avgMcpRating`,
      { username: validatedUsername }
    )

    const stats = statsResult.records[0].toObject()

    return c.json({
      stats: {
        extensions: stats.extensionCount?.toNumber() || 0,
        mcpServers: stats.mcpCount?.toNumber() || 0,
        totalDownloads: (stats.totalExtensionDownloads?.toNumber() || 0) + (stats.totalMcpDownloads?.toNumber() || 0),
        averageRating: {
          extensions: stats.avgExtensionRating ? parseFloat(stats.avgExtensionRating.toFixed(2)) : null,
          mcpServers: stats.avgMcpRating ? parseFloat(stats.avgMcpRating.toFixed(2)) : null
        }
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Invalid username format',
        details: error.errors
      }, 400)
    }

    console.error('User stats fetch error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export { userRoutes }
