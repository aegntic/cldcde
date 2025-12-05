/**
 * SQLiteStorageService - A simple wrapper around DatabaseAdapter for benchmarks
 */
import { DatabaseAdapter, createDatabaseAdapter } from '../database/database-adapter';

export class SQLiteStorageService {
  private adapter: DatabaseAdapter | null = null;
  private dbPath: string;

  constructor(dbPath: string = ':memory:') {
    this.dbPath = dbPath;
    this.initSync();
  }

  private initSync() {
    // For benchmarks, we'll use synchronous initialization
    // In real usage, this should be async
    const Database = require('better-sqlite3');
    const db = new Database(this.dbPath);
    
    // Create a simple adapter
    this.adapter = {
      prepare: (sql: string) => db.prepare(sql),
      exec: (sql: string) => db.exec(sql),
      close: () => db.close(),
      pragma: (key: string, value?: any) => db.pragma(`${key}${value !== undefined ? ` = ${value}` : ''}`),
      inTransaction: db.inTransaction,
      transaction: (fn: () => any) => db.transaction(fn)(),
      checkFTS5Support: () => {
        try {
          db.exec("CREATE VIRTUAL TABLE test_fts USING fts5(content)");
          db.exec("DROP TABLE test_fts");
          return true;
        } catch {
          return false;
        }
      }
    };
    
    // Initialize schema
    this.initializeSchema();
  }
  
  private initializeSchema() {
    const schema = `
      CREATE TABLE IF NOT EXISTS nodes (
        node_type TEXT PRIMARY KEY,
        package_name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        development_style TEXT CHECK(development_style IN ('declarative', 'programmatic')),
        is_ai_tool INTEGER DEFAULT 0,
        is_trigger INTEGER DEFAULT 0,
        is_webhook INTEGER DEFAULT 0,
        is_versioned INTEGER DEFAULT 0,
        version TEXT,
        documentation TEXT,
        properties_schema TEXT,
        operations TEXT,
        credentials_required TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_package ON nodes(package_name);
      CREATE INDEX IF NOT EXISTS idx_ai_tool ON nodes(is_ai_tool);
      CREATE INDEX IF NOT EXISTS idx_category ON nodes(category);
    `;
    
    this.adapter!.exec(schema);
  }

  get db(): DatabaseAdapter {
    if (!this.adapter) {
      throw new Error('Database not initialized');
    }
    return this.adapter;
  }

  close() {
    if (this.adapter) {
      this.adapter.close();
      this.adapter = null;
    }
  }
}