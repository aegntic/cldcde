import { ToolDocumentation } from '../types';

export const validateNodeOperationDoc: ToolDocumentation = {
  name: 'validate_node_operation',
  category: 'validation',
  essentials: {
    description: 'Validates node configuration with operation awareness. Checks required fields, data types, and operation-specific rules. Returns specific errors with automated fix suggestions. Different profiles for different validation needs.',
    keyParameters: ['nodeType', 'config', 'profile'],
    example: 'validate_node_operation({nodeType: "nodes-base.slack", config: {resource: "message", operation: "post", text: "Hi"}})',
    performance: '<100ms',
    tips: [
      'Profile choices: minimal (editing), runtime (execution), ai-friendly (balanced), strict (deployment)',
      'Returns fixes you can apply directly',
      'Operation-aware - knows Slack post needs text'
    ]
  },
  full: {
    description: 'Comprehensive node configuration validation that understands operation context. For example, it knows Slack message posting requires text field, while channel listing doesn\'t. Provides different validation profiles for different stages of workflow development.',
    parameters: {
      nodeType: { type: 'string', required: true, description: 'Full node type with prefix: "nodes-base.slack", "nodes-base.httpRequest"' },
      config: { type: 'object', required: true, description: 'Node configuration. Must include operation fields (resource/operation/action) if the node has multiple operations' },
      profile: { type: 'string', required: false, description: 'Validation profile - controls what\'s checked. Default: "ai-friendly"' }
    },
    returns: `Object containing:
{
  "isValid": false,
  "errors": [
    {
      "field": "channel",
      "message": "Required field 'channel' is missing",
      "severity": "error",
      "fix": "#general"
    }
  ],
  "warnings": [
    {
      "field": "retryOnFail", 
      "message": "Consider enabling retry for reliability",
      "severity": "warning",
      "fix": true
    }
  ],
  "suggestions": [
    {
      "field": "timeout",
      "message": "Set timeout to prevent hanging",
      "fix": 30000
    }
  ],
  "fixes": {
    "channel": "#general",
    "retryOnFail": true,
    "timeout": 30000
  }
}`,
    examples: [
      '// Missing required field',
      'validate_node_operation({nodeType: "nodes-base.slack", config: {resource: "message", operation: "post"}})',
      '// Returns: {isValid: false, errors: [{field: "text", message: "Required field missing"}], fixes: {text: "Message text"}}',
      '',
      '// Validate with strict profile for production',
      'validate_node_operation({nodeType: "nodes-base.httpRequest", config: {method: "POST", url: "https://api.example.com"}, profile: "strict"})',
      '',
      '// Apply fixes automatically',
      'const result = validate_node_operation({nodeType: "nodes-base.slack", config: myConfig});',
      'if (!result.isValid) {',
      '  myConfig = {...myConfig, ...result.fixes};',
      '}'
    ],
    useCases: [
      'Validate configuration before workflow execution',
      'Debug why a node isn\'t working as expected',
      'Generate configuration fixes automatically',
      'Different validation for editing vs production'
    ],
    performance: '<100ms for most nodes, <200ms for complex nodes with many conditions',
    bestPractices: [
      'Use "minimal" profile during user editing for fast feedback',
      'Use "runtime" profile (default) before execution',
      'Use "ai-friendly" when AI configures nodes',
      'Use "strict" profile before production deployment',
      'Always include operation fields (resource/operation) in config',
      'Apply suggested fixes to resolve issues quickly'
    ],
    pitfalls: [
      'Must include operation fields for multi-operation nodes',
      'Fixes are suggestions - review before applying',
      'Profile affects what\'s validated - minimal skips many checks'
    ],
    relatedTools: ['validate_node_minimal for quick checks', 'get_node_essentials for valid examples', 'validate_workflow for complete workflow validation']
  }
};