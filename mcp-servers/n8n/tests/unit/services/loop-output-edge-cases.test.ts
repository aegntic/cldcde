import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowValidator } from '@/services/workflow-validator';
import { NodeRepository } from '@/database/node-repository';
import { EnhancedConfigValidator } from '@/services/enhanced-config-validator';

// Mock dependencies
vi.mock('@/database/node-repository');
vi.mock('@/services/enhanced-config-validator');

describe('Loop Output Fix - Edge Cases', () => {
  let validator: WorkflowValidator;
  let mockNodeRepository: any;
  let mockNodeValidator: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockNodeRepository = {
      getNode: vi.fn((nodeType: string) => {
        // Default return
        if (nodeType === 'nodes-base.splitInBatches') {
          return {
            nodeType: 'nodes-base.splitInBatches',
            outputs: [
              { displayName: 'Done', name: 'done' },
              { displayName: 'Loop', name: 'loop' }
            ],
            outputNames: ['done', 'loop'],
            properties: []
          };
        }
        return {
          nodeType,
          properties: []
        };
      })
    };

    mockNodeValidator = {
      validateWithMode: vi.fn().mockReturnValue({
        errors: [],
        warnings: []
      })
    };

    validator = new WorkflowValidator(mockNodeRepository, mockNodeValidator);
  });

  describe('Nodes without outputs', () => {
    it('should handle nodes with null outputs gracefully', async () => {
      mockNodeRepository.getNode.mockReturnValue({
        nodeType: 'nodes-base.httpRequest',
        outputs: null,
        outputNames: null,
        properties: []
      });

      const workflow = {
        name: 'No Outputs Workflow',
        nodes: [
          {
            id: '1',
            name: 'HTTP Request',
            type: 'n8n-nodes-base.httpRequest',
            position: [100, 100],
            parameters: { url: 'https://example.com' }
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
          'HTTP Request': {
            main: [
              [{ node: 'Set', type: 'main', index: 0 }]
            ]
          }
        }
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Should not crash or produce output-related errors
      expect(result).toBeDefined();
      const outputErrors = result.errors.filter(e => 
        e.message?.includes('output') && !e.message?.includes('Connection')
      );
      expect(outputErrors).toHaveLength(0);
    });

    it('should handle nodes with undefined outputs gracefully', async () => {
      mockNodeRepository.getNode.mockReturnValue({
        nodeType: 'nodes-base.webhook',
        // outputs and outputNames are undefined
        properties: []
      });

      const workflow = {
        name: 'Undefined Outputs Workflow',
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
      };

      const result = await validator.validateWorkflow(workflow as any);

      expect(result).toBeDefined();
      expect(result.valid).toBeTruthy(); // Empty workflow with webhook should be valid
    });

    it('should handle nodes with empty outputs array', async () => {
      mockNodeRepository.getNode.mockReturnValue({
        nodeType: 'nodes-base.customNode',
        outputs: [],
        outputNames: [],
        properties: []
      });

      const workflow = {
        name: 'Empty Outputs Workflow',
        nodes: [
          {
            id: '1',
            name: 'Custom Node',
            type: 'n8n-nodes-base.customNode',
            position: [100, 100],
            parameters: {}
          }
        ],
        connections: {
          'Custom Node': {
            main: [
              [{ node: 'Custom Node', type: 'main', index: 0 }] // Self-reference
            ]
          }
        }
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Should warn about self-reference but not crash
      const selfRefWarnings = result.warnings.filter(w => 
        w.message?.includes('self-referencing')
      );
      expect(selfRefWarnings).toHaveLength(1);
    });
  });

  describe('Invalid connection indices', () => {
    it('should handle negative connection indices', async () => {
      // Use default mock that includes outputs for SplitInBatches

      const workflow = {
        name: 'Negative Index Workflow',
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
            name: 'Set',
            type: 'n8n-nodes-base.set',
            position: [300, 100],
            parameters: {}
          }
        ],
        connections: {
          'Split In Batches': {
            main: [
              [{ node: 'Set', type: 'main', index: -1 }] // Invalid negative index
            ]
          }
        }
      };

      const result = await validator.validateWorkflow(workflow as any);

      const negativeIndexErrors = result.errors.filter(e => 
        e.message?.includes('Invalid connection index -1')
      );
      expect(negativeIndexErrors).toHaveLength(1);
      expect(negativeIndexErrors[0].message).toContain('must be non-negative');
    });

    it('should handle very large connection indices', async () => {
      mockNodeRepository.getNode.mockReturnValue({
        nodeType: 'nodes-base.switch',
        outputs: [
          { displayName: 'Output 1' },
          { displayName: 'Output 2' }
        ],
        properties: []
      });

      const workflow = {
        name: 'Large Index Workflow',
        nodes: [
          {
            id: '1',
            name: 'Switch',
            type: 'n8n-nodes-base.switch',
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
          'Switch': {
            main: [
              [{ node: 'Set', type: 'main', index: 999 }] // Very large index
            ]
          }
        }
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Should validate without crashing (n8n allows large indices)
      expect(result).toBeDefined();
    });
  });

  describe('Malformed connection structures', () => {
    it('should handle null connection objects', async () => {
      // Use default mock that includes outputs for SplitInBatches

      const workflow = {
        name: 'Null Connections Workflow',
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
              null, // Null output
              [{ node: 'NonExistent', type: 'main', index: 0 }]
            ] as any
          }
        }
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Should handle gracefully without crashing
      expect(result).toBeDefined();
    });

    it('should handle missing connection properties', async () => {
      // Use default mock that includes outputs for SplitInBatches

      const workflow = {
        name: 'Malformed Connections Workflow',
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
            name: 'Set',
            type: 'n8n-nodes-base.set',
            position: [300, 100],
            parameters: {}
          }
        ],
        connections: {
          'Split In Batches': {
            main: [
              [
                { node: 'Set' } as any, // Missing type and index
                { type: 'main', index: 0 } as any, // Missing node
                {} as any // Empty object
              ]
            ]
          }
        }
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Should handle malformed connections but report errors
      expect(result).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Deep loop back detection limits', () => {
    it('should respect maxDepth limit in checkForLoopBack', async () => {
      // Use default mock that includes outputs for SplitInBatches

      // Create a very deep chain that exceeds maxDepth (50)
      const nodes = [
        {
          id: '1',
          name: 'Split In Batches',
          type: 'n8n-nodes-base.splitInBatches',
          position: [100, 100],
          parameters: {}
        }
      ];

      const connections: any = {
        'Split In Batches': {
          main: [
            [], // Done output
            [{ node: 'Node1', type: 'main', index: 0 }] // Loop output
          ]
        }
      };

      // Create chain of 60 nodes (exceeds maxDepth of 50)
      for (let i = 1; i <= 60; i++) {
        nodes.push({
          id: (i + 1).toString(),
          name: `Node${i}`,
          type: 'n8n-nodes-base.set',
          position: [100 + i * 50, 100],
          parameters: {}
        });

        if (i < 60) {
          connections[`Node${i}`] = {
            main: [[{ node: `Node${i + 1}`, type: 'main', index: 0 }]]
          };
        } else {
          // Last node connects back to Split In Batches
          connections[`Node${i}`] = {
            main: [[{ node: 'Split In Batches', type: 'main', index: 0 }]]
          };
        }
      }

      const workflow = {
        name: 'Deep Chain Workflow',
        nodes,
        connections
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Should warn about missing loop back because depth limit prevents detection
      const loopBackWarnings = result.warnings.filter(w => 
        w.message?.includes('doesn\'t connect back')
      );
      expect(loopBackWarnings).toHaveLength(1);
    });

    it('should handle circular references without infinite loops', async () => {
      // Use default mock that includes outputs for SplitInBatches

      const workflow = {
        name: 'Circular Reference Workflow',
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
            name: 'NodeA',
            type: 'n8n-nodes-base.set',
            position: [300, 100],
            parameters: {}
          },
          {
            id: '3',
            name: 'NodeB',
            type: 'n8n-nodes-base.function',
            position: [500, 100],
            parameters: {}
          }
        ],
        connections: {
          'Split In Batches': {
            main: [
              [],
              [{ node: 'NodeA', type: 'main', index: 0 }]
            ]
          },
          'NodeA': {
            main: [
              [{ node: 'NodeB', type: 'main', index: 0 }]
            ]
          },
          'NodeB': {
            main: [
              [{ node: 'NodeA', type: 'main', index: 0 }] // Circular: B -> A -> B -> A ...
            ]
          }
        }
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Should complete without hanging and warn about missing loop back
      expect(result).toBeDefined();
      const loopBackWarnings = result.warnings.filter(w => 
        w.message?.includes('doesn\'t connect back')
      );
      expect(loopBackWarnings).toHaveLength(1);
    });

    it('should handle self-referencing nodes in loop back detection', async () => {
      // Use default mock that includes outputs for SplitInBatches

      const workflow = {
        name: 'Self Reference Workflow',
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
            name: 'SelfRef',
            type: 'n8n-nodes-base.set',
            position: [300, 100],
            parameters: {}
          }
        ],
        connections: {
          'Split In Batches': {
            main: [
              [],
              [{ node: 'SelfRef', type: 'main', index: 0 }]
            ]
          },
          'SelfRef': {
            main: [
              [{ node: 'SelfRef', type: 'main', index: 0 }] // Self-reference instead of loop back
            ]
          }
        }
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Should warn about missing loop back and self-reference
      const loopBackWarnings = result.warnings.filter(w => 
        w.message?.includes('doesn\'t connect back')
      );
      const selfRefWarnings = result.warnings.filter(w => 
        w.message?.includes('self-referencing')
      );

      expect(loopBackWarnings).toHaveLength(1);
      expect(selfRefWarnings).toHaveLength(1);
    });
  });

  describe('Complex output structures', () => {
    it('should handle nodes with many outputs', async () => {
      const manyOutputs = Array.from({ length: 20 }, (_, i) => ({
        displayName: `Output ${i + 1}`,
        name: `output${i + 1}`,
        description: `Output number ${i + 1}`
      }));

      mockNodeRepository.getNode.mockReturnValue({
        nodeType: 'nodes-base.complexSwitch',
        outputs: manyOutputs,
        outputNames: manyOutputs.map(o => o.name),
        properties: []
      });

      const workflow = {
        name: 'Many Outputs Workflow',
        nodes: [
          {
            id: '1',
            name: 'Complex Switch',
            type: 'n8n-nodes-base.complexSwitch',
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
          'Complex Switch': {
            main: Array.from({ length: 20 }, () => [
              { node: 'Set', type: 'main', index: 0 }
            ])
          }
        }
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Should handle without performance issues
      expect(result).toBeDefined();
    });

    it('should handle mixed output types (main, error, ai_tool)', async () => {
      mockNodeRepository.getNode.mockReturnValue({
        nodeType: 'nodes-base.complexNode',
        outputs: [
          { displayName: 'Main', type: 'main' },
          { displayName: 'Error', type: 'error' }
        ],
        properties: []
      });

      const workflow = {
        name: 'Mixed Output Types Workflow',
        nodes: [
          {
            id: '1',
            name: 'Complex Node',
            type: 'n8n-nodes-base.complexNode',
            position: [100, 100],
            parameters: {}
          },
          {
            id: '2',
            name: 'Main Handler',
            type: 'n8n-nodes-base.set',
            position: [300, 50],
            parameters: {}
          },
          {
            id: '3',
            name: 'Error Handler',
            type: 'n8n-nodes-base.set',
            position: [300, 150],
            parameters: {}
          },
          {
            id: '4',
            name: 'Tool',
            type: 'n8n-nodes-base.httpRequest',
            position: [500, 100],
            parameters: {}
          }
        ],
        connections: {
          'Complex Node': {
            main: [
              [{ node: 'Main Handler', type: 'main', index: 0 }]
            ],
            error: [
              [{ node: 'Error Handler', type: 'main', index: 0 }]
            ],
            ai_tool: [
              [{ node: 'Tool', type: 'main', index: 0 }]
            ]
          }
        }
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Should validate all connection types
      expect(result).toBeDefined();
      expect(result.statistics.validConnections).toBe(3);
    });
  });

  describe('SplitInBatches specific edge cases', () => {
    it('should handle SplitInBatches with no connections', async () => {
      // Use default mock that includes outputs for SplitInBatches

      const workflow = {
        name: 'Isolated SplitInBatches',
        nodes: [
          {
            id: '1',
            name: 'Split In Batches',
            type: 'n8n-nodes-base.splitInBatches',
            position: [100, 100],
            parameters: {}
          }
        ],
        connections: {}
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Should not produce SplitInBatches-specific warnings for isolated node
      const splitWarnings = result.warnings.filter(w => 
        w.message?.includes('SplitInBatches') || 
        w.message?.includes('loop') ||
        w.message?.includes('done')
      );
      expect(splitWarnings).toHaveLength(0);
    });

    it('should handle SplitInBatches with only one output connected', async () => {
      // Use default mock that includes outputs for SplitInBatches

      const workflow = {
        name: 'Single Output SplitInBatches',
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
            name: 'Final Action',
            type: 'n8n-nodes-base.emailSend',
            position: [300, 100],
            parameters: {}
          }
        ],
        connections: {
          'Split In Batches': {
            main: [
              [{ node: 'Final Action', type: 'main', index: 0 }], // Only done output connected
              [] // Loop output empty
            ]
          }
        }
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Should NOT warn about empty loop output (it's only a problem if loop connects to something but doesn't loop back)
      // An empty loop output is valid - it just means no looping occurs
      const loopWarnings = result.warnings.filter(w => 
        w.message?.includes('loop') && w.message?.includes('connect back')
      );
      expect(loopWarnings).toHaveLength(0);
    });

    it('should handle SplitInBatches with both outputs to same node', async () => {
      // Use default mock that includes outputs for SplitInBatches

      const workflow = {
        name: 'Same Target SplitInBatches',
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
            name: 'Multi Purpose',
            type: 'n8n-nodes-base.set',
            position: [300, 100],
            parameters: {}
          }
        ],
        connections: {
          'Split In Batches': {
            main: [
              [{ node: 'Multi Purpose', type: 'main', index: 0 }], // Done -> Multi Purpose
              [{ node: 'Multi Purpose', type: 'main', index: 0 }]  // Loop -> Multi Purpose
            ]
          },
          'Multi Purpose': {
            main: [
              [{ node: 'Split In Batches', type: 'main', index: 0 }] // Loop back
            ]
          }
        }
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Both outputs go to same node which loops back - should be valid
      // No warnings about loop back since it does connect back
      const loopWarnings = result.warnings.filter(w => 
        w.message?.includes('loop') && w.message?.includes('connect back')
      );
      expect(loopWarnings).toHaveLength(0);
    });

    it('should detect reversed outputs with processing node on done output', async () => {
      // Use default mock that includes outputs for SplitInBatches

      const workflow = {
        name: 'Reversed SplitInBatches with Function Node',
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
            name: 'Process Function',
            type: 'n8n-nodes-base.function',
            position: [300, 100],
            parameters: {}
          }
        ],
        connections: {
          'Split In Batches': {
            main: [
              [{ node: 'Process Function', type: 'main', index: 0 }], // Done -> Function (this is wrong)
              [] // Loop output empty
            ]
          },
          'Process Function': {
            main: [
              [{ node: 'Split In Batches', type: 'main', index: 0 }] // Function connects back (indicates it should be on loop)
            ]
          }
        }
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Should error about reversed outputs since function node on done output connects back
      const reversedErrors = result.errors.filter(e => 
        e.message?.includes('SplitInBatches outputs appear reversed')
      );
      expect(reversedErrors).toHaveLength(1);
    });

    it('should handle non-existent node type gracefully', async () => {
      // Node doesn't exist in repository
      mockNodeRepository.getNode.mockReturnValue(null);

      const workflow = {
        name: 'Unknown Node Type',
        nodes: [
          {
            id: '1',
            name: 'Unknown Node',
            type: 'n8n-nodes-base.unknownNode',
            position: [100, 100],
            parameters: {}
          }
        ],
        connections: {}
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Should report unknown node type error
      const unknownNodeErrors = result.errors.filter(e => 
        e.message?.includes('Unknown node type')
      );
      expect(unknownNodeErrors).toHaveLength(1);
    });
  });

  describe('Performance edge cases', () => {
    it('should handle very large workflows efficiently', async () => {
      mockNodeRepository.getNode.mockReturnValue({
        nodeType: 'nodes-base.set',
        properties: []
      });

      // Create workflow with 1000 nodes
      const nodes = Array.from({ length: 1000 }, (_, i) => ({
        id: `node${i}`,
        name: `Node ${i}`,
        type: 'n8n-nodes-base.set',
        position: [100 + (i % 50) * 50, 100 + Math.floor(i / 50) * 50],
        parameters: {}
      }));

      // Create simple linear connections
      const connections: any = {};
      for (let i = 0; i < 999; i++) {
        connections[`Node ${i}`] = {
          main: [[{ node: `Node ${i + 1}`, type: 'main', index: 0 }]]
        };
      }

      const workflow = {
        name: 'Large Workflow',
        nodes,
        connections
      };

      const startTime = Date.now();
      const result = await validator.validateWorkflow(workflow as any);
      const duration = Date.now() - startTime;

      // Should complete within reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000);
      expect(result).toBeDefined();
      expect(result.statistics.totalNodes).toBe(1000);
    });

    it('should handle workflows with many SplitInBatches nodes', async () => {
      // Use default mock that includes outputs for SplitInBatches

      // Create 100 SplitInBatches nodes
      const nodes = Array.from({ length: 100 }, (_, i) => ({
        id: `split${i}`,
        name: `Split ${i}`,
        type: 'n8n-nodes-base.splitInBatches',
        position: [100 + (i % 10) * 100, 100 + Math.floor(i / 10) * 100],
        parameters: {}
      }));

      const connections: any = {};
      // Each split connects to the next one
      for (let i = 0; i < 99; i++) {
        connections[`Split ${i}`] = {
          main: [
            [{ node: `Split ${i + 1}`, type: 'main', index: 0 }], // Done -> next split
            [] // Empty loop
          ]
        };
      }

      const workflow = {
        name: 'Many SplitInBatches Workflow',
        nodes,
        connections
      };

      const result = await validator.validateWorkflow(workflow as any);

      // Should validate all nodes without performance issues
      expect(result).toBeDefined();
      expect(result.statistics.totalNodes).toBe(100);
    });
  });
});