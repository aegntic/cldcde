import { Hono } from 'hono'
import { z } from 'zod'
import { jwt } from 'hono/jwt'
import { runQuery, runTransaction } from '../db/neo4j'
import { 
  invalidateOnExtensionCreate, 
  invalidateOnExtensionUpdate,
  invalidateOnRating 
} from '../cache/invalidation'

/**
 * Example of write endpoints with cache invalidation
 * This shows how to integrate cache invalidation for user actions
 */

const extensionWriteRoutes = new Hono()

// Protect all write routes with JWT
extensionWriteRoutes.use('*', jwt({
  secret: process.env.JWT_SECRET || 'your-secret-key'
}))

// Extension creation schema
const createExtensionSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  category: z.enum(['productivity', 'development', 'content', 'filesystem', 'database']),
  platform: z.array(z.enum(['macos', 'linux', 'windows'])).min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  installScript: z.string(),
  repository: z.string().url(),
  tags: z.array(z.string()).max(10)
})

// POST /api/extensions - Create new extension
extensionWriteRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = createExtensionSchema.parse(body)
    const payload = c.get('jwtPayload')
    
    // Create extension in transaction
    const result = await runTransaction(async (tx) => {
      return await tx.run(
        `MATCH (u:User {id: $userId})
         CREATE (e:Extension {
           id: randomUUID(),
           name: $name,
           description: $description,
           category: $category,
           platform: $platform,
           version: $version,
           author: u.username,
           downloads: 0,
           rating: 0,
           createdAt: datetime(),
           updatedAt: datetime(),
           installScript: $installScript,
           repository: $repository,
           tags: $tags
         })
         CREATE (u)-[:CREATED]->(e)
         RETURN e.id as id, e.name as name, e.category as category`,
        {
          userId: payload.id,
          ...validatedData
        }
      )
    })
    
    const extension = result.records[0].toObject()
    
    // Invalidate relevant caches
    await invalidateOnExtensionCreate(
      payload.username,
      extension.category,
      extension.id
    )
    
    return c.json({
      message: 'Extension created successfully',
      extension: {
        id: extension.id,
        name: extension.name,
        category: extension.category
      }
    }, 201)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    
    console.error('Extension creation error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// PUT /api/extensions/:id - Update extension
extensionWriteRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const payload = c.get('jwtPayload')
    
    // Partial update schema
    const updateSchema = createExtensionSchema.partial()
    const validatedData = updateSchema.parse(body)
    
    // Get current extension data
    const currentResult = await runQuery(
      `MATCH (e:Extension {id: $id})<-[:CREATED]-(u:User {id: $userId})
       RETURN e.category as oldCategory, u.username as username`,
      { id, userId: payload.id }
    )
    
    if (currentResult.records.length === 0) {
      return c.json({ error: 'Extension not found or unauthorized' }, 404)
    }
    
    const current = currentResult.records[0].toObject()
    
    // Update extension
    const updateFields = Object.entries(validatedData)
      .map(([key, value]) => `e.${key} = $${key}`)
      .join(', ')
    
    await runQuery(
      `MATCH (e:Extension {id: $id})
       SET ${updateFields}, e.updatedAt = datetime()`,
      { id, ...validatedData }
    )
    
    // Invalidate caches
    await invalidateOnExtensionUpdate(
      id,
      current.username,
      current.oldCategory,
      validatedData.category
    )
    
    return c.json({ message: 'Extension updated successfully' })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    
    console.error('Extension update error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// POST /api/extensions/:id/rate - Rate an extension
extensionWriteRoutes.post('/:id/rate', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const payload = c.get('jwtPayload')
    
    const ratingSchema = z.object({
      rating: z.number().min(1).max(5)
    })
    
    const { rating } = ratingSchema.parse(body)
    
    // Get extension author
    const extensionResult = await runQuery(
      `MATCH (e:Extension {id: $id})<-[:CREATED]-(author:User)
       RETURN author.username as authorUsername`,
      { id }
    )
    
    if (extensionResult.records.length === 0) {
      return c.json({ error: 'Extension not found' }, 404)
    }
    
    const { authorUsername } = extensionResult.records[0].toObject()
    
    // Create or update rating
    await runTransaction(async (tx) => {
      // Check if user already rated
      const existingRating = await tx.run(
        `MATCH (u:User {id: $userId})-[r:RATED]->(e:Extension {id: $extensionId})
         RETURN r.rating as oldRating`,
        { userId: payload.id, extensionId: id }
      )
      
      if (existingRating.records.length > 0) {
        // Update existing rating
        await tx.run(
          `MATCH (u:User {id: $userId})-[r:RATED]->(e:Extension {id: $extensionId})
           SET r.rating = $rating, r.updatedAt = datetime()`,
          { userId: payload.id, extensionId: id, rating }
        )
      } else {
        // Create new rating
        await tx.run(
          `MATCH (u:User {id: $userId}), (e:Extension {id: $extensionId})
           CREATE (u)-[:RATED {rating: $rating, createdAt: datetime()}]->(e)`,
          { userId: payload.id, extensionId: id, rating }
        )
      }
      
      // Update extension average rating
      await tx.run(
        `MATCH (e:Extension {id: $extensionId})<-[r:RATED]-()
         WITH e, avg(r.rating) as avgRating
         SET e.rating = avgRating`,
        { extensionId: id }
      )
    })
    
    // Invalidate caches
    await invalidateOnRating('extension', id, authorUsername)
    
    return c.json({ message: 'Rating submitted successfully' })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    
    console.error('Rating error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// POST /api/extensions/:id/download - Track download (increment counter)
extensionWriteRoutes.post('/:id/download', async (c) => {
  try {
    const id = c.req.param('id')
    
    // Increment download count
    await runQuery(
      `MATCH (e:Extension {id: $id})
       SET e.downloads = COALESCE(e.downloads, 0) + 1`,
      { id }
    )
    
    // Invalidate download-related caches
    await invalidateOnExtensionDownload(id)
    
    return c.json({ message: 'Download tracked' })
    
  } catch (error) {
    console.error('Download tracking error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export { extensionWriteRoutes }