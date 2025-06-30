import { z } from 'zod';
import { getDb } from '../db/neo4j';

// Configuration schema
const YouTubeConfigSchema = z.object({
  apiKey: z.string(),
  maxResults: z.number().default(50),
  qualityThreshold: z.object({
    minViews: z.number().default(1000),
    minLikeRatio: z.number().default(0.95),
    minDuration: z.number().default(300), // 5 minutes in seconds
    minChannelSubscribers: z.number().default(1000)
  })
});

// Video analysis schema
const VideoAnalysisSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  description: z.string(),
  channelId: z.string(),
  channelTitle: z.string(),
  publishedAt: z.string(),
  duration: z.string(),
  viewCount: z.number(),
  likeCount: z.number(),
  commentCount: z.number(),
  qualityScore: z.number(),
  innovationScore: z.number(),
  keyTimestamps: z.array(z.object({
    time: z.string(),
    description: z.string(),
    confidence: z.number()
  })),
  tags: z.array(z.string()),
  isInnovative: z.boolean(),
  summary: z.string().optional(),
  transcriptSnippets: z.array(z.object({
    text: z.string(),
    startTime: z.number(),
    relevanceScore: z.number()
  })).optional()
});

type YouTubeConfig = z.infer<typeof YouTubeConfigSchema>;
type VideoAnalysis = z.infer<typeof VideoAnalysisSchema>;

export class YouTubeDiscoverer {
  private config: YouTubeConfig;
  private apiBaseUrl = 'https://www.googleapis.com/youtube/v3';
  
  // Innovation keywords and patterns
  private innovationKeywords = [
    'advanced claude code', 'claude code automation', 'claude code integration',
    'custom claude agent', 'claude code workflow', 'claude code extension',
    'claude code api', 'claude code plugin', 'claude code hack',
    'claude code productivity', 'claude code enterprise', 'claude code devops',
    'claude code ci/cd', 'claude code architecture', 'claude code scaling',
    'claude code performance', 'claude code optimization', 'claude code security'
  ];
  
  // Exclusion patterns for basic tutorials
  private excludePatterns = [
    'getting started', 'beginner', 'tutorial', 'basics', 'introduction',
    'what is claude', 'claude vs', 'review', 'first look', 'setup guide',
    'installation', 'hello world', 'simple example', 'basic usage'
  ];
  
  // Channel authority list (known innovative creators)
  private trustedChannels = new Set([
    // Add known innovative Claude Code content creators here
  ]);

  constructor(config: YouTubeConfig) {
    this.config = YouTubeConfigSchema.parse(config);
  }

  /**
   * Search for innovative Claude Code videos
   */
  async discoverInnovativeVideos(): Promise<VideoAnalysis[]> {
    const searchQueries = this.generateAdvancedSearchQueries();
    const allVideos: VideoAnalysis[] = [];
    
    for (const query of searchQueries) {
      try {
        const videos = await this.searchVideos(query);
        const analyzed = await Promise.all(
          videos.map(video => this.analyzeVideo(video))
        );
        
        const innovative = analyzed.filter(v => v.isInnovative);
        allVideos.push(...innovative);
      } catch (error) {
        console.error(`Error searching with query "${query}":`, error);
      }
    }
    
    // Deduplicate and sort by quality score
    const uniqueVideos = this.deduplicateVideos(allVideos);
    uniqueVideos.sort((a, b) => b.qualityScore - a.qualityScore);
    
    // Store in database
    await this.storeDiscoveries(uniqueVideos);
    
    return uniqueVideos;
  }

  /**
   * Generate advanced search queries for finding innovative content
   */
  private generateAdvancedSearchQueries(): string[] {
    const queries = [
      // Direct innovation searches
      '"claude code" "advanced" -beginner -tutorial',
      '"claude code" "automation" "workflow"',
      '"claude code" "integration" API',
      '"claude code" "custom agent" development',
      '"claude code" "enterprise" "production"',
      
      // Technical implementation searches
      '"claude code" "architecture" "system design"',
      '"claude code" "performance" "optimization"',
      '"claude code" "scaling" "deployment"',
      '"claude code" "ci/cd" "pipeline"',
      
      // Use case specific searches
      '"claude code" "data analysis" "automation"',
      '"claude code" "code generation" "framework"',
      '"claude code" "testing" "automation"',
      '"claude code" "documentation" "generation"',
      
      // Integration searches
      '"claude code" "github" "integration"',
      '"claude code" "vscode" "extension"',
      '"claude code" "docker" "containerization"',
      '"claude code" "kubernetes" "deployment"'
    ];
    
    return queries;
  }

