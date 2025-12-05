import { ToolDocumentation } from '../types';

export const n8nListExecutionsDoc: ToolDocumentation = {
  name: 'n8n_list_executions',
  category: 'workflow_management',
  essentials: {
    description: 'List workflow executions with optional filters. Supports pagination for large result sets.',
    keyParameters: ['workflowId', 'status', 'limit'],
    example: 'n8n_list_executions({workflowId: "abc123", status: "error"})',
    performance: 'Fast metadata retrieval, use pagination for large datasets',
    tips: [
      'Filter by status (success/error/waiting) to find specific execution types',
      'Use workflowId to see all executions for a specific workflow',
      'Pagination via cursor allows retrieving large execution histories'
    ]
  },
  full: {
    description: `Lists workflow executions with powerful filtering options. This tool is essential for monitoring workflow performance, finding failed executions, and tracking workflow activity. Supports pagination for retrieving large execution histories and filtering by workflow, status, and project.`,
    parameters: {
      limit: {
        type: 'number',
        required: false,
        description: 'Number of executions to return (1-100, default: 100). Use with cursor for pagination'
      },
      cursor: {
        type: 'string',
        required: false,
        description: 'Pagination cursor from previous response. Used to retrieve next page of results'
      },
      workflowId: {
        type: 'string',
        required: false,
        description: 'Filter executions by specific workflow ID. Shows all executions for that workflow'
      },
      projectId: {
        type: 'string',
        required: false,
        description: 'Filter by project ID (enterprise feature). Groups executions by project'
      },
      status: {
        type: 'string',
        required: false,
        enum: ['success', 'error', 'waiting'],
        description: 'Filter by execution status. Success = completed, Error = failed, Waiting = running'
      },
      includeData: {
        type: 'boolean',
        required: false,
        description: 'Include execution data in results (default: false). Significantly increases response size'
      }
    },
    returns: `Array of execution objects with metadata, pagination cursor for next page, and optionally execution data. Each execution includes ID, status, start/end times, and workflow reference.`,
    examples: [
      'n8n_list_executions({limit: 10}) - Get 10 most recent executions',
      'n8n_list_executions({workflowId: "abc123"}) - All executions for specific workflow',
      'n8n_list_executions({status: "error", limit: 50}) - Find failed executions',
      'n8n_list_executions({status: "waiting"}) - Monitor currently running workflows',
      'n8n_list_executions({cursor: "next-page-token"}) - Get next page of results'
    ],
    useCases: [
      'Monitor workflow execution history and patterns',
      'Find and debug failed workflow executions',
      'Track currently running workflows (waiting status)',
      'Analyze workflow performance and execution frequency',
      'Generate execution reports for specific workflows'
    ],
    performance: `Listing executions is fast for metadata only. Including data (includeData: true) significantly impacts performance. Use pagination (limit + cursor) for large result sets. Default limit of 100 balances performance with usability.`,
    bestPractices: [
      'Use status filters to focus on specific execution types',
      'Implement pagination for large execution histories',
      'Avoid includeData unless you need execution details',
      'Filter by workflowId when monitoring specific workflows',
      'Check for cursor in response to detect more pages'
    ],
    pitfalls: [
      'Large limits with includeData can cause timeouts',
      'Execution retention depends on n8n configuration',
      'Cursor tokens expire - use them promptly',
      'Status "waiting" includes both running and queued executions',
      'Deleted workflows still show in execution history'
    ],
    relatedTools: ['n8n_get_execution', 'n8n_trigger_webhook_workflow', 'n8n_delete_execution', 'n8n_list_workflows']
  }
};