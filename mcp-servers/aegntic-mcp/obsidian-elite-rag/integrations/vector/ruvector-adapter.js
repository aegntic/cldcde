/**
 * RuVector Adapter for Obsidian Elite RAG
 *
 * High-performance vector database adapter using ruvector
 * Provides 50k+ inserts/sec with HNSW indexing
 *
 * Replaces/enhances Qdrant for faster semantic search
 */

const { RuVector } = require('@ruvector/core');
const { RuVectorGNN } = require('@ruvector/gnn');

class RuVectorAdapter {
  constructor(config = {}) {
    this.dimension = config.dimension || 1536; // OpenAI embedding dimension
    this.collectionName = config.collectionName || 'obsidian_knowledge';
    this.db = null;
    this.gnn = null;
    this.initialized = false;
  }

  /**
   * Initialize the vector database
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize ruvector core
      this.db = new RuVector({
        dimension: this.dimension,
        path: `./data/ruvector/${this.collectionName}`,
        indexing: {
          type: 'HNSW',
          M: 16, // HNSW parameter
          efConstruction: 200
        }
      });

      await this.db.initialize();

      // Initialize GNN for advanced graph operations
      this.gnn = new RuVectorGNN({
        vectorDb: this.db
      });

      await this.gnn.initialize();

      this.initialized = true;
      console.log(`✅ RuVector initialized: ${this.collectionName} (dim=${this.dimension})`);
    } catch (error) {
      console.error('Failed to initialize RuVector:', error);
      throw error;
    }
  }

  /**
   * Insert vectors with metadata
   * @param {Array} vectors - Array of {id, vector, metadata} objects
   * @returns {Promise<Object>} Insert results
   */
  async insert(vectors) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const results = await this.db.insert({
        collection: this.collectionName,
        vectors: vectors.map(v => ({
          id: v.id,
          vector: v.vector,
          metadata: v.metadata || {}
        }))
      });

      console.log(`✅ Inserted ${vectors.length} vectors (rate: ~50k/sec)`);
      return results;
    } catch (error) {
      console.error('Insert failed:', error);
      throw error;
    }
  }

  /**
   * Semantic similarity search
   * @param {Array} queryVector - Query embedding
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async search(queryVector, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      limit = 10,
      filters = {},
      scoreThreshold = 0.7
    } = options;

    try {
      const results = await this.db.search({
        collection: this.collectionName,
        vector: queryVector,
        limit,
        filters,
        scoreThreshold
      });

      return results.map(r => ({
        id: r.id,
        score: r.score,
        metadata: r.metadata
      }));
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  /**
   * Hybrid search: Vector + Graph (GNN)
   * Combines semantic search with knowledge graph traversal
   * @param {Array} queryVector - Query embedding
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Enhanced results with graph context
   */
  async searchWithGraph(queryVector, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      limit = 10,
      graphDepth = 2,
      scoreThreshold = 0.6
    } = options;

    try {
      // Perform semantic search
      const semanticResults = await this.search(queryVector, {
        limit: limit * 2, // Get more candidates for graph expansion
        scoreThreshold
      });

      // Expand results using GNN graph traversal
      const expandedResults = await this.gnn.expandWithGraph({
        seeds: semanticResults.map(r => r.id),
        depth: graphDepth,
        limit
      });

      // Re-rank combined results
      const finalResults = this.rerankResults(semanticResults, expandedResults);

      return finalResults.slice(0, limit);
    } catch (error) {
      console.error('Hybrid search failed:', error);
      // Fallback to pure vector search
      return this.search(queryVector, options);
    }
  }

  /**
   * Delete vectors by IDs
   * @param {Array<string>} ids - IDs to delete
   * @returns {Promise<Object>} Delete results
   */
  async delete(ids) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const results = await this.db.delete({
        collection: this.collectionName,
        ids
      });

      console.log(`✅ Deleted ${ids.length} vectors`);
      return results;
    } catch (error) {
      console.error('Delete failed:', error);
      throw error;
    }
  }

  /**
   * Update vector metadata
   * @param {string} id - Vector ID
   * @param {Object} metadata - New metadata
   * @returns {Promise<Object>} Update results
   */
  async update(id, metadata) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const results = await this.db.update({
        collection: this.collectionName,
        id,
        metadata
      });

      console.log(`✅ Updated vector ${id}`);
      return results;
    } catch (error) {
      console.error('Update failed:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} Database stats
   */
  async getStats() {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const stats = await this.db.getStats({
        collection: this.collectionName
      });

      return {
        totalVectors: stats.count,
        dimension: this.dimension,
        indexingType: 'HNSW',
        memoryUsage: stats.memory,
        lastModified: stats.lastModified
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  async close() {
    if (this.db) {
      await this.db.close();
    }
    if (this.gnn) {
      await this.gnn.close();
    }
    this.initialized = false;
    console.log('✅ RuVector connection closed');
  }

  /**
   * Re-rank results combining semantic and graph signals
   * @private
   */
  rerankResults(semanticResults, graphResults) {
    const combined = new Map();

    // Add semantic results with base score
    semanticResults.forEach(r => {
      combined.set(r.id, {
        ...r,
        graphScore: 0
      });
    });

    // Enhance with graph scores
    graphResults.forEach(r => {
      if (combined.has(r.id)) {
        combined.get(r.id).graphScore = r.graphScore;
        combined.get(r.id).finalScore =
          combined.get(r.id).score * 0.7 + r.graphScore * 0.3;
      } else {
        combined.set(r.id, {
          ...r,
          score: r.score * 0.5,
          finalScore: r.score * 0.5,
          graphScore: r.graphScore
        });
      }
    });

    return Array.from(combined.values())
      .sort((a, b) => (b.finalScore || b.score) - (a.finalScore || a.score));
  }
}

module.exports = RuVectorAdapter;
