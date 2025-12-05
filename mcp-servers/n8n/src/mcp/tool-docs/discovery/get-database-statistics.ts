import { ToolDocumentation } from '../types';

export const getDatabaseStatisticsDoc: ToolDocumentation = {
  name: 'get_database_statistics',
  category: 'discovery',
  essentials: {
    description: 'Returns database health metrics and node inventory. Shows 525 total nodes, 263 AI-capable nodes, 104 triggers, with 87% documentation coverage. Primary use: verify MCP connection is working correctly.',
    keyParameters: [],
    example: 'get_database_statistics()',
    performance: 'Instant',
    tips: [
      'First tool to call when testing MCP connection',
      'Shows exact counts for all node categories',
      'Documentation coverage indicates data quality'
    ]
  },
  full: {
    description: 'Returns comprehensive database statistics showing the complete inventory of n8n nodes, their categories, documentation coverage, and package distribution. Essential for verifying MCP connectivity and understanding available resources.',
    parameters: {},
    returns: `Object containing:
{
  "total_nodes": 525,              // All nodes in database
  "nodes_with_properties": 520,    // Nodes with extracted properties (99%)
  "nodes_with_operations": 334,    // Nodes with multiple operations (64%)
  "ai_tools": 263,                 // AI-capable nodes
  "triggers": 104,                 // Workflow trigger nodes
  "documentation_coverage": "87%", // Nodes with official docs
  "packages": {
    "n8n-nodes-base": 456,         // Core n8n nodes
    "@n8n/n8n-nodes-langchain": 69 // AI/LangChain nodes
  },
  "categories": {
    "trigger": 104,
    "transform": 250,
    "output": 45,
    "input": 38,
    "AI": 88
  }
}`,
    examples: [
      'get_database_statistics() - Returns complete statistics object',
      '// Common check:',
      'const stats = get_database_statistics();',
      'if (stats.total_nodes < 500) console.error("Database incomplete!");'
    ],
    useCases: [
      'Verify MCP server is connected and responding',
      'Check if database rebuild is needed (low node count)',
      'Monitor documentation coverage improvements',
      'Validate AI tools availability for workflows',
      'Audit node distribution across packages'
    ],
    performance: 'Instant (<1ms) - Statistics are pre-calculated and cached',
    bestPractices: [
      'Call this first to verify MCP connection before other operations',
      'Check total_nodes >= 500 to ensure complete database',
      'Monitor documentation_coverage for data quality',
      'Use ai_tools count to verify AI capabilities'
    ],
    pitfalls: [
      'Statistics are cached at database build time, not real-time',
      'Won\'t reflect changes until database is rebuilt',
      'Package counts may vary with n8n version updates'
    ],
    relatedTools: ['list_nodes for detailed node listing', 'list_ai_tools for AI nodes', 'n8n_health_check for API connectivity']
  }
};