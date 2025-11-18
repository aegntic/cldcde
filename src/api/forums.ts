import { Hono } from 'hono'
import { createD1Client } from '../db/d1'
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination'
import type { D1Database } from '@cloudflare/workers-types'

interface Env {
  DB: D1Database
  JWT_SECRET: string
}

interface Forum {
  id: number
  title: string
  slug: string
  description: string | null
  category: string
  created_at: string
  updated_at: string
  post_count?: number
  comment_count?: number
  last_post_at?: string | null
}

interface Post {
  id: number
  forum_id: number
  user_id: string
  title: string
  content: string
  views: number
  is_pinned: boolean
  is_locked: boolean
  created_at: string
  updated_at: string
  comment_count?: number
  last_comment_at?: string | null
}

interface Comment {
  id: number
  post_id: number
  user_id: string
  content: string
  is_edited: boolean
  created_at: string
  updated_at: string
}

const forumsApi = new Hono<{ Bindings: Env }>()

// Get all forums with stats
forumsApi.get('/', async (c) => {
  const db = createD1Client(c.env.DB)
  const { page, limit, offset } = getPaginationParams(c)

  try {
    // Get total count
    const total = await db.count('forums')

    // Get forums with stats
    const forums = await db.rawAll<Forum>(`
      SELECT 
        f.*,
        COALESCE(fs.post_count, 0) as post_count,
        COALESCE(fs.comment_count, 0) as comment_count,
        fs.last_post_at
      FROM forums f
      LEFT JOIN forum_stats fs ON f.id = fs.forum_id
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset])

    return c.json(createPaginatedResponse(forums, page, limit, total))
  } catch (error) {
    console.error('Error fetching forums:', error)
    return c.json({ error: 'Failed to fetch forums' }, 500)
  }
})

// Get forum by slug
forumsApi.get('/:slug', async (c) => {
  const db = createD1Client(c.env.DB)
  const slug = c.req.param('slug')

  try {
    const forum = await db.rawFirst<Forum>(`
      SELECT 
        f.*,
        COALESCE(fs.post_count, 0) as post_count,
        COALESCE(fs.comment_count, 0) as comment_count,
        fs.last_post_at
      FROM forums f
      LEFT JOIN forum_stats fs ON f.id = fs.forum_id
      WHERE f.slug = ?
    `, [slug])

    if (!forum) {
      return c.json({ error: 'Forum not found' }, 404)
    }

    return c.json(forum)
  } catch (error) {
    console.error('Error fetching forum:', error)
    return c.json({ error: 'Failed to fetch forum' }, 500)
  }
})

// Create a new forum (admin only)
forumsApi.post('/', async (c) => {
  const db = createD1Client(c.env.DB)
  const body = await c.req.json<{
    title: string
    slug: string
    description?: string
    category: string
  }>()

  // TODO: Add admin authentication check here

  try {
    const forum = await db.insert<Forum>(
      'forums',
      {
        title: body.title,
        slug: body.slug,
        description: body.description || null,
        category: body.category
      },
      ['id', 'title', 'slug', 'description', 'category', 'created_at', 'updated_at']
    )

    if (!forum) {
      throw new Error('Failed to create forum')
    }

    // Initialize forum stats
    await db.insert('forum_stats', {
      forum_id: forum.id,
      post_count: 0,
      comment_count: 0,
      last_post_at: null
    })

    return c.json(forum, 201)
  } catch (error) {
    console.error('Error creating forum:', error)
    return c.json({ error: 'Failed to create forum' }, 500)
  }
})

// Update forum (admin only)
forumsApi.put('/:id', async (c) => {
  const db = createD1Client(c.env.DB)
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json<{
    title?: string
    description?: string
    category?: string
  }>()

  // TODO: Add admin authentication check here

  try {
    await db.update('forums', body, { id })

    const forum = await db.query()
      .select()
      .from('forums')
      .where('id = ?', id)
      .first<Forum>()

    if (!forum) {
      return c.json({ error: 'Forum not found' }, 404)
    }

    return c.json(forum)
  } catch (error) {
    console.error('Error updating forum:', error)
    return c.json({ error: 'Failed to update forum' }, 500)
  }
})

// Delete forum (admin only)
forumsApi.delete('/:id', async (c) => {
  const db = createD1Client(c.env.DB)
  const id = parseInt(c.req.param('id'))

  // TODO: Add admin authentication check here

  try {
    const result = await db.delete('forums', { id })

    if (result.meta.changes === 0) {
      return c.json({ error: 'Forum not found' }, 404)
    }

    return c.json({ message: 'Forum deleted successfully' })
  } catch (error) {
    console.error('Error deleting forum:', error)
    return c.json({ error: 'Failed to delete forum' }, 500)
  }
})

// Get posts in a forum
forumsApi.get('/:forumId/posts', async (c) => {
  const db = createD1Client(c.env.DB)
  const forumId = parseInt(c.req.param('forumId'))
  const { page, limit, offset } = getPaginationParams(c)

  try {
    // Get total count
    const total = await db.count('posts', { forum_id: forumId })

    // Get posts with comment stats
    const posts = await db.rawAll<Post>(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT MAX(created_at) FROM comments WHERE post_id = p.id) as last_comment_at
      FROM posts p
      WHERE p.forum_id = ?
      ORDER BY p.is_pinned DESC, p.created_at DESC
      LIMIT ? OFFSET ?
    `, [forumId, limit, offset])

    return c.json(createPaginatedResponse(posts, page, limit, total))
  } catch (error) {
    console.error('Error fetching posts:', error)
    return c.json({ error: 'Failed to fetch posts' }, 500)
  }
})

