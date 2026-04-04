import { Hono } from 'hono'
import { z } from 'zod'
import { createSupabaseClient } from '../db/supabase'
import type { Env } from '../worker-ultra'

const analyticsRoutes = new Hono<{ Bindings: Env }>()

// Download tracking schema
const downloadSchema = z.object({
  resource_id: z.string().uuid(),
  resource_type: z.enum(['extension', 'mcp_server']),
  consent_given: z.boolean(),
  github_connected: z.boolean().optional()
})

// Track download attempt
analyticsRoutes.post('/download', async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = downloadSchema.parse(body)
    
    const supabase = createSupabaseClient(c.env)
    
    // Get user if authenticated
    let userId = null
    const authHeader = c.req.header('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id || null
    }
    
    // Log the download attempt
    const { error } = await supabase
      .from('download_logs')
      .insert({
        user_id: userId,
        resource_id: validatedData.resource_id,
        resource_type: validatedData.resource_type,
        download_target: '', // Will be filled by GitHub OAuth flow
        consent_given: validatedData.consent_given,
        ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
        user_agent: c.req.header('User-Agent')
      })
    
    if (error) {
      console.error('Download log error:', error)
    }
    
    return c.json({ success: true })
    
  } catch (error: any) {
    console.error('Analytics error:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400)
    }
    return c.json({ error: 'Failed to track download' }, 500)
  }
})

// Get download stats for a resource
analyticsRoutes.get('/downloads/:type/:id', async (c) => {
  try {
    const resourceType = c.req.param('type') as 'extension' | 'mcp_server'
    const resourceId = c.req.param('id')
    
    const supabase = createSupabaseClient(c.env)
    
    // Get download count and recent downloads
    const [countResult, recentResult] = await Promise.all([
      supabase
        .from('download_logs')
        .select('id', { count: 'exact' })
        .eq('resource_id', resourceId)
        .eq('resource_type', resourceType),
      
      supabase
        .from('download_logs')
        .select('created_at, user_github')
        .eq('resource_id', resourceId)
        .eq('resource_type', resourceType)
        .order('created_at', { ascending: false })
        .limit(10)
    ])
    
    // Get GitHub stars if available
    const table = resourceType === 'extension' ? 'extensions' : 'mcp_servers'
    const { data: resource } = await supabase
      .from(table)
      .select('github_stars, download_count')
      .eq('id', resourceId)
      .single()
    
    return c.json({
      total_downloads: countResult.count || 0,
      github_stars: resource?.github_stars || 0,
      recent_downloads: recentResult.data || [],
      download_count: resource?.download_count || 0
    })
    
  } catch (error: any) {
    console.error('Download stats error:', error)
    return c.json({ error: 'Failed to get download stats' }, 500)
  }
})

// Get user's download history
analyticsRoutes.get('/user/downloads', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'No authorization token' }, 401)
    }
    
    const token = authHeader.replace('Bearer ', '')
    const supabase = createSupabaseClient(c.env)
    
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401)
    }
    
    const { data: downloads, error } = await supabase
      .from('download_logs')
      .select(`
        id,
        resource_id,
        resource_type,
        download_target,
        github_actions,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) {
      throw error
    }
    
    return c.json({ downloads: downloads || [] })
    
  } catch (error: any) {
    console.error('User downloads error:', error)
    return c.json({ error: 'Failed to get download history' }, 500)
  }
})

export default analyticsRoutes