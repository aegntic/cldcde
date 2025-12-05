#!/usr/bin/env node

import * as path from 'path';
import { createDatabaseAdapter } from '../src/database/database-adapter';
import { logger } from '../src/utils/logger';

/**
 * Migrate existing database to add FTS5 support for nodes
 */
async function migrateNodesFTS() {
  logger.info('Starting nodes FTS5 migration...');
  
  const dbPath = path.join(process.cwd(), 'data', 'nodes.db');
  const db = await createDatabaseAdapter(dbPath);
  
  try {
    // Check if nodes_fts already exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='nodes_fts'
    `).get();
    
    if (tableExists) {
      logger.info('nodes_fts table already exists, skipping migration');
      return;
    }
    
    logger.info('Creating nodes_fts virtual table...');
    
    // Create the FTS5 virtual table
    db.prepare(`
      CREATE VIRTUAL TABLE IF NOT EXISTS nodes_fts USING fts5(
        node_type,
        display_name,
        description,
        documentation,
        operations,
        content=nodes,
        content_rowid=rowid,
        tokenize='porter'
      )
    `).run();
    
    // Populate the FTS table with existing data
    logger.info('Populating nodes_fts with existing data...');
    
    const nodes = db.prepare('SELECT rowid, * FROM nodes').all() as any[];
    logger.info(`Migrating ${nodes.length} nodes to FTS index...`);
    
    const insertStmt = db.prepare(`
      INSERT INTO nodes_fts(rowid, node_type, display_name, description, documentation, operations)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const node of nodes) {
      insertStmt.run(
        node.rowid,
        node.node_type,
        node.display_name,
        node.description || '',
        node.documentation || '',
        node.operations || ''
      );
    }
    
    // Create triggers to keep FTS in sync
    logger.info('Creating synchronization triggers...');
    
    db.prepare(`
      CREATE TRIGGER IF NOT EXISTS nodes_fts_insert AFTER INSERT ON nodes
      BEGIN
        INSERT INTO nodes_fts(rowid, node_type, display_name, description, documentation, operations)
        VALUES (new.rowid, new.node_type, new.display_name, new.description, new.documentation, new.operations);
      END
    `).run();
    
    db.prepare(`
      CREATE TRIGGER IF NOT EXISTS nodes_fts_update AFTER UPDATE ON nodes
      BEGIN
        UPDATE nodes_fts 
        SET node_type = new.node_type,
            display_name = new.display_name,
            description = new.description,
            documentation = new.documentation,
            operations = new.operations
        WHERE rowid = new.rowid;
      END
    `).run();
    
    db.prepare(`
      CREATE TRIGGER IF NOT EXISTS nodes_fts_delete AFTER DELETE ON nodes
      BEGIN
        DELETE FROM nodes_fts WHERE rowid = old.rowid;
      END
    `).run();
    
    // Test the FTS search
    logger.info('Testing FTS search...');
    
    const testResults = db.prepare(`
      SELECT n.* FROM nodes n
      JOIN nodes_fts ON n.rowid = nodes_fts.rowid
      WHERE nodes_fts MATCH 'webhook'
      ORDER BY rank
      LIMIT 5
    `).all();
    
    logger.info(`FTS test search found ${testResults.length} results for 'webhook'`);
    
    // Persist if using sql.js
    if ('persist' in db) {
      logger.info('Persisting database changes...');
      (db as any).persist();
    }
    
    logger.info('✅ FTS5 migration completed successfully!');
    
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run migration
migrateNodesFTS().catch(error => {
  logger.error('Migration error:', error);
  process.exit(1);
});