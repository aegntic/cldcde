#!/usr/bin/env node

import { N8NDocumentationMCPServer } from '../src/mcp/server';

interface SearchTest {
  query: string;
  mode?: 'OR' | 'AND' | 'FUZZY';
  description: string;
  expectedTop?: string[];
}

async function testFTS5Search() {
  console.log('Testing FTS5 Search Implementation\n');
  console.log('='.repeat(50));
  
  const server = new N8NDocumentationMCPServer();
  
  // Wait for initialization
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const tests: SearchTest[] = [
    {
      query: 'webhook',
      description: 'Basic search - should return Webhook node first',
      expectedTop: ['nodes-base.webhook']
    },
    {
      query: 'http call',
      description: 'Multi-word OR search - should return HTTP Request node first',
      expectedTop: ['nodes-base.httpRequest']
    },
    {
      query: 'send message',
      mode: 'AND',
      description: 'AND mode - only nodes with both "send" AND "message"',
    },
    {
      query: 'slak',
      mode: 'FUZZY',
      description: 'FUZZY mode - should find Slack despite typo',
      expectedTop: ['nodes-base.slack']
    },
    {
      query: '"email trigger"',
      description: 'Exact phrase search with quotes',
    },
    {
      query: 'http',
      mode: 'FUZZY',
      description: 'FUZZY mode with common term',
      expectedTop: ['nodes-base.httpRequest']
    },
    {
      query: 'google sheets',
      mode: 'AND',
      description: 'AND mode - find Google Sheets node',
      expectedTop: ['nodes-base.googleSheets']
    },
    {
      query: 'webhook trigger',
      mode: 'OR',
      description: 'OR mode - should return nodes with either word',
    }
  ];
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const test of tests) {
    console.log(`\n${test.description}`);
    console.log(`Query: "${test.query}" (Mode: ${test.mode || 'OR'})`);
    console.log('-'.repeat(40));
    
    try {
      const results = await server.executeTool('search_nodes', {
        query: test.query,
        mode: test.mode,
        limit: 5
      });
      
      if (!results.results || results.results.length === 0) {
        console.log('❌ No results found');
        if (test.expectedTop) {
          failedTests++;
        }
        continue;
      }
      
      console.log(`Found ${results.results.length} results:`);
      results.results.forEach((node: any, index: number) => {
        const marker = test.expectedTop && index === 0 && test.expectedTop.includes(node.nodeType) ? ' ✅' : '';
        console.log(`  ${index + 1}. ${node.nodeType} - ${node.displayName}${marker}`);
      });
      
      // Verify search mode is returned
      if (results.mode) {
        console.log(`\nSearch mode used: ${results.mode}`);
      }
      
      // Check expected results
      if (test.expectedTop) {
        const firstResult = results.results[0];
        if (test.expectedTop.includes(firstResult.nodeType)) {
          console.log('✅ Test passed: Expected node found at top');
          passedTests++;
        } else {
          console.log('❌ Test failed: Expected node not at top');
          console.log(`   Expected: ${test.expectedTop.join(' or ')}`);
          console.log(`   Got: ${firstResult.nodeType}`);
          failedTests++;
        }
      } else {
        // Test without specific expectations
        console.log('✅ Search completed successfully');
        passedTests++;
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error}`);
      failedTests++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('FTS5 Feature Tests');
  console.log('='.repeat(50));
  
  // Test FTS5-specific features
  console.log('\n1. Testing relevance ranking...');
  const webhookResult = await server.executeTool('search_nodes', {
    query: 'webhook',
    limit: 10
  });
  console.log(`   Primary "Webhook" node position: #${webhookResult.results.findIndex((r: any) => r.nodeType === 'nodes-base.webhook') + 1}`);
  
  console.log('\n2. Testing fuzzy matching with various typos...');
  const typoTests = ['webook', 'htpp', 'slck', 'googl sheet'];
  for (const typo of typoTests) {
    const result = await server.executeTool('search_nodes', {
      query: typo,
      mode: 'FUZZY',
      limit: 1
    });
    if (result.results.length > 0) {
      console.log(`   "${typo}" → ${result.results[0].displayName} ✅`);
    } else {
      console.log(`   "${typo}" → No results ❌`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`Test Summary: ${passedTests} passed, ${failedTests} failed`);
  console.log('='.repeat(50));
  
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
testFTS5Search().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});