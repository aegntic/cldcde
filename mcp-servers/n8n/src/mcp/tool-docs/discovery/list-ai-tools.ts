import { ToolDocumentation } from '../types';

export const listAiToolsDoc: ToolDocumentation = {
  name: 'list_ai_tools',
  category: 'discovery',
  essentials: {
    description: 'Returns 263 nodes with built-in AI features. CRITICAL: Any of the 525 n8n nodes can be used as an AI tool by connecting it to an AI Agent node\'s tool port. This list only shows nodes with AI-specific features, not all usable nodes.',
    keyParameters: [],
    example: 'list_ai_tools()',
    performance: 'Instant (cached)',
    tips: [
      'ANY node can be an AI tool - not limited to this list',
      'Connect Slack, Database, HTTP Request, etc. to AI Agent tool port',
      'Use get_node_as_tool_info for guidance on any node'
    ]
  },
  full: {
    description: 'Lists 263 nodes that have built-in AI capabilities or are optimized for AI workflows. IMPORTANT: This is NOT a complete list of nodes usable as AI tools. Any of the 525 n8n nodes can be connected to an AI Agent node\'s tool port to function as an AI tool. This includes Slack, Google Sheets, databases, HTTP requests, and more.',
    parameters: {},
    returns: 'Array of 263 AI-optimized nodes including: OpenAI (GPT-3/4), Anthropic (Claude), Google AI (Gemini/PaLM), Cohere, HuggingFace, Pinecone, Qdrant, Supabase Vector Store, LangChain nodes, embeddings processors, vector stores, chat models, and AI-specific utilities. Each entry includes nodeType, displayName, and AI-specific capabilities.',
    examples: [
      'list_ai_tools() - Returns all 263 AI-optimized nodes',
      '// To use ANY node as AI tool:',
      '// 1. Add any node (e.g., Slack, MySQL, HTTP Request)',  
      '// 2. Connect it to AI Agent node\'s "Tool" input port',
      '// 3. The AI agent can now use that node\'s functionality'
    ],
    useCases: [
      'Discover AI model integrations (OpenAI, Anthropic, Google AI)',
      'Find vector databases for RAG applications',
      'Locate embedding generators and processors',
      'Build AI agent tool chains with ANY n8n node'
    ],
    performance: 'Instant - results are pre-cached in memory',
    bestPractices: [
      'Remember: ANY node works as an AI tool when connected to AI Agent',
      'Common non-AI nodes used as tools: Slack (messaging), Google Sheets (data), HTTP Request (APIs), Code (custom logic)',
      'For community nodes: set N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true'
    ],
    pitfalls: [
      'This list is NOT exhaustive - it only shows nodes with AI-specific features',
      'Don\'t limit yourself to this list when building AI workflows',
      'Community nodes require environment variable to work as tools'
    ],
    relatedTools: ['get_node_as_tool_info for any node usage', 'search_nodes to find specific nodes', 'get_node_essentials to configure nodes']
  }
};