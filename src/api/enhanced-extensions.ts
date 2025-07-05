import { Hono } from 'hono'
import { createSupabaseClient } from '../db/supabase'

const app = new Hono()

// Enhanced Extensions API - Task 2: Resource Gallery System

// Get all extensions with advanced filtering
app.get('/', async (c) => {
  try {
    const { 
      category, 
      subcategory, 
      platform, 
      search, 
      featured, 
      verified,
      sort = 'downloads',
      order = 'desc',
      limit = 20, 
      offset = 0 
    } = c.req.query()

    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    let query = supabase
      .from('enhanced_extensions')
      .select(`
        *,
        author:profiles!author_id(id, username, avatar_url),
        reviews:reviews!extension_id(rating, title, content, created_at, user:profiles!user_id(username, avatar_url))
      `)
      .eq('status', 'approved')

    // Apply filters
    if (category) query = query.eq('category', category)
    if (subcategory) query = query.eq('subcategory', subcategory)
    if (platform) query = query.contains('platform', [platform])
    if (featured === 'true') query = query.eq('featured', true)
    if (verified === 'true') query = query.eq('verified', true)
    
    // Search functionality
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`)
    }

    // Sorting
    const sortColumn = ['downloads', 'rating', 'created_at', 'updated_at'].includes(sort) ? sort : 'downloads'
    const sortOrder = order === 'asc' ? { ascending: true } : { ascending: false }
    query = query.order(sortColumn, sortOrder)

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

// Get single extension by ID or slug
app.get('/:identifier', async (c) => {
  try {
    const identifier = c.req.param('identifier')
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)
    
    let query = supabase
      .from('enhanced_extensions')
      .select(`
        *,
        author:profiles!author_id(id, username, avatar_url, bio),
        reviews:reviews!extension_id(
          id, rating, title, content, helpful_count, created_at, updated_at,
          user:profiles!user_id(username, avatar_url)
        )
      `)

    if (isUUID) {
      query = query.eq('id', identifier)
    } else {
      query = query.eq('slug', identifier)
    }

    const { data, error } = await query.single()

    if (error) throw error

    // Track view
    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'view_extension',
        resource_type: 'extension',
        resource_id: data.id,
        metadata: { identifier }
      })

    return c.json({ success: true, data })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 404)
  }
})

// Create new extension (authenticated)
app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    // TODO: Add authentication middleware
    const userId = c.get('user')?.id

    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401)
    }

    // Generate slug from name
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const extensionData = {
      ...body,
      slug,
      author_id: userId,
      status: 'pending'
    }

    const { data, error } = await supabase
      .from('enhanced_extensions')
      .insert(extensionData)
      .select()
      .single()

    if (error) throw error

    // Add to moderation queue
    await supabase
      .from('moderation_queue')
      .insert({
        item_type: 'extension',
        item_id: data.id,
        user_id: userId,
        reason: 'new_submission'
      })

    return c.json({ success: true, data }, 201)
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// Update extension (author or admin only)
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

    // Check ownership or admin rights
    const { data: extension } = await supabase
      .from('enhanced_extensions')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!extension || (extension.author_id !== userId && !c.get('user')?.is_admin)) {
      return c.json({ success: false, error: 'Unauthorized' }, 403)
    }

    const { data, error } = await supabase
      .from('enhanced_extensions')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return c.json({ success: true, data })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// Delete extension (author or admin only)
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const userId = c.get('user')?.id
    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401)
    }

    // Check ownership or admin rights
    const { data: extension } = await supabase
      .from('enhanced_extensions')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!extension || (extension.author_id !== userId && !c.get('user')?.is_admin)) {
      return c.json({ success: false, error: 'Unauthorized' }, 403)
    }

    const { error } = await supabase
      .from('enhanced_extensions')
      .delete()
      .eq('id', id)

    if (error) throw error

    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// Record download
app.post('/:id/download', async (c) => {
  try {
    const id = c.req.param('id')
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    // Increment download count
    await supabase.rpc('increment_download_count', { 
      resource_type: 'extension', 
      resource_id: id 
    })

    // Track download event
    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'download_extension',
        resource_type: 'extension',
        resource_id: id,
        user_id: c.get('user')?.id || null
      })

    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// Get categories
app.get('/categories/list', async (c) => {
  try {
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const { data, error } = await supabase
      .from('resource_categories')
      .select('*')
      .eq('active', true)
      .order('sort_order')

    if (error) throw error

    return c.json({ success: true, data })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

export { app as enhancedExtensionRoutes }