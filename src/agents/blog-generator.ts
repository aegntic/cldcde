import { createSupabaseClient } from '../db/supabase'
import { createAnthropicMonitor } from './anthropic-monitor'

interface BlogPost {
  title: string
  slug: string
  content: string
  excerpt: string
  category: string
  tags: string[]
  featured_image?: string
  metadata: {
    source_content_ids: string[]
    auto_generated: boolean
    generation_timestamp: string
  }
}

export class BlogGenerator {
  private supabase: ReturnType<typeof createSupabaseClient>
  private monitor: ReturnType<typeof createAnthropicMonitor>

  constructor(env: {
    SUPABASE_URL: string
    SUPABASE_SERVICE_KEY: string
  }) {
    this.supabase = createSupabaseClient({
      SUPABASE_URL: env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY
    })
    
    this.monitor = createAnthropicMonitor(env)
  }

  /**
   * Generate blog posts from queued monitoring content
   */
  async generateBlogPosts(): Promise<BlogPost[]> {
    const queuedContent = await this.monitor.getQueuedContent()
    
    if (queuedContent.length === 0) {
      console.log('No content queued for blog generation')
      return []
    }

    // Group related content
    const groupedContent = this.groupRelatedContent(queuedContent)
    const blogPosts: BlogPost[] = []

    for (const group of groupedContent) {
      try {
        const blogPost = await this.createBlogPost(group)
        await this.saveBlogPost(blogPost)
        blogPosts.push(blogPost)
        
        // Mark content as processed
        const contentIds = group.map(c => c.source_id)
        await this.monitor.markAsProcessed(contentIds)
      } catch (error) {
        console.error('Error generating blog post:', error)
      }
    }

    return blogPosts
  }

  /**
   * Group related content for consolidated blog posts
   */
  private groupRelatedContent(content: any[]): any[][] {
    const groups: any[][] = []
    const used = new Set<string>()

    for (const item of content) {
      if (used.has(item.source_id)) continue

      const group = [item]
      used.add(item.source_id)

      // Find related content
      for (const other of content) {
        if (used.has(other.source_id)) continue
        
        if (this.areRelated(item, other)) {
          group.push(other)
          used.add(other.source_id)
        }
      }

      groups.push(group)
    }

    return groups
  }

  /**
   * Check if two content items are related
   */
  private areRelated(a: any, b: any): boolean {
    // Same day posts
    const aDate = new Date(a.published_at).toDateString()
    const bDate = new Date(b.published_at).toDateString()
    if (aDate === bDate) return true

    // Common tags
    const commonTags = a.tags.filter((tag: string) => b.tags.includes(tag))
    if (commonTags.length >= 2) return true

    // Similar titles
    const aTitleWords = a.title.toLowerCase().split(/\s+/)
    const bTitleWords = b.title.toLowerCase().split(/\s+/)
    const commonWords = aTitleWords.filter((word: string) => 
      bTitleWords.includes(word) && word.length > 4
    )
    if (commonWords.length >= 2) return true

    return false
  }

