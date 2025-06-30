import { Hono } from 'hono'
import { z } from 'zod'
import { createSupabaseClient } from '../db/supabase'
import { SupabaseSearch } from '../search/supabase-search'
// Simplified - removed cache for now
import type { Env } from '../worker-ultra'

const searchRoutes = new Hono<{ Bindings: Env }>()

// Validation schemas
const searchSchema = z.object({
  query: z.string().min(1).max(100),
  type: z.enum(['all', 'extensions', 'mcp_servers', 'posts', 'news']).optional().default('all'),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
  filters: z.object({
    category: z.string().optional(),
    platform: z.array(z.string()).optional(),
    minRating: z.number().min(1).max(5).optional()
  }).optional()
})

// Initialize services
const getSearch = (env: Env) => {
  const supabase = createSupabaseClient(env)
  return new SupabaseSearch(supabase)
}

// Cache removed for simplicity

// Main search endpoint
searchRoutes.post('/', async (c) => {
  const body = await c.req.json()
  
  // Validate input
  const validation = searchSchema.safeParse(body)
  if (!validation.success) {
    return c.json({ error: validation.error.flatten() }, 400)
  }
  
  const { query, type, limit, offset, filters } = validation.data
  
  const search = getSearch(c.env)
  
  try {
    let result
    
    if (type === 'all') {
      result = await search.searchAll(query, limit)
    } else if (type === 'extensions') {
      result = await search.searchExtensions({ query, limit, offset, filters })
    } else if (type === 'mcp_servers') {
      result = await search.searchMCPServers({ query, limit, offset, filters })
    } else if (type === 'posts') {
      result = await search.searchPosts({ query, limit, offset })
    } else if (type === 'news') {
      result = await search.searchNews({ query, limit, offset })
    }
    
    // Cache removed for simplicity
    
    return c.json(result)
  } catch (error: any) {
    console.error('Search error:', error)
    return c.json({ error: 'Search failed', message: error.message }, 500)
  }
})

// Autocomplete endpoint
searchRoutes.get('/suggestions', async (c) => {
  const { q, type = 'extensions' } = c.req.query()
  
  if (!q || q.length < 2) {
    return c.json({ suggestions: [] })
  }
  
  // Cache removed for simplicity
  
  const search = getSearch(c.env)
  
  try {
    const suggestions = await search.getSuggestions(q, type as any)
    
    // Cache for 30 minutes
    // Cache removed
    
    return c.json({ suggestions })
  } catch (error: any) {
    console.error('Suggestions error:', error)
    return c.json({ suggestions: [] })
  }
})

// Popular searches endpoint
searchRoutes.get('/popular', async (c) => {
  // Cache removed for simplicity
  
  const search = getSearch(c.env)
  
  try {
    const searches = await search.getPopularSearches()
    
    // Cache for 1 hour
    // Cache removed
    
    return c.json({ searches })
  } catch (error: any) {
    console.error('Popular searches error:', error)
    return c.json({ searches: [] })
  }
})

// Facets endpoint for filter options
searchRoutes.get('/facets/:type', async (c) => {
  const type = c.req.param('type') as 'extensions' | 'mcp_servers'
  
  if (!['extensions', 'mcp_servers'].includes(type)) {
    return c.json({ error: 'Invalid type' }, 400)
  }
  
  // Cache removed for simplicity
  
  const search = getSearch(c.env)
  
  try {
    const facets = await search.getFacets(type)
    
    // Cache for 1 hour
    // Cache removed
    
    return c.json(facets)
  } catch (error: any) {
    console.error('Facets error:', error)
    return c.json({ error: 'Failed to get facets' }, 500)
  }
})

// Search analytics endpoint (tracks what people search for)
searchRoutes.post('/analytics', async (c) => {
  const { query, type, resultCount } = await c.req.json()
  
  // In a real implementation, you'd store this in a table
  // For now, just log it
  console.log('Search analytics:', { query, type, resultCount, timestamp: new Date() })
  
  return c.json({ success: true })
})

export default searchRoutes