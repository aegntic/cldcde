import { faker } from '@faker-js/faker';
import { WorkflowNode, Workflow } from '@/types/n8n-api';

// Use any type for INodeDefinition since it's from n8n-workflow package
type INodeDefinition = any;

/**
 * Data generators for creating realistic test data
 */

/**
 * Generate a random node type
 */
export function generateNodeType(): string {
  const packages = ['n8n-nodes-base', '@n8n/n8n-nodes-langchain'];
  const nodeTypes = [
    'webhook', 'httpRequest', 'slack', 'googleSheets', 'postgres',
    'function', 'code', 'if', 'switch', 'merge', 'splitInBatches',
    'emailSend', 'redis', 'mongodb', 'mysql', 'ftp', 'ssh'
  ];
  
  const pkg = faker.helpers.arrayElement(packages);
  const type = faker.helpers.arrayElement(nodeTypes);
  
  return `${pkg}.${type}`;
}

/**
 * Generate property definitions for a node
 */
export function generateProperties(count = 5): any[] {
  const properties = [];
  
  for (let i = 0; i < count; i++) {
    const type = faker.helpers.arrayElement([
      'string', 'number', 'boolean', 'options', 'collection'
    ]);
    
    const property: any = {
      displayName: faker.helpers.arrayElement([
        'Resource', 'Operation', 'Field', 'Value', 'Method',
        'URL', 'Headers', 'Body', 'Authentication', 'Options'
      ]),
      name: faker.helpers.slugify(faker.word.noun()).toLowerCase(),
      type,
      default: generateDefaultValue(type),
      description: faker.lorem.sentence()
    };
    
    if (type === 'options') {
      property.options = generateOptions();
    }
    
    if (faker.datatype.boolean()) {
      property.required = true;
    }
    
    if (faker.datatype.boolean()) {
      property.displayOptions = generateDisplayOptions();
    }
    
    properties.push(property);
  }
  
  return properties;
}

/**
 * Generate default value based on type
 */
function generateDefaultValue(type: string): any {
  switch (type) {
    case 'string':
      return faker.lorem.word();
    case 'number':
      return faker.number.int({ min: 0, max: 100 });
    case 'boolean':
      return faker.datatype.boolean();
    case 'options':
      return 'option1';
    case 'collection':
      return {};
    default:
      return '';
  }
}

/**
 * Generate options for select fields
 */
function generateOptions(count = 3): any[] {
  const options = [];
  
  for (let i = 0; i < count; i++) {
    options.push({
      name: faker.helpers.arrayElement([
        'Create', 'Read', 'Update', 'Delete', 'List',
        'Get', 'Post', 'Put', 'Patch', 'Send'
      ]),
      value: `option${i + 1}`,
      description: faker.lorem.sentence()
    });
  }
  
  return options;
}

/**
 * Generate display options for conditional fields
 */
function generateDisplayOptions(): any {
  return {
    show: {
      resource: [faker.helpers.arrayElement(['user', 'post', 'message'])],
      operation: [faker.helpers.arrayElement(['create', 'update', 'get'])]
    }
  };
}

/**
 * Generate a complete node definition
 */
