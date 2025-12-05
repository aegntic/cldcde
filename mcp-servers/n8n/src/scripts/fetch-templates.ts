#!/usr/bin/env node
import { createDatabaseAdapter } from '../database/database-adapter';
import { TemplateService } from '../templates/template-service';
import * as fs from 'fs';
import * as path from 'path';

async function fetchTemplates() {
  console.log('🌐 Fetching n8n workflow templates...\n');
  
  // Ensure data directory exists
  const dataDir = './data';
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Initialize database
  const db = await createDatabaseAdapter('./data/nodes.db');
  
  // Drop existing templates table to ensure clean schema
  try {
    db.exec('DROP TABLE IF EXISTS templates');
    db.exec('DROP TABLE IF EXISTS templates_fts');
    console.log('🗑️  Dropped existing templates tables\n');
  } catch (error) {
    // Ignore errors if tables don't exist
  }
  
  // Apply schema with updated constraint
  const schema = fs.readFileSync(path.join(__dirname, '../../src/database/schema.sql'), 'utf8');
  db.exec(schema);
  
  // Pre-create FTS5 tables if supported
  const hasFTS5 = db.checkFTS5Support();
  if (hasFTS5) {
    console.log('🔍  Creating FTS5 tables for template search...');
    try {
      // Create FTS5 virtual table
      db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS templates_fts USING fts5(
          name, description, content=templates
        );
      `);
      
      // Create triggers to keep FTS5 in sync
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
      
      console.log('✅  FTS5 tables created successfully\n');
    } catch (error) {
      console.log('⚠️  Failed to create FTS5 tables:', error);
      console.log('   Template search will use LIKE fallback\n');
    }
  } else {
    console.log('ℹ️  FTS5 not supported in this SQLite build');
    console.log('   Template search will use LIKE queries\n');
  }
  
  // Create service
  const service = new TemplateService(db);
  
  // Progress tracking
  let lastMessage = '';
  const startTime = Date.now();
  
  try {
    await service.fetchAndUpdateTemplates((message, current, total) => {
      // Clear previous line
      if (lastMessage) {
        process.stdout.write('\r' + ' '.repeat(lastMessage.length) + '\r');
      }
      
      const progress = Math.round((current / total) * 100);
      lastMessage = `📊 ${message}: ${current}/${total} (${progress}%)`;
      process.stdout.write(lastMessage);
    });
    
    console.log('\n'); // New line after progress
    
    // Get stats
    const stats = await service.getTemplateStats();
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    
    console.log('✅ Template fetch complete!\n');
    console.log('📈 Statistics:');
    console.log(`   - Total templates: ${stats.totalTemplates}`);
    console.log(`   - Average views: ${stats.averageViews}`);
    console.log(`   - Time elapsed: ${elapsed} seconds`);
    console.log('\n🔝 Top used nodes:');
    
    stats.topUsedNodes.forEach((node: any, index: number) => {
      console.log(`   ${index + 1}. ${node.node} (${node.count} templates)`);
    });
    
  } catch (error) {
    console.error('\n❌ Error fetching templates:', error);
    process.exit(1);
  }
  
  // Close database
  if ('close' in db && typeof db.close === 'function') {
    db.close();
  }
}

// Run if called directly
if (require.main === module) {
  fetchTemplates().catch(console.error);
}

export { fetchTemplates };