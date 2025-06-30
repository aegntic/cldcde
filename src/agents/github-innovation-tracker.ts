import { runQuery, runTransaction } from '../db/neo4j.js'
import { z } from 'zod'

// GitHub API configuration
const GITHUB_API_BASE = 'https://api.github.com'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

// Innovation keywords and patterns
const INNOVATION_KEYWORDS = [
  'claude code',
  'claude mcp',
  'model context protocol',
  'claude cli',
  'claude api',
  'claude integration',
  'claude automation',
  'claude agent',
  'claude extension',
  'claude tool'
]

const ADVANCED_PATTERNS = [
  'multi-agent',
  'autonomous',
  'self-improving',
  'meta-programming',
  'code generation',
  'ai workflow',
  'llm orchestration',
  'prompt engineering',
  'tool chaining',
  'context management'
]

// Keywords that indicate tutorials/guides (to filter out)
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
  'fundamental'
]

// High-value contributors to monitor
const HIGH_VALUE_CONTRIBUTORS = [
  'anthropics',
  'ModelContextProtocol',
  'iamcatface',
  'danielmiessler',
  'simonw',
  'rasbt',
  'karpathy'
]

// Repository schema
const RepositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  owner: z.object({
    login: z.string(),
    type: z.string()
  }),
  description: z.string().nullable(),
  html_url: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  pushed_at: z.string(),
  stargazers_count: z.number(),
  watchers_count: z.number(),
  forks_count: z.number(),
  open_issues_count: z.number(),
  language: z.string().nullable(),
  topics: z.array(z.string()).optional(),
  license: z.any().nullable(),
  default_branch: z.string(),
  size: z.number()
})

// Innovation score calculation
interface InnovationMetrics {
  stars: number
  recentActivity: number
  codeComplexity: number
  uniqueApproach: number
  communityEngagement: number
  technicalDepth: number
  total: number
}

export class GitHubInnovationTracker {
  private headers: HeadersInit

  constructor() {
    this.headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Claude-Extensions-Innovation-Tracker'
    }
    
