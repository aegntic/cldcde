import { Hono } from 'hono'
import { createSupabaseClient } from '../db/supabase'

const app = new Hono()

// Simple test API
app.get('/test', async (c) => {
  try {
    const env = {
      SUPABASE_URL: process.env.SUPABASE_URL!,
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY!
    }
    
    const supabase = createSupabaseClient(env)

    // Test database connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact' })
      .limit(1)

    if (error) throw error

    return c.json({
      success: true,
      message: 'CLDCDE+ Backend API is working!',
      database: 'connected',
      profiles_count: data?.length || 0,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error.message,
      message: 'Database connection failed'
    }, 500)
  }
})

// Get enhanced extensions (simple version)
app.get('/extensions', async (c) => {
  try {
    const env = {
      SUPABASE_URL: process.env.SUPABASE_URL!,
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY!
    }
    
    const supabase = createSupabaseClient(env)

    const { data, error } = await supabase
      .from('enhanced_extensions')
      .select(`
        id, name, slug, description, category, platform, version, 
        downloads, rating, rating_count, featured, verified, created_at,
        author:profiles!author_id(username, avatar_url)
      `)
      .eq('status', 'approved')
      .order('downloads', { ascending: false })
      .limit(20)

    if (error) throw error

    return c.json({
      success: true,
      data: data || [],
      total: data?.length || 0
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// Get enhanced news (simple version)
app.get('/news', async (c) => {
  try {
    const env = {
      SUPABASE_URL: process.env.SUPABASE_URL!,
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY!
    }
    
    const supabase = createSupabaseClient(env)

    const { data, error } = await supabase
      .from('enhanced_news')
      .select(`
        id, title, slug, excerpt, content, category, tags, featured,
        view_count, like_count, published_at, created_at,
        author:profiles!author_id(username, avatar_url)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20)

    if (error) throw error

    return c.json({
      success: true,
      data: data || [],
      total: data?.length || 0
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

export { app as testApiRoutes }