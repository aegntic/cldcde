/**
 * N8n RuVector Service
 *
 * Intelligent node recommendations and workflow similarity using ruvector
 * Provides AI-powered suggestions based on vector similarity and graph analysis
 */

import { RuVector } from '@ruvector/core';
import { RuVectorGNN } from '@ruvector/gnn';
import { NodeDocumentationService } from '../node-documentation-service';

interface NodeEmbedding {
  nodeType: string;
  embedding: number[];
  metadata: {
    category: string;
    description: string;
    inputs: string[];
    outputs: string[];
    capabilities?: string[];
  };
}

interface WorkflowEmbedding {
  workflowId: string;
  name: string;
  embedding: number[];
  nodes: string[];
  metadata: {
    nodeCount: number;
    categories: string[];
    complexity: number;
  };
}

interface RecommendationResult {
  nodeType: string;
  score: number;
  reason: string;
  usage: string;
}

export class N8nRuVectorService {
  private vectorDB: any;
  private gnn: any;
  private nodeService: NodeDocumentationService;
  private dimension = 384; // Using sentence-transformers embedding dimension
  private initialized = false;

  constructor(nodeService: NodeDocumentationService) {
    this.nodeService = nodeService;
  }

  /**
   * Initialize ruvector for n8n node and workflow analysis
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize vector database
      this.vectorDB = new RuVector({
        dimension: this.dimension,
        path: './data/n8n-ruvector',
        indexing: {
          type: 'HNSW',
          M: 16,
          efConstruction: 200
        }
      });

      await this.vectorDB.initialize();

      // Initialize GNN for graph-based recommendations
      this.gnn = new RuVectorGNN({
        vectorDb: this.vectorDB
      });

      await this.gnn.initialize();

      // Index all nodes
      await this.indexNodes();

      this.initialized = true;
      console.log('✅ N8nRuVectorService initialized');
    } catch (error) {
      console.error('Failed to initialize N8nRuVectorService:', error);
      throw error;
    }
  }

  /**
   * Index all n8n nodes with vector embeddings
   */
  private async indexNodes(): Promise<void> {
    console.log('📊 Indexing n8n nodes...');

    const nodes = await this.nodeService.listNodes();
    const embeddings: NodeEmbedding[] = [];

    for (const node of nodes) {
      const embedding = await this.generateNodeEmbedding(node);
      embeddings.push(embedding);
    }

    await this.vectorDB.insert({
      collection: 'n8n_nodes',
      vectors: embeddings.map(e => ({
        id: e.nodeType,
        vector: e.embedding,
        metadata: e.metadata
      }))
    });

    console.log(`✅ Indexed ${embeddings.length} nodes`);
  }

  /**
   * Generate embedding for a node based on its properties
   */
  private async generateNodeEmbedding(node: any): Promise<NodeEmbedding> {
    // Create text representation for embedding
    const text = [
      node.displayName,
      node.description || '',
      node.category || '',
      ...(node.inputs || []).map((i: any) => i.displayName).join(' '),
      ...(node.outputs || []).map((o: any) => o.displayName).join(' '),
      ...(node.capabilities || []).join(' ')
    ].join(' ').toLowerCase();

    // Simple embedding (in production, use sentence-transformers or OpenAI embeddings)
    const embedding = this.textToEmbedding(text);

    return {
      nodeType: node.name,
      embedding,
      metadata: {
        category: node.category,
        description: node.description,
        inputs: (node.inputs || []).map((i: any) => i.displayName),
        outputs: (node.outputs || []).map((o: any) => o.displayName),
        capabilities: node.capabilities
      }
    };
  }

