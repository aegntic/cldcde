/**
 * Unified RuVector Utilities
 *
 * Shared utilities and helpers for ruvector integration across projects
 * Can be used by Obsidian RAG, n8n-mcp, and CLDCDE platform
 */

import { RuVector } from '@ruvector/core';
import { RuVectorGNN } from '@ruvector/gnn';

/**
 * Common embedding utilities
 */
export class EmbeddingUtils {
  /**
   * Simple text-to-embedding using hash-based approach
   * In production, replace with actual embedding models (OpenAI, sentence-transformers)
   */
  static textToEmbedding(text: string, dimension = 384): number[] {
    const normalized = text.toLowerCase().trim();
    const hash = this.hashCode(normalized);
    const embedding = new Array(dimension).fill(0);

    for (let i = 0; i < dimension; i++) {
      embedding[i] = Math.sin(hash * (i + 1) * 0.123456789);
    }

    // Normalize to unit length
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  /**
   * Compute cosine similarity between two embeddings
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have same dimension');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Compute Euclidean distance between embeddings
   */
  static euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have same dimension');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Batch text-to-embedding conversion
   */
  static async batchTextToEmbedding(
    texts: string[],
    dimension = 384
  ): Promise<number[]> {
    // In production, use actual embedding model with batch processing
    return texts.map(text => this.textToEmbedding(text, dimension));
  }

  /**
   * Hash function for text
   */
  private static hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

/**
 * Common ruvector initialization patterns
 */
export class RuVectorFactory {
  /**
   * Create ruvector instance with default settings
   */
  static async create(options: {
    dimension?: number;
    path?: string;
    collection?: string;
  } = {}) {
    const {
      dimension = 384,
      path = './data/ruvector',
      collection = 'default'
    } = options;

    const vectorDB = new RuVector({
      dimension,
      path,
      indexing: {
        type: 'HNSW',
        M: 16,
        efConstruction: 200
      }
    });

    await vectorDB.initialize();

    const gnn = new RuVectorGNN({ vectorDb: vectorDB });
    await gnn.initialize();

    return { vectorDB, gnn, collection, dimension };
  }

  /**
   * Create in-memory ruvector for testing
   */
  static async createInMemory(dimension = 384) {
    const vectorDB = new RuVector({
      dimension,
      path: ':memory:',
      indexing: { type: 'HNSW', M: 16, efConstruction: 200 }
    });

    await vectorDB.initialize();

    const gnn = new RuVectorGNN({ vectorDb: vectorDB });
    await gnn.initialize();

    return { vectorDB, gnn };
  }
}

/**
 * Batch processing utilities
 */
export class BatchProcessor {
  /**
   * Process items in batches with progress tracking
   */
  static async processBatches<T, R>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<R[]>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);

      if (onProgress) {
        onProgress(Math.min(i + batchSize, items.length), items.length);
      }
    }

    return results;
  }

  /**
   * Batch insert vectors with error handling
   */
  static async batchInsert(
    vectorDB: any,
    collection: string,
    items: Array<{ id: string; vector: number[]; metadata?: any }>,
    batchSize = 100,
    onProgress?: (completed: number, total: number) => void
  ): Promise<void> {
    await this.processBatches(
      items,
      batchSize,
      async (batch) => {
        await vectorDB.insert({
          collection,
          vectors: batch
        });
        return batch;
      },
      onProgress
    );
  }

  /**
   * Batch search with parallel requests
   */
  static async batchSearch(
    vectorDB: any,
    collection: string,
    queries: number[],
    options: any = {}
  ): Promise<any[][]> {
    const batchSize = 10;
    const batches: number[][] = [];

    for (let i = 0; i < queries.length; i += batchSize) {
      batches.push(queries.slice(i, i + batchSize));
    }

    const results: any[][] = [];

    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(query =>
          vectorDB.search({
            collection,
            vector: query,
            ...options
          })
        )
      );

      results.push(...batchResults);
    }

    return results;
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  /**
   * Measure execution time of a function
   */
  static async measure<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }

    this.metrics.get(label)!.push(duration);

    return result;
  }

  /**
   * Get statistics for a labeled operation
   */
  static getStats(label: string) {
    const times = this.metrics.get(label);
    if (!times || times.length === 0) {
      return null;
    }

    const sum = times.reduce((a, b) => a + b, 0);
    const avg = sum / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    return {
      count: times.length,
      avg: avg.toFixed(2) + 'ms',
      min: min.toFixed(2) + 'ms',
      max: max.toFixed(2) + 'ms',
      total: sum.toFixed(2) + 'ms'
    };
  }

  /**
   * Get all metrics
   */
  static getAllStats() {
    const stats: Record<string, any> = {};

    for (const label of this.metrics.keys()) {
      stats[label] = this.getStats(label);
    }

    return stats;
  }

  /**
   * Clear all metrics
   */
  static clear() {
    this.metrics.clear();
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  /**
   * Validate embedding dimensions
   */
  static validateEmbedding(embedding: number[], expectedDimension?: number) {
    if (!Array.isArray(embedding)) {
      throw new Error('Embedding must be an array');
    }

    if (embedding.length === 0) {
      throw new Error('Embedding cannot be empty');
    }

    if (expectedDimension && embedding.length !== expectedDimension) {
      throw new Error(
        `Embedding dimension mismatch: expected ${expectedDimension}, got ${embedding.length}`
      );
    }

    // Check for NaN or Infinity
    if (embedding.some(v => !Number.isFinite(v))) {
      throw new Error('Embedding contains NaN or Infinity values');
    }

    return true;
  }

  /**
   * Validate search options
   */
  static validateSearchOptions(options: any) {
    const errors: string[] = [];

    if (options.limit !== undefined) {
      if (!Number.isInteger(options.limit) || options.limit < 1) {
        errors.push('limit must be a positive integer');
      }
    }

    if (options.scoreThreshold !== undefined) {
      if (typeof options.scoreThreshold !== 'number' ||
          options.scoreThreshold < 0 || options.scoreThreshold > 1) {
        errors.push('scoreThreshold must be between 0 and 1');
      }
    }

    if (errors.length > 0) {
      throw new Error('Invalid search options: ' + errors.join(', '));
    }

    return true;
  }
}

/**
 * Logging utilities
 */
export class Logger {
  private static prefix = '[RuVector]';

  static info(message: string, ...args: any[]) {
    console.log(`${this.prefix} INFO:`, message, ...args);
  }

  static warn(message: string, ...args: any[]) {
    console.warn(`${this.prefix} WARN:`, message, ...args);
  }

  static error(message: string, ...args: any[]) {
    console.error(`${this.prefix} ERROR:`, message, ...args);
  }

  static success(message: string, ...args: any[]) {
    console.log(`${this.prefix} ✅`, message, ...args);
  }

  static debug(message: string, ...args: any[]) {
    if (process.env.DEBUG === 'true') {
      console.log(`${this.prefix} DEBUG:`, message, ...args);
    }
  }
}

/**
 * Export all utilities
 */
export default {
  EmbeddingUtils,
  RuVectorFactory,
  BatchProcessor,
  PerformanceMonitor,
  ValidationUtils,
  Logger
};
