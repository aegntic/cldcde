import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowValidator } from '@/services/workflow-validator';
import { EnhancedConfigValidator } from '@/services/enhanced-config-validator';

// Mock logger to prevent console output
vi.mock('@/utils/logger', () => ({
  Logger: vi.fn().mockImplementation(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn()
  }))
}));

describe('WorkflowValidator - Simple Unit Tests', () => {
  let validator: WorkflowValidator;
  
  // Create a simple mock repository
  const createMockRepository = (nodeData: Record<string, any>) => ({
    getNode: vi.fn((type: string) => nodeData[type] || null),
    findSimilarNodes: vi.fn().mockReturnValue([])
  });

  // Create a simple mock validator class
  const createMockValidatorClass = (validationResult: any) => ({
    validateWithMode: vi.fn().mockReturnValue(validationResult)
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic validation scenarios', () => {
    it('should pass validation for a webhook workflow with single node', async () => {
      // Arrange
      const nodeData = {
        'n8n-nodes-base.webhook': {
          type: 'nodes-base.webhook',
          displayName: 'Webhook',
          name: 'webhook',
          version: 1,
          isVersioned: true,
          properties: []
        },
        'nodes-base.webhook': {
          type: 'nodes-base.webhook',
          displayName: 'Webhook',
          name: 'webhook',
          version: 1,
          isVersioned: true,
          properties: []
        }
      };

      const mockRepository = createMockRepository(nodeData);
      const mockValidatorClass = createMockValidatorClass({
        valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      });

      validator = new WorkflowValidator(mockRepository as any, mockValidatorClass as any);

      const workflow = {
        name: 'Webhook Workflow',
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 1,
            position: [250, 300] as [number, number],
            parameters: {}
          }
        ],
        connections: {}
      };

      // Act
      const result = await validator.validateWorkflow(workflow as any);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      // Single webhook node should just have a warning about no connections
      expect(result.warnings.some(w => w.message.includes('no connections'))).toBe(true);
    });

    it('should fail validation for unknown node types', async () => {
      // Arrange
      const mockRepository = createMockRepository({}); // Empty node data
      const mockValidatorClass = createMockValidatorClass({
        valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      });

      validator = new WorkflowValidator(mockRepository as any, mockValidatorClass as any);

      const workflow = {
        name: 'Test Workflow',
        nodes: [
          {
            id: '1',
            name: 'Unknown',
            type: 'n8n-nodes-base.unknownNode',
            position: [250, 300] as [number, number],
            parameters: {}
          }
        ],
        connections: {}
      };

      // Act
      const result = await validator.validateWorkflow(workflow as any);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Unknown node type'))).toBe(true);
    });

    it('should detect duplicate node names', async () => {
      // Arrange
      const mockRepository = createMockRepository({});
      const mockValidatorClass = createMockValidatorClass({
        valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      });

      validator = new WorkflowValidator(mockRepository as any, mockValidatorClass as any);

      const workflow = {
        name: 'Duplicate Names',
        nodes: [
          {
            id: '1',
            name: 'HTTP Request',
            type: 'n8n-nodes-base.httpRequest',
            position: [250, 300] as [number, number],
            parameters: {}
          },
          {
            id: '2',
            name: 'HTTP Request', // Duplicate name
            type: 'n8n-nodes-base.httpRequest',
            position: [450, 300] as [number, number],
            parameters: {}
          }
        ],
        connections: {}
      };

      // Act
      const result = await validator.validateWorkflow(workflow as any);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Duplicate node name'))).toBe(true);
    });

    it('should validate connections properly', async () => {
      // Arrange
      const nodeData = {
        'n8n-nodes-base.manualTrigger': {
          type: 'nodes-base.manualTrigger',
          displayName: 'Manual Trigger',
          isVersioned: false,
          properties: []
        },
        'nodes-base.manualTrigger': {
          type: 'nodes-base.manualTrigger',
          displayName: 'Manual Trigger',
          isVersioned: false,
          properties: []
        },
        'n8n-nodes-base.set': {
          type: 'nodes-base.set',
          displayName: 'Set',
          version: 2,
          isVersioned: true,
          properties: []
        },
        'nodes-base.set': {
          type: 'nodes-base.set',
          displayName: 'Set',
          version: 2,
          isVersioned: true,
          properties: []
        }
      };

      const mockRepository = createMockRepository(nodeData);
      const mockValidatorClass = createMockValidatorClass({
        valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      });

      validator = new WorkflowValidator(mockRepository as any, mockValidatorClass as any);

      const workflow = {
        name: 'Connected Workflow',
        nodes: [
          {
            id: '1',
            name: 'Manual Trigger',
            type: 'n8n-nodes-base.manualTrigger',
            position: [250, 300] as [number, number],
            parameters: {}
          },
          {
            id: '2',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            typeVersion: 2,
            position: [450, 300] as [number, number],
            parameters: {}
          }
        ],
        connections: {
          'Manual Trigger': {
            main: [[{ node: 'Set', type: 'main', index: 0 }]]
          }
        }
      };

      // Act
      const result = await validator.validateWorkflow(workflow as any);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.statistics.validConnections).toBe(1);
      expect(result.statistics.invalidConnections).toBe(0);
    });

    it('should detect workflow cycles', async () => {
      // Arrange
      const nodeData = {
        'n8n-nodes-base.set': {
          type: 'nodes-base.set',
          displayName: 'Set',
          isVersioned: true,
          version: 2,
          properties: []
        },
        'nodes-base.set': {
          type: 'nodes-base.set',
          displayName: 'Set',
          isVersioned: true,
          version: 2,
          properties: []
        }
      };

      const mockRepository = createMockRepository(nodeData);
      const mockValidatorClass = createMockValidatorClass({
        valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      });

      validator = new WorkflowValidator(mockRepository as any, mockValidatorClass as any);

      const workflow = {
        name: 'Cyclic Workflow',
        nodes: [
          {
            id: '1',
            name: 'Node A',
            type: 'n8n-nodes-base.set',
            typeVersion: 2,
            position: [250, 300] as [number, number],
            parameters: {}
          },
          {
            id: '2',
            name: 'Node B',
            type: 'n8n-nodes-base.set',
            typeVersion: 2,
            position: [450, 300] as [number, number],
            parameters: {}
          }
        ],
        connections: {
          'Node A': {
            main: [[{ node: 'Node B', type: 'main', index: 0 }]]
          },
          'Node B': {
            main: [[{ node: 'Node A', type: 'main', index: 0 }]] // Creates a cycle
          }
        }
      };

      // Act
      const result = await validator.validateWorkflow(workflow as any);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('cycle'))).toBe(true);
    });

    it('should handle null workflow gracefully', async () => {
      // Arrange
      const mockRepository = createMockRepository({});
      const mockValidatorClass = createMockValidatorClass({
        valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      });

      validator = new WorkflowValidator(mockRepository as any, mockValidatorClass as any);

      // Act
      const result = await validator.validateWorkflow(null as any);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('workflow is null or undefined');
    });

    it('should require connections for multi-node workflows', async () => {
      // Arrange
      const nodeData = {
        'n8n-nodes-base.manualTrigger': {
          type: 'nodes-base.manualTrigger',
          displayName: 'Manual Trigger',
          properties: []
        },
        'nodes-base.manualTrigger': {
          type: 'nodes-base.manualTrigger',
          displayName: 'Manual Trigger',
          properties: []
        },
        'n8n-nodes-base.set': {
          type: 'nodes-base.set',
          displayName: 'Set',
          version: 2,
          isVersioned: true,
          properties: []
        },
        'nodes-base.set': {
          type: 'nodes-base.set',
          displayName: 'Set',
          version: 2,
          isVersioned: true,
          properties: []
        }
      };

      const mockRepository = createMockRepository(nodeData);
      const mockValidatorClass = createMockValidatorClass({
        valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      });

      validator = new WorkflowValidator(mockRepository as any, mockValidatorClass as any);

      const workflow = {
        name: 'No Connections',
        nodes: [
          {
            id: '1',
            name: 'Manual Trigger',
            type: 'n8n-nodes-base.manualTrigger',
            position: [250, 300] as [number, number],
            parameters: {}
          },
          {
            id: '2',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            typeVersion: 2,
            position: [450, 300] as [number, number],
            parameters: {}
          }
        ],
        connections: {} // No connections between nodes
      };

      // Act
      const result = await validator.validateWorkflow(workflow as any);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Multi-node workflow has no connections'))).toBe(true);
    });

    it('should validate typeVersion for versioned nodes', async () => {
      // Arrange
      const nodeData = {
        'n8n-nodes-base.httpRequest': {
          type: 'nodes-base.httpRequest',
          displayName: 'HTTP Request',
          isVersioned: true,
          version: 3, // Latest version is 3
          properties: []
        },
        'nodes-base.httpRequest': {
          type: 'nodes-base.httpRequest',
          displayName: 'HTTP Request',
          isVersioned: true,
          version: 3,
          properties: []
        }
      };

      const mockRepository = createMockRepository(nodeData);
      const mockValidatorClass = createMockValidatorClass({
        valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      });

      validator = new WorkflowValidator(mockRepository as any, mockValidatorClass as any);

      const workflow = {
        name: 'Version Test',
        nodes: [
          {
            id: '1',
            name: 'HTTP Request',
            type: 'n8n-nodes-base.httpRequest',
            typeVersion: 2, // Outdated version
            position: [250, 300] as [number, number],
            parameters: {}
          }
        ],
        connections: {}
      };

      // Act
      const result = await validator.validateWorkflow(workflow as any);

      // Assert
      expect(result.warnings.some(w => w.message.includes('Outdated typeVersion'))).toBe(true);
    });

    it('should detect invalid node type format', async () => {
      // Arrange
      const mockRepository = createMockRepository({});
      const mockValidatorClass = createMockValidatorClass({
        valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      });

      validator = new WorkflowValidator(mockRepository as any, mockValidatorClass as any);

      const workflow = {
        name: 'Invalid Type Format',
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'nodes-base.webhook', // Invalid format
            position: [250, 300] as [number, number],
            parameters: {}
          }
        ],
        connections: {}
      };

      // Act
      const result = await validator.validateWorkflow(workflow as any);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => 
        e.message.includes('Invalid node type') && 
        e.message.includes('Use "n8n-nodes-base.webhook" instead')
      )).toBe(true);
    });
  });
});