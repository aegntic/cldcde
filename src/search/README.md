# Meilisearch Implementation for cldcde.cc

## Overview

This directory contains the complete Meilisearch implementation for advanced search functionality in the cldcde.cc platform. The implementation provides:

- **Full-text search** with <100ms response time
- **Search-as-you-type** with 50ms debounce
- **Typo tolerance** and **synonyms** for better results
- **Faceted search** for filtering by category, platform, etc.
- **Search analytics** for tracking user behavior
- **Real-time sync** between Neo4j and Meilisearch

## Architecture

### Components

1. **meilisearch.ts** - Core Meilisearch client and search functions
2. **config.ts** - Comprehensive configuration and indexing strategy
3. **analytics.ts** - Search analytics collection and tracking
4. **sync-worker.ts** - Real-time synchronization with Neo4j
5. **../api/search.ts** - RESTful API endpoints for search

### Data Flow

```
User Query → API → Meilisearch → Results
     ↓                              ↓
  Analytics                   Highlighting
```

## Setup

### Environment Variables

```bash
MEILISEARCH_HOST=http://localhost:7700  # Meilisearch server URL
MEILISEARCH_KEY=your-master-key         # Meilisearch API key
```

### Initial Indexing

Run the indexing script to sync all data from Neo4j:

```bash
bun run search:index
```

This will:
- Create indexes for extensions and MCP servers
- Configure search settings (synonyms, stop words, etc.)
- Import all existing data from Neo4j
- Set up ranking rules for relevance

## API Endpoints

### Search Endpoint
```
POST /api/search
{
  "q": "search query",
  "type": "all" | "extensions" | "mcp",
  "limit": 20,
  "offset": 0,
  "category": "development",
  "platform": "macos",
  "sort": "relevance" | "downloads" | "rating" | "created"
}
```

### Autocomplete Endpoint
```
GET /api/search/autocomplete?q=query&type=all&limit=5
```

### Popular Queries
```
GET /api/search/popular?limit=10
```

### Analytics Tracking
```
POST /api/search/analytics
{
  "query": "search query",
  "clickedResult": {
    "id": "result-id",
    "position": 1,
    "type": "extension"
  }
}
```

## Search Features

### 1. Searchable Fields
- **name** (highest priority)
- **description** (second priority)
- **author** (third priority)
- **tags** (fourth priority)

### 2. Filterable Fields
- category
- platform
- rating (min/max)
- downloads (min/max)
- author
- createdAt/updatedAt

### 3. Sortable Fields
- downloads (default)
- rating
- createdAt
- updatedAt
- name

### 4. Ranking Rules
1. Words - More query words = higher rank
2. Typo - Fewer typos = higher rank
3. Proximity - Closer words = higher rank
4. Attribute - Matches in name > description > tags
5. Sort - User-defined sorting
6. Exactness - Exact matches rank higher
7. Downloads - Popular items rank higher
8. Rating - Highly-rated items rank higher

### 5. Synonyms
- extension → plugin, addon, mod, package
- fs → filesystem, file system, files
- db → database, data
- dev → development, developer
- mcp → model context protocol, server

### 6. Stop Words
Common words like "the", "a", "and", etc. are ignored to improve relevance.

### 7. Typo Tolerance
- 1 typo allowed for words ≥ 4 characters
- 2 typos allowed for words ≥ 8 characters

## Frontend Integration

### SearchBar Component

```tsx
import { SearchBar } from '@/components/SearchBar'

<SearchBar 
  onSearch={(results) => setSearchResults(results)}
  placeholder="Search extensions and MCP servers..."
  autoFocus={true}
/>
```

The SearchBar component provides:
- Instant search results
- Autocomplete suggestions
- Keyboard navigation
- Click tracking
- Highlighted matches

## Analytics

The search implementation tracks:
- Search queries and results count
- Response times
- Click-through rates
- Popular queries
- User sessions
- Search quality metrics

Analytics are collected in real-time and can be used to:
- Improve search relevance
- Identify popular content
- Optimize performance
- Understand user behavior

## Performance Optimization

1. **Indexing Queue** - Batches updates for efficiency
2. **Caching** - 5-minute cache for popular queries
3. **Debouncing** - 50ms debounce for autocomplete
4. **Highlighting** - Efficient text highlighting
5. **Pagination** - Limits results to improve speed

## Monitoring

Health check endpoint: `GET /api/search/health`

Monitors:
- Meilisearch availability
- Index statistics
- Query performance
- Error rates

## Maintenance

### Reindex Data
```bash
bun run search:index
```

### Check Health
```bash
bun run search:health
```

### View Index Stats
```bash
curl $MEILISEARCH_HOST/indexes/extensions/stats
curl $MEILISEARCH_HOST/indexes/mcp_servers/stats
```

## Troubleshooting

### Slow Queries
1. Check index stats for document count
2. Review ranking rules configuration
3. Optimize filterableAttributes usage
4. Check Meilisearch server resources

### Missing Results
1. Verify searchableAttributes configuration
2. Check synonyms and stop words
3. Review typo tolerance settings
4. Ensure data is properly indexed

### Sync Issues
1. Check Neo4j connection
2. Review sync-worker logs
3. Manually trigger reindex if needed
4. Verify event queue processing