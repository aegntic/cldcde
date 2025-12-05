#!/usr/bin/env node
/**
 * Test script to verify trigger detection works with sql.js adapter
 */

import { createDatabaseAdapter } from '../src/database/database-adapter';
import { NodeRepository } from '../src/database/node-repository';
import { logger } from '../src/utils/logger';
import path from 'path';

async function testSqlJsTriggers() {
  logger.info('🧪 Testing trigger detection with sql.js adapter...\n');
  
  try {
    // Force sql.js by temporarily renaming better-sqlite3
    const originalRequire = require.cache[require.resolve('better-sqlite3')];
    if (originalRequire) {
      delete require.cache[require.resolve('better-sqlite3')];
    }
    
    // Mock better-sqlite3 to force sql.js usage
    const Module = require('module');
    const originalResolveFilename = Module._resolveFilename;
    Module._resolveFilename = function(request: string, parent: any, isMain: boolean) {
      if (request === 'better-sqlite3') {
        throw new Error('Forcing sql.js adapter for testing');
      }
      return originalResolveFilename.apply(this, arguments);
    };
    
    // Now create adapter - should use sql.js
    const dbPath = path.join(process.cwd(), 'data', 'nodes.db');
    logger.info(`📁 Database path: ${dbPath}`);
    
    const adapter = await createDatabaseAdapter(dbPath);
    logger.info('✅ Adapter created (should be sql.js)\n');
    
    // Test direct query
    logger.info('📊 Testing direct database query:');
    const triggerNodes = ['nodes-base.webhook', 'nodes-base.cron', 'nodes-base.interval', 'nodes-base.emailReadImap'];
    
    for (const nodeType of triggerNodes) {
      const row = adapter.prepare('SELECT * FROM nodes WHERE node_type = ?').get(nodeType);
      if (row) {
        logger.info(`${nodeType}:`);
        logger.info(`  is_trigger raw value: ${row.is_trigger} (type: ${typeof row.is_trigger})`);
        logger.info(`  !!is_trigger: ${!!row.is_trigger}`);
        logger.info(`  Number(is_trigger) === 1: ${Number(row.is_trigger) === 1}`);
      }
    }
    
    // Test through repository
    logger.info('\n📦 Testing through NodeRepository:');
    const repository = new NodeRepository(adapter);
    
    for (const nodeType of triggerNodes) {
      const node = repository.getNode(nodeType);
      if (node) {
        logger.info(`${nodeType}: isTrigger = ${node.isTrigger}`);
      }
    }
    
    // Test list query
    logger.info('\n📋 Testing list query:');
    const allTriggers = adapter.prepare(
      'SELECT node_type, is_trigger FROM nodes WHERE node_type IN (?, ?, ?, ?)'
    ).all(...triggerNodes);
    
    for (const node of allTriggers) {
      logger.info(`${node.node_type}: is_trigger = ${node.is_trigger} (type: ${typeof node.is_trigger})`);
    }
    
    adapter.close();
    logger.info('\n✅ Test complete!');
    
    // Restore original require
    Module._resolveFilename = originalResolveFilename;
    
  } catch (error) {
    logger.error('Test failed:', error);
    process.exit(1);
  }
}

// Run test
testSqlJsTriggers().catch(console.error);