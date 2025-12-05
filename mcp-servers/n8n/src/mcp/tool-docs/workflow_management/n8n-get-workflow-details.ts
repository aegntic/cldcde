import { ToolDocumentation } from '../types';

export const n8nGetWorkflowDetailsDoc: ToolDocumentation = {
  name: 'n8n_get_workflow_details',
  category: 'workflow_management',
  essentials: {
    description: 'Get workflow details with metadata, version, execution stats. More info than get_workflow.',
    keyParameters: ['id'],
    example: 'n8n_get_workflow_details({id: "workflow_123"})',
    performance: 'Fast (100-300ms)',
    tips: [
      'Includes execution statistics',
      'Shows version history info',
      'Contains metadata like tags'
    ]
  },
  full: {
    description: 'Retrieves comprehensive workflow details including metadata, execution statistics, version information, and usage analytics. Provides more information than get_workflow, including data not typically needed for editing but useful for monitoring and analysis.',
    parameters: {
      id: { type: 'string', required: true, description: 'Workflow ID to retrieve details for' }
    },
    returns: 'Extended workflow object with: id, name, nodes, connections, settings, plus metadata (tags, owner, shared users), execution stats (success/error counts, average runtime), version info, created/updated timestamps',
    examples: [
      'n8n_get_workflow_details({id: "abc123"}) - Get workflow with stats',
      'const details = n8n_get_workflow_details({id: "xyz789"}); // Analyze performance'
    ],
    useCases: [
      'Monitor workflow performance',
      'Analyze execution patterns',
      'View workflow metadata',
      'Check version information',
      'Audit workflow usage'
    ],
    performance: 'Slightly slower than get_workflow due to additional metadata - typically 100-300ms. Stats may be cached.',
    bestPractices: [
      'Use for monitoring and analysis',
      'Check execution stats before optimization',
      'Review error counts for debugging',
      'Monitor average execution times'
    ],
    pitfalls: [
      'Requires N8N_API_URL and N8N_API_KEY configured',
      'More data than needed for simple edits',
      'Stats may have slight delay',
      'Not all n8n versions support all fields'
    ],
    relatedTools: ['n8n_get_workflow', 'n8n_list_executions', 'n8n_get_execution', 'n8n_list_workflows']
  }
};