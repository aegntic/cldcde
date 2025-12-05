import { ToolDocumentation } from '../types';

export const n8nGetWorkflowStructureDoc: ToolDocumentation = {
  name: 'n8n_get_workflow_structure',
  category: 'workflow_management',
  essentials: {
    description: 'Get workflow structure: nodes and connections only. No parameter details.',
    keyParameters: ['id'],
    example: 'n8n_get_workflow_structure({id: "workflow_123"})',
    performance: 'Fast (75-150ms)',
    tips: [
      'Shows workflow topology',
      'Node types without parameters',
      'Perfect for visualization'
    ]
  },
  full: {
    description: 'Retrieves workflow structural information including node types, positions, and connections, but without detailed node parameters. Ideal for understanding workflow topology, creating visualizations, or analyzing workflow complexity without the overhead of full parameter data.',
    parameters: {
      id: { type: 'string', required: true, description: 'Workflow ID to retrieve structure for' }
    },
    returns: 'Workflow structure with: id, name, nodes array (id, name, type, position only), connections object. No node parameters, credentials, or settings included.',
    examples: [
      'n8n_get_workflow_structure({id: "abc123"}) - Visualize workflow',
      'const structure = n8n_get_workflow_structure({id: "xyz789"}); // Analyze complexity'
    ],
    useCases: [
      'Generate workflow visualizations',
      'Analyze workflow complexity',
      'Understand node relationships',
      'Create workflow diagrams',
      'Quick topology validation'
    ],
    performance: 'Fast retrieval - typically 75-150ms. Faster than get_workflow as parameters are stripped.',
    bestPractices: [
      'Use for visualization tools',
      'Ideal for workflow analysis',
      'Good for connection validation',
      'Cache for UI diagram rendering'
    ],
    pitfalls: [
      'Requires N8N_API_URL and N8N_API_KEY configured',
      'No parameter data for configuration',
      'Cannot validate node settings',
      'Must use get_workflow for editing'
    ],
    relatedTools: ['n8n_get_workflow', 'n8n_validate_workflow_connections', 'n8n_get_workflow_minimal', 'validate_workflow_connections']
  }
};