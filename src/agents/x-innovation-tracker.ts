import { runQuery, runTransaction } from '../db/neo4j.js'
import { z } from 'zod'

// X API v2 configuration
const X_API_BASE = 'https://api.twitter.com/2'
const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN

// Free tier limits (as of 2024)
const FREE_TIER_LIMITS = {
  monthlyReadLimit: 10000,  // 10,000 tweets per month read limit
  monthlyWriteLimit: 1500,  // 1,500 tweets per month write limit
  dailyReadLimit: 333,      // Approximately 10,000/30 days
  searchResultsPerQuery: 10, // Reduced from 100 to conserve quota
  maxQueriesPerScan: 5,     // Limit number of search queries per scan
  scanIntervalHours: 12,    // Run scans twice per day instead of every 2 hours
  cacheExpiryHours: 24      // Cache results for 24 hours
}

// Rate limit tracking
let rateLimitTracker = {
  monthlyReadsUsed: 0,
  dailyReadsUsed: 0,
  lastResetDate: new Date().toISOString().split('T')[0],
  lastMonthReset: new Date().getMonth()
}

// Innovation keywords and patterns for Claude Code
const INNOVATION_KEYWORDS = [
  'claude code',
  'claude cli',
  'claude mcp',
  'model context protocol',
  'claude api',
  'claude integration',
  'claude automation',
  'claude agent',
  'claude extension',
  'claude tool',
  'anthropic claude',
  '@anthropicAI claude'
]

const ADVANCED_PATTERNS = [
  'multi-agent claude',
  'autonomous claude',
  'self-improving claude',
  'meta-programming claude',
  'claude code generation',
  'claude workflow',
  'claude orchestration',
  'claude prompt engineering',
  'claude tool chaining',
  'claude context management',
  'claude function calling',
  'claude computer use'
]

// Keywords that indicate basic tutorials (to filter out)
const TUTORIAL_INDICATORS = [
  'tutorial',
  'guide',
  'getting started',
  'hello world',
  'beginner',
  'learn',
  'course',
  'example',
  'demo',
  'walkthrough',
  'introduction',
  'basics',
  'fundamental',
  'step by step',
  'how to'
]

// Promotional content indicators
const PROMOTIONAL_INDICATORS = [
  'buy now',
  'sale',
  'discount',
  'promo',
  'limited time',
  'sign up',
  'newsletter',
  'webinar',
  'free trial',
  'sponsored'
]

// Known Claude innovators and thought leaders
const CLAUDE_INNOVATORS = [
  'anthropicAI',
  'GoodSideAI',
  'sama',
  'drjimfan',
  'karpathy',
  'simonw',
  'danielmiessler',
  'rasbt',
  'amasad',
  'levelsio',
  'pieterlevels',
  'swyx',
  'jxnlco',
  'mckaywrigley',
  'yoheinakajima'
]

// Tweet schema for X API v2
const TweetSchema = z.object({
  id: z.string(),
  text: z.string(),
  created_at: z.string(),
  author_id: z.string(),
  conversation_id: z.string().optional(),
  public_metrics: z.object({
    retweet_count: z.number(),
    reply_count: z.number(),
    like_count: z.number(),
    quote_count: z.number(),
    bookmark_count: z.number().optional(),
    impression_count: z.number().optional()
  }),
  entities: z.object({
    urls: z.array(z.object({
      url: z.string(),
      expanded_url: z.string(),
      display_url: z.string()
    })).optional(),
    mentions: z.array(z.object({
      username: z.string()
    })).optional(),
    hashtags: z.array(z.object({
      tag: z.string()
    })).optional()
  }).optional(),
  attachments: z.object({
    media_keys: z.array(z.string()).optional()
  }).optional(),
  referenced_tweets: z.array(z.object({
    type: z.enum(['retweeted', 'quoted', 'replied_to']),
    id: z.string()
  })).optional()
})

// Innovation metrics for tweets
interface InnovationMetrics {
  engagement: number
  virality: number
  technicalDepth: number
  novelty: number
  authorCredibility: number
  mediaRichness: number
  threadDepth: number
  total: number
}

export class XInnovationTracker {
  private headers: HeadersInit
  private cache: Map<string, { data: any[], timestamp: number }> = new Map()