  /**
   * Search YouTube for videos matching the query
   */
  private async searchVideos(query: string): Promise<any[]> {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: this.config.maxResults.toString(),
      order: 'relevance',
      videoDuration: 'medium,long', // Exclude short videos
      key: this.config.apiKey
    });
    
    const response = await fetch(`${this.apiBaseUrl}/search?${params}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${data.error?.message || 'Unknown error'}`);
    }
    
    return data.items || [];
  }

  /**
   * Analyze a video for innovation and quality
   */
  private async analyzeVideo(videoItem: any): Promise<VideoAnalysis> {
    // Get detailed video statistics
    const details = await this.getVideoDetails(videoItem.id.videoId);
    
    // Calculate quality score
    const qualityScore = this.calculateQualityScore(details);
    
    // Calculate innovation score
    const innovationScore = this.calculateInnovationScore(videoItem, details);
    
    // Extract key timestamps (would require transcript API)
    const keyTimestamps = await this.extractKeyTimestamps(videoItem.id.videoId);
    
    // Determine if video is innovative
    const isInnovative = this.isVideoInnovative(
      videoItem,
      details,
      qualityScore,
      innovationScore
    );
    
    return {
      videoId: videoItem.id.videoId,
      title: videoItem.snippet.title,
      description: videoItem.snippet.description,
      channelId: videoItem.snippet.channelId,
      channelTitle: videoItem.snippet.channelTitle,
      publishedAt: videoItem.snippet.publishedAt,
      duration: details.contentDetails.duration,
      viewCount: parseInt(details.statistics.viewCount || '0'),
      likeCount: parseInt(details.statistics.likeCount || '0'),
      commentCount: parseInt(details.statistics.commentCount || '0'),
      qualityScore,
      innovationScore,
      keyTimestamps,
      tags: details.snippet.tags || [],
      isInnovative,
      summary: this.generateSummary(videoItem, details)
    };
  }

  /**
   * Get detailed video information
   */
  private async getVideoDetails(videoId: string): Promise<any> {
    const params = new URLSearchParams({
      part: 'contentDetails,statistics,snippet',
      id: videoId,
      key: this.config.apiKey
    });
    
    const response = await fetch(`${this.apiBaseUrl}/videos?${params}`);
    const data = await response.json();
    
    if (!response.ok || !data.items?.[0]) {
      throw new Error(`Failed to get video details for ${videoId}`);
    }
    
    return data.items[0];
  }

  /**
   * Calculate video quality score
   */
  private calculateQualityScore(details: any): number {
    const stats = details.statistics;
    const views = parseInt(stats.viewCount || '0');
    const likes = parseInt(stats.likeCount || '0');
    const comments = parseInt(stats.commentCount || '0');
    
    // Like ratio (handle division by zero)
    const likeRatio = views > 0 ? likes / views : 0;
    
    // Engagement rate
    const engagementRate = views > 0 ? (likes + comments) / views : 0;
    
    // Channel authority (would require channel API call)
    const channelScore = 0.5; // Placeholder
    
    // Calculate weighted score
    let score = 0;
    score += Math.min(likeRatio * 100, 30); // Max 30 points for like ratio
    score += Math.min(engagementRate * 200, 20); // Max 20 points for engagement
    score += Math.min(views / 10000, 30); // Max 30 points for views
    score += channelScore * 20; // Max 20 points for channel authority
    
    return Math.min(score, 100);
  }

  /**
   * Calculate innovation score based on content analysis
   */
  private calculateInnovationScore(videoItem: any, details: any): number {
    let score = 0;
    const title = videoItem.snippet.title.toLowerCase();
    const description = videoItem.snippet.description.toLowerCase();
    const tags = (details.snippet.tags || []).map((t: string) => t.toLowerCase());
    
    // Check for innovation keywords
    for (const keyword of this.innovationKeywords) {
      if (title.includes(keyword)) score += 10;
      if (description.includes(keyword)) score += 5;
      if (tags.some(tag => tag.includes(keyword))) score += 3;
    }
    
    // Penalize for exclusion patterns
    for (const pattern of this.excludePatterns) {
      if (title.includes(pattern)) score -= 15;
      if (description.includes(pattern)) score -= 10;
    }
    
    // Bonus for technical terms
    const technicalTerms = ['api', 'integration', 'automation', 'framework', 'architecture'];
    for (const term of technicalTerms) {
      if (title.includes(term) || description.includes(term)) score += 5;
    }
    
    // Bonus for trusted channels
    if (this.trustedChannels.has(videoItem.snippet.channelId)) {
      score += 20;
    }
    
    return Math.max(0, Math.min(score, 100));
  }

  /**
   * Extract key timestamps from video (placeholder - would need transcript API)
   */
  private async extractKeyTimestamps(videoId: string): Promise<any[]> {
    // This would require YouTube transcript API or additional service
    // For now, return empty array
    return [];
  }

  /**
   * Determine if video meets innovation criteria
   */
  private isVideoInnovative(
    videoItem: any,
    details: any,
    qualityScore: number,
    innovationScore: number
  ): boolean {
    // Check basic quality thresholds
    const views = parseInt(details.statistics.viewCount || '0');
    const likes = parseInt(details.statistics.likeCount || '0');
    const likeRatio = views > 0 ? likes / views : 0;
    
    if (views < this.config.qualityThreshold.minViews) return false;
    if (likeRatio < this.config.qualityThreshold.minLikeRatio) return false;
    
    // Check duration (parse ISO 8601 duration)
    const duration = this.parseIsoDuration(details.contentDetails.duration);
    if (duration < this.config.qualityThreshold.minDuration) return false;
    
    // Check scores
    if (qualityScore < 40) return false;
    if (innovationScore < 30) return false;
    
    // Final check: ensure it's not a basic tutorial
    const title = videoItem.snippet.title.toLowerCase();
    for (const pattern of this.excludePatterns) {
      if (title.includes(pattern)) return false;
    }
    
    return true;
  }

  /**
   * Generate summary of video content
   */
  private generateSummary(videoItem: any, details: any): string {
    const title = videoItem.snippet.title;
    const description = videoItem.snippet.description;
    const tags = details.snippet.tags || [];
    
    // Extract first meaningful paragraph from description
    const firstParagraph = description.split('\n\n')[0].trim();
    
    // Identify key topics
    const topics = tags
      .filter((tag: string) => 
        this.innovationKeywords.some(keyword => 
          tag.toLowerCase().includes(keyword.split(' ')[0])
        )
      )
      .slice(0, 3);
    
    return `${firstParagraph.slice(0, 200)}... Topics: ${topics.join(', ')}`;
  }

  /**
   * Parse ISO 8601 duration to seconds
   */
  private parseIsoDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Deduplicate videos by ID
   */
  private deduplicateVideos(videos: VideoAnalysis[]): VideoAnalysis[] {
    const seen = new Set<string>();
    return videos.filter(video => {
      if (seen.has(video.videoId)) return false;
      seen.add(video.videoId);
      return true;
    });
  }

  /**
   * Store discovered videos in Neo4j database
   */
  private async storeDiscoveries(videos: VideoAnalysis[]): Promise<void> {
    const db = await getDb();
    if (!db) return;
    
    const session = db.session();
    try {
      for (const video of videos) {
        await session.run(
          `
          MERGE (v:YouTubeVideo {videoId: $videoId})
          SET v.title = $title,
              v.channelId = $channelId,
              v.channelTitle = $channelTitle,
              v.publishedAt = datetime($publishedAt),
              v.qualityScore = $qualityScore,
              v.innovationScore = $innovationScore,
              v.viewCount = $viewCount,
              v.likeCount = $likeCount,
              v.summary = $summary,
              v.lastUpdated = datetime(),
              v.isInnovative = true
          `,
          {
            videoId: video.videoId,
            title: video.title,
            channelId: video.channelId,
            channelTitle: video.channelTitle,
            publishedAt: video.publishedAt,
            qualityScore: video.qualityScore,
            innovationScore: video.innovationScore,
            viewCount: video.viewCount,
            likeCount: video.likeCount,
            summary: video.summary
          }
        );
      }
    } finally {
      await session.close();
    }
  }

  /**
   * Get recent innovative discoveries from database
   */
  async getRecentDiscoveries(limit: number = 20): Promise<VideoAnalysis[]> {
    const db = await getDb();
    if (!db) return [];
    
    const session = db.session();
    try {
      const result = await session.run(
        `
        MATCH (v:YouTubeVideo)
        WHERE v.isInnovative = true
        RETURN v
        ORDER BY v.lastUpdated DESC, v.qualityScore DESC
        LIMIT $limit
        `,
        { limit }
      );
      
      return result.records.map(record => {
        const video = record.get('v').properties;
        return {
          videoId: video.videoId,
          title: video.title,
          description: '', // Not stored in DB
          channelId: video.channelId,
          channelTitle: video.channelTitle,
          publishedAt: video.publishedAt.toString(),
          duration: '', // Not stored in DB
          viewCount: video.viewCount,
          likeCount: video.likeCount,
          commentCount: 0, // Not stored in DB
          qualityScore: video.qualityScore,
          innovationScore: video.innovationScore,
          keyTimestamps: [],
          tags: [],
          isInnovative: true,
          summary: video.summary
        };
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Monitor trending innovative videos
   */
  async monitorTrending(): Promise<VideoAnalysis[]> {
    // Search for videos published in the last 7 days
    const recentQueries = this.innovationKeywords.map(keyword => 
      `"claude code" "${keyword}" after:${this.getDateDaysAgo(7)}`
    );
    
    const trendingVideos: VideoAnalysis[] = [];
    
    for (const query of recentQueries.slice(0, 5)) { // Limit to avoid rate limits
      try {
        const videos = await this.searchVideos(query);
        const analyzed = await Promise.all(
          videos.slice(0, 10).map(video => this.analyzeVideo(video))
        );
        
        const innovative = analyzed.filter(v => v.isInnovative);
        trendingVideos.push(...innovative);
      } catch (error) {
        console.error(`Error monitoring trending for "${query}":`, error);
      }
    }
    
    return this.deduplicateVideos(trendingVideos);
  }

  /**
   * Get date string for N days ago
   */
  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }
}

// Export convenience function
export async function discoverInnovativeClaudeVideos(apiKey: string): Promise<VideoAnalysis[]> {
  const discoverer = new YouTubeDiscoverer({
    apiKey,
    maxResults: 50,
    qualityThreshold: {
      minViews: 1000,
      minLikeRatio: 0.95,
      minDuration: 300,
      minChannelSubscribers: 1000
    }
  });
  
  return discoverer.discoverInnovativeVideos();
}