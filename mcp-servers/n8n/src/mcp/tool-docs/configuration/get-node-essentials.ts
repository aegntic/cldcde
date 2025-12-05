import { ToolDocumentation } from '../types';

export const getNodeEssentialsDoc: ToolDocumentation = {
  name: 'get_node_essentials',
  category: 'configuration',
  essentials: {
    description: 'Returns only the most commonly-used properties for a node (10-20 fields). Response is 95% smaller than get_node_info (5KB vs 100KB+). Essential properties include required fields, common options, and authentication settings. Use validate_node_operation for working configurations.',
    keyParameters: ['nodeType'],
    example: 'get_node_essentials({nodeType: "nodes-base.slack"})',
    performance: '<10ms, ~5KB response',
    tips: [
      'Always use this before get_node_info',
      'Use validate_node_operation for examples',
      'Perfect for understanding node structure'
    ]
  },
  full: {
    description: 'Returns a curated subset of node properties focusing on the most commonly-used fields. Essential properties are hand-picked for each node type and include: required fields, primary operations, authentication options, and the most frequent configuration patterns. NOTE: Examples have been removed to avoid confusion - use validate_node_operation to get working configurations with proper validation.',
    parameters: {
      nodeType: { type: 'string', description: 'Full node type with prefix, e.g., "nodes-base.slack", "nodes-base.httpRequest"', required: true }
    },
    returns: `Object containing:
{
  "nodeType": "nodes-base.slack",
  "displayName": "Slack",
  "description": "Consume Slack API",
  "category": "output",
  "version": "2.3",
  "requiredProperties": [],  // Most nodes have no strictly required fields
  "commonProperties": [
    {
      "name": "resource",
      "displayName": "Resource",
      "type": "options",
      "options": ["channel", "message", "user"],
      "default": "message"
    },
    {
      "name": "operation",
      "displayName": "Operation", 
      "type": "options",
      "options": ["post", "update", "delete"],
      "default": "post"
    },
    // ... 10-20 most common properties
  ],
  "operations": [
    {"name": "Post", "description": "Post a message"},
    {"name": "Update", "description": "Update a message"}
  ],
  "metadata": {
    "totalProperties": 121,
    "isAITool": false,
    "hasCredentials": true
  }
}`,
    examples: [
      'get_node_essentials({nodeType: "nodes-base.httpRequest"}) - HTTP configuration basics',
      'get_node_essentials({nodeType: "nodes-base.slack"}) - Slack messaging essentials',
      'get_node_essentials({nodeType: "nodes-base.googleSheets"}) - Sheets operations',
      '// Workflow: search → essentials → validate',
      'const nodes = search_nodes({query: "database"});',
      'const mysql = get_node_essentials({nodeType: "nodes-base.mySql"});',
      'validate_node_operation("nodes-base.mySql", {operation: "select"}, "minimal");'
    ],
    useCases: [
      'Quickly understand node structure without information overload',
      'Identify which properties are most important',
      'Learn node basics before diving into advanced features',
      'Build workflows faster with curated property sets'
    ],
    performance: '<10ms response time, ~5KB payload (vs 100KB+ for full schema)',
    bestPractices: [
      'Always start with essentials, only use get_node_info if needed',
      'Use validate_node_operation to get working configurations',
      'Check authentication requirements first',
      'Use search_node_properties if specific property not in essentials'
    ],
    pitfalls: [
      'Advanced properties not included - use get_node_info for complete schema',
      'Node-specific validators may require additional fields',
      'Some nodes have 50+ properties, essentials shows only top 10-20'
    ],
    relatedTools: ['get_node_info for complete schema', 'search_node_properties for finding specific fields', 'validate_node_minimal to check configuration']
  }
};