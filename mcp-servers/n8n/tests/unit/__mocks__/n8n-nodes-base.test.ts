import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getNodeTypes, mockNodeBehavior, resetAllMocks, registerMockNode } from './n8n-nodes-base';

describe('n8n-nodes-base mock', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('getNodeTypes', () => {
    it('should return node types registry', () => {
      const registry = getNodeTypes();
      expect(registry).toBeDefined();
      expect(registry.getByName).toBeDefined();
      expect(registry.getByNameAndVersion).toBeDefined();
    });

    it('should retrieve webhook node', () => {
      const registry = getNodeTypes();
      const webhookNode = registry.getByName('webhook');
      
      expect(webhookNode).toBeDefined();
      expect(webhookNode?.description.name).toBe('webhook');
      expect(webhookNode?.description.group).toContain('trigger');
      expect(webhookNode?.webhook).toBeDefined();
    });

    it('should retrieve httpRequest node', () => {
      const registry = getNodeTypes();
      const httpNode = registry.getByName('httpRequest');
      
      expect(httpNode).toBeDefined();
      expect(httpNode?.description.name).toBe('httpRequest');
      expect(httpNode?.description.version).toBe(3);
      expect(httpNode?.execute).toBeDefined();
    });

    it('should retrieve slack node', () => {
      const registry = getNodeTypes();
      const slackNode = registry.getByName('slack');
      
      expect(slackNode).toBeDefined();
      expect(slackNode?.description.credentials).toHaveLength(1);
      expect(slackNode?.description.credentials?.[0].name).toBe('slackApi');
    });
  });

  describe('node execution', () => {
    it('should execute webhook node', async () => {
      const registry = getNodeTypes();
      const webhookNode = registry.getByName('webhook');
      
      const mockContext = {
        getWebhookName: vi.fn(() => 'default'),
        getBodyData: vi.fn(() => ({ test: 'data' })),
        getHeaderData: vi.fn(() => ({ 'content-type': 'application/json' })),
        getQueryData: vi.fn(() => ({ query: 'param' })),
        getRequestObject: vi.fn(),
        getResponseObject: vi.fn(),
        helpers: {
          returnJsonArray: vi.fn((data) => [{ json: data }]),
        },
      };

      const result = await webhookNode?.webhook?.call(mockContext as any);
      
      expect(result).toBeDefined();
      expect(result?.workflowData).toBeDefined();
      expect(result?.workflowData[0]).toHaveLength(1);
      expect(result?.workflowData[0][0].json).toMatchObject({
        headers: { 'content-type': 'application/json' },
        params: { query: 'param' },
        body: { test: 'data' },
      });
    });

    it('should execute httpRequest node', async () => {
      const registry = getNodeTypes();
      const httpNode = registry.getByName('httpRequest');
      
      const mockContext = {
        getInputData: vi.fn(() => [{ json: { test: 'input' } }]),
        getNodeParameter: vi.fn((name: string) => {
          if (name === 'method') return 'POST';
          if (name === 'url') return 'https://api.example.com';
          return '';
        }),
        getCredentials: vi.fn(),
        helpers: {
          returnJsonArray: vi.fn((data) => [{ json: data }]),
          httpRequest: vi.fn(),
          webhook: vi.fn(),
        },
      };

      const result = await httpNode?.execute?.call(mockContext as any);
      
      expect(result).toBeDefined();
      expect(result!).toHaveLength(1);
      expect(result![0]).toHaveLength(1);
      expect(result![0][0].json).toMatchObject({
        statusCode: 200,
        body: {
          success: true,
          method: 'POST',
          url: 'https://api.example.com',
        },
      });
    });
  });

  describe('mockNodeBehavior', () => {
    it('should override node execution behavior', async () => {
      const customExecute = vi.fn(async function() {
        return [[{ json: { custom: 'response' } }]];
      });

      mockNodeBehavior('httpRequest', {
        execute: customExecute,
      });

      const registry = getNodeTypes();
      const httpNode = registry.getByName('httpRequest');
      
      const mockContext = {
        getInputData: vi.fn(() => []),
        getNodeParameter: vi.fn(),
        getCredentials: vi.fn(),
        helpers: {
          returnJsonArray: vi.fn(),
          httpRequest: vi.fn(),
          webhook: vi.fn(),
        },
      };

      const result = await httpNode?.execute?.call(mockContext as any);
      
      expect(customExecute).toHaveBeenCalled();
      expect(result).toEqual([[{ json: { custom: 'response' } }]]);
    });

    it('should override node description', () => {
      mockNodeBehavior('slack', {
        description: {
          displayName: 'Custom Slack',
          version: 3,
          name: 'slack',
          group: ['output'],
          description: 'Send messages to Slack',
          defaults: { name: 'Slack' },
          inputs: ['main'],
          outputs: ['main'],
          properties: [],
        },
      });

      const registry = getNodeTypes();
      const slackNode = registry.getByName('slack');
      
      expect(slackNode?.description.displayName).toBe('Custom Slack');
      expect(slackNode?.description.version).toBe(3);
      expect(slackNode?.description.name).toBe('slack'); // Original preserved
    });
  });

  describe('registerMockNode', () => {
    it('should register custom node', () => {
      const customNode = {
        description: {
          displayName: 'Custom Node',
          name: 'customNode',
          group: ['transform'],
          version: 1,
          description: 'A custom test node',
          defaults: { name: 'Custom' },
          inputs: ['main'],
          outputs: ['main'],
          properties: [],
        },
        execute: vi.fn(async function() {
          return [[{ json: { custom: true } }]];
        }),
      };

      registerMockNode('customNode', customNode);

      const registry = getNodeTypes();
      const retrievedNode = registry.getByName('customNode');
      
      expect(retrievedNode).toBe(customNode);
      expect(retrievedNode?.description.name).toBe('customNode');
    });
  });

  describe('conditional nodes', () => {
    it('should execute if node with two outputs', async () => {
      const registry = getNodeTypes();
      const ifNode = registry.getByName('if');
      
      const mockContext = {
        getInputData: vi.fn(() => [
          { json: { value: 1 } },
          { json: { value: 2 } },
          { json: { value: 3 } },
          { json: { value: 4 } },
        ]),
        getNodeParameter: vi.fn(),
        getCredentials: vi.fn(),
        helpers: {
          returnJsonArray: vi.fn(),
          httpRequest: vi.fn(),
          webhook: vi.fn(),
        },
      };

      const result = await ifNode?.execute?.call(mockContext as any);
      
      expect(result!).toHaveLength(2); // true and false outputs
      expect(result![0]).toHaveLength(2); // even indices
      expect(result![1]).toHaveLength(2); // odd indices
    });

    it('should execute switch node with multiple outputs', async () => {
      const registry = getNodeTypes();
      const switchNode = registry.getByName('switch');
      
      const mockContext = {
        getInputData: vi.fn(() => [
          { json: { value: 1 } },
          { json: { value: 2 } },
          { json: { value: 3 } },
          { json: { value: 4 } },
        ]),
        getNodeParameter: vi.fn(),
        getCredentials: vi.fn(),
        helpers: {
          returnJsonArray: vi.fn(),
          httpRequest: vi.fn(),
          webhook: vi.fn(),
        },
      };

      const result = await switchNode?.execute?.call(mockContext as any);
      
      expect(result!).toHaveLength(4); // 4 outputs
      expect(result![0]).toHaveLength(1); // item 0
      expect(result![1]).toHaveLength(1); // item 1
      expect(result![2]).toHaveLength(1); // item 2
      expect(result![3]).toHaveLength(1); // item 3
    });
  });
});