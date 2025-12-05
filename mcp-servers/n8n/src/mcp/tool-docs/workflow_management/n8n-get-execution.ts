import { ToolDocumentation } from '../types';

export const n8nGetExecutionDoc: ToolDocumentation = {
  name: 'n8n_get_execution',
  category: 'workflow_management',
  essentials: {
    description: 'Get details of a specific execution by ID, including status, timing, and error information.',
    keyParameters: ['id', 'includeData'],
    example: 'n8n_get_execution({id: "12345"})',
    performance: 'Fast lookup, data inclusion may increase response size significantly',
    tips: [
      'Use includeData:true to see full execution data and node outputs',
      'Execution IDs come from list_executions or webhook responses',
      'Check status field for success/error/waiting states'
    ]
  },
  full: {
    description: `Retrieves detailed information about a specific workflow execution. This tool is essential for monitoring workflow runs, debugging failures, and accessing execution results. Returns execution metadata by default, with optional full data inclusion for complete visibility into node inputs/outputs.`,
    parameters: {
      id: {
        type: 'string',
        required: true,
        description: 'The execution ID to retrieve. Obtained from list_executions or webhook trigger responses'
      },
      includeData: {
        type: 'boolean',
        required: false,
        description: 'Include full execution data with node inputs/outputs (default: false). Significantly increases response size'
      }
    },
    returns: `Execution object containing status, timing, error details, and optionally full execution data with all node inputs/outputs.`,
    examples: [
      'n8n_get_execution({id: "12345"}) - Get execution summary only',
      'n8n_get_execution({id: "12345", includeData: true}) - Get full execution with all data',
      'n8n_get_execution({id: "67890"}) - Check status of a running execution',
      'n8n_get_execution({id: "failed-123", includeData: true}) - Debug failed execution with error details'
    ],
    useCases: [
      'Monitor status of triggered workflow executions',
      'Debug failed workflows by examining error messages',
      'Access execution results and node output data',
      'Track execution duration and performance metrics',
      'Verify successful completion of critical workflows'
    ],
    performance: `Metadata retrieval is fast (< 100ms). Including full data (includeData: true) can significantly increase response time and size, especially for workflows processing large datasets. Use data inclusion judiciously.`,
    bestPractices: [
      'Start with includeData:false to check status first',
      'Only include data when you need to see node outputs',
      'Store execution IDs from trigger responses for tracking',
      'Check status field to determine if execution completed',
      'Use error field to diagnose execution failures'
    ],
    pitfalls: [
      'Large executions with includeData:true can timeout or exceed limits',
      'Execution data is retained based on n8n settings - old executions may be purged',
      'Waiting status indicates execution is still running',
      'Error executions may have partial data from successful nodes',
      'Execution IDs are unique per n8n instance'
    ],
    relatedTools: ['n8n_list_executions', 'n8n_trigger_webhook_workflow', 'n8n_delete_execution', 'n8n_get_workflow']
  }
};