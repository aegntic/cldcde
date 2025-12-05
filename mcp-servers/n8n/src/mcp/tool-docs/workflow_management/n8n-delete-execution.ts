import { ToolDocumentation } from '../types';

export const n8nDeleteExecutionDoc: ToolDocumentation = {
  name: 'n8n_delete_execution',
  category: 'workflow_management',
  essentials: {
    description: 'Delete an execution record. This only removes the execution history, not any data processed.',
    keyParameters: ['id'],
    example: 'n8n_delete_execution({id: "12345"})',
    performance: 'Immediate deletion, no undo available',
    tips: [
      'Deletion is permanent - execution cannot be recovered',
      'Only removes execution history, not external data changes',
      'Use for cleanup of test executions or sensitive data'
    ]
  },
  full: {
    description: `Permanently deletes a workflow execution record from n8n's history. This removes the execution metadata, logs, and any stored input/output data. However, it does NOT undo any actions the workflow performed (API calls, database changes, file operations, etc.). Use this for cleaning up test executions, removing sensitive data, or managing storage.`,
    parameters: {
      id: {
        type: 'string',
        required: true,
        description: 'The execution ID to delete. This action cannot be undone'
      }
    },
    returns: `Confirmation of deletion or error if execution not found. No data is returned about the deleted execution.`,
    examples: [
      'n8n_delete_execution({id: "12345"}) - Delete a specific execution',
      'n8n_delete_execution({id: "test-run-567"}) - Clean up test execution',
      'n8n_delete_execution({id: "sensitive-data-890"}) - Remove execution with sensitive data',
      'n8n_delete_execution({id: "failed-execution-123"}) - Delete failed execution after debugging'
    ],
    useCases: [
      'Clean up test or development execution history',
      'Remove executions containing sensitive or personal data',
      'Manage storage by deleting old execution records',
      'Clean up after debugging failed workflows',
      'Comply with data retention policies'
    ],
    performance: `Deletion is immediate and permanent. The operation is fast (< 100ms) as it only removes database records. No external systems or data are affected.`,
    bestPractices: [
      'Verify execution ID before deletion - action cannot be undone',
      'Consider exporting execution data before deletion if needed',
      'Use list_executions to find executions to delete',
      'Document why executions were deleted for audit trails',
      'Remember deletion only affects n8n records, not external changes'
    ],
    pitfalls: [
      'Deletion is PERMANENT - no undo or recovery possible',
      'Does NOT reverse workflow actions (API calls, DB changes, etc.)',
      'Deleting executions breaks audit trails and debugging history',
      'Cannot delete currently running executions (waiting status)',
      'Bulk deletion not supported - must delete one at a time'
    ],
    relatedTools: ['n8n_list_executions', 'n8n_get_execution', 'n8n_trigger_webhook_workflow']
  }
};