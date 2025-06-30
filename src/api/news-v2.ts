import { Hono } from 'hono'
import { z } from 'zod'
import { createSupabaseClient } from '../db/supabase'
import type { Env } from '../worker-ultra'

const newsRoutes = new Hono<{ Bindings: Env }>()

// Validation schemas
const createNewsSchema = z.object({
  input_type: z.enum(['link', 'repo', 'text', 'update']),
  input_content: z.string().min(1),
  input_metadata: z.object({}).optional()
})

// AI prompt for expanding content to blog post
const generateBlogPrompt = (type: string, content: string, metadata: any) => {
  return `
Create a compelling 2-5 minute read blog post (400-800 words) based on this ${type}:

Input: ${content}
${metadata ? `Additional context: ${JSON.stringify(metadata)}` : ''}

Requirements:
1. Engaging title that captures attention
2. Brief summary (1-2 sentences)
3. Well-structured content with sections
4. Mention how this relates to Claude extensions/MCP servers if applicable
5. Include calls-to-action to explore related resources on cldcde.cc
6. Professional but conversational tone
7. Add relevant tags

Format the response as JSON with: title, summary, content (markdown), tags (array)
`
}

// Create news/update (admin only for now)
newsRoutes.post('/create', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const body = await c.req.json()
    const validatedData = createNewsSchema.parse(body)
    
    const supabase = createSupabaseClient(c.env)
    
    // Get current user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401)
    }

    // Generate blog content using AI (you'd integrate with your AI service)
    // For now, we'll create a template
    const blogContent = await generateBlogContent(
      validatedData.input_type,
      validatedData.input_content,
      validatedData.input_metadata
    )

    // Create slug from title
    const slug = blogContent.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Insert news item
    const { data: news, error } = await supabase
      .from('news_updates')
      .insert({
        input_type: validatedData.input_type,
        input_content: validatedData.input_content,
        input_metadata: validatedData.input_metadata || {},
        title: blogContent.title,
        slug,
        summary: blogContent.summary,
        content: blogContent.content,
        content_html: convertMarkdownToHtml(blogContent.content),
        reading_time: Math.ceil(blogContent.content.split(' ').length / 200),
        tags: blogContent.tags,
        author_id: user.id,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Generate screenshots if needed
    if (validatedData.input_type === 'link' || validatedData.input_type === 'repo') {
      // Queue screenshot generation (async)
      queueScreenshotGeneration(news.id, validatedData.input_content)
    }

    return c.json({ 
      message: 'News created successfully',
      news 
    })

  } catch (error: any) {
    console.error('Create news error:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400)
    }
    return c.json({ error: 'Failed to create news' }, 500)
  }
})

// Get news list
newsRoutes.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '10')
    const offset = (page - 1) * limit
    
    const supabase = createSupabaseClient(c.env)
    
    const { data: news, error, count } = await supabase
      .from('news_updates')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return c.json({
      news: news || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error: any) {
    console.error('Get news error:', error)
    return c.json({ error: 'Failed to get news' }, 500)
  }
})

// Get single news item
newsRoutes.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug')
    const supabase = createSupabaseClient(c.env)
    
    const { data: news, error } = await supabase
      .from('news_updates')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error || !news) {
      return c.json({ error: 'News not found' }, 404)
    }

    // Increment view count
    supabase.rpc('increment_news_views', { p_news_id: news.id })

    // Get related content
    const relatedContent = await getRelatedContent(supabase, news)

    return c.json({
      news,
      related: relatedContent
    })

  } catch (error: any) {
    console.error('Get news item error:', error)
    return c.json({ error: 'Failed to get news' }, 500)
  }
})

