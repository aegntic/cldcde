#!/usr/bin/env node

import { N8NDocumentationMCPServer } from '../src/mcp/server';

async function testSimple() {
  const server = new N8NDocumentationMCPServer();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Just test one query
  const result = await server.executeTool('search_nodes', {
    query: 'slak',
    mode: 'FUZZY',
    limit: 5
  });
  
  console.log('Query: "slak" (FUZZY mode)');
  console.log(`Results: ${result.results.length}`);
  
  if (result.results.length === 0) {
    // Let's check with a lower threshold
    const serverAny = server as any;
    const slackNode = { 
      node_type: 'nodes-base.slack', 
      display_name: 'Slack', 
      description: 'Consume Slack API' 
    };
    const score = serverAny.calculateFuzzyScore(slackNode, 'slak');
    console.log(`\nSlack node score for "slak": ${score}`);
    console.log('Current threshold: 400');
    console.log('Should it match?', score >= 400 ? 'YES' : 'NO');
  } else {
    result.results.forEach((r: any, i: number) => {
      console.log(`${i + 1}. ${r.displayName}`);
    });
  }
}

testSimple().catch(console.error);