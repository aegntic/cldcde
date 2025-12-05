import { vi } from 'vitest';

// Mock types that match n8n-workflow
interface INodeExecutionData {
  json: any;
  binary?: any;
  pairedItem?: any;
}

interface IExecuteFunctions {
  getInputData(): INodeExecutionData[];
  getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: any): any;
  getCredentials(type: string): Promise<any>;
  helpers: {
    returnJsonArray(data: any): INodeExecutionData[];
    httpRequest(options: any): Promise<any>;
    webhook(): any;
  };
}

interface IWebhookFunctions {
  getWebhookName(): string;
  getBodyData(): any;
  getHeaderData(): any;
  getQueryData(): any;
  getRequestObject(): any;
  getResponseObject(): any;
  helpers: {
    returnJsonArray(data: any): INodeExecutionData[];
  };
}

interface INodeTypeDescription {
  displayName: string;
  name: string;
  group: string[];
  version: number;
  description: string;
  defaults: { name: string };
  inputs: string[];
  outputs: string[];
  credentials?: any[];
  webhooks?: any[];
  properties: any[];
  icon?: string;
  subtitle?: string;
}

interface INodeType {
  description: INodeTypeDescription;
  execute?(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
  webhook?(this: IWebhookFunctions): Promise<any>;
  trigger?(this: any): Promise<void>;
  poll?(this: any): Promise<INodeExecutionData[][] | null>;
}

// Base mock node implementation
class BaseMockNode implements INodeType {
  description: INodeTypeDescription;
  execute: any;
  webhook: any;
  
  constructor(description: INodeTypeDescription, execute?: any, webhook?: any) {
    this.description = description;
    this.execute = execute ? vi.fn(execute) : undefined;
    this.webhook = webhook ? vi.fn(webhook) : undefined;
  }
}

// Mock implementations for each node type
const mockWebhookNode = new BaseMockNode(
  {
    displayName: 'Webhook',
    name: 'webhook',
    group: ['trigger'],
    version: 1,
    description: 'Starts the workflow when a webhook is called',
    defaults: { name: 'Webhook' },
    inputs: [],
    outputs: ['main'],
    webhooks: [
      {
        name: 'default',
        httpMethod: '={{$parameter["httpMethod"]}}',
        path: '={{$parameter["path"]}}',
        responseMode: '={{$parameter["responseMode"]}}',
      }
    ],
    properties: [
      {
        displayName: 'Path',
        name: 'path',
        type: 'string',
        default: 'webhook',
        required: true,
        description: 'The path to listen on',
      },
      {
        displayName: 'HTTP Method',
        name: 'httpMethod',
        type: 'options',
        default: 'GET',
        options: [
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'DELETE', value: 'DELETE' },
          { name: 'HEAD', value: 'HEAD' },
          { name: 'PATCH', value: 'PATCH' },
        ],
      },
      {
        displayName: 'Response Mode',
        name: 'responseMode',
        type: 'options',
        default: 'onReceived',
        options: [
          { name: 'On Received', value: 'onReceived' },
          { name: 'Last Node', value: 'lastNode' },
        ],
      },
    ],
  },
  undefined,
  async function webhook(this: IWebhookFunctions) {
    const returnData: INodeExecutionData[] = [];
    returnData.push({
      json: {
        headers: this.getHeaderData(),
        params: this.getQueryData(),
        body: this.getBodyData(),
      }
    });
    return {
      workflowData: [returnData],
    };
  }
);

const mockHttpRequestNode = new BaseMockNode(
  {
    displayName: 'HTTP Request',
    name: 'httpRequest',
    group: ['transform'],
    version: 3,
    description: 'Makes an HTTP request and returns the response',
    defaults: { name: 'HTTP Request' },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Method',
        name: 'method',
        type: 'options',
        default: 'GET',
        options: [
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'DELETE', value: 'DELETE' },
          { name: 'HEAD', value: 'HEAD' },
          { name: 'PATCH', value: 'PATCH' },
        ],
      },
      {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        default: '',
        required: true,
        placeholder: 'https://example.com',
      },
      {
        displayName: 'Authentication',
        name: 'authentication',
        type: 'options',
        default: 'none',
        options: [
          { name: 'None', value: 'none' },
          { name: 'Basic Auth', value: 'basicAuth' },
          { name: 'Digest Auth', value: 'digestAuth' },
          { name: 'Header Auth', value: 'headerAuth' },
          { name: 'OAuth1', value: 'oAuth1' },
          { name: 'OAuth2', value: 'oAuth2' },
        ],
      },
      {
        displayName: 'Response Format',
        name: 'responseFormat',
        type: 'options',
        default: 'json',
        options: [
          { name: 'JSON', value: 'json' },
          { name: 'String', value: 'string' },
          { name: 'File', value: 'file' },
        ],
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Body Content Type',
            name: 'bodyContentType',
            type: 'options',
            default: 'json',
            options: [
              { name: 'JSON', value: 'json' },
              { name: 'Form Data', value: 'formData' },
              { name: 'Form URL Encoded', value: 'form-urlencoded' },
              { name: 'Raw', value: 'raw' },
            ],
          },
          {
            displayName: 'Headers',
            name: 'headers',
            type: 'fixedCollection',
            default: {},
            typeOptions: {
              multipleValues: true,
            },
          },
          {
            displayName: 'Query Parameters',
            name: 'queryParameters',
            type: 'fixedCollection',
            default: {},
            typeOptions: {
              multipleValues: true,
            },
          },
        ],
      },
    ],
  },
  async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const method = this.getNodeParameter('method', i) as string;
      const url = this.getNodeParameter('url', i) as string;
      
      // Mock response
      const response = {
        statusCode: 200,
        headers: {},
        body: { success: true, method, url },
      };
      
      returnData.push({
        json: response,
      });
    }
    
    return [returnData];
  }
);

