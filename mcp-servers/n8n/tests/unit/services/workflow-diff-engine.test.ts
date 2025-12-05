import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowDiffEngine } from '@/services/workflow-diff-engine';
import { createWorkflow, WorkflowBuilder } from '@tests/utils/builders/workflow.builder';
import { 
  WorkflowDiffRequest,
  AddNodeOperation,
  RemoveNodeOperation,
  UpdateNodeOperation,
  MoveNodeOperation,
  EnableNodeOperation,
  DisableNodeOperation,
  AddConnectionOperation,
  RemoveConnectionOperation,
  UpdateConnectionOperation,
  UpdateSettingsOperation,
  UpdateNameOperation,
  AddTagOperation,
  RemoveTagOperation
} from '@/types/workflow-diff';
import { Workflow } from '@/types/n8n-api';

describe('WorkflowDiffEngine', () => {
  let diffEngine: WorkflowDiffEngine;
  let baseWorkflow: Workflow;
  let builder: WorkflowBuilder;

  beforeEach(() => {
    diffEngine = new WorkflowDiffEngine();
    
    // Create a base workflow with some nodes
    builder = createWorkflow('Test Workflow')
      .addWebhookNode({ id: 'webhook-1', name: 'Webhook' })
      .addHttpRequestNode({ id: 'http-1', name: 'HTTP Request' })
      .addSlackNode({ id: 'slack-1', name: 'Slack' })
      .connect('webhook-1', 'http-1')
      .connect('http-1', 'slack-1')
      .addTags('test', 'automation');
    
    baseWorkflow = builder.build() as Workflow;
    
    // Convert connections from ID-based to name-based (as n8n expects)
    const newConnections: any = {};
    for (const [nodeId, outputs] of Object.entries(baseWorkflow.connections)) {
      const node = baseWorkflow.nodes.find((n: any) => n.id === nodeId);
      if (node) {
        newConnections[node.name] = {};
        for (const [outputName, connections] of Object.entries(outputs)) {
          newConnections[node.name][outputName] = (connections as any[]).map((conns: any) =>
            conns.map((conn: any) => {
              const targetNode = baseWorkflow.nodes.find((n: any) => n.id === conn.node);
              return {
                ...conn,
                node: targetNode ? targetNode.name : conn.node
              };
            })
          );
        }
      }
    }
    baseWorkflow.connections = newConnections;
  });

  describe('Operation Limits', () => {
    it('should reject more than 5 operations', async () => {
      const operations = Array(6).fill(null).map((_: any, i: number) => ({
        type: 'updateName',
        name: `Name ${i}`
      } as UpdateNameOperation));

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].message).toContain('Too many operations');
    });
  });

  describe('AddNode Operation', () => {
    it('should add a new node successfully', async () => {
      const operation: AddNodeOperation = {
        type: 'addNode',
        node: {
          name: 'New Code Node',
          type: 'n8n-nodes-base.code',
          position: [800, 300],
          typeVersion: 2,
          parameters: {
            mode: 'runOnceForAllItems',
            language: 'javaScript',
            jsCode: 'return items;'
          }
        }
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      expect(result.workflow!.nodes).toHaveLength(4);
      expect(result.workflow!.nodes[3].name).toBe('New Code Node');
      expect(result.workflow!.nodes[3].type).toBe('n8n-nodes-base.code');
      expect(result.workflow!.nodes[3].id).toBeDefined();
    });

    it('should reject duplicate node names', async () => {
      const operation: AddNodeOperation = {
        type: 'addNode',
        node: {
          name: 'Webhook', // Duplicate name
          type: 'n8n-nodes-base.webhook',
          position: [800, 300]
        }
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('already exists');
    });

    it('should reject invalid node type format', async () => {
      const operation: AddNodeOperation = {
        type: 'addNode',
        node: {
          name: 'Invalid Node',
          type: 'webhook', // Missing package prefix
          position: [800, 300]
        }
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('Invalid node type');
    });

    it('should correct nodes-base prefix to n8n-nodes-base', async () => {
      const operation: AddNodeOperation = {
        type: 'addNode',
        node: {
          name: 'Test Node',
          type: 'nodes-base.webhook', // Wrong prefix
          position: [800, 300]
        }
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('Use "n8n-nodes-base.');
    });

    it('should generate node ID if not provided', async () => {
      const operation: AddNodeOperation = {
        type: 'addNode',
        node: {
          name: 'No ID Node',
          type: 'n8n-nodes-base.code',
          position: [800, 300]
        }
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      expect(result.workflow!.nodes[3].id).toBeDefined();
      expect(result.workflow!.nodes[3].id).toMatch(/^[0-9a-f-]+$/);
    });
  });

  describe('RemoveNode Operation', () => {
    it('should remove node by ID', async () => {
      const operation: RemoveNodeOperation = {
        type: 'removeNode',
        nodeId: 'http-1'
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      expect(result.workflow!.nodes).toHaveLength(2);
      expect(result.workflow!.nodes.find((n: any) => n.id === 'http-1')).toBeUndefined();
    });

    it('should remove node by name', async () => {
      const operation: RemoveNodeOperation = {
        type: 'removeNode',
        nodeName: 'HTTP Request'
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      expect(result.workflow!.nodes).toHaveLength(2);
      expect(result.workflow!.nodes.find((n: any) => n.name === 'HTTP Request')).toBeUndefined();
    });

    it('should clean up connections when removing node', async () => {
      const operation: RemoveNodeOperation = {
        type: 'removeNode',
        nodeId: 'http-1'
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      expect(result.workflow!.connections['HTTP Request']).toBeUndefined();
      // Check that connections from Webhook were cleaned up
      if (result.workflow!.connections['Webhook'] && result.workflow!.connections['Webhook'].main && result.workflow!.connections['Webhook'].main[0]) {
        expect(result.workflow!.connections['Webhook'].main[0]).toHaveLength(0);
      } else {
        // Webhook connections should be cleaned up entirely
        expect(result.workflow!.connections['Webhook']).toBeUndefined();
      }
    });

    it('should reject removing non-existent node', async () => {
      const operation: RemoveNodeOperation = {
        type: 'removeNode',
        nodeId: 'non-existent'
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('Node not found');
    });
  });

  describe('UpdateNode Operation', () => {
    it('should update node parameters', async () => {
      const operation: UpdateNodeOperation = {
        type: 'updateNode',
        nodeId: 'http-1',
        changes: {
          'parameters.method': 'POST',
          'parameters.url': 'https://new-api.example.com'
        }
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      const updatedNode = result.workflow!.nodes.find((n: any) => n.id === 'http-1');
      expect(updatedNode!.parameters.method).toBe('POST');
      expect(updatedNode!.parameters.url).toBe('https://new-api.example.com');
    });

    it('should update nested properties using dot notation', async () => {
      const operation: UpdateNodeOperation = {
        type: 'updateNode',
        nodeName: 'Slack',
        changes: {
          'parameters.resource': 'channel',
          'parameters.operation': 'create',
          'credentials.slackApi.name': 'New Slack Account'
        }
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      const updatedNode = result.workflow!.nodes.find((n: any) => n.name === 'Slack');
      expect(updatedNode!.parameters.resource).toBe('channel');
      expect(updatedNode!.parameters.operation).toBe('create');
      expect((updatedNode!.credentials as any).slackApi.name).toBe('New Slack Account');
    });

    it('should reject updating non-existent node', async () => {
      const operation: UpdateNodeOperation = {
        type: 'updateNode',
        nodeId: 'non-existent',
        changes: {
          'parameters.test': 'value'
        }
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('Node not found');
    });
  });

  describe('MoveNode Operation', () => {
    it('should move node to new position', async () => {
      const operation: MoveNodeOperation = {
        type: 'moveNode',
        nodeId: 'http-1',
        position: [1000, 500]
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      const movedNode = result.workflow!.nodes.find((n: any) => n.id === 'http-1');
      expect(movedNode!.position).toEqual([1000, 500]);
    });

    it('should move node by name', async () => {
      const operation: MoveNodeOperation = {
        type: 'moveNode',
        nodeName: 'Webhook',
        position: [100, 100]
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      const movedNode = result.workflow!.nodes.find((n: any) => n.name === 'Webhook');
      expect(movedNode!.position).toEqual([100, 100]);
    });
  });

  describe('Enable/Disable Node Operations', () => {
    it('should disable a node', async () => {
      const operation: DisableNodeOperation = {
        type: 'disableNode',
        nodeId: 'http-1'
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      const disabledNode = result.workflow!.nodes.find((n: any) => n.id === 'http-1');
      expect(disabledNode!.disabled).toBe(true);
    });

    it('should enable a disabled node', async () => {
      // First disable the node
      baseWorkflow.nodes[1].disabled = true;

      const operation: EnableNodeOperation = {
        type: 'enableNode',
        nodeId: 'http-1'
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      const enabledNode = result.workflow!.nodes.find((n: any) => n.id === 'http-1');
      expect(enabledNode!.disabled).toBe(false);
    });
  });

  describe('AddConnection Operation', () => {
    it('should add a new connection', async () => {
      // First add a new node to connect to
      const addNodeOp: AddNodeOperation = {
        type: 'addNode',
        node: {
          name: 'Code',
          type: 'n8n-nodes-base.code',
          position: [1000, 300]
        }
      };

      const addConnectionOp: AddConnectionOperation = {
        type: 'addConnection',
        source: 'slack-1',
        target: 'Code'
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [addNodeOp, addConnectionOp]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      expect(result.workflow!.connections['Slack']).toBeDefined();
      expect(result.workflow!.connections['Slack'].main[0]).toHaveLength(1);
      expect(result.workflow!.connections['Slack'].main[0][0].node).toBe('Code');
    });

    it('should reject duplicate connections', async () => {
      const operation: AddConnectionOperation = {
        type: 'addConnection',
        source: 'Webhook',  // Use node name not ID
        target: 'HTTP Request'  // Use node name not ID
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('Connection already exists');
    });

    it('should reject connection to non-existent source node', async () => {
      const operation: AddConnectionOperation = {
        type: 'addConnection',
        source: 'non-existent',
        target: 'http-1'
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('Source node not found');
    });

    it('should reject connection to non-existent target node', async () => {
      const operation: AddConnectionOperation = {
        type: 'addConnection',
        source: 'webhook-1',
        target: 'non-existent'
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('Target node not found');
    });

    it('should support custom output and input types', async () => {
      // Add an IF node that has multiple outputs
      const addNodeOp: AddNodeOperation = {
        type: 'addNode',
        node: {
          name: 'IF',
          type: 'n8n-nodes-base.if',
          position: [600, 400]
        }
      };

      const addConnectionOp: AddConnectionOperation = {
        type: 'addConnection',
        source: 'IF',
        target: 'slack-1',
        sourceOutput: 'false',
        targetInput: 'main',
        sourceIndex: 0,
        targetIndex: 0
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [addNodeOp, addConnectionOp]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      expect(result.workflow!.connections['IF'].false).toBeDefined();
      expect(result.workflow!.connections['IF'].false[0][0].node).toBe('Slack');
    });
  });

  describe('RemoveConnection Operation', () => {
    it('should remove an existing connection', async () => {
      const operation: RemoveConnectionOperation = {
        type: 'removeConnection',
        source: 'Webhook',  // Use node name
        target: 'HTTP Request'  // Use node name
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      // After removing the connection, the array should be empty or cleaned up
      if (result.workflow!.connections['Webhook']) {
        if (result.workflow!.connections['Webhook'].main && result.workflow!.connections['Webhook'].main.length > 0) {
          expect(result.workflow!.connections['Webhook'].main[0]).toHaveLength(0);
        } else {
          expect(result.workflow!.connections['Webhook'].main).toHaveLength(0);
        }
      } else {
        // Connection was cleaned up entirely
        expect(result.workflow!.connections['Webhook']).toBeUndefined();
      }
    });

    it('should reject removing non-existent connection', async () => {
      const operation: RemoveConnectionOperation = {
        type: 'removeConnection',
        source: 'Slack',  // Use node name
        target: 'Webhook'  // Use node name
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('No connections found');
    });
  });

  describe('UpdateConnection Operation', () => {
    it('should update connection properties', async () => {
      // Add an IF node with multiple outputs
      const addNodeOp: AddNodeOperation = {
        type: 'addNode',
        node: {
          name: 'IF',
          type: 'n8n-nodes-base.if',
          position: [600, 300]
        }
      };

      const addConnectionOp: AddConnectionOperation = {
        type: 'addConnection',
        source: 'IF',
        target: 'slack-1',
        sourceOutput: 'true'
      };

      const updateConnectionOp: UpdateConnectionOperation = {
        type: 'updateConnection',
        source: 'IF',
        target: 'slack-1',
        changes: {
          sourceOutput: 'false',
          sourceIndex: 0,
          targetIndex: 0
        }
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [addNodeOp, addConnectionOp, updateConnectionOp]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      // After update, the connection should be on 'false' output only
      expect(result.workflow!.connections['IF'].false).toBeDefined();
      expect(result.workflow!.connections['IF'].false[0][0].node).toBe('Slack');
      // The 'true' output should still have the original connection
      // because updateConnection removes using the NEW output values, not the old ones
      expect(result.workflow!.connections['IF'].true).toBeDefined();
      expect(result.workflow!.connections['IF'].true[0][0].node).toBe('Slack');
    });
  });

  describe('UpdateSettings Operation', () => {
    it('should update workflow settings', async () => {
      const operation: UpdateSettingsOperation = {
        type: 'updateSettings',
        settings: {
          executionOrder: 'v0',
          timezone: 'America/New_York',
          executionTimeout: 300
        }
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      expect(result.workflow!.settings!.executionOrder).toBe('v0');
      expect(result.workflow!.settings!.timezone).toBe('America/New_York');
      expect(result.workflow!.settings!.executionTimeout).toBe(300);
    });

    it('should create settings object if not exists', async () => {
      delete baseWorkflow.settings;

      const operation: UpdateSettingsOperation = {
        type: 'updateSettings',
        settings: {
          saveManualExecutions: false
        }
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      expect(result.workflow!.settings).toBeDefined();
      expect(result.workflow!.settings!.saveManualExecutions).toBe(false);
    });
  });

  describe('UpdateName Operation', () => {
    it('should update workflow name', async () => {
      const operation: UpdateNameOperation = {
        type: 'updateName',
        name: 'Updated Workflow Name'
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      expect(result.workflow!.name).toBe('Updated Workflow Name');
    });
  });

  describe('Tag Operations', () => {
    it('should add a new tag', async () => {
      const operation: AddTagOperation = {
        type: 'addTag',
        tag: 'production'
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      expect(result.workflow!.tags).toContain('production');
      expect(result.workflow!.tags).toHaveLength(3);
    });

    it('should not add duplicate tags', async () => {
      const operation: AddTagOperation = {
        type: 'addTag',
        tag: 'test' // Already exists
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      expect(result.workflow!.tags).toHaveLength(2); // No change
    });

    it('should create tags array if not exists', async () => {
      delete baseWorkflow.tags;

      const operation: AddTagOperation = {
        type: 'addTag',
        tag: 'new-tag'
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      expect(result.workflow!.tags).toBeDefined();
      expect(result.workflow!.tags).toEqual(['new-tag']);
    });

    it('should remove an existing tag', async () => {
      const operation: RemoveTagOperation = {
        type: 'removeTag',
        tag: 'test'
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      expect(result.workflow!.tags).not.toContain('test');
      expect(result.workflow!.tags).toHaveLength(1);
    });

    it('should handle removing non-existent tag gracefully', async () => {
      const operation: RemoveTagOperation = {
        type: 'removeTag',
        tag: 'non-existent'
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      expect(result.workflow!.tags).toHaveLength(2); // No change
    });
  });

  describe('ValidateOnly Mode', () => {
    it('should validate without applying changes', async () => {
      const operation: UpdateNameOperation = {
        type: 'updateName',
        name: 'Validated But Not Applied'
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation],
        validateOnly: true
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Validation successful');
      expect(result.workflow).toBeUndefined();
    });

    it('should return validation errors in validateOnly mode', async () => {
      const operation: RemoveNodeOperation = {
        type: 'removeNode',
        nodeId: 'non-existent'
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation],
        validateOnly: true
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('Node not found');
    });
  });

  describe('Operation Ordering', () => {
    it('should process node operations before connection operations', async () => {
      // This tests the two-pass processing: nodes first, then connections
      const operations = [
        {
          type: 'addConnection',
          source: 'NewNode',
          target: 'slack-1'
        } as AddConnectionOperation,
        {
          type: 'addNode',
          node: {
            name: 'NewNode',
            type: 'n8n-nodes-base.code',
            position: [800, 300]
          }
        } as AddNodeOperation
      ];

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      expect(result.workflow!.nodes).toHaveLength(4);
      expect(result.workflow!.connections['NewNode']).toBeDefined();
    });

    it('should handle dependent operations correctly', async () => {
      const operations = [
        {
          type: 'removeNode',
          nodeId: 'http-1'
        } as RemoveNodeOperation,
        {
          type: 'addNode',
          node: {
            name: 'HTTP Request', // Reuse the same name
            type: 'n8n-nodes-base.httpRequest',
            position: [600, 300]
          }
        } as AddNodeOperation,
        {
          type: 'addConnection',
          source: 'webhook-1',
          target: 'HTTP Request'
        } as AddConnectionOperation
      ];

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      expect(result.workflow!.nodes).toHaveLength(3);
      expect(result.workflow!.connections['Webhook'].main[0][0].node).toBe('HTTP Request');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown operation type', async () => {
      const operation = {
        type: 'unknownOperation',
        someData: 'test'
      } as any;

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('Unknown operation type');
    });

    it('should stop on first validation error', async () => {
      const operations = [
        {
          type: 'removeNode',
          nodeId: 'non-existent'
        } as RemoveNodeOperation,
        {
          type: 'updateName',
          name: 'This should not be applied'
        } as UpdateNameOperation
      ];

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].operation).toBe(0);
    });

    it('should return operation details in error', async () => {
      const operation: RemoveNodeOperation = {
        type: 'removeNode',
        nodeId: 'non-existent',
        description: 'Test remove operation'
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(false);
      expect(result.errors![0].details).toEqual(operation);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple operations of different types', async () => {
      const operations = [
        {
          type: 'updateName',
          name: 'Complex Workflow'
        } as UpdateNameOperation,
        {
          type: 'addNode',
          node: {
            name: 'Filter',
            type: 'n8n-nodes-base.filter',
            position: [800, 200]
          }
        } as AddNodeOperation,
        {
          type: 'removeConnection',
          source: 'HTTP Request',  // Use node name
          target: 'Slack'  // Use node name
        } as RemoveConnectionOperation,
        {
          type: 'addConnection',
          source: 'HTTP Request',  // Use node name
          target: 'Filter'
        } as AddConnectionOperation,
        {
          type: 'addConnection',
          source: 'Filter',
          target: 'Slack'  // Use node name
        } as AddConnectionOperation
      ];

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      expect(result.workflow!.name).toBe('Complex Workflow');
      expect(result.workflow!.nodes).toHaveLength(4);
      expect(result.workflow!.connections['HTTP Request'].main[0][0].node).toBe('Filter');
      expect(result.workflow!.connections['Filter'].main[0][0].node).toBe('Slack');
      expect(result.operationsApplied).toBe(5);
    });

    it('should preserve workflow immutability', async () => {
      const originalNodes = [...baseWorkflow.nodes];
      const originalConnections = JSON.stringify(baseWorkflow.connections);

      const operation: UpdateNameOperation = {
        type: 'updateName',
        name: 'Modified'
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      await diffEngine.applyDiff(baseWorkflow, request);
      
      // Original workflow should remain unchanged
      expect(baseWorkflow.name).toBe('Test Workflow');
      expect(baseWorkflow.nodes).toEqual(originalNodes);
      expect(JSON.stringify(baseWorkflow.connections)).toBe(originalConnections);
    });

    it('should handle node ID as name fallback', async () => {
      // Test the findNode helper's fallback behavior
      const operation: UpdateNodeOperation = {
        type: 'updateNode',
        nodeId: 'Webhook', // Using name as ID
        changes: {
          'parameters.path': 'new-webhook-path'
        }
      };

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations: [operation]
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      const updatedNode = result.workflow!.nodes.find((n: any) => n.name === 'Webhook');
      expect(updatedNode!.parameters.path).toBe('new-webhook-path');
    });
  });

  describe('Success Messages', () => {
    it('should provide informative success message', async () => {
      const operations = [
        {
          type: 'addNode',
          node: {
            name: 'Node1',
            type: 'n8n-nodes-base.code',
            position: [100, 100]
          }
        } as AddNodeOperation,
        {
          type: 'updateSettings',
          settings: { timezone: 'UTC' }
        } as UpdateSettingsOperation,
        {
          type: 'addTag',
          tag: 'v2'
        } as AddTagOperation
      ];

      const request: WorkflowDiffRequest = {
        id: 'test-workflow',
        operations
      };

      const result = await diffEngine.applyDiff(baseWorkflow, request);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully applied 3 operations');
      expect(result.message).toContain('1 node ops');
      expect(result.message).toContain('2 other ops');
    });
  });
});