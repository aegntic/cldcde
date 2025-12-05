import { ToolDocumentation } from '../types';

export const searchTemplatesDoc: ToolDocumentation = {
  name: 'search_templates',
  category: 'templates',
  essentials: {
    description: 'Search templates by name/description keywords. NOT for node types! For nodes use list_node_templates. Example: "chatbot".',
    keyParameters: ['query', 'limit'],
    example: 'search_templates({query: "chatbot"})',
    performance: 'Fast (<100ms) - FTS5 full-text search',
    tips: [
      'Searches template names and descriptions, NOT node types',
      'Use keywords like "automation", "sync", "notification"',
      'For node-specific search, use list_node_templates instead'
    ]
  },
  full: {
    description: `Performs full-text search across workflow template names and descriptions. This tool is ideal for finding workflows based on their purpose or functionality rather than specific nodes used. It searches through the community library of 399+ templates using SQLite FTS5 for fast, fuzzy matching.`,
    parameters: {
      query: {
        type: 'string',
        required: true,
        description: 'Search query for template names/descriptions. NOT for node types! Examples: "chatbot", "automation", "social media", "webhook". For node-based search use list_node_templates instead.'
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of results. Default 20, max 100'
      }
    },
    returns: `Returns an object containing:
- templates: Array of matching templates sorted by relevance
  - id: Template ID for retrieval
  - name: Template name (with match highlights)
  - description: What the workflow does
  - author: Creator information
  - nodes: Array of all nodes used
  - views: Popularity metric
  - created: Creation date
  - url: Link to template
  - relevanceScore: Search match score
- totalFound: Total matching templates
- searchQuery: The processed search query
- tip: Helpful hints if no results`,
    examples: [
      'search_templates({query: "chatbot"}) - Find chatbot and conversational AI workflows',
      'search_templates({query: "email notification"}) - Find email alert workflows',
      'search_templates({query: "data sync"}) - Find data synchronization workflows',
      'search_templates({query: "webhook automation", limit: 30}) - Find webhook-based automations',
      'search_templates({query: "social media scheduler"}) - Find social posting workflows'
    ],
    useCases: [
      'Find workflows by business purpose',
      'Discover automations for specific use cases',
      'Search by workflow functionality',
      'Find templates by problem they solve',
      'Explore workflows by industry or domain'
    ],
    performance: `Excellent performance with FTS5 indexing:
- Full-text search: <50ms for most queries
- Fuzzy matching enabled for typos
- Relevance-based sorting included
- Searches both title and description
- Returns highlighted matches`,
    bestPractices: [
      'Use descriptive keywords about the workflow purpose',
      'Try multiple related terms if first search has few results',
      'Combine terms for more specific results',
      'Check both name and description in results',
      'Use quotes for exact phrase matching'
    ],
    pitfalls: [
      'Does NOT search by node types - use list_node_templates',
      'Search is case-insensitive but not semantic',
      'Very specific terms may return no results',
      'Descriptions may be brief - check full template',
      'Relevance scoring may not match your expectations'
    ],
    relatedTools: ['list_node_templates', 'get_templates_for_task', 'get_template', 'search_nodes']
  }
};