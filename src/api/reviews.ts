import { Hono } from 'hono'
import { createSupabaseClient } from '../db/supabase'

const app = new Hono()

// Reviews API - Task 2: Enhanced Resource Gallery System

// Get reviews for a resource
app.get('/:resourceType/:resourceId', async (c) => {
  try {
    const resourceType = c.req.param('resourceType') // 'extensions' or 'mcp_servers'
    const resourceId = c.req.param('resourceId')
    const { sort = 'created_at', limit = 20, offset = 0 } = c.req.query()
    
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const columnName = resourceType === 'extensions' ? 'extension_id' : 'mcp_server_id'
    
    let query = supabase
      .from('reviews')
      .select(`
        *,
        user:profiles!user_id(username, avatar_url, reputation, level)
      `)
      .eq(columnName, resourceId)
      .eq('status', 'active')

    // Sorting
    const sortColumn = ['created_at', 'rating', 'helpful_count'].includes(sort) ? sort : 'created_at'
    query = query.order(sortColumn, { ascending: false })

    // Pagination
    query = query.range(Number(offset), Number(offset) + Number(limit) - 1)

    const { data, error, count } = await query

    if (error) throw error

    return c.json({
      success: true,
      data,
      pagination: {
        total: count,
        limit: Number(limit),
        offset: Number(offset),
        pages: Math.ceil((count || 0) / Number(limit))
      }
    })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Create review
app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const userId = c.get('user')?.id
    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401)
    }

    // Validate resource exists
    const resourceTable = body.extension_id ? 'enhanced_extensions' : 'enhanced_mcp_servers'
    const resourceIdField = body.extension_id ? body.extension_id : body.mcp_server_id
    
    const { data: resource } = await supabase
      .from(resourceTable)
      .select('id, author_id')
      .eq('id', resourceIdField)
      .single()

    if (!resource) {
      return c.json({ success: false, error: 'Resource not found' }, 404)
    }

    // Prevent self-reviews
    if (resource.author_id === userId) {
      return c.json({ success: false, error: 'Cannot review your own resource' }, 400)
    }

    // Check for existing review
    const columnName = body.extension_id ? 'extension_id' : 'mcp_server_id'
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', userId)
      .eq(columnName, resourceIdField)
      .single()

    if (existingReview) {
      return c.json({ success: false, error: 'You have already reviewed this resource' }, 400)
    }

    const reviewData = {
      user_id: userId,
      rating: body.rating,
      title: body.title,
      content: body.content,
      extension_id: body.extension_id || null,
      mcp_server_id: body.mcp_server_id || null
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert(reviewData)
      .select(`
        *,
        user:profiles!user_id(username, avatar_url, reputation, level)
      `)
      .single()

    if (error) throw error

    // Record activity
    await supabase
      .from('activity_feed')
      .insert({
        user_id: userId,
        activity_type: 'reviewed',
        resource_type: body.extension_id ? 'extension' : 'mcp_server',
        resource_id: resourceIdField,
        metadata: { rating: body.rating }
      })

    return c.json({ success: true, data }, 201)
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// Update review
app.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const userId = c.get('user')?.id
    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401)
    }

    // Check review ownership
    const { data: review } = await supabase
      .from('reviews')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!review || review.user_id !== userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 403)
    }

    const { data, error } = await supabase
      .from('reviews')
      .update({
        rating: body.rating,
        title: body.title,
        content: body.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        user:profiles!user_id(username, avatar_url, reputation, level)
      `)
      .single()

    if (error) throw error

    return c.json({ success: true, data })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// Delete review
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const userId = c.get('user')?.id
    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401)
    }

    // Check review ownership or admin rights
    const { data: review } = await supabase
      .from('reviews')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!review || (review.user_id !== userId && !c.get('user')?.is_admin)) {
      return c.json({ success: false, error: 'Unauthorized' }, 403)
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)

    if (error) throw error

    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// Mark review as helpful
app.post('/:id/helpful', async (c) => {
  try {
    const id = c.req.param('id')
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const userId = c.get('user')?.id
    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401)
    }

    // Increment helpful count
    const { data, error } = await supabase
      .from('reviews')
      .update({ helpful_count: supabase.sql`helpful_count + 1` })
      .eq('id', id)
      .select('helpful_count')
      .single()

    if (error) throw error

    // Track analytics
    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'review_helpful',
        user_id: userId,
        resource_type: 'review',
        resource_id: id
      })

    return c.json({ success: true, helpful_count: data.helpful_count })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// Report review
app.post('/:id/report', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const userId = c.get('user')?.id
    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401)
    }

    // Add to moderation queue
    const { data, error } = await supabase
      .from('moderation_queue')
      .insert({
        item_type: 'review',
        item_id: id,
        user_id: userId,
        reason: body.reason,
        description: body.description,
        priority: 2 // medium priority for reports
      })
      .select()
      .single()

    if (error) throw error

    return c.json({ success: true, data })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// Get review statistics for a resource
app.get('/:resourceType/:resourceId/stats', async (c) => {
  try {
    const resourceType = c.req.param('resourceType')
    const resourceId = c.req.param('resourceId')
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const columnName = resourceType === 'extensions' ? 'extension_id' : 'mcp_server_id'

    // Get rating distribution
    const { data: ratings } = await supabase
      .from('reviews')
      .select('rating')
      .eq(columnName, resourceId)
      .eq('status', 'active')

    if (!ratings) {
      return c.json({ success: true, data: { distribution: {}, total: 0, average: 0 } })
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let total = 0
    let sum = 0

    ratings.forEach(review => {
      distribution[review.rating]++
      total++
      sum += review.rating
    })

    const average = total > 0 ? (sum / total).toFixed(2) : 0

    return c.json({
      success: true,
      data: {
        distribution,
        total,
        average: parseFloat(average)
      }
    })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

export { app as reviewsRoutes }