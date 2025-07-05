import { Hono } from 'hono'
import { createSupabaseClient } from '../db/supabase'

const app = new Hono()

// Enhanced News API - Task 3: Advanced News Management

// Get all news with filtering
app.get('/', async (c) => {
  try {
    const { 
      category, 
      featured, 
      search, 
      sort = 'published_at',
      limit = 20, 
      offset = 0 
    } = c.req.query()

    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    let query = supabase
      .from('enhanced_news')
      .select(`
        *,
        author:profiles!author_id(id, username, avatar_url),
        comments:news_comments!news_id(count)
      `)
      .eq('status', 'published')
      .not('published_at', 'is', null)

    // Apply filters
    if (category) query = query.eq('category', category)
    if (featured === 'true') query = query.eq('featured', true)
    
    // Search functionality
    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%`)
    }

    // Sorting
    const sortColumn = ['published_at', 'view_count', 'like_count'].includes(sort) ? sort : 'published_at'
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

// Get single news article
app.get('/:identifier', async (c) => {
  try {
    const identifier = c.req.param('identifier')
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)
    
    let query = supabase
      .from('enhanced_news')
      .select(`
        *,
        author:profiles!author_id(id, username, avatar_url, bio),
        comments:news_comments!news_id(
          id, content, like_count, created_at,
          user:profiles!user_id(username, avatar_url),
          replies:news_comments!parent_id(
            id, content, like_count, created_at,
            user:profiles!user_id(username, avatar_url)
          )
        )
      `)
      .eq('status', 'published')

    if (isUUID) {
      query = query.eq('id', identifier)
    } else {
      query = query.eq('slug', identifier)
    }

    const { data, error } = await query.single()

    if (error) throw error

    // Increment view count
    await supabase
      .from('enhanced_news')
      .update({ view_count: data.view_count + 1 })
      .eq('id', data.id)

    // Track view event
    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'view_news',
        resource_type: 'news',
        resource_id: data.id,
        user_id: c.get('user')?.id || null
      })

    return c.json({ success: true, data })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 404)
  }
})

// Create news article (admin/editor only)
app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const userId = c.get('user')?.id
    if (!userId || !c.get('user')?.can_edit_news) {
      return c.json({ success: false, error: 'Unauthorized' }, 403)
    }

    // Generate slug from title
    const slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const newsData = {
      ...body,
      slug,
      author_id: userId,
      status: body.publish_now ? 'published' : 'draft',
      published_at: body.publish_now ? new Date().toISOString() : null
    }

    const { data, error } = await supabase
      .from('enhanced_news')
      .insert(newsData)
      .select()
      .single()

    if (error) throw error

    return c.json({ success: true, data }, 201)
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// Update news article
app.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const userId = c.get('user')?.id
    if (!userId || !c.get('user')?.can_edit_news) {
      return c.json({ success: false, error: 'Unauthorized' }, 403)
    }

    const { data, error } = await supabase
      .from('enhanced_news')
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

// Add comment to news article
app.post('/:id/comments', async (c) => {
  try {
    const newsId = c.req.param('id')
    const body = await c.req.json()
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const userId = c.get('user')?.id
    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401)
    }

    const commentData = {
      news_id: newsId,
      user_id: userId,
      content: body.content,
      parent_id: body.parent_id || null
    }

    const { data, error } = await supabase
      .from('news_comments')
      .insert(commentData)
      .select(`
        *,
        user:profiles!user_id(username, avatar_url)
      `)
      .single()

    if (error) throw error

    // Update comment count
    await supabase
      .from('enhanced_news')
      .update({ comment_count: supabase.sql`comment_count + 1` })
      .eq('id', newsId)

    return c.json({ success: true, data }, 201)
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// Get RSS sources (admin only)
app.get('/rss/sources', async (c) => {
  try {
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    if (!c.get('user')?.is_admin) {
      return c.json({ success: false, error: 'Admin access required' }, 403)
    }

    const { data, error } = await supabase
      .from('rss_sources')
      .select('*')
      .order('name')

    if (error) throw error

    return c.json({ success: true, data })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Add RSS source (admin only)
app.post('/rss/sources', async (c) => {
  try {
    const body = await c.req.json()
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    if (!c.get('user')?.is_admin) {
      return c.json({ success: false, error: 'Admin access required' }, 403)
    }

    const { data, error } = await supabase
      .from('rss_sources')
      .insert(body)
      .select()
      .single()

    if (error) throw error

    return c.json({ success: true, data }, 201)
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// Fetch from RSS sources (admin only)
app.post('/rss/fetch', async (c) => {
  try {
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    if (!c.get('user')?.is_admin) {
      return c.json({ success: false, error: 'Admin access required' }, 403)
    }

    // TODO: Implement RSS fetching logic
    // This would use a library like 'rss-parser' to fetch and parse RSS feeds
    // and create news articles from the feed items

    return c.json({ success: true, message: 'RSS fetch initiated' })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

export { app as enhancedNewsRoutes }