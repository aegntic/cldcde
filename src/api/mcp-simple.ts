import { Hono } from 'hono'
import { createSupabaseClient } from '../db/supabase'
import type { Env } from '../worker-ultra'

const mcpRoutes = new Hono<{ Bindings: Env }>()

// List all MCP servers
mcpRoutes.get('/', async (c) => {
  try {
    const supabase = createSupabaseClient(c.env)
    
    const { data, error } = await supabase
      .from('mcp_servers')
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
    console.error('MCP servers error:', error)
    return c.json({ error: 'Failed to fetch MCP servers' }, 500)
  }
})

// Get single MCP server
mcpRoutes.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug')
    const supabase = createSupabaseClient(c.env)
    
    const { data, error } = await supabase
      .from('mcp_servers')
      .select('*')
      .eq('slug', slug)
      .single()
    
    if (error) {
      return c.json({ error: 'MCP server not found' }, 404)
    }
    
    return c.json(data)
  } catch (error: any) {
    console.error('MCP server error:', error)
    return c.json({ error: 'Failed to fetch MCP server' }, 500)
  }
})

export default mcpRoutes