import { ToolDocumentation } from '../types';

export const n8nGetWorkflowMinimalDoc: ToolDocumentation = {
  name: 'n8n_get_workflow_minimal',
  category: 'workflow_management',
  essentials: {
    description: 'Get minimal info: ID, name, active status, tags. Fast for listings.',
    keyParameters: ['id'],
    example: 'n8n_get_workflow_minimal({id: "workflow_123"})',
    performance: 'Very fast (<50ms)',
    tips: [
      'Fastest way to check workflow exists',
      'Perfect for status checks',
      'Use in list displays'
    ]
  },
  full: {
    description: 'Retrieves only essential workflow information without nodes or connections. Returns minimal data needed for listings, status checks, and quick lookups. Optimized for performance when full workflow data is not needed.',
    parameters: {
      id: { type: 'string', required: true, description: 'Workflow ID to retrieve minimal info for' }
    },
    returns: 'Minimal workflow object with: id, name, active status, tags array, createdAt, updatedAt. No nodes, connections, or settings included.',
    examples: [
      'n8n_get_workflow_minimal({id: "abc123"}) - Quick existence check',
      'const info = n8n_get_workflow_minimal({id: "xyz789"}); // Check if active'
    ],
    useCases: [
      'Quick workflow existence checks',
      'Display workflow lists',
      'Check active/inactive status',
      'Get workflow tags',
      'Performance-critical operations'
    ],
    performance: 'Extremely fast - typically under 50ms. Returns only database metadata without loading workflow definition.',
    bestPractices: [
      'Use for list displays and dashboards',
      'Ideal for existence checks before operations',
      'Cache results for UI responsiveness',
      'Combine with list_workflows for bulk checks'
    ],
    pitfalls: [
      'Requires N8N_API_URL and N8N_API_KEY configured',
      'No workflow content - cannot edit or validate',
      'Tags may be empty array',
      'Must use get_workflow for actual workflow data'
    ],
    relatedTools: ['n8n_list_workflows', 'n8n_get_workflow', 'n8n_get_workflow_structure', 'n8n_update_partial_workflow']
  }
};