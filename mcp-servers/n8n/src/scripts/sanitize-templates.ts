#!/usr/bin/env node
import { createDatabaseAdapter } from '../database/database-adapter';
import { logger } from '../utils/logger';
import { TemplateSanitizer } from '../utils/template-sanitizer';

async function sanitizeTemplates() {
  console.log('🧹 Sanitizing workflow templates in database...\n');
  
  const db = await createDatabaseAdapter('./data/nodes.db');
  const sanitizer = new TemplateSanitizer();
  
  try {
    // Get all templates
    const templates = db.prepare('SELECT id, name, workflow_json FROM templates').all() as any[];
    console.log(`Found ${templates.length} templates to check\n`);
    
    let sanitizedCount = 0;
    const problematicTemplates: any[] = [];
    
    for (const template of templates) {
      const originalWorkflow = JSON.parse(template.workflow_json);
      const { sanitized: sanitizedWorkflow, wasModified } = sanitizer.sanitizeWorkflow(originalWorkflow);
      
      if (wasModified) {
        // Get detected tokens for reporting
        const detectedTokens = sanitizer.detectTokens(originalWorkflow);
        
        // Update the template with sanitized version
        const stmt = db.prepare('UPDATE templates SET workflow_json = ? WHERE id = ?');
        stmt.run(JSON.stringify(sanitizedWorkflow), template.id);
        
        sanitizedCount++;
        problematicTemplates.push({
          id: template.id,
          name: template.name,
          tokens: detectedTokens
        });
        
        console.log(`✅ Sanitized template ${template.id}: ${template.name}`);
        detectedTokens.forEach(token => {
          console.log(`   - Found: ${token.substring(0, 20)}...`);
        });
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total templates: ${templates.length}`);
    console.log(`   Sanitized: ${sanitizedCount}`);
    
    if (problematicTemplates.length > 0) {
      console.log(`\n⚠️  Templates that contained API tokens:`);
      problematicTemplates.forEach(t => {
        console.log(`   - ${t.id}: ${t.name}`);
      });
    }
    
    console.log('\n✨ Sanitization complete!');
  } catch (error) {
    console.error('❌ Error sanitizing templates:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run if called directly
if (require.main === module) {
  sanitizeTemplates().catch(console.error);
}