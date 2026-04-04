import { Hono } from 'hono'
import { createD1Client } from '../db/d1'
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination'
import type { D1Database } from '@cloudflare/workers-types'

interface Env {
  DB: D1Database
  JWT_SECRET: string
}

interface NewsArticle {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  author_id: string
  published_at: string
  is_published: boolean
  featured_image: string | null
  tags: string[] | null
  views: number
  created_at: string
  updated_at: string
}

const newsApi = new Hono<{ Bindings: Env }>()

// Get all published news articles
newsApi.get('/', async (c) => {
  const db = createD1Client(c.env.DB)
  const { page, limit, offset } = getPaginationParams(c)
  const tag = c.req.query('tag')
  const author = c.req.query('author')

  try {
    let whereConditions = ['is_published = 1']
    const params: any[] = []

    if (tag) {
      whereConditions.push('tags LIKE ?')
      params.push(`%"${tag}"%`)
    }

    if (author) {
      whereConditions.push('author_id = ?')
      params.push(author)
    }

    const whereClause = whereConditions.join(' AND ')

    // Get total count
    const countResult = await db.rawFirst<{ count: number }>(`
      SELECT COUNT(*) as count
      FROM news
      WHERE ${whereClause}
    `, params)

    const total = countResult?.count || 0

    // Get articles
    params.push(limit, offset)
    const articles = await db.rawAll<NewsArticle>(`
      SELECT *
      FROM news
      WHERE ${whereClause}
      ORDER BY published_at DESC
      LIMIT ? OFFSET ?
    `, params)

    // Parse tags JSON
    const articlesWithParsedTags = articles.map(article => ({
      ...article,
      tags: article.tags ? JSON.parse(article.tags as any) : null
    }))

    return c.json(createPaginatedResponse(articlesWithParsedTags, page, limit, total))
  } catch (error) {
    console.error('Error fetching news:', error)
    return c.json({ error: 'Failed to fetch news' }, 500)
  }
})

// Get news article by slug
newsApi.get('/:slug', async (c) => {
  const db = createD1Client(c.env.DB)
  const slug = c.req.param('slug')

  try {
    // Increment view count and get article
    await db.raw('UPDATE news SET views = views + 1 WHERE slug = ? AND is_published = 1', [slug])

    const article = await db.query()
      .select()
      .from('news')
      .where('slug = ?', slug)
      .where('is_published = ?', 1)
      .first<NewsArticle>()

    if (!article) {
      return c.json({ error: 'Article not found' }, 404)
    }

    // Parse tags JSON
    const articleWithParsedTags = {
      ...article,
      tags: article.tags ? JSON.parse(article.tags as any) : null
    }

    return c.json(articleWithParsedTags)
  } catch (error) {
    console.error('Error fetching article:', error)
    return c.json({ error: 'Failed to fetch article' }, 500)
  }
})

// Create a new news article (admin only)
newsApi.post('/', async (c) => {
  const db = createD1Client(c.env.DB)
  const body = await c.req.json<{
    title: string
    slug: string
    content: string
    excerpt?: string
    author_id: string
    is_published?: boolean
    featured_image?: string
    tags?: string[]
  }>()

  // TODO: Add admin authentication check here

  try {
    const article = await db.insert<NewsArticle>(
      'news',
      {
        title: body.title,
        slug: body.slug,
        content: body.content,
        excerpt: body.excerpt || null,
        author_id: body.author_id,
        is_published: body.is_published ?? true,
        featured_image: body.featured_image || null,
        tags: body.tags ? JSON.stringify(body.tags) : null,
        views: 0,
        published_at: body.is_published ? new Date().toISOString() : null
      },
      ['id', 'title', 'slug', 'content', 'excerpt', 'author_id', 'published_at', 'is_published', 'featured_image', 'tags', 'views', 'created_at', 'updated_at']
    )

    if (!article) {
      throw new Error('Failed to create article')
    }

    // Parse tags JSON in response
    const articleWithParsedTags = {
      ...article,
      tags: article.tags ? JSON.parse(article.tags as any) : null
    }

    return c.json(articleWithParsedTags, 201)
  } catch (error) {
    console.error('Error creating article:', error)
    return c.json({ error: 'Failed to create article' }, 500)
  }
})

