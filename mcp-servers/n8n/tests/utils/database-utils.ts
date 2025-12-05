import { DatabaseAdapter, createDatabaseAdapter } from '../../src/database/database-adapter';
import { NodeRepository } from '../../src/database/node-repository';
import { TemplateRepository } from '../../src/templates/template-repository';
import { ParsedNode } from '../../src/parsers/node-parser';
import { TemplateWorkflow, TemplateNode, TemplateUser, TemplateDetail } from '../../src/templates/template-fetcher';
import * as fs from 'fs';
import * as path from 'path';
import { vi } from 'vitest';

/**
 * Database test utilities for n8n-mcp
 * Provides helpers for creating, seeding, and managing test databases
 */

export interface TestDatabaseOptions {
  /**
   * Use in-memory database (default: true)
   * When false, creates a temporary file database
   */
  inMemory?: boolean;
  
  /**
   * Custom database path (only used when inMemory is false)
   */
  dbPath?: string;
  
  /**
   * Initialize with schema (default: true)
   */
  initSchema?: boolean;
  
  /**
   * Enable FTS5 support if available (default: false)
   */
  enableFTS5?: boolean;
}

export interface TestDatabase {
  adapter: DatabaseAdapter;
  nodeRepository: NodeRepository;
  templateRepository: TemplateRepository;
  path: string;
  cleanup: () => Promise<void>;
}

export interface DatabaseSnapshot {
  nodes: any[];
  templates: any[];
  metadata: {
    createdAt: string;
    nodeCount: number;
    templateCount: number;
  };
}

/**
 * Creates a test database with repositories
 */
