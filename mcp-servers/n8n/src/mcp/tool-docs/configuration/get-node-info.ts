import { ToolDocumentation } from '../types';

export const getNodeInfoDoc: ToolDocumentation = {
  name: 'get_node_info',
  category: 'configuration',
  essentials: {
    description: 'Returns complete node schema with ALL properties (100KB+ response). Only use when you need advanced properties not in get_node_essentials. Contains 200+ properties for complex nodes like HTTP Request. Requires full prefix like "nodes-base.httpRequest".',
    keyParameters: ['nodeType'],
    example: 'get_node_info({nodeType: "nodes-base.slack"})',
    performance: '100-500ms, 50-500KB response',
    tips: [
      'Try get_node_essentials first (95% smaller)',
      'Use only for advanced configurations',
      'Response may have 200+ properties'
    ]
  },
  full: {
    description: 'Returns the complete JSON schema for a node including all properties, operations, authentication methods, version information, and metadata. Response sizes range from 50KB to 500KB. Use this only when get_node_essentials doesn\'t provide the specific property you need.',
    parameters: {
      nodeType: { type: 'string', required: true, description: 'Full node type with prefix. Examples: "nodes-base.slack", "nodes-base.httpRequest", "nodes-langchain.openAi"' }
    },
    returns: `Complete node object containing:
{
  "displayName": "Slack",
  "name": "slack",
  "type": "nodes-base.slack",
  "typeVersion": 2.2,
  "description": "Consume Slack API",
  "defaults": {"name": "Slack"},
  "inputs": ["main"],
  "outputs": ["main"],
  "credentials": [
    {
      "name": "slackApi",
      "required": true,
      "displayOptions": {...}
    }
  ],
  "properties": [
    // 200+ property definitions including:
    {
      "displayName": "Resource",
      "name": "resource",
      "type": "options",
      "options": ["channel", "message", "user", "file", ...],
      "default": "message"
    },
    {
      "displayName": "Operation", 
      "name": "operation",
      "type": "options",
      "displayOptions": {
        "show": {"resource": ["message"]}
      },
      "options": ["post", "update", "delete", "get", ...],
      "default": "post"
    },
    // ... 200+ more properties with complex conditions
  ],
  "version": 2.2,
  "subtitle": "={{$parameter[\"operation\"] + \": \" + $parameter[\"resource\"]}}",
  "codex": {...},
  "supportedWebhooks": [...]
}`,
    examples: [
      'get_node_info({nodeType: "nodes-base.httpRequest"}) - 300+ properties for HTTP requests',
      'get_node_info({nodeType: "nodes-base.googleSheets"}) - Complex operations and auth',
      '// When to use get_node_info:',
      '// 1. First try essentials',
      'const essentials = get_node_essentials({nodeType: "nodes-base.slack"});',
      '// 2. If property missing, search for it',
      'const props = search_node_properties({nodeType: "nodes-base.slack", query: "thread"});',
      '// 3. Only if needed, get full schema',
      'const full = get_node_info({nodeType: "nodes-base.slack"});'
    ],
    useCases: [
      'Analyzing all available operations for a node',
      'Understanding complex property dependencies',
      'Discovering all authentication methods',
      'Building UI that shows all node options',
      'Debugging property visibility conditions'
    ],
    performance: '100-500ms depending on node complexity. HTTP Request node: ~300KB, Simple nodes: ~50KB',
    bestPractices: [
      'Always try get_node_essentials first - it\'s 95% smaller',
      'Use search_node_properties to find specific advanced properties',
      'Cache results locally - schemas rarely change',
      'Parse incrementally - don\'t load entire response into memory at once'
    ],
    pitfalls: [
      'Response can exceed 500KB for complex nodes',
      'Contains many rarely-used properties that add noise',
      'Property conditions can be deeply nested and complex',
      'Must use full node type with prefix (nodes-base.X not just X)'
    ],
    relatedTools: ['get_node_essentials for common properties', 'search_node_properties to find specific fields', 'get_property_dependencies to understand conditions']
  }
};