const mockSlackNode = new BaseMockNode(
  {
    displayName: 'Slack',
    name: 'slack',
    group: ['output'],
    version: 2,
    description: 'Send messages to Slack',
    defaults: { name: 'Slack' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'slackApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        default: 'message',
        options: [
          { name: 'Channel', value: 'channel' },
          { name: 'Message', value: 'message' },
          { name: 'User', value: 'user' },
          { name: 'File', value: 'file' },
        ],
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        displayOptions: {
          show: {
            resource: ['message'],
          },
        },
        default: 'post',
        options: [
          { name: 'Post', value: 'post' },
          { name: 'Update', value: 'update' },
          { name: 'Delete', value: 'delete' },
        ],
      },
      {
        displayName: 'Channel',
        name: 'channel',
        type: 'options',
        typeOptions: {
          loadOptionsMethod: 'getChannels',
        },
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['post'],
          },
        },
        default: '',
        required: true,
      },
      {
        displayName: 'Text',
        name: 'text',
        type: 'string',
        typeOptions: {
          alwaysOpenEditWindow: true,
        },
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['post'],
          },
        },
        default: '',
        required: true,
      },
    ],
  },
  async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const resource = this.getNodeParameter('resource', i) as string;
      const operation = this.getNodeParameter('operation', i) as string;
      
      // Mock response
      const response = {
        ok: true,
        channel: this.getNodeParameter('channel', i, '') as string,
        ts: Date.now().toString(),
        message: {
          text: this.getNodeParameter('text', i, '') as string,
        },
      };
      
      returnData.push({
        json: response,
      });
    }
    
    return [returnData];
  }
);

const mockFunctionNode = new BaseMockNode(
  {
    displayName: 'Function',
    name: 'function',
    group: ['transform'],
    version: 1,
    description: 'Execute custom JavaScript code',
    defaults: { name: 'Function' },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'JavaScript Code',
        name: 'functionCode',
        type: 'string',
        typeOptions: {
          alwaysOpenEditWindow: true,
          codeAutocomplete: 'function',
          editor: 'code',
          rows: 10,
        },
        default: 'return items;',
        description: 'JavaScript code to execute',
      },
    ],
  },
  async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const functionCode = this.getNodeParameter('functionCode', 0) as string;
    
    // Simple mock - just return items
    return [items];
  }
);

const mockNoOpNode = new BaseMockNode(
  {
    displayName: 'No Operation',
    name: 'noOp',
    group: ['utility'],
    version: 1,
    description: 'Does nothing',
    defaults: { name: 'No Op' },
    inputs: ['main'],
    outputs: ['main'],
    properties: [],
  },
  async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    return [this.getInputData()];
  }
);

const mockMergeNode = new BaseMockNode(
  {
    displayName: 'Merge',
    name: 'merge',
    group: ['transform'],
    version: 2,
    description: 'Merge multiple data streams',
    defaults: { name: 'Merge' },
    inputs: ['main', 'main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Mode',
        name: 'mode',
        type: 'options',
        default: 'append',
        options: [
          { name: 'Append', value: 'append' },
          { name: 'Merge By Index', value: 'mergeByIndex' },
          { name: 'Merge By Key', value: 'mergeByKey' },
          { name: 'Multiplex', value: 'multiplex' },
        ],
      },
    ],
  },
  async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const mode = this.getNodeParameter('mode', 0) as string;
    
    // Mock merge - just return first input
    return [this.getInputData()];
  }
);

