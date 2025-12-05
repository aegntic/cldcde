import { ToolDocumentation } from '../types';

export const listNodesDoc: ToolDocumentation = {
  name: 'list_nodes',
  category: 'discovery',
  essentials: {
    description: 'Lists n8n nodes with filtering options. Returns up to 525 total nodes. Default limit is 50, use limit:200 to get all nodes. Filter by category to find specific node types like triggers (104 nodes) or AI nodes (263 nodes).',
    keyParameters: ['category', 'package', 'limit', 'isAITool'],
    example: 'list_nodes({limit:200})',
    performance: '<10ms for any query size',
    tips: [
      'Use limit:200 to get all 525 nodes',
      'Categories: trigger (104), transform (250+), output/input (50+)',
      'Use search_nodes for keyword search'
    ]
  },
  full: {
    description: 'Lists n8n nodes with comprehensive filtering options. Returns an array of node metadata including type, name, description, and category. Database contains 525 total nodes: 456 from n8n-nodes-base package and 69 from @n8n/n8n-nodes-langchain package.',
    parameters: {
      category: { type: 'string', description: 'Filter by category: "trigger" (104 nodes), "transform" (250+ nodes), "output", "input", or "AI"', required: false },
      package: { type: 'string', description: 'Filter by package: "n8n-nodes-base" (456 core nodes) or "@n8n/n8n-nodes-langchain" (69 AI nodes)', required: false },
      limit: { type: 'number', description: 'Maximum results to return. Default: 50. Use 200+ to get all 525 nodes', required: false },
      isAITool: { type: 'boolean', description: 'Filter to show only AI-capable nodes (263 nodes)', required: false },
      developmentStyle: { type: 'string', description: 'Filter by style: "programmatic" or "declarative". Most nodes are programmatic', required: false }
    },
    returns: 'Array of node objects, each containing: nodeType (e.g., "nodes-base.webhook"), displayName (e.g., "Webhook"), description, category, package, isAITool flag',
    examples: [
      'list_nodes({limit:200}) - Returns all 525 nodes',
      'list_nodes({category:"trigger"}) - Returns 104 trigger nodes (Webhook, Schedule, Email Trigger, etc.)',
      'list_nodes({package:"@n8n/n8n-nodes-langchain"}) - Returns 69 AI/LangChain nodes',
      'list_nodes({isAITool:true}) - Returns 263 AI-capable nodes',
      'list_nodes({category:"trigger", isAITool:true}) - Combines filters for AI-capable triggers'
    ],
    useCases: [
      'Browse all available nodes when building workflows',
      'Find all trigger nodes to start workflows',
      'Discover AI/ML nodes for intelligent automation',
      'Check available nodes in specific packages'
    ],
    performance: '<10ms for any query size. Results are cached in memory',
    bestPractices: [
      'Use limit:200 when you need the complete node inventory',
      'Filter by category for focused discovery',
      'Combine with get_node_essentials to configure selected nodes'
    ],
    pitfalls: [
      'No text search capability - use search_nodes for keyword search',
      'developmentStyle filter rarely useful - most nodes are "programmatic"'
    ],
    relatedTools: ['search_nodes for keyword search', 'list_ai_tools for AI-specific discovery', 'get_node_essentials to configure nodes']
  }
};