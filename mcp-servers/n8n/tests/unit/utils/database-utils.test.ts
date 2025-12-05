import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  createTestDatabase,
  seedTestNodes,
  seedTestTemplates,
  createTestNode,
  createTestTemplate,
  resetDatabase,
  createDatabaseSnapshot,
  restoreDatabaseSnapshot,
  loadFixtures,
  dbHelpers,
  createMockDatabaseAdapter,
  withTransaction,
  measureDatabaseOperation,
  TestDatabase
} from '../../utils/database-utils';

describe('Database Utils', () => {
  let testDb: TestDatabase;
  
  afterEach(async () => {
    if (testDb) {
      await testDb.cleanup();
    }
  });
  
  describe('createTestDatabase', () => {
    it('should create an in-memory database by default', async () => {
      testDb = await createTestDatabase();
      
      expect(testDb.adapter).toBeDefined();
      expect(testDb.nodeRepository).toBeDefined();
      expect(testDb.templateRepository).toBeDefined();
      expect(testDb.path).toBe(':memory:');
    });
    
    it('should create a file-based database when requested', async () => {
      const dbPath = path.join(__dirname, '../../temp/test-file.db');
      testDb = await createTestDatabase({ inMemory: false, dbPath });
      
      expect(testDb.path).toBe(dbPath);
      expect(fs.existsSync(dbPath)).toBe(true);
    });
    
    it('should initialize schema when requested', async () => {
      testDb = await createTestDatabase({ initSchema: true });
      
      // Verify tables exist
      const tables = testDb.adapter
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all() as { name: string }[];
      
      const tableNames = tables.map(t => t.name);
      expect(tableNames).toContain('nodes');
      expect(tableNames).toContain('templates');
    });
    
    it('should skip schema initialization when requested', async () => {
      testDb = await createTestDatabase({ initSchema: false });
      
      // Verify tables don't exist (SQLite has internal tables, so check for our specific tables)
      const tables = testDb.adapter
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('nodes', 'templates')")
        .all() as { name: string }[];
      
      expect(tables.length).toBe(0);
    });
  });
  
  describe('seedTestNodes', () => {
    beforeEach(async () => {
      testDb = await createTestDatabase();
    });
    
    it('should seed default test nodes', async () => {
      const nodes = await seedTestNodes(testDb.nodeRepository);
      
      expect(nodes).toHaveLength(3);
      expect(nodes[0].nodeType).toBe('nodes-base.httpRequest');
      expect(nodes[1].nodeType).toBe('nodes-base.webhook');
      expect(nodes[2].nodeType).toBe('nodes-base.slack');
    });
    
    it('should seed custom nodes along with defaults', async () => {
      const customNodes = [
        { nodeType: 'nodes-base.custom1', displayName: 'Custom 1' },
        { nodeType: 'nodes-base.custom2', displayName: 'Custom 2' }
      ];
      
      const nodes = await seedTestNodes(testDb.nodeRepository, customNodes);
      
      expect(nodes).toHaveLength(5); // 3 default + 2 custom
      expect(nodes[3].nodeType).toBe('nodes-base.custom1');
      expect(nodes[4].nodeType).toBe('nodes-base.custom2');
    });
    
    it('should save nodes to database', async () => {
      await seedTestNodes(testDb.nodeRepository);
      
      const count = dbHelpers.countRows(testDb.adapter, 'nodes');
      expect(count).toBe(3);
      
      const httpNode = testDb.nodeRepository.getNode('nodes-base.httpRequest');
      expect(httpNode).toBeDefined();
      expect(httpNode.displayName).toBe('HTTP Request');
    });
  });
  
  describe('seedTestTemplates', () => {
    beforeEach(async () => {
      testDb = await createTestDatabase();
    });
    
    it('should seed default test templates', async () => {
      const templates = await seedTestTemplates(testDb.templateRepository);
      
      expect(templates).toHaveLength(2);
      expect(templates[0].name).toBe('Simple HTTP Workflow');
      expect(templates[1].name).toBe('Webhook to Slack');
    });
    
    it('should seed custom templates', async () => {
      const customTemplates = [
        { id: 100, name: 'Custom Template' }
      ];
      
      const templates = await seedTestTemplates(testDb.templateRepository, customTemplates);
      
      expect(templates).toHaveLength(3);
      expect(templates[2].id).toBe(100);
      expect(templates[2].name).toBe('Custom Template');
    });
  });
  
  describe('createTestNode', () => {
    it('should create a node with defaults', () => {
      const node = createTestNode();
      
      expect(node.nodeType).toBe('nodes-base.test');
      expect(node.displayName).toBe('Test Node');
      expect(node.style).toBe('programmatic');
      expect(node.isAITool).toBe(false);
    });
    
    it('should override defaults', () => {
      const node = createTestNode({
        nodeType: 'nodes-base.custom',
        displayName: 'Custom Node',
        isAITool: true
      });
      
      expect(node.nodeType).toBe('nodes-base.custom');
      expect(node.displayName).toBe('Custom Node');
      expect(node.isAITool).toBe(true);
    });
  });
  
  describe('resetDatabase', () => {
    beforeEach(async () => {
      testDb = await createTestDatabase();
    });
    
    it('should clear all data and reinitialize schema', async () => {
      // Add some data
      await seedTestNodes(testDb.nodeRepository);
      await seedTestTemplates(testDb.templateRepository);
      
      // Verify data exists
      expect(dbHelpers.countRows(testDb.adapter, 'nodes')).toBe(3);
      expect(dbHelpers.countRows(testDb.adapter, 'templates')).toBe(2);
      
      // Reset database
      await resetDatabase(testDb.adapter);
      
      // Verify data is cleared
      expect(dbHelpers.countRows(testDb.adapter, 'nodes')).toBe(0);
      expect(dbHelpers.countRows(testDb.adapter, 'templates')).toBe(0);
      
      // Verify tables still exist
      const tables = testDb.adapter
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all() as { name: string }[];
      
      const tableNames = tables.map(t => t.name);
      expect(tableNames).toContain('nodes');
      expect(tableNames).toContain('templates');
    });
  });
  
  describe('Database Snapshots', () => {
    beforeEach(async () => {
      testDb = await createTestDatabase();
    });
    
    it('should create and restore database snapshot', async () => {
      // Seed initial data
      await seedTestNodes(testDb.nodeRepository);
      await seedTestTemplates(testDb.templateRepository);
      
      // Create snapshot
      const snapshot = await createDatabaseSnapshot(testDb.adapter);
      
      expect(snapshot.metadata.nodeCount).toBe(3);
      expect(snapshot.metadata.templateCount).toBe(2);
      expect(snapshot.nodes).toHaveLength(3);
      expect(snapshot.templates).toHaveLength(2);
      
      // Clear database
      await resetDatabase(testDb.adapter);
      expect(dbHelpers.countRows(testDb.adapter, 'nodes')).toBe(0);
      
      // Restore from snapshot
      await restoreDatabaseSnapshot(testDb.adapter, snapshot);
      
      // Verify data is restored
      expect(dbHelpers.countRows(testDb.adapter, 'nodes')).toBe(3);
      expect(dbHelpers.countRows(testDb.adapter, 'templates')).toBe(2);
      
      const httpNode = testDb.nodeRepository.getNode('nodes-base.httpRequest');
      expect(httpNode).toBeDefined();
      expect(httpNode.displayName).toBe('HTTP Request');
    });
  });
  
  describe('loadFixtures', () => {
    beforeEach(async () => {
      testDb = await createTestDatabase();
    });
    
    it('should load fixtures from JSON file', async () => {
      // Create a temporary fixture file
      const fixturePath = path.join(__dirname, '../../temp/test-fixtures.json');
      const fixtures = {
        nodes: [
          createTestNode({ nodeType: 'nodes-base.fixture1' }),
          createTestNode({ nodeType: 'nodes-base.fixture2' })
        ],
        templates: [
          createTestTemplate({ id: 1000, name: 'Fixture Template' })
        ]
      };
      
      // Ensure directory exists
      const dir = path.dirname(fixturePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fixturePath, JSON.stringify(fixtures, null, 2));
      
      // Load fixtures
      await loadFixtures(testDb.adapter, fixturePath);
      
      // Verify data was loaded
      expect(dbHelpers.countRows(testDb.adapter, 'nodes')).toBe(2);
      expect(dbHelpers.countRows(testDb.adapter, 'templates')).toBe(1);
      
      expect(dbHelpers.nodeExists(testDb.adapter, 'nodes-base.fixture1')).toBe(true);
      expect(dbHelpers.nodeExists(testDb.adapter, 'nodes-base.fixture2')).toBe(true);
      
      // Cleanup
      fs.unlinkSync(fixturePath);
    });
  });
  
  describe('dbHelpers', () => {
    beforeEach(async () => {
      testDb = await createTestDatabase();
      await seedTestNodes(testDb.nodeRepository);
    });
    
    it('should count rows correctly', () => {
      const count = dbHelpers.countRows(testDb.adapter, 'nodes');
      expect(count).toBe(3);
    });
    
    it('should check if node exists', () => {
      expect(dbHelpers.nodeExists(testDb.adapter, 'nodes-base.httpRequest')).toBe(true);
      expect(dbHelpers.nodeExists(testDb.adapter, 'nodes-base.nonexistent')).toBe(false);
    });
    
    it('should get all node types', () => {
      const nodeTypes = dbHelpers.getAllNodeTypes(testDb.adapter);
      expect(nodeTypes).toHaveLength(3);
      expect(nodeTypes).toContain('nodes-base.httpRequest');
      expect(nodeTypes).toContain('nodes-base.webhook');
      expect(nodeTypes).toContain('nodes-base.slack');
    });
    
    it('should clear table', () => {
      expect(dbHelpers.countRows(testDb.adapter, 'nodes')).toBe(3);
      
      dbHelpers.clearTable(testDb.adapter, 'nodes');
      
      expect(dbHelpers.countRows(testDb.adapter, 'nodes')).toBe(0);
    });
  });
  
  describe('createMockDatabaseAdapter', () => {
    it('should create a mock adapter with all required methods', () => {
      const mockAdapter = createMockDatabaseAdapter();
      
      expect(mockAdapter.prepare).toBeDefined();
      expect(mockAdapter.exec).toBeDefined();
      expect(mockAdapter.close).toBeDefined();
      expect(mockAdapter.pragma).toBeDefined();
      expect(mockAdapter.transaction).toBeDefined();
      expect(mockAdapter.checkFTS5Support).toBeDefined();
      
      // Test that methods are mocked
      expect(vi.isMockFunction(mockAdapter.prepare)).toBe(true);
      expect(vi.isMockFunction(mockAdapter.exec)).toBe(true);
    });
  });
  
  describe('withTransaction', () => {
    beforeEach(async () => {
      testDb = await createTestDatabase();
    });
    
    it('should rollback transaction for testing', async () => {
      // Insert a node
      await seedTestNodes(testDb.nodeRepository, [
        { nodeType: 'nodes-base.transaction-test' }
      ]);
      
      const initialCount = dbHelpers.countRows(testDb.adapter, 'nodes');
      
      // Try to insert in a transaction that will rollback
      const result = await withTransaction(testDb.adapter, async () => {
        testDb.nodeRepository.saveNode(createTestNode({
          nodeType: 'nodes-base.should-rollback'
        }));
        
        // Verify it was inserted within transaction
        const midCount = dbHelpers.countRows(testDb.adapter, 'nodes');
        expect(midCount).toBe(initialCount + 1);
        
        return 'test-result';
      });
      
      // Transaction should have rolled back
      expect(result).toBeNull();
      const finalCount = dbHelpers.countRows(testDb.adapter, 'nodes');
      expect(finalCount).toBe(initialCount);
    });
  });
  
  describe('measureDatabaseOperation', () => {
    beforeEach(async () => {
      testDb = await createTestDatabase();
    });
    
    it('should measure operation duration', async () => {
      const duration = await measureDatabaseOperation('test operation', async () => {
        await seedTestNodes(testDb.nodeRepository);
      });
      
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000); // Should be fast
    });
  });
  
  describe('Integration Tests', () => {
    it('should handle complex database operations', async () => {
      testDb = await createTestDatabase({ enableFTS5: true });
      
      // Seed initial data
      const nodes = await seedTestNodes(testDb.nodeRepository);
      const templates = await seedTestTemplates(testDb.templateRepository);
      
      // Create snapshot
      const snapshot = await createDatabaseSnapshot(testDb.adapter);
      
      // Add more data
      await seedTestNodes(testDb.nodeRepository, [
        { nodeType: 'nodes-base.extra1' },
        { nodeType: 'nodes-base.extra2' }
      ]);
      
      expect(dbHelpers.countRows(testDb.adapter, 'nodes')).toBe(5);
      
      // Restore snapshot
      await restoreDatabaseSnapshot(testDb.adapter, snapshot);
      
      // Should be back to original state
      expect(dbHelpers.countRows(testDb.adapter, 'nodes')).toBe(3);
      
      // Test FTS5 if supported
      if (testDb.adapter.checkFTS5Support()) {
        // FTS5 operations would go here
        expect(true).toBe(true);
      }
    });
  });
});