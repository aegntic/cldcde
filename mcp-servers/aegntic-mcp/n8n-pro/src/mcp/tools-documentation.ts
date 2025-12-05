interface ToolDocumentation {
  name: string;
  category: string;
  essentials: {
    description: string;
    keyParameters: string[];
    example: string;
    performance: string;
    tips: string[];
  };
  full: {
    description: string;
    parameters: Record<string, { type: string; description: string; required?: boolean }>;
    returns: string;
    examples: string[];
    useCases: string[];
    performance: string;
    bestPractices: string[];
    pitfalls: string[];
    relatedTools: string[];
  };
}

export const toolsDocumentation: Record<string, ToolDocumentation> = {
  search_nodes: {
    name: 'search_nodes',
    category: 'discovery',
    essentials: {
      description: 'Search for n8n nodes by keyword across names, descriptions, and categories',
      keyParameters: ['query', 'limit'],
      example: 'search_nodes({query: "slack", limit: 10})',
      performance: 'Fast - uses indexed full-text search',
      tips: [
        'Uses OR logic - "send slack" finds nodes with ANY of these words',
        'Single words are more precise than phrases'
      ]
    },
    full: {
      description: 'Performs full-text search across all n8n nodes using indexed search. Returns nodes matching ANY word in the query (OR logic). Searches through node names, display names, descriptions, and categories.',
      parameters: {
        query: { type: 'string', description: 'Search terms (words are ORed together)', required: true },
        limit: { type: 'number', description: 'Maximum results to return (default: 20)', required: false }
      },
      returns: 'Array of nodes with nodeType, displayName, description, category, and relevance score',
      examples: [
        'search_nodes({query: "slack"}) - Find all Slack-related nodes',
        'search_nodes({query: "webhook trigger", limit: 5}) - Find nodes with "webhook" OR "trigger"',
        'search_nodes({query: "ai"}) - Find AI-related nodes'
      ],
      useCases: [
        'Finding nodes for specific integrations',
        'Discovering available functionality',
        'Exploring nodes by keyword when exact name unknown'
      ],
      performance: 'Very fast - uses SQLite FTS5 full-text index. Typically <50ms even for complex queries.',
      bestPractices: [
        'Use single words for precise matches',
        'Try different variations if first search fails',
        'Use list_nodes for browsing by category',
        'Remember it\'s OR logic, not AND'
      ],
      pitfalls: [
        'Multi-word queries may return too many results',
        'Doesn\'t search in node properties or operations',
        'Case-insensitive but doesn\'t handle typos'
      ],
      relatedTools: ['list_nodes', 'get_node_essentials', 'get_node_info']
    }
  },

  get_node_essentials: {
    name: 'get_node_essentials',
    category: 'configuration',
    essentials: {
      description: 'Get only the most important 10-20 properties for a node with examples',
      keyParameters: ['nodeType'],
      example: 'get_node_essentials("n8n-nodes-base.slack")',
      performance: 'Very fast - returns <5KB instead of 100KB+',
      tips: [
        'Use this instead of get_node_info for 95% of cases',
        'Includes working examples for common operations'
      ]
    },
    full: {
      description: 'Returns a curated set of essential properties for a node, typically 10-20 most commonly used properties. Includes working examples and is 95% smaller than get_node_info. Designed for efficient node configuration.',
      parameters: {
        nodeType: { type: 'string', description: 'Full node type (e.g., "n8n-nodes-base.slack")', required: true }
      },
      returns: 'Object with node info, essential properties, examples, and common patterns',
      examples: [
        'get_node_essentials("n8n-nodes-base.httpRequest") - Get HTTP request essentials',
        'get_node_essentials("n8n-nodes-base.webhook") - Get webhook configuration',
        'get_node_essentials("n8n-nodes-base.slack") - Get Slack essentials'
      ],
      useCases: [
        'Quickly configuring nodes without information overload',
        'Getting working examples for immediate use',
        'Understanding the most important node options',
        'Building workflows efficiently'
      ],
      performance: 'Extremely fast - returns pre-filtered data. Response size <5KB vs 100KB+ for full node info.',
      bestPractices: [
        'Always try this before get_node_info',
        'Use included examples as starting points',
        'Check commonPatterns for typical configurations',
        'Combine with validate_node_minimal for quick validation'
      ],
      pitfalls: [
        'May not include rarely-used properties',
        'Some advanced options might be missing',
        'Use search_node_properties if specific property not found'
      ],
      relatedTools: ['get_node_info', 'search_node_properties', 'validate_node_minimal']
    }
  },

  list_nodes: {
    name: 'list_nodes',
    category: 'discovery',
    essentials: {
      description: 'List all available n8n nodes with optional filtering',
      keyParameters: ['category', 'limit', 'onlyTriggers'],
      example: 'list_nodes({category: "communication", limit: 20})',
      performance: 'Fast - direct database query',
      tips: [
        'Great for browsing nodes by category',
        'Use onlyTriggers:true to find workflow starters'
      ]
    },
    full: {
      description: 'Lists all available n8n nodes with comprehensive filtering options. Can filter by category, package, trigger status, and more. Returns complete node metadata.',
      parameters: {
        category: { type: 'string', description: 'Filter by category (e.g., "communication", "data")', required: false },
        limit: { type: 'number', description: 'Maximum results (default: 50)', required: false },
        offset: { type: 'number', description: 'Pagination offset', required: false },
        onlyTriggers: { type: 'boolean', description: 'Only show trigger nodes', required: false },
        onlyAITools: { type: 'boolean', description: 'Only show AI-capable nodes', required: false },
        package: { type: 'string', description: 'Filter by package name', required: false }
      },
      returns: 'Array of nodes with complete metadata including type, name, description, category',
      examples: [
        'list_nodes() - Get first 50 nodes',
        'list_nodes({category: "trigger"}) - All trigger nodes',
        'list_nodes({onlyAITools: true}) - Nodes marked as AI tools',
        'list_nodes({package: "n8n-nodes-base", limit: 100}) - Core nodes'
      ],
      useCases: [
        'Browsing available nodes by category',
        'Finding all triggers or webhooks',
        'Discovering AI-capable nodes',
        'Getting overview of available integrations'
      ],
      performance: 'Fast - uses indexed queries. Returns in <100ms even for large result sets.',
      bestPractices: [
        'Use categories for focused browsing',
        'Combine with search_nodes for keyword search',
        'Use pagination for large result sets',
        'Check onlyTriggers for workflow starting points'
      ],
      pitfalls: [
        'No text search - use search_nodes for that',
        'Categories are predefined, not all nodes have them',
        'Large result sets without limit can be overwhelming'
      ],
      relatedTools: ['search_nodes', 'list_ai_tools', 'get_node_essentials']
    }
  },

  validate_node_minimal: {
    name: 'validate_node_minimal',
    category: 'validation',
    essentials: {
      description: 'Quick validation checking only required fields',
      keyParameters: ['nodeType', 'config'],
      example: 'validate_node_minimal("n8n-nodes-base.slack", {resource: "message", operation: "post"})',
      performance: 'Very fast - minimal checks only',
      tips: [
        'Use for quick validation during configuration',
        'Follow up with validate_node_operation for full validation'
      ]
    },
    full: {
      description: 'Performs minimal validation checking only required fields. Fastest validation option, perfect for iterative configuration. Checks if all required fields are present without complex dependency validation.',
      parameters: {
        nodeType: { type: 'string', description: 'Full node type', required: true },
        config: { type: 'object', description: 'Node configuration to validate', required: true }
      },
      returns: 'Object with isValid boolean, missing required fields, and basic feedback',
      examples: [
        'validate_node_minimal("n8n-nodes-base.httpRequest", {url: "https://api.example.com"})',
        'validate_node_minimal("n8n-nodes-base.slack", {resource: "message", operation: "post", channel: "general"})'
      ],
      useCases: [
        'Quick validation during iterative configuration',
        'Checking if minimum requirements are met',
        'Fast feedback loop while building',
        'Pre-validation before full check'
      ],
      performance: 'Extremely fast - only checks required fields. Typically <10ms.',
      bestPractices: [
        'Use during configuration for quick feedback',
        'Follow with validate_node_operation for complete validation',
        'Great for iterative development',
        'Combine with get_node_essentials for requirements'
      ],
      pitfalls: [
        'Doesn\'t check field dependencies',
        'Won\'t catch configuration conflicts',
        'Missing optional but recommended fields'
      ],
      relatedTools: ['validate_node_operation', 'get_node_essentials', 'validate_workflow']
    }
  },

  validate_node_operation: {
    name: 'validate_node_operation',
    category: 'validation',
    essentials: {
      description: 'Full validation with operation-aware checking and helpful suggestions',
      keyParameters: ['nodeType', 'config', 'profile'],
      example: 'validate_node_operation("n8n-nodes-base.slack", {resource: "message", operation: "post", channel: "general"})',
      performance: 'Moderate - comprehensive validation',
      tips: [
        'Provides specific error messages and fixes',
        'Use "strict" profile for production workflows'
      ]
    },
    full: {
      description: 'Comprehensive validation that understands operation-specific requirements. Checks dependencies, validates field values, and provides helpful suggestions for fixing issues.',
      parameters: {
        nodeType: { type: 'string', description: 'Full node type', required: true },
        config: { type: 'object', description: 'Complete node configuration', required: true },
        profile: { type: 'string', description: 'Validation profile: "development" or "strict"', required: false }
      },
      returns: 'Detailed validation results with errors, warnings, suggestions, and fixes',
      examples: [
        'validate_node_operation("n8n-nodes-base.httpRequest", {method: "POST", url: "{{$json.url}}", bodyParametersUi: {...}})',
        'validate_node_operation("n8n-nodes-base.postgres", {operation: "executeQuery", query: "SELECT * FROM users"}, "strict")'
      ],
      useCases: [
        'Final validation before deployment',
        'Understanding complex field dependencies',
        'Getting suggestions for configuration improvements',
        'Validating operation-specific requirements'
      ],
      performance: 'Moderate speed - performs comprehensive checks. 50-200ms depending on complexity.',
      bestPractices: [
        'Use after validate_node_minimal passes',
        'Apply suggested fixes from response',
        'Use strict profile for production',
        'Check warnings even if validation passes'
      ],
      pitfalls: [
        'Slower than minimal validation',
        'May be overkill for simple configurations',
        'Strict profile might be too restrictive for development'
      ],
      relatedTools: ['validate_node_minimal', 'validate_workflow', 'get_property_dependencies']
    }
  },

  get_node_for_task: {
    name: 'get_node_for_task',
    category: 'templates',
    essentials: {
      description: 'Get pre-configured node settings for common tasks',
      keyParameters: ['task'],
      example: 'get_node_for_task("send_slack_message")',
      performance: 'Instant - returns pre-built configurations',
      tips: [
        'Use list_tasks() to see all available tasks',
        'Look for userMustProvide fields to complete'
      ]
    },
    full: {
      description: 'Returns pre-configured node settings for common automation tasks. Each template includes the correct node type, operation settings, and clear markers for what needs user input.',
      parameters: {
        task: { type: 'string', description: 'Task identifier (use list_tasks to see all)', required: true }
      },
      returns: 'Complete node configuration with parameters, position, and user guidance',
      examples: [
        'get_node_for_task("send_slack_message") - Slack message template',
        'get_node_for_task("receive_webhook") - Webhook trigger setup',
        'get_node_for_task("query_database") - Database query template'
      ],
      useCases: [
        'Quickly setting up common automation patterns',
        'Learning correct node configurations',
        'Avoiding configuration mistakes',
        'Rapid workflow prototyping'
      ],
      performance: 'Instant - returns static templates. No computation required.',
      bestPractices: [
        'Check userMustProvide fields for required inputs',
        'Use list_tasks() to discover available templates',
        'Validate with validate_node_minimal after filling in',
        'Use as starting point, then customize'
      ],
      pitfalls: [
        'Templates are generic - customize for specific needs',
        'Not all tasks have templates',
        'Some fields marked userMustProvide are critical'
      ],
      relatedTools: ['list_tasks', 'get_node_essentials', 'validate_node_minimal']
    }
  },

  n8n_create_workflow: {
    name: 'n8n_create_workflow',
    category: 'workflow_management',
    essentials: {
      description: 'Create a new workflow in n8n via API',
      keyParameters: ['name', 'nodes', 'connections'],
      example: 'n8n_create_workflow({name: "My Workflow", nodes: [...], connections: {...}})',
      performance: 'API call - depends on n8n instance',
      tips: [
        'ALWAYS use node names in connections, never IDs',
        'Requires N8N_API_URL and N8N_API_KEY configuration'
      ]
    },
    full: {
      description: 'Creates a new workflow in your n8n instance via API. Requires proper API configuration. Returns the created workflow with assigned ID.',
      parameters: {
        name: { type: 'string', description: 'Workflow name', required: true },
        nodes: { type: 'array', description: 'Array of node configurations', required: true },
        connections: { type: 'object', description: 'Node connections (use names!)', required: true },
        settings: { type: 'object', description: 'Workflow settings', required: false },
        tags: { type: 'array', description: 'Tag IDs (not names)', required: false }
      },
      returns: 'Created workflow object with id, name, nodes, connections, and metadata',
      examples: [
        `n8n_create_workflow({
  name: "Slack Notification",
  nodes: [
    {id: "1", name: "Webhook", type: "n8n-nodes-base.webhook", position: [250, 300]},
    {id: "2", name: "Slack", type: "n8n-nodes-base.slack", position: [450, 300], parameters: {...}}
  ],
  connections: {
    "Webhook": {main: [[{node: "Slack", type: "main", index: 0}]]}
  }
})`
      ],
      useCases: [
        'Deploying workflows programmatically',
        'Automating workflow creation',
        'Migrating workflows between instances',
        'Creating workflows from templates'
      ],
      performance: 'Depends on n8n instance and network. Typically 100-500ms.',
      bestPractices: [
        'CRITICAL: Use node NAMES in connections, not IDs',
        'Validate workflow before creating',
        'Use meaningful workflow names',
        'Check n8n_health_check before creating',
        'Handle API errors gracefully'
      ],
      pitfalls: [
        'Using node IDs in connections breaks UI display',
        'Workflow not automatically activated',
        'Tags must exist (use tag IDs not names)',
        'API must be configured correctly'
      ],
      relatedTools: ['validate_workflow', 'n8n_update_partial_workflow', 'n8n_list_workflows']
    }
  },

  n8n_update_partial_workflow: {
    name: 'n8n_update_partial_workflow',
    category: 'workflow_management',
    essentials: {
      description: 'Update workflows using diff operations - only send changes, not entire workflow',
      keyParameters: ['id', 'operations'],
      example: 'n8n_update_partial_workflow({id: "123", operations: [{type: "updateNode", nodeId: "Slack", updates: {...}}]})',
      performance: '80-90% more efficient than full updates',
      tips: [
        'Maximum 5 operations per request',
        'Can reference nodes by name or ID'
      ]
    },
    full: {
      description: 'Update existing workflows using diff operations. Much more efficient than full updates as it only sends the changes. Supports 13 different operation types.',
      parameters: {
        id: { type: 'string', description: 'Workflow ID to update', required: true },
        operations: { type: 'array', description: 'Array of diff operations (max 5)', required: true },
        validateOnly: { type: 'boolean', description: 'Only validate without applying', required: false }
      },
      returns: 'Updated workflow with applied changes and operation results',
      examples: [
        `// Update node parameters
n8n_update_partial_workflow({
  id: "123",
  operations: [{
    type: "updateNode",
    nodeId: "Slack",
    updates: {parameters: {channel: "general"}}
  }]
})`,
        `// Add connection between nodes
n8n_update_partial_workflow({
  id: "123",
  operations: [{
    type: "addConnection",
    from: "HTTP Request",
    to: "Slack",
    fromOutput: "main",
    toInput: "main"
  }]
})`
      ],
      useCases: [
        'Updating node configurations',
        'Adding/removing connections',
        'Enabling/disabling nodes',
        'Moving nodes in canvas',
        'Updating workflow metadata'
      ],
      performance: 'Very efficient - only sends changes. 80-90% less data than full updates.',
      bestPractices: [
        'Batch related operations together',
        'Use validateOnly:true to test first',
        'Reference nodes by name for clarity',
        'Keep under 5 operations per request',
        'Check operation results for success'
      ],
      pitfalls: [
        'Maximum 5 operations per request',
        'Some operations have dependencies',
        'Node must exist for update operations',
        'Connection nodes must both exist'
      ],
      relatedTools: ['n8n_get_workflow', 'n8n_update_full_workflow', 'validate_workflow']
    }
  }
};

