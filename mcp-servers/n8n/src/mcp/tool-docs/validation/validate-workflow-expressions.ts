import { ToolDocumentation } from '../types';

export const validateWorkflowExpressionsDoc: ToolDocumentation = {
  name: 'validate_workflow_expressions',
  category: 'validation',
  essentials: {
    description: 'Validate n8n expressions: syntax {{}}, variables ($json/$node), references. Returns errors with locations.',
    keyParameters: ['workflow'],
    example: 'validate_workflow_expressions({workflow: {nodes: [...], connections: {...}}})',
    performance: 'Fast (<100ms)',
    tips: [
      'Catches syntax errors in {{}} expressions before runtime',
      'Validates $json, $node, and other n8n variables',
      'Shows exact location of expression errors in node parameters'
    ]
  },
  full: {
    description: 'Validates all n8n expressions within a workflow for syntax correctness and reference validity. This tool scans all node parameters for n8n expressions (enclosed in {{}}), checks expression syntax, validates variable references like $json and $node("NodeName"), ensures referenced nodes exist in the workflow, and provides detailed error locations for debugging.',
    parameters: {
      workflow: { 
        type: 'object', 
        required: true, 
        description: 'The workflow JSON to check for expression errors.' 
      }
    },
    returns: 'Object with valid (boolean), errors (array with node ID, parameter path, and error details), and expression count',
    examples: [
      'validate_workflow_expressions({workflow: myWorkflow}) - Check all expressions',
      'validate_workflow_expressions({workflow: {nodes: [...], connections: {...}}}) - Validate expression syntax'
    ],
    useCases: [
      'Catch expression syntax errors before workflow execution',
      'Validate node references in $node() expressions exist',
      'Find typos in variable names like $json or $input',
      'Ensure complex expressions are properly formatted',
      'Debug expression errors with exact parameter locations',
      'Validate expressions after workflow modifications'
    ],
    performance: 'Fast (<100ms). Scans all string parameters in all nodes. Performance scales with workflow size and expression count.',
    bestPractices: [
      'Run after modifying any expressions in node parameters',
      'Check all $node() references when renaming nodes',
      'Validate expressions before workflow deployment',
      'Pay attention to nested object paths in expressions',
      'Use with validate_workflow for comprehensive validation'
    ],
    pitfalls: [
      'Cannot validate expression logic, only syntax',
      'Runtime data availability not checked (e.g., if $json.field exists)',
      'Complex JavaScript in expressions may need runtime testing',
      'Does not validate expression return types',
      'Some valid expressions may use advanced features not fully parsed'
    ],
    relatedTools: ['validate_workflow', 'validate_workflow_connections', 'validate_node_operation']
  }
};