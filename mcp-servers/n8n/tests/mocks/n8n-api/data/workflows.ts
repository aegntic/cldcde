/**
 * Mock workflow data for MSW handlers
 * These represent typical n8n workflows used in tests
 */

export interface MockWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: any[];
  connections: any;
  settings?: any;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  versionId: string;
}

export const mockWorkflows: MockWorkflow[] = [
  {
    id: 'workflow_1',
    name: 'Test HTTP Workflow',
    active: true,
    nodes: [
      {
        id: 'node_1',
        name: 'Start',
        type: 'n8n-nodes-base.start',
        typeVersion: 1,
        position: [250, 300],
        parameters: {}
      },
      {
        id: 'node_2',
        name: 'HTTP Request',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [450, 300],
        parameters: {
          method: 'GET',
          url: 'https://api.example.com/data',
          authentication: 'none',
          options: {}
        }
      }
    ],
    connections: {
      'node_1': {
        main: [[{ node: 'node_2', type: 'main', index: 0 }]]
      }
    },
    settings: {
      executionOrder: 'v1',
      timezone: 'UTC'
    },
    tags: ['http', 'api'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    versionId: '1'
  },
  {
    id: 'workflow_2',
    name: 'Webhook to Slack',
    active: false,
    nodes: [
      {
        id: 'webhook_1',
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 2,
        position: [250, 300],
        parameters: {
          httpMethod: 'POST',
          path: 'test-webhook',
          responseMode: 'onReceived',
          responseData: 'firstEntryJson'
        }
      },
      {
        id: 'slack_1',
        name: 'Slack',
        type: 'n8n-nodes-base.slack',
        typeVersion: 2.2,
        position: [450, 300],
        parameters: {
          resource: 'message',
          operation: 'post',
          channel: '#general',
          text: '={{ $json.message }}',
          authentication: 'accessToken'
        },
        credentials: {
          slackApi: {
            id: 'cred_1',
            name: 'Slack Account'
          }
        }
      }
    ],
    connections: {
      'webhook_1': {
        main: [[{ node: 'slack_1', type: 'main', index: 0 }]]
      }
    },
    settings: {},
    tags: ['webhook', 'slack', 'notification'],
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    versionId: '1'
  },
  {
    id: 'workflow_3',
    name: 'AI Agent Workflow',
    active: true,
    nodes: [
      {
        id: 'agent_1',
        name: 'AI Agent',
        type: '@n8n/n8n-nodes-langchain.agent',
        typeVersion: 1.7,
        position: [250, 300],
        parameters: {
          agent: 'openAiFunctionsAgent',
          prompt: 'You are a helpful assistant',
          temperature: 0.7
        }
      },
      {
        id: 'tool_1',
        name: 'HTTP Tool',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [450, 200],
        parameters: {
          method: 'GET',
          url: 'https://api.example.com/search',
          sendQuery: true,
          queryParameters: {
            parameters: [
              {
                name: 'q',
                value: '={{ $json.query }}'
              }
            ]
          }
        }
      }
    ],
    connections: {
      'tool_1': {
        ai_tool: [[{ node: 'agent_1', type: 'ai_tool', index: 0 }]]
      }
    },
    settings: {},
    tags: ['ai', 'agent', 'langchain'],
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
    versionId: '1'
  }
];

/**
 * Factory functions for creating mock workflows
 */
export const workflowFactory = {
  /**
   * Create a simple workflow with Start and one other node
   */
  simple: (nodeType: string, nodeParams: any = {}): MockWorkflow => ({
    id: `workflow_${Date.now()}`,
    name: `Test ${nodeType} Workflow`,
    active: true,
    nodes: [
      {
        id: 'start_1',
        name: 'Start',
        type: 'n8n-nodes-base.start',
        typeVersion: 1,
        position: [250, 300],
        parameters: {}
      },
      {
        id: 'node_1',
        name: nodeType.split('.').pop() || nodeType,
        type: nodeType,
        typeVersion: 1,
        position: [450, 300],
        parameters: nodeParams
      }
    ],
    connections: {
      'start_1': {
        main: [[{ node: 'node_1', type: 'main', index: 0 }]]
      }
    },
    settings: {},
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    versionId: '1'
  }),

  /**
   * Create a workflow with specific nodes and connections
   */
  custom: (config: Partial<MockWorkflow>): MockWorkflow => ({
    id: `workflow_${Date.now()}`,
    name: 'Custom Workflow',
    active: false,
    nodes: [],
    connections: {},
    settings: {},
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    versionId: '1',
    ...config
  })
};