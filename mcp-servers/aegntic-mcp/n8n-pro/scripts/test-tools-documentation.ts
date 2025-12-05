import { N8NDocumentationMCPServer } from '../src/mcp/server';
import path from 'path';

async function testToolsDocumentation() {
  const dbPath = path.join(__dirname, '..', 'nodes.db');
  const server = new N8NDocumentationMCPServer(dbPath);
  
  console.log('=== Testing tools_documentation tool ===\n');
  
  // Test 1: No parameters (quick reference)
  console.log('1. Testing without parameters (quick reference):');
  console.log('----------------------------------------');
  const quickRef = await server.executeTool('tools_documentation', {});
  console.log(quickRef);
  console.log('\n');
  
  // Test 2: Overview with essentials depth
  console.log('2. Testing overview with essentials:');
  console.log('----------------------------------------');
  const overviewEssentials = await server.executeTool('tools_documentation', { topic: 'overview' });
  console.log(overviewEssentials);
  console.log('\n');
  
  // Test 3: Overview with full depth
  console.log('3. Testing overview with full depth:');
  console.log('----------------------------------------');
  const overviewFull = await server.executeTool('tools_documentation', { topic: 'overview', depth: 'full' });
  console.log(overviewFull.substring(0, 500) + '...\n');
  
  // Test 4: Specific tool with essentials
  console.log('4. Testing search_nodes with essentials:');
  console.log('----------------------------------------');
  const searchNodesEssentials = await server.executeTool('tools_documentation', { topic: 'search_nodes' });
  console.log(searchNodesEssentials);
  console.log('\n');
  
  // Test 5: Specific tool with full documentation
  console.log('5. Testing search_nodes with full depth:');
  console.log('----------------------------------------');
  const searchNodesFull = await server.executeTool('tools_documentation', { topic: 'search_nodes', depth: 'full' });
  console.log(searchNodesFull.substring(0, 800) + '...\n');
  
  // Test 6: Non-existent tool
  console.log('6. Testing non-existent tool:');
  console.log('----------------------------------------');
  const nonExistent = await server.executeTool('tools_documentation', { topic: 'fake_tool' });
  console.log(nonExistent);
  console.log('\n');
  
  // Test 7: Another tool example
  console.log('7. Testing n8n_update_partial_workflow with essentials:');
  console.log('----------------------------------------');
  const updatePartial = await server.executeTool('tools_documentation', { topic: 'n8n_update_partial_workflow' });
  console.log(updatePartial);
}

testToolsDocumentation().catch(console.error);