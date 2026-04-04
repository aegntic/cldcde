import { Hono } from 'hono'
import { createSupabaseClient } from '../db/supabase'
import type { Env } from '../worker-ultra'

const extensionRoutes = new Hono<{ Bindings: Env }>()

// List all extensions
extensionRoutes.get('/', async (c) => {
  try {
    const supabase = createSupabaseClient(c.env)
    
    const { data, error } = await supabase
      .from('extensions')
      .select('*')
      .order('featured', { ascending: false })
      .order('downloads', { ascending: false })
      .limit(20)
    
    if (error) {
      return c.json({ error: error.message }, 400)
    }
    
    return c.json({
      data: data || [],
      total: data?.length || 0
    })
  } catch (error: any) {
    console.error('Extensions error:', error)
    return c.json({ error: 'Failed to fetch extensions' }, 500)
  }
})

// Get single extension
extensionRoutes.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug')
    const supabase = createSupabaseClient(c.env)
    
    const { data, error } = await supabase
      .from('extensions')
      .select('*')
      .eq('slug', slug)
      .single()
    
    if (error) {
      return c.json({ error: 'Extension not found' }, 404)
    }
    
    return c.json(data)
  } catch (error: any) {
    console.error('Extension error:', error)
    return c.json({ error: 'Failed to fetch extension' }, 500)
  }
})

export default extensionRoutes