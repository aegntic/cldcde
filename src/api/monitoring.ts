import { Hono } from 'hono'
import { createSupabaseClient } from '../db/supabase'
import { createAnthropicMonitor } from '../agents/anthropic-monitor'

const monitoring = new Hono()

// Get recent Anthropic updates
monitoring.get('/anthropic/recent', async (c) => {
  try {
    const supabase = createSupabaseClient({
      SUPABASE_URL: c.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: c.env.SUPABASE_SERVICE_KEY
    })

    const { data, error } = await supabase
      .from('monitoring_content')
      .select('*')
      .eq('processed', true)
      .order('published_at', { ascending: false })
      .limit(20)

    if (error) throw error

    return c.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Error fetching recent updates:', error)
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// Get high-relevance updates
monitoring.get('/anthropic/important', async (c) => {
  try {
    const supabase = createSupabaseClient({
      SUPABASE_URL: c.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: c.env.SUPABASE_SERVICE_KEY
    })

    const { data, error } = await supabase
      .from('monitoring_content')
      .select('*')
      .gte('relevance_score', 0.7)
      .order('relevance_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(10)

    if (error) throw error

    return c.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Error fetching important updates:', error)
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// Search monitoring content
monitoring.get('/anthropic/search', async (c) => {
  const query = c.req.query('q')
  if (!query) {
    return c.json({ error: 'Search query required' }, 400)
  }

  try {
    const supabase = createSupabaseClient({
      SUPABASE_URL: c.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: c.env.SUPABASE_SERVICE_KEY
    })

    const { data, error } = await supabase
      .from('monitoring_content')
      .select('*')
      .textSearch('fts', query, {
        type: 'websearch',
        config: 'english'
      })
      .order('relevance_score', { ascending: false })
      .limit(20)

    if (error) throw error

    return c.json({
      success: true,
      query,
      results: data || []
    })
  } catch (error) {
    console.error('Error searching monitoring content:', error)
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// Get monitoring statistics
monitoring.get('/anthropic/stats', async (c) => {
  try {
    const supabase = createSupabaseClient({
      SUPABASE_URL: c.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: c.env.SUPABASE_SERVICE_KEY
    })

    // Get counts by source
    const { data: sourceCounts, error: sourceError } = await supabase
      .from('monitoring_content')
      .select('source')
      .select('source', { count: 'exact' })

    if (sourceError) throw sourceError

    // Get recent high-relevance count
    const { count: highRelevanceCount, error: relevanceError } = await supabase
      .from('monitoring_content')
      .select('*', { count: 'exact', head: true })
      .gte('relevance_score', 0.7)
      .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (relevanceError) throw relevanceError

    // Get blog generation stats
    const { data: blogStats, error: blogError } = await supabase
      .from('blog_generation_queue')
      .select('status')
      .select('status', { count: 'exact' })

    if (blogError) throw blogError

    return c.json({
      success: true,
      stats: {
        totalContent: sourceCounts?.length || 0,
        recentHighRelevance: highRelevanceCount || 0,
        sourceBreakdown: {
          blog: sourceCounts?.filter(s => s.source === 'blog').length || 0,
          github: sourceCounts?.filter(s => s.source === 'github').length || 0,
          twitter: sourceCounts?.filter(s => s.source === 'twitter').length || 0
        },
        blogGeneration: {
          pending: blogStats?.filter(s => s.status === 'pending').length || 0,
          completed: blogStats?.filter(s => s.status === 'completed').length || 0,
          failed: blogStats?.filter(s => s.status === 'failed').length || 0
        }
      }
    })
  } catch (error) {
    console.error('Error fetching monitoring stats:', error)
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// Admin endpoint to trigger manual monitoring
monitoring.post('/anthropic/trigger', async (c) => {
  // Require admin authentication
  const user = c.get('user')
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403)
  }

  try {
    const monitor = createAnthropicMonitor({
      SUPABASE_URL: c.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: c.env.SUPABASE_SERVICE_KEY,
      GITHUB_TOKEN: c.env.GITHUB_TOKEN,
      TWITTER_BEARER_TOKEN: c.env.TWITTER_BEARER_TOKEN
    })

    const results = await monitor.monitor()

    return c.json({
      success: true,
      message: 'Monitoring completed',
      totalItems: results.length,
      highRelevance: results.filter(r => r.relevance_score >= 0.7).length
    })
  } catch (error) {
    console.error('Error triggering monitoring:', error)
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

export default monitoring