// Update news article (admin only)
newsApi.put('/:id', async (c) => {
  const db = createD1Client(c.env.DB)
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json<{
    title?: string
    content?: string
    excerpt?: string
    is_published?: boolean
    featured_image?: string
    tags?: string[]
  }>()

  // TODO: Add admin authentication check here

  try {
    const updateData: any = {}
    
    if (body.title !== undefined) updateData.title = body.title
    if (body.content !== undefined) updateData.content = body.content
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt
    if (body.featured_image !== undefined) updateData.featured_image = body.featured_image
    if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags)
    
    if (body.is_published !== undefined) {
      updateData.is_published = body.is_published
      if (body.is_published) {
        // Set published_at if publishing for the first time
        const current = await db.query()
          .select(['published_at'])
          .from('news')
          .where('id = ?', id)
          .first<{ published_at: string | null }>()
        
        if (current && !current.published_at) {
          updateData.published_at = new Date().toISOString()
        }
      }
    }

    await db.update('news', updateData, { id })

    const article = await db.query()
      .select()
      .from('news')
      .where('id = ?', id)
      .first<NewsArticle>()

    if (!article) {
      return c.json({ error: 'Article not found' }, 404)
    }

    // Parse tags JSON in response
    const articleWithParsedTags = {
      ...article,
      tags: article.tags ? JSON.parse(article.tags as any) : null
    }

    return c.json(articleWithParsedTags)
  } catch (error) {
    console.error('Error updating article:', error)
    return c.json({ error: 'Failed to update article' }, 500)
  }
})

// Delete news article (admin only)
newsApi.delete('/:id', async (c) => {
  const db = createD1Client(c.env.DB)
  const id = parseInt(c.req.param('id'))

  // TODO: Add admin authentication check here

  try {
    const result = await db.delete('news', { id })

    if (result.meta.changes === 0) {
      return c.json({ error: 'Article not found' }, 404)
    }

    return c.json({ message: 'Article deleted successfully' })
  } catch (error) {
    console.error('Error deleting article:', error)
    return c.json({ error: 'Failed to delete article' }, 500)
  }
})

// Get all articles (including drafts) for admin
newsApi.get('/admin/all', async (c) => {
  const db = createD1Client(c.env.DB)
  const { page, limit, offset } = getPaginationParams(c)

  // TODO: Add admin authentication check here

  try {
    // Get total count
    const total = await db.count('news')

    // Get all articles
    const articles = await db.query()
      .select()
      .from('news')
      .orderBy('created_at', 'DESC')
      .limit(limit)
      .offset(offset)
      .all<NewsArticle>()

    // Parse tags JSON
    const articlesWithParsedTags = articles.map(article => ({
      ...article,
      tags: article.tags ? JSON.parse(article.tags as any) : null
    }))

    return c.json(createPaginatedResponse(articlesWithParsedTags, page, limit, total))
  } catch (error) {
    console.error('Error fetching all articles:', error)
    return c.json({ error: 'Failed to fetch articles' }, 500)
  }
})

