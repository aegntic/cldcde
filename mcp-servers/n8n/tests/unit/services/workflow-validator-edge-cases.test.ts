import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowValidator } from '@/services/workflow-validator';
import { NodeRepository } from '@/database/node-repository';
import { EnhancedConfigValidator } from '@/services/enhanced-config-validator';
import type { WorkflowValidationResult } from '@/services/workflow-validator';

// NOTE: Mocking EnhancedConfigValidator is challenging because:
// 1. WorkflowValidator expects the class itself, not an instance
// 2. The class has static methods that are called directly
// 3. vi.mock() hoisting makes it difficult to mock properly
//
// For properly mocked tests, see workflow-validator-with-mocks.test.ts
// These tests use a partially mocked approach that may still access the database

// Mock dependencies
vi.mock('@/database/node-repository');
vi.mock('@/services/expression-validator');
vi.mock('@/utils/logger');

// Mock EnhancedConfigValidator with static methods
vi.mock('@/services/enhanced-config-validator', () => ({
  EnhancedConfigValidator: {
    validate: vi.fn().mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      visibleProperties: [],
      hiddenProperties: []
    }),
    validateWithMode: vi.fn().mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
      fixedConfig: null
    })
  }
}));

describe('WorkflowValidator - Edge Cases', () => {
  let validator: WorkflowValidator;
  let mockNodeRepository: any;
  let mockEnhancedConfigValidator: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock repository that returns node info for test nodes and common n8n nodes
    mockNodeRepository = {
      getNode: vi.fn().mockImplementation((type: string) => {
        if (type === 'test.node' || type === 'test.agent' || type === 'test.tool') {
          return {
            name: 'Test Node',
            type: type,
            typeVersion: 1,
            properties: [],
            package: 'test-package',
            version: 1,
            displayName: 'Test Node',
            isVersioned: false
          };
        }
        // Handle common n8n node types
        if (type.startsWith('n8n-nodes-base.') || type.startsWith('nodes-base.')) {
          const nodeName = type.split('.')[1];
          return {
            name: nodeName,
            type: type,
            typeVersion: 1,
            properties: [],
            package: 'n8n-nodes-base',
            version: 1,
            displayName: nodeName.charAt(0).toUpperCase() + nodeName.slice(1),
            isVersioned: ['set', 'httpRequest'].includes(nodeName)
          };
        }
        return null;
      }),
      findByType: vi.fn().mockReturnValue({
        name: 'Test Node',
        type: 'test.node',
        typeVersion: 1,
        properties: []
      }),
      searchNodes: vi.fn().mockReturnValue([])
    };
    
    // Ensure EnhancedConfigValidator.validate always returns a valid result
    vi.mocked(EnhancedConfigValidator.validate).mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      visibleProperties: [],
      hiddenProperties: []
    });
    
    // Create validator instance with mocked dependencies
    validator = new WorkflowValidator(mockNodeRepository, EnhancedConfigValidator);
  });

  describe('Null and Undefined Handling', () => {
    it('should handle null workflow gracefully', async () => {
      const result = await validator.validateWorkflow(null as any);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Invalid workflow structure'))).toBe(true);
    });

    it('should handle undefined workflow gracefully', async () => {
      const result = await validator.validateWorkflow(undefined as any);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Invalid workflow structure'))).toBe(true);
    });

    it('should handle workflow with null nodes array', async () => {
      const workflow = {
        nodes: null,
        connections: {}
      };
      const result = await validator.validateWorkflow(workflow as any);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('nodes must be an array'))).toBe(true);
    });

    it('should handle workflow with null connections', async () => {
      const workflow = {
        nodes: [],
        connections: null
      };
      const result = await validator.validateWorkflow(workflow as any);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('connections must be an object'))).toBe(true);
    });

    it('should handle nodes with null/undefined properties', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: null,
            type: 'test.node',
            position: [0, 0],
            parameters: undefined
          }
        ],
        connections: {}
      };
      const result = await validator.validateWorkflow(workflow as any);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle empty workflow', async () => {
      const workflow = {
        nodes: [],
        connections: {}
      };
      const result = await validator.validateWorkflow(workflow as any);
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.message.includes('empty'))).toBe(true);
    });

    it('should handle very large workflows', async () => {
      const nodes = Array(1000).fill(null).map((_, i) => ({
        id: `node${i}`,
        name: `Node ${i}`,
        type: 'test.node',
        position: [i * 100, 0] as [number, number],
        parameters: {}
      }));
      
      const connections: any = {};
      for (let i = 0; i < 999; i++) {
        connections[`Node ${i}`] = {
          main: [[{ node: `Node ${i + 1}`, type: 'main', index: 0 }]]
        };
      }
      
      const workflow = { nodes, connections };
      
      const start = Date.now();
      const result = await validator.validateWorkflow(workflow as any);
      const duration = Date.now() - start;
      
      expect(result).toBeDefined();
      // Use longer timeout for CI environments
      const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
      const timeout = isCI ? 10000 : 5000; // 10 seconds for CI, 5 seconds for local
      expect(duration).toBeLessThan(timeout);
    });

    it('should handle deeply nested connections', async () => {
      const workflow = {
        nodes: [
          { id: '1', name: 'Start', type: 'test.node', position: [0, 0] as [number, number], parameters: {} },
          { id: '2', name: 'Middle', type: 'test.node', position: [100, 0] as [number, number], parameters: {} },
          { id: '3', name: 'End', type: 'test.node', position: [200, 0] as [number, number], parameters: {} }
        ],
        connections: {
          'Start': {
            main: [[{ node: 'Middle', type: 'main', index: 0 }]],
            error: [[{ node: 'End', type: 'main', index: 0 }]],
            ai_tool: [[{ node: 'Middle', type: 'ai_tool', index: 0 }]]
          }
        }
      };
      
      const result = await validator.validateWorkflow(workflow as any);
      expect(result.statistics.invalidConnections).toBe(0);
    });

    it.skip('should handle nodes at extreme positions - FIXME: mock issues', async () => {
      const workflow = {
        nodes: [
          { id: '1', name: 'FarLeft', type: 'n8n-nodes-base.set', position: [-999999, -999999] as [number, number], parameters: {} },
          { id: '2', name: 'FarRight', type: 'n8n-nodes-base.set', position: [999999, 999999] as [number, number], parameters: {} },
          { id: '3', name: 'Zero', type: 'n8n-nodes-base.set', position: [0, 0] as [number, number], parameters: {} }
        ],
        connections: {
          'FarLeft': {
            main: [[{ node: 'FarRight', type: 'main', index: 0 }]]
          },
          'FarRight': {
            main: [[{ node: 'Zero', type: 'main', index: 0 }]]
          }
        }
      };
      
      const result = await validator.validateWorkflow(workflow as any);
      expect(result.valid).toBe(true);
    });
  });

  describe('Invalid Data Type Handling', () => {
    it('should handle non-array nodes', async () => {
      const workflow = {
        nodes: 'not-an-array',
        connections: {}
      };
      const result = await validator.validateWorkflow(workflow as any);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('nodes must be an array');
    });

    it('should handle non-object connections', async () => {
      const workflow = {
        nodes: [],
        connections: []
      };
      const result = await validator.validateWorkflow(workflow as any);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('connections must be an object');
    });

    it('should handle invalid position values', async () => {
      const workflow = {
        nodes: [
          { id: '1', name: 'InvalidPos', type: 'test.node', position: 'invalid' as any, parameters: {} },
          { id: '2', name: 'NaNPos', type: 'test.node', position: [NaN, NaN] as [number, number], parameters: {} },
          { id: '3', name: 'InfinityPos', type: 'test.node', position: [Infinity, -Infinity] as [number, number], parameters: {} }
        ],
        connections: {}
      };
      
      const result = await validator.validateWorkflow(workflow as any);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle circular references in workflow object', async () => {
      const workflow: any = {
        nodes: [],
        connections: {}
      };
      workflow.circular = workflow;
      
      await expect(validator.validateWorkflow(workflow)).resolves.toBeDefined();
    });
  });

  describe('Connection Validation Edge Cases', () => {
    it('should detect self-referencing nodes', async () => {
      const workflow = {
        nodes: [
          { id: '1', name: 'SelfLoop', type: 'test.node', position: [0, 0] as [number, number], parameters: {} }
        ],
        connections: {
          'SelfLoop': {
            main: [[{ node: 'SelfLoop', type: 'main', index: 0 }]]
          }
        }
      };
      
      const result = await validator.validateWorkflow(workflow as any);
      expect(result.warnings.some(w => w.message.includes('self-referencing'))).toBe(true);
    });

    it('should handle non-existent node references', async () => {
      const workflow = {
        nodes: [
          { id: '1', name: 'Node1', type: 'test.node', position: [0, 0] as [number, number], parameters: {} }
        ],
        connections: {
          'Node1': {
            main: [[{ node: 'NonExistent', type: 'main', index: 0 }]]
          }
        }
      };
      
      const result = await validator.validateWorkflow(workflow as any);
      expect(result.errors.some(e => e.message.includes('non-existent'))).toBe(true);
    });

    it('should handle invalid connection formats', async () => {
      const workflow = {
        nodes: [
          { id: '1', name: 'Node1', type: 'test.node', position: [0, 0] as [number, number], parameters: {} }
        ],
        connections: {
          'Node1': {
            main: 'invalid-format' as any
          }
        }
      };
      
      const result = await validator.validateWorkflow(workflow as any);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle missing connection properties', async () => {
      const workflow = {
        nodes: [
          { id: '1', name: 'Node1', type: 'test.node', position: [0, 0] as [number, number], parameters: {} },
          { id: '2', name: 'Node2', type: 'test.node', position: [100, 0] as [number, number], parameters: {} }
        ],
        connections: {
          'Node1': {
            main: [[{ node: 'Node2' }]] // Missing type and index
          }
        } as any
      };
      
      const result = await validator.validateWorkflow(workflow as any);
      // Should still work as type and index can have defaults
      expect(result.statistics.validConnections).toBeGreaterThan(0);
    });

    it('should handle negative output indices', async () => {
      const workflow = {
        nodes: [
          { id: '1', name: 'Node1', type: 'test.node', position: [0, 0] as [number, number], parameters: {} },
          { id: '2', name: 'Node2', type: 'test.node', position: [100, 0] as [number, number], parameters: {} }
        ],
        connections: {
          'Node1': {
            main: [[{ node: 'Node2', type: 'main', index: -1 }]]
          }
        }
      };
      
      const result = await validator.validateWorkflow(workflow as any);
      expect(result.errors.some(e => e.message.includes('Invalid'))).toBe(true);
    });
  });

  describe('Special Characters and Unicode', () => {
    it.skip('should handle special characters in node names - FIXME: mock issues', async () => {
      const workflow = {
        nodes: [
          { id: '1', name: 'Node@#$%', type: 'n8n-nodes-base.set', position: [0, 0] as [number, number], parameters: {} },
          { id: '2', name: 'Node 中文', type: 'n8n-nodes-base.set', position: [100, 0] as [number, number], parameters: {} },
          { id: '3', name: 'Node😊', type: 'n8n-nodes-base.set', position: [200, 0] as [number, number], parameters: {} }
        ],
        connections: {
          'Node@#$%': {
            main: [[{ node: 'Node 中文', type: 'main', index: 0 }]]
          },
          'Node 中文': {
            main: [[{ node: 'Node😊', type: 'main', index: 0 }]]
          }
        }
      };
      
      const result = await validator.validateWorkflow(workflow as any);
      expect(result.valid).toBe(true);
    });

    it('should handle very long node names', async () => {
      const longName = 'A'.repeat(1000);
      const workflow = {
        nodes: [
          { id: '1', name: longName, type: 'test.node', position: [0, 0] as [number, number], parameters: {} }
        ],
        connections: {}
      };
      
      const result = await validator.validateWorkflow(workflow as any);
      expect(result.warnings.some(w => w.message.includes('very long'))).toBe(true);
    });
  });

  describe('Batch Validation', () => {
    it.skip('should handle batch validation with mixed valid/invalid workflows - FIXME: mock issues', async () => {
      const workflows = [
        {
          nodes: [
            { id: '1', name: 'Node1', type: 'n8n-nodes-base.set', position: [0, 0] as [number, number], parameters: {} },
            { id: '2', name: 'Node2', type: 'n8n-nodes-base.set', position: [100, 0] as [number, number], parameters: {} }
          ],
          connections: {
            'Node1': {
              main: [[{ node: 'Node2', type: 'main', index: 0 }]]
            }
          }
        },
        null as any,
        {
          nodes: 'invalid' as any,
          connections: {}
        }
      ];
      
      const promises = workflows.map(w => validator.validateWorkflow(w));
      const results = await Promise.all(promises);
      
      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(false);
      expect(results[2].valid).toBe(false);
    });

    it.skip('should handle concurrent validation requests - FIXME: mock issues', async () => {
      const workflow = {
        nodes: [{ id: '1', name: 'Test', type: 'n8n-nodes-base.webhook', position: [0, 0] as [number, number], parameters: {} }],
        connections: {}
      };
      
      const promises = Array(10).fill(null).map(() => validator.validateWorkflow(workflow));
      const results = await Promise.all(promises);
      
      expect(results.every(r => r.valid)).toBe(true);
    });
  });

  describe('Expression Validation Edge Cases', () => {
    it('should skip expression validation when option is false', async () => {
      const workflow = {
        nodes: [{
          id: '1',
          name: 'Node1',
          type: 'test.node',
          position: [0, 0] as [number, number],
          parameters: {
            value: '{{ $json.invalid.expression }}'
          }
        }],
        connections: {}
      };
      
      const result = await validator.validateWorkflow(workflow, {
        validateExpressions: false
      });
      
      expect(result.statistics.expressionsValidated).toBe(0);
    });
  });

  describe('Connection Type Validation', () => {
    it('should validate different connection types', async () => {
      const workflow = {
        nodes: [
          { id: '1', name: 'Agent', type: 'test.agent', position: [0, 0] as [number, number], parameters: {} },
          { id: '2', name: 'Tool', type: 'test.tool', position: [100, 0] as [number, number], parameters: {} }
        ],
        connections: {
          'Tool': {
            ai_tool: [[{ node: 'Agent', type: 'ai_tool', index: 0 }]]
          }
        }
      };
      
      const result = await validator.validateWorkflow(workflow as any);
      expect(result.statistics.validConnections).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery', () => {
    it('should continue validation after encountering errors', async () => {
      const workflow = {
        nodes: [
          { id: '1', name: null as any, type: 'test.node', position: [0, 0] as [number, number], parameters: {} },
          { id: '2', name: 'Valid', type: 'test.node', position: [100, 0] as [number, number], parameters: {} },
          { id: '3', name: 'AlsoValid', type: 'test.node', position: [200, 0] as [number, number], parameters: {} }
        ],
        connections: {
          'Valid': {
            main: [[{ node: 'AlsoValid', type: 'main', index: 0 }]]
          }
        }
      };
      
      const result = await validator.validateWorkflow(workflow as any);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.statistics.validConnections).toBeGreaterThan(0);
    });
  });

  describe('Static Method Alternatives', () => {
    it('should validate workflow connections only', async () => {
      const workflow = {
        nodes: [
          { id: '1', name: 'Node1', type: 'test.node', position: [0, 0] as [number, number], parameters: {} },
          { id: '2', name: 'Node2', type: 'test.node', position: [100, 0] as [number, number], parameters: {} }
        ],
        connections: {
          'Node1': {
            main: [[{ node: 'Node2', type: 'main', index: 0 }]]
          }
        }
      };
      
      const result = await validator.validateWorkflow(workflow, {
        validateNodes: false,
        validateExpressions: false,
        validateConnections: true
      });
      
      expect(result.statistics.validConnections).toBe(1);
    });

    it('should validate workflow expressions only', async () => {
      const workflow = {
        nodes: [{
          id: '1',
          name: 'Node1',
          type: 'test.node',
          position: [0, 0] as [number, number],
          parameters: {
            value: '{{ $json.data }}'
          }
        }],
        connections: {}
      };
      
      const result = await validator.validateWorkflow(workflow, {
        validateNodes: false,
        validateExpressions: true,
        validateConnections: false
      });
      
      expect(result.statistics.expressionsValidated).toBeGreaterThan(0);
    });
  });
});