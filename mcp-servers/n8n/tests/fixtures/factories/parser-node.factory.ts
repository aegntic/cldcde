import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';

// Declarative node definition
export interface DeclarativeNodeDefinition {
  name: string;
  displayName: string;
  description: string;
  version?: number | number[];
  group?: string[];
  categories?: string[];
  routing: {
    request?: {
      resource?: {
        options: Array<{ name: string; value: string }>;
      };
      operation?: {
        options: Record<string, Array<{ name: string; value: string; action?: string }>>;
      };
    };
  };
  properties?: any[];
  credentials?: any[];
  usableAsTool?: boolean;
  webhooks?: any[];
  polling?: boolean;
}

// Programmatic node definition
export interface ProgrammaticNodeDefinition {
  name: string;
  displayName: string;
  description: string;
  version?: number | number[];
  group?: string[];
  categories?: string[];
  properties: any[];
  credentials?: any[];
  usableAsTool?: boolean;
  webhooks?: any[];
  polling?: boolean;
  trigger?: boolean;
  eventTrigger?: boolean;
}

// Versioned node class structure
export interface VersionedNodeClass {
  baseDescription?: {
    name: string;
    displayName: string;
    description: string;
    defaultVersion: number;
  };
  nodeVersions?: Record<number, { description: any }>;
}

// Property definition
export interface PropertyDefinition {
  displayName: string;
  name: string;
  type: string;
  default?: any;
  description?: string;
  options?: Array<{ name: string; value: string; description?: string; action?: string; displayName?: string }> | any[];
  required?: boolean;
  displayOptions?: {
    show?: Record<string, any[]>;
    hide?: Record<string, any[]>;
  };
  typeOptions?: any;
  noDataExpression?: boolean;
}

// Base property factory
export const propertyFactory = Factory.define<PropertyDefinition>(() => ({
  displayName: faker.helpers.arrayElement(['Resource', 'Operation', 'Field', 'Option']),
  name: faker.helpers.slugify(faker.word.noun()).toLowerCase(),
  type: faker.helpers.arrayElement(['string', 'number', 'boolean', 'options', 'json', 'collection']),
  default: '',
  description: faker.lorem.sentence(),
  required: faker.datatype.boolean(),
  noDataExpression: faker.datatype.boolean()
}));

// String property factory
export const stringPropertyFactory = propertyFactory.params({
  type: 'string',
  default: faker.lorem.word()
});

// Number property factory
export const numberPropertyFactory = propertyFactory.params({
  type: 'number',
  default: faker.number.int({ min: 0, max: 100 })
});

// Boolean property factory
export const booleanPropertyFactory = propertyFactory.params({
  type: 'boolean',
  default: faker.datatype.boolean()
});

// Options property factory
export const optionsPropertyFactory = propertyFactory.params({
  type: 'options',
  options: [
    { name: 'Option A', value: 'a', description: 'First option' },
    { name: 'Option B', value: 'b', description: 'Second option' },
    { name: 'Option C', value: 'c', description: 'Third option' }
  ],
  default: 'a'
});

// Resource property for programmatic nodes
export const resourcePropertyFactory = optionsPropertyFactory.params({
  displayName: 'Resource',
  name: 'resource',
  options: [
    { name: 'User', value: 'user' },
    { name: 'Post', value: 'post' },
    { name: 'Comment', value: 'comment' }
  ]
});

// Operation property for programmatic nodes
export const operationPropertyFactory = optionsPropertyFactory.params({
  displayName: 'Operation',
  name: 'operation',
  displayOptions: {
    show: {
      resource: ['user']
    }
  },
  options: [
    { name: 'Create', value: 'create', action: 'Create a user' } as any,
    { name: 'Get', value: 'get', action: 'Get a user' } as any,
    { name: 'Update', value: 'update', action: 'Update a user' } as any,
    { name: 'Delete', value: 'delete', action: 'Delete a user' } as any
  ]
});

// Collection property factory
export const collectionPropertyFactory = propertyFactory.params({
  type: 'collection',
  default: {},
  options: [
    stringPropertyFactory.build({ name: 'field1', displayName: 'Field 1' }) as any,
    numberPropertyFactory.build({ name: 'field2', displayName: 'Field 2' }) as any
  ]
});

// Declarative node factory
export const declarativeNodeFactory = Factory.define<DeclarativeNodeDefinition>(() => ({
  name: faker.helpers.slugify(faker.company.name()).toLowerCase(),
  displayName: faker.company.name(),
  description: faker.lorem.sentence(),
  version: faker.number.int({ min: 1, max: 3 }),
  group: [faker.helpers.arrayElement(['transform', 'output'])],
  routing: {
    request: {
      resource: {
        options: [
          { name: 'User', value: 'user' },
          { name: 'Post', value: 'post' }
        ]
      },
      operation: {
        options: {
          user: [
            { name: 'Create', value: 'create', action: 'Create a user' },
            { name: 'Get', value: 'get', action: 'Get a user' }
          ],
          post: [
            { name: 'Create', value: 'create', action: 'Create a post' },
            { name: 'List', value: 'list', action: 'List posts' }
          ]
        }
      }
    }
  },
  properties: [
    stringPropertyFactory.build({ name: 'apiKey', displayName: 'API Key' })
  ],
  credentials: [
    { name: 'apiCredentials', required: true }
  ]
}));

