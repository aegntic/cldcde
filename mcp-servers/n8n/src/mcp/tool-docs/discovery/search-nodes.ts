import { ToolDocumentation } from '../types';

export const searchNodesDoc: ToolDocumentation = {
  name: 'search_nodes',
  category: 'discovery',
  essentials: {
    description: 'Text search across node names and descriptions. Returns most relevant nodes first, with frequently-used nodes (HTTP Request, Webhook, Set, Code, Slack) prioritized in results. Searches all 525 nodes in the database.',
    keyParameters: ['query', 'mode', 'limit'],
    example: 'search_nodes({query: "webhook"})',
    performance: '<20ms even for complex queries',
    tips: [
      'OR mode (default): Matches any search word',
      'AND mode: Requires all words present',
      'FUZZY mode: Handles typos and spelling errors',
      'Use quotes for exact phrases: "google sheets"'
    ]
  },
  full: {
    description: 'Full-text search engine for n8n nodes using SQLite FTS5. Searches across node names, descriptions, and aliases. Results are ranked by relevance with commonly-used nodes given priority. Common nodes include: HTTP Request, Webhook, Set, Code, IF, Switch, Merge, SplitInBatches, Slack, Google Sheets.',
    parameters: {
      query: { type: 'string', description: 'Search keywords. Use quotes for exact phrases like "google sheets"', required: true },
      limit: { type: 'number', description: 'Maximum results to return. Default: 20, Max: 100', required: false },
      mode: { type: 'string', description: 'Search mode: "OR" (any word matches, default), "AND" (all words required), "FUZZY" (typo-tolerant)', required: false }
    },
    returns: 'Array of node objects sorted by relevance score. Each object contains: nodeType, displayName, description, category, relevance score. Common nodes appear first when relevance is similar.',
    examples: [
      'search_nodes({query: "webhook"}) - Returns Webhook node as top result',
      'search_nodes({query: "database"}) - Returns MySQL, Postgres, MongoDB, Redis, etc.',
      'search_nodes({query: "google sheets", mode: "AND"}) - Requires both words',
      'search_nodes({query: "slak", mode: "FUZZY"}) - Finds Slack despite typo',
      'search_nodes({query: "http api"}) - Finds HTTP Request, GraphQL, REST nodes',
      'search_nodes({query: "transform data"}) - Finds Set, Code, Function, Item Lists nodes'
    ],
    useCases: [
      'Finding nodes when you know partial names',
      'Discovering nodes by functionality (e.g., "email", "database", "transform")',
      'Handling user typos in node names',
      'Finding all nodes related to a service (e.g., "google", "aws", "microsoft")'
    ],
    performance: '<20ms for simple queries, <50ms for complex FUZZY searches. Uses FTS5 index for speed',
    bestPractices: [
      'Start with single keywords for broadest results',
      'Use FUZZY mode when users might misspell node names',
      'AND mode works best for 2-3 word searches',
      'Combine with get_node_essentials after finding the right node'
    ],
    pitfalls: [
      'AND mode searches all fields (name, description) not just node names',
      'FUZZY mode with very short queries (1-2 chars) may return unexpected results',
      'Exact matches in quotes are case-sensitive'
    ],
    relatedTools: ['list_nodes for browsing by category', 'get_node_essentials to configure found nodes', 'list_ai_tools for AI-specific search']
  }
};