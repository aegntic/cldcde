import { ToolDocumentation } from '../types';

export const listTasksDoc: ToolDocumentation = {
  name: 'list_tasks',
  category: 'templates',
  essentials: {
    description: 'List task templates by category: HTTP/API, Webhooks, Database, AI, Data Processing, Communication.',
    keyParameters: ['category'],
    example: 'list_tasks({category: "HTTP/API"})',
    performance: 'Instant',
    tips: [
      'Categories: HTTP/API, Webhooks, Database, AI',
      'Shows pre-configured node settings',
      'Use get_node_for_task for details'
    ]
  },
  full: {
    description: 'Lists available task templates organized by category. Each task represents a common automation pattern with pre-configured node settings. Categories include HTTP/API, Webhooks, Database, AI, Data Processing, and Communication.',
    parameters: {
      category: { type: 'string', description: 'Filter by category (optional)' }
    },
    returns: 'Array of tasks with name, category, description, nodeType',
    examples: [
      'list_tasks() - Get all task templates',
      'list_tasks({category: "Database"}) - Database-related tasks',
      'list_tasks({category: "AI"}) - AI automation tasks'
    ],
    useCases: [
      'Discover common automation patterns',
      'Find pre-configured solutions',
      'Learn node usage patterns',
      'Quick workflow setup'
    ],
    performance: 'Instant - Static task list',
    bestPractices: [
      'Browse all categories first',
      'Use get_node_for_task for config',
      'Combine multiple tasks in workflows'
    ],
    pitfalls: [
      'Tasks are templates, customize as needed',
      'Not all nodes have task templates'
    ],
    relatedTools: ['get_node_for_task', 'search_templates', 'get_templates_for_task']
  }
};