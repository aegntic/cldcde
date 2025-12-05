#\!/usr/bin/env node

import { N8NDocumentationMCPServer } from '../src/mcp/server';

async function testHttpSearch() {
  const server = new N8NDocumentationMCPServer();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('Testing search for "http"...\n');
  
  const result = await server.executeTool('search_nodes', {
    query: 'http',
    limit: 50 // Get more results to see where HTTP Request is
  });
  
  console.log(`Total results: ${result.results.length}\n`);
  
  // Find HTTP Request node in results
  const httpRequestIndex = result.results.findIndex((r: any) => 
    r.nodeType === 'nodes-base.httpRequest'
  );
  
  if (httpRequestIndex === -1) {
    console.log('❌ HTTP Request node NOT FOUND in results\!');
  } else {
    console.log(`✅ HTTP Request found at position ${httpRequestIndex + 1}`);
  }
  
  console.log('\nTop 10 results:');
  result.results.slice(0, 10).forEach((r: any, i: number) => {
    console.log(`${i + 1}. ${r.nodeType} - ${r.displayName}`);
  });
  
  // Also check LIKE search directly
  console.log('\n\nTesting LIKE search fallback:');
  const serverAny = server as any;
  const likeResult = await serverAny.searchNodesLIKE('http', 20);
  
  console.log(`LIKE search found ${likeResult.results.length} results`);
  console.log('Top 5 LIKE results:');
  likeResult.results.slice(0, 5).forEach((r: any, i: number) => {
    console.log(`${i + 1}. ${r.nodeType} - ${r.displayName}`);
  });
}

testHttpSearch().catch(console.error);
