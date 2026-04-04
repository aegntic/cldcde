import { Hono } from 'hono'
import { createSupabaseClient } from '../db/supabase'
import { generateKVKey, kvCacheAside } from '../cache/cloudflare-kv'
import type { Env } from '../worker-ultra'

const featuredRoutes = new Hono<{ Bindings: Env }>()

// Get all featured content - simplified to 1 endpoint!
featuredRoutes.get('/', async (c) => {
  try {
    const cacheKey = generateKVKey('featured', { type: 'all' })
    
    const supabase = createSupabaseClient(c.env)
    
    // Parallel fetch all featured content
    const [
      extensionsResult,
      mcpResult,
      statsResult,
      memoryResult
    ] = await Promise.all([
      // Featured extensions
      supabase
        .from('extensions')
        .select('*')
        .eq('featured', true)
        .order('downloads', { ascending: false })
        .limit(6),
      
      // Featured MCP servers
      supabase
        .from('mcp_servers')
        .select('*')
        .eq('featured', true)
        .order('downloads', { ascending: false })
        .limit(3),
      
      // Platform stats
      Promise.all([
        supabase.from('extensions').select('id', { count: 'exact' }),
        supabase.from('mcp_servers').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' })
      ]),
      
      // Latest architecture insight
      supabase
        .from('memory_insights')
        .select('*')
        .eq('insight_type', 'achievement')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    ])
    
    const response = {
      featured_extensions: extensionsResult.data || [],
      featured_mcp: mcpResult.data || [],
      stats: {
        total_extensions: statsResult[0].count || 0,
        total_mcp: statsResult[1].count || 0,
        total_users: statsResult[2].count || 0,
        architecture: '2 services (down from 10+)'
      },
      latest_achievement: memoryResult.data?.title || 'Ultra-simple architecture achieved!',
      generated_at: new Date().toISOString()
    }
    
    return c.json(response)
  } catch (error: any) {
    console.error('Featured content error:', error)
    return c.json({ error: 'Failed to fetch featured content' }, 500)
  }
})

// Get specific type of featured content
featuredRoutes.get('/:type', async (c) => {
  try {
    const type = c.req.param('type') as 'trending' | 'new' | 'popular' | 'curated'
    const supabase = createSupabaseClient(c.env)
    
    let query
    switch (type) {
      case 'trending':
        // Items with recent activity
        query = supabase
          .from('extensions')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(10)
        break
        
      case 'new':
        // Recently added
        query = supabase
          .from('extensions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
        break
        
      case 'popular':
        // Most downloads
        query = supabase
          .from('extensions')
          .select('*')
          .order('downloads', { ascending: false })
          .limit(10)
        break
        
      case 'curated':
        // Featured items
        query = supabase
          .from('extensions')
          .select('*')
          .eq('featured', true)
          .limit(10)
        break
        
      default:
        return c.json({ error: 'Invalid type' }, 400)
    }
    
    const { data, error } = await query
    
    if (error) {
      throw error
    }
    
    return c.json({
      type,
      items: data || [],
      count: data?.length || 0
    })
    
  } catch (error: any) {
    console.error('Featured type error:', error)
    return c.json({ error: 'Failed to fetch content' }, 500)
  }
})

export default featuredRoutes