// Programmatic node factory
export const programmaticNodeFactory = Factory.define<ProgrammaticNodeDefinition>(() => ({
  name: faker.helpers.slugify(faker.company.name()).toLowerCase(),
  displayName: faker.company.name(),
  description: faker.lorem.sentence(),
  version: faker.number.int({ min: 1, max: 3 }),
  group: [faker.helpers.arrayElement(['transform', 'output'])],
  properties: [
    resourcePropertyFactory.build(),
    operationPropertyFactory.build(),
    stringPropertyFactory.build({ 
      name: 'field',
      displayName: 'Field',
      displayOptions: {
        show: {
          resource: ['user'],
          operation: ['create', 'update']
        }
      }
    })
  ],
  credentials: []
}));

// Trigger node factory
export const triggerNodeFactory = programmaticNodeFactory.params({
  group: ['trigger'],
  trigger: true,
  properties: [
    {
      displayName: 'Event',
      name: 'event',
      type: 'options',
      default: 'created',
      options: [
        { name: 'Created', value: 'created' },
        { name: 'Updated', value: 'updated' },
        { name: 'Deleted', value: 'deleted' }
      ]
    }
  ]
});

// Webhook node factory
export const webhookNodeFactory = programmaticNodeFactory.params({
  group: ['trigger'],
  webhooks: [
    {
      name: 'default',
      httpMethod: 'POST',
      responseMode: 'onReceived',
      path: 'webhook'
    }
  ],
  properties: [
    {
      displayName: 'Path',
      name: 'path',
      type: 'string',
      default: 'webhook',
      required: true
    }
  ]
});

// AI tool node factory
export const aiToolNodeFactory = declarativeNodeFactory.params({
  usableAsTool: true,
  name: 'openai',
  displayName: 'OpenAI',
  description: 'Use OpenAI models'
});

// Versioned node class factory
export const versionedNodeClassFactory = Factory.define<VersionedNodeClass>(() => ({
  baseDescription: {
    name: faker.helpers.slugify(faker.company.name()).toLowerCase(),
    displayName: faker.company.name(),
    description: faker.lorem.sentence(),
    defaultVersion: 2
  },
  nodeVersions: {
    1: {
      description: {
        properties: [
          stringPropertyFactory.build({ name: 'oldField', displayName: 'Old Field' })
        ]
      }
    },
    2: {
      description: {
        properties: [
          stringPropertyFactory.build({ name: 'newField', displayName: 'New Field' }),
          numberPropertyFactory.build({ name: 'version', displayName: 'Version' })
        ]
      }
    }
  }
}));

// Malformed node factory (for error testing)
export const malformedNodeFactory = Factory.define<any>(() => ({
  // Missing required 'name' property
  displayName: faker.company.name(),
  description: faker.lorem.sentence()
}));

// Complex nested property factory
export const nestedPropertyFactory = Factory.define<PropertyDefinition>(() => ({
  displayName: 'Advanced Options',
  name: 'advancedOptions',
  type: 'collection',
  default: {},
  options: [
    {
      displayName: 'Headers',
      name: 'headers',
      type: 'fixedCollection',
      typeOptions: {
        multipleValues: true
      },
      options: [
        {
          name: 'header',
          displayName: 'Header',
          values: [
            stringPropertyFactory.build({ name: 'name', displayName: 'Name' }),
            stringPropertyFactory.build({ name: 'value', displayName: 'Value' })
          ]
        }
      ]
    } as any,
    {
      displayName: 'Query Parameters',
      name: 'queryParams',
      type: 'collection',
      options: [
        stringPropertyFactory.build({ name: 'key', displayName: 'Key' }),
        stringPropertyFactory.build({ name: 'value', displayName: 'Value' })
      ] as any[]
    } as any
  ]
}));

// Node class mock factory
export const nodeClassFactory = Factory.define<any>(({ params }) => {
  const description = params.description || programmaticNodeFactory.build();
  
  return class MockNode {
    description = description;
    
    constructor() {
      // Constructor logic if needed
    }
  };
});

// Versioned node type class mock
export const versionedNodeTypeClassFactory = Factory.define<any>(({ params }) => {
  const baseDescription = params.baseDescription || {
    name: 'versionedNode',
    displayName: 'Versioned Node',
    description: 'A versioned node',
    defaultVersion: 2
  };
  
  const nodeVersions = params.nodeVersions || {
    1: {
      description: {
        properties: [propertyFactory.build()]
      }
    },
    2: {
      description: {
        properties: [propertyFactory.build(), propertyFactory.build()]
      }
    }
  };
  
  return class VersionedNodeType {
    baseDescription = baseDescription;
    nodeVersions = nodeVersions;
    currentVersion = baseDescription.defaultVersion;
    
    constructor() {
      Object.defineProperty(this.constructor, 'name', {
        value: 'VersionedNodeType',
        writable: false,
        configurable: true
      });
    }
  };
});