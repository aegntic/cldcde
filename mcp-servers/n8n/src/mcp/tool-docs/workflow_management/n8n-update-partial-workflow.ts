import { ToolDocumentation } from '../types';

export const n8nUpdatePartialWorkflowDoc: ToolDocumentation = {
  name: 'n8n_update_partial_workflow',
  category: 'workflow_management',
  essentials: {
    description: 'Update workflow incrementally with diff operations. Max 5 ops. Types: addNode, removeNode, updateNode, moveNode, enable/disableNode, addConnection, removeConnection, updateSettings, updateName, add/removeTag.',
    keyParameters: ['id', 'operations'],
    example: 'n8n_update_partial_workflow({id: "wf_123", operations: [{type: "updateNode", ...}]})',
    performance: 'Fast (50-200ms)',
    tips: [
      'Use for targeted changes',
      'Supports up to 5 operations',
      'Validate with validateOnly first'
    ]
  },
  full: {
    description: `Updates workflows using surgical diff operations instead of full replacement. Supports 13 operation types for precise modifications. Operations are validated and applied atomically - all succeed or none are applied. Maximum 5 operations per call for safety.

## Available Operations:

### Node Operations (6 types):
- **addNode**: Add a new node with name, type, and position (required)
- **removeNode**: Remove a node by ID or name
- **updateNode**: Update node properties using dot notation (e.g., 'parameters.url')
- **moveNode**: Change node position [x, y]
- **enableNode**: Enable a disabled node
- **disableNode**: Disable an active node

### Connection Operations (3 types):
- **addConnection**: Connect nodes (source→target)
- **removeConnection**: Remove connection between nodes
- **updateConnection**: Modify connection properties

### Metadata Operations (4 types):
- **updateSettings**: Modify workflow settings
- **updateName**: Rename the workflow
- **addTag**: Add a workflow tag
- **removeTag**: Remove a workflow tag`,
    parameters: {
      id: { type: 'string', required: true, description: 'Workflow ID to update' },
      operations: { 
        type: 'array', 
        required: true, 
        description: 'Array of diff operations. Each must have "type" field and operation-specific properties. Max 5 operations. Nodes can be referenced by ID or name.' 
      },
      validateOnly: { type: 'boolean', description: 'If true, only validate operations without applying them' }
    },
    returns: 'Updated workflow object or validation results if validateOnly=true',
    examples: [
      '// Update node parameter\nn8n_update_partial_workflow({id: "abc", operations: [{type: "updateNode", nodeName: "HTTP Request", changes: {"parameters.url": "https://api.example.com"}}]})',
      '// Add connection between nodes\nn8n_update_partial_workflow({id: "xyz", operations: [{type: "addConnection", source: "Webhook", target: "Slack", sourceOutput: "main", targetInput: "main"}]})',
      '// Multiple operations in one call\nn8n_update_partial_workflow({id: "123", operations: [\n  {type: "addNode", node: {name: "Transform", type: "n8n-nodes-base.code", position: [400, 300]}},\n  {type: "addConnection", source: "Webhook", target: "Transform"},\n  {type: "updateSettings", settings: {timezone: "America/New_York"}}\n]})',
      '// Validate before applying\nn8n_update_partial_workflow({id: "456", operations: [{type: "removeNode", nodeName: "Old Process"}], validateOnly: true})'
    ],
    useCases: [
      'Update single node parameters',
      'Add/remove connections',
      'Enable/disable nodes',
      'Rename workflows or nodes',
      'Manage tags efficiently'
    ],
    performance: 'Very fast - typically 50-200ms. Much faster than full updates as only changes are processed.',
    bestPractices: [
      'Use validateOnly to test operations',
      'Group related changes in one call',
      'Keep operations under 5 for clarity',
      'Check operation order for dependencies'
    ],
    pitfalls: [
      '**REQUIRES N8N_API_URL and N8N_API_KEY environment variables** - will not work without n8n API access',
      'Maximum 5 operations per call - split larger updates',
      'Operations validated together - all must be valid',
      'Order matters for dependent operations (e.g., must add node before connecting to it)',
      'Node references accept ID or name, but name must be unique',
      'Dot notation for nested updates: use "parameters.url" not nested objects'
    ],
    relatedTools: ['n8n_update_full_workflow', 'n8n_get_workflow', 'validate_workflow', 'tools_documentation']
  }
};