import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nodeFactory, webhookNodeFactory, slackNodeFactory } from '@tests/fixtures/factories/node.factory';

// Mock better-sqlite3
vi.mock('better-sqlite3');

describe('Test Infrastructure', () => {
  describe('Database Mock', () => {
    it('should create a mock database instance', async () => {
      const Database = (await import('better-sqlite3')).default;
      const db = new Database(':memory:');
      
      expect(Database).toHaveBeenCalled();
      expect(db).toBeDefined();
      expect(db.prepare).toBeDefined();
      expect(db.exec).toBeDefined();
      expect(db.close).toBeDefined();
    });
    
    it('should handle basic CRUD operations', async () => {
      const { MockDatabase } = await import('@tests/unit/database/__mocks__/better-sqlite3');
      const db = new MockDatabase();
      
      // Test data seeding
      db._seedData('nodes', [
        { id: '1', name: 'test-node', type: 'webhook' }
      ]);
      
      // Test SELECT
      const selectStmt = db.prepare('SELECT * FROM nodes');
      const allNodes = selectStmt.all();
      expect(allNodes).toHaveLength(1);
      expect(allNodes[0]).toEqual({ id: '1', name: 'test-node', type: 'webhook' });
      
      // Test INSERT
      const insertStmt = db.prepare('INSERT INTO nodes (id, name, type) VALUES (?, ?, ?)');
      const result = insertStmt.run({ id: '2', name: 'new-node', type: 'slack' });
      expect(result.changes).toBe(1);
      
      // Verify insert worked
      const allNodesAfter = selectStmt.all();
      expect(allNodesAfter).toHaveLength(2);
    });
  });
  
  describe('Node Factory', () => {
    it('should create a basic node definition', () => {
      const node = nodeFactory.build();
      
      expect(node).toMatchObject({
        name: expect.any(String),
        displayName: expect.any(String),
        description: expect.any(String),
        version: expect.any(Number),
        defaults: {
          name: expect.any(String)
        },
        inputs: ['main'],
        outputs: ['main'],
        properties: expect.any(Array),
        credentials: []
      });
    });
    
    it('should create a webhook node', () => {
      const webhook = webhookNodeFactory.build();
      
      expect(webhook).toMatchObject({
        name: 'webhook',
        displayName: 'Webhook',
        description: 'Starts the workflow when a webhook is called',
        group: ['trigger'],
        properties: expect.arrayContaining([
          expect.objectContaining({
            name: 'path',
            type: 'string',
            required: true
          }),
          expect.objectContaining({
            name: 'method',
            type: 'options'
          })
        ])
      });
    });
    
    it('should create a slack node', () => {
      const slack = slackNodeFactory.build();
      
      expect(slack).toMatchObject({
        name: 'slack',
        displayName: 'Slack',
        description: 'Send messages to Slack',
        group: ['output'],
        credentials: [
          {
            name: 'slackApi',
            required: true
          }
        ],
        properties: expect.arrayContaining([
          expect.objectContaining({
            name: 'resource',
            type: 'options'
          }),
          expect.objectContaining({
            name: 'operation',
            type: 'options',
            displayOptions: {
              show: {
                resource: ['message']
              }
            }
          })
        ])
      });
    });
    
    it('should allow overriding factory defaults', () => {
      const customNode = nodeFactory.build({
        name: 'custom-node',
        displayName: 'Custom Node',
        version: 2
      });
      
      expect(customNode.name).toBe('custom-node');
      expect(customNode.displayName).toBe('Custom Node');
      expect(customNode.version).toBe(2);
    });
    
    it('should create multiple unique nodes', () => {
      const nodes = nodeFactory.buildList(5);
      
      expect(nodes).toHaveLength(5);
      const names = nodes.map(n => n.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(5);
    });
  });
});