export function getToolDocumentation(toolName: string, depth: 'essentials' | 'full' = 'essentials'): string {
  const tool = toolsDocumentation[toolName];
  if (!tool) {
    return `Tool '${toolName}' not found. Use tools_documentation() to see available tools.`;
  }

  if (depth === 'essentials') {
    const { essentials } = tool;
    return `# ${tool.name}

${essentials.description}

**Example**: ${essentials.example}

**Key parameters**: ${essentials.keyParameters.join(', ')}

**Performance**: ${essentials.performance}

**Tips**:
${essentials.tips.map(tip => `- ${tip}`).join('\n')}

For full documentation, use: tools_documentation({topic: "${toolName}", depth: "full"})`;
  }

  // Full documentation
  const { full } = tool;
  return `# ${tool.name}

${full.description}

## Parameters
${Object.entries(full.parameters).map(([param, info]) => 
  `- **${param}** (${info.type}${info.required ? ', required' : ''}): ${info.description}`
).join('\n')}

## Returns
${full.returns}

## Examples
${full.examples.map(ex => `\`\`\`javascript\n${ex}\n\`\`\``).join('\n\n')}

## Common Use Cases
${full.useCases.map(uc => `- ${uc}`).join('\n')}

## Performance
${full.performance}

## Best Practices
${full.bestPractices.map(bp => `- ${bp}`).join('\n')}

