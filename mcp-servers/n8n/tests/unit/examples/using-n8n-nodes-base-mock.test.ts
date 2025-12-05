import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getNodeTypes, mockNodeBehavior, resetAllMocks } from '../__mocks__/n8n-nodes-base';

// Example service that uses n8n-nodes-base
class WorkflowService {
  async getNodeDescription(nodeName: string) {
    const nodeTypes = getNodeTypes();
    const node = nodeTypes.getByName(nodeName);
    return node?.description;
  }

  async executeNode(nodeName: string, context: any) {
    const nodeTypes = getNodeTypes();
    const node = nodeTypes.getByName(nodeName);
    
    if (!node?.execute) {
      throw new Error(`Node ${nodeName} does not have an execute method`);
    }
    
    return node.execute.call(context);
  }

  async validateSlackMessage(channel: string, text: string) {
    if (!channel || !text) {
      throw new Error('Channel and text are required');
    }
    
    const nodeTypes = getNodeTypes();
    const slackNode = nodeTypes.getByName('slack');
    
    if (!slackNode) {
      throw new Error('Slack node not found');
    }
    
    // Check if required properties exist
    const channelProp = slackNode.description.properties.find(p => p.name === 'channel');
    const textProp = slackNode.description.properties.find(p => p.name === 'text');
    
    return !!(channelProp && textProp);
  }
}

// Mock the module at the top level
vi.mock('n8n-nodes-base', () => {
  const { getNodeTypes: mockGetNodeTypes } = require('../__mocks__/n8n-nodes-base');
  return {
    getNodeTypes: mockGetNodeTypes
  };
});

describe('WorkflowService with n8n-nodes-base mock', () => {
  let service: WorkflowService;

  beforeEach(() => {
    resetAllMocks();
    service = new WorkflowService();
  });

  describe('getNodeDescription', () => {
    it('should get webhook node description', async () => {
      const description = await service.getNodeDescription('webhook');
      
      expect(description).toBeDefined();
      expect(description?.name).toBe('webhook');
      expect(description?.group).toContain('trigger');
      expect(description?.webhooks).toBeDefined();
    });

    it('should get httpRequest node description', async () => {
      const description = await service.getNodeDescription('httpRequest');
      
      expect(description).toBeDefined();
      expect(description?.name).toBe('httpRequest');
      expect(description?.version).toBe(3);
      
      const methodProp = description?.properties.find(p => p.name === 'method');
      expect(methodProp).toBeDefined();
      expect(methodProp?.options).toHaveLength(6);
    });
  });

  describe('executeNode', () => {
    it('should execute httpRequest node with custom response', async () => {
      // Override the httpRequest node behavior for this test
      mockNodeBehavior('httpRequest', {
        execute: vi.fn(async function(this: any) {
          const url = this.getNodeParameter('url', 0);
          return [[{ 
            json: { 
              statusCode: 200,
              url,
              customData: 'mocked response' 
            } 
          }]];
        })
      });

      const mockContext = {
        getInputData: vi.fn(() => [{ json: { input: 'data' } }]),
        getNodeParameter: vi.fn((name: string) => {
          if (name === 'url') return 'https://test.com/api';
          return '';
        })
      };

      const result = await service.executeNode('httpRequest', mockContext);
      
      expect(result).toBeDefined();
      expect(result[0][0].json).toMatchObject({
        statusCode: 200,
        url: 'https://test.com/api',
        customData: 'mocked response'
      });
    });

    it('should execute slack node and track calls', async () => {
      const mockContext = {
        getInputData: vi.fn(() => [{ json: { message: 'test' } }]),
        getNodeParameter: vi.fn((name: string, index: number) => {
          const params: Record<string, string> = {
            resource: 'message',
            operation: 'post',
            channel: '#general',
            text: 'Hello from test!'
          };
          return params[name] || '';
        }),
        getCredentials: vi.fn(async () => ({ token: 'mock-token' }))
      };

      const result = await service.executeNode('slack', mockContext);
      
      expect(result).toBeDefined();
      expect(result[0][0].json).toMatchObject({
        ok: true,
        channel: '#general',
        message: {
          text: 'Hello from test!'
        }
      });
      
      // Verify the mock was called
      expect(mockContext.getNodeParameter).toHaveBeenCalledWith('channel', 0, '');
      expect(mockContext.getNodeParameter).toHaveBeenCalledWith('text', 0, '');
    });

    it('should throw error for non-executable node', async () => {
      // Create a trigger-only node
      mockNodeBehavior('webhook', {
        execute: undefined // Remove execute method
      });

      await expect(
        service.executeNode('webhook', {})
      ).rejects.toThrow('Node webhook does not have an execute method');
    });
  });

  describe('validateSlackMessage', () => {
    it('should validate slack message parameters', async () => {
      const isValid = await service.validateSlackMessage('#general', 'Hello');
      expect(isValid).toBe(true);
    });

    it('should throw error for missing parameters', async () => {
      await expect(
        service.validateSlackMessage('', 'Hello')
      ).rejects.toThrow('Channel and text are required');

      await expect(
        service.validateSlackMessage('#general', '')
      ).rejects.toThrow('Channel and text are required');
    });

    it('should handle missing slack node', async () => {
      // Save the original mock implementation
      const originalImplementation = vi.mocked(getNodeTypes).getMockImplementation();
      
      // Override getNodeTypes to return undefined for slack
      vi.mocked(getNodeTypes).mockImplementation(() => ({
        getByName: vi.fn((name: string) => {
          if (name === 'slack') return undefined;
          // Return the actual mock implementation for other nodes
          const actualRegistry = originalImplementation ? originalImplementation() : getNodeTypes();
          return actualRegistry.getByName(name);
        }),
        getByNameAndVersion: vi.fn()
      }));

      await expect(
        service.validateSlackMessage('#general', 'Hello')
      ).rejects.toThrow('Slack node not found');
      
      // Restore the original implementation
      if (originalImplementation) {
        vi.mocked(getNodeTypes).mockImplementation(originalImplementation);
      }
    });
  });

  describe('complex workflow scenarios', () => {
    it('should handle if node branching', async () => {
      const mockContext = {
        getInputData: vi.fn(() => [
          { json: { status: 'active' } },
          { json: { status: 'inactive' } },
          { json: { status: 'active' } },
        ]),
        getNodeParameter: vi.fn()
      };

      const result = await service.executeNode('if', mockContext);
      
      expect(result).toHaveLength(2); // true and false branches
      expect(result[0]).toHaveLength(2); // items at index 0 and 2
      expect(result[1]).toHaveLength(1); // item at index 1
    });

    it('should handle merge node combining inputs', async () => {
      const mockContext = {
        getInputData: vi.fn((inputIndex?: number) => {
          if (inputIndex === 0) return [{ json: { source: 'input1' } }];
          if (inputIndex === 1) return [{ json: { source: 'input2' } }];
          return [{ json: { source: 'input1' } }];
        }),
        getNodeParameter: vi.fn(() => 'append')
      };

      const result = await service.executeNode('merge', mockContext);
      
      expect(result).toBeDefined();
      expect(result[0]).toHaveLength(1);
    });
  });
});