  /**
   * Simple text-to-embedding conversion (placeholder for real embeddings)
   * In production, use sentence-transformers or OpenAI embeddings
   */
  private textToEmbedding(text: string): number[] {
    // Simple hash-based embedding (replace with actual embedding model)
    const embedding = new Array(this.dimension).fill(0);
    const hash = this.hashCode(text);

    for (let i = 0; i < this.dimension; i++) {
      embedding[i] = Math.sin(hash * (i + 1) * 0.123);
    }

    return embedding;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Recommend nodes based on context
   * @param context Current workflow context (nodes, connections, etc.)
   * @param limit Number of recommendations to return
   */
  async recommendNodes(
    context: {
      currentNode?: string;
      existingNodes?: string[];
      workflowType?: string;
    },
    limit = 5
  ): Promise<RecommendationResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const { currentNode, existingNodes = [], workflowType } = context;

    // Build query embedding from context
    let queryText = '';

    if (currentNode) {
      const nodeInfo = await this.nodeService.getNodeInfo(currentNode);
      queryText += nodeInfo.displayName + ' ' + (nodeInfo.description || '');
    }

    if (workflowType) {
      queryText += ` workflow type: ${workflowType}`;
    }

    const queryEmbedding = this.textToEmbedding(queryText);

    // Search for similar nodes
    const results = await this.vectorDB.search({
      collection: 'n8n_nodes',
      vector: queryEmbedding,
      limit: limit * 2,
      filters: {
        // Exclude already used nodes
        nodeType: { $nin: existingNodes }
      }
    });

    // Enhance with GNN graph analysis
    const graphEnhanced = await this.gnn.expandWithGraph({
      seeds: results.slice(0, limit).map((r: any) => r.id),
      depth: 2,
      limit
    });

    // Convert to recommendation format
    const recommendations: RecommendationResult[] = [];
    const seen = new Set(existingNodes);

    for (const result of graphEnhanced) {
      if (seen.has(result.id)) continue;
      seen.add(result.id);

      const nodeInfo = await this.nodeService.getNodeInfo(result.id);

      recommendations.push({
        nodeType: result.id,
        score: result.score || 0.7,
        reason: this.generateRecommendationReason(result, nodeInfo, context),
        usage: this.generateUsageExample(nodeInfo)
      });

      if (recommendations.length >= limit) break;
    }

    return recommendations;
  }

  /**
   * Generate human-readable reason for recommendation
   */
  private generateRecommendationReason(
    result: any,
    nodeInfo: any,
    context: any
  ): string {
    const reasons: string[] = [];

    if (result.graphScore > 0.5) {
      reasons.push('frequently used together with your current nodes');
    }

    if (result.score > 0.8) {
      reasons.push('highly relevant to your workflow type');
    }

    if (nodeInfo.category === context.workflowType) {
      reasons.push(`belongs to ${context.workflowType} category`);
    }

    return reasons.length > 0
      ? reasons.join(', ')
      : 'similar to nodes in your workflow';
  }

  /**
   * Generate usage example for recommended node
   */
  private generateUsageExample(nodeInfo: any): string {
    const inputs = (nodeInfo.inputs || []).slice(0, 2).map((i: any) => i.displayName);
    const outputs = (nodeInfo.outputs || []).slice(0, 2).map((o: any) => o.displayName);

    if (inputs.length === 0 && outputs.length === 0) {
      return `Drag ${nodeInfo.displayName} onto the canvas`;
    }

    let usage = `Connect `;

    if (inputs.length > 0) {
      usage += `${inputs.join(' or ')} → ${nodeInfo.displayName}`;
    }

    if (outputs.length > 0) {
      if (inputs.length > 0) usage += ' → ';
      usage += outputs.join(' or ');
    }

    return usage;
  }

  /**
   * Find similar workflows
   * @param workflowNodes Array of node types in the workflow
   * @param limit Number of similar workflows to return
   */
  async findSimilarWorkflows(
    workflowNodes: string[],
    limit = 5
  ): Promise<Array<{ workflowId: string; name: string; score: number }>> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Generate workflow embedding from nodes
    const workflowEmbedding = await this.generateWorkflowEmbedding(workflowNodes);