## Common Pitfalls
${full.pitfalls.map(p => `- ${p}`).join('\n')}

## Related Tools
${full.relatedTools.map(t => `- ${t}`).join('\n')}`;
}

export function getToolsOverview(depth: 'essentials' | 'full' = 'essentials'): string {
  if (depth === 'essentials') {
    return `# n8n MCP Tools Quick Reference

Welcome! Here's how to efficiently work with n8n nodes:

## Essential Workflow
1. **Find**: search_nodes({query: "slack"})
2. **Configure**: get_node_essentials("n8n-nodes-base.slack")  
3. **Validate**: validate_node_minimal() → validate_node_operation()
4. **Deploy**: n8n_create_workflow() (if API configured)

## Key Tips
- Always use get_node_essentials instead of get_node_info (95% smaller!)
- Use node NAMES in connections, never IDs
- Try get_node_for_task() for common patterns
- Call validate_node_minimal() for quick checks

## Get Help
- tools_documentation({topic: "search_nodes"}) - Get help for specific tool
- tools_documentation({topic: "overview", depth: "full"}) - See complete guide
- list_tasks() - See available task templates

Available tools: ${Object.keys(toolsDocumentation).join(', ')}`;
  }

  // Full overview
  return `# n8n MCP Tools Complete Guide

