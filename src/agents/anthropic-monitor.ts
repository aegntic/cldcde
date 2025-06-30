import { createSupabaseClient } from '../db/supabase'
import Parser from 'rss-parser'
import { Octokit } from '@octokit/rest'

// Types for monitoring data
interface MonitoringContent {
  id?: string
  source: 'blog' | 'github' | 'twitter'
  source_id: string // Unique ID from source (URL, tweet ID, etc)
  title: string
  content: string
  summary?: string
  url: string
  author?: string
  published_at: Date
  tags: string[]
  relevance_score: number
  metadata: Record<string, any>
  processed: boolean
  queued_for_blog: boolean
}

interface AnthropicRelease {
  tag_name: string
  name: string
  body: string
  published_at: string
  html_url: string
  author: {
    login: string
  }
}

export class AnthropicMonitor {
  private supabase: ReturnType<typeof createSupabaseClient>
  private rssParser: Parser
  private octokit: Octokit
  private twitterBearerToken?: string

  constructor(env: {
    SUPABASE_URL: string
    SUPABASE_SERVICE_KEY: string
    GITHUB_TOKEN?: string
    TWITTER_BEARER_TOKEN?: string
  }) {
    this.supabase = createSupabaseClient({
      SUPABASE_URL: env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY
    })
    
    this.rssParser = new Parser({
      customFields: {
        item: ['author', 'dc:creator', 'content:encoded']
      }
    })
    
    this.octokit = new Octokit({
      auth: env.GITHUB_TOKEN
    })
    
    this.twitterBearerToken = env.TWITTER_BEARER_TOKEN
  }

  /**
   * Main monitoring function that checks all sources
   */
  async monitor(): Promise<MonitoringContent[]> {
    const results: MonitoringContent[] = []
    
    try {
      // Monitor Anthropic blog
      const blogPosts = await this.monitorBlog()
      results.push(...blogPosts)
      
      // Monitor GitHub releases
      const githubReleases = await this.monitorGitHub()
      results.push(...githubReleases)
      
      // Monitor Twitter if token is available
      if (this.twitterBearerToken) {
        const tweets = await this.monitorTwitter()
        results.push(...tweets)
      }
      
      // Save all content to database
      await this.saveContent(results)
      
      // Filter and queue high-relevance content for auto-blogging
      const highRelevanceContent = results.filter(c => c.relevance_score >= 0.7)
      await this.queueForBlog(highRelevanceContent)
      
      return results
    } catch (error) {
      console.error('Error in Anthropic monitoring:', error)
      throw error
    }
  }

  /**
   * Monitor Anthropic blog RSS feed
   */
  private async monitorBlog(): Promise<MonitoringContent[]> {
    const results: MonitoringContent[] = []
    
    try {
      // Anthropic's blog RSS feed
      const feed = await this.rssParser.parseURL('https://www.anthropic.com/rss.xml')
      
      for (const item of feed.items) {
        if (!item.link || !item.title) continue
        
        // Check if we've already processed this
        const exists = await this.contentExists('blog', item.link)
        if (exists) continue
        
        // Extract Claude-related content
        const relevance = this.calculateRelevance(item.title + ' ' + (item.content || ''))
        
        if (relevance > 0.3) { // Lower threshold to catch more content
          const content: MonitoringContent = {
            source: 'blog',
            source_id: item.link,
            title: item.title,
            content: item.content || item.contentSnippet || '',
            summary: await this.generateSummary(item.content || item.contentSnippet || ''),
            url: item.link,
            author: item.creator || item.author || 'Anthropic',
            published_at: new Date(item.pubDate || item.isoDate || Date.now()),
            tags: this.extractTags(item.title + ' ' + (item.content || '')),
            relevance_score: relevance,
            metadata: {
              categories: item.categories || [],
              guid: item.guid
            },
            processed: false,
            queued_for_blog: false
          }
          
          results.push(content)
        }
      }
    } catch (error) {
      console.error('Error monitoring Anthropic blog:', error)
    }
    
    return results
  }