  constructor() {
    if (!X_BEARER_TOKEN) {
      console.warn('X_BEARER_TOKEN not set. X API functionality will be limited.')
    }

    this.headers = {
      'Authorization': `Bearer ${X_BEARER_TOKEN}`,
      'Content-Type': 'application/json'
    }

    // Load rate limit tracking from persistent storage if available
    this.loadRateLimitTracking()
  }

  // Check if we're within rate limits
  private checkRateLimits(requestedCount: number): boolean {
    this.resetRateLimitsIfNeeded()

    const remainingDaily = FREE_TIER_LIMITS.dailyReadLimit - rateLimitTracker.dailyReadsUsed
    const remainingMonthly = FREE_TIER_LIMITS.monthlyReadLimit - rateLimitTracker.monthlyReadsUsed

    if (remainingDaily < requestedCount || remainingMonthly < requestedCount) {
      console.log(`Rate limit check failed. Daily remaining: ${remainingDaily}, Monthly remaining: ${remainingMonthly}`)
      return false
    }

    return true
  }

  // Reset rate limits if needed
  private resetRateLimitsIfNeeded(): void {
    const today = new Date().toISOString().split('T')[0]
    const currentMonth = new Date().getMonth()

    // Reset daily limit
    if (rateLimitTracker.lastResetDate !== today) {
      rateLimitTracker.dailyReadsUsed = 0
      rateLimitTracker.lastResetDate = today
    }

    // Reset monthly limit
    if (rateLimitTracker.lastMonthReset !== currentMonth) {
      rateLimitTracker.monthlyReadsUsed = 0
      rateLimitTracker.lastMonthReset = currentMonth
    }
  }

  // Update rate limit tracking
  private updateRateLimitTracking(count: number): void {
    rateLimitTracker.dailyReadsUsed += count
    rateLimitTracker.monthlyReadsUsed += count
    this.saveRateLimitTracking()
  }

  // Save rate limit tracking to persistent storage
  private saveRateLimitTracking(): void {
    // In a real implementation, save to database or file
    // For now, just log the current state
    console.log('Rate limits updated:', {
      daily: `${rateLimitTracker.dailyReadsUsed}/${FREE_TIER_LIMITS.dailyReadLimit}`,
      monthly: `${rateLimitTracker.monthlyReadsUsed}/${FREE_TIER_LIMITS.monthlyReadLimit}`
    })
  }

  // Load rate limit tracking from persistent storage
  private loadRateLimitTracking(): void {
    // In a real implementation, load from database or file
    // For now, just use the in-memory values
  }

  // Cache results to reduce API calls
  private cacheResults(query: string, data: any): void {
    this.cache.set(query, {
      data: data.data || [],
      timestamp: Date.now()
    })
  }

  // Get cached results if available and not expired
  private getCachedResults(query: string): any[] | null {
    const cached = this.cache.get(query)
    if (!cached) return null

    const expiryTime = FREE_TIER_LIMITS.cacheExpiryHours * 60 * 60 * 1000
    if (Date.now() - cached.timestamp > expiryTime) {
      this.cache.delete(query)
      return null
    }

    console.log(`Using cached results for query: ${query}`)
    return cached.data
  }

  // Search X for innovative Claude Code content (optimized for free tier)
  async searchInnovativeContent(maxResults: number = FREE_TIER_LIMITS.searchResultsPerQuery): Promise<any[]> {
    const queries = this.buildSearchQueries()
    const allTweets = []

    for (const query of queries) {
      try {
        const tweets = await this.searchTweets(query, maxResults)
        allTweets.push(...tweets)
      } catch (error) {
        console.error('Error searching X:', error)
      }
    }

    // Remove duplicates and filter
    const uniqueTweets = this.deduplicateTweets(allTweets)
    return this.filterInnovativeContent(uniqueTweets)
  }