// Create a new post
forumsApi.post('/:forumId/posts', async (c) => {
  const db = createD1Client(c.env.DB)
  const forumId = parseInt(c.req.param('forumId'))
  const body = await c.req.json<{
    title: string
    content: string
    user_id: string // TODO: Get from auth
  }>()

  try {
    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Create post
      const post = await db.insert<Post>(
        'posts',
        {
          forum_id: forumId,
          user_id: body.user_id,
          title: body.title,
          content: body.content,
          views: 0,
          is_pinned: false,
          is_locked: false
        },
        ['id', 'forum_id', 'user_id', 'title', 'content', 'views', 'is_pinned', 'is_locked', 'created_at', 'updated_at']
      )

      if (!post) {
        throw new Error('Failed to create post')
      }

      // Update forum stats
      await db.raw(`
        UPDATE forum_stats 
        SET 
          post_count = post_count + 1,
          last_post_at = CURRENT_TIMESTAMP
        WHERE forum_id = ?
      `, [forumId])

      return post
    })

    return c.json(result, 201)
  } catch (error) {
    console.error('Error creating post:', error)
    return c.json({ error: 'Failed to create post' }, 500)
  }
})

// Get a single post with comments
forumsApi.get('/posts/:postId', async (c) => {
  const db = createD1Client(c.env.DB)
  const postId = parseInt(c.req.param('postId'))

  try {
    // Increment view count
    await db.raw('UPDATE posts SET views = views + 1 WHERE id = ?', [postId])

    // Get post with stats
    const post = await db.rawFirst<Post>(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT MAX(created_at) FROM comments WHERE post_id = p.id) as last_comment_at
      FROM posts p
      WHERE p.id = ?
    `, [postId])

    if (!post) {
      return c.json({ error: 'Post not found' }, 404)
    }

    // Get comments
    const comments = await db.query()
      .select()
      .from('comments')
      .where('post_id = ?', postId)
      .orderBy('created_at', 'ASC')
      .all<Comment>()

    return c.json({ post, comments })
  } catch (error) {
    console.error('Error fetching post:', error)
    return c.json({ error: 'Failed to fetch post' }, 500)
  }
})

// Add a comment to a post
forumsApi.post('/posts/:postId/comments', async (c) => {
  const db = createD1Client(c.env.DB)
  const postId = parseInt(c.req.param('postId'))
  const body = await c.req.json<{
    content: string
    user_id: string // TODO: Get from auth
  }>()

  try {
    // Check if post exists and is not locked
    const post = await db.query()
      .select(['id', 'is_locked', 'forum_id'])
      .from('posts')
      .where('id = ?', postId)
      .first<{ id: number; is_locked: boolean; forum_id: number }>()

    if (!post) {
      return c.json({ error: 'Post not found' }, 404)
    }

    if (post.is_locked) {
      return c.json({ error: 'Post is locked' }, 403)
    }

    // Start transaction
    const comment = await db.transaction(async (tx) => {
      // Create comment
      const newComment = await db.insert<Comment>(
        'comments',
        {
          post_id: postId,
          user_id: body.user_id,
          content: body.content,
          is_edited: false
        },
        ['id', 'post_id', 'user_id', 'content', 'is_edited', 'created_at', 'updated_at']
      )

      if (!newComment) {
        throw new Error('Failed to create comment')
      }

      // Update forum stats
      await db.raw(`
        UPDATE forum_stats 
        SET comment_count = comment_count + 1
        WHERE forum_id = ?
      `, [post.forum_id])

      return newComment
    })

    return c.json(comment, 201)
  } catch (error) {
    console.error('Error creating comment:', error)
    return c.json({ error: 'Failed to create comment' }, 500)
  }
})

// Update a comment
forumsApi.put('/comments/:commentId', async (c) => {
  const db = createD1Client(c.env.DB)
  const commentId = parseInt(c.req.param('commentId'))
  const body = await c.req.json<{
    content: string
    user_id: string // TODO: Get from auth
  }>()

  try {
    // Check if comment exists and belongs to user
    const comment = await db.query()
      .select(['id', 'user_id'])
      .from('comments')
      .where('id = ?', commentId)
      .first<{ id: number; user_id: string }>()

    if (!comment) {
      return c.json({ error: 'Comment not found' }, 404)
    }

    if (comment.user_id !== body.user_id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    // Update comment
    await db.update(
      'comments',
      { content: body.content, is_edited: true },
      { id: commentId }
    )

    const updatedComment = await db.query()
      .select()
      .from('comments')
      .where('id = ?', commentId)
      .first<Comment>()

    return c.json(updatedComment)
  } catch (error) {
    console.error('Error updating comment:', error)
    return c.json({ error: 'Failed to update comment' }, 500)
  }
})

// Delete a comment
forumsApi.delete('/comments/:commentId', async (c) => {
  const db = createD1Client(c.env.DB)
  const commentId = parseInt(c.req.param('commentId'))
  const userId = c.req.query('user_id') // TODO: Get from auth

  try {
    // Get comment with post info
    const comment = await db.rawFirst<{
      id: number
      user_id: string
      post_id: number
      forum_id: number
    }>(`
      SELECT c.id, c.user_id, c.post_id, p.forum_id
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      WHERE c.id = ?
    `, [commentId])

    if (!comment) {
      return c.json({ error: 'Comment not found' }, 404)
    }

    if (comment.user_id !== userId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    // Start transaction
    await db.transaction(async (tx) => {
      // Delete comment
      await db.delete('comments', { id: commentId })

      // Update forum stats
      await db.raw(`
        UPDATE forum_stats 
        SET comment_count = comment_count - 1
        WHERE forum_id = ?
      `, [comment.forum_id])
    })

    return c.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return c.json({ error: 'Failed to delete comment' }, 500)
  }
})

// Search posts
forumsApi.get('/search', async (c) => {
  const db = createD1Client(c.env.DB)
  const query = c.req.query('q')
  const forumId = c.req.query('forum_id')
  const { page, limit, offset } = getPaginationParams(c)

  if (!query) {
    return c.json({ error: 'Search query is required' }, 400)
  }

  try {
    let whereClause = '(p.title LIKE ? OR p.content LIKE ?)'
    const searchTerm = `%${query}%`
    const params: any[] = [searchTerm, searchTerm]

    if (forumId) {
      whereClause += ' AND p.forum_id = ?'
      params.push(parseInt(forumId))
    }

    // Get total count
    const countResult = await db.rawFirst<{ count: number }>(`
      SELECT COUNT(*) as count
      FROM posts p
      WHERE ${whereClause}
    `, params)

    const total = countResult?.count || 0

    // Get posts
    params.push(limit, offset)
    const posts = await db.rawAll<Post>(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT MAX(created_at) FROM comments WHERE post_id = p.id) as last_comment_at
      FROM posts p
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, params)

    return c.json(createPaginatedResponse(posts, page, limit, total))
  } catch (error) {
    console.error('Error searching posts:', error)
    return c.json({ error: 'Failed to search posts' }, 500)
  }
})

export { forumsApi }