    // Search similar workflows
    const results = await this.vectorDB.search({
      collection: 'n8n_workflows',
      vector: workflowEmbedding,
      limit
    });

    return results.map((r: any) => ({
      workflowId: r.id,
      name: r.metadata.name || 'Unnamed Workflow',
      score: r.score
    }));
  }

  /**
   * Generate embedding for a workflow
   */
  private async generateWorkflowEmbedding(nodes: string[]): Promise<number[]> {
    const nodeDescriptions = await Promise.all(
      nodes.map(async (nodeType) => {
        const nodeInfo = await this.nodeService.getNodeInfo(nodeType);
        return `${nodeInfo.displayName} ${nodeInfo.description || ''}`;
      })
    );

    const combinedText = nodeDescriptions.join(' ');
    return this.textToEmbedding(combinedText);
  }

  /**
   * Index a workflow for similarity search
   */
  async indexWorkflow(workflow: {
    id: string;
    name: string;
    nodes: Array<{ type: string }>;
  }): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const nodeTypes = workflow.nodes.map(n => n.type);
    const embedding = await this.generateWorkflowEmbedding(nodeTypes);

    await this.vectorDB.insert({
      collection: 'n8n_workflows',
      vectors: [{
        id: workflow.id,
        vector: embedding,
        metadata: {
          name: workflow.name,
          nodes: nodeTypes,
          nodeCount: workflow.nodes.length
        }
      }]
    });
  }

  /**
   * Auto-suggest connections between nodes
   * @param sourceNode Source node type
   * @param targetNode Target node type
   */
  async suggestConnection(
    sourceNode: string,
    targetNode: string
  ): Promise<{
    recommended: boolean;
    confidence: number;
    reason: string;
    suggestedConnections: Array<{ source: string; target: string }>;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Use GNN to analyze if these nodes are commonly connected
    const graphAnalysis = await this.gnn.analyzeConnection({
      source: sourceNode,
      target: targetNode
    });

    const nodeInfo = await Promise.all([
      this.nodeService.getNodeInfo(sourceNode),
      this.nodeService.getNodeInfo(targetNode)
    ]);

    const [source, target] = nodeInfo;

    // Check compatibility
    const sourceOutputs = (source.outputs || []).map((o: any) => o.displayName);
    const targetInputs = (target.inputs || []).map((i: any) => i.displayName);

    const compatibleTypes = sourceOutputs.filter((output: string) =>
      targetInputs.some((input: string) =>
        input.toLowerCase().includes(output.toLowerCase()) ||
        output.toLowerCase().includes(input.toLowerCase())
      )
    );

    const recommended = compatibleTypes.length > 0 || graphAnalysis.connectionStrength > 0.3;

    const suggestedConnections = compatibleTypes.length > 0
      ? [{ source: compatibleTypes[0], target: compatibleTypes[0] }]
      : [];

    return {
      recommended,
      confidence: (graphAnalysis.connectionStrength + (compatibleTypes.length > 0 ? 0.5 : 0)) / 2,
      reason: recommended
        ? compatibleTypes.length > 0
          ? `Compatible connections: ${compatibleTypes.join(', ')}`
          : 'Commonly used together in similar workflows'
        : 'No obvious connection compatibility',
      suggestedConnections
    };
  }

  /**
   * Get service statistics
   */
  async getStats(): Promise<{
    nodesIndexed: number;
    workflowsIndexed: number;
    dimension: number;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    const nodesStats = await this.vectorDB.getStats({ collection: 'n8n_nodes' });
    const workflowsStats = await this.vectorDB.getStats({ collection: 'n8n_workflows' });

    return {
      nodesIndexed: nodesStats.count || 0,
      workflowsIndexed: workflowsStats.count || 0,
      dimension: this.dimension
    };
  }

  /**
   * Close the service
   */
  async close(): Promise<void> {
    if (this.vectorDB) {
      await this.vectorDB.close();
    }
    if (this.gnn) {
      await this.gnn.close();
    }
    this.initialized = false;
  }
}