  // Build search queries for different innovation patterns (optimized for free tier)
  private buildSearchQueries(): string[] {
    const queries = []

    // Focus on high-impact searches only
    // Combine multiple keywords into single queries to reduce API calls
    const primaryKeywords = INNOVATION_KEYWORDS.slice(0, 3).join(' OR ')
    queries.push(`(${primaryKeywords}) -is:retweet min_faves:50 lang:en`)

    // One query for advanced patterns with high engagement
    const advancedKeywords = ADVANCED_PATTERNS.slice(0, 3).join(' OR ')
    queries.push(`(${advancedKeywords}) -is:retweet min_faves:100 lang:en`)

    // Focus on top 3 innovators only
    const topInnovators = CLAUDE_INNOVATORS.slice(0, 3).join(' OR from:')
    queries.push(`(from:${topInnovators}) (claude OR "claude code" OR mcp) -is:retweet min_faves:20`)

    // One high-value thread search
    queries.push(`"claude code" (breakthrough OR "game changer" OR innovative) -is:retweet min_faves:100 has:links`)

    // Limit to max queries per scan
    return queries.slice(0, FREE_TIER_LIMITS.maxQueriesPerScan)
  }

  // Search tweets using X API v2 (with rate limit checking)
  private async searchTweets(query: string, maxResults: number = FREE_TIER_LIMITS.searchResultsPerQuery): Promise<any[]> {
    // Check rate limits
    if (!this.checkRateLimits(maxResults)) {
      console.log('Rate limit reached, returning cached results if available')
      return this.getCachedResults(query) || []
    }
    const params = new URLSearchParams({
      query,
      max_results: Math.min(maxResults, FREE_TIER_LIMITS.searchResultsPerQuery).toString(),
      'tweet.fields': 'created_at,author_id,conversation_id,public_metrics,entities,attachments,referenced_tweets',
      'user.fields': 'username,verified,public_metrics',
      'media.fields': 'type,url,preview_image_url',
      expansions: 'author_id,attachments.media_keys,referenced_tweets.id'
    })

    try {
      const response = await fetch(
        `${X_API_BASE}/tweets/search/recent?${params}`,
        { headers: this.headers }
      )

      if (!response.ok) {
        console.error(`X API error: ${response.status}`)
        return []
      }

      const data = await response.json()
      
      // Update rate limit tracking
      const tweetCount = data.data?.length || 0
      this.updateRateLimitTracking(tweetCount)
      
      // Cache results
      this.cacheResults(query, data)
      
      return this.enrichTweetsWithUserData(data)
    } catch (error) {
      console.error('Error fetching tweets:', error)
      return []
    }
  }

  // Enrich tweets with user data from includes
  private enrichTweetsWithUserData(data: any): any[] {
    if (!data.data) return []

    const users = new Map()
    const media = new Map()

    // Build user lookup
    if (data.includes?.users) {
      data.includes.users.forEach((user: any) => {
        users.set(user.id, user)
      })
    }

    // Build media lookup
    if (data.includes?.media) {
      data.includes.media.forEach((m: any) => {
        media.set(m.media_key, m)
      })
    }

    // Enrich tweets
    return data.data.map((tweet: any) => ({
      ...tweet,
      author: users.get(tweet.author_id),
      media: tweet.attachments?.media_keys?.map((key: string) => media.get(key)).filter(Boolean)
    }))
  }

  // Filter out tutorials and promotional content
  private filterInnovativeContent(tweets: any[]): any[] {
    return tweets.filter(tweet => {
      const text = tweet.text.toLowerCase()

      // Filter out tutorials
      if (TUTORIAL_INDICATORS.some(indicator => text.includes(indicator))) {
        return false
      }

      // Filter out promotional content
      if (PROMOTIONAL_INDICATORS.some(indicator => text.includes(indicator))) {
        return false
      }

      // Filter out very short tweets (likely not technical)
      if (tweet.text.length < 100) {
        return false
      }

      // Require minimum engagement
      const metrics = tweet.public_metrics
      if (metrics.like_count < 5 && metrics.retweet_count < 2) {
        return false
      }

      return true
    })
  }

