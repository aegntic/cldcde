import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { WorkflowValidator } from '@/services/workflow-validator';
import { NodeRepository } from '@/database/node-repository';
import { EnhancedConfigValidator } from '@/services/enhanced-config-validator';
import { ExpressionValidator } from '@/services/expression-validator';
import { createWorkflow } from '@tests/utils/builders/workflow.builder';
import type { WorkflowNode, Workflow } from '@/types/n8n-api';

// Mock dependencies
vi.mock('@/database/node-repository');
vi.mock('@/services/enhanced-config-validator');
vi.mock('@/services/expression-validator');
vi.mock('@/utils/logger');

describe('WorkflowValidator - Comprehensive Tests', () => {
  let validator: WorkflowValidator;
  let mockNodeRepository: NodeRepository;
  let mockEnhancedConfigValidator: typeof EnhancedConfigValidator;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock instances
    mockNodeRepository = new NodeRepository({} as any) as any;
    mockEnhancedConfigValidator = EnhancedConfigValidator as any;

    // Set up default mock behaviors
    vi.mocked(mockNodeRepository.getNode).mockImplementation((nodeType: string) => {
      // Handle normalization for custom nodes
      if (nodeType === 'n8n-nodes-custom.customNode') {
        return {
          type: 'n8n-nodes-custom.customNode',
          displayName: 'Custom Node',
          package: 'n8n-nodes-custom',
          version: 1,
          isVersioned: false,
          properties: [],
          isAITool: false
        };
      }
      
      // Mock common node types
      const nodeTypes: Record<string, any> = {
        'nodes-base.webhook': {
          type: 'nodes-base.webhook',
          displayName: 'Webhook',
          package: 'n8n-nodes-base',
          version: 2,
          isVersioned: true,
          properties: []
        },
        'nodes-base.httpRequest': {
          type: 'nodes-base.httpRequest',
          displayName: 'HTTP Request',
          package: 'n8n-nodes-base',
          version: 4,
          isVersioned: true,
          properties: []
        },
        'nodes-base.set': {
          type: 'nodes-base.set',
          displayName: 'Set',
          package: 'n8n-nodes-base',
          version: 3,
          isVersioned: true,
          properties: []
        },
        'nodes-base.code': {
          type: 'nodes-base.code',
          displayName: 'Code',
          package: 'n8n-nodes-base',
          version: 2,
          isVersioned: true,
          properties: []
        },
        'nodes-base.manualTrigger': {
          type: 'nodes-base.manualTrigger',
          displayName: 'Manual Trigger',
          package: 'n8n-nodes-base',
          version: 1,
          isVersioned: true,
          properties: []
        },
        'nodes-base.if': {
          type: 'nodes-base.if',
          displayName: 'IF',
          package: 'n8n-nodes-base',
          version: 2,
          isVersioned: true,
          properties: []
        },
        'nodes-base.slack': {
          type: 'nodes-base.slack',
          displayName: 'Slack',
          package: 'n8n-nodes-base',
          version: 2,
          isVersioned: true,
          properties: []
        },
        'nodes-langchain.agent': {
          type: 'nodes-langchain.agent',
          displayName: 'AI Agent',
          package: '@n8n/n8n-nodes-langchain',
          version: 1,
          isVersioned: true,
          properties: [],
          isAITool: false
        },
        'nodes-base.postgres': {
          type: 'nodes-base.postgres',
          displayName: 'Postgres',
          package: 'n8n-nodes-base',
          version: 2,
          isVersioned: true,
          properties: []
        },
        'community.customNode': {
          type: 'community.customNode',
          displayName: 'Custom Node',
          package: 'n8n-nodes-custom',
          version: 1,
          isVersioned: false,
          properties: [],
          isAITool: false
        }
      };

      return nodeTypes[nodeType] || null;
    });

    vi.mocked(mockEnhancedConfigValidator.validateWithMode).mockReturnValue({
      errors: [],
      warnings: [],
      suggestions: [],
      mode: 'operation' as const,
      valid: true,
      visibleProperties: [],
      hiddenProperties: []
    } as any);

    vi.mocked(ExpressionValidator.validateNodeExpressions).mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
      usedVariables: new Set(),
      usedNodes: new Set()
    });

    // Create validator instance
    validator = new WorkflowValidator(mockNodeRepository, mockEnhancedConfigValidator);
  });

  describe('validateWorkflow', () => {
    it('should validate a minimal valid workflow', async () => {
      const workflow = createWorkflow('Test Workflow')
        .addWebhookNode({ name: 'Webhook' })
        .build();

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.statistics.totalNodes).toBe(1);
      expect(result.statistics.enabledNodes).toBe(1);
      expect(result.statistics.triggerNodes).toBe(1);
    });

    it('should validate a workflow with all options disabled', async () => {
      const workflow = createWorkflow('Test Workflow')
        .addWebhookNode({ name: 'Webhook' })
        .build();

      const result = await validator.validateWorkflow(workflow as any, {
        validateNodes: false,
        validateConnections: false,
        validateExpressions: false
      });

      expect(result.valid).toBe(true);
      expect(mockNodeRepository.getNode).not.toHaveBeenCalled();
      expect(ExpressionValidator.validateNodeExpressions).not.toHaveBeenCalled();
    });

    it('should handle validation errors gracefully', async () => {
      const workflow = createWorkflow('Test Workflow')
        .addWebhookNode({ name: 'Webhook' })
        .build();

      // Make the validation throw an error
      vi.mocked(mockNodeRepository.getNode).mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('Database error'))).toBe(true);
    });

    it('should use different validation profiles', async () => {
      const workflow = createWorkflow('Test Workflow')
        .addWebhookNode({ name: 'Webhook' })
        .build();

      const profiles = ['minimal', 'runtime', 'ai-friendly', 'strict'] as const;

      for (const profile of profiles) {
        const result = await validator.validateWorkflow(workflow as any, { profile });
        expect(result).toBeDefined();
        expect(mockEnhancedConfigValidator.validateWithMode).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          expect.any(Array),
          'operation',
          profile
        );
      }
    });
  });

  describe('validateWorkflowStructure', () => {
    it('should error when nodes array is missing', async () => {
      const workflow = { connections: {} } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message === 'Workflow must have a nodes array')).toBe(true);
    });

    it('should error when connections object is missing', async () => {
      const workflow = { nodes: [] } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message === 'Workflow must have a connections object')).toBe(true);
    });

    it('should warn when workflow has no nodes', async () => {
      const workflow = { nodes: [], connections: {} } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.valid).toBe(true); // Empty workflows are valid but get a warning
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toBe('Workflow is empty - no nodes defined');
    });

    it('should error for single non-webhook node workflow', async () => {
      const workflow = {
        nodes: [{
          id: '1',
          name: 'Set',
          type: 'n8n-nodes-base.set',
          position: [100, 100],
          parameters: {}
        }],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Single-node workflows are only valid for webhook endpoints'))).toBe(true);
    });

    it('should warn for webhook without connections', async () => {
      const workflow = {
        nodes: [{
          id: '1',
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          position: [100, 100],
          parameters: {},
          typeVersion: 2
        }],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.message.includes('Webhook node has no connections'))).toBe(true);
    });

    it('should error for multi-node workflow without connections', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {}
          },
          {
            id: '2',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            position: [300, 100],
            parameters: {}
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Multi-node workflow has no connections'))).toBe(true);
    });

    it('should detect duplicate node names', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {}
          },
          {
            id: '2',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [300, 100],
            parameters: {}
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.errors.some(e => e.message.includes('Duplicate node name: "Webhook"'))).toBe(true);
    });

    it('should detect duplicate node IDs', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook1',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {}
          },
          {
            id: '1',
            name: 'Webhook2',
            type: 'n8n-nodes-base.webhook',
            position: [300, 100],
            parameters: {}
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.errors.some(e => e.message.includes('Duplicate node ID: "1"'))).toBe(true);
    });

    it('should count trigger nodes correctly', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {}
          },
          {
            id: '2',
            name: 'Schedule',
            type: 'n8n-nodes-base.scheduleTrigger',
            position: [100, 300],
            parameters: {}
          },
          {
            id: '3',
            name: 'Manual',
            type: 'n8n-nodes-base.manualTrigger',
            position: [100, 500],
            parameters: {}
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.statistics.triggerNodes).toBe(3);
    });

    it('should warn when no trigger nodes exist', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            position: [100, 100],
            parameters: {}
          },
          {
            id: '2',
            name: 'Code',
            type: 'n8n-nodes-base.code',
            position: [300, 100],
            parameters: {}
          }
        ],
        connections: {
          'Set': {
            main: [[{ node: 'Code', type: 'main', index: 0 }]]
          }
        }
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.warnings.some(w => w.message.includes('Workflow has no trigger nodes'))).toBe(true);
    });

    it('should not count disabled nodes in enabledNodes count', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {},
            disabled: true
          },
          {
            id: '2',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            position: [300, 100],
            parameters: {}
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.statistics.totalNodes).toBe(2);
      expect(result.statistics.enabledNodes).toBe(1);
    });
  });

  describe('validateAllNodes', () => {
    it('should skip disabled nodes', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {},
            disabled: true
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(mockNodeRepository.getNode).not.toHaveBeenCalled();
    });

    it('should error for invalid node type starting with nodes-base', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'nodes-base.webhook', // Missing n8n- prefix
            position: [100, 100],
            parameters: {}
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Invalid node type: "nodes-base.webhook"'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('Use "n8n-nodes-base.webhook" instead'))).toBe(true);
    });

    it('should handle unknown node types with suggestions', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'HTTP',
            type: 'httpRequest', // Missing package prefix
            position: [100, 100],
            parameters: {}
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Unknown node type: "httpRequest"'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('Did you mean "n8n-nodes-base.httpRequest"?'))).toBe(true);
    });

    it('should try normalized types for n8n-nodes-base', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {}
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(mockNodeRepository.getNode).toHaveBeenCalledWith('n8n-nodes-base.webhook');
      expect(mockNodeRepository.getNode).toHaveBeenCalledWith('nodes-base.webhook');
    });

    it('should try normalized types for langchain nodes', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Agent',
            type: '@n8n/n8n-nodes-langchain.agent',
            position: [100, 100],
            parameters: {}
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(mockNodeRepository.getNode).toHaveBeenCalledWith('@n8n/n8n-nodes-langchain.agent');
      expect(mockNodeRepository.getNode).toHaveBeenCalledWith('nodes-langchain.agent');
    });

    it('should validate typeVersion for versioned nodes', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {}
            // Missing typeVersion
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.errors.some(e => e.message.includes('Missing required property \'typeVersion\''))).toBe(true);
    });

    it('should error for invalid typeVersion', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {},
            typeVersion: 'invalid' as any
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.errors.some(e => e.message.includes('Invalid typeVersion: invalid'))).toBe(true);
    });

    it('should warn for outdated typeVersion', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {},
            typeVersion: 1 // Current version is 2
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.warnings.some(w => w.message.includes('Outdated typeVersion: 1. Latest is 2'))).toBe(true);
    });

    it('should error for typeVersion exceeding maximum', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {},
            typeVersion: 10 // Max is 2
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.errors.some(e => e.message.includes('typeVersion 10 exceeds maximum supported version 2'))).toBe(true);
    });

    it('should add node validation errors and warnings', async () => {
      vi.mocked(mockEnhancedConfigValidator.validateWithMode).mockReturnValue({
        errors: [{ type: 'missing_required', property: 'url', message: 'Missing required field: url' }],
        warnings: [{ type: 'security', property: 'url', message: 'Consider using HTTPS' }],
        suggestions: [],
        mode: 'operation' as const,
        valid: false,
        visibleProperties: [],
        hiddenProperties: []
      } as any);

      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'HTTP',
            type: 'n8n-nodes-base.httpRequest',
            position: [100, 100],
            parameters: {},
            typeVersion: 4
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.errors.some(e => e.message.includes('Missing required field: url'))).toBe(true);
      expect(result.warnings.some(w => w.message.includes('Consider using HTTPS'))).toBe(true);
    });

    it('should handle node validation failures gracefully', async () => {
      vi.mocked(mockEnhancedConfigValidator.validateWithMode).mockImplementation(() => {
        throw new Error('Validation error');
      });

      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'HTTP',
            type: 'n8n-nodes-base.httpRequest',
            position: [100, 100],
            parameters: {},
            typeVersion: 4
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.errors.some(e => e.message.includes('Failed to validate node: Validation error'))).toBe(true);
    });
  });

  describe('validateConnections', () => {
    it('should validate valid connections', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {}
          },
          {
            id: '2',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            position: [300, 100],
            parameters: {}
          }
        ],
        connections: {
          'Webhook': {
            main: [[{ node: 'Set', type: 'main', index: 0 }]]
          }
        }
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.statistics.validConnections).toBe(1);
      expect(result.statistics.invalidConnections).toBe(0);
    });

    it('should error for connection from non-existent node', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {}
          }
        ],
        connections: {
          'NonExistent': {
            main: [[{ node: 'Webhook', type: 'main', index: 0 }]]
          }
        }
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.errors.some(e => e.message.includes('Connection from non-existent node: "NonExistent"'))).toBe(true);
      expect(result.statistics.invalidConnections).toBe(1);
    });

    it('should error when using node ID instead of name in source', async () => {
      const workflow = {
        nodes: [
          {
            id: 'webhook-id',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {}
          },
          {
            id: 'set-id',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            position: [300, 100],
            parameters: {}
          }
        ],
        connections: {
          'webhook-id': { // Using ID instead of name
            main: [[{ node: 'Set', type: 'main', index: 0 }]]
          }
        }
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.errors.some(e => e.message.includes('Connection uses node ID \'webhook-id\' instead of node name \'Webhook\''))).toBe(true);
    });

    it('should error for connection to non-existent node', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {}
          }
        ],
        connections: {
          'Webhook': {
            main: [[{ node: 'NonExistent', type: 'main', index: 0 }]]
          }
        }
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.errors.some(e => e.message.includes('Connection to non-existent node: "NonExistent"'))).toBe(true);
      expect(result.statistics.invalidConnections).toBe(1);
    });

    it('should error when using node ID instead of name in target', async () => {
      const workflow = {
        nodes: [
          {
            id: 'webhook-id',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {}
          },
          {
            id: 'set-id',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            position: [300, 100],
            parameters: {}
          }
        ],
        connections: {
          'Webhook': {
            main: [[{ node: 'set-id', type: 'main', index: 0 }]] // Using ID instead of name
          }
        }
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.errors.some(e => e.message.includes('Connection target uses node ID \'set-id\' instead of node name \'Set\''))).toBe(true);
    });

    it('should warn for connection to disabled node', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {}
          },
          {
            id: '2',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            position: [300, 100],
            parameters: {},
            disabled: true
          }
        ],
        connections: {
          'Webhook': {
            main: [[{ node: 'Set', type: 'main', index: 0 }]]
          }
        }
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.warnings.some(w => w.message.includes('Connection to disabled node: "Set"'))).toBe(true);
    });

    it('should validate error outputs', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'HTTP',
            type: 'n8n-nodes-base.httpRequest',
            position: [100, 100],
            parameters: {}
          },
          {
            id: '2',
            name: 'Error Handler',
            type: 'n8n-nodes-base.set',
            position: [300, 100],
            parameters: {}
          }
        ],
        connections: {
          'HTTP': {
            error: [[{ node: 'Error Handler', type: 'main', index: 0 }]]
          }
        }
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.statistics.validConnections).toBe(1);
    });

    it('should validate AI tool connections', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Agent',
            type: '@n8n/n8n-nodes-langchain.agent',
            position: [100, 100],
            parameters: {}
          },
          {
            id: '2',
            name: 'Tool',
            type: 'n8n-nodes-base.httpRequest',
            position: [300, 100],
            parameters: {}
          }
        ],
        connections: {
          'Agent': {
            ai_tool: [[{ node: 'Tool', type: 'main', index: 0 }]]
          }
        }
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.statistics.validConnections).toBe(1);
    });

    it('should warn for community nodes used as AI tools', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Agent',
            type: '@n8n/n8n-nodes-langchain.agent',
            position: [100, 100],
            parameters: {},
            typeVersion: 1
          },
          {
            id: '2',
            name: 'CustomTool',
            type: 'n8n-nodes-custom.customNode',
            position: [300, 100],
            parameters: {},
            typeVersion: 1
          }
        ],
        connections: {
          'Agent': {
            ai_tool: [[{ node: 'CustomTool', type: 'main', index: 0 }]]
          }
        }
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.warnings.some(w => w.message.includes('Community node "CustomTool" is being used as an AI tool'))).toBe(true);
    });

    it('should warn for orphaned nodes', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {}
          },
          {
            id: '2',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            position: [300, 100],
            parameters: {}
          },
          {
            id: '3',
            name: 'Orphaned',
            type: 'n8n-nodes-base.code',
            position: [500, 100],
            parameters: {}
          }
        ],
        connections: {
          'Webhook': {
            main: [[{ node: 'Set', type: 'main', index: 0 }]]
          }
        }
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.warnings.some(w => w.message.includes('Node is not connected to any other nodes') && w.nodeName === 'Orphaned')).toBe(true);
    });

    it('should detect cycles in workflow', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Node1',
            type: 'n8n-nodes-base.set',
            position: [100, 100],
            parameters: {}
          },
          {
            id: '2',
            name: 'Node2',
            type: 'n8n-nodes-base.set',
            position: [300, 100],
            parameters: {}
          },
          {
            id: '3',
            name: 'Node3',
            type: 'n8n-nodes-base.set',
            position: [500, 100],
            parameters: {}
          }
        ],
        connections: {
          'Node1': {
            main: [[{ node: 'Node2', type: 'main', index: 0 }]]
          },
          'Node2': {
            main: [[{ node: 'Node3', type: 'main', index: 0 }]]
          },
          'Node3': {
            main: [[{ node: 'Node1', type: 'main', index: 0 }]] // Creates cycle
          }
        }
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.errors.some(e => e.message.includes('Workflow contains a cycle'))).toBe(true);
    });

    it('should handle null connections properly', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'IF',
            type: 'n8n-nodes-base.if',
            position: [100, 100],
            parameters: {},
            typeVersion: 2
          },
          {
            id: '2',
            name: 'True Branch',
            type: 'n8n-nodes-base.set',
            position: [300, 50],
            parameters: {},
            typeVersion: 3
          }
        ],
        connections: {
          'IF': {
            main: [
              [{ node: 'True Branch', type: 'main', index: 0 }],
              null // False branch not connected
            ]
          }
        }
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.statistics.validConnections).toBe(1);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateExpressions', () => {
    it('should validate expressions in node parameters', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {}
          },
          {
            id: '2',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            position: [300, 100],
            parameters: {
              values: {
                string: [
                  {
                    name: 'field',
                    value: '={{ $json.data }}'
                  }
                ]
              }
            }
          }
        ],
        connections: {
          'Webhook': {
            main: [[{ node: 'Set', type: 'main', index: 0 }]]
          }
        }
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(ExpressionValidator.validateNodeExpressions).toHaveBeenCalledWith(
        expect.objectContaining({ values: expect.any(Object) }),
        expect.objectContaining({
          availableNodes: expect.arrayContaining(['Webhook']),
          currentNodeName: 'Set',
          hasInputData: true
        })
      );
    });

    it('should add expression errors to result', async () => {
      vi.mocked(ExpressionValidator.validateNodeExpressions).mockReturnValue({
        valid: false,
        errors: ['Invalid expression syntax'],
        warnings: ['Deprecated variable usage'],
        usedVariables: new Set(['$json']),
        usedNodes: new Set()
      });

      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            position: [100, 100],
            parameters: {
              value: '={{ invalid }}'
            }
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.errors.some(e => e.message.includes('Expression error: Invalid expression syntax'))).toBe(true);
      expect(result.warnings.some(w => w.message.includes('Expression warning: Deprecated variable usage'))).toBe(true);
      expect(result.statistics.expressionsValidated).toBe(1);
    });

    it('should skip expression validation for disabled nodes', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            position: [100, 100],
            parameters: {
              value: '={{ $json.data }}'
            },
            disabled: true
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(ExpressionValidator.validateNodeExpressions).not.toHaveBeenCalled();
    });
  });

  describe('checkWorkflowPatterns', () => {
    it('should suggest error handling for large workflows', async () => {
      const builder = createWorkflow('Large Workflow');
      
      // Add more than 3 nodes
      for (let i = 0; i < 5; i++) {
        builder.addCustomNode('n8n-nodes-base.set', 3, {}, { name: `Set${i}` });
      }

      const workflow = builder.build() as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.warnings.some(w => w.message.includes('Consider adding error handling'))).toBe(true);
    });

    it('should warn about long linear chains', async () => {
      const builder = createWorkflow('Linear Workflow');
      
      // Create a chain of 12 nodes
      const nodeNames: string[] = [];
      for (let i = 0; i < 12; i++) {
        const nodeName = `Node${i}`;
        builder.addCustomNode('n8n-nodes-base.set', 3, {}, { name: nodeName });
        nodeNames.push(nodeName);
      }

      // Connect them sequentially
      builder.connectSequentially(nodeNames);

      const workflow = builder.build() as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.warnings.some(w => w.message.includes('Long linear chain detected'))).toBe(true);
    });

    it('should warn about missing credentials', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Slack',
            type: 'n8n-nodes-base.slack',
            position: [100, 100],
            parameters: {},
            credentials: {
              slackApi: {} // Missing id
            }
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.warnings.some(w => w.message.includes('Missing credentials configuration for slackApi'))).toBe(true);
    });

    it('should warn about AI agents without tools', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Agent',
            type: '@n8n/n8n-nodes-langchain.agent',
            position: [100, 100],
            parameters: {}
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.warnings.some(w => w.message.includes('AI Agent has no tools connected'))).toBe(true);
    });

    it('should suggest community package setting for AI tools', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Agent',
            type: '@n8n/n8n-nodes-langchain.agent',
            position: [100, 100],
            parameters: {}
          },
          {
            id: '2',
            name: 'Tool',
            type: 'n8n-nodes-base.httpRequest',
            position: [300, 100],
            parameters: {}
          }
        ],
        connections: {
          'Agent': {
            ai_tool: [[{ node: 'Tool', type: 'main', index: 0 }]]
          }
        }
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.suggestions.some(s => s.includes('N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE'))).toBe(true);
    });
  });

  describe('checkNodeErrorHandling', () => {
    it('should error when node-level properties are inside parameters', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'HTTP',
            type: 'n8n-nodes-base.httpRequest',
            position: [100, 100],
            typeVersion: 4,
            parameters: {
              url: 'https://api.example.com',
              onError: 'continueRegularOutput', // Wrong location!
              retryOnFail: true, // Wrong location!
              credentials: {} // Wrong location!
            }
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.errors.some(e => e.message.includes('Node-level properties onError, retryOnFail, credentials are in the wrong location'))).toBe(true);
      expect(result.errors.some(e => e.details?.fix?.includes('Move these properties from node.parameters to the node level'))).toBe(true);
    });

    it('should validate onError property values', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'HTTP',
            type: 'n8n-nodes-base.httpRequest',
            position: [100, 100],
            parameters: {},
            onError: 'invalidValue' as any
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.errors.some(e => e.message.includes('Invalid onError value: "invalidValue"'))).toBe(true);
    });

    it('should warn about deprecated continueOnFail', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'HTTP',
            type: 'n8n-nodes-base.httpRequest',
            position: [100, 100],
            parameters: {},
            continueOnFail: true
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.warnings.some(w => w.message.includes('Using deprecated "continueOnFail: true"'))).toBe(true);
    });

    it('should error for conflicting error handling properties', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'HTTP',
            type: 'n8n-nodes-base.httpRequest',
            position: [100, 100],
            parameters: {},
            continueOnFail: true,
            onError: 'continueRegularOutput'
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.errors.some(e => e.message.includes('Cannot use both "continueOnFail" and "onError" properties'))).toBe(true);
    });

    it('should validate retry configuration', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'HTTP',
            type: 'n8n-nodes-base.httpRequest',
            position: [100, 100],
            parameters: {},
            retryOnFail: true,
            maxTries: 'invalid' as any,
            waitBetweenTries: -1000
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.errors.some(e => e.message.includes('maxTries must be a positive number'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('waitBetweenTries must be a non-negative number'))).toBe(true);
    });

    it('should warn about excessive retry values', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'HTTP',
            type: 'n8n-nodes-base.httpRequest',
            position: [100, 100],
            parameters: {},
            retryOnFail: true,
            maxTries: 15,
            waitBetweenTries: 400000
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.warnings.some(w => w.message.includes('maxTries is set to 15'))).toBe(true);
      expect(result.warnings.some(w => w.message.includes('waitBetweenTries is set to 400000ms'))).toBe(true);
    });

    it('should warn about retryOnFail without maxTries', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'HTTP',
            type: 'n8n-nodes-base.httpRequest',
            position: [100, 100],
            parameters: {},
            retryOnFail: true
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.warnings.some(w => w.message.includes('retryOnFail is enabled but maxTries is not specified'))).toBe(true);
    });

    it('should validate other node-level properties', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            position: [100, 100],
            parameters: {},
            typeVersion: 3,
            alwaysOutputData: 'invalid' as any,
            executeOnce: 'invalid' as any,
            disabled: 'invalid' as any,
            notesInFlow: 'invalid' as any,
            notes: 123 as any
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);


      expect(result.errors.some(e => e.message.includes('alwaysOutputData must be a boolean'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('executeOnce must be a boolean'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('disabled must be a boolean'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('notesInFlow must be a boolean'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('notes must be a string'))).toBe(true);
    });

    it('should warn about executeOnce', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            position: [100, 100],
            parameters: {},
            executeOnce: true
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.warnings.some(w => w.message.includes('executeOnce is enabled'))).toBe(true);
    });

    it('should warn error-prone nodes without error handling', async () => {
      const errorProneNodes = [
        { type: 'n8n-nodes-base.httpRequest', message: 'HTTP Request', version: 4 },
        { type: 'n8n-nodes-base.webhook', message: 'Webhook', version: 2 },
        { type: 'n8n-nodes-base.postgres', message: 'Database operation', version: 2 },
        { type: 'n8n-nodes-base.slack', message: 'slack node', version: 2 }
      ];

      for (const nodeInfo of errorProneNodes) {
        const workflow = {
          nodes: [
            {
              id: '1',
              name: 'Node',
              type: nodeInfo.type,
              position: [100, 100],
              parameters: {},
              typeVersion: nodeInfo.version
            }
          ],
          connections: {}
        } as any;

        const result = await validator.validateWorkflow(workflow as any);

        expect(result.warnings.some(w => w.message.includes(nodeInfo.message) && w.message.includes('without error handling'))).toBe(true);
      }
    });

    it('should warn about conflicting error handling', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'HTTP',
            type: 'n8n-nodes-base.httpRequest',
            position: [100, 100],
            parameters: {},
            continueOnFail: true,
            retryOnFail: true
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.warnings.some(w => w.message.includes('Both continueOnFail and retryOnFail are enabled'))).toBe(true);
    });

    it('should suggest alwaysOutputData for debugging', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'HTTP',
            type: 'n8n-nodes-base.httpRequest',
            position: [100, 100],
            parameters: {},
            retryOnFail: true
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.suggestions.some(s => s.includes('Consider enabling alwaysOutputData'))).toBe(true);
    });

    it('should provide general error handling suggestions', async () => {
      const builder = createWorkflow('No Error Handling');
      
      // Add 6 nodes without error handling
      for (let i = 0; i < 6; i++) {
        builder.addCustomNode('n8n-nodes-base.httpRequest', 4, {}, { name: `HTTP${i}` });
      }

      const workflow = builder.build() as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.suggestions.some(s => s.includes('Most nodes lack error handling'))).toBe(true);
    });

    it('should suggest replacing deprecated error handling', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'HTTP',
            type: 'n8n-nodes-base.httpRequest',
            position: [100, 100],
            parameters: {},
            continueOnFail: true
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.suggestions.some(s => s.includes('Replace "continueOnFail: true" with "onError:'))).toBe(true);
    });
  });

  describe('generateSuggestions', () => {
    it('should suggest adding trigger for workflows without triggers', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            position: [100, 100],
            parameters: {}
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.suggestions.some(s => s.includes('Add a trigger node'))).toBe(true);
    });

    it('should provide connection examples for connection errors', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {}
          },
          {
            id: '2',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            position: [300, 100],
            parameters: {}
          }
        ],
        connections: {} // Missing connections
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.suggestions.some(s => s.includes('Example connection structure'))).toBe(true);
      expect(result.suggestions.some(s => s.includes('Use node NAMES (not IDs) in connections'))).toBe(true);
    });

    it('should suggest error handling when missing', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {}
          },
          {
            id: '2',
            name: 'HTTP',
            type: 'n8n-nodes-base.httpRequest',
            position: [300, 100],
            parameters: {}
          }
        ],
        connections: {
          'Webhook': {
            main: [[{ node: 'HTTP', type: 'main', index: 0 }]]
          }
        }
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.suggestions.some(s => s.includes('Add error handling'))).toBe(true);
    });

    it('should suggest breaking up large workflows', async () => {
      const builder = createWorkflow('Large Workflow');
      
      // Add 25 nodes
      for (let i = 0; i < 25; i++) {
        builder.addCustomNode('n8n-nodes-base.set', 3, {}, { name: `Node${i}` });
      }

      const workflow = builder.build() as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.suggestions.some(s => s.includes('Consider breaking this workflow into smaller sub-workflows'))).toBe(true);
    });

    it('should suggest Code node for complex expressions', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Complex',
            type: 'n8n-nodes-base.set',
            position: [100, 100],
            parameters: {
              field1: '={{ $json.a }}',
              field2: '={{ $json.b }}',
              field3: '={{ $json.c }}',
              field4: '={{ $json.d }}',
              field5: '={{ $json.e }}',
              field6: '={{ $json.f }}'
            }
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.suggestions.some(s => s.includes('Consider using a Code node for complex data transformations'))).toBe(true);
    });

    it('should suggest minimal workflow structure', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            position: [100, 100],
            parameters: {}
          }
        ],
        connections: {}
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.suggestions.some(s => s.includes('A minimal workflow needs'))).toBe(true);
    });
  });

  describe('findSimilarNodeTypes', () => {
    it('should find similar node types for common mistakes', async () => {
      const testCases = [
        { invalid: 'webhook', suggestion: 'nodes-base.webhook' },
        { invalid: 'http', suggestion: 'nodes-base.httpRequest' },
        { invalid: 'slack', suggestion: 'nodes-base.slack' },
        { invalid: 'sheets', suggestion: 'nodes-base.googleSheets' }
      ];

      for (const testCase of testCases) {
        const workflow = {
          nodes: [
            {
              id: '1',
              name: 'Node',
              type: testCase.invalid,
              position: [100, 100],
              parameters: {}
            }
          ],
          connections: {}
        } as any;

        const result = await validator.validateWorkflow(workflow as any);

        expect(result.errors.some(e => e.message.includes(`Did you mean`) && e.message.includes(testCase.suggestion))).toBe(true);
      }
    });
  });

  describe('Integration Tests', () => {
    it('should validate a complex workflow with multiple issues', async () => {
      const workflow = {
        nodes: [
          // Valid trigger
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [100, 100],
            parameters: {},
            typeVersion: 2
          },
          // Node with wrong type format
          {
            id: '2',
            name: 'HTTP1',
            type: 'nodes-base.httpRequest', // Wrong prefix
            position: [300, 100],
            parameters: {}
          },
          // Node with missing typeVersion
          {
            id: '3',
            name: 'Slack',
            type: 'n8n-nodes-base.slack',
            position: [500, 100],
            parameters: {}
          },
          // Disabled node
          {
            id: '4',
            name: 'Disabled',
            type: 'n8n-nodes-base.set',
            position: [700, 100],
            parameters: {},
            disabled: true
          },
          // Node with error handling in wrong place
          {
            id: '5',
            name: 'HTTP2',
            type: 'n8n-nodes-base.httpRequest',
            position: [900, 100],
            parameters: {
              onError: 'continueRegularOutput'
            },
            typeVersion: 4
          },
          // Orphaned node
          {
            id: '6',
            name: 'Orphaned',
            type: 'n8n-nodes-base.code',
            position: [1100, 100],
            parameters: {},
            typeVersion: 2
          },
          // AI Agent without tools
          {
            id: '7',
            name: 'Agent',
            type: '@n8n/n8n-nodes-langchain.agent',
            position: [100, 300],
            parameters: {},
            typeVersion: 1
          }
        ],
        connections: {
          'Webhook': {
            main: [[{ node: 'HTTP1', type: 'main', index: 0 }]]
          },
          'HTTP1': {
            main: [[{ node: 'Slack', type: 'main', index: 0 }]]
          },
          'Slack': {
            main: [[{ node: 'Disabled', type: 'main', index: 0 }]]
          },
          // Using ID instead of name
          '5': {
            main: [[{ node: 'Agent', type: 'main', index: 0 }]]
          }
        }
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      // Should have multiple errors
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);

      // Specific errors
      expect(result.errors.some(e => e.message.includes('Invalid node type: "nodes-base.httpRequest"'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('Missing required property \'typeVersion\''))).toBe(true);
      expect(result.errors.some(e => e.message.includes('Node-level properties onError are in the wrong location'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('Connection uses node ID \'5\' instead of node name'))).toBe(true);

      // Warnings
      expect(result.warnings.some(w => w.message.includes('Connection to disabled node'))).toBe(true);
      expect(result.warnings.some(w => w.message.includes('Node is not connected') && w.nodeName === 'Orphaned')).toBe(true);
      expect(result.warnings.some(w => w.message.includes('AI Agent has no tools connected'))).toBe(true);

      // Statistics
      expect(result.statistics.totalNodes).toBe(7);
      expect(result.statistics.enabledNodes).toBe(6);
      expect(result.statistics.triggerNodes).toBe(1);
      expect(result.statistics.invalidConnections).toBeGreaterThan(0);

      // Suggestions
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should validate a perfect workflow', async () => {
      const workflow = {
        nodes: [
          {
            id: '1',
            name: 'Manual Trigger',
            type: 'n8n-nodes-base.manualTrigger',
            position: [250, 300],
            parameters: {},
            typeVersion: 1
          },
          {
            id: '2',
            name: 'HTTP Request',
            type: 'n8n-nodes-base.httpRequest',
            position: [450, 300],
            parameters: {
              url: 'https://api.example.com/data',
              method: 'GET'
            },
            typeVersion: 4,
            onError: 'continueErrorOutput',
            retryOnFail: true,
            maxTries: 3,
            waitBetweenTries: 1000
          },
          {
            id: '3',
            name: 'Process Data',
            type: 'n8n-nodes-base.code',
            position: [650, 300],
            parameters: {
              jsCode: 'return items;'
            },
            typeVersion: 2
          },
          {
            id: '4',
            name: 'Error Handler',
            type: 'n8n-nodes-base.set',
            position: [650, 500],
            parameters: {
              values: {
                string: [
                  {
                    name: 'error',
                    value: 'An error occurred'
                  }
                ]
              }
            },
            typeVersion: 3
          }
        ],
        connections: {
          'Manual Trigger': {
            main: [[{ node: 'HTTP Request', type: 'main', index: 0 }]]
          },
          'HTTP Request': {
            main: [[{ node: 'Process Data', type: 'main', index: 0 }]],
            error: [[{ node: 'Error Handler', type: 'main', index: 0 }]]
          }
        }
      } as any;

      const result = await validator.validateWorkflow(workflow as any);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.statistics.validConnections).toBe(3);
      expect(result.statistics.invalidConnections).toBe(0);
    });
  });
});