import { ToolDocumentation } from '../types';

export const getNodeDocumentationDoc: ToolDocumentation = {
  name: 'get_node_documentation',
  category: 'configuration',
  essentials: {
    description: 'Get readable docs with examples/auth/patterns. Better than raw schema! 87% coverage. Format: "nodes-base.slack"',
    keyParameters: ['nodeType'],
    example: 'get_node_documentation({nodeType: "nodes-base.slack"})',
    performance: 'Fast - pre-parsed',
    tips: [
      '87% coverage',
      'Includes auth examples',
      'Human-readable format'
    ]
  },
  full: {
    description: 'Returns human-readable documentation parsed from n8n-docs including examples, authentication setup, and common patterns. More useful than raw schema for understanding node usage.',
    parameters: {
      nodeType: { type: 'string', required: true, description: 'Full node type with prefix (e.g., "nodes-base.slack")' }
    },
    returns: 'Parsed markdown documentation with examples, authentication guides, common patterns',
    examples: [
      'get_node_documentation({nodeType: "nodes-base.slack"}) - Slack usage guide',
      'get_node_documentation({nodeType: "nodes-base.googleSheets"}) - Sheets examples'
    ],
    useCases: [
      'Understanding authentication setup',
      'Finding usage examples',
      'Learning common patterns'
    ],
    performance: 'Fast - Pre-parsed documentation stored in database',
    bestPractices: [
      'Use for learning node usage',
      'Check coverage with get_database_statistics',
      'Combine with get_node_essentials'
    ],
    pitfalls: [
      'Not all nodes have docs (87% coverage)',
      'May be outdated for new features',
      'Requires full node type prefix'
    ],
    relatedTools: ['get_node_info', 'get_node_essentials', 'search_nodes']
  }
};