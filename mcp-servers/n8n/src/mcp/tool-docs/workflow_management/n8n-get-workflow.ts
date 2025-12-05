import { ToolDocumentation } from '../types';

export const n8nGetWorkflowDoc: ToolDocumentation = {
  name: 'n8n_get_workflow',
  category: 'workflow_management',
  essentials: {
    description: 'Get a workflow by ID. Returns the complete workflow including nodes, connections, and settings.',
    keyParameters: ['id'],
    example: 'n8n_get_workflow({id: "workflow_123"})',
    performance: 'Fast (50-200ms)',
    tips: [
      'Returns complete workflow JSON',
      'Includes all node parameters',
      'Use get_workflow_minimal for faster listings'
    ]
  },
  full: {
    description: 'Retrieves a complete workflow from n8n by its ID. Returns full workflow definition including all nodes with their parameters, connections between nodes, and workflow settings. This is the primary tool for fetching workflows for viewing, editing, or cloning.',
    parameters: {
      id: { type: 'string', required: true, description: 'Workflow ID to retrieve' }
    },
    returns: 'Complete workflow object containing: id, name, active status, nodes array (with full parameters), connections object, settings, createdAt, updatedAt',
    examples: [
      'n8n_get_workflow({id: "abc123"}) - Get workflow for editing',
      'const wf = n8n_get_workflow({id: "xyz789"}); // Clone workflow structure'
    ],
    useCases: [
      'View workflow configuration',
      'Export workflow for backup',
      'Clone workflow structure',
      'Debug workflow issues',
      'Prepare for updates'
    ],
    performance: 'Fast retrieval - typically 50-200ms depending on workflow size. Cached by n8n for performance.',
    bestPractices: [
      'Check workflow exists before updating',
      'Use for complete workflow data needs',
      'Cache results when making multiple operations',
      'Validate after retrieving if modifying'
    ],
    pitfalls: [
      'Requires N8N_API_URL and N8N_API_KEY configured',
      'Returns all data - use minimal/structure for performance',
      'Workflow must exist or returns 404',
      'Credentials are referenced but not included'
    ],
    relatedTools: ['n8n_get_workflow_minimal', 'n8n_get_workflow_structure', 'n8n_update_full_workflow', 'n8n_validate_workflow']
  }
};