## Overview
The n8n MCP provides 39 tools to help you discover, configure, validate, and deploy n8n workflows. Tools are organized into categories for easy discovery.

## Tool Categories

### Discovery Tools
- **search_nodes**: Find nodes by keyword (uses OR logic)
- **list_nodes**: Browse nodes by category, package, or type
- **list_ai_tools**: See all AI-capable nodes (263 available)

### Configuration Tools  
- **get_node_essentials**: Get key properties only (<5KB vs 100KB+)
- **get_node_info**: Get complete node details (use sparingly)
- **search_node_properties**: Find specific properties in large nodes
- **get_property_dependencies**: Understand field relationships

### Validation Tools
- **validate_node_minimal**: Quick required field check
- **validate_node_operation**: Full operation-aware validation
- **validate_workflow**: Complete workflow validation
- **validate_workflow_connections**: Check node connections
- **validate_workflow_expressions**: Validate n8n expressions

### Task & Template Tools
- **list_tasks**: See available task templates
- **get_node_for_task**: Get pre-configured nodes
- **list_node_templates**: Find workflow templates
- **search_templates**: Search template library

### Workflow Management (requires API config)
- **n8n_create_workflow**: Create new workflows
- **n8n_update_partial_workflow**: Efficient diff-based updates
- **n8n_update_full_workflow**: Replace entire workflow
- **n8n_list_workflows**: List workflows with filtering

