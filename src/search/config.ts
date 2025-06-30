/**
 * Meilisearch Configuration and Indexing Strategy
 * 
 * This file contains the complete search configuration for cldcde.cc
 * including index settings, ranking rules, and optimization strategies.
 */

export const SEARCH_CONFIG = {
  // Meilisearch connection
  connection: {
    host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_KEY || '',
    requestTimeout: 10000, // 10 seconds
    retries: 3,
  },

  // Index configuration
  indexes: {
    extensions: {
      name: 'extensions',
      primaryKey: 'id',
      
      // Fields that can be searched
      searchableAttributes: [
        'name',        // Highest priority
        'description', // Second priority
        'author',      // Third priority
        'tags',        // Fourth priority
      ],
      
      // Fields that can be filtered
      filterableAttributes: [
        'category',
        'platform',
        'rating',
        'downloads',
        'author',
        'createdAt',
        'updatedAt',
      ],
      
      // Fields that can be sorted
      sortableAttributes: [
        'downloads',
        'rating',
        'createdAt',
        'updatedAt',
        'name',
      ],
      
      // All fields to return in results
      displayedAttributes: ['*'],
      
      // Ranking rules (order matters!)
      rankingRules: [
        'words',           // Documents containing more query words first
        'typo',            // Documents with fewer typos first
        'proximity',       // Documents where query words are closer together
        'attribute',       // Documents where matches are in more important attributes
        'sort',            // User-defined sort
        'exactness',       // Documents with exact matches first
        'downloads:desc',  // Custom rule: prioritize popular extensions
        'rating:desc',     // Custom rule: prioritize highly-rated extensions
      ],
      
      // Stop words to ignore in search
      stopWords: [
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been',
      ],
      
      // Synonyms for better search results
      synonyms: {
        'extension': ['plugin', 'addon', 'mod', 'package'],
        'fs': ['filesystem', 'file system', 'files'],
        'db': ['database', 'data'],
        'dev': ['development', 'developer', 'develop'],
        'prod': ['productivity', 'productive'],
        'util': ['utility', 'utilities', 'tool', 'tools'],
        'config': ['configuration', 'settings', 'setup'],
        'auth': ['authentication', 'authorization', 'login'],
        'api': ['interface', 'endpoint'],
        'ui': ['interface', 'frontend', 'user interface'],
      },
      
      // Typo tolerance settings
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: {
          oneTypo: 4,    // Allow 1 typo for words >= 4 chars
          twoTypos: 8,   // Allow 2 typos for words >= 8 chars
        },
        disableOnWords: [], // Words that must match exactly
        disableOnAttributes: [], // Attributes where typos are not allowed
      },
      
      // Faceting configuration
      faceting: {
        maxValuesPerFacet: 100,
      },
      
      // Pagination settings
      pagination: {
        maxTotalHits: 1000,
      },
    },
    
    mcp_servers: {
      name: 'mcp_servers',
      primaryKey: 'id',
      
      // Same structure as extensions with MCP-specific synonyms
      searchableAttributes: [
        'name',
        'description',
        'author',
        'tags',
      ],
      
      filterableAttributes: [
        'category',
        'platform',
        'rating',
        'downloads',
        'author',
        'createdAt',
        'updatedAt',
      ],
      
      sortableAttributes: [
        'downloads',
        'rating',
        'createdAt',
        'updatedAt',
        'name',
      ],
      
      displayedAttributes: ['*'],
      
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
        'downloads:desc',
        'rating:desc',
      ],
      
      stopWords: [
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been',
      ],
      
      synonyms: {
        'mcp': ['model context protocol', 'server', 'context server'],
        'server': ['service', 'provider', 'backend'],
        'fs': ['filesystem', 'file system', 'files'],
        'db': ['database', 'data', 'storage'],
        'api': ['interface', 'endpoint', 'service'],
        'tool': ['utility', 'function', 'feature'],
        'integration': ['connector', 'bridge', 'adapter'],
      },
      
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: {
          oneTypo: 4,
          twoTypos: 8,
        },
        disableOnWords: ['mcp'],
        disableOnAttributes: [],
      },
      
      faceting: {
        maxValuesPerFacet: 100,
      },
      
      pagination: {
        maxTotalHits: 1000,
      },
    },
  },

  // Search behavior configuration
  search: {
    // Search-as-you-type settings
    autocomplete: {
      enabled: true,
      minChars: 2,          // Minimum characters before autocomplete
      debounceMs: 50,       // Debounce delay
      maxSuggestions: 5,    // Maximum suggestions to show
      highlightTag: 'mark', // HTML tag for highlighting
    },
    
    // Full search settings
    fullSearch: {
      defaultLimit: 20,     // Default results per page
      maxLimit: 50,         // Maximum results per page
      defaultSort: 'relevance', // Default sort order
      cropLength: 200,      // Description crop length
      highlightTag: 'mark', // HTML tag for highlighting
      attributesToHighlight: ['name', 'description', 'tags'],
      attributesToCrop: ['description'],
    },
    
    // Multi-search settings
    multiSearch: {
      enabled: true,
      distributeLimit: true, // Distribute limit across indexes
    },
  },

  // Analytics configuration
  analytics: {
    enabled: true,
    collectSearches: true,
    collectClicks: true,
    collectConversions: true,
    anonymizeIP: true,
    sessionDuration: 30 * 60 * 1000, // 30 minutes
    
    // Events to track
    events: {
      search: true,
      autocomplete: true,
      click: true,
      view: true,
      install: true,
      rate: true,
    },
  },

  // Performance optimization
  performance: {
    // Caching settings
    cache: {
      enabled: true,
      ttl: 300, // 5 minutes
      maxSize: 1000, // Maximum cached queries
    },
    
    // Indexing queue settings
    indexingQueue: {
      batchSize: 100,        // Documents per batch
      flushInterval: 5000,   // Flush every 5 seconds
      maxRetries: 3,         // Maximum retry attempts
      retryDelay: 1000,      // Initial retry delay
      maxRetryDelay: 60000,  // Maximum retry delay
    },
    
    // Request pooling
    requestPool: {
      maxConcurrent: 10,     // Maximum concurrent requests
      requestTimeout: 10000, // Request timeout
    },
  },

  // Monitoring and alerts
  monitoring: {
    healthCheck: {
      enabled: true,
      interval: 60000, // Check every minute
      timeout: 5000,   // Health check timeout
    },
    
    alerts: {
      slowQueries: {
        enabled: true,
        threshold: 1000, // Alert if query takes > 1 second
      },
      errorRate: {
        enabled: true,
        threshold: 0.05, // Alert if error rate > 5%
        window: 300000,  // 5 minute window
      },
      indexingLag: {
        enabled: true,
        threshold: 60000, // Alert if indexing lags > 1 minute
      },
    },
  },
}

// Export individual configurations for convenience
export const EXTENSION_SEARCH_CONFIG = SEARCH_CONFIG.indexes.extensions
export const MCP_SEARCH_CONFIG = SEARCH_CONFIG.indexes.mcp_servers
export const AUTOCOMPLETE_CONFIG = SEARCH_CONFIG.search.autocomplete
export const ANALYTICS_CONFIG = SEARCH_CONFIG.analytics
export const PERFORMANCE_CONFIG = SEARCH_CONFIG.performance