export async function createTestDatabase(options: TestDatabaseOptions = {}): Promise<TestDatabase> {
  const {
    inMemory = true,
    dbPath,
    initSchema = true,
    enableFTS5 = false
  } = options;
  
  // Determine database path
  const finalPath = inMemory 
    ? ':memory:' 
    : dbPath || path.join(__dirname, `../temp/test-${Date.now()}.db`);
  
  // Ensure directory exists for file-based databases
  if (!inMemory) {
    const dir = path.dirname(finalPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  // Create database adapter
  const adapter = await createDatabaseAdapter(finalPath);
  
  // Initialize schema if requested
  if (initSchema) {
    await initializeDatabaseSchema(adapter, enableFTS5);
  }
  
  // Create repositories
  const nodeRepository = new NodeRepository(adapter);
  const templateRepository = new TemplateRepository(adapter);
  
  // Cleanup function
  const cleanup = async () => {
    adapter.close();
    if (!inMemory && fs.existsSync(finalPath)) {
      fs.unlinkSync(finalPath);
    }
  };
  
  return {
    adapter,
    nodeRepository,
    templateRepository,
    path: finalPath,
    cleanup
  };
}

/**
 * Initializes database schema from SQL file
 */
export async function initializeDatabaseSchema(adapter: DatabaseAdapter, enableFTS5 = false): Promise<void> {
  const schemaPath = path.join(__dirname, '../../src/database/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  // Execute main schema
  adapter.exec(schema);
  
  // Optionally initialize FTS5 tables
  if (enableFTS5 && adapter.checkFTS5Support()) {
    adapter.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS templates_fts USING fts5(
        name, 
        description,
        content='templates',
        content_rowid='id'
      );
      
      -- Trigger to keep FTS index in sync
      CREATE TRIGGER IF NOT EXISTS templates_ai AFTER INSERT ON templates BEGIN
        INSERT INTO templates_fts(rowid, name, description) 
        VALUES (new.id, new.name, new.description);
      END;
      
      CREATE TRIGGER IF NOT EXISTS templates_au AFTER UPDATE ON templates BEGIN
        UPDATE templates_fts 
        SET name = new.name, description = new.description 
        WHERE rowid = new.id;
      END;
      
      CREATE TRIGGER IF NOT EXISTS templates_ad AFTER DELETE ON templates BEGIN
        DELETE FROM templates_fts WHERE rowid = old.id;
      END;
    `);
  }
}

/**
 * Seeds test nodes into the database
 */
export async function seedTestNodes(
  nodeRepository: NodeRepository, 
  nodes: Partial<ParsedNode>[] = []
): Promise<ParsedNode[]> {
  const defaultNodes: ParsedNode[] = [
    createTestNode({
      nodeType: 'nodes-base.httpRequest',
      displayName: 'HTTP Request',
      description: 'Makes HTTP requests',
      category: 'Core Nodes',
      isAITool: true
    }),
    createTestNode({
      nodeType: 'nodes-base.webhook',
      displayName: 'Webhook',
      description: 'Receives webhook calls',
      category: 'Core Nodes',
      isTrigger: true,
      isWebhook: true
    }),
    createTestNode({
      nodeType: 'nodes-base.slack',
      displayName: 'Slack',
      description: 'Send messages to Slack',
      category: 'Communication',
      isAITool: true
    })
  ];
  
  const allNodes = [...defaultNodes, ...nodes.map(n => createTestNode(n))];
  
  for (const node of allNodes) {
    nodeRepository.saveNode(node);
  }
  
  return allNodes;
}

/**
 * Seeds test templates into the database
 */
export async function seedTestTemplates(
  templateRepository: TemplateRepository,
  templates: Partial<TemplateWorkflow>[] = []
): Promise<TemplateWorkflow[]> {
  const defaultTemplates: TemplateWorkflow[] = [
    createTestTemplate({
      id: 1,
      name: 'Simple HTTP Workflow',
      description: 'Basic HTTP request workflow',
      nodes: [{ id: 1, name: 'HTTP Request', icon: 'http' }]
    }),
    createTestTemplate({
      id: 2,
      name: 'Webhook to Slack',
      description: 'Webhook that sends to Slack',
      nodes: [
        { id: 1, name: 'Webhook', icon: 'webhook' },
        { id: 2, name: 'Slack', icon: 'slack' }
      ]
    })
  ];
  
  const allTemplates = [...defaultTemplates, ...templates.map(t => createTestTemplate(t))];
  
  for (const template of allTemplates) {
    // Convert to TemplateDetail format for saving
    const detail: TemplateDetail = {
      id: template.id,
      name: template.name,
      description: template.description,
      views: template.totalViews,
      createdAt: template.createdAt,
      workflow: { 
        nodes: template.nodes?.map((n, i) => ({
          id: `node_${i}`,
          name: n.name,
          type: `n8n-nodes-base.${n.name.toLowerCase()}`,
          position: [250 + i * 200, 300],
          parameters: {}
        })) || [],
        connections: {},
        settings: {}
      }
    };
    await templateRepository.saveTemplate(template, detail);
  }
  
  return allTemplates;
}

/**
 * Creates a test node with defaults
 */
export function createTestNode(overrides: Partial<ParsedNode> = {}): ParsedNode {
  return {
    style: 'programmatic',
    nodeType: 'nodes-base.test',
    displayName: 'Test Node',
    description: 'A test node',
    category: 'Test',
    properties: [],
    credentials: [],
    isAITool: false,
    isTrigger: false,
    isWebhook: false,
    operations: [],
    version: '1',
    isVersioned: false,
    packageName: 'n8n-nodes-base',
    documentation: undefined,
    ...overrides
  };
}

/**
 * Creates a test template with defaults
 */
export function createTestTemplate(overrides: Partial<TemplateWorkflow> = {}): TemplateWorkflow {
  const id = overrides.id || Math.floor(Math.random() * 10000);
  return {
    id,
    name: `Test Template ${id}`,
    description: 'A test template',
    nodes: overrides.nodes || [],
    user: overrides.user || {
      id: 1,
      name: 'Test User',
      username: 'testuser',
      verified: false
    },
    createdAt: overrides.createdAt || new Date().toISOString(),
    totalViews: overrides.totalViews || 0,
    ...overrides
  };
}

/**
 * Resets database to clean state
 */
export async function resetDatabase(adapter: DatabaseAdapter): Promise<void> {
  // Drop all tables
  adapter.exec(`
    DROP TABLE IF EXISTS templates_fts;
    DROP TABLE IF EXISTS templates;
    DROP TABLE IF EXISTS nodes;
  `);
  
  // Reinitialize schema
  await initializeDatabaseSchema(adapter);
}

/**
 * Creates a database snapshot
 */
export async function createDatabaseSnapshot(adapter: DatabaseAdapter): Promise<DatabaseSnapshot> {
  const nodes = adapter.prepare('SELECT * FROM nodes').all();
  const templates = adapter.prepare('SELECT * FROM templates').all();
  
  return {
    nodes,
    templates,
    metadata: {
      createdAt: new Date().toISOString(),
      nodeCount: nodes.length,
      templateCount: templates.length
    }
  };
}

/**
 * Restores database from snapshot
 */
export async function restoreDatabaseSnapshot(
  adapter: DatabaseAdapter, 
  snapshot: DatabaseSnapshot
): Promise<void> {
  // Reset database first
  await resetDatabase(adapter);
  
  // Restore nodes
  const nodeStmt = adapter.prepare(`
    INSERT INTO nodes (
      node_type, package_name, display_name, description,
      category, development_style, is_ai_tool, is_trigger,
      is_webhook, is_versioned, version, documentation,
      properties_schema, operations, credentials_required
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const node of snapshot.nodes) {
    nodeStmt.run(
      node.node_type,
      node.package_name,
      node.display_name,
      node.description,
      node.category,
      node.development_style,
      node.is_ai_tool,
      node.is_trigger,
      node.is_webhook,
      node.is_versioned,
      node.version,
      node.documentation,
      node.properties_schema,
      node.operations,
      node.credentials_required
    );
  }
  
  // Restore templates
  const templateStmt = adapter.prepare(`
    INSERT INTO templates (
      id, workflow_id, name, description,
      author_name, author_username, author_verified,
      nodes_used, workflow_json, categories,
      views, created_at, updated_at, url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const template of snapshot.templates) {
    templateStmt.run(
      template.id,
      template.workflow_id,
      template.name,
      template.description,
      template.author_name,
      template.author_username,
      template.author_verified,
      template.nodes_used,
      template.workflow_json,
      template.categories,
      template.views,
      template.created_at,
      template.updated_at,
      template.url
    );
  }
}

/**
 * Loads JSON fixtures into database
 */
export async function loadFixtures(
  adapter: DatabaseAdapter,
  fixturePath: string
): Promise<void> {
  const fixtures = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
  
  if (fixtures.nodes) {
    const nodeRepo = new NodeRepository(adapter);
    for (const node of fixtures.nodes) {
      nodeRepo.saveNode(node);
    }
  }
  
  if (fixtures.templates) {
    const templateRepo = new TemplateRepository(adapter);
    for (const template of fixtures.templates) {
      // Convert to proper format
      const detail: TemplateDetail = {
        id: template.id,
        name: template.name,
        description: template.description,
        views: template.views || template.totalViews || 0,
        createdAt: template.createdAt,
        workflow: template.workflow || {
          nodes: template.nodes?.map((n: any, i: number) => ({
            id: `node_${i}`,
            name: n.name,
            type: `n8n-nodes-base.${n.name.toLowerCase()}`,
            position: [250 + i * 200, 300],
            parameters: {}
          })) || [],
          connections: {},
          settings: {}
        }
      };
      await templateRepo.saveTemplate(template, detail);
    }
  }
}

/**
 * Database test helpers for common operations
 */
export const dbHelpers = {
  /**
   * Counts rows in a table
   */
  countRows(adapter: DatabaseAdapter, table: string): number {
    const result = adapter.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
    return result.count;
  },
  
  /**
   * Checks if a node exists
   */
  nodeExists(adapter: DatabaseAdapter, nodeType: string): boolean {
    const result = adapter.prepare('SELECT 1 FROM nodes WHERE node_type = ?').get(nodeType);
    return !!result;
  },
  
  /**
   * Gets all node types
   */
  getAllNodeTypes(adapter: DatabaseAdapter): string[] {
    const rows = adapter.prepare('SELECT node_type FROM nodes').all() as { node_type: string }[];
    return rows.map(r => r.node_type);
  },
  
  /**
   * Clears a specific table
   */
  clearTable(adapter: DatabaseAdapter, table: string): void {
    adapter.exec(`DELETE FROM ${table}`);
  },
  
  /**
   * Executes raw SQL
   */
  executeSql(adapter: DatabaseAdapter, sql: string): void {
    adapter.exec(sql);
  }
};

/**
 * Creates a mock database adapter for unit tests
 */
export function createMockDatabaseAdapter(): DatabaseAdapter {
  const mockDb = {
    prepare: vi.fn(),
    exec: vi.fn(),
    close: vi.fn(),
    pragma: vi.fn(),
    inTransaction: false,
    transaction: vi.fn((fn) => fn()),
    checkFTS5Support: vi.fn(() => false)
  };
  
  return mockDb as unknown as DatabaseAdapter;
}

/**
 * Transaction test helper
 * Note: better-sqlite3 transactions are synchronous
 */
export async function withTransaction<T>(
  adapter: DatabaseAdapter,
  fn: () => Promise<T>
): Promise<T | null> {
  try {
    adapter.exec('BEGIN');
    const result = await fn();
    // Always rollback for testing
    adapter.exec('ROLLBACK');
    return null; // Indicate rollback happened
  } catch (error) {
    adapter.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Performance test helper
 */
export async function measureDatabaseOperation(
  name: string,
  operation: () => Promise<void>
): Promise<number> {
  const start = performance.now();
  await operation();
  const duration = performance.now() - start;
  console.log(`[DB Performance] ${name}: ${duration.toFixed(2)}ms`);
  return duration;
}