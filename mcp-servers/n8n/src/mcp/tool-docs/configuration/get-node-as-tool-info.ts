import { ToolDocumentation } from '../types';

export const getNodeAsToolInfoDoc: ToolDocumentation = {
  name: 'get_node_as_tool_info',
  category: 'configuration',
  essentials: {
    description: 'Explains how to use ANY node as an AI tool with requirements and examples.',
    keyParameters: ['nodeType'],
    example: 'get_node_as_tool_info({nodeType: "nodes-base.slack"})',
    performance: 'Fast - returns guidance and examples',
    tips: [
      'ANY node can be used as AI tool, not just AI-marked ones',
      'Community nodes need N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true',
      'Provides specific use cases and connection requirements'
    ]
  },
  full: {
    description: `Shows how to use any n8n node as an AI tool in AI Agent workflows. In n8n, ANY node can be connected to an AI Agent's tool port, allowing the AI to use that node's functionality. This tool provides specific guidance, requirements, and examples for using a node as an AI tool.`,
    parameters: {
      nodeType: {
        type: 'string',
        required: true,
        description: 'Full node type WITH prefix: "nodes-base.slack", "nodes-base.googleSheets", etc.',
        examples: [
          'nodes-base.slack',
          'nodes-base.httpRequest',
          'nodes-base.googleSheets',
          'nodes-langchain.documentLoader'
        ]
      }
    },
    returns: `Object containing:
- nodeType: The node's full type identifier
- displayName: Human-readable name
- isMarkedAsAITool: Whether node has usableAsTool property
- aiToolCapabilities: Detailed AI tool usage information including:
  - canBeUsedAsTool: Always true in n8n
  - requiresEnvironmentVariable: For community nodes
  - commonUseCases: Specific AI tool use cases
  - requirements: Connection and environment setup
  - examples: Code examples for common scenarios
  - tips: Best practices for AI tool usage`,
    examples: [
      'get_node_as_tool_info({nodeType: "nodes-base.slack"}) - Get AI tool guidance for Slack',
      'get_node_as_tool_info({nodeType: "nodes-base.httpRequest"}) - Learn to use HTTP Request as AI tool',
      'get_node_as_tool_info({nodeType: "nodes-base.postgres"}) - Database queries as AI tools'
    ],
    useCases: [
      'Understanding how to connect any node to AI Agent',
      'Learning environment requirements for community nodes',
      'Getting specific use case examples for AI tool usage',
      'Checking if a node is optimized for AI usage',
      'Understanding credential requirements for AI tools'
    ],
    performance: 'Very fast - returns pre-computed guidance and examples',
    bestPractices: [
      'Use this before configuring nodes as AI tools',
      'Check environment requirements for community nodes',
      'Review common use cases to understand best applications',
      'Test nodes independently before connecting to AI Agent',
      'Give tools descriptive names in AI Agent configuration'
    ],
    pitfalls: [
      'Community nodes require environment variable to be used as tools',
      'Not all nodes make sense as AI tools (e.g., triggers)',
      'Some nodes require specific credentials configuration',
      'Tool descriptions in AI Agent must be clear and detailed'
    ],
    relatedTools: ['list_ai_tools', 'get_node_essentials', 'validate_node_operation']
  }
};