const mockIfNode = new BaseMockNode(
  {
    displayName: 'IF',
    name: 'if',
    group: ['transform'],
    version: 1,
    description: 'Conditional logic',
    defaults: { name: 'IF' },
    inputs: ['main'],
    outputs: ['main', 'main'],
    // outputNames: ['true', 'false'], // Not a valid property in INodeTypeDescription
    properties: [
      {
        displayName: 'Conditions',
        name: 'conditions',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        options: [
          {
            name: 'string',
            displayName: 'String',
            values: [
              {
                displayName: 'Value 1',
                name: 'value1',
                type: 'string',
                default: '',
              },
              {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                default: 'equals',
                options: [
                  { name: 'Equals', value: 'equals' },
                  { name: 'Not Equals', value: 'notEquals' },
                  { name: 'Contains', value: 'contains' },
                  { name: 'Not Contains', value: 'notContains' },
                ],
              },
              {
                displayName: 'Value 2',
                name: 'value2',
                type: 'string',
                default: '',
              },
            ],
          },
        ],
      },
    ],
  },
  async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const trueItems: INodeExecutionData[] = [];
    const falseItems: INodeExecutionData[] = [];
    
    // Mock condition - split 50/50
    items.forEach((item, index) => {
      if (index % 2 === 0) {
        trueItems.push(item);
      } else {
        falseItems.push(item);
      }
    });
    
    return [trueItems, falseItems];
  }
);

const mockSwitchNode = new BaseMockNode(
  {
    displayName: 'Switch',
    name: 'switch',
    group: ['transform'],
    version: 1,
    description: 'Route items based on conditions',
    defaults: { name: 'Switch' },
    inputs: ['main'],
    outputs: ['main', 'main', 'main', 'main'],
    properties: [
      {
        displayName: 'Mode',
        name: 'mode',
        type: 'options',
        default: 'expression',
        options: [
          { name: 'Expression', value: 'expression' },
          { name: 'Rules', value: 'rules' },
        ],
      },
      {
        displayName: 'Output',
        name: 'output',
        type: 'options',
        displayOptions: {
          show: {
            mode: ['expression'],
          },
        },
        default: 'all',
        options: [
          { name: 'All', value: 'all' },
          { name: 'First Match', value: 'firstMatch' },
        ],
      },
    ],
  },
  async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    
    // Mock routing - distribute evenly across outputs
    const outputs: INodeExecutionData[][] = [[], [], [], []];
    items.forEach((item, index) => {
      outputs[index % 4].push(item);
    });
    
    return outputs;
  }
);

// Node registry
const nodeRegistry = new Map<string, INodeType>([
  ['webhook', mockWebhookNode],
  ['httpRequest', mockHttpRequestNode],
  ['slack', mockSlackNode],
  ['function', mockFunctionNode],
  ['noOp', mockNoOpNode],
  ['merge', mockMergeNode],
  ['if', mockIfNode],
  ['switch', mockSwitchNode],
]);

// Export mock functions
export const getNodeTypes = vi.fn(() => ({
  getByName: vi.fn((name: string) => nodeRegistry.get(name)),
  getByNameAndVersion: vi.fn((name: string, version: number) => nodeRegistry.get(name)),
}));

// Export individual node classes for direct import
export const Webhook = mockWebhookNode;
export const HttpRequest = mockHttpRequestNode;
export const Slack = mockSlackNode;
export const Function = mockFunctionNode;
export const NoOp = mockNoOpNode;
export const Merge = mockMergeNode;
export const If = mockIfNode;
export const Switch = mockSwitchNode;

// Test utility to override node behavior
export const mockNodeBehavior = (nodeName: string, overrides: Partial<INodeType>) => {
  const existingNode = nodeRegistry.get(nodeName);
  if (!existingNode) {
    throw new Error(`Node ${nodeName} not found in registry`);
  }
  
  const updatedNode = new BaseMockNode(
    { ...existingNode.description, ...overrides.description },
    overrides.execute || existingNode.execute,
    overrides.webhook || existingNode.webhook
  );
  
  nodeRegistry.set(nodeName, updatedNode);
  return updatedNode;
};

// Test utility to reset all mocks
export const resetAllMocks = () => {
  getNodeTypes.mockClear();
  nodeRegistry.forEach((node) => {
    if (node.execute && vi.isMockFunction(node.execute)) {
      node.execute.mockClear();
    }
    if (node.webhook && vi.isMockFunction(node.webhook)) {
      node.webhook.mockClear();
    }
  });
};

// Test utility to add custom nodes
export const registerMockNode = (name: string, node: INodeType) => {
  nodeRegistry.set(name, node);
};

// Export default for require() compatibility
export default {
  getNodeTypes,
  Webhook,
  HttpRequest,
  Slack,
  Function,
  NoOp,
  Merge,
  If,
  Switch,
  mockNodeBehavior,
  resetAllMocks,
  registerMockNode,
};