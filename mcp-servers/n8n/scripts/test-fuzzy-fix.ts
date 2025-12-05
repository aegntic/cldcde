#!/usr/bin/env node

import { N8NDocumentationMCPServer } from '../src/mcp/server';

async function testFuzzyFix() {
  console.log('Testing FUZZY mode fix...\n');
  
  const server = new N8NDocumentationMCPServer();
  
  // Wait for initialization
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 1: FUZZY mode with typo
  console.log('Test 1: FUZZY mode with "slak" (typo for "slack")');
  const fuzzyResult = await server.executeTool('search_nodes', {
    query: 'slak',
    mode: 'FUZZY',
    limit: 5
  });
  
  console.log(`Results: ${fuzzyResult.results.length} found`);
  if (fuzzyResult.results.length > 0) {
    console.log('✅ FUZZY mode now finds results!');
    fuzzyResult.results.forEach((node: any, i: number) => {
      console.log(`  ${i + 1}. ${node.nodeType} - ${node.displayName}`);
    });
  } else {
    console.log('❌ FUZZY mode still not working');
  }
  
  // Test 2: AND mode with explanation
  console.log('\n\nTest 2: AND mode with "send message"');
  const andResult = await server.executeTool('search_nodes', {
    query: 'send message',
    mode: 'AND',
    limit: 5
  });
  
  console.log(`Results: ${andResult.results.length} found`);
  if (andResult.searchInfo) {
    console.log('✅ AND mode now includes search info:');
    console.log(`   ${andResult.searchInfo.message}`);
    console.log(`   Tip: ${andResult.searchInfo.tip}`);
  }
  
  console.log('\nFirst 5 results:');
  andResult.results.slice(0, 5).forEach((node: any, i: number) => {
    console.log(`  ${i + 1}. ${node.nodeType} - ${node.displayName}`);
  });
  
  // Test 3: More typos
  console.log('\n\nTest 3: More FUZZY tests');
  const typos = ['htpp', 'webook', 'slck', 'emial'];
  
  for (const typo of typos) {
    const result = await server.executeTool('search_nodes', {
      query: typo,
      mode: 'FUZZY',
      limit: 1
    });
    
    if (result.results.length > 0) {
      console.log(`✅ "${typo}" → ${result.results[0].displayName}`);
    } else {
      console.log(`❌ "${typo}" → No results`);
    }
  }
  
  process.exit(0);
}

// Run tests
testFuzzyFix().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});