// Search news articles
newsApi.get('/search', async (c) => {
  const db = createD1Client(c.env.DB)
  const query = c.req.query('q')
  const { page, limit, offset } = getPaginationParams(c)

  if (!query) {
    return c.json({ error: 'Search query is required' }, 400)
  }

  try {
    const searchTerm = `%${query}%`

    // Get total count
    const countResult = await db.rawFirst<{ count: number }>(`
      SELECT COUNT(*) as count
      FROM news
      WHERE is_published = 1 
        AND (title LIKE ? OR content LIKE ? OR excerpt LIKE ?)
    `, [searchTerm, searchTerm, searchTerm])

    const total = countResult?.count || 0

    // Get articles
    const articles = await db.rawAll<NewsArticle>(`
      SELECT *
      FROM news
      WHERE is_published = 1 
        AND (title LIKE ? OR content LIKE ? OR excerpt LIKE ?)
      ORDER BY published_at DESC
      LIMIT ? OFFSET ?
    `, [searchTerm, searchTerm, searchTerm, limit, offset])

    // Parse tags JSON
    const articlesWithParsedTags = articles.map(article => ({
      ...article,
      tags: article.tags ? JSON.parse(article.tags as any) : null
    }))

    return c.json(createPaginatedResponse(articlesWithParsedTags, page, limit, total))
  } catch (error) {
    console.error('Error searching articles:', error)
    return c.json({ error: 'Failed to search articles' }, 500)
  }
})

// Get popular tags
newsApi.get('/tags/popular', async (c) => {
  const db = createD1Client(c.env.DB)
  const limitParam = c.req.query('limit')
  const limit = limitParam ? parseInt(limitParam) : 10

  try {
    // Since SQLite doesn't have native JSON functions, we'll need to handle this differently
    // Get all published articles with tags
    const articles = await db.rawAll<{ tags: string }>(`
      SELECT tags
      FROM news
      WHERE is_published = 1 AND tags IS NOT NULL
    `)

    // Count tags manually
    const tagCounts = new Map<string, number>()
    
    for (const article of articles) {
      if (article.tags) {
        const tags = JSON.parse(article.tags)
        for (const tag of tags) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
        }
      }
    }

    // Convert to array and sort by count
    const popularTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    return c.json(popularTags)
  } catch (error) {
    console.error('Error fetching popular tags:', error)
    return c.json({ error: 'Failed to fetch popular tags' }, 500)
  }
})

// Get related articles
newsApi.get('/:id/related', async (c) => {
  const db = createD1Client(c.env.DB)
  const id = parseInt(c.req.param('id'))
  const limitParam = c.req.query('limit')
  const limit = limitParam ? parseInt(limitParam) : 5

  try {
    // Get the current article
    const article = await db.query()
      .select(['tags', 'author_id'])
      .from('news')
      .where('id = ?', id)
      .first<{ tags: string | null; author_id: string }>()

    if (!article) {
      return c.json({ error: 'Article not found' }, 404)
    }

    let relatedArticles: NewsArticle[] = []

    // If article has tags, find articles with similar tags
    if (article.tags) {
      const tags = JSON.parse(article.tags)
      const tagConditions = tags.map(() => 'tags LIKE ?').join(' OR ')
      const tagParams = tags.map((tag: string) => `%"${tag}"%`)

      relatedArticles = await db.rawAll<NewsArticle>(`
        SELECT *
        FROM news
        WHERE id != ? 
          AND is_published = 1
          AND (${tagConditions})
        ORDER BY published_at DESC
        LIMIT ?
      `, [id, ...tagParams, limit])
    }

    // If not enough related articles found, add articles from same author
    if (relatedArticles.length < limit) {
      const remaining = limit - relatedArticles.length
      const authorArticles = await db.rawAll<NewsArticle>(`
        SELECT *
        FROM news
        WHERE id != ? 
          AND is_published = 1
          AND author_id = ?
          AND id NOT IN (${relatedArticles.map(() => '?').join(',') || '0'})
        ORDER BY published_at DESC
        LIMIT ?
      `, [id, article.author_id, ...relatedArticles.map(a => a.id), remaining])

      relatedArticles = [...relatedArticles, ...authorArticles]
    }

    // Parse tags JSON
    const articlesWithParsedTags = relatedArticles.map(article => ({
      ...article,
      tags: article.tags ? JSON.parse(article.tags as any) : null
    }))

    return c.json(articlesWithParsedTags)
  } catch (error) {
    console.error('Error fetching related articles:', error)
    return c.json({ error: 'Failed to fetch related articles' }, 500)
  }
})

export { newsApi }