## Recommended Patterns

### Building a Simple Workflow
\`\`\`javascript
// 1. Find what you need
search_nodes({query: "webhook"})
search_nodes({query: "slack"})

// 2. Get configurations
get_node_essentials("n8n-nodes-base.webhook")
get_node_essentials("n8n-nodes-base.slack")

// 3. Build and validate
const workflow = {
  name: "My Webhook to Slack",
  nodes: [...],
  connections: {"Webhook": {main: [[{node: "Slack", type: "main", index: 0}]]}}
};
validate_workflow(workflow)

// 4. Deploy (if API configured)
n8n_create_workflow(workflow)
\`\`\`

### Using AI Tools
Any node can be an AI tool! Connect it to an AI Agent's ai_tool port:
\`\`\`javascript
get_node_as_tool_info("n8n-nodes-base.slack")
// Returns how to configure Slack as an AI tool
\`\`\`

### Efficient Updates
Use partial updates to save 80-90% bandwidth:
\`\`\`javascript
n8n_update_partial_workflow({
  id: "workflow-id",
  operations: [
    {type: "updateNode", nodeId: "Slack", updates: {parameters: {channel: "general"}}}
  ]
})
\`\`\`

## Performance Guide
- **Fastest**: get_node_essentials, validate_node_minimal, list_tasks
- **Fast**: search_nodes, list_nodes, get_node_for_task  
- **Moderate**: validate_node_operation, n8n_update_partial_workflow
- **Slow**: get_node_info (100KB+), validate_workflow (full analysis)

## Common Pitfalls to Avoid
1. Using get_node_info when get_node_essentials would work
2. Using node IDs instead of names in connections
3. Not validating before creating workflows
4. Searching with long phrases instead of keywords
5. Forgetting to configure N8N_API_URL for management tools

## Getting More Help
- Use tools_documentation({topic: "toolname"}) for any tool
- Check CLAUDE.md for latest updates and examples
- Run n8n_health_check() to verify API connectivity`;
}

export function searchToolDocumentation(query: string): string[] {
  const results: string[] = [];
  const searchTerms = query.toLowerCase().split(' ');
  
  for (const [toolName, tool] of Object.entries(toolsDocumentation)) {
    const searchText = `${toolName} ${tool.essentials.description} ${tool.category}`.toLowerCase();
    if (searchTerms.some(term => searchText.includes(term))) {
      results.push(toolName);
    }
  }
  
  return results;
}

export function getToolsByCategory(category: string): string[] {
  return Object.entries(toolsDocumentation)
    .filter(([_, tool]) => tool.category === category)
    .map(([name, _]) => name);
}

export function getAllCategories(): string[] {
  const categories = new Set<string>();
  Object.values(toolsDocumentation).forEach(tool => {
    categories.add(tool.category);
  });
  return Array.from(categories);
}