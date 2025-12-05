import { ToolDocumentation } from '../types';

export const getNodeForTaskDoc: ToolDocumentation = {
  name: 'get_node_for_task',
  category: 'templates',
  essentials: {
    description: 'Get pre-configured node for tasks: post_json_request, receive_webhook, query_database, send_slack_message, etc. Use list_tasks for all.',
    keyParameters: ['task'],
    example: 'get_node_for_task({task: "post_json_request"})',
    performance: 'Instant',
    tips: [
      'Returns ready-to-use configuration',
      'See list_tasks for available tasks',
      'Includes credentials structure'
    ]
  },
  full: {
    description: 'Returns pre-configured node settings for common automation tasks. Each configuration includes the correct node type, essential parameters, and credential requirements. Perfect for quickly setting up standard automations.',
    parameters: {
      task: { type: 'string', required: true, description: 'Task name from list_tasks (e.g., "post_json_request", "send_email")' }
    },
    returns: 'Complete node configuration with type, displayName, parameters, credentials structure',
    examples: [
      'get_node_for_task({task: "post_json_request"}) - HTTP POST setup',
      'get_node_for_task({task: "receive_webhook"}) - Webhook receiver',
      'get_node_for_task({task: "send_slack_message"}) - Slack config'
    ],
    useCases: [
      'Quick node configuration',
      'Learning proper node setup',
      'Standard automation patterns',
      'Credential structure reference'
    ],
    performance: 'Instant - Pre-configured templates',
    bestPractices: [
      'Use list_tasks to discover options',
      'Customize returned config as needed',
      'Check credential requirements',
      'Validate with validate_node_operation'
    ],
    pitfalls: [
      'Templates may need customization',
      'Credentials must be configured separately',
      'Not all tasks available for all nodes'
    ],
    relatedTools: ['list_tasks', 'validate_node_operation', 'get_node_essentials']
  }
};