  // Calculate innovation score for a tweet
  async calculateInnovationScore(tweet: any): Promise<InnovationMetrics> {
    const metrics: InnovationMetrics = {
      engagement: 0,
      virality: 0,
      technicalDepth: 0,
      novelty: 0,
      authorCredibility: 0,
      mediaRichness: 0,
      threadDepth: 0,
      total: 0
    }

    // Engagement score
    const pm = tweet.public_metrics
    const engagementRate = (pm.like_count + pm.retweet_count * 2 + pm.reply_count * 1.5 + pm.quote_count * 3) / 
                          Math.max(pm.impression_count || 1000, 1000)
    metrics.engagement = Math.min(engagementRate * 100, 25)

    // Virality score
    const viralityScore = Math.log10(pm.retweet_count + pm.quote_count + 1) * 10
    metrics.virality = Math.min(viralityScore, 20)

    // Technical depth
    metrics.technicalDepth = this.assessTechnicalDepth(tweet)

    // Novelty score
    metrics.novelty = this.assessNovelty(tweet)

    // Author credibility
    if (tweet.author) {
      metrics.authorCredibility = this.assessAuthorCredibility(tweet.author)
    }

    // Media richness (code snippets, diagrams, etc.)
    metrics.mediaRichness = this.assessMediaRichness(tweet)

    // Thread depth - use reply count as proxy in free tier
    if (tweet.conversation_id === tweet.id && tweet.public_metrics.reply_count > 0) {
      // Estimate thread depth based on reply count
      const replyCount = tweet.public_metrics.reply_count
      if (replyCount > 20) metrics.threadDepth = 15
      else if (replyCount > 10) metrics.threadDepth = 10
      else if (replyCount > 5) metrics.threadDepth = 5
      else metrics.threadDepth = 2
    }

    // Calculate total
    metrics.total = Object.values(metrics).reduce((sum, score) => sum + score, 0) - metrics.total

    return metrics
  }

  // Assess technical depth of content
  private assessTechnicalDepth(tweet: any): number {
    let score = 0
    const text = tweet.text.toLowerCase()

    // Check for code indicators
    const codeIndicators = ['```', 'function', 'async', 'await', 'import', 'export', 'const', 'let', 'class']
    codeIndicators.forEach(indicator => {
      if (text.includes(indicator)) score += 2
    })

    // Check for technical terms
    const technicalTerms = ['api', 'sdk', 'integration', 'implementation', 'architecture', 'algorithm', 'optimization']
    technicalTerms.forEach(term => {
      if (text.includes(term)) score += 1.5
    })

    // Check for advanced patterns
    ADVANCED_PATTERNS.forEach(pattern => {
      if (text.includes(pattern.toLowerCase())) score += 3
    })

    // Bonus for links (likely documentation or code)
    if (tweet.entities?.urls?.length > 0) {
      score += tweet.entities.urls.length * 2
    }

    return Math.min(score, 20)
  }

