#!/usr/bin/env node

import { N8NDocumentationMCPServer } from '../src/mcp/server';

interface SearchTestCase {
  query: string;
  expectedTop: string[];
  description: string;
}

async function testSearchImprovements() {
  console.log('Testing search improvements...\n');
  
  const server = new N8NDocumentationMCPServer();
  
  // Wait for initialization
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const testCases: SearchTestCase[] = [
    {
      query: 'webhook',
      expectedTop: ['nodes-base.webhook'],
      description: 'Primary webhook node should appear first'
    },
    {
      query: 'http',
      expectedTop: ['nodes-base.httpRequest'],
      description: 'HTTP Request node should appear first'
    },
    {
      query: 'http call',
      expectedTop: ['nodes-base.httpRequest'],
      description: 'HTTP Request node should appear first for "http call"'
    },
    {
      query: 'slack',
      expectedTop: ['nodes-base.slack'],
      description: 'Slack node should appear first'
    },
    {
      query: 'email',
      expectedTop: ['nodes-base.emailSend', 'nodes-base.gmail', 'nodes-base.emailReadImap'],
      description: 'Email-related nodes should appear first'
    },
    {
      query: 'http request',
      expectedTop: ['nodes-base.httpRequest'],
      description: 'HTTP Request node should appear first for exact name'
    }
  ];
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const testCase of testCases) {
    try {
      console.log(`\nTest: ${testCase.description}`);
      console.log(`Query: "${testCase.query}"`);
      
      const results = await server.executeTool('search_nodes', { 
        query: testCase.query, 
        limit: 10 
      });
      
      if (!results.results || results.results.length === 0) {
        console.log('❌ No results found');
        failedTests++;
        continue;
      }
      
      console.log(`Found ${results.results.length} results`);
      console.log('Top 5 results:');
      
      const top5 = results.results.slice(0, 5);
      top5.forEach((node: any, index: number) => {
        const isExpected = testCase.expectedTop.includes(node.nodeType);
        const marker = index === 0 && isExpected ? '✅' : index === 0 && !isExpected ? '❌' : '';
        console.log(`  ${index + 1}. ${node.nodeType} - ${node.displayName} ${marker}`);
      });
      
      // Check if any expected node appears in top position
      const firstResult = results.results[0];
      if (testCase.expectedTop.includes(firstResult.nodeType)) {
        console.log('✅ Test passed: Expected node found at top position');
        passedTests++;
      } else {
        console.log('❌ Test failed: Expected nodes not at top position');
        console.log(`   Expected one of: ${testCase.expectedTop.join(', ')}`);
        console.log(`   Got: ${firstResult.nodeType}`);
        failedTests++;
      }
      
    } catch (error) {
      console.log(`❌ Test failed with error: ${error}`);
      failedTests++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`Test Summary: ${passedTests} passed, ${failedTests} failed`);
  console.log('='.repeat(50));
  
  // Test the old problematic queries to ensure improvement
  console.log('\n\nTesting Original Problem Scenarios:');
  console.log('=====================================\n');
  
  // Test webhook query that was problematic
  console.log('1. Testing "webhook" query (was returning service-specific webhooks first):');
  const webhookResult = await server.executeTool('search_nodes', { query: 'webhook', limit: 10 });
  const webhookFirst = webhookResult.results[0];
  if (webhookFirst.nodeType === 'nodes-base.webhook') {
    console.log('   ✅ SUCCESS: Primary Webhook node now appears first!');
  } else {
    console.log(`   ❌ FAILED: Got ${webhookFirst.nodeType} instead of nodes-base.webhook`);
    console.log(`   First 3 results: ${webhookResult.results.slice(0, 3).map((r: any) => r.nodeType).join(', ')}`);
  }
  
  // Test http call query
  console.log('\n2. Testing "http call" query (was not finding HTTP Request easily):');
  const httpCallResult = await server.executeTool('search_nodes', { query: 'http call', limit: 10 });
  const httpCallFirst = httpCallResult.results[0];
  if (httpCallFirst.nodeType === 'nodes-base.httpRequest') {
    console.log('   ✅ SUCCESS: HTTP Request node now appears first!');
  } else {
    console.log(`   ❌ FAILED: Got ${httpCallFirst.nodeType} instead of nodes-base.httpRequest`);
    console.log(`   First 3 results: ${httpCallResult.results.slice(0, 3).map((r: any) => r.nodeType).join(', ')}`);
  }
  
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
testSearchImprovements().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});