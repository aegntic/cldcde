import { bench, describe } from 'vitest';
import { NodeRepository } from '../../src/database/node-repository';
import { SQLiteStorageService } from '../../src/services/sqlite-storage-service';
import { NodeFactory } from '../factories/node-factory';
import { PropertyDefinitionFactory } from '../factories/property-definition-factory';

describe('Database Query Performance', () => {
  let repository: NodeRepository;
  let storage: SQLiteStorageService;
  const testNodeCount = 500;

  beforeAll(async () => {
    storage = new SQLiteStorageService(':memory:');
    repository = new NodeRepository(storage);
    
    // Seed database with test data
    for (let i = 0; i < testNodeCount; i++) {
      const node = NodeFactory.build({
        displayName: `TestNode${i}`,
        nodeType: `nodes-base.testNode${i}`,
        category: i % 2 === 0 ? 'transform' : 'trigger',
        packageName: 'n8n-nodes-base',
        documentation: `Test documentation for node ${i}`,
        properties: PropertyDefinitionFactory.buildList(5)
      });
      await repository.upsertNode(node);
    }
  });

  afterAll(() => {
    storage.close();
  });

  bench('getNodeByType - existing node', async () => {
    await repository.getNodeByType('nodes-base.testNode100');
  }, {
    iterations: 1000,
    warmupIterations: 100,
    warmupTime: 500,
    time: 3000
  });

  bench('getNodeByType - non-existing node', async () => {
    await repository.getNodeByType('nodes-base.nonExistentNode');
  }, {
    iterations: 1000,
    warmupIterations: 100,
    warmupTime: 500,
    time: 3000
  });

  bench('getNodesByCategory - transform', async () => {
    await repository.getNodesByCategory('transform');
  }, {
    iterations: 100,
    warmupIterations: 10,
    warmupTime: 500,
    time: 3000
  });

  bench('searchNodes - OR mode', async () => {
    await repository.searchNodes('test node data', 'OR', 20);
  }, {
    iterations: 100,
    warmupIterations: 10,
    warmupTime: 500,
    time: 3000
  });

  bench('searchNodes - AND mode', async () => {
    await repository.searchNodes('test node', 'AND', 20);
  }, {
    iterations: 100,
    warmupIterations: 10,
    warmupTime: 500,
    time: 3000
  });

  bench('searchNodes - FUZZY mode', async () => {
    await repository.searchNodes('tst nde', 'FUZZY', 20);
  }, {
    iterations: 100,
    warmupIterations: 10,
    warmupTime: 500,
    time: 3000
  });

  bench('getAllNodes - no limit', async () => {
    await repository.getAllNodes();
  }, {
    iterations: 50,
    warmupIterations: 5,
    warmupTime: 500,
    time: 3000
  });

  bench('getAllNodes - with limit', async () => {
    await repository.getAllNodes(50);
  }, {
    iterations: 100,
    warmupIterations: 10,
    warmupTime: 500,
    time: 3000
  });

  bench('getNodeCount', async () => {
    await repository.getNodeCount();
  }, {
    iterations: 1000,
    warmupIterations: 100,
    warmupTime: 100,
    time: 2000
  });

  bench('getAIToolNodes', async () => {
    await repository.getAIToolNodes();
  }, {
    iterations: 100,
    warmupIterations: 10,
    warmupTime: 500,
    time: 3000
  });

  bench('upsertNode - new node', async () => {
    const node = NodeFactory.build({
      displayName: `BenchNode${Date.now()}`,
      nodeType: `nodes-base.benchNode${Date.now()}`
    });
    await repository.upsertNode(node);
  }, {
    iterations: 100,
    warmupIterations: 10,
    warmupTime: 500,
    time: 3000
  });

  bench('upsertNode - existing node update', async () => {
    const existingNode = await repository.getNodeByType('nodes-base.testNode0');
    if (existingNode) {
      existingNode.description = `Updated description ${Date.now()}`;
      await repository.upsertNode(existingNode);
    }
  }, {
    iterations: 100,
    warmupIterations: 10,
    warmupTime: 500,
    time: 3000
  });
});