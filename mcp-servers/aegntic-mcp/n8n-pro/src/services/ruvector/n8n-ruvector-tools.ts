/**
 * MCP Tools for N8n RuVector Service
 *
 * Exposes intelligent node recommendations and workflow similarity
 * features through Model Context Protocol tools
 */

import { N8nRuVectorService } from './n8n-ruvector-service';
import { NodeDocumentationService } from '../node-documentation-service';

export function registerRuVectorTools(
  server: any,
  ruvectorService: N8nRuVectorService
): void {
  // Tool: Recommend next nodes for workflow
  server.registerTool({
    name: 'n8n_recommend_nodes',
    description: `
      Recommend nodes to add to a workflow based on current context.
      Uses vector similarity and graph analysis to suggest the most relevant nodes.

      Examples:
      - Given a workflow with HTTP Request node, recommend data transformation nodes
      - Suggest nodes commonly used together in similar workflows
      - Provide intelligent autocomplete for workflow building
    `,
    inputSchema: {
      type: 'object',
      properties: {
        currentNode: {
          type: 'string',
          description: 'Current node type (e.g., "n8n-nodes-base.httpRequest")'
        },
        existingNodes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of existing node types in the workflow'
        },
        workflowType: {
          type: 'string',
          description: 'Workflow type/category (e.g., "automation", "integration", "data-processing")'
        },
        limit: {
          type: 'number',
          description: 'Number of recommendations to return (default: 5)',
          default: 5
        }
      }
    }
  });

  server.registerToolHandler('n8n_recommend_nodes', async (request: any) => {
    const { currentNode, existingNodes = [], workflowType, limit = 5 } = request.params.arguments;

    const recommendations = await ruvectorService.recommendNodes(
      {
        currentNode,
        existingNodes,
        workflowType
      },
      limit
    );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          recommendations: recommendations.map(r => ({
            node: r.nodeType,
            score: r.score,
            reason: r.reason,
            usage: r.usage
          })),
          summary: `Top ${recommendations.length} node recommendations for your workflow`
        }, null, 2)
      }]
    };
  });

  // Tool: Suggest connections between nodes
  server.registerTool({
    name: 'n8n_suggest_connection',
    description: `
      Analyze if two nodes can and should be connected.
      Provides connection suggestions and compatibility analysis.

      Use cases:
      - Validate if a connection between nodes makes sense
      - Get recommended connection configuration
      - Auto-suggest wiring when building workflows
    `,
    inputSchema: {
      type: 'object',
      properties: {
        sourceNode: {
          type: 'string',
          description: 'Source node type'
        },
        targetNode: {
          type: 'string',
          description: 'Target node type'
        }
      },
      required: ['sourceNode', 'targetNode']
    }
  });

  server.registerToolHandler('n8n_suggest_connection', async (request: any) => {
    const { sourceNode, targetNode } = request.params.arguments;

    const suggestion = await ruvectorService.suggestConnection(sourceNode, targetNode);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          connection: {
            from: sourceNode,
            to: targetNode
          },
          recommended: suggestion.recommended,
          confidence: Math.round(suggestion.confidence * 100) + '%',
          reason: suggestion.reason,
          suggestedWiring: suggestion.suggestedConnections
        }, null, 2)
      }]
    };
  });

  // Tool: Find similar workflows
  server.registerTool({
    name: 'n8n_find_similar_workflows',
    description: `
      Find workflows similar to the current one based on node composition.
      Useful for discovering patterns and reusing workflow templates.

      Use cases:
      - Find examples of similar workflows
      - Discover best practices for specific node combinations
      - Get inspiration for workflow optimization
    `,
    inputSchema: {
      type: 'object',
      properties: {
        nodes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of node types in the current workflow'
        },
        limit: {
          type: 'number',
          description: 'Number of similar workflows to return (default: 5)',
          default: 5
        }
      },
      required: ['nodes']
    }
  });

  server.registerToolHandler('n8n_find_similar_workflows', async (request: any) => {
    const { nodes, limit = 5 } = request.params.arguments;

    const similar = await ruvectorService.findSimilarWorkflows(nodes, limit);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          similarWorkflows: similar.map(s => ({
            workflowId: s.workflowId,
            name: s.name,
            similarity: Math.round(s.score * 100) + '%'
          })),
          summary: `Found ${similar.length} similar workflows`
        }, null, 2)
      }]
    };
  });

  // Tool: Index workflow for future similarity search
  server.registerTool({
    name: 'n8n_index_workflow',
    description: `
      Index a workflow for similarity search and pattern recognition.
      Helps build a knowledge base of workflow patterns.

      Use cases:
      - Save workflow templates for future reference
      - Build a library of reusable workflow patterns
      - Enable workflow discovery across your organization
    `,
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Unique workflow identifier'
        },
        name: {
          type: 'string',
          description: 'Workflow name'
        },
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' }
            }
          },
          description: 'Array of nodes in the workflow'
        }
      },
      required: ['workflowId', 'name', 'nodes']
    }
  });

  server.registerToolHandler('n8n_index_workflow', async (request: any) => {
    const { workflowId, name, nodes } = request.params.arguments;

    await ruvectorService.indexWorkflow({
      id: workflowId,
      name,
      nodes
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `Workflow "${name}" indexed successfully`,
          workflowId,
          nodeCount: nodes.length
        }, null, 2)
      }]
    };
  });

  // Tool: Get ruvector service statistics
  server.registerTool({
    name: 'n8n_ruvector_stats',
    description: `
      Get statistics about the ruvector-powered recommendation engine.
      Shows number of indexed nodes and workflows.
    `,
    inputSchema: {
      type: 'object',
      properties: {}
    }
  });

  server.registerToolHandler('n8n_ruvector_stats', async (request: any) => {
    const stats = await ruvectorService.getStats();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          ruvectorEngine: {
            nodesIndexed: stats.nodesIndexed,
            workflowsIndexed: stats.workflowsIndexed,
            embeddingDimension: stats.dimension,
            features: [
              'Intelligent node recommendations',
              'Workflow similarity search',
              'Auto-suggest connections',
              'Graph-based pattern recognition'
            ]
          }
        }, null, 2)
      }]
    };
  });
}

// Example usage and initialization
export async function initializeRuVectorTools(
  server: any,
  nodeService: NodeDocumentationService
): Promise<N8nRuVectorService> {
  const ruvectorService = new N8nRuVectorService(nodeService);
  await ruvectorService.initialize();

  registerRuVectorTools(server, ruvectorService);

  console.log('✅ RuVector MCP tools registered');
  return ruvectorService;
}
