import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

export interface SearchOptions {
  query: string
  limit?: number
  offset?: number
  filters?: {
    category?: string
    platform?: string[]
    minRating?: number
  }
}

export interface SearchResult<T> {
  data: T[]
  count: number
  query: string
  took: number
}

/**
 * Supabase PostgreSQL Full-Text Search Implementation
 * Replaces Meilisearch with built-in PostgreSQL capabilities
 */
export class SupabaseSearch {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Search extensions with full-text search
   */
  async searchExtensions(options: SearchOptions): Promise<SearchResult<any>> {
    const start = Date.now()
    const { query, limit = 20, offset = 0, filters } = options

    let queryBuilder = this.supabase
      .from('extensions')
      .select(`
        *,
        author:profiles!author_id(id, username, avatar_url),
        rank:fts_rank
      `, { count: 'exact' })

    // Full-text search using PostgreSQL
    if (query && query.trim()) {
      // Use websearch_to_tsquery for Google-like search syntax
      queryBuilder = queryBuilder
        .textSearch('fts', query, {
          type: 'websearch',
          config: 'english'
        })
        .order('rank', { ascending: false })
    }

    // Apply filters
    if (filters?.category) {
      queryBuilder = queryBuilder.eq('category', filters.category)
    }

    if (filters?.platform && filters.platform.length > 0) {
      queryBuilder = queryBuilder.overlaps('platform', filters.platform)
    }

    if (filters?.minRating) {
      queryBuilder = queryBuilder.gte('rating', filters.minRating)
    }

    // If no search query, order by popularity
    if (!query || !query.trim()) {
      queryBuilder = queryBuilder.order('downloads', { ascending: false })
    }

    // Pagination
    queryBuilder = queryBuilder
      .range(offset, offset + limit - 1)

    const { data, error, count } = await queryBuilder

    if (error) throw error

    return {
      data: data || [],
      count: count || 0,
      query,
      took: Date.now() - start
    }
  }

  /**
   * Search MCP servers
   */
  async searchMCPServers(options: SearchOptions): Promise<SearchResult<any>> {
    const start = Date.now()
    const { query, limit = 20, offset = 0, filters } = options

    let queryBuilder = this.supabase
      .from('mcp_servers')
      .select(`
        *,
        author:profiles!author_id(id, username, avatar_url)
      `, { count: 'exact' })

    if (query && query.trim()) {
      queryBuilder = queryBuilder.textSearch('fts', query, {
        type: 'websearch',
        config: 'english'
      })
    }

    if (filters?.category) {
      queryBuilder = queryBuilder.eq('category', filters.category)
    }

    queryBuilder = queryBuilder
      .order(query ? 'rank' : 'downloads', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await queryBuilder

    if (error) throw error

    return {
      data: data || [],
      count: count || 0,
      query,
      took: Date.now() - start
    }
  }

  /**
   * Search forum posts
   */
  async searchPosts(options: SearchOptions): Promise<SearchResult<any>> {
    const start = Date.now()
    const { query, limit = 20, offset = 0 } = options

    let queryBuilder = this.supabase
      .from('posts')
      .select(`
        *,
        author:profiles!author_id(id, username, avatar_url),
        forum:forums!forum_id(title, slug)
      `, { count: 'exact' })

    if (query && query.trim()) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    }

    queryBuilder = queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await queryBuilder

    if (error) throw error

    return {
      data: data || [],
      count: count || 0,
      query,
      took: Date.now() - start
    }
  }

  /**
   * Search news articles
   */
  async searchNews(options: SearchOptions): Promise<SearchResult<any>> {
    const start = Date.now()
    const { query, limit = 20, offset = 0 } = options

    let queryBuilder = this.supabase
      .from('news')
      .select(`
        *,
        author:profiles!author_id(id, username, avatar_url)
      `, { count: 'exact' })
      .eq('is_published', true)

    if (query && query.trim()) {
      queryBuilder = queryBuilder.textSearch('fts', query, {
        type: 'websearch',
        config: 'english'
      })
    }

    queryBuilder = queryBuilder
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await queryBuilder

    if (error) throw error

    return {
      data: data || [],
      count: count || 0,
      query,
      took: Date.now() - start
    }
  }

