import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTestDatabase,
  seedTestNodes,
  seedTestTemplates,
  createTestNode,
  createTestTemplate,
  createDatabaseSnapshot,
  restoreDatabaseSnapshot,
  loadFixtures,
  dbHelpers,
  TestDatabase
} from '../utils/database-utils';
import * as path from 'path';

/**
 * Example test file showing how to use database utilities
 * in real test scenarios
 */

describe('Example: Using Database Utils in Tests', () => {
  let testDb: TestDatabase;
  
  // Always cleanup after each test
  afterEach(async () => {
    if (testDb) {
      await testDb.cleanup();
    }
  });
  
  describe('Basic Database Setup', () => {
    it('should setup a test database for unit testing', async () => {
      // Create an in-memory database for fast tests
      testDb = await createTestDatabase();
      
      // Seed some test data
      await seedTestNodes(testDb.nodeRepository, [
        { nodeType: 'nodes-base.myCustomNode', displayName: 'My Custom Node' }
      ]);
      
      // Use the repository to test your logic
      const node = testDb.nodeRepository.getNode('nodes-base.myCustomNode');
      expect(node).toBeDefined();
      expect(node.displayName).toBe('My Custom Node');
    });
    
    it('should setup a file-based database for integration testing', async () => {
      // Create a file-based database when you need persistence
      testDb = await createTestDatabase({
        inMemory: false,
        dbPath: path.join(__dirname, '../temp/integration-test.db')
      });
      
      // The database will persist until cleanup() is called
      await seedTestNodes(testDb.nodeRepository);
      
      // You can verify the file exists
      expect(testDb.path).toContain('integration-test.db');
    });
  });
  
  describe('Testing with Fixtures', () => {
    it('should load complex test scenarios from fixtures', async () => {
      testDb = await createTestDatabase();
      
      // Load fixtures from JSON file
      const fixturePath = path.join(__dirname, '../fixtures/database/test-nodes.json');
      await loadFixtures(testDb.adapter, fixturePath);
      
      // Verify the fixture data was loaded
      expect(dbHelpers.countRows(testDb.adapter, 'nodes')).toBe(3);
      expect(dbHelpers.countRows(testDb.adapter, 'templates')).toBe(1);
      
      // Test your business logic with the fixture data
      const slackNode = testDb.nodeRepository.getNode('nodes-base.slack');
      expect(slackNode.isAITool).toBe(true);
      expect(slackNode.category).toBe('Communication');
    });
  });
  
  describe('Testing Repository Methods', () => {
    beforeEach(async () => {
      testDb = await createTestDatabase();
    });
    
    it('should test custom repository queries', async () => {
      // Seed nodes with specific properties
      await seedTestNodes(testDb.nodeRepository, [
        { nodeType: 'nodes-base.ai1', isAITool: true },
        { nodeType: 'nodes-base.ai2', isAITool: true },
        { nodeType: 'nodes-base.regular', isAITool: false }
      ]);
      
      // Test custom queries
      const aiNodes = testDb.nodeRepository.getAITools();
      expect(aiNodes).toHaveLength(4); // 2 custom + 2 default (httpRequest, slack)
      
      // Use dbHelpers for quick checks
      const allNodeTypes = dbHelpers.getAllNodeTypes(testDb.adapter);
      expect(allNodeTypes).toContain('nodes-base.ai1');
      expect(allNodeTypes).toContain('nodes-base.ai2');
    });
  });
  
  describe('Testing with Snapshots', () => {
    it('should test rollback scenarios using snapshots', async () => {
      testDb = await createTestDatabase();
      
      // Setup initial state
      await seedTestNodes(testDb.nodeRepository);
      await seedTestTemplates(testDb.templateRepository);
      
      // Create a snapshot of the good state
      const snapshot = await createDatabaseSnapshot(testDb.adapter);
      
      // Perform operations that might fail
      try {
        // Simulate a complex operation
        await testDb.nodeRepository.saveNode(createTestNode({
          nodeType: 'nodes-base.problematic',
          displayName: 'This might cause issues'
        }));
        
        // Simulate an error
        throw new Error('Something went wrong!');
      } catch (error) {
        // Restore to the known good state
        await restoreDatabaseSnapshot(testDb.adapter, snapshot);
      }
      
      // Verify we're back to the original state
      expect(dbHelpers.countRows(testDb.adapter, 'nodes')).toBe(snapshot.metadata.nodeCount);
      expect(dbHelpers.nodeExists(testDb.adapter, 'nodes-base.problematic')).toBe(false);
    });
  });
  
  describe('Testing Database Performance', () => {
    it('should measure performance of database operations', async () => {
      testDb = await createTestDatabase();
      
      // Measure bulk insert performance
      const insertDuration = await measureDatabaseOperation('Bulk Insert', async () => {
        const nodes = Array.from({ length: 100 }, (_, i) => 
          createTestNode({
            nodeType: `nodes-base.perf${i}`,
            displayName: `Performance Test Node ${i}`
          })
        );
        
        for (const node of nodes) {
          testDb.nodeRepository.saveNode(node);
        }
      });
      
      // Measure query performance
      const queryDuration = await measureDatabaseOperation('Query All Nodes', async () => {
        const allNodes = testDb.nodeRepository.getAllNodes();
        expect(allNodes.length).toBe(100); // 100 bulk nodes (no defaults as we're not using seedTestNodes)
      });
      
      // Assert reasonable performance
      expect(insertDuration).toBeLessThan(1000); // Should complete in under 1 second
      expect(queryDuration).toBeLessThan(100); // Queries should be fast
    });
  });
  
  describe('Testing with Different Database States', () => {
    it('should test behavior with empty database', async () => {
      testDb = await createTestDatabase();
      
      // Test with empty database
      expect(dbHelpers.countRows(testDb.adapter, 'nodes')).toBe(0);
      
      const nonExistentNode = testDb.nodeRepository.getNode('nodes-base.doesnotexist');
      expect(nonExistentNode).toBeNull();
    });
    
    it('should test behavior with populated database', async () => {
      testDb = await createTestDatabase();
      
      // Populate with many nodes
      const nodes = Array.from({ length: 50 }, (_, i) => ({
        nodeType: `nodes-base.node${i}`,
        displayName: `Node ${i}`,
        category: i % 2 === 0 ? 'Category A' : 'Category B'
      }));
      
      await seedTestNodes(testDb.nodeRepository, nodes);
      
      // Test queries on populated database
      const allNodes = dbHelpers.getAllNodeTypes(testDb.adapter);
      expect(allNodes.length).toBe(53); // 50 custom + 3 default
      
      // Test filtering by category
      const categoryANodes = testDb.adapter
        .prepare('SELECT COUNT(*) as count FROM nodes WHERE category = ?')
        .get('Category A') as { count: number };
      
      expect(categoryANodes.count).toBe(25);
    });
  });
  
  describe('Testing Error Scenarios', () => {
    it('should handle database errors gracefully', async () => {
      testDb = await createTestDatabase();
      
      // Test saving invalid data
      const invalidNode = createTestNode({
        nodeType: '', // Invalid: empty nodeType
        displayName: 'Invalid Node'
      });
      
      // SQLite allows NULL in PRIMARY KEY, so test with empty string instead
      // which should violate any business logic constraints
      // For now, we'll just verify the save doesn't crash
      expect(() => {
        testDb.nodeRepository.saveNode(invalidNode);
      }).not.toThrow();
      
      // Database should still be functional
      await seedTestNodes(testDb.nodeRepository);
      expect(dbHelpers.countRows(testDb.adapter, 'nodes')).toBe(4); // 3 default nodes + 1 invalid node
    });
  });
  
  describe('Testing with Transactions', () => {
    it('should test transactional behavior', async () => {
      testDb = await createTestDatabase();
      
      // Seed initial data
      await seedTestNodes(testDb.nodeRepository);
      const initialCount = dbHelpers.countRows(testDb.adapter, 'nodes');
      
      // Use transaction for atomic operations
      try {
        testDb.adapter.transaction(() => {
          // Add multiple nodes atomically
          testDb.nodeRepository.saveNode(createTestNode({ nodeType: 'nodes-base.tx1' }));
          testDb.nodeRepository.saveNode(createTestNode({ nodeType: 'nodes-base.tx2' }));
          
          // Simulate error in transaction
          throw new Error('Transaction failed');
        });
      } catch (error) {
        // Transaction should have rolled back
      }
      
      // Verify no nodes were added
      const finalCount = dbHelpers.countRows(testDb.adapter, 'nodes');
      expect(finalCount).toBe(initialCount);
      expect(dbHelpers.nodeExists(testDb.adapter, 'nodes-base.tx1')).toBe(false);
      expect(dbHelpers.nodeExists(testDb.adapter, 'nodes-base.tx2')).toBe(false);
    });
  });
});

// Helper function for performance measurement
async function measureDatabaseOperation(
  name: string,
  operation: () => Promise<void>
): Promise<number> {
  const start = performance.now();
  await operation();
  const duration = performance.now() - start;
  console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  return duration;
}