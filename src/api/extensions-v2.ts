import { Hono } from 'hono'
import { z } from 'zod'
import { createSupabaseClient, db } from '../db/supabase'
import { CloudflareKVCache, CACHE_PREFIXES, CACHE_TTLS, generateCacheKey } from '../cache/cloudflare-kv'
import { authMiddleware, optionalAuthMiddleware } from '../auth/supabase-auth'
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

// Initialize cache
const getCache = (env: Env) => new CloudflareKVCache(env.CACHE)

// List extensions with filtering and pagination
extensionRoutes.get('/', optionalAuthMiddleware, async (c) => {
  const { category, search, limit = '20', offset = '0', sort = 'downloads' } = c.req.query()
  const cache = getCache(c.env)
  
  // Generate cache key
  const cacheKey = generateCacheKey(CACHE_PREFIXES.EXTENSIONS_LIST, {
    category,
    search,
    limit,
    offset,
    sort
  })
  
  // Try cache first
  const cached = await cache.get(cacheKey)
  if (cached) {
    return c.json(cached)
  }
  
  // Query database
  const supabase = createSupabaseClient(c.env)
  const { data, error, count } = await db.getExtensions(supabase, {
    category,
    search,
    limit: parseInt(limit),
    offset: parseInt(offset),
    orderBy: sort as any
  }).count()
  
  if (error) {
    return c.json({ error: error.message }, 500)
  }
  
  const response = {
    extensions: data || [],
    total: count || 0,
    limit: parseInt(limit),
    offset: parseInt(offset)
  }
  
  // Cache the response
  await cache.set(cacheKey, response, CACHE_TTLS.MEDIUM)
  
  return c.json(response)
})

// Get extension by ID
extensionRoutes.get('/:id', optionalAuthMiddleware, async (c) => {
  const { id } = c.req.param()
  const cache = getCache(c.env)
  
  // Try cache first
  const cacheKey = `${CACHE_PREFIXES.EXTENSIONS_DETAIL}:${id}`
  const cached = await cache.get(cacheKey)
  if (cached) {
    return c.json(cached)
  }
  
  // Query database
  const supabase = createSupabaseClient(c.env)
  const { data, error } = await db.getExtensionById(supabase, id)
  
  if (error) {
    return c.json({ error: error.message }, 500)
  }
  
  if (!data) {
    return c.json({ error: 'Extension not found' }, 404)
  }
  
  // Cache the response
  await cache.set(cacheKey, data, CACHE_TTLS.LONG)
  
  return c.json(data)
})

// Create new extension (requires auth)
extensionRoutes.post('/', authMiddleware, async (c) => {
  const user = c.get('user')
  const body = await c.req.json()
  
  // Validate input
  const validation = createExtensionSchema.safeParse(body)
  if (!validation.success) {
    return c.json({ error: validation.error.flatten() }, 400)
  }
  
  const supabase = createSupabaseClient(c.env)
  const cache = getCache(c.env)
  
  // Create extension
  const { data, error } = await db.createExtension(supabase, {
    ...validation.data,
    author_id: user.id,
    slug: validation.data.name.toLowerCase().replace(/\s+/g, '-'),
    tags: validation.data.tags || []
  })
  
  if (error) {
    return c.json({ error: error.message }, 500)
  }
  
  // Invalidate relevant caches
  await cache.deleteByPrefix(CACHE_PREFIXES.EXTENSIONS_LIST)
  await cache.deleteByPrefix(`${CACHE_PREFIXES.USER_EXTENSIONS}:${user.id}`)
  
  return c.json(data, 201)
})

// Update extension (requires auth and ownership)
extensionRoutes.put('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()
  const body = await c.req.json()
  
  const supabase = createSupabaseClient(c.env)
  const cache = getCache(c.env)
  
  // Check ownership
  const { data: extension } = await supabase
    .from('extensions')
    .select('author_id')
    .eq('id', id)
    .single()
  
  if (!extension || extension.author_id !== user.id) {
    return c.json({ error: 'Unauthorized' }, 403)
  }
  
  // Update extension
  const { data, error } = await supabase
    .from('extensions')
    .update(body)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return c.json({ error: error.message }, 500)
  }
  
  // Invalidate caches
  await cache.delete(`${CACHE_PREFIXES.EXTENSIONS_DETAIL}:${id}`)
  await cache.deleteByPrefix(CACHE_PREFIXES.EXTENSIONS_LIST)
  
  return c.json(data)
})

// Track download
extensionRoutes.post('/:id/download', async (c) => {
  const { id } = c.req.param()
  const supabase = createSupabaseClient(c.env)
  const cache = getCache(c.env)
  
  // Increment download counter
  const { error } = await db.updateExtensionDownloads(supabase, id)
  
  if (error) {
    return c.json({ error: error.message }, 500)
  }
  
  // Invalidate detail cache
  await cache.delete(`${CACHE_PREFIXES.EXTENSIONS_DETAIL}:${id}`)
  
  return c.json({ success: true })
})

// Get extension categories
extensionRoutes.get('/meta/categories', async (c) => {
  const cache = getCache(c.env)
  const cacheKey = `${CACHE_PREFIXES.CATEGORIES}:extensions`
  
  // Try cache first
  const cached = await cache.get(cacheKey)
  if (cached) {
    return c.json(cached)
  }
  
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
  
  // Cache for 1 hour
  await cache.set(cacheKey, categories, CACHE_TTLS.LONG)
  
  return c.json(categories)
})

// Get popular extensions
extensionRoutes.get('/meta/popular', async (c) => {
  const cache = getCache(c.env)
  const cacheKey = `${CACHE_PREFIXES.EXTENSIONS_LIST}:popular`
  
  // Try cache first
  const cached = await cache.get(cacheKey)
  if (cached) {
    return c.json(cached)
  }
  
  const supabase = createSupabaseClient(c.env)
  const { data, error } = await supabase
    .from('popular_extensions')
    .select('*')
    .limit(10)
  
  if (error) {
    return c.json({ error: error.message }, 500)
  }
  
  // Cache for 30 minutes
  await cache.set(cacheKey, data, CACHE_TTLS.MEDIUM)
  
  return c.json(data)
})

// Get trending extensions
extensionRoutes.get('/meta/trending', async (c) => {
  const cache = getCache(c.env)
  const cacheKey = `${CACHE_PREFIXES.EXTENSIONS_LIST}:trending`
  
  // Try cache first
  const cached = await cache.get(cacheKey)
  if (cached) {
    return c.json(cached)
  }
  
  const supabase = createSupabaseClient(c.env)
  const { data, error } = await supabase
    .from('trending_extensions')
    .select('*')
  
  if (error) {
    return c.json({ error: error.message }, 500)
  }
  
  // Cache for 15 minutes
  await cache.set(cacheKey, data, CACHE_TTLS.SHORT)
  
  return c.json(data)
})

export default extensionRoutes