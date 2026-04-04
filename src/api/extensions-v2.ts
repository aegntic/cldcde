import { Hono } from 'hono'
import { z } from 'zod'
import { createSupabaseClient } from '../lib/supabase'
import type { Env } from '../worker-ultra'

const extensionRoutes = new Hono<{ Bindings: Env }>()

// Validation schemas
const createExtensionSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  category: z.enum(['Tools', 'Themes', 'Languages', 'Snippets', 'Productivity', 'Other']),
  platform: z.array(z.enum(['VSCode', 'JetBrains', 'Vim', 'Emacs', 'Other'])),
  version: z.string(),
  repository: z.string().url().optional(),
  homepage: z.string().url().optional(),
  tags: z.array(z.string()).max(10).optional()
})

// List extensions with filtering and pagination
extensionRoutes.get('/', async (c) => {
  const { category, search, limit = '20', offset = '0', sort = 'downloads' } = c.req.query()
  
  const supabase = createSupabaseClient(c.env)
  let query = supabase
      .from('extensions')
      .select(`
        *,
        author:profiles!author_id(id, username, avatar_url)
      `)

    if (category) {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.textSearch('name', search, {
        type: 'websearch',
        config: 'english'
      })
    }

    if (sort) {
      query = query.order(sort, { ascending: false })
    }

    query = query.limit(parseInt(limit))
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

  const { data, error, count } = await query
  
  if (error) {
    return c.json({ error: error.message }, 500)
  }
  
  const response = {
    extensions: data || [],
    total: count || 0,
    limit: parseInt(limit),
    offset: parseInt(offset)
  }
  
  return c.json(response)
})

// Get extension by ID
extensionRoutes.get('/:id', async (c) => {
  const { id } = c.req.param()
  
  const supabase = createSupabaseClient(c.env)
  const { data, error } = await supabase
      .from('extensions')
      .select(`
        *,
        author:profiles!author_id(id, username, avatar_url),
        reviews(rating, title, content, created_at, user:profiles!user_id(username, avatar_url))
      `)
      .eq('id', id)
      .single()
  
  if (error) {
    return c.json({ error: error.message }, 500)
  }
  
  if (!data) {
    return c.json({ error: 'Extension not found' }, 404)
  }
  
  return c.json(data)
})

// Create new extension (requires auth) - DISABLED FOR NOW
extensionRoutes.post('/', async (c) => {
  return c.json({ error: 'Creating extensions is temporarily disabled.' }, 403)
})

// Update extension (requires auth and ownership) - DISABLED FOR NOW
extensionRoutes.put('/:id', async (c) => {
  return c.json({ error: 'Updating extensions is temporarily disabled.' }, 403)
})

// Track download
extensionRoutes.post('/:id/download', async (c) => {
  const { id } = c.req.param()
  const supabase = createSupabaseClient(c.env)
  
  // Increment download counter
  const { error } = await supabase.rpc('increment_downloads', { extension_id: id })
  
  if (error) {
    return c.json({ error: error.message }, 500)
  }
  
  return c.json({ success: true })
})

// Get extension categories
extensionRoutes.get('/meta/categories', async (c) => {
  const categories = [
    { value: 'Tools', label: 'Developer Tools', count: 0 },
    { value: 'Themes', label: 'Themes & UI', count: 0 },
    { value: 'Languages', label: 'Language Support', count: 0 },
    { value: 'Snippets', label: 'Code Snippets', count: 0 },
    { value: 'Productivity', label: 'Productivity', count: 0 },
    { value: 'Other', label: 'Other', count: 0 }
  ]
  
  // Get counts from database
  const supabase = createSupabaseClient(c.env)
  for (const category of categories) {
    const { count } = await supabase
      .from('extensions')
      .select('*', { count: 'exact', head: true })
      .eq('category', category.value)
    
    category.count = count || 0
  }
  
  return c.json(categories)
})

// Get popular extensions
extensionRoutes.get('/meta/popular', async (c) => {
  const supabase = createSupabaseClient(c.env)
  const { data, error } = await supabase
    .from('popular_extensions')
    .select('*')
    .limit(10)
  
  if (error) {
    return c.json({ error: error.message }, 500)
  }
  
  return c.json(data)
})

// Get trending extensions
extensionRoutes.get('/meta/trending', async (c) => {
  const supabase = createSupabaseClient(c.env)
  const { data, error } = await supabase
    .from('trending_extensions')
    .select('*')
  
  if (error) {
    return c.json({ error: error.message }, 500)
  }
  
  return c.json(data)
})

export default extensionRoutes