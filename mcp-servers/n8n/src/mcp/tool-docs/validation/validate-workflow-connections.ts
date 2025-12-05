import { ToolDocumentation } from '../types';

export const validateWorkflowConnectionsDoc: ToolDocumentation = {
  name: 'validate_workflow_connections',
  category: 'validation',
  essentials: {
    description: 'Check workflow connections only: valid nodes, no cycles, proper triggers, AI tool links. Fast structure validation.',
    keyParameters: ['workflow'],
    example: 'validate_workflow_connections({workflow: {nodes: [...], connections: {...}}})',
    performance: 'Fast (<100ms)',
    tips: [
      'Use for quick structure checks when editing connections',
      'Detects orphaned nodes and circular dependencies',
      'Validates AI Agent tool connections to ensure proper node references'
    ]
  },
  full: {
    description: 'Validates only the connection structure of a workflow without checking node configurations or expressions. This focused validation checks that all referenced nodes exist, detects circular dependencies, ensures proper trigger node placement, validates AI tool connections, and identifies orphaned or unreachable nodes.',
    parameters: {
      workflow: { 
        type: 'object', 
        required: true, 
        description: 'The workflow JSON with nodes array and connections object.' 
      }
    },
    returns: 'Object with valid (boolean), errors (array), warnings (array), and statistics about connections',
    examples: [
      'validate_workflow_connections({workflow: myWorkflow}) - Check all connections',
      'validate_workflow_connections({workflow: {nodes: [...], connections: {...}}}) - Validate structure only'
    ],
    useCases: [
      'Quick validation when modifying workflow connections',
      'Ensure all node references in connections are valid',
      'Detect circular dependencies that would cause infinite loops',
      'Validate AI Agent nodes have proper tool connections',
      'Check workflow has at least one trigger node',
      'Find orphaned nodes not connected to any flow'
    ],
    performance: 'Fast (<100ms). Only validates structure, not node content. Scales linearly with connection count.',
    bestPractices: [
      'Run after adding or removing connections',
      'Use before validate_workflow for quick structural checks',
      'Check for warnings about orphaned nodes',
      'Ensure trigger nodes are properly positioned',
      'Validate after using n8n_update_partial_workflow with connection operations'
    ],
    pitfalls: [
      'Does not validate node configurations - use validate_workflow for full validation',
      'Cannot detect logical errors in connection flow',
      'Some valid workflows may have intentionally disconnected nodes',
      'Circular dependency detection only catches direct loops',
      'Does not validate connection types match node capabilities'
    ],
    relatedTools: ['validate_workflow', 'validate_workflow_expressions', 'n8n_update_partial_workflow']
  }
};