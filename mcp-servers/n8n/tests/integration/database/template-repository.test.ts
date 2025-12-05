import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { TemplateRepository } from '../../../src/templates/template-repository';
import { DatabaseAdapter } from '../../../src/database/database-adapter';
import { TestDatabase, TestDataGenerator, createTestDatabaseAdapter } from './test-utils';
import { TemplateWorkflow, TemplateDetail } from '../../../src/templates/template-fetcher';

describe('TemplateRepository Integration Tests', () => {
  let testDb: TestDatabase;
  let db: Database.Database;
  let repository: TemplateRepository;
  let adapter: DatabaseAdapter;

  beforeEach(async () => {
    testDb = new TestDatabase({ mode: 'memory', enableFTS5: true });
    db = await testDb.initialize();
    adapter = createTestDatabaseAdapter(db);
    repository = new TemplateRepository(adapter);
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  describe('saveTemplate', () => {
    it('should save single template successfully', () => {
      const template = createTemplateWorkflow();
      const detail = createTemplateDetail({ id: template.id });
      repository.saveTemplate(template, detail);

      const saved = repository.getTemplate(template.id);
      expect(saved).toBeTruthy();
      expect(saved?.workflow_id).toBe(template.id);
      expect(saved?.name).toBe(template.name);
    });

    it('should update existing template', () => {
      const template = createTemplateWorkflow();
      
      // Save initial version
      const detail = createTemplateDetail({ id: template.id });
      repository.saveTemplate(template, detail);
      
      // Update and save again
      const updated: TemplateWorkflow = { ...template, name: 'Updated Template' };
      repository.saveTemplate(updated, detail);

      const saved = repository.getTemplate(template.id);
      expect(saved?.name).toBe('Updated Template');
      
      // Should not create duplicate
      const all = repository.getAllTemplates();
      expect(all).toHaveLength(1);
    });

    it('should handle templates with complex node types', () => {
      const template = createTemplateWorkflow({
        id: 1
      });

      const nodes = [
        {
          id: 'node1',
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [100, 100],
          parameters: {}
        },
        {
          id: 'node2',
          name: 'HTTP Request',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 3,
          position: [300, 100],
          parameters: {
            url: 'https://api.example.com',
            method: 'POST'
          }
        }
      ];

      const detail = createTemplateDetail({ 
        id: template.id, 
        workflow: {
          id: template.id.toString(),
          name: template.name,
          nodes: nodes,
          connections: {},
          settings: {}
        }
      });
      repository.saveTemplate(template, detail);
      
      const saved = repository.getTemplate(template.id);
      expect(saved).toBeTruthy();
      
      const nodesUsed = JSON.parse(saved!.nodes_used);
      expect(nodesUsed).toContain('n8n-nodes-base.webhook');
      expect(nodesUsed).toContain('n8n-nodes-base.httpRequest');
    });

    it('should sanitize workflow data before saving', () => {
      const template = createTemplateWorkflow({
        id: 5
      });

      const detail = createTemplateDetail({ 
        id: template.id, 
        workflow: {
          id: template.id.toString(),
          name: template.name,
          nodes: [
            {
              id: 'node1',
              name: 'Start',
              type: 'n8n-nodes-base.start',
              typeVersion: 1,
              position: [100, 100],
              parameters: {}
            }
          ],
          connections: {},
          settings: {},
          pinData: { node1: { data: 'sensitive' } },
          executionId: 'should-be-removed'
        }
      });
      repository.saveTemplate(template, detail);
      
      const saved = repository.getTemplate(template.id);
      expect(saved).toBeTruthy();
      
      const workflowJson = JSON.parse(saved!.workflow_json);
      expect(workflowJson.pinData).toBeUndefined();
    });
  });

  describe('getTemplate', () => {
    beforeEach(() => {
      const templates = [
        createTemplateWorkflow({ id: 1, name: 'Template 1' }),
        createTemplateWorkflow({ id: 2, name: 'Template 2' })
      ];
      templates.forEach(t => {
        const detail = createTemplateDetail({ 
          id: t.id,
          name: t.name,
          description: t.description
        });
        repository.saveTemplate(t, detail);
      });
    });

    it('should retrieve template by id', () => {
      const template = repository.getTemplate(1);
      expect(template).toBeTruthy();
      expect(template?.name).toBe('Template 1');
    });

    it('should return null for non-existent template', () => {
      const template = repository.getTemplate(999);
      expect(template).toBeNull();
    });
  });

  describe('searchTemplates with FTS5', () => {
    beforeEach(() => {
      const templates = [
        createTemplateWorkflow({
          id: 1,
          name: 'Webhook to Slack',
          description: 'Send Slack notifications when webhook received'
        }),
        createTemplateWorkflow({
          id: 2,
          name: 'HTTP Data Processing',
          description: 'Process data from HTTP requests'
        }),
        createTemplateWorkflow({
          id: 3,
          name: 'Email Automation',
          description: 'Automate email sending workflow'
        })
      ];
      templates.forEach(t => {
        const detail = createTemplateDetail({ 
          id: t.id,
          name: t.name,
          description: t.description
        });
        repository.saveTemplate(t, detail);
      });
    });

    it('should search templates by name', () => {
      const results = repository.searchTemplates('webhook');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Webhook to Slack');
    });

    it('should search templates by description', () => {
      const results = repository.searchTemplates('automate');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Email Automation');
    });

    it('should handle multiple search terms', () => {
      const results = repository.searchTemplates('data process');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('HTTP Data Processing');
    });

    it('should limit search results', () => {
      // Add more templates
      for (let i = 4; i <= 20; i++) {
        const template = createTemplateWorkflow({
          id: i,
          name: `Test Template ${i}`,
          description: 'Test description'
        });
        const detail = createTemplateDetail({ id: i });
        repository.saveTemplate(template, detail);
      }

      const results = repository.searchTemplates('test', 5);
      expect(results).toHaveLength(5);
    });

    it('should handle special characters in search', () => {
      const template = createTemplateWorkflow({
        id: 100,
        name: 'Special @ # $ Template',
        description: 'Template with special characters'
      });
      const detail = createTemplateDetail({ id: 100 });
      repository.saveTemplate(template, detail);

      const results = repository.searchTemplates('special');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getTemplatesByNodeTypes', () => {
    beforeEach(() => {
      const templates = [
        {
          workflow: createTemplateWorkflow({ id: 1 }),
          detail: createTemplateDetail({
            id: 1,
            workflow: {
              nodes: [
                { id: 'node1', name: 'Webhook', type: 'n8n-nodes-base.webhook', typeVersion: 1, position: [100, 100], parameters: {} },
                { id: 'node2', name: 'Slack', type: 'n8n-nodes-base.slack', typeVersion: 1, position: [300, 100], parameters: {} }
              ],
              connections: {},
              settings: {}
            }
          })
        },
        {
          workflow: createTemplateWorkflow({ id: 2 }),
          detail: createTemplateDetail({
            id: 2,
            workflow: {
              nodes: [
                { id: 'node1', name: 'HTTP Request', type: 'n8n-nodes-base.httpRequest', typeVersion: 3, position: [100, 100], parameters: {} },
                { id: 'node2', name: 'Set', type: 'n8n-nodes-base.set', typeVersion: 1, position: [300, 100], parameters: {} }
              ],
              connections: {},
              settings: {}
            }
          })
        },
        {
          workflow: createTemplateWorkflow({ id: 3 }),
          detail: createTemplateDetail({
            id: 3,
            workflow: {
              nodes: [
                { id: 'node1', name: 'Webhook', type: 'n8n-nodes-base.webhook', typeVersion: 1, position: [100, 100], parameters: {} },
                { id: 'node2', name: 'HTTP Request', type: 'n8n-nodes-base.httpRequest', typeVersion: 3, position: [300, 100], parameters: {} }
              ],
              connections: {},
              settings: {}
            }
          })
        }
      ];
      templates.forEach(t => {
        repository.saveTemplate(t.workflow, t.detail);
      });
    });

    it('should find templates using specific node types', () => {
      const results = repository.getTemplatesByNodes(['n8n-nodes-base.webhook']);
      expect(results).toHaveLength(2);
      expect(results.map(r => r.workflow_id)).toContain(1);
      expect(results.map(r => r.workflow_id)).toContain(3);
    });

    it('should find templates using multiple node types', () => {
      const results = repository.getTemplatesByNodes([
        'n8n-nodes-base.webhook',
        'n8n-nodes-base.slack'
      ]);
      // The query uses OR, so it finds templates with either webhook OR slack
      expect(results).toHaveLength(2); // Templates 1 and 3 have webhook, template 1 has slack
      expect(results.map(r => r.workflow_id)).toContain(1);
      expect(results.map(r => r.workflow_id)).toContain(3);
    });

    it('should return empty array for non-existent node types', () => {
      const results = repository.getTemplatesByNodes(['non-existent-node']);
      expect(results).toHaveLength(0);
    });

    it('should limit results', () => {
      const results = repository.getTemplatesByNodes(['n8n-nodes-base.webhook'], 1);
      expect(results).toHaveLength(1);
    });
  });

  describe('getAllTemplates', () => {
    it('should return empty array when no templates', () => {
      const templates = repository.getAllTemplates();
      expect(templates).toHaveLength(0);
    });

    it('should return all templates with limit', () => {
      for (let i = 1; i <= 20; i++) {
        const template = createTemplateWorkflow({ id: i });
        const detail = createTemplateDetail({ id: i });
        repository.saveTemplate(template, detail);
      }

      const templates = repository.getAllTemplates(10);
      expect(templates).toHaveLength(10);
    });

    it('should order templates by views and created_at descending', () => {
      // Save templates with different views to ensure predictable ordering
      const template1 = createTemplateWorkflow({ id: 1, name: 'First', totalViews: 50 });
      const detail1 = createTemplateDetail({ id: 1 });
      repository.saveTemplate(template1, detail1);

      const template2 = createTemplateWorkflow({ id: 2, name: 'Second', totalViews: 100 });
      const detail2 = createTemplateDetail({ id: 2 });
      repository.saveTemplate(template2, detail2);

      const templates = repository.getAllTemplates();
      expect(templates).toHaveLength(2);
      // Higher views should be first
      expect(templates[0].name).toBe('Second');
      expect(templates[1].name).toBe('First');
    });
  });

  describe('getTemplate with detail', () => {
    it('should return template with workflow data', () => {
      const template = createTemplateWorkflow({ id: 1 });
      const detail = createTemplateDetail({ id: 1 });
      repository.saveTemplate(template, detail);

      const saved = repository.getTemplate(1);
      expect(saved).toBeTruthy();
      expect(saved?.workflow_json).toBeTruthy();
      const workflow = JSON.parse(saved!.workflow_json);
      expect(workflow.nodes).toHaveLength(detail.workflow.nodes.length);
    });
  });

  // Skipping clearOldTemplates test - method not implemented in repository
  describe.skip('clearOldTemplates', () => {
    it('should remove templates older than specified days', () => {
      // Insert old template (30 days ago)
      db.prepare(`
        INSERT INTO templates (
          id, workflow_id, name, description,
          nodes_used, workflow_json, categories, views,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, '[]', '{}', '[]', 0, datetime('now', '-31 days'), datetime('now', '-31 days'))
      `).run(1, 1001, 'Old Template', 'Old template');

      // Insert recent template
      const recentTemplate = createTemplateWorkflow({ id: 2, name: 'Recent Template' });
      const recentDetail = createTemplateDetail({ id: 2 });
      repository.saveTemplate(recentTemplate, recentDetail);

      // Clear templates older than 30 days
      // const deleted = repository.clearOldTemplates(30);
      // expect(deleted).toBe(1);

      const remaining = repository.getAllTemplates();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].name).toBe('Recent Template');
    });
  });

  describe('Transaction handling', () => {
    it('should rollback on error during bulk save', () => {
      const templates = [
        createTemplateWorkflow({ id: 1 }),
        createTemplateWorkflow({ id: 2 }),
        { id: null } as any // Invalid template
      ];

      expect(() => {
        const transaction = db.transaction(() => {
          templates.forEach(t => {
            if (t.id === null) {
              // This will cause an error in the transaction
              throw new Error('Invalid template');
            }
            const detail = createTemplateDetail({ 
              id: t.id,
              name: t.name,
              description: t.description
            });
            repository.saveTemplate(t, detail);
          });
        });
        transaction();
      }).toThrow();

      // No templates should be saved due to error
      const all = repository.getAllTemplates();
      expect(all).toHaveLength(0);
    });
  });

  describe('FTS5 performance', () => {
    it('should handle large dataset searches efficiently', () => {
      // Insert 1000 templates
      const templates = Array.from({ length: 1000 }, (_, i) => 
        createTemplateWorkflow({
          id: i + 1,
          name: `Template ${i}`,
          description: `Description for ${['webhook', 'http', 'automation', 'data'][i % 4]} workflow ${i}`
        })
      );

      const insertMany = db.transaction((templates: TemplateWorkflow[]) => {
        templates.forEach(t => {
          const detail = createTemplateDetail({ id: t.id });
          repository.saveTemplate(t, detail);
        });
      });

      const start = Date.now();
      insertMany(templates);
      const insertDuration = Date.now() - start;

      expect(insertDuration).toBeLessThan(2000); // Should complete in under 2 seconds

      // Test search performance
      const searchStart = Date.now();
      const results = repository.searchTemplates('webhook', 50);
      const searchDuration = Date.now() - searchStart;

      expect(searchDuration).toBeLessThan(50); // Search should be very fast
      expect(results).toHaveLength(50);
    });
  });
});

// Helper functions
function createTemplateWorkflow(overrides: any = {}): TemplateWorkflow {
  const id = overrides.id || Math.floor(Math.random() * 10000);

  return {
    id,
    name: overrides.name || `Test Workflow ${id}`,
    description: overrides.description || '',
    totalViews: overrides.totalViews || 100,
    createdAt: overrides.createdAt || new Date().toISOString(),
    user: {
      id: 1,
      name: 'Test User',
      username: overrides.username || 'testuser',
      verified: false
    },
    nodes: [] // TemplateNode[] - just metadata about nodes, not actual workflow nodes
  };
}

function createTemplateDetail(overrides: any = {}): TemplateDetail {
  const id = overrides.id || Math.floor(Math.random() * 10000);
  return {
    id,
    name: overrides.name || `Test Workflow ${id}`,
    description: overrides.description || '',
    views: overrides.views || 100,
    createdAt: overrides.createdAt || new Date().toISOString(),
    workflow: overrides.workflow || {
      id: id.toString(),
      name: overrides.name || `Test Workflow ${id}`,
      nodes: overrides.nodes || [
        {
          id: 'node1',
          name: 'Start',
          type: 'n8n-nodes-base.start',
          typeVersion: 1,
          position: [100, 100],
          parameters: {}
        }
      ],
      connections: overrides.connections || {},
      settings: overrides.settings || {},
      pinData: overrides.pinData
    }
  };
}