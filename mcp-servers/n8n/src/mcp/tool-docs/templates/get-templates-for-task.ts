import { ToolDocumentation } from '../types';

export const getTemplatesForTaskDoc: ToolDocumentation = {
  name: 'get_templates_for_task',
  category: 'templates',
  essentials: {
    description: 'Curated templates by task: ai_automation, data_sync, webhooks, email, slack, data_transform, files, scheduling, api, database.',
    keyParameters: ['task'],
    example: 'get_templates_for_task({task: "slack_integration"})',
    performance: 'Fast (<100ms) - pre-categorized results',
    tips: [
      'Returns hand-picked templates for specific automation tasks',
      'Use list_tasks to see all available task categories',
      'Templates are curated for quality and relevance'
    ]
  },
  full: {
    description: `Retrieves curated workflow templates for specific automation tasks. This tool provides hand-picked templates organized by common use cases, making it easy to find the right workflow for your needs. Each task category contains the most popular and effective templates for that particular automation scenario.`,
    parameters: {
      task: {
        type: 'string',
        required: true,
        description: 'The type of task to get templates for. Options: ai_automation, data_sync, webhook_processing, email_automation, slack_integration, data_transformation, file_processing, scheduling, api_integration, database_operations'
      }
    },
    returns: `Returns an object containing:
- task: The requested task type
- templates: Array of curated templates
  - id: Template ID
  - name: Template name
  - description: What the workflow does
  - author: Creator information
  - nodes: Array of node types used
  - views: Popularity metric
  - created: Creation date
  - url: Link to template
- totalFound: Number of templates in this category
- availableTasks: List of all task categories (if no templates found)`,
    examples: [
      'get_templates_for_task({task: "slack_integration"}) - Get Slack automation workflows',
      'get_templates_for_task({task: "ai_automation"}) - Get AI-powered workflows',
      'get_templates_for_task({task: "data_sync"}) - Get data synchronization workflows',
      'get_templates_for_task({task: "webhook_processing"}) - Get webhook handler workflows',
      'get_templates_for_task({task: "email_automation"}) - Get email automation workflows'
    ],
    useCases: [
      'Find workflows for specific business needs',
      'Discover best practices for common automations',
      'Get started quickly with pre-built solutions',
      'Learn patterns for specific integration types',
      'Browse curated collections of quality workflows'
    ],
    performance: `Excellent performance with pre-categorized templates:
- Query time: <10ms (indexed by task)
- No filtering needed (pre-curated)
- Returns 5-20 templates per category
- Total response time: <100ms`,
    bestPractices: [
      'Start with task-based search for faster results',
      'Review multiple templates to find best patterns',
      'Check template age for most current approaches',
      'Combine templates from same category for complex workflows',
      'Use returned node lists to understand requirements'
    ],
    pitfalls: [
      'Not all tasks have many templates available',
      'Task categories are predefined - no custom categories',
      'Some templates may overlap between categories',
      'Curation is subjective - browse all results',
      'Templates may need updates for latest n8n features'
    ],
    relatedTools: ['search_templates', 'list_node_templates', 'get_template', 'list_tasks']
  }
};