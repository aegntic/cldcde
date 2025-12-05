import { v4 as uuidv4 } from 'uuid';

// Type definitions
export interface INodeParameters {
  [key: string]: any;
}

export interface INodeCredentials {
  [credentialType: string]: {
    id?: string;
    name: string;
  };
}

export interface INode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: INodeParameters;
  credentials?: INodeCredentials;
  disabled?: boolean;
  notes?: string;
  continueOnFail?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  onError?: 'continueRegularOutput' | 'continueErrorOutput' | 'stopWorkflow';
}

export interface IConnection {
  node: string;
  type: 'main';
  index: number;
}

export interface IConnections {
  [nodeId: string]: {
    [outputType: string]: Array<Array<IConnection | null>>;
  };
}

export interface IWorkflowSettings {
  executionOrder?: 'v0' | 'v1';
  saveDataErrorExecution?: 'all' | 'none';
  saveDataSuccessExecution?: 'all' | 'none';
  saveManualExecutions?: boolean;
  saveExecutionProgress?: boolean;
  executionTimeout?: number;
  errorWorkflow?: string;
  timezone?: string;
}

export interface IWorkflow {
  id?: string;
  name: string;
  nodes: INode[];
  connections: IConnections;
  active?: boolean;
  settings?: IWorkflowSettings;
  staticData?: any;
  tags?: string[];
  pinData?: any;
  versionId?: string;
  meta?: {
    instanceId?: string;
  };
}

// Type guard for INode validation
function isValidNode(node: any): node is INode {
  return (
    typeof node === 'object' &&
    typeof node.id === 'string' &&
    typeof node.name === 'string' &&
    typeof node.type === 'string' &&
    typeof node.typeVersion === 'number' &&
    Array.isArray(node.position) &&
    node.position.length === 2 &&
    typeof node.position[0] === 'number' &&
    typeof node.position[1] === 'number' &&
    typeof node.parameters === 'object'
  );
}

export class WorkflowBuilder {
  private workflow: IWorkflow;
  private nodeCounter = 0;
  private defaultPosition: [number, number] = [250, 300];
  private positionIncrement = 280;

  constructor(name = 'Test Workflow') {
    this.workflow = {
      name,
      nodes: [],
      connections: {},
      active: false,
      settings: {
        executionOrder: 'v1',
        saveDataErrorExecution: 'all',
        saveDataSuccessExecution: 'all',
        saveManualExecutions: true,
        saveExecutionProgress: true,
      },
    };
  }

  /**
   * Add a node to the workflow
   */
  addNode(node: Partial<INode> & { type: string; typeVersion: number }): this {
    const nodeId = node.id || uuidv4();
    const nodeName = node.name || `${node.type} ${++this.nodeCounter}`;
    
    const fullNode: INode = {
      ...node,  // Spread first to allow overrides
      id: nodeId,
      name: nodeName,
      type: node.type,
      typeVersion: node.typeVersion,
      position: node.position || this.getNextPosition(),
      parameters: node.parameters || {},
    };

    this.workflow.nodes.push(fullNode);
    return this;
  }

  /**
   * Add a webhook node (common trigger)
   */
  addWebhookNode(options: Partial<INode> = {}): this {
    return this.addNode({
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      parameters: {
        path: 'test-webhook',
        method: 'POST',
        responseMode: 'onReceived',
        responseData: 'allEntries',
        responsePropertyName: 'data',
        ...options.parameters,
      },
      ...options,
    });
  }

  /**
   * Add a Slack node
   */
  addSlackNode(options: Partial<INode> = {}): this {
    return this.addNode({
      type: 'n8n-nodes-base.slack',
      typeVersion: 2.2,
      parameters: {
        resource: 'message',
        operation: 'post',
        channel: '#general',
        text: 'Test message',
        ...options.parameters,
      },
      credentials: {
        slackApi: {
          name: 'Slack Account',
        },
      },
      ...options,
    });
  }

  /**
   * Add an HTTP Request node
   */
  addHttpRequestNode(options: Partial<INode> = {}): this {
    return this.addNode({
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      parameters: {
        method: 'GET',
        url: 'https://api.example.com/data',
        authentication: 'none',
        ...options.parameters,
      },
      ...options,
    });
  }

  /**
   * Add a Code node
   */
  addCodeNode(options: Partial<INode> = {}): this {
    return this.addNode({
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      parameters: {
        mode: 'runOnceForAllItems',
        language: 'javaScript',
        jsCode: 'return items;',
        ...options.parameters,
      },
      ...options,
    });
  }