export function generateNodeDefinition(overrides?: Partial<INodeDefinition>): any {
  const nodeCategory = faker.helpers.arrayElement([
    'Core Nodes', 'Communication', 'Data Transformation',
    'Development', 'Files', 'Productivity', 'Analytics'
  ]);
  
  return {
    displayName: faker.company.name() + ' Node',
    name: faker.helpers.slugify(faker.company.name()).toLowerCase(),
    group: [faker.helpers.arrayElement(['trigger', 'transform', 'output'])],
    version: faker.number.float({ min: 1, max: 3, fractionDigits: 1 }),
    subtitle: `={{$parameter["operation"] + ": " + $parameter["resource"]}}`,
    description: faker.lorem.paragraph(),
    defaults: {
      name: faker.company.name(),
      color: faker.color.rgb()
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: faker.datatype.boolean() ? [{
      name: faker.helpers.slugify(faker.company.name()).toLowerCase() + 'Api',
      required: true
    }] : undefined,
    properties: generateProperties(),
    codex: {
      categories: [nodeCategory],
      subcategories: {
        [nodeCategory]: [faker.word.noun()]
      },
      alias: [faker.word.noun(), faker.word.verb()]
    },
    ...overrides
  };
}

/**
 * Generate workflow nodes
 */
export function generateWorkflowNodes(count = 3): WorkflowNode[] {
  const nodes: WorkflowNode[] = [];
  
  for (let i = 0; i < count; i++) {
    nodes.push({
      id: faker.string.uuid(),
      name: faker.helpers.arrayElement([
        'Webhook', 'HTTP Request', 'Set', 'Function', 'IF',
        'Slack', 'Email', 'Database', 'Code'
      ]) + (i > 0 ? i : ''),
      type: generateNodeType(),
      typeVersion: faker.number.float({ min: 1, max: 3, fractionDigits: 1 }),
      position: [
        250 + i * 200,
        300 + (i % 2) * 100
      ],
      parameters: generateNodeParameters()
    });
  }
  
  return nodes;
}

/**
 * Generate node parameters
 */
function generateNodeParameters(): Record<string, any> {
  const params: Record<string, any> = {};
  
  // Common parameters
  if (faker.datatype.boolean()) {
    params.resource = faker.helpers.arrayElement(['user', 'post', 'message']);
    params.operation = faker.helpers.arrayElement(['create', 'get', 'update', 'delete']);
  }
  
  // Type-specific parameters
  if (faker.datatype.boolean()) {
    params.url = faker.internet.url();
  }
  
  if (faker.datatype.boolean()) {
    params.method = faker.helpers.arrayElement(['GET', 'POST', 'PUT', 'DELETE']);
  }
  
  if (faker.datatype.boolean()) {
    params.authentication = faker.helpers.arrayElement(['none', 'basicAuth', 'oAuth2']);
  }
  
  // Add some random parameters
  const randomParamCount = faker.number.int({ min: 1, max: 5 });
  for (let i = 0; i < randomParamCount; i++) {
    const key = faker.word.noun().toLowerCase();
    params[key] = faker.helpers.arrayElement([
      faker.lorem.word(),
      faker.number.int(),
      faker.datatype.boolean(),
      '={{ $json.data }}'
    ]);
  }
  
  return params;
}

/**
 * Generate workflow connections
 */
export function generateConnections(nodes: WorkflowNode[]): Record<string, any> {
  const connections: Record<string, any> = {};
  
  // Connect nodes sequentially
  for (let i = 0; i < nodes.length - 1; i++) {
    const sourceId = nodes[i].id;
    const targetId = nodes[i + 1].id;
    
    if (!connections[sourceId]) {
      connections[sourceId] = { main: [[]] };
    }
    
    connections[sourceId].main[0].push({
      node: targetId,
      type: 'main',
      index: 0
    });
  }
  
  // Add some random connections
  if (nodes.length > 2 && faker.datatype.boolean()) {
    const sourceIdx = faker.number.int({ min: 0, max: nodes.length - 2 });
    const targetIdx = faker.number.int({ min: sourceIdx + 1, max: nodes.length - 1 });
    
    const sourceId = nodes[sourceIdx].id;
    const targetId = nodes[targetIdx].id;
    
    if (connections[sourceId]?.main[0]) {
      connections[sourceId].main[0].push({
        node: targetId,
        type: 'main',
        index: 0
      });
    }
  }
  
  return connections;
}

/**
 * Generate a complete workflow
 */
export function generateWorkflow(nodeCount = 3): Workflow {
  const nodes = generateWorkflowNodes(nodeCount);
  
  return {
    id: faker.string.uuid(),
    name: faker.helpers.arrayElement([
      'Data Processing Workflow',
      'API Integration Flow',
      'Notification Pipeline',
      'ETL Process',
      'Webhook Handler'
    ]),
    active: faker.datatype.boolean(),
    nodes,
    connections: generateConnections(nodes),
    settings: {
      executionOrder: 'v1',
      saveManualExecutions: true,
      timezone: faker.location.timeZone()
    },
    staticData: {},
    tags: generateTags().map(t => t.name),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString()
  };
}

/**
 * Generate workflow tags
 */
function generateTags(): Array<{ id: string; name: string }> {
  const tagCount = faker.number.int({ min: 0, max: 3 });
  const tags = [];
  
  for (let i = 0; i < tagCount; i++) {
    tags.push({
      id: faker.string.uuid(),
      name: faker.helpers.arrayElement([
        'production', 'development', 'testing',
        'automation', 'integration', 'notification'
      ])
    });
  }
  
  return tags;
}

/**
 * Generate test templates
 */
export function generateTemplate() {
  const workflow = generateWorkflow();
  
  return {
    id: faker.number.int({ min: 1000, max: 9999 }),
    name: workflow.name,
    description: faker.lorem.paragraph(),
    workflow,
    categories: faker.helpers.arrayElements([
      'Sales', 'Marketing', 'Engineering',
      'HR', 'Finance', 'Operations'
    ], { min: 1, max: 3 }),
    useCases: faker.helpers.arrayElements([
      'Lead Generation', 'Data Sync', 'Notifications',
      'Reporting', 'Automation', 'Integration'
    ], { min: 1, max: 3 }),
    views: faker.number.int({ min: 0, max: 10000 }),
    recentViews: faker.number.int({ min: 0, max: 100 })
  };
}

/**
 * Generate bulk test data
 */
export function generateBulkData(counts: {
  nodes?: number;
  workflows?: number;
  templates?: number;
}) {
  const { nodes = 10, workflows = 5, templates = 3 } = counts;
  
  return {
    nodes: Array.from({ length: nodes }, () => generateNodeDefinition()),
    workflows: Array.from({ length: workflows }, () => generateWorkflow()),
    templates: Array.from({ length: templates }, () => generateTemplate())
  };
}