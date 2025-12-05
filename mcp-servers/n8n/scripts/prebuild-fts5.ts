#!/usr/bin/env npx tsx
/**
 * Pre-build FTS5 indexes for the database
 * This ensures FTS5 tables are created before the database is deployed to Docker
 */
import { createDatabaseAdapter } from '../src/database/database-adapter';
import { logger } from '../src/utils/logger';
import * as fs from 'fs';

async function prebuildFTS5() {
  console.log('🔍 Pre-building FTS5 indexes...\n');
  
  const dbPath = './data/nodes.db';
  
  if (!fs.existsSync(dbPath)) {
    console.error('❌ Database not found at', dbPath);
    console.error('   Please run npm run rebuild first');
    process.exit(1);
  }
  
  const db = await createDatabaseAdapter(dbPath);
  
  // Check FTS5 support
  const hasFTS5 = db.checkFTS5Support();
  
  if (!hasFTS5) {
    console.log('ℹ️  FTS5 not supported in this SQLite build');
    console.log('   Skipping FTS5 pre-build');
    db.close();
    return;
  }
  
  console.log('✅ FTS5 is supported');
  
  try {
    // Create FTS5 virtual table for templates
    console.log('\n📋 Creating FTS5 table for templates...');
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS templates_fts USING fts5(
        name, description, content=templates
      );
    `);
    
    // Create triggers to keep FTS5 in sync
    console.log('🔗 Creating synchronization triggers...');
    
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS templates_ai AFTER INSERT ON templates BEGIN
        INSERT INTO templates_fts(rowid, name, description)
        VALUES (new.id, new.name, new.description);
      END;
    `);
    
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS templates_au AFTER UPDATE ON templates BEGIN
        UPDATE templates_fts SET name = new.name, description = new.description
        WHERE rowid = new.id;
      END;
    `);
    
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS templates_ad AFTER DELETE ON templates BEGIN
        DELETE FROM templates_fts WHERE rowid = old.id;
      END;
    `);
    
    // Rebuild FTS5 index from existing data
    console.log('🔄 Rebuilding FTS5 index from existing templates...');
    
    // Clear existing FTS data
    db.exec('DELETE FROM templates_fts');
    
    // Repopulate from templates table
    db.exec(`
      INSERT INTO templates_fts(rowid, name, description)
      SELECT id, name, description FROM templates
    `);
    
    // Get counts
    const templateCount = db.prepare('SELECT COUNT(*) as count FROM templates').get() as { count: number };
    const ftsCount = db.prepare('SELECT COUNT(*) as count FROM templates_fts').get() as { count: number };
    
    console.log(`\n✅ FTS5 pre-build complete!`);
    console.log(`   Templates: ${templateCount.count}`);
    console.log(`   FTS5 entries: ${ftsCount.count}`);
    
    // Test FTS5 search
    console.log('\n🧪 Testing FTS5 search...');
    const testResults = db.prepare(`
      SELECT COUNT(*) as count FROM templates t
      JOIN templates_fts ON t.id = templates_fts.rowid
      WHERE templates_fts MATCH 'webhook'
    `).get() as { count: number };
    
    console.log(`   Found ${testResults.count} templates matching "webhook"`);
    
  } catch (error) {
    console.error('❌ Error pre-building FTS5:', error);
    process.exit(1);
  }
  
  db.close();
  console.log('\n✅ Database is ready for Docker deployment!');
}

// Run if called directly
if (require.main === module) {
  prebuildFTS5().catch(console.error);
}

export { prebuildFTS5 };