  /**
   * Add an IF node
   */
  addIfNode(options: Partial<INode> = {}): this {
    return this.addNode({
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      parameters: {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: '',
            typeValidation: 'strict',
          },
          conditions: [
            {
              id: uuidv4(),
              leftValue: '={{ $json.value }}',
              rightValue: 'test',
              operator: {
                type: 'string',
                operation: 'equals',
              },
            },
          ],
          combinator: 'and',
        },
        ...options.parameters,
      },
      ...options,
    });
  }

  /**
   * Add an AI Agent node
   */
  addAiAgentNode(options: Partial<INode> = {}): this {
    return this.addNode({
      type: '@n8n/n8n-nodes-langchain.agent',
      typeVersion: 1.7,
      parameters: {
        agent: 'conversationalAgent',
        promptType: 'define',
        text: '={{ $json.prompt }}',
        ...options.parameters,
      },
      ...options,
    });
  }

  /**
   * Connect two nodes
   * @param sourceNodeId - ID of the source node
   * @param targetNodeId - ID of the target node
   * @param sourceOutput - Output index on the source node (default: 0)
   * @param targetInput - Input index on the target node (default: 0)
   * @returns The WorkflowBuilder instance for chaining
   * @example
   * builder.connect('webhook-1', 'slack-1', 0, 0);
   */
  connect(
    sourceNodeId: string,
    targetNodeId: string,
    sourceOutput = 0,
    targetInput = 0
  ): this {
    // Validate that both nodes exist
    const sourceNode = this.findNode(sourceNodeId);
    const targetNode = this.findNode(targetNodeId);
    
    if (!sourceNode) {
      throw new Error(`Source node not found: ${sourceNodeId}`);
    }
    if (!targetNode) {
      throw new Error(`Target node not found: ${targetNodeId}`);
    }
    
    if (!this.workflow.connections[sourceNodeId]) {
      this.workflow.connections[sourceNodeId] = {
        main: [],
      };
    }

    // Ensure the output array exists
    while (this.workflow.connections[sourceNodeId].main.length <= sourceOutput) {
      this.workflow.connections[sourceNodeId].main.push([]);
    }

    // Add the connection
    this.workflow.connections[sourceNodeId].main[sourceOutput].push({
      node: targetNodeId,
      type: 'main',
      index: targetInput,
    });

    return this;
  }

  /**
   * Connect nodes in sequence
   */
  connectSequentially(nodeIds: string[]): this {
    for (let i = 0; i < nodeIds.length - 1; i++) {
      this.connect(nodeIds[i], nodeIds[i + 1]);
    }
    return this;
  }

  /**
   * Set workflow settings
   */
  setSettings(settings: IWorkflowSettings): this {
    this.workflow.settings = {
      ...this.workflow.settings,
      ...settings,
    };
    return this;
  }

  /**
   * Set workflow as active
   */
  setActive(active = true): this {
    this.workflow.active = active;
    return this;
  }

  /**
   * Add tags to the workflow
   */
  addTags(...tags: string[]): this {
    this.workflow.tags = [...(this.workflow.tags || []), ...tags];
    return this;
  }

  /**
   * Set workflow ID
   */
  setId(id: string): this {
    this.workflow.id = id;
    return this;
  }

  /**
   * Build and return the workflow
   */
  build(): IWorkflow {
    // Return a deep clone to prevent modifications
    return JSON.parse(JSON.stringify(this.workflow));
  }

  /**
   * Get the next node position
   */
  private getNextPosition(): [number, number] {
    const nodeCount = this.workflow.nodes.length;
    return [
      this.defaultPosition[0] + (nodeCount * this.positionIncrement),
      this.defaultPosition[1],
    ];
  }

  /**
   * Find a node by name or ID
   */
  findNode(nameOrId: string): INode | undefined {
    return this.workflow.nodes.find(
      node => node.name === nameOrId || node.id === nameOrId
    );
  }

  /**
   * Get all node IDs
   */
  getNodeIds(): string[] {
    return this.workflow.nodes.map(node => node.id);
  }

  /**
   * Add a custom node type
   */
  addCustomNode(type: string, typeVersion: number, parameters: INodeParameters, options: Partial<INode> = {}): this {
    return this.addNode({
      type,
      typeVersion,
      parameters,
      ...options,
    });
  }

  /**
   * Clear all nodes and connections
   */
  clear(): this {
    this.workflow.nodes = [];
    this.workflow.connections = {};
    this.nodeCounter = 0;
    return this;
  }

  /**
   * Clone the current workflow builder
   */
  clone(): WorkflowBuilder {
    const cloned = new WorkflowBuilder(this.workflow.name);
    cloned.workflow = JSON.parse(JSON.stringify(this.workflow));
    cloned.nodeCounter = this.nodeCounter;
    return cloned;
  }
}

// Export a factory function for convenience
export function createWorkflow(name?: string): WorkflowBuilder {
  return new WorkflowBuilder(name);
}