import { runQuery } from '../db/neo4j'
import {
  indexExtension,
  indexMCPServer,
  updateExtension,
  updateMCPServer,
  deleteExtension,
  deleteMCPServer,
  ExtensionDocument,
  MCPDocument
} from './meilisearch'

// Event types for Neo4j changes
export interface SyncEvent {
  type: 'create' | 'update' | 'delete'
  entity: 'extension' | 'mcp'
  id: string
  data?: any
}

// Queue for processing sync events
class SyncQueue {
  private queue: SyncEvent[] = []
  private processing = false
  private retryDelay = 1000 // Start with 1 second
  private maxRetryDelay = 60000 // Max 1 minute
  private retryMultiplier = 2

  async add(event: SyncEvent) {
    this.queue.push(event)
    this.process()
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return
    
    this.processing = true
    
    while (this.queue.length > 0) {
      const event = this.queue.shift()!
      
      try {
        await this.handleEvent(event)
        this.retryDelay = 1000 // Reset delay on success
      } catch (error) {
        console.error('Sync event processing error:', error)
        
        // Re-queue the event with exponential backoff
        this.queue.unshift(event)
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        this.retryDelay = Math.min(this.retryDelay * this.retryMultiplier, this.maxRetryDelay)
      }
    }
    
    this.processing = false
  }

  private async handleEvent(event: SyncEvent) {
    console.log(`Processing sync event: ${event.type} ${event.entity} ${event.id}`)
    
    switch (event.type) {
      case 'create':
      case 'update':
        await this.handleUpsert(event)
        break
      
      case 'delete':
        await this.handleDelete(event)
        break
    }
  }

  private async handleUpsert(event: SyncEvent) {
    if (event.entity === 'extension') {
      const doc = await this.fetchExtension(event.id)
      if (doc) {
        if (event.type === 'create') {
          await indexExtension(doc)
        } else {
          await updateExtension(event.id, doc)
        }
      }
    } else if (event.entity === 'mcp') {
      const doc = await this.fetchMCPServer(event.id)
      if (doc) {
        if (event.type === 'create') {
          await indexMCPServer(doc)
        } else {
          await updateMCPServer(event.id, doc)
        }
      }
    }
  }

  private async handleDelete(event: SyncEvent) {
    if (event.entity === 'extension') {
      await deleteExtension(event.id)
    } else if (event.entity === 'mcp') {
      await deleteMCPServer(event.id)
    }
  }

  private async fetchExtension(id: string): Promise<ExtensionDocument | null> {
    try {
      const result = await runQuery(
        `MATCH (e:Extension)
         WHERE e.id = $id
         RETURN e.id as id, e.name as name, e.description as description,
                e.category as category, e.platform as platform, e.version as version,
                e.author as author, e.downloads as downloads, e.rating as rating,
                e.createdAt as createdAt, e.updatedAt as updatedAt,
                e.repository as repository, e.tags as tags`,
        { id }
      )

      if (result.records.length === 0) return null

      const record = result.records[0]
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
    } catch (error) {
      console.error('Error fetching extension:', error)
      return null
    }
  }

  private async fetchMCPServer(id: string): Promise<MCPDocument | null> {
    try {
      const result = await runQuery(
        `MATCH (m:MCPServer)
         WHERE m.id = $id
         RETURN m.id as id, m.name as name, m.description as description,
                m.category as category, m.platform as platform, m.version as version,
                m.author as author, m.downloads as downloads, m.rating as rating,
                m.createdAt as createdAt, m.updatedAt as updatedAt,
                m.repository as repository, m.tags as tags`,
        { id }
      )

      if (result.records.length === 0) return null

      const record = result.records[0]
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
    } catch (error) {
      console.error('Error fetching MCP server:', error)
      return null
    }
  }
}

// Global sync queue
export const syncQueue = new SyncQueue()

// Helper functions to trigger sync
export function syncExtensionCreate(id: string) {
  syncQueue.add({ type: 'create', entity: 'extension', id })
}

export function syncExtensionUpdate(id: string) {
  syncQueue.add({ type: 'update', entity: 'extension', id })
}

export function syncExtensionDelete(id: string) {
  syncQueue.add({ type: 'delete', entity: 'extension', id })
}

export function syncMCPCreate(id: string) {
  syncQueue.add({ type: 'create', entity: 'mcp', id })
}

export function syncMCPUpdate(id: string) {
  syncQueue.add({ type: 'update', entity: 'mcp', id })
}

export function syncMCPDelete(id: string) {
  syncQueue.add({ type: 'delete', entity: 'mcp', id })
}

// Batch sync function for bulk operations
export async function batchSyncExtensions(ids: string[], operation: 'create' | 'update') {
  for (const id of ids) {
    syncQueue.add({ type: operation, entity: 'extension', id })
  }
}

export async function batchSyncMCPServers(ids: string[], operation: 'create' | 'update') {
  for (const id of ids) {
    syncQueue.add({ type: operation, entity: 'mcp', id })
  }
}