    if (GITHUB_TOKEN) {
      this.headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`
    }
  }

  // Search GitHub for innovative Claude projects
  async searchInnovativeProjects(page: number = 1): Promise<any[]> {
    const queries = this.buildSearchQueries()
    const allResults = []

    for (const query of queries) {
      try {
        const response = await fetch(
          `${GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=30&page=${page}`,
          { headers: this.headers }
        )

        if (!response.ok) {
          console.error(`GitHub API error: ${response.status}`)
          continue
        }

        const data = await response.json()
        allResults.push(...(data.items || []))
      } catch (error) {
        console.error('Error searching GitHub:', error)
      }
    }

    // Remove duplicates and filter
    const uniqueResults = this.deduplicateRepositories(allResults)
    return this.filterInnovativeProjects(uniqueResults)
  }

  // Build search queries for different innovation patterns
  private buildSearchQueries(): string[] {
    const queries = []

    // Primary Claude-related searches
    for (const keyword of INNOVATION_KEYWORDS) {
      queries.push(`${keyword} stars:>10 pushed:>2024-01-01`)
    }

    // Advanced pattern searches
    for (const pattern of ADVANCED_PATTERNS) {
      queries.push(`"claude" ${pattern} stars:>5 pushed:>2024-01-01`)
    }

    // High-value contributor searches
    for (const contributor of HIGH_VALUE_CONTRIBUTORS) {
      queries.push(`user:${contributor} claude OR mcp pushed:>2024-01-01`)
    }

    return queries
  }

  // Filter out tutorials and basic examples
  private filterInnovativeProjects(repositories: any[]): any[] {
    return repositories.filter(repo => {
      const description = (repo.description || '').toLowerCase()
      const name = repo.name.toLowerCase()
      const readme = repo.readme?.toLowerCase() || ''

      // Filter out tutorials and guides
      const isTutorial = TUTORIAL_INDICATORS.some(indicator => 
        description.includes(indicator) || 
        name.includes(indicator) ||
        readme.includes(indicator)
      )

      if (isTutorial) return false

      // Filter out very small repositories (likely examples)
      if (repo.size < 50) return false

      // Filter out repositories with no recent activity
      const lastPush = new Date(repo.pushed_at)
      const daysSinceUpdate = (Date.now() - lastPush.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceUpdate > 180) return false

      return true
    })
  }

  // Calculate innovation score for a repository
  async calculateInnovationScore(repo: any): Promise<InnovationMetrics> {
    const metrics: InnovationMetrics = {
      stars: 0,
      recentActivity: 0,
      codeComplexity: 0,
      uniqueApproach: 0,
      communityEngagement: 0,
      technicalDepth: 0,
      total: 0
    }

    // Stars score (logarithmic scale)
    metrics.stars = Math.min(Math.log10(repo.stargazers_count + 1) * 10, 25)

    // Recent activity score
    const lastPush = new Date(repo.pushed_at)
    const daysSinceUpdate = (Date.now() - lastPush.getTime()) / (1000 * 60 * 60 * 24)
    metrics.recentActivity = Math.max(25 - daysSinceUpdate / 4, 0)

    // Code complexity (based on size and language diversity)
    const sizeScore = Math.min(repo.size / 1000, 10)
    const languageScore = await this.getLanguageDiversityScore(repo)
    metrics.codeComplexity = sizeScore + languageScore

    // Unique approach detection
    metrics.uniqueApproach = await this.detectUniqueApproach(repo)

    // Community engagement
    const engagementRatio = (repo.forks_count + repo.open_issues_count) / Math.max(repo.stargazers_count, 1)
    metrics.communityEngagement = Math.min(engagementRatio * 15, 15)

    // Technical depth (check for advanced features)
    metrics.technicalDepth = await this.assessTechnicalDepth(repo)

    // Calculate total score
    metrics.total = Object.values(metrics).reduce((sum, score) => sum + score, 0) - metrics.total

    return metrics
  }

  // Get language diversity score
  private async getLanguageDiversityScore(repo: any): Promise<number> {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${repo.full_name}/languages`,
        { headers: this.headers }
      )

      if (!response.ok) return 0

      const languages = await response.json()
      const languageCount = Object.keys(languages).length

      // More languages indicate more complex integration
      return Math.min(languageCount * 2, 10)
    } catch {
      return 0
    }
  }

  // Detect unique approaches in the repository
  private async detectUniqueApproach(repo: any): Promise<number> {
    let score = 0

    // Check repository topics for innovation indicators
    const topics = repo.topics || []
    const innovativeTopics = ['ai', 'llm', 'automation', 'agent', 'framework', 'tool', 'integration']
    
    for (const topic of topics) {
      if (innovativeTopics.includes(topic)) {
        score += 2
      }
    }

    // Check for advanced patterns in description
    const description = (repo.description || '').toLowerCase()
    for (const pattern of ADVANCED_PATTERNS) {
      if (description.includes(pattern)) {
        score += 3
      }
    }

    // Bonus for being from high-value contributors
    if (HIGH_VALUE_CONTRIBUTORS.includes(repo.owner.login)) {
      score += 5
    }

    return Math.min(score, 20)
  }

  // Assess technical depth of the repository
  private async assessTechnicalDepth(repo: any): Promise<number> {
    let score = 0

    try {
      // Check for advanced file patterns
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${repo.full_name}/contents`,
        { headers: this.headers }
      )

      if (response.ok) {
        const contents = await response.json()
        
        // Look for indicators of technical depth
        const advancedFiles = [
          'docker-compose', 'kubernetes', '.github/workflows',
          'tsconfig', 'webpack', 'rollup', 'vite',
          'test', 'spec', '__tests__', 'benchmark'
        ]

        for (const item of contents) {
          const name = item.name.toLowerCase()
          if (advancedFiles.some(pattern => name.includes(pattern))) {
            score += 2
          }
        }
      }
    } catch {
      // Ignore errors
    }

    return Math.min(score, 15)
  }

  // Monitor trending repositories
  async findTrendingRepositories(): Promise<any[]> {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const dateString = oneWeekAgo.toISOString().split('T')[0]

    const query = `(claude OR mcp) created:>${dateString} stars:>20 sort:stars`
    
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=20`,
        { headers: this.headers }
      )

      if (!response.ok) {
        console.error('Error fetching trending repos:', response.status)
        return []
      }

      const data = await response.json()
      return this.filterInnovativeProjects(data.items || [])
    } catch (error) {
      console.error('Error finding trending repositories:', error)
      return []
    }
  }

  // Store discovered projects in the database
  async storeInnovativeProject(repo: any, metrics: InnovationMetrics): Promise<void> {
    const query = `
      MERGE (p:Project {githubId: $githubId})
      SET p.name = $name,
          p.fullName = $fullName,
          p.description = $description,
          p.url = $url,
          p.owner = $owner,
          p.stars = $stars,
          p.language = $language,
          p.topics = $topics,
          p.innovationScore = $innovationScore,
          p.metrics = $metrics,
          p.lastUpdated = $lastUpdated,
          p.discoveredAt = COALESCE(p.discoveredAt, datetime()),
          p.updatedAt = datetime()
      RETURN p
    `

    await runQuery(query, {
      githubId: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      owner: repo.owner.login,
      stars: repo.stargazers_count,
      language: repo.language,
      topics: repo.topics || [],
      innovationScore: metrics.total,
      metrics: JSON.stringify(metrics),
      lastUpdated: repo.pushed_at
    })
  }

  // Get top innovative projects from database
  async getTopInnovativeProjects(limit: number = 20): Promise<any[]> {
    const query = `
      MATCH (p:Project)
      WHERE p.innovationScore > 40
      RETURN p
      ORDER BY p.innovationScore DESC, p.stars DESC
      LIMIT $limit
    `

    try {
      const result = await runQuery(query, { limit })
      return result.records.map(record => record.get('p').properties)
    } catch (error) {
      console.error('Error fetching top projects:', error)
      return []
    }
  }

  // Monitor specific contributors
  async monitorContributor(username: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/users/${username}/repos?type=all&sort=updated&per_page=50`,
        { headers: this.headers }
      )

      if (!response.ok) {
        console.error(`Error monitoring ${username}:`, response.status)
        return []
      }

      const repos = await response.json()
      
      // Filter for Claude/MCP related projects
      const relevantRepos = repos.filter((repo: any) => {
        const text = `${repo.name} ${repo.description || ''}`.toLowerCase()
        return INNOVATION_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))
      })

      return this.filterInnovativeProjects(relevantRepos)
    } catch (error) {
      console.error(`Error monitoring contributor ${username}:`, error)
      return []
    }
  }

  // Run full innovation scan
  async runInnovationScan(): Promise<void> {
    console.log('Starting GitHub innovation scan...')

    // Search for innovative projects
    const innovativeProjects = await this.searchInnovativeProjects()
    console.log(`Found ${innovativeProjects.length} potentially innovative projects`)

    // Calculate scores and store
    for (const repo of innovativeProjects) {
      try {
        const metrics = await this.calculateInnovationScore(repo)
        if (metrics.total > 40) { // Only store high-scoring projects
          await this.storeInnovativeProject(repo, metrics)
          console.log(`Stored innovative project: ${repo.full_name} (score: ${metrics.total})`)
        }
      } catch (error) {
        console.error(`Error processing ${repo.full_name}:`, error)
      }
    }

    // Find trending repositories
    const trendingRepos = await this.findTrendingRepositories()
    console.log(`Found ${trendingRepos.length} trending repositories`)

    for (const repo of trendingRepos) {
      try {
        const metrics = await this.calculateInnovationScore(repo)
        await this.storeInnovativeProject(repo, metrics)
      } catch (error) {
        console.error(`Error processing trending repo ${repo.full_name}:`, error)
      }
    }

    // Monitor high-value contributors
    for (const contributor of HIGH_VALUE_CONTRIBUTORS) {
      const repos = await this.monitorContributor(contributor)
      console.log(`Found ${repos.length} relevant repos from ${contributor}`)

      for (const repo of repos) {
        try {
          const metrics = await this.calculateInnovationScore(repo)
          await this.storeInnovativeProject(repo, metrics)
        } catch (error) {
          console.error(`Error processing ${contributor}'s repo:`, error)
        }
      }
    }

    console.log('Innovation scan completed')
  }

  // Remove duplicates from repository list
  private deduplicateRepositories(repositories: any[]): any[] {
    const seen = new Set<number>()
    return repositories.filter(repo => {
      if (seen.has(repo.id)) {
        return false
      }
      seen.add(repo.id)
      return true
    })
  }
}

// Export singleton instance
export const innovationTracker = new GitHubInnovationTracker()

// Run periodic scans if this module is run directly
if (import.meta.main) {
  // Run initial scan
  await innovationTracker.runInnovationScan()
  
  // Schedule periodic scans (every 6 hours)
  setInterval(async () => {
    await innovationTracker.runInnovationScan()
  }, 6 * 60 * 60 * 1000)
}