import { Hono } from 'hono'
import { createSupabaseClient } from '../db/supabase'

const app = new Hono()

// Admin API - Task 4: Content Management Features

// Dashboard analytics
app.get('/dashboard', async (c) => {
  try {
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    if (!c.get('user')?.is_admin) {
      return c.json({ success: false, error: 'Admin access required' }, 403)
    }

    // Gather dashboard statistics
    const [
      extensionsResult,
      mcpServersResult,
      usersResult,
      newsResult,
      moderationResult,
      analyticsResult
    ] = await Promise.all([
      supabase.from('enhanced_extensions').select('count', { count: 'exact' }),
      supabase.from('enhanced_mcp_servers').select('count', { count: 'exact' }),
      supabase.from('profiles').select('count', { count: 'exact' }),
      supabase.from('enhanced_news').select('count', { count: 'exact' }),
      supabase.from('moderation_queue').select('count', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('analytics_events').select('count', { count: 'exact' }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ])

    // Recent activity
    const { data: recentActivity } = await supabase
      .from('analytics_events')
      .select(`
        *,
        user:profiles(username, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    // Top resources
    const { data: topExtensions } = await supabase
      .from('enhanced_extensions')
      .select('id, name, downloads, rating')
      .order('downloads', { ascending: false })
      .limit(10)

    return c.json({
      success: true,
      data: {
        stats: {
          extensions: extensionsResult.count || 0,
          mcpServers: mcpServersResult.count || 0,
          users: usersResult.count || 0,
          news: newsResult.count || 0,
          pendingModeration: moderationResult.count || 0,
          dailyEvents: analyticsResult.count || 0
        },
        recentActivity,
        topExtensions
      }
    })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Moderation queue
app.get('/moderation', async (c) => {
  try {
    const { status = 'pending', limit = 20, offset = 0 } = c.req.query()
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    if (!c.get('user')?.can_moderate) {
      return c.json({ success: false, error: 'Moderator access required' }, 403)
    }

    const { data, error, count } = await supabase
      .from('moderation_queue')
      .select(`
        *,
        user:profiles!user_id(username, avatar_url),
        assigned_moderator:profiles!assigned_to(username, avatar_url)
      `)
      .eq('status', status)
      .order('priority', { ascending: false })
      .order('created_at')
      .range(Number(offset), Number(offset) + Number(limit) - 1)

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

// Handle moderation item
app.put('/moderation/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const userId = c.get('user')?.id
    if (!userId || !c.get('user')?.can_moderate) {
      return c.json({ success: false, error: 'Moderator access required' }, 403)
    }

    // Update moderation item
    const { data: moderationItem, error: moderationError } = await supabase
      .from('moderation_queue')
      .update({
        status: body.action, // approved, rejected, escalated
        assigned_to: userId,
        moderator_notes: body.notes,
        resolved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (moderationError) throw moderationError

    // Apply action to the actual resource
    if (body.action === 'approved') {
      if (moderationItem.item_type === 'extension') {
        await supabase
          .from('enhanced_extensions')
          .update({ status: 'approved', published_at: new Date().toISOString() })
          .eq('id', moderationItem.item_id)
      } else if (moderationItem.item_type === 'mcp_server') {
        await supabase
          .from('enhanced_mcp_servers')
          .update({ status: 'approved', published_at: new Date().toISOString() })
          .eq('id', moderationItem.item_id)
      }
    } else if (body.action === 'rejected') {
      if (moderationItem.item_type === 'extension') {
        await supabase
          .from('enhanced_extensions')
          .update({ status: 'rejected' })
          .eq('id', moderationItem.item_id)
      } else if (moderationItem.item_type === 'mcp_server') {
        await supabase
          .from('enhanced_mcp_servers')
          .update({ status: 'rejected' })
          .eq('id', moderationItem.item_id)
      }
    }

    return c.json({ success: true, data: moderationItem })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// User management
app.get('/users', async (c) => {
  try {
    const { search, role, limit = 20, offset = 0 } = c.req.query()
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    if (!c.get('user')?.is_admin) {
      return c.json({ success: false, error: 'Admin access required' }, 403)
    }

    let query = supabase
      .from('profiles')
      .select(`
        *,
        user_roles:user_roles(
          role:admin_roles(name, description)
        )
      `)

    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

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

// Update user role
app.put('/users/:id/role', async (c) => {
  try {
    const userId = c.req.param('id')
    const body = await c.req.json()
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    if (!c.get('user')?.is_admin) {
      return c.json({ success: false, error: 'Admin access required' }, 403)
    }

    // Remove existing roles
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)

    // Add new role if specified
    if (body.role_id) {
      const { data, error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: body.role_id,
          granted_by: c.get('user')?.id
        })
        .select()
        .single()

      if (error) throw error

      return c.json({ success: true, data })
    }

    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// System health check
app.get('/health', async (c) => {
  try {
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    if (!c.get('user')?.is_admin) {
      return c.json({ success: false, error: 'Admin access required' }, 403)
    }

    // Check database connectivity
    const { data: dbCheck, error: dbError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact' })
      .limit(1)

    // Check recent errors from analytics
    const { data: recentErrors } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('event_type', 'error')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    return c.json({
      success: true,
      data: {
        database: dbError ? 'error' : 'healthy',
        dbError: dbError?.message,
        recentErrors: recentErrors || [],
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Bulk operations
app.post('/bulk/:action', async (c) => {
  try {
    const action = c.req.param('action')
    const body = await c.req.json()
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    if (!c.get('user')?.is_admin) {
      return c.json({ success: false, error: 'Admin access required' }, 403)
    }

    const { resource_type, resource_ids, data: updateData } = body

    let result
    switch (action) {
      case 'approve':
        if (resource_type === 'extensions') {
          result = await supabase
            .from('enhanced_extensions')
            .update({ status: 'approved', published_at: new Date().toISOString() })
            .in('id', resource_ids)
        } else if (resource_type === 'mcp_servers') {
          result = await supabase
            .from('enhanced_mcp_servers')
            .update({ status: 'approved', published_at: new Date().toISOString() })
            .in('id', resource_ids)
        }
        break

      case 'reject':
        if (resource_type === 'extensions') {
          result = await supabase
            .from('enhanced_extensions')
            .update({ status: 'rejected' })
            .in('id', resource_ids)
        } else if (resource_type === 'mcp_servers') {
          result = await supabase
            .from('enhanced_mcp_servers')
            .update({ status: 'rejected' })
            .in('id', resource_ids)
        }
        break

      case 'feature':
        if (resource_type === 'extensions') {
          result = await supabase
            .from('enhanced_extensions')
            .update({ featured: true })
            .in('id', resource_ids)
        } else if (resource_type === 'mcp_servers') {
          result = await supabase
            .from('enhanced_mcp_servers')
            .update({ featured: true })
            .in('id', resource_ids)
        }
        break

      default:
        return c.json({ success: false, error: 'Invalid bulk action' }, 400)
    }

    if (result?.error) throw result.error

    return c.json({ success: true, affected: resource_ids.length })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

export { app as adminRoutes }