  /**
   * Global search across all content types
   */
  async searchAll(query: string, limit = 5): Promise<{
    extensions: any[]
    mcpServers: any[]
    posts: any[]
    news: any[]
    took: number
  }> {
    const start = Date.now()

    // Run all searches in parallel
    const [extensions, mcpServers, posts, news] = await Promise.all([
      this.searchExtensions({ query, limit }),
      this.searchMCPServers({ query, limit }),
      this.searchPosts({ query, limit }),
      this.searchNews({ query, limit })
    ])

    return {
      extensions: extensions.data,
      mcpServers: mcpServers.data,
      posts: posts.data,
      news: news.data,
      took: Date.now() - start
    }
  }

  /**
   * Get search suggestions (autocomplete)
   * Uses a simple LIKE query for performance
   */
  async getSuggestions(query: string, type: 'extensions' | 'mcp_servers' = 'extensions'): Promise<string[]> {
    if (!query || query.length < 2) return []

    const { data, error } = await this.supabase
      .from(type)
      .select('name')
      .ilike('name', `${query}%`)
      .limit(10)
      .order('downloads', { ascending: false })

    if (error) throw error

    return data?.map(item => item.name) || []
  }

  /**
   * Get popular search terms
   * In a real implementation, you'd track searches in a separate table
   */
  async getPopularSearches(): Promise<string[]> {
    // For now, return popular tags
    const { data: extensions } = await this.supabase
      .from('extensions')
      .select('tags')
      .limit(100)

    if (!extensions) return []

    // Count tag frequency
    const tagCount: Record<string, number> = {}
    extensions.forEach(ext => {
      ext.tags?.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1
      })
    })

    // Sort by frequency and return top 10
    return Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag)
  }

  /**
   * Get facets for filtering
   */
  async getFacets(type: 'extensions' | 'mcp_servers' = 'extensions'): Promise<{
    categories: Array<{ value: string; count: number }>
    platforms?: Array<{ value: string; count: number }>
    ratings: Array<{ value: number; count: number }>
  }> {
    // Get category counts
    const { data: categories } = await this.supabase
      .from(type)
      .select('category')
      .order('category')

    const categoryCounts: Record<string, number> = {}
    categories?.forEach(item => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
    })

    // Get platform counts (extensions only)
    let platformCounts: Record<string, number> = {}
    if (type === 'extensions') {
      const { data: platforms } = await this.supabase
        .from('extensions')
        .select('platform')

      platforms?.forEach(item => {
        item.platform?.forEach(p => {
          platformCounts[p] = (platformCounts[p] || 0) + 1
        })
      })
    }

    // Get rating distribution
    const { data: ratings } = await this.supabase
      .from(type)
      .select('rating')
      .gte('rating', 1)

    const ratingCounts: Record<number, number> = {}
    ratings?.forEach(item => {
      const roundedRating = Math.floor(item.rating)
      ratingCounts[roundedRating] = (ratingCounts[roundedRating] || 0) + 1
    })

    return {
      categories: Object.entries(categoryCounts).map(([value, count]) => ({ value, count })),
      ...(type === 'extensions' && {
        platforms: Object.entries(platformCounts).map(([value, count]) => ({ value, count }))
      }),
      ratings: Object.entries(ratingCounts).map(([value, count]) => ({ 
        value: parseInt(value), 
        count 
      })).sort((a, b) => b.value - a.value)
    }
  }
}

// Update the Supabase schema to support full-text search
export const searchSchemaMigration = `
-- Add full-text search columns and indexes

-- Extensions
ALTER TABLE extensions ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_extensions_fts ON extensions USING GIN(fts);

-- MCP Servers
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_mcp_servers_fts ON mcp_servers USING GIN(fts);

-- News
ALTER TABLE news ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_news_fts ON news USING GIN(fts);

-- Create function to calculate search rank
CREATE OR REPLACE FUNCTION fts_rank(fts_column tsvector, search_query tsquery)
RETURNS float AS $$
BEGIN
  RETURN ts_rank_cd(fts_column, search_query);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
`