  // Assess novelty of the approach
  private assessNovelty(tweet: any): number {
    let score = 0
    const text = tweet.text.toLowerCase()

    // Novel approach indicators
    const novelIndicators = [
      'breakthrough', 'discovered', 'invented', 'novel', 'unique',
      'first time', 'never before', 'game changer', 'revolutionary'
    ]

    novelIndicators.forEach(indicator => {
      if (text.includes(indicator)) score += 3
    })

    // Innovation keywords
    const innovationKeywords = [
      'hack', 'trick', 'tip', 'surprising', 'unexpected',
      'creative', 'innovative', 'clever', 'elegant'
    ]

    innovationKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 2
    })

    return Math.min(score, 15)
  }

  // Assess author credibility
  private assessAuthorCredibility(author: any): number {
    let score = 0

    // Known innovator
    if (CLAUDE_INNOVATORS.includes(author.username)) {
      score += 10
    }

    // Verification status
    if (author.verified) {
      score += 5
    }

    // Follower count (logarithmic scale)
    if (author.public_metrics?.followers_count) {
      score += Math.min(Math.log10(author.public_metrics.followers_count) * 2, 10)
    }

    return Math.min(score, 20)
  }

  // Assess media richness
  private assessMediaRichness(tweet: any): number {
    let score = 0

    // Check for media attachments
    if (tweet.media?.length > 0) {
      tweet.media.forEach((m: any) => {
        if (m.type === 'photo') score += 3  // Could be code screenshot
        if (m.type === 'video') score += 5  // Demo video
        if (m.type === 'animated_gif') score += 4  // Demo gif
      })
    }

    // Check for code blocks in text
    if (tweet.text.includes('```')) {
      score += 5
    }

    // Check for GitHub/Gist links
    if (tweet.entities?.urls?.some((url: any) => 
      url.expanded_url.includes('github.com') || 
      url.expanded_url.includes('gist.github.com'))) {
      score += 5
    }

    return Math.min(score, 15)
  }

  // Assess thread depth (optimized for free tier)
  private async assessThreadDepth(conversationId: string): Promise<number> {
    // Skip thread depth assessment in free tier to conserve API calls
    // Instead, use reply count from the original tweet as a proxy
    console.log('Thread depth assessment skipped (free tier optimization)')
    return 0
  }

  // Extract code snippets and media from tweets (no API calls)
  async extractInnovationContent(tweet: any): Promise<any> {
    const extracted = {
      code_snippets: [],
      links: [],
      media: [],
      key_insights: []
    }

    // Extract code blocks
    const codeBlockRegex = /```[\s\S]*?```/g
    const codeBlocks = tweet.text.match(codeBlockRegex)
    if (codeBlocks) {
      extracted.code_snippets = codeBlocks.map((block: string) => 
        block.replace(/```/g, '').trim()
      )
    }

    // Extract links
    if (tweet.entities?.urls) {
      extracted.links = tweet.entities.urls.map((url: any) => ({
        url: url.expanded_url,
        display: url.display_url
      }))
    }

    // Extract media
    if (tweet.media) {
      extracted.media = tweet.media.map((m: any) => ({
        type: m.type,
        url: m.url || m.preview_image_url
      }))
    }

    // Extract key insights (quoted text)
    const quotedRegex = /"([^"]+)"/g
    const quotes = [...tweet.text.matchAll(quotedRegex)]
    if (quotes.length > 0) {
      extracted.key_insights = quotes.map(q => q[1])
    }

    return extracted
  }

  // Monitor specific innovators (optimized for free tier)
  async monitorInnovator(username: string): Promise<any[]> {
    // Check if we have cached results first
    const cacheKey = `innovator:${username}`
    const cached = this.getCachedResults(cacheKey)
    if (cached) return cached
    try {
      // Get user ID first
      const userResponse = await fetch(
        `${X_API_BASE}/users/by/username/${username}`,
        { headers: this.headers }
      )

      if (!userResponse.ok) {
        console.error(`Error fetching user ${username}:`, userResponse.status)
        return []
      }

      const userData = await userResponse.json()
      const userId = userData.data?.id

      if (!userId) return []

      // Get user's recent tweets (limited for free tier)
      const params = new URLSearchParams({
        max_results: FREE_TIER_LIMITS.searchResultsPerQuery.toString(),
        'tweet.fields': 'created_at,author_id,conversation_id,public_metrics,entities,attachments',
        exclude: 'retweets,replies'
      })

      const tweetsResponse = await fetch(
        `${X_API_BASE}/users/${userId}/tweets?${params}`,
        { headers: this.headers }
      )

      if (!tweetsResponse.ok) {
        console.error(`Error fetching tweets for ${username}:`, tweetsResponse.status)
        return []
      }

      const tweetsData = await tweetsResponse.json()
      const tweets = tweetsData.data || []

      // Update rate limit tracking
      this.updateRateLimitTracking(tweets.length)
      
      // Cache results
      this.cacheResults(cacheKey, { data: tweets })
      
      // Filter for Claude-related content
      return tweets.filter((tweet: any) => {
        const text = tweet.text.toLowerCase()
        return INNOVATION_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))
      })
    } catch (error) {
      console.error(`Error monitoring ${username}:`, error)
      return []
    }
  }

  // Detect viral Claude threads (optimized for free tier)
  async detectViralThreads(minEngagement: number = 100): Promise<any[]> {
    // Increase minimum engagement to reduce results
    minEngagement = Math.max(minEngagement, 200)
    const query = `"claude code" OR "claude cli" has:images min_faves:${minEngagement} -is:retweet lang:en`
    
    try {
      const tweets = await this.searchTweets(query, FREE_TIER_LIMITS.searchResultsPerQuery)
      
      // Filter for thread starters
      const threads = tweets.filter(tweet => 
        tweet.conversation_id === tweet.id &&
        tweet.public_metrics.reply_count > 5
      )

      // Sort by engagement
      return threads.sort((a, b) => {
        const aEngagement = a.public_metrics.like_count + a.public_metrics.retweet_count * 2
        const bEngagement = b.public_metrics.like_count + b.public_metrics.retweet_count * 2
        return bEngagement - aEngagement
      })
    } catch (error) {
      console.error('Error detecting viral threads:', error)
      return []
    }
  }

  // Store innovative tweet in database
  async storeInnovativeTweet(tweet: any, metrics: InnovationMetrics, extractedContent: any): Promise<void> {
    const query = `
      MERGE (t:Tweet {tweetId: $tweetId})
      SET t.text = $text,
          t.authorId = $authorId,
          t.authorUsername = $authorUsername,
          t.createdAt = $createdAt,
          t.url = $url,
          t.metrics = $metrics,
          t.innovationScore = $innovationScore,
          t.extractedContent = $extractedContent,
          t.publicMetrics = $publicMetrics,
          t.discoveredAt = COALESCE(t.discoveredAt, datetime()),
          t.updatedAt = datetime()
      
      WITH t
      UNWIND $keywords AS keyword
      MERGE (k:Keyword {name: keyword})
      MERGE (t)-[:MENTIONS]->(k)
      
      RETURN t
    `

    // Extract keywords from tweet
    const keywords = INNOVATION_KEYWORDS.filter(keyword => 
      tweet.text.toLowerCase().includes(keyword.toLowerCase())
    )

    await runQuery(query, {
      tweetId: tweet.id,
      text: tweet.text,
      authorId: tweet.author_id,
      authorUsername: tweet.author?.username || 'unknown',
      createdAt: tweet.created_at,
      url: `https://twitter.com/${tweet.author?.username || 'i'}/status/${tweet.id}`,
      metrics: JSON.stringify(metrics),
      innovationScore: metrics.total,
      extractedContent: JSON.stringify(extractedContent),
      publicMetrics: JSON.stringify(tweet.public_metrics),
      keywords
    })
  }

  // Get top innovative tweets from database
  async getTopInnovativeTweets(limit: number = 20): Promise<any[]> {
    const query = `
      MATCH (t:Tweet)
      WHERE t.innovationScore > 50
      RETURN t
      ORDER BY t.innovationScore DESC, t.createdAt DESC
      LIMIT $limit
    `

    try {
      const result = await runQuery(query, { limit })
      return result.records.map(record => {
        const props = record.get('t').properties
        return {
          ...props,
          metrics: JSON.parse(props.metrics || '{}'),
          extractedContent: JSON.parse(props.extractedContent || '{}'),
          publicMetrics: JSON.parse(props.publicMetrics || '{}')
        }
      })
    } catch (error) {
      console.error('Error fetching top tweets:', error)
      return []
    }
  }

  // Run full innovation scan (optimized for free tier)
  async runInnovationScan(): Promise<void> {
    console.log('Starting X innovation scan (Free Tier Mode)...')
    console.log(`Current rate limits - Daily: ${rateLimitTracker.dailyReadsUsed}/${FREE_TIER_LIMITS.dailyReadLimit}, Monthly: ${rateLimitTracker.monthlyReadsUsed}/${FREE_TIER_LIMITS.monthlyReadLimit}`)

    // Check if we have enough quota
    if (!this.checkRateLimits(50)) {
      console.log('Insufficient rate limit quota. Skipping scan.')
      return
    }

    // Search for innovative content with reduced scope
    const innovativeTweets = await this.searchInnovativeContent()
    console.log(`Found ${innovativeTweets.length} potentially innovative tweets`)

    // Process and store high-value tweets
    for (const tweet of innovativeTweets) {
      try {
        const metrics = await this.calculateInnovationScore(tweet)
        
        if (metrics.total > 50) { // Only store high-scoring content
          const extractedContent = await this.extractInnovationContent(tweet)
          await this.storeInnovativeTweet(tweet, metrics, extractedContent)
          console.log(`Stored innovative tweet: ${tweet.id} (score: ${metrics.total})`)
        }
      } catch (error) {
        console.error(`Error processing tweet ${tweet.id}:`, error)
      }
    }

    // Detect viral threads
    const viralThreads = await this.detectViralThreads(50)
    console.log(`Found ${viralThreads.length} viral threads`)

    for (const thread of viralThreads) {
      try {
        const metrics = await this.calculateInnovationScore(thread)
        const extractedContent = await this.extractInnovationContent(thread)
        await this.storeInnovativeTweet(thread, metrics, extractedContent)
      } catch (error) {
        console.error(`Error processing viral thread ${thread.id}:`, error)
      }
    }

    // Monitor known innovators (reduced for free tier)
    for (const innovator of CLAUDE_INNOVATORS.slice(0, 3)) { // Only top 3 to conserve quota
      const tweets = await this.monitorInnovator(innovator)
      console.log(`Found ${tweets.length} relevant tweets from @${innovator}`)

      for (const tweet of tweets) {
        try {
          // Enrich tweet with author data
          tweet.author = { username: innovator }
          
          const metrics = await this.calculateInnovationScore(tweet)
          if (metrics.total > 40) { // Lower threshold for known innovators
            const extractedContent = await this.extractInnovationContent(tweet)
            await this.storeInnovativeTweet(tweet, metrics, extractedContent)
          }
        } catch (error) {
          console.error(`Error processing tweet from ${innovator}:`, error)
        }
      }
    }

    console.log('X innovation scan completed')
  }

  // Remove duplicate tweets
  private deduplicateTweets(tweets: any[]): any[] {
    const seen = new Set<string>()
    return tweets.filter(tweet => {
      if (seen.has(tweet.id)) {
        return false
      }
      seen.add(tweet.id)
      return true
    })
  }

  // Get current rate limit status
  getRateLimitStatus(): {
    daily: { used: number, limit: number, remaining: number },
    monthly: { used: number, limit: number, remaining: number }
  } {
    this.resetRateLimitsIfNeeded()
    
    return {
      daily: {
        used: rateLimitTracker.dailyReadsUsed,
        limit: FREE_TIER_LIMITS.dailyReadLimit,
        remaining: FREE_TIER_LIMITS.dailyReadLimit - rateLimitTracker.dailyReadsUsed
      },
      monthly: {
        used: rateLimitTracker.monthlyReadsUsed,
        limit: FREE_TIER_LIMITS.monthlyReadLimit,
        remaining: FREE_TIER_LIMITS.monthlyReadLimit - rateLimitTracker.monthlyReadsUsed
      }
    }
  }

  // Get trending Claude topics
  async getTrendingTopics(): Promise<any[]> {
    const query = `
      MATCH (k:Keyword)<-[:MENTIONS]-(t:Tweet)
      WHERE t.createdAt > datetime() - duration('P7D')
      WITH k, COUNT(t) as mentions, AVG(toFloat(t.innovationScore)) as avgScore
      WHERE mentions > 5
      RETURN k.name as topic, mentions, avgScore
      ORDER BY mentions DESC, avgScore DESC
      LIMIT 10
    `

    try {
      const result = await runQuery(query, {})
      return result.records.map(record => ({
        topic: record.get('topic'),
        mentions: record.get('mentions'),
        avgScore: record.get('avgScore')
      }))
    } catch (error) {
      console.error('Error fetching trending topics:', error)
      return []
    }
  }
}

// Export singleton instance
export const xInnovationTracker = new XInnovationTracker()

// Export free tier configuration for documentation
export { FREE_TIER_LIMITS }

// Run periodic scans if this module is run directly
if (import.meta.main) {
  console.log('X Innovation Tracker - Free Tier Mode')
  console.log(`Configured for: ${FREE_TIER_LIMITS.monthlyReadLimit} reads/month, ${FREE_TIER_LIMITS.dailyReadLimit} reads/day`)
  
  // Run initial scan
  await xInnovationTracker.runInnovationScan()
  
  // Schedule periodic scans (reduced frequency for free tier)
  setInterval(async () => {
    await xInnovationTracker.runInnovationScan()
  }, FREE_TIER_LIMITS.scanIntervalHours * 60 * 60 * 1000)
  
  console.log(`Next scan scheduled in ${FREE_TIER_LIMITS.scanIntervalHours} hours`)
}