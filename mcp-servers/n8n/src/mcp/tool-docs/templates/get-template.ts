import { ToolDocumentation } from '../types';

export const getTemplateDoc: ToolDocumentation = {
  name: 'get_template',
  category: 'templates',
  essentials: {
    description: 'Get complete workflow JSON by ID. Ready to import. IDs from list_node_templates or search_templates.',
    keyParameters: ['templateId'],
    example: 'get_template({templateId: 1234})',
    performance: 'Fast (<100ms) - single database lookup',
    tips: [
      'Get template IDs from list_node_templates or search_templates first',
      'Returns complete workflow JSON ready for import into n8n',
      'Includes all nodes, connections, and settings'
    ]
  },
  full: {
    description: `Retrieves the complete workflow JSON for a specific template by its ID. The returned workflow can be directly imported into n8n through the UI or API. This tool fetches pre-built workflows from the community template library containing 399+ curated workflows.`,
    parameters: {
      templateId: {
        type: 'number',
        required: true,
        description: 'The numeric ID of the template to retrieve. Get IDs from list_node_templates or search_templates'
      }
    },
    returns: `Returns an object containing:
- template: Complete template information including workflow JSON
  - id: Template ID
  - name: Template name
  - description: What the workflow does
  - author: Creator information (name, username, verified status)
  - nodes: Array of node types used
  - views: Number of times viewed
  - created: Creation date
  - url: Link to template on n8n.io
  - workflow: Complete workflow JSON with structure:
    - nodes: Array of node objects (id, name, type, typeVersion, position, parameters)
    - connections: Object mapping source nodes to targets
    - settings: Workflow configuration (timezone, error handling, etc.)
- usage: Instructions for using the workflow`,
    examples: [
      'get_template({templateId: 1234}) - Get Slack notification workflow',
      'get_template({templateId: 5678}) - Get data sync workflow',
      'get_template({templateId: 9012}) - Get AI chatbot workflow'
    ],
    useCases: [
      'Download workflows for direct import into n8n',
      'Study workflow patterns and best practices',
      'Get complete workflow JSON for customization',
      'Clone popular workflows for your use case',
      'Learn how complex automations are built'
    ],
    performance: `Fast performance with single database lookup:
- Query time: <10ms for template retrieval
- Workflow JSON parsing: <50ms
- Total response time: <100ms
- No network calls (uses local cache)`,
    bestPractices: [
      'Always check if template exists before attempting modifications',
      'Review workflow nodes before importing to ensure compatibility',
      'Save template JSON locally if planning multiple customizations',
      'Check template creation date for most recent patterns',
      'Verify all required credentials are configured before import'
    ],
    pitfalls: [
      'Template IDs change when database is refreshed',
      'Some templates may use deprecated node versions',
      'Credentials in templates are placeholders - configure your own',
      'Not all templates work with all n8n versions',
      'Template may reference external services you don\'t have access to'
    ],
    relatedTools: ['list_node_templates', 'search_templates', 'get_templates_for_task', 'n8n_create_workflow']
  }
};