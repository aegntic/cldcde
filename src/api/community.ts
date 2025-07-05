import { Hono } from 'hono'
import { createSupabaseClient } from '../db/supabase'

const app = new Hono()

// Community API - Task 5: Community Features

// Get user profile
app.get('/users/:username', async (c) => {
  try {
    const username = c.req.param('username')
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        extensions:enhanced_extensions!author_id(id, name, downloads, rating, created_at),
        mcp_servers:enhanced_mcp_servers!author_id(id, name, downloads, rating, created_at),
        achievements:user_achievements(
          earned_at,
          achievement:achievements(name, description, icon, color, rarity)
        ),
        followers:user_follows!following_id(count),
        following:user_follows!follower_id(count),
        collections:collections(id, name, description, item_count, created_at)
      `)
      .eq('username', username)
      .single()

    if (error) throw error

    // Update last seen if this is the user's own profile
    const currentUserId = c.get('user')?.id
    if (currentUserId === data.id) {
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', currentUserId)
    }

    return c.json({ success: true, data })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 404)
  }
})

// Update user profile
app.put('/users/:username', async (c) => {
  try {
    const username = c.req.param('username')
    const body = await c.req.json()
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const userId = c.get('user')?.id
    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401)
    }

    // Check if user owns this profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (!profile || profile.id !== userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 403)
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(body)
      .eq('username', username)
      .select()
      .single()

    if (error) throw error

    return c.json({ success: true, data })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// Vote on resource
app.post('/vote', async (c) => {
  try {
    const body = await c.req.json()
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const userId = c.get('user')?.id
    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401)
    }

    const { resource_type, resource_id, vote_type } = body

    // Upsert vote (update if exists, insert if not)
    const { data, error } = await supabase
      .from('votes')
      .upsert({
        user_id: userId,
        resource_type,
        resource_id,
        vote_type
      })
      .select()
      .single()

    if (error) throw error

    // Record activity
    await supabase
      .from('activity_feed')
      .insert({
        user_id: userId,
        activity_type: 'voted',
        resource_type,
        resource_id,
        metadata: { vote_type }
      })

    return c.json({ success: true, data })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// Remove vote
app.delete('/vote', async (c) => {
  try {
    const { resource_type, resource_id } = c.req.query()
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const userId = c.get('user')?.id
    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401)
    }

    const { error } = await supabase
      .from('votes')
      .delete()
      .eq('user_id', userId)
      .eq('resource_type', resource_type)
      .eq('resource_id', resource_id)

    if (error) throw error

    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// Follow/unfollow user
app.post('/follow/:username', async (c) => {
  try {
    const username = c.req.param('username')
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const userId = c.get('user')?.id
    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401)
    }

    // Get target user ID
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (!targetUser) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }

    if (targetUser.id === userId) {
      return c.json({ success: false, error: 'Cannot follow yourself' }, 400)
    }

    // Toggle follow
    const { data: existingFollow } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', userId)
      .eq('following_id', targetUser.id)
      .single()

    if (existingFollow) {
      // Unfollow
      await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', targetUser.id)

      return c.json({ success: true, action: 'unfollowed' })
    } else {
      // Follow
      const { data, error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: userId,
          following_id: targetUser.id
        })
        .select()
        .single()

      if (error) throw error

      // Record activity
      await supabase
        .from('activity_feed')
        .insert({
          user_id: userId,
          activity_type: 'followed_user',
          metadata: { following_username: username }
        })

      return c.json({ success: true, action: 'followed', data })
    }
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// Get activity feed
app.get('/feed', async (c) => {
  try {
    const { limit = 20, offset = 0 } = c.req.query()
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const userId = c.get('user')?.id
    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401)
    }

    // Get feed items from followed users + own activity
    const { data, error } = await supabase
      .from('activity_feed')
      .select(`
        *,
        user:profiles!user_id(username, avatar_url)
      `)
      .or(`user_id.eq.${userId},user_id.in.(${
        // Subquery for followed users would go here
        // For now, just show all public activity
        'select following_id from user_follows where follower_id = ' + userId
      })`)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (error) throw error

    return c.json({ success: true, data })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get user collections
app.get('/users/:username/collections', async (c) => {
  try {
    const username = c.req.param('username')
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    // Get user ID
    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }

    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        items:collection_items(
          resource_type,
          resource_id,
          notes,
          added_at
        )
      `)
      .eq('user_id', user.id)
      .eq('visibility', 'public')
      .order('updated_at', { ascending: false })

    if (error) throw error

    return c.json({ success: true, data })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Create collection
app.post('/collections', async (c) => {
  try {
    const body = await c.req.json()
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const userId = c.get('user')?.id
    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401)
    }

    const { data, error } = await supabase
      .from('collections')
      .insert({
        ...body,
        user_id: userId
      })
      .select()
      .single()

    if (error) throw error

    return c.json({ success: true, data }, 201)
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// Add item to collection
app.post('/collections/:id/items', async (c) => {
  try {
    const collectionId = c.req.param('id')
    const body = await c.req.json()
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    const userId = c.get('user')?.id
    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401)
    }

    // Check collection ownership
    const { data: collection } = await supabase
      .from('collections')
      .select('user_id')
      .eq('id', collectionId)
      .single()

    if (!collection || collection.user_id !== userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 403)
    }

    const { data, error } = await supabase
      .from('collection_items')
      .insert({
        collection_id: collectionId,
        resource_type: body.resource_type,
        resource_id: body.resource_id,
        notes: body.notes
      })
      .select()
      .single()

    if (error) throw error

    return c.json({ success: true, data }, 201)
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// Get leaderboard
app.get('/leaderboard', async (c) => {
  try {
    const { type = 'reputation', limit = 50 } = c.req.query()
    const env = c.env as { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
    const supabase = createSupabaseClient(env)

    let orderColumn = 'reputation'
    
    switch (type) {
      case 'downloads':
        // This would need a computed field for total downloads
        orderColumn = 'reputation' // fallback
        break
      case 'contributions':
        orderColumn = 'level'
        break
      default:
        orderColumn = 'reputation'
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        username,
        avatar_url,
        reputation,
        level,
        badges,
        created_at,
        extensions:enhanced_extensions!author_id(count),
        mcp_servers:enhanced_mcp_servers!author_id(count)
      `)
      .order(orderColumn, { ascending: false })
      .limit(Number(limit))

    if (error) throw error

    return c.json({ success: true, data })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

export { app as communityRoutes }