// Publish news (admin)
newsRoutes.post('/:id/publish', async (c) => {
  try {
    const newsId = c.req.param('id')
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const supabase = createSupabaseClient(c.env)
    
    const { error } = await supabase
      .from('news_updates')
      .update({
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', newsId)

    if (error) {
      throw error
    }

    return c.json({ message: 'News published successfully' })

  } catch (error: any) {
    console.error('Publish news error:', error)
    return c.json({ error: 'Failed to publish news' }, 500)
  }
})

// Helper functions
async function generateBlogContent(type: string, content: string, metadata: any) {
  // In production, this would call your AI service
  // For now, return a template based on input type
  
  const templates: Record<string, any> = {
    link: {
      title: `Check Out This Amazing Resource: ${extractDomain(content)}`,
      summary: `We discovered an incredible resource that every Claude developer should know about.`,
      content: `We're excited to share this fantastic resource with the community!\n\n## What We Found\n\n${content}\n\n## Why It Matters\n\nThis resource provides valuable tools and insights for Claude developers...\n\n## How to Use It\n\n1. Visit the link\n2. Explore the features\n3. Integrate with your Claude workflow\n\n## Related Resources on cldcde.cc\n\n- Check out similar extensions in our catalog\n- Browse MCP servers that complement this\n- Join the discussion in our community\n\n## Get Started\n\nDon't miss out on this opportunity to enhance your Claude development experience!`,
      tags: ['resource', 'tools', 'community']
    },
    repo: {
      title: `New GitHub Repository: ${extractRepoName(content)}`,
      summary: `Explore this new repository that's making waves in the Claude ecosystem.`,
      content: `A new repository has caught our attention!\n\n## Repository Overview\n\n${content}\n\n## Key Features\n\n- Feature 1\n- Feature 2\n- Feature 3\n\n## Getting Started\n\n\`\`\`bash\ngit clone ${content}\n\`\`\`\n\n## Integration with Claude\n\nThis repository works great with Claude extensions...\n\n## Find More on cldcde.cc\n\n- Similar repositories in our catalog\n- Compatible extensions\n- Community discussions`,
      tags: ['github', 'repository', 'open-source']
    },
    update: {
      title: content.slice(0, 60) + '...',
      summary: content.slice(0, 150) + '...',
      content: `## Platform Update\n\n${content}\n\n## What This Means for You\n\nThis update brings exciting new capabilities...\n\n## Explore More\n\nVisit cldcde.cc to see these changes in action!`,
      tags: ['update', 'platform', 'announcement']
    },
    text: {
      title: content.slice(0, 60) + '...',
      summary: content.slice(0, 150) + '...',
      content: content,
      tags: ['blog', 'thoughts', 'community']
    }
  }

  return templates[type] || templates.text
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname.replace('www.', '')
  } catch {
    return url
  }
}

function extractRepoName(url: string): string {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
  return match ? `${match[1]}/${match[2]}` : url
}

function convertMarkdownToHtml(markdown: string): string {
  // Simple markdown to HTML conversion
  // In production, use a proper markdown parser
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

async function queueScreenshotGeneration(newsId: string, url: string) {
  // In production, this would queue a job to generate screenshots
  console.log(`Queued screenshot generation for news ${newsId}: ${url}`)
}

async function getRelatedContent(supabase: any, news: any) {
  const related: any = {
    extensions: [],
    mcp_servers: [],
    news: []
  }

  // Get related extensions if any
  if (news.related_extensions?.length > 0) {
    const { data } = await supabase
      .from('extensions')
      .select('id, name, description, author')
      .in('id', news.related_extensions)
      .limit(3)
    
    related.extensions = data || []
  }

  // Get related MCP servers if any
  if (news.related_mcp_servers?.length > 0) {
    const { data } = await supabase
      .from('mcp_servers')
      .select('id, name, description, author')
      .in('id', news.related_mcp_servers)
      .limit(3)
    
    related.mcp_servers = data || []
  }

  // Get related news by tags
  if (news.tags?.length > 0) {
    const { data } = await supabase
      .from('news_updates')
      .select('id, title, slug, summary, published_at')
      .eq('status', 'published')
      .neq('id', news.id)
      .contains('tags', news.tags)
      .order('published_at', { ascending: false })
      .limit(3)
    
    related.news = data || []
  }

  return related
}

export default newsRoutes