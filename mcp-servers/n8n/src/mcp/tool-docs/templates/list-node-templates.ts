import { ToolDocumentation } from '../types';

export const listNodeTemplatesDoc: ToolDocumentation = {
  name: 'list_node_templates',
  category: 'templates',
  essentials: {
    description: 'Find templates using specific nodes. 399 community workflows. Use FULL types: "n8n-nodes-base.httpRequest".',
    keyParameters: ['nodeTypes', 'limit'],
    example: 'list_node_templates({nodeTypes: ["n8n-nodes-base.slack"]})',
    performance: 'Fast (<100ms) - indexed node search',
    tips: [
      'Must use FULL node type with package prefix: "n8n-nodes-base.slack"',
      'Can search for multiple nodes to find workflows using all of them',
      'Returns templates sorted by popularity (view count)'
    ]
  },
  full: {
    description: `Finds workflow templates that use specific n8n nodes. This is the best way to discover how particular nodes are used in real workflows. Search the community library of 399+ templates by specifying which nodes you want to see in action. Templates are sorted by popularity to show the most useful examples first.`,
    parameters: {
      nodeTypes: {
        type: 'array',
        required: true,
        description: 'Array of node types to search for. Must use full type names with package prefix (e.g., ["n8n-nodes-base.httpRequest", "n8n-nodes-base.openAi"])'
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of templates to return. Default 10, max 100'
      }
    },
    returns: `Returns an object containing:
- templates: Array of matching templates
  - id: Template ID for retrieval
  - name: Template name
  - description: What the workflow does
  - author: Creator details (name, username, verified)
  - nodes: Complete list of nodes used
  - views: View count (popularity metric)
  - created: Creation date
  - url: Link to template on n8n.io
- totalFound: Total number of matching templates
- tip: Usage hints if no results`,
    examples: [
      'list_node_templates({nodeTypes: ["n8n-nodes-base.slack"]}) - Find all Slack workflows',
      'list_node_templates({nodeTypes: ["n8n-nodes-base.httpRequest", "n8n-nodes-base.postgres"]}) - Find workflows using both HTTP and Postgres',
      'list_node_templates({nodeTypes: ["@n8n/n8n-nodes-langchain.openAi"], limit: 20}) - Find AI workflows with OpenAI',
      'list_node_templates({nodeTypes: ["n8n-nodes-base.webhook", "n8n-nodes-base.respondToWebhook"]}) - Find webhook examples'
    ],
    useCases: [
      'Learn how to use specific nodes through examples',
      'Find workflows combining particular integrations',
      'Discover patterns for node combinations',
      'See real-world usage of complex nodes',
      'Find templates for your exact tech stack'
    ],
    performance: `Optimized for node-based searches:
- Indexed by node type for fast lookups
- Query time: <50ms for single node
- Multiple nodes: <100ms (uses AND logic)
- Returns pre-sorted by popularity
- No full-text search needed`,
    bestPractices: [
      'Always use full node type with package prefix',
      'Search for core nodes that define the workflow purpose',
      'Start with single node searches, then refine',
      'Check node types with list_nodes if unsure of names',
      'Review multiple templates to learn different approaches'
    ],
    pitfalls: [
      'Node types must match exactly - no partial matches',
      'Package prefix required: "slack" won\'t work, use "n8n-nodes-base.slack"',
      'Some nodes have version numbers: "n8n-nodes-base.httpRequestV3"',
      'Templates may use old node versions not in current n8n',
      'AND logic means all specified nodes must be present'
    ],
    relatedTools: ['get_template', 'search_templates', 'get_templates_for_task', 'list_nodes']
  }
};