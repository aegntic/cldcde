import { MeiliSearch, Index, EnqueuedTask } from 'meilisearch'
import { z } from 'zod'

// Environment configuration
const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://localhost:7700'
const MEILISEARCH_KEY = process.env.MEILISEARCH_KEY || ''

// Initialize Meilisearch client
export const searchClient = new MeiliSearch({
  host: MEILISEARCH_HOST,
  apiKey: MEILISEARCH_KEY,
})

// Index names
export const EXTENSION_INDEX = 'extensions'
export const MCP_INDEX = 'mcp_servers'

// Search schemas
export const ExtensionSearchSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  author: z.string(),
  tags: z.array(z.string()),
  category: z.enum(['productivity', 'development', 'content', 'filesystem', 'database']),
  platform: z.array(z.string()),
  downloads: z.number(),
  rating: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  version: z.string(),
  repository: z.string().optional(),
})

export const MCPSearchSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  author: z.string(),
  tags: z.array(z.string()),
  category: z.enum(['filesystem', 'database', 'api', 'tools', 'utilities']),
  platform: z.array(z.string()),
  downloads: z.number(),
  rating: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  version: z.string(),
  repository: z.string().optional(),
})

export type ExtensionDocument = z.infer<typeof ExtensionSearchSchema>
export type MCPDocument = z.infer<typeof MCPSearchSchema>

// Index configuration
export const EXTENSION_INDEX_CONFIG = {
  searchableAttributes: ['name', 'description', 'author', 'tags'],
  filterableAttributes: ['category', 'platform', 'rating', 'downloads', 'author'],
  sortableAttributes: ['downloads', 'rating', 'createdAt', 'updatedAt', 'name'],
  displayedAttributes: ['*'],
  rankingRules: [
    'words',
    'typo',
    'proximity',
    'attribute',
    'sort',
    'exactness',
    'downloads:desc',
    'rating:desc'
  ],
  stopWords: ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'],
  synonyms: {
    'extension': ['plugin', 'addon', 'mod'],
    'mcp': ['model context protocol', 'server'],
    'fs': ['filesystem', 'file system'],
    'db': ['database'],
    'dev': ['development', 'developer'],
    'prod': ['productivity'],
    'util': ['utility', 'utilities', 'tool', 'tools']
  },
  typoTolerance: {
    enabled: true,
    minWordSizeForTypos: {
      oneTypo: 4,
      twoTypos: 8
    }
  }
}

export const MCP_INDEX_CONFIG = {
  ...EXTENSION_INDEX_CONFIG,
  synonyms: {
    ...EXTENSION_INDEX_CONFIG.synonyms,
    'server': ['service', 'provider'],
  }
}

// Helper functions
export async function getOrCreateIndex(indexName: string, config: any): Promise<Index> {
  try {
    const index = searchClient.index(indexName)
    
    // Try to get index info to check if it exists
    try {
      await index.getStats()
    } catch (error) {
      // Index doesn't exist, create it
      await searchClient.createIndex(indexName, { primaryKey: 'id' })
      console.log(`Created index: ${indexName}`)
    }

    // Update index settings
    await index.updateSettings(config)
    console.log(`Updated settings for index: ${indexName}`)
    
    return index
  } catch (error) {
    console.error(`Error setting up index ${indexName}:`, error)
    throw error
  }
}

// Search functions with highlighting
export async function searchExtensions(
  query: string,
  options: {
    limit?: number
    offset?: number
    filter?: string[]
    sort?: string[]
    facets?: string[]
  } = {}
) {
  const index = searchClient.index(EXTENSION_INDEX)
  
  const searchParams = {
    limit: options.limit || 20,
    offset: options.offset || 0,
    filter: options.filter,
    sort: options.sort,
    facets: options.facets || ['category', 'platform', 'author'],
    highlightPreTag: '<mark>',
    highlightPostTag: '</mark>',
    attributesToHighlight: ['name', 'description', 'tags'],
    attributesToCrop: ['description'],
    cropLength: 200,
  }

  return await index.search(query, searchParams)
}

export async function searchMCPServers(
  query: string,
  options: {
    limit?: number
    offset?: number
    filter?: string[]
    sort?: string[]
    facets?: string[]
  } = {}
) {
  const index = searchClient.index(MCP_INDEX)
  
  const searchParams = {
    limit: options.limit || 20,
    offset: options.offset || 0,
    filter: options.filter,
    sort: options.sort,
    facets: options.facets || ['category', 'platform', 'author'],
    highlightPreTag: '<mark>',
    highlightPostTag: '</mark>',
    attributesToHighlight: ['name', 'description', 'tags'],
    attributesToCrop: ['description'],
    cropLength: 200,
  }

  return await index.search(query, searchParams)
}

// Autocomplete functions
export async function autocompleteExtensions(query: string, limit: number = 5) {
  const index = searchClient.index(EXTENSION_INDEX)
  
  return await index.search(query, {
    limit,
    attributesToRetrieve: ['id', 'name', 'category'],
    attributesToHighlight: ['name'],
    highlightPreTag: '<mark>',
    highlightPostTag: '</mark>',
  })
}

export async function autocompleteMCPServers(query: string, limit: number = 5) {
  const index = searchClient.index(MCP_INDEX)
  
  return await index.search(query, {
    limit,
    attributesToRetrieve: ['id', 'name', 'category'],
    attributesToHighlight: ['name'],
    highlightPreTag: '<mark>',
    highlightPostTag: '</mark>',
  })
}

// Multi-search function for searching both indexes
export async function multiSearch(query: string, options: any = {}) {
  const results = await searchClient.multiSearch({
    queries: [
      {
        indexUid: EXTENSION_INDEX,
        q: query,
        ...options,
      },
      {
        indexUid: MCP_INDEX,
        q: query,
        ...options,
      },
    ],
  })

  return {
    extensions: results.results[0],
    mcpServers: results.results[1],
  }
}

// Indexing functions
export async function indexExtension(extension: ExtensionDocument): Promise<EnqueuedTask> {
  const index = searchClient.index(EXTENSION_INDEX)
  return await index.addDocuments([extension])
}

export async function indexMCPServer(mcpServer: MCPDocument): Promise<EnqueuedTask> {
  const index = searchClient.index(MCP_INDEX)
  return await index.addDocuments([mcpServer])
}

export async function bulkIndexExtensions(extensions: ExtensionDocument[]): Promise<EnqueuedTask> {
  const index = searchClient.index(EXTENSION_INDEX)
  return await index.addDocuments(extensions)
}

export async function bulkIndexMCPServers(mcpServers: MCPDocument[]): Promise<EnqueuedTask> {
  const index = searchClient.index(MCP_INDEX)
  return await index.addDocuments(mcpServers)
}

// Update functions
export async function updateExtension(id: string, updates: Partial<ExtensionDocument>): Promise<EnqueuedTask> {
  const index = searchClient.index(EXTENSION_INDEX)
  return await index.updateDocuments([{ id, ...updates }])
}

export async function updateMCPServer(id: string, updates: Partial<MCPDocument>): Promise<EnqueuedTask> {
  const index = searchClient.index(MCP_INDEX)
  return await index.updateDocuments([{ id, ...updates }])
}

// Delete functions
export async function deleteExtension(id: string): Promise<EnqueuedTask> {
  const index = searchClient.index(EXTENSION_INDEX)
  return await index.deleteDocument(id)
}

export async function deleteMCPServer(id: string): Promise<EnqueuedTask> {
  const index = searchClient.index(MCP_INDEX)
  return await index.deleteDocument(id)
}

// Health check
export async function checkSearchHealth(): Promise<boolean> {
  try {
    const health = await searchClient.health()
    return health.status === 'available'
  } catch (error) {
    console.error('Meilisearch health check failed:', error)
    return false
  }
}

// Analytics collection
export interface SearchAnalytics {
  query: string
  index: string
  resultsCount: number
  responseTime: number
  filters?: string[]
  userId?: string
  timestamp: number
}

const analyticsQueue: SearchAnalytics[] = []

export function collectSearchAnalytics(analytics: SearchAnalytics) {
  analyticsQueue.push(analytics)
  
  // Process queue when it reaches 100 items
  if (analyticsQueue.length >= 100) {
    flushAnalytics()
  }
}

async function flushAnalytics() {
  if (analyticsQueue.length === 0) return
  
  const analytics = [...analyticsQueue]
  analyticsQueue.length = 0
  
  try {
    // Here you would send analytics to your analytics service
    // For now, we'll just log them
    console.log('Flushing search analytics:', analytics.length, 'items')
  } catch (error) {
    console.error('Failed to flush analytics:', error)
    // Re-add to queue on failure
    analyticsQueue.unshift(...analytics)
  }
}

// Flush analytics every 5 minutes
setInterval(flushAnalytics, 5 * 60 * 1000)