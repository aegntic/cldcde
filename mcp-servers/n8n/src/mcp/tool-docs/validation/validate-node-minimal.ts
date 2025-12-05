import { ToolDocumentation } from '../types';

export const validateNodeMinimalDoc: ToolDocumentation = {
  name: 'validate_node_minimal',
  category: 'validation',
  essentials: {
    description: 'Fast check for missing required fields only. No warnings/suggestions. Returns: list of missing fields.',
    keyParameters: ['nodeType', 'config'],
    example: 'validate_node_minimal("nodes-base.slack", {resource: "message"})',
    performance: 'Instant',
    tips: [
      'Returns only missing required fields',
      'No warnings or suggestions',
      'Perfect for real-time validation'
    ]
  },
  full: {
    description: 'Minimal validation that only checks for missing required fields. Returns array of missing field names without any warnings or suggestions. Ideal for quick validation during node configuration.',
    parameters: {
      nodeType: { type: 'string', required: true, description: 'Node type with prefix (e.g., "nodes-base.slack")' },
      config: { type: 'object', required: true, description: 'Node configuration to validate' }
    },
    returns: 'Array of missing required field names (empty if valid)',
    examples: [
      'validate_node_minimal("nodes-base.slack", {resource: "message", operation: "post"}) - Check Slack config',
      'validate_node_minimal("nodes-base.httpRequest", {method: "GET"}) - Check HTTP config'
    ],
    useCases: [
      'Real-time form validation',
      'Quick configuration checks',
      'Pre-deployment validation',
      'Interactive configuration builders'
    ],
    performance: 'Instant - Simple field checking without complex validation',
    bestPractices: [
      'Use for quick feedback loops',
      'Follow with validate_node_operation for thorough check',
      'Check return array length for validity'
    ],
    pitfalls: [
      'Only checks required fields',
      'No type validation',
      'No operation-specific validation'
    ],
    relatedTools: ['validate_node_operation', 'get_node_essentials', 'get_property_dependencies']
  }
};