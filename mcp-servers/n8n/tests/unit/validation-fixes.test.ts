/**
 * Test suite for validation system fixes
 * Covers issues #58, #68, #70, #73
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { WorkflowValidator } from '../../src/services/workflow-validator';
import { EnhancedConfigValidator } from '../../src/services/enhanced-config-validator';
import { ToolValidation, Validator, ValidationError } from '../../src/utils/validation-schemas';

describe('Validation System Fixes', () => {
  let workflowValidator: WorkflowValidator;
  let mockNodeRepository: any;

  beforeAll(async () => {
    // Initialize test environment
    process.env.NODE_ENV = 'test';
    
    // Mock repository for testing
    mockNodeRepository = {
      getNode: (nodeType: string) => {
        if (nodeType === 'nodes-base.webhook' || nodeType === 'n8n-nodes-base.webhook') {
          return {
            nodeType: 'nodes-base.webhook',
            displayName: 'Webhook',
            properties: [
              { name: 'path', required: true, displayName: 'Path' },
              { name: 'httpMethod', required: true, displayName: 'HTTP Method' }
            ]
          };
        }
        if (nodeType === 'nodes-base.set' || nodeType === 'n8n-nodes-base.set') {
          return {
            nodeType: 'nodes-base.set',
            displayName: 'Set',
            properties: [
              { name: 'values', required: false, displayName: 'Values' }
            ]
          };
        }
        return null;
      }
    } as any;

    workflowValidator = new WorkflowValidator(mockNodeRepository, EnhancedConfigValidator);
  });

  afterAll(() => {
    // Reset NODE_ENV instead of deleting it
    delete (process.env as any).NODE_ENV;
  });

  describe('Issue #73: validate_node_minimal crashes without input validation', () => {
    test('should handle empty config in validation schemas', () => {
      // Test the validation schema handles empty config
      const result = ToolValidation.validateNodeMinimal({
        nodeType: 'nodes-base.webhook',
        config: undefined
      });
      
      expect(result).toBeDefined();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('config');
    });

    test('should handle null config in validation schemas', () => {
      const result = ToolValidation.validateNodeMinimal({
        nodeType: 'nodes-base.webhook',
        config: null
      });
      
      expect(result).toBeDefined();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('config');
    });

    test('should accept valid config object', () => {
      const result = ToolValidation.validateNodeMinimal({
        nodeType: 'nodes-base.webhook',
        config: { path: '/webhook', httpMethod: 'POST' }
      });
      
      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Issue #58: validate_node_operation crashes on nested input', () => {
    test('should handle invalid nodeType gracefully', () => {
      expect(() => {
        EnhancedConfigValidator.validateWithMode(
          undefined as any,
          { resource: 'channel', operation: 'create' },
          [],
          'operation',
          'ai-friendly'
        );
      }).toThrow(Error);
    });

    test('should handle null nodeType gracefully', () => {
      expect(() => {
        EnhancedConfigValidator.validateWithMode(
          null as any,
          { resource: 'channel', operation: 'create' },
          [],
          'operation',
          'ai-friendly'
        );
      }).toThrow(Error);
    });

    test('should handle non-string nodeType gracefully', () => {
      expect(() => {
        EnhancedConfigValidator.validateWithMode(
          { type: 'nodes-base.slack' } as any,
          { resource: 'channel', operation: 'create' },
          [],
          'operation',
          'ai-friendly'
        );
      }).toThrow(Error);
    });

    test('should handle valid nodeType properly', () => {
      const result = EnhancedConfigValidator.validateWithMode(
        'nodes-base.set',
        { values: {} },
        [],
        'operation',
        'ai-friendly'
      );
      
      expect(result).toBeDefined();
      expect(typeof result.valid).toBe('boolean');
    });
  });

  describe('Issue #70: Profile settings not respected', () => {
    test('should pass profile parameter to all validation phases', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 200] as [number, number],
            parameters: { path: '/test', httpMethod: 'POST' },
            typeVersion: 1
          },
          {
            id: '2',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            position: [300, 200] as [number, number],
            parameters: { values: {} },
            typeVersion: 1
          }
        ],
        connections: {
          'Webhook': {
            main: [[{ node: 'Set', type: 'main', index: 0 }]]
          }
        }
      };

      const result = await workflowValidator.validateWorkflow(workflow, {
        validateNodes: true,
        validateConnections: true,
        validateExpressions: true,
        profile: 'minimal'
      });

      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
      // In minimal profile, should have fewer warnings/errors - just check it's reasonable
      expect(result.warnings.length).toBeLessThanOrEqual(5);
    });

    test('should filter out sticky notes from validation', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 200] as [number, number],
            parameters: { path: '/test', httpMethod: 'POST' },
            typeVersion: 1
          },
          {
            id: '2',
            name: 'Sticky Note',
            type: 'n8n-nodes-base.stickyNote',
            position: [300, 100] as [number, number],
            parameters: { content: 'This is a note' },
            typeVersion: 1
          }
        ],
        connections: {}
      };

      const result = await workflowValidator.validateWorkflow(workflow);

      expect(result).toBeDefined();
      expect(result.statistics.totalNodes).toBe(1); // Only webhook, sticky note excluded
      expect(result.statistics.enabledNodes).toBe(1);
    });

    test('should allow legitimate loops in cycle detection', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Manual Trigger',
            type: 'n8n-nodes-base.manualTrigger',
            position: [100, 200] as [number, number],
            parameters: {},
            typeVersion: 1
          },
          {
            id: '2',
            name: 'SplitInBatches',
            type: 'n8n-nodes-base.splitInBatches',
            position: [300, 200] as [number, number],
            parameters: { batchSize: 1 },
            typeVersion: 1
          },
          {
            id: '3',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            position: [500, 200] as [number, number],
            parameters: { values: {} },
            typeVersion: 1
          }
        ],
        connections: {
          'Manual Trigger': {
            main: [[{ node: 'SplitInBatches', type: 'main', index: 0 }]]
          },
          'SplitInBatches': {
            main: [
              [{ node: 'Set', type: 'main', index: 0 }], // Done output
              [{ node: 'Set', type: 'main', index: 0 }]  // Loop output
            ]
          },
          'Set': {
            main: [[{ node: 'SplitInBatches', type: 'main', index: 0 }]] // Loop back
          }
        }
      };

      const result = await workflowValidator.validateWorkflow(workflow);

      expect(result).toBeDefined();
      // Should not report cycle error for legitimate SplitInBatches loop
      const cycleErrors = result.errors.filter(e => e.message.includes('cycle'));
      expect(cycleErrors).toHaveLength(0);
    });
  });

  describe('Issue #68: Better error recovery suggestions', () => {
    test('should provide recovery suggestions for invalid node types', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Invalid Node',
            type: 'invalid-node-type',
            position: [100, 200] as [number, number],
            parameters: {},
            typeVersion: 1
          }
        ],
        connections: {}
      };

      const result = await workflowValidator.validateWorkflow(workflow);

      expect(result).toBeDefined();
      expect(result.valid).toBe(false);
      expect(result.suggestions.length).toBeGreaterThan(0);
      
      // Should contain recovery suggestions
      const recoveryStarted = result.suggestions.some(s => s.includes('🔧 RECOVERY'));
      expect(recoveryStarted).toBe(true);
    });

    test('should provide recovery suggestions for connection errors', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 200] as [number, number],
            parameters: { path: '/test', httpMethod: 'POST' },
            typeVersion: 1
          }
        ],
        connections: {
          'Webhook': {
            main: [[{ node: 'NonExistentNode', type: 'main', index: 0 }]]
          }
        }
      };

      const result = await workflowValidator.validateWorkflow(workflow);

      expect(result).toBeDefined();
      expect(result.valid).toBe(false);
      expect(result.suggestions.length).toBeGreaterThan(0);
      
      // Should contain connection recovery suggestions
      const connectionRecovery = result.suggestions.some(s => 
        s.includes('Connection errors detected') || s.includes('connection')
      );
      expect(connectionRecovery).toBe(true);
    });

    test('should provide workflow for multiple errors', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Invalid Node 1',
            type: 'invalid-type-1',
            position: [100, 200] as [number, number],
            parameters: {}
            // Missing typeVersion
          },
          {
            id: '2',
            name: 'Invalid Node 2',
            type: 'invalid-type-2',
            position: [300, 200] as [number, number],
            parameters: {}
            // Missing typeVersion
          },
          {
            id: '3',
            name: 'Invalid Node 3',
            type: 'invalid-type-3',
            position: [500, 200] as [number, number],
            parameters: {}
            // Missing typeVersion
          }
        ],
        connections: {
          'Invalid Node 1': {
            main: [[{ node: 'NonExistent', type: 'main', index: 0 }]]
          }
        }
      };

      const result = await workflowValidator.validateWorkflow(workflow);

      expect(result).toBeDefined();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
      
      // Should provide step-by-step recovery workflow
      const workflowSuggestion = result.suggestions.some(s => 
        s.includes('SUGGESTED WORKFLOW') && s.includes('Too many errors detected')
      );
      expect(workflowSuggestion).toBe(true);
    });
  });

  describe('Enhanced Input Validation', () => {
    test('should validate tool parameters with schemas', () => {
      // Test validate_node_operation parameters
      const validationResult = ToolValidation.validateNodeOperation({
        nodeType: 'nodes-base.webhook',
        config: { path: '/test' },
        profile: 'ai-friendly'
      });
      
      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
    });

    test('should reject invalid parameters', () => {
      const validationResult = ToolValidation.validateNodeOperation({
        nodeType: 123, // Invalid type
        config: 'not an object', // Invalid type
        profile: 'invalid-profile' // Invalid enum value
      });
      
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
    });

    test('should format validation errors properly', () => {
      const validationResult = ToolValidation.validateNodeOperation({
        nodeType: null,
        config: null
      });
      
      const errorMessage = Validator.formatErrors(validationResult, 'validate_node_operation');
      
      expect(errorMessage).toContain('validate_node_operation: Validation failed:');
      expect(errorMessage).toContain('nodeType');
      expect(errorMessage).toContain('config');
    });
  });
});