  /**
   * Create a blog post from grouped content
   */
  private async createBlogPost(contentGroup: any[]): Promise<BlogPost> {
    const mainContent = contentGroup[0] // Use highest relevance as main
    const publishedDate = new Date(mainContent.published_at)
    
    // Generate title
    const title = this.generateTitle(contentGroup)
    
    // Generate slug
    const slug = this.generateSlug(title, publishedDate)
    
    // Generate content
    const content = this.generateContent(contentGroup)
    
    // Generate excerpt
    const excerpt = this.generateExcerpt(content)
    
    // Determine category
    const category = this.determineCategory(contentGroup)
    
    // Collect all tags
    const tags = this.collectTags(contentGroup)
    
    return {
      title,
      slug,
      content,
      excerpt,
      category,
      tags,
      metadata: {
        source_content_ids: contentGroup.map(c => c.source_id),
        auto_generated: true,
        generation_timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Generate a title for the blog post
   */
  private generateTitle(contentGroup: any[]): string {
    if (contentGroup.length === 1) {
      const content = contentGroup[0]
      
      // Clean up source-specific prefixes
      let title = content.title
        .replace(/^Tweet:\s*/i, '')
        .replace(/^.*?:\s*v?\d+\.\d+.*?[-–]\s*/i, '') // Remove version prefixes
        .trim()
      
      // Add context if needed
      if (content.source === 'github' && !title.toLowerCase().includes('release')) {
        title = `New Release: ${title}`
      }
      
      return title
    }
    
    // Multiple items - create a summary title
    const hasModelUpdate = contentGroup.some(c => 
      c.tags.includes('claude') && 
      (c.tags.includes('release') || c.tags.includes('update'))
    )
    
    if (hasModelUpdate) {
      return 'Claude Updates: New Features and Improvements'
    }
    
    const date = new Date(contentGroup[0].published_at)
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    
    return `Anthropic Updates - ${monthYear}`
  }

  /**
   * Generate a URL slug
   */
  private generateSlug(title: string, date: Date): string {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50)
    
    const dateStr = date.toISOString().split('T')[0]
    
    return `${dateStr}-${baseSlug}`
  }

  /**
   * Generate blog post content
   */
  private generateContent(contentGroup: any[]): string {
    let markdown = ''
    
    if (contentGroup.length === 1) {
      const content = contentGroup[0]
      
      // Single source content
      markdown += `*Originally posted on ${this.formatSource(content.source)} on ${new Date(content.published_at).toLocaleDateString()}*\n\n`
      
      if (content.summary && content.summary !== content.content) {
        markdown += `**Summary:** ${content.summary}\n\n`
      }
      
      markdown += content.content + '\n\n'
      
      if (content.url) {
        markdown += `[View original →](${content.url})\n\n`
      }
      
      // Add metadata section
      if (content.metadata && Object.keys(content.metadata).length > 0) {
        markdown += this.formatMetadata(content.metadata, content.source)
      }
    } else {
      // Multiple sources - create sections
      markdown += `We've gathered the latest updates from Anthropic across multiple channels. Here's what's new:\n\n`
      
      for (const content of contentGroup) {
        markdown += `## ${content.title}\n\n`
        markdown += `*via ${this.formatSource(content.source)} on ${new Date(content.published_at).toLocaleDateString()}*\n\n`
        
        if (content.summary && content.summary !== content.content) {
          markdown += content.summary + '\n\n'
        } else {
          markdown += content.content.substring(0, 500) + '...\n\n'
        }
        
        markdown += `[Read more →](${content.url})\n\n`
        markdown += '---\n\n'
      }
    }
    
    // Add footer
    markdown += this.generateFooter()
    
    return markdown
  }

  /**
   * Format source name for display
   */
  private formatSource(source: string): string {
    const sourceMap: Record<string, string> = {
      'blog': 'Anthropic Blog',
      'github': 'GitHub',
      'twitter': 'Twitter/X'
    }
    return sourceMap[source] || source
  }

  /**
   * Format metadata for display
   */
  private formatMetadata(metadata: any, source: string): string {
    let output = '\n### Additional Information\n\n'
    
    if (source === 'github') {
      if (metadata.repo) {
        output += `- **Repository:** ${metadata.repo}\n`
      }
      if (metadata.tag_name) {
        output += `- **Version:** ${metadata.tag_name}\n`
      }
      if (metadata.prerelease) {
        output += `- **Status:** Pre-release\n`
      }
    }
    
    if (source === 'twitter' && metadata.metrics) {
      const metrics = metadata.metrics
      if (metrics.like_count || metrics.retweet_count) {
        output += `- **Engagement:** ${metrics.like_count || 0} likes, ${metrics.retweet_count || 0} retweets\n`
      }
    }
    
    return output + '\n'
  }

  /**
   * Generate blog post footer
   */
  private generateFooter(): string {
    return `---

*This post was automatically generated from official Anthropic announcements. For the latest updates, follow [@AnthropicAI](https://twitter.com/AnthropicAI) and check the [Anthropic blog](https://www.anthropic.com/news).*`
  }

  /**
   * Generate excerpt from content
   */
  private generateExcerpt(content: string): string {
    // Remove markdown formatting
    const plain = content
      .replace(/[#*_`[\]()]/g, '')
      .replace(/\n+/g, ' ')
      .trim()
    
    // Extract first meaningful paragraph
    const sentences = plain.split(/[.!?]/).filter(s => s.trim().length > 20)
    const excerpt = sentences.slice(0, 2).join('. ').trim()
    
    return excerpt.substring(0, 160) + (excerpt.length > 160 ? '...' : '')
  }

  /**
   * Determine blog post category
   */
  private determineCategory(contentGroup: any[]): string {
    const allTags = contentGroup.flatMap(c => c.tags)
    
    if (allTags.includes('release') || allTags.includes('update')) {
      return 'Product Updates'
    }
    if (allTags.includes('sdk') || allTags.includes('api')) {
      return 'Developer Tools'
    }
    if (allTags.includes('research') || allTags.includes('paper')) {
      return 'Research'
    }
    if (allTags.includes('feature')) {
      return 'Features'
    }
    
    return 'News'
  }

  /**
   * Collect and deduplicate tags
   */
  private collectTags(contentGroup: any[]): string[] {
    const allTags = new Set<string>()
    
    for (const content of contentGroup) {
      content.tags.forEach((tag: string) => allTags.add(tag))
    }
    
    // Add auto-generated tag
    allTags.add('auto_generated')
    
    return Array.from(allTags).slice(0, 10) // Limit to 10 tags
  }

  /**
   * Save blog post to database
   */
  private async saveBlogPost(blogPost: BlogPost): Promise<void> {
    const { error } = await this.supabase
      .from('news')
      .insert({
        title: blogPost.title,
        slug: blogPost.slug,
        content: blogPost.content,
        excerpt: blogPost.excerpt,
        category: blogPost.category,
        tags: blogPost.tags,
        metadata: blogPost.metadata,
        is_published: true, // Auto-publish
        published_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Error saving blog post:', error)
      throw error
    }
  }
}

// Export factory function
export function createBlogGenerator(env: {
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
}) {
  return new BlogGenerator(env)
}

// Scheduled blog generation
export async function runScheduledBlogGeneration(env: any) {
  const generator = createBlogGenerator(env)
  
  try {
    console.log('Starting blog generation...')
    const posts = await generator.generateBlogPosts()
    console.log(`Generated ${posts.length} blog posts`)
    
    return {
      success: true,
      postsGenerated: posts.length,
      posts: posts.map(p => ({
        title: p.title,
        slug: p.slug,
        category: p.category
      }))
    }
  } catch (error) {
    console.error('Blog generation failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}