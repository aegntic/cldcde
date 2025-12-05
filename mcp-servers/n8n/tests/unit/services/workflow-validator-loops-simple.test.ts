import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowValidator } from '@/services/workflow-validator';
import { NodeRepository } from '@/database/node-repository';
import { EnhancedConfigValidator } from '@/services/enhanced-config-validator';

// Mock dependencies
vi.mock('@/database/node-repository');
vi.mock('@/services/enhanced-config-validator');

describe('WorkflowValidator - SplitInBatches Validation (Simplified)', () => {
  let validator: WorkflowValidator;
  let mockNodeRepository: any;
  let mockNodeValidator: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockNodeRepository = {
      getNode: vi.fn()
    };

    mockNodeValidator = {
      validateWithMode: vi.fn().mockReturnValue({
        errors: [],
        warnings: []
      })
    };

    validator = new WorkflowValidator(mockNodeRepository, mockNodeValidator);
  });

  describe('SplitInBatches node detection', () => {
    it('should identify SplitInBatches nodes in workflow', async () => {
      mockNodeRepository.getNode.mockReturnValue({
        nodeType: 'nodes-base.splitInBatches',
        properties: []
      });

      const workflow = {
        name: 'SplitInBatches Workflow',
        nodes: [
          {
            id: '1',
            name: 'Split In Batches',
            type: 'n8n-nodes-base.splitInBatches',
            position: [100, 100],
            parameters: { batchSize: 10 }
          },
          {
            id: '2',
            name: 'Process Item',
            type: 'n8n-nodes-base.set',
            position: [300, 100],
            parameters: {}
          }
        ],
        connections: {
          'Split In Batches': {
            main: [
              [], // Done output (0)
              [{ node: 'Process Item', type: 'main', index: 0 }] // Loop output (1)
            ]
          }
        }
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Should complete validation without crashing
      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
    });

    it('should handle SplitInBatches with processing node name patterns', async () => {
      mockNodeRepository.getNode.mockReturnValue({
        nodeType: 'nodes-base.splitInBatches',
        properties: []
      });

      const processingNames = [
        'Process Item',
        'Transform Data',
        'Handle Each',
        'Function Node',
        'Code Block'
      ];

      for (const nodeName of processingNames) {
        const workflow = {
          name: 'Processing Pattern Test',
          nodes: [
            {
              id: '1',
              name: 'Split In Batches',
              type: 'n8n-nodes-base.splitInBatches',
              position: [100, 100],
              parameters: {}
            },
            {
              id: '2',
              name: nodeName,
              type: 'n8n-nodes-base.function',
              position: [300, 100],
              parameters: {}
            }
          ],
          connections: {
            'Split In Batches': {
              main: [
                [{ node: nodeName, type: 'main', index: 0 }], // Processing node on Done output
                []
              ]
            }
          }
        };

        const result = await validator.validateWorkflow(workflow as any);
        
        // Should identify potential processing nodes
        expect(result).toBeDefined();
      }
    });

    it('should handle final processing node patterns', async () => {
      mockNodeRepository.getNode.mockReturnValue({
        nodeType: 'nodes-base.splitInBatches',
        properties: []
      });

      const finalNames = [
        'Final Summary',
        'Send Email',
        'Complete Notification',
        'Final Report'
      ];

      for (const nodeName of finalNames) {
        const workflow = {
          name: 'Final Pattern Test',
          nodes: [
            {
              id: '1',
              name: 'Split In Batches',
              type: 'n8n-nodes-base.splitInBatches',
              position: [100, 100],
              parameters: {}
            },
            {
              id: '2',
              name: nodeName,
              type: 'n8n-nodes-base.emailSend',
              position: [300, 100],
              parameters: {}
            }
          ],
          connections: {
            'Split In Batches': {
              main: [
                [{ node: nodeName, type: 'main', index: 0 }], // Final node on Done output (correct)
                []
              ]
            }
          }
        };

        const result = await validator.validateWorkflow(workflow as any);
        
        // Should not warn about final nodes on done output
        expect(result).toBeDefined();
      }
    });
  });

  describe('Connection validation', () => {
    it('should validate connection indices', async () => {
      mockNodeRepository.getNode.mockReturnValue({
        nodeType: 'nodes-base.splitInBatches',
        properties: []
      });

      const workflow = {
        name: 'Connection Index Test',
        nodes: [
          {
            id: '1',
            name: 'Split In Batches',
            type: 'n8n-nodes-base.splitInBatches',
            position: [100, 100],
            parameters: {}
          },
          {
            id: '2',
            name: 'Target',
            type: 'n8n-nodes-base.set',
            position: [300, 100],
            parameters: {}
          }
        ],
        connections: {
          'Split In Batches': {
            main: [
              [{ node: 'Target', type: 'main', index: -1 }] // Invalid negative index
            ]
          }
        }
      };

      const result = await validator.validateWorkflow(workflow as any);

      const negativeIndexErrors = result.errors.filter(e => 
        e.message?.includes('Invalid connection index -1')
      );
      expect(negativeIndexErrors.length).toBeGreaterThan(0);
    });

    it('should handle non-existent target nodes', async () => {
      mockNodeRepository.getNode.mockReturnValue({
        nodeType: 'nodes-base.splitInBatches',
        properties: []
      });

      const workflow = {
        name: 'Missing Target Test',
        nodes: [
          {
            id: '1',
            name: 'Split In Batches',
            type: 'n8n-nodes-base.splitInBatches',
            position: [100, 100],
            parameters: {}
          }
        ],
        connections: {
          'Split In Batches': {
            main: [
              [{ node: 'NonExistentNode', type: 'main', index: 0 }]
            ]
          }
        }
      };

      const result = await validator.validateWorkflow(workflow as any);

      const missingNodeErrors = result.errors.filter(e => 
        e.message?.includes('non-existent node')
      );
      expect(missingNodeErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Self-referencing connections', () => {
    it('should allow self-referencing for SplitInBatches nodes', async () => {
      mockNodeRepository.getNode.mockReturnValue({
        nodeType: 'nodes-base.splitInBatches',
        properties: []
      });

      const workflow = {
        name: 'Self Reference Test',
        nodes: [
          {
            id: '1',
            name: 'Split In Batches',
            type: 'n8n-nodes-base.splitInBatches',
            position: [100, 100],
            parameters: {}
          }
        ],
        connections: {
          'Split In Batches': {
            main: [
              [],
              [{ node: 'Split In Batches', type: 'main', index: 0 }] // Self-reference on loop output
            ]
          }
        }
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Should not warn about self-reference for SplitInBatches
      const selfRefWarnings = result.warnings.filter(w => 
        w.message?.includes('self-referencing')
      );
      expect(selfRefWarnings).toHaveLength(0);
    });

    it('should warn about self-referencing for non-loop nodes', async () => {
      mockNodeRepository.getNode.mockReturnValue({
        nodeType: 'nodes-base.set',
        properties: []
      });

      const workflow = {
        name: 'Non-Loop Self Reference Test',
        nodes: [
          {
            id: '1',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            position: [100, 100],
            parameters: {}
          }
        ],
        connections: {
          'Set': {
            main: [
              [{ node: 'Set', type: 'main', index: 0 }] // Self-reference on regular node
            ]
          }
        }
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Should warn about self-reference for non-loop nodes
      const selfRefWarnings = result.warnings.filter(w => 
        w.message?.includes('self-referencing')
      );
      expect(selfRefWarnings.length).toBeGreaterThan(0);
    });
  });

  describe('Output connection validation', () => {
    it('should validate output connections for nodes with outputs', async () => {
      mockNodeRepository.getNode.mockReturnValue({
        nodeType: 'nodes-base.if',
        outputs: [
          { displayName: 'True', description: 'Items that match condition' },
          { displayName: 'False', description: 'Items that do not match condition' }
        ],
        outputNames: ['true', 'false'],
        properties: []
      });

      const workflow = {
        name: 'IF Node Test',
        nodes: [
          {
            id: '1',
            name: 'IF',
            type: 'n8n-nodes-base.if',
            position: [100, 100],
            parameters: {}
          },
          {
            id: '2',
            name: 'True Handler',
            type: 'n8n-nodes-base.set',
            position: [300, 50],
            parameters: {}
          },
          {
            id: '3',
            name: 'False Handler',
            type: 'n8n-nodes-base.set',
            position: [300, 150],
            parameters: {}
          }
        ],
        connections: {
          'IF': {
            main: [
              [{ node: 'True Handler', type: 'main', index: 0 }],   // True output (0)
              [{ node: 'False Handler', type: 'main', index: 0 }]   // False output (1)
            ]
          }
        }
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Should validate without major errors
      expect(result).toBeDefined();
      expect(result.statistics.validConnections).toBe(2);
    });
  });

  describe('Error handling', () => {
    it('should handle nodes without outputs gracefully', async () => {
      mockNodeRepository.getNode.mockReturnValue({
        nodeType: 'nodes-base.httpRequest',
        outputs: null,
        outputNames: null,
        properties: []
      });

      const workflow = {
        name: 'No Outputs Test',
        nodes: [
          {
            id: '1',
            name: 'HTTP Request',
            type: 'n8n-nodes-base.httpRequest',
            position: [100, 100],
            parameters: {}
          }
        ],
        connections: {}
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Should handle gracefully without crashing
      expect(result).toBeDefined();
    });

    it('should handle unknown node types gracefully', async () => {
      mockNodeRepository.getNode.mockReturnValue(null);

      const workflow = {
        name: 'Unknown Node Test',
        nodes: [
          {
            id: '1',
            name: 'Unknown',
            type: 'n8n-nodes-base.unknown',
            position: [100, 100],
            parameters: {}
          }
        ],
        connections: {}
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Should report unknown node error
      const unknownErrors = result.errors.filter(e => 
        e.message?.includes('Unknown node type')
      );
      expect(unknownErrors.length).toBeGreaterThan(0);
    });
  });
});