#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';

// This is a helper script to migrate tool documentation to the new structure
// It creates a template file for each tool that needs to be migrated

const toolsByCategory = {
  discovery: [
    'search_nodes',
    'list_nodes', 
    'list_ai_tools',
    'get_database_statistics'
  ],
  configuration: [
    'get_node_info',
    'get_node_essentials',
    'get_node_documentation',
    'search_node_properties',
    'get_node_as_tool_info',
    'get_property_dependencies'
  ],
  validation: [
    'validate_node_minimal',
    'validate_node_operation',
    'validate_workflow',
    'validate_workflow_connections',
    'validate_workflow_expressions'
  ],
  templates: [
    'get_node_for_task',
    'list_tasks',
    'list_node_templates',
    'get_template',
    'search_templates',
    'get_templates_for_task'
  ],
  workflow_management: [
    'n8n_create_workflow',
    'n8n_get_workflow',
    'n8n_get_workflow_details',
    'n8n_get_workflow_structure',
    'n8n_get_workflow_minimal',
    'n8n_update_full_workflow',
    'n8n_update_partial_workflow',
    'n8n_delete_workflow',
    'n8n_list_workflows',
    'n8n_validate_workflow',
    'n8n_trigger_webhook_workflow',
    'n8n_get_execution',
    'n8n_list_executions',
    'n8n_delete_execution'
  ],
  system: [
    'tools_documentation',
    'n8n_diagnostic',
    'n8n_health_check',
    'n8n_list_available_tools'
  ],
  special: [
    'code_node_guide'
  ]
};

const template = (toolName: string, category: string) => `import { ToolDocumentation } from '../types';

export const ${toCamelCase(toolName)}Doc: ToolDocumentation = {
  name: '${toolName}',
  category: '${category}',
  essentials: {
    description: 'TODO: Add description from old file',
    keyParameters: ['TODO'],
    example: '${toolName}({TODO})',
    performance: 'TODO',
    tips: [
      'TODO: Add tips'
    ]
  },
  full: {
    description: 'TODO: Add full description',
    parameters: {
      // TODO: Add parameters
    },
    returns: 'TODO: Add return description',
    examples: [
      '${toolName}({TODO}) - TODO'
    ],
    useCases: [
      'TODO: Add use cases'
    ],
    performance: 'TODO: Add performance description',
    bestPractices: [
      'TODO: Add best practices'
    ],
    pitfalls: [
      'TODO: Add pitfalls'
    ],
    relatedTools: ['TODO']
  }
};`;

function toCamelCase(str: string): string {
  return str.split('_').map((part, index) => 
    index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
  ).join('');
}

function toKebabCase(str: string): string {
  return str.replace(/_/g, '-');
}

// Create template files for tools that don't exist yet
Object.entries(toolsByCategory).forEach(([category, tools]) => {
  tools.forEach(toolName => {
    const fileName = toKebabCase(toolName) + '.ts';
    const filePath = path.join('src/mcp/tool-docs', category, fileName);
    
    // Skip if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${filePath} already exists`);
      return;
    }
    
    // Create the file with template
    fs.writeFileSync(filePath, template(toolName, category));
    console.log(`✨ Created ${filePath}`);
  });
  
  // Create index file for the category
  const indexPath = path.join('src/mcp/tool-docs', category, 'index.ts');
  if (!fs.existsSync(indexPath)) {
    const indexContent = tools.map(toolName => 
      `export { ${toCamelCase(toolName)}Doc } from './${toKebabCase(toolName)}';`
    ).join('\n');
    
    fs.writeFileSync(indexPath, indexContent);
    console.log(`✨ Created ${indexPath}`);
  }
});

console.log('\n📝 Migration templates created!');
console.log('Next steps:');
console.log('1. Copy documentation from the old tools-documentation.ts file');
console.log('2. Update each template file with the actual documentation');
console.log('3. Update src/mcp/tool-docs/index.ts to import all tools');
console.log('4. Replace the old tools-documentation.ts with the new one');