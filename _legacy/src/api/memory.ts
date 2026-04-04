import { Hono } from 'hono'
import { z } from 'zod'
import { createSupabaseClient } from '../db/supabase'
import type { Env } from '../worker-ultra'

const memoryRoutes = new Hono<{ Bindings: Env }>()

// Record architecture evolution
const episodeSchema = z.object({
  type: z.enum(['architecture_change', 'feature_addition', 'resource_update', 'user_interaction']),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
  importance: z.number().min(1).max(5).optional()
})

// Record a new memory episode
memoryRoutes.post('/episodes', async (c) => {
  try {
    const body = await c.req.json()
    const validated = episodeSchema.parse(body)
    
    const supabase = createSupabaseClient(c.env)
    
    const { data, error } = await supabase
      .from('memory_episodes')
      .insert({
        episode_type: validated.type,
        content: validated.content,
        metadata: validated.metadata || {},
        importance: validated.importance || 1,
        occurred_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    return c.json({ success: true, episode: data })
  } catch (error: any) {
    console.error('Memory episode error:', error)
    return c.json({ error: 'Failed to record memory' }, 500)
  }
})

// Get platform evolution timeline
memoryRoutes.get('/timeline', async (c) => {
  try {
    const supabase = createSupabaseClient(c.env)
    const { from, to } = c.req.query()
    
    let query = supabase
      .from('memory_episodes')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(50)
    
    if (from) {
      query = query.gte('occurred_at', from)
    }
    if (to) {
      query = query.lte('occurred_at', to)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return c.json({
      timeline: data || [],
      count: data?.length || 0
    })
  } catch (error: any) {
    console.error('Timeline error:', error)
    return c.json({ error: 'Failed to fetch timeline' }, 500)
  }
})

// Get architecture insights
memoryRoutes.get('/insights', async (c) => {
  try {
    const supabase = createSupabaseClient(c.env)
    
    const { data, error } = await supabase
      .from('memory_insights')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) throw error
    
    // Also get the architecture change summary
    const { data: archChange } = await supabase
      .from('memory_episodes')
      .select('*')
      .eq('episode_type', 'architecture_change')
      .order('importance', { ascending: false })
      .limit(1)
      .single()
    
    return c.json({
      insights: data || [],
      architecture_evolution: archChange || null
    })
  } catch (error: any) {
    console.error('Insights error:', error)
    return c.json({ error: 'Failed to fetch insights' }, 500)
  }
})

// Simple helper to record when resources are added
export async function recordResourceAddition(
  supabase: any,
  resourceType: 'extension' | 'mcp',
  resource: any
) {
  await supabase.from('memory_episodes').insert({
    episode_type: 'resource_update',
    content: `New ${resourceType} added: ${resource.name}`,
    metadata: {
      resource_id: resource.id,
      resource_type: resourceType,
      name: resource.name,
      category: resource.category,
      featured: resource.featured
    },
    importance: resource.featured ? 3 : 1
  })
}

export default memoryRoutes