  /**
   * Monitor Anthropic GitHub repositories
   */
  private async monitorGitHub(): Promise<MonitoringContent[]> {
    const results: MonitoringContent[] = []
    
    try {
      // Monitor key Anthropic repositories
      const repos = [
        { owner: 'anthropics', repo: 'anthropic-sdk-python' },
        { owner: 'anthropics', repo: 'anthropic-sdk-typescript' },
        { owner: 'anthropics', repo: 'claude-artifacts' },
        { owner: 'anthropics', repo: 'courses' }
      ]
      
      for (const { owner, repo } of repos) {
        try {
          // Get latest releases
          const { data: releases } = await this.octokit.repos.listReleases({
            owner,
            repo,
            per_page: 5
          })
          
          for (const release of releases) {
            const exists = await this.contentExists('github', release.html_url)
            if (exists) continue
            
            const relevance = this.calculateRelevance(release.name + ' ' + release.body)
            
            if (relevance > 0.4) {
              const content: MonitoringContent = {
                source: 'github',
                source_id: release.html_url,
                title: `${repo}: ${release.name || release.tag_name}`,
                content: release.body || `New release ${release.tag_name}`,
                summary: await this.generateSummary(release.body || ''),
                url: release.html_url,
                author: release.author.login,
                published_at: new Date(release.published_at || Date.now()),
                tags: this.extractTags(release.name + ' ' + release.body),
                relevance_score: relevance,
                metadata: {
                  repo,
                  tag_name: release.tag_name,
                  prerelease: release.prerelease,
                  draft: release.draft
                },
                processed: false,
                queued_for_blog: false
              }
              
              results.push(content)
            }
          }
          
          // Also check recent commits for major updates
          const { data: commits } = await this.octokit.repos.listCommits({
            owner,
            repo,
            per_page: 10
          })
          
          for (const commit of commits) {
            const message = commit.commit.message
            
            // Look for significant commits
            if (this.isSignificantCommit(message)) {
              const exists = await this.contentExists('github', commit.html_url)
              if (exists) continue
              
              const content: MonitoringContent = {
                source: 'github',
                source_id: commit.html_url,
                title: `${repo}: ${message.split('\n')[0]}`,
                content: message,
                summary: message.split('\n')[0],
                url: commit.html_url,
                author: commit.author?.login || commit.commit.author.name,
                published_at: new Date(commit.commit.author.date),
                tags: this.extractTags(message),
                relevance_score: 0.5,
                metadata: {
                  repo,
                  sha: commit.sha,
                  commit_url: commit.url
                },
                processed: false,
                queued_for_blog: false
              }
              
              results.push(content)
            }
          }
        } catch (error) {
          console.error(`Error monitoring GitHub repo ${owner}/${repo}:`, error)
        }
      }
    } catch (error) {
      console.error('Error monitoring GitHub:', error)
    }
    
    return results
  }

  /**
   * Monitor Anthropic Twitter account
   */
  private async monitorTwitter(): Promise<MonitoringContent[]> {
    const results: MonitoringContent[] = []
    
    if (!this.twitterBearerToken) {
      console.log('Twitter monitoring skipped: No bearer token provided')
      return results
    }
    
    try {
      // Twitter API v2 endpoint
      const userId = '4323220033' // @AnthropicAI user ID
      const url = `https://api.twitter.com/2/users/${userId}/tweets`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.twitterBearerToken}`,
          'User-Agent': 'ClaudeExtensionsBot/1.0'
        },
        method: 'GET'
      })
      
      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      for (const tweet of data.data || []) {
        const exists = await this.contentExists('twitter', tweet.id)
        if (exists) continue
        
        const relevance = this.calculateRelevance(tweet.text)
        
        if (relevance > 0.3) {
          const content: MonitoringContent = {
            source: 'twitter',
            source_id: tweet.id,
            title: `Tweet: ${tweet.text.substring(0, 50)}...`,
            content: tweet.text,
            summary: tweet.text,
            url: `https://twitter.com/AnthropicAI/status/${tweet.id}`,
            author: '@AnthropicAI',
            published_at: new Date(tweet.created_at || Date.now()),
            tags: this.extractTags(tweet.text),
            relevance_score: relevance,
            metadata: {
              tweet_id: tweet.id,
              metrics: tweet.public_metrics
            },
            processed: false,
            queued_for_blog: false
          }
          
          results.push(content)
        }
      }
    } catch (error) {
      console.error('Error monitoring Twitter:', error)
    }
    
    return results
  }

  /**
   * Calculate relevance score based on keywords
   */
  private calculateRelevance(text: string): number {
    const lowerText = text.toLowerCase()
    
    // High relevance keywords
    const highRelevanceKeywords = [
      'claude', 'claude 3', 'claude 3.5', 'sonnet', 'opus', 'haiku',
      'new model', 'model release', 'api update', 'feature release',
      'extension', 'mcp', 'model context protocol', 'developer',
      'sdk update', 'capability', 'benchmark', 'performance'
    ]
    
    // Medium relevance keywords
    const mediumRelevanceKeywords = [
      'anthropic', 'ai safety', 'constitutional ai', 'update',
      'announcement', 'release', 'improvement', 'integration',
      'partnership', 'research', 'paper', 'study'
    ]
    
    let score = 0
    let matches = 0
    
    // Check high relevance keywords
    for (const keyword of highRelevanceKeywords) {
      if (lowerText.includes(keyword)) {
        score += 0.2
        matches++
      }
    }
    
    // Check medium relevance keywords
    for (const keyword of mediumRelevanceKeywords) {
      if (lowerText.includes(keyword)) {
        score += 0.1
        matches++
      }
    }
    
    // Bonus for multiple matches
    if (matches > 3) score += 0.1
    if (matches > 5) score += 0.1
    
    // Cap at 1.0
    return Math.min(score, 1.0)
  }

  /**
   * Extract relevant tags from content
   */
  private extractTags(text: string): string[] {
    const tags = new Set<string>()
    const lowerText = text.toLowerCase()
    
    const tagKeywords = [
      'claude', 'claude-3', 'claude-3.5', 'sonnet', 'opus', 'haiku',
      'api', 'sdk', 'python', 'typescript', 'javascript',
      'extension', 'mcp', 'model-context-protocol',
      'update', 'release', 'feature', 'improvement',
      'developer', 'integration', 'tool', 'library'
    ]
    
    for (const keyword of tagKeywords) {
      if (lowerText.includes(keyword)) {
        tags.add(keyword.replace('-', '_'))
      }
    }
    
    return Array.from(tags)
  }

  /**
   * Generate a summary of the content
   */
  private async generateSummary(content: string): Promise<string> {
    // For now, just extract first 200 characters
    // In production, this could use Claude API for better summaries
    const cleaned = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    return cleaned.substring(0, 200) + (cleaned.length > 200 ? '...' : '')
  }

  /**
   * Check if content already exists in database
   */
  private async contentExists(source: string, sourceId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('monitoring_content')
      .select('id')
      .eq('source', source)
      .eq('source_id', sourceId)
      .single()
    
    return !!data && !error
  }

  /**
   * Check if a commit message indicates a significant update
   */
  private isSignificantCommit(message: string): boolean {
    const significantPatterns = [
      /feat:/i, /feature:/i,
      /breaking:/i, /major:/i,
      /release:/i, /v\d+\.\d+/,
      /new.*model/i, /claude/i,
      /api.*update/i, /sdk.*update/i
    ]
    
    return significantPatterns.some(pattern => pattern.test(message))
  }

  /**
   * Save monitoring content to database
   */
  private async saveContent(contents: MonitoringContent[]): Promise<void> {
    if (contents.length === 0) return
    
    const { error } = await this.supabase
      .from('monitoring_content')
      .insert(contents)
    
    if (error) {
      console.error('Error saving monitoring content:', error)
      throw error
    }
  }

  /**
   * Queue high-relevance content for auto-blog generation
   */
  private async queueForBlog(contents: MonitoringContent[]): Promise<void> {
    if (contents.length === 0) return
    
    const contentIds = contents.map(c => c.source_id)
    
    const { error } = await this.supabase
      .from('monitoring_content')
      .update({ queued_for_blog: true })
      .in('source_id', contentIds)
    
    if (error) {
      console.error('Error queuing content for blog:', error)
      throw error
    }
  }

  /**
   * Get queued content for blog generation
   */
  async getQueuedContent(): Promise<MonitoringContent[]> {
    const { data, error } = await this.supabase
      .from('monitoring_content')
      .select('*')
      .eq('queued_for_blog', true)
      .eq('processed', false)
      .order('relevance_score', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('Error fetching queued content:', error)
      throw error
    }
    
    return data || []
  }

  /**
   * Mark content as processed
   */
  async markAsProcessed(contentIds: string[]): Promise<void> {
    const { error } = await this.supabase
      .from('monitoring_content')
      .update({ processed: true })
      .in('source_id', contentIds)
    
    if (error) {
      console.error('Error marking content as processed:', error)
      throw error
    }
  }
}

// Export a factory function for creating the monitor
export function createAnthropicMonitor(env: {
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
  GITHUB_TOKEN?: string
  TWITTER_BEARER_TOKEN?: string
}) {
  return new AnthropicMonitor(env)
}

// Example usage for scheduled monitoring
export async function runScheduledMonitoring(env: any) {
  const monitor = createAnthropicMonitor(env)
  
  try {
    console.log('Starting Anthropic monitoring...')
    const results = await monitor.monitor()
    console.log(`Found ${results.length} new items`)
    
    // Get high-relevance items
    const highRelevance = results.filter(r => r.relevance_score >= 0.7)
    console.log(`${highRelevance.length} items queued for blog generation`)
    
    return {
      success: true,
      totalItems: results.length,
      queuedItems: highRelevance.length
    }
  } catch (error) {
    console.error('Monitoring failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}