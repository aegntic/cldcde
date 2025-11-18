#!/usr/bin/env bun

import { runQuery } from '../src/db/neo4j'
import {
  getOrCreateIndex,
  bulkIndexExtensions,
  bulkIndexMCPServers,
  EXTENSION_INDEX,
  MCP_INDEX,
  EXTENSION_INDEX_CONFIG,
  MCP_INDEX_CONFIG,
  ExtensionDocument,
  MCPDocument,
  searchClient
} from '../src/search/meilisearch'

// Queue implementation for batch processing
class IndexingQueue<T> {
  private items: T[] = []
  private batchSize: number
  private processFn: (batch: T[]) => Promise<void>
  private processing = false

  constructor(batchSize: number, processFn: (batch: T[]) => Promise<void>) {
    this.batchSize = batchSize
    this.processFn = processFn
  }

  async add(item: T) {
    this.items.push(item)
    
    if (this.items.length >= this.batchSize && !this.processing) {
      await this.flush()
    }
  }

  async flush() {
    if (this.items.length === 0 || this.processing) return
    
    this.processing = true
    const batch = this.items.splice(0, this.batchSize)
    
    try {
      await this.processFn(batch)
      console.log(`Processed batch of ${batch.length} items`)
    } catch (error) {
      console.error('Batch processing error:', error)
      // Re-add items to queue on failure
      this.items.unshift(...batch)
    } finally {
      this.processing = false
    }
  }

  getQueueSize() {
    return this.items.length
  }
}

// Transform Neo4j extension to Meilisearch document
function transformExtension(record: any): ExtensionDocument {
  return {
    id: record.get('id'),
    name: record.get('name'),
    description: record.get('description'),
    author: record.get('author'),
    tags: record.get('tags') || [],
    category: record.get('category'),
    platform: record.get('platform') || [],
    downloads: record.get('downloads')?.toNumber() || 0,
    rating: record.get('rating') || 0,
    createdAt: new Date(record.get('createdAt')).getTime(),
    updatedAt: new Date(record.get('updatedAt')).getTime(),
    version: record.get('version'),
    repository: record.get('repository'),
  }
}

// Transform Neo4j MCP server to Meilisearch document
function transformMCPServer(record: any): MCPDocument {
  return {
    id: record.get('id'),
    name: record.get('name'),
    description: record.get('description'),
    author: record.get('author'),
    tags: record.get('tags') || [],
    category: record.get('category'),
    platform: record.get('platform') || [],
    downloads: record.get('downloads')?.toNumber() || 0,
    rating: record.get('rating') || 0,
    createdAt: new Date(record.get('createdAt')).getTime(),
    updatedAt: new Date(record.get('updatedAt')).getTime(),
    version: record.get('version'),
    repository: record.get('repository'),
  }
}

async function indexExtensions() {
  console.log('Starting extension indexing...')
  
  // Create or update index
  await getOrCreateIndex(EXTENSION_INDEX, EXTENSION_INDEX_CONFIG)
  
  // Create queue for batch processing
  const queue = new IndexingQueue<ExtensionDocument>(100, async (batch) => {
    const task = await bulkIndexExtensions(batch)
    console.log(`Extension indexing task: ${task.taskUid}`)
    
    // Wait for task completion
    await searchClient.waitForTask(task.taskUid, {
      timeOutMs: 30000,
      intervalMs: 500,
    })
  })

  try {
    // Fetch all extensions from Neo4j
    const result = await runQuery(
      `MATCH (e:Extension)
       RETURN e.id as id, e.name as name, e.description as description,
              e.category as category, e.platform as platform, e.version as version,
              e.author as author, e.downloads as downloads, e.rating as rating,
              e.createdAt as createdAt, e.updatedAt as updatedAt,
              e.repository as repository, e.tags as tags
       ORDER BY e.createdAt`
    )

    console.log(`Found ${result.records.length} extensions to index`)

    // Process records
    for (const record of result.records) {
      try {
        const doc = transformExtension(record)
        await queue.add(doc)
      } catch (error) {
        console.error('Error transforming extension:', error)
      }
    }

    // Flush remaining items
    await queue.flush()
    console.log(`Extension indexing complete. Remaining queue: ${queue.getQueueSize()}`)

  } catch (error) {
    console.error('Extension indexing error:', error)
    throw error
  }
}

async function indexMCPServers() {
  console.log('Starting MCP server indexing...')
  
  // Create or update index
  await getOrCreateIndex(MCP_INDEX, MCP_INDEX_CONFIG)
  
  // Create queue for batch processing
  const queue = new IndexingQueue<MCPDocument>(100, async (batch) => {
    const task = await bulkIndexMCPServers(batch)
    console.log(`MCP indexing task: ${task.taskUid}`)
    
    // Wait for task completion
    await searchClient.waitForTask(task.taskUid, {
      timeOutMs: 30000,
      intervalMs: 500,
    })
  })

  try {
    // Fetch all MCP servers from Neo4j
    const result = await runQuery(
      `MATCH (m:MCPServer)
       RETURN m.id as id, m.name as name, m.description as description,
              m.category as category, m.platform as platform, m.version as version,
              m.author as author, m.downloads as downloads, m.rating as rating,
              m.createdAt as createdAt, m.updatedAt as updatedAt,
              m.repository as repository, m.tags as tags
       ORDER BY m.createdAt`
    )

    console.log(`Found ${result.records.length} MCP servers to index`)

    // Process records
    for (const record of result.records) {
      try {
        const doc = transformMCPServer(record)
        await queue.add(doc)
      } catch (error) {
        console.error('Error transforming MCP server:', error)
      }
    }

    // Flush remaining items
    await queue.flush()
    console.log(`MCP server indexing complete. Remaining queue: ${queue.getQueueSize()}`)

  } catch (error) {
    console.error('MCP server indexing error:', error)
    throw error
  }
}

async function getIndexStats() {
  try {
    const extensionIndex = searchClient.index(EXTENSION_INDEX)
    const mcpIndex = searchClient.index(MCP_INDEX)

    const [extStats, mcpStats] = await Promise.all([
      extensionIndex.getStats(),
      mcpIndex.getStats(),
    ])

    console.log('\nIndex Statistics:')
    console.log('=================')
    console.log(`Extensions: ${extStats.numberOfDocuments} documents`)
    console.log(`MCP Servers: ${mcpStats.numberOfDocuments} documents`)

  } catch (error) {
    console.error('Error fetching index stats:', error)
  }
}

async function main() {
  console.log('🔍 Meilisearch Indexing Script')
  console.log('==============================')
  console.log(`Host: ${process.env.MEILISEARCH_HOST || 'http://localhost:7700'}`)
  console.log(`Time: ${new Date().toISOString()}\n`)

  try {
    // Check Meilisearch health
    const health = await searchClient.health()
    console.log(`Meilisearch status: ${health.status}`)

    // Run indexing in parallel
    await Promise.all([
      indexExtensions(),
      indexMCPServers(),
    ])

    // Show final statistics
    await getIndexStats()

    console.log('\n✅ Indexing completed successfully!')

  } catch (error) {
    console.error('\n❌ Indexing failed:', error)
    process.exit(1)
  }
}

// Run the script
main()