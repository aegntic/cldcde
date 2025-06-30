import { Hono } from 'hono'
import { z } from 'zod'
import { createSupabaseClient } from '../db/supabase'
import type { Env } from '../worker-ultra'

const usersRoutes = new Hono<{ Bindings: Env }>()

// Update preferences schema
const preferencesSchema = z.object({
  mailing_list_opt_in: z.boolean(),
  mailing_preferences: z.object({
    newsletter: z.boolean(),
    product_updates: z.boolean(),
    community_digest: z.boolean(),
    promotional: z.boolean()
  })
})

// Update profile schema
const profileUpdateSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-z0-9_-]+$/).optional(),
  avatar_url: z.string().optional(),
  full_name: z.string().optional(),
  bio: z.string().optional()
})

// Update user preferences
usersRoutes.put('/preferences', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'No authorization token' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createSupabaseClient(c.env)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return c.json({ error: 'Invalid token' }, 401)
    }

    // Parse and validate request body
    const body = await c.req.json()
    const validatedData = preferencesSchema.parse(body)

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        mailing_list_opt_in: validatedData.mailing_list_opt_in,
        mailing_preferences: validatedData.mailing_preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    // Track consent change
    const action = validatedData.mailing_list_opt_in ? 'update_preferences' : 'opt_out'
    const consentText = validatedData.mailing_list_opt_in 
      ? `User updated email preferences: ${JSON.stringify(validatedData.mailing_preferences)}`
      : 'User opted out of all email communications'

    await supabase
      .from('mailing_list_consent')
      .insert({
        user_id: user.id,
        action,
        consent_text: consentText,
        ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
        user_agent: c.req.header('User-Agent')
      })

    // If opted out completely, record unsubscribe timestamp
    if (!validatedData.mailing_list_opt_in) {
      await supabase
        .from('profiles')
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq('id', user.id)
    }

    // Return updated user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return c.json({
      user: {
        ...user,
        profile
      }
    })

  } catch (error: any) {
    console.error('Preferences update error:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400)
    }
    return c.json({ error: 'Failed to update preferences' }, 500)
  }
})

// Check username availability
usersRoutes.get('/check-username', async (c) => {
  try {
    const username = c.req.query('username')
    
    if (!username || username.length < 3) {
      return c.json({ available: false, error: 'Username too short' }, 400)
    }

    const supabase = createSupabaseClient(c.env)
    
    // Check if username exists
    const { data: existing, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (error && error.code === 'PGRST116') {
      // No rows returned means username is available
      return c.json({ available: true })
    }

    if (existing) {
      return c.json({ available: false })
    }

    return c.json({ available: true })
  } catch (error: any) {
    console.error('Username check error:', error)
    return c.json({ error: 'Failed to check username' }, 500)
  }
})

// Update user profile
usersRoutes.put('/profile', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'No authorization token' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createSupabaseClient(c.env)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return c.json({ error: 'Invalid token' }, 401)
    }

    // Parse and validate request body
    const body = await c.req.json()
    const validatedData = profileUpdateSchema.parse(body)

    // If username is being updated, check if it's available
    if (validatedData.username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', validatedData.username)
        .neq('id', user.id)
        .single()

      if (existing) {
        return c.json({ error: 'Username already taken' }, 400)
      }
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    // Return updated profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return c.json({
      user: {
        ...user,
        profile
      }
    })

  } catch (error: any) {
    console.error('Profile update error:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400)
    }
    return c.json({ error: 'Failed to update profile' }, 500)
  }
})

// Get user profile
usersRoutes.get('/:id', async (c) => {
  try {
    const userId = c.req.param('id')
    const supabase = createSupabaseClient(c.env)

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        extensions:extensions(count),
        mcp_servers:mcp_servers(count)
      `)
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json({ profile })
  } catch (error: any) {
    console.error('Get user error:', error)
    return c.json({ error: 'Failed to get user' }, 500)
  }
})

export default usersRoutes