#!/usr/bin/env node
/**
 * Copyright (c) 2024 AiAdvisors Romuald Czlonkowski
 * Licensed under the Sustainable Use License v1.0
 */
import { createDatabaseAdapter } from '../database/database-adapter';
import { N8nNodeLoader } from '../loaders/node-loader';
import { NodeParser, ParsedNode } from '../parsers/node-parser';
import { DocsMapper } from '../mappers/docs-mapper';
import { NodeRepository } from '../database/node-repository';
import { TemplateSanitizer } from '../utils/template-sanitizer';
import * as fs from 'fs';
import * as path from 'path';

async function rebuild() {
  console.log('🔄 Rebuilding n8n node database...\n');
  
  const dbPath = process.env.NODE_DB_PATH || './data/nodes.db';
  const db = await createDatabaseAdapter(dbPath);
  const loader = new N8nNodeLoader();
  const parser = new NodeParser();
  const mapper = new DocsMapper();
  const repository = new NodeRepository(db);
  
  // Initialize database
  const schema = fs.readFileSync(path.join(__dirname, '../../src/database/schema.sql'), 'utf8');
  db.exec(schema);
  
  // Clear existing data
  db.exec('DELETE FROM nodes');
  console.log('🗑️  Cleared existing data\n');
  
  // Load all nodes
  const nodes = await loader.loadAllNodes();
  console.log(`📦 Loaded ${nodes.length} nodes from packages\n`);
  
  // Statistics
  const stats = {
    successful: 0,
    failed: 0,
    aiTools: 0,
    triggers: 0,
    webhooks: 0,
    withProperties: 0,
    withOperations: 0,
    withDocs: 0
  };
  
  // Process each node (documentation fetching must be outside transaction due to async)
  console.log('🔄 Processing nodes...');
  const processedNodes: Array<{ parsed: ParsedNode; docs: string | undefined; nodeName: string }> = [];
  
  for (const { packageName, nodeName, NodeClass } of nodes) {
    try {
      // Parse node
      const parsed = parser.parse(NodeClass, packageName);
      
      // Validate parsed data
      if (!parsed.nodeType || !parsed.displayName) {
        throw new Error(`Missing required fields - nodeType: ${parsed.nodeType}, displayName: ${parsed.displayName}, packageName: ${parsed.packageName}`);
      }
      
      // Additional validation for required fields
      if (!parsed.packageName) {
        throw new Error(`Missing packageName for node ${nodeName}`);
      }
      
      // Get documentation
      const docs = await mapper.fetchDocumentation(parsed.nodeType);
      parsed.documentation = docs || undefined;
      
      processedNodes.push({ parsed, docs: docs || undefined, nodeName });
    } catch (error) {
      stats.failed++;
      const errorMessage = (error as Error).message;
      console.error(`❌ Failed to process ${nodeName}: ${errorMessage}`);
    }
  }
  
  // Now save all processed nodes to database
  console.log(`\n💾 Saving ${processedNodes.length} processed nodes to database...`);
  
  let saved = 0;
  for (const { parsed, docs, nodeName } of processedNodes) {
    try {
      repository.saveNode(parsed);
      saved++;
      
      // Update statistics
      stats.successful++;
      if (parsed.isAITool) stats.aiTools++;
      if (parsed.isTrigger) stats.triggers++;
      if (parsed.isWebhook) stats.webhooks++;
      if (parsed.properties.length > 0) stats.withProperties++;
      if (parsed.operations.length > 0) stats.withOperations++;
      if (docs) stats.withDocs++;
      
      console.log(`✅ ${parsed.nodeType} [Props: ${parsed.properties.length}, Ops: ${parsed.operations.length}]`);
    } catch (error) {
      stats.failed++;
      const errorMessage = (error as Error).message;
      console.error(`❌ Failed to save ${nodeName}: ${errorMessage}`);
    }
  }
  
  console.log(`💾 Save completed: ${saved} nodes saved successfully`);
  
  // Validation check
  console.log('\n🔍 Running validation checks...');
  try {
    const validationResults = validateDatabase(repository);
    
    if (!validationResults.passed) {
      console.log('⚠️  Validation Issues:');
      validationResults.issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('✅ All validation checks passed');
    }
  } catch (validationError) {
    console.error('❌ Validation failed:', (validationError as Error).message);
    console.log('⚠️  Skipping validation due to database compatibility issues');
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`   Total nodes: ${nodes.length}`);
  console.log(`   Successful: ${stats.successful}`);
  console.log(`   Failed: ${stats.failed}`);
  console.log(`   AI Tools: ${stats.aiTools}`);
  console.log(`   Triggers: ${stats.triggers}`);
  console.log(`   Webhooks: ${stats.webhooks}`);
  console.log(`   With Properties: ${stats.withProperties}`);
  console.log(`   With Operations: ${stats.withOperations}`);
  console.log(`   With Documentation: ${stats.withDocs}`);
  
  // Sanitize templates if they exist
  console.log('\n🧹 Checking for templates to sanitize...');
  const templateCount = db.prepare('SELECT COUNT(*) as count FROM templates').get() as { count: number };
  
  if (templateCount && templateCount.count > 0) {
    console.log(`   Found ${templateCount.count} templates, sanitizing...`);
    const sanitizer = new TemplateSanitizer();
    let sanitizedCount = 0;
    
    const templates = db.prepare('SELECT id, name, workflow_json FROM templates').all() as any[];
    for (const template of templates) {
      const originalWorkflow = JSON.parse(template.workflow_json);
      const { sanitized: sanitizedWorkflow, wasModified } = sanitizer.sanitizeWorkflow(originalWorkflow);
      
      if (wasModified) {
        const stmt = db.prepare('UPDATE templates SET workflow_json = ? WHERE id = ?');
        stmt.run(JSON.stringify(sanitizedWorkflow), template.id);
        sanitizedCount++;
        console.log(`   ✅ Sanitized template ${template.id}: ${template.name}`);
      }
    }
    
    console.log(`   Sanitization complete: ${sanitizedCount} templates cleaned`);
  } else {
    console.log('   No templates found in database');
  }
  
  console.log('\n✨ Rebuild complete!');
  
  db.close();
}

function validateDatabase(repository: NodeRepository): { passed: boolean; issues: string[] } {
  const issues = [];
  
  // Check critical nodes
  const criticalNodes = ['nodes-base.httpRequest', 'nodes-base.code', 'nodes-base.webhook', 'nodes-base.slack'];
  
  for (const nodeType of criticalNodes) {
    const node = repository.getNode(nodeType);
    
    if (!node) {
      issues.push(`Critical node ${nodeType} not found`);
      continue;
    }
    
    if (node.properties.length === 0) {
      issues.push(`Node ${nodeType} has no properties`);
    }
  }
  
  // Check AI tools
  const aiTools = repository.getAITools();
  if (aiTools.length === 0) {
    issues.push('No AI tools found - check detection logic');
  }
  
  return {
    passed: issues.length === 0,
    issues
  };
}

// Run if called directly
if (require.main === module) {
  rebuild().catch(console.error);
}