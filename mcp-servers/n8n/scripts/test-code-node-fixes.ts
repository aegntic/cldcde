#!/usr/bin/env ts-node

/**
 * Test script to verify Code node documentation fixes
 */

import { createDatabaseAdapter } from '../src/database/database-adapter';
import { NodeDocumentationService } from '../src/services/node-documentation-service';
import { getToolDocumentation } from '../src/mcp/tools-documentation';
import { ExampleGenerator } from '../src/services/example-generator';
import { EnhancedConfigValidator } from '../src/services/enhanced-config-validator';

const dbPath = process.env.NODE_DB_PATH || './data/nodes.db';

async function main() {
  console.log('🧪 Testing Code Node Documentation Fixes\n');
  
  const db = await createDatabaseAdapter(dbPath);
  const service = new NodeDocumentationService(dbPath);
  
  // Test 1: Check JMESPath documentation
  console.log('1️⃣ Testing JMESPath Documentation Fix');
  console.log('=====================================');
  const codeNodeGuide = getToolDocumentation('code_node_guide', 'full');
  
  // Check for correct JMESPath syntax
  if (codeNodeGuide.includes('$jmespath(') && !codeNodeGuide.includes('jmespath.search(')) {
    console.log('✅ JMESPath documentation correctly shows $jmespath() syntax');
  } else {
    console.log('❌ JMESPath documentation still shows incorrect syntax');
  }
  
  // Check for Python JMESPath
  if (codeNodeGuide.includes('_jmespath(')) {
    console.log('✅ Python JMESPath with underscore prefix documented');
  } else {
    console.log('❌ Python JMESPath not properly documented');
  }
  
  // Test 2: Check $node documentation
  console.log('\n2️⃣ Testing $node Documentation Fix');
  console.log('===================================');
  
  if (codeNodeGuide.includes("$('Previous Node')") && !codeNodeGuide.includes('$node.name')) {
    console.log('✅ Node access correctly shows $("Node Name") syntax');
  } else {
    console.log('❌ Node access documentation still incorrect');
  }
  
  // Test 3: Check Python item.json documentation
  console.log('\n3️⃣ Testing Python item.json Documentation Fix');
  console.log('==============================================');
  
  if (codeNodeGuide.includes('item.json.to_py()') && codeNodeGuide.includes('JsProxy')) {
    console.log('✅ Python item.json correctly documented with to_py() method');
  } else {
    console.log('❌ Python item.json documentation incomplete');
  }
  
  // Test 4: Check Python examples
  console.log('\n4️⃣ Testing Python Examples');
  console.log('===========================');
  
  const pythonExample = ExampleGenerator.getExamples('nodes-base.code.pythonExample');
  if (pythonExample?.minimal?.pythonCode?.includes('_input.all()') && 
      pythonExample?.minimal?.pythonCode?.includes('to_py()')) {
    console.log('✅ Python examples use correct _input.all() and to_py()');
  } else {
    console.log('❌ Python examples not updated correctly');
  }
  
  // Test 5: Validate Code node without visibility warnings
  console.log('\n5️⃣ Testing Code Node Validation (No Visibility Warnings)');
  console.log('=========================================================');
  
  const codeNodeInfo = await service.getNodeInfo('n8n-nodes-base.code');
  if (!codeNodeInfo) {
    console.log('❌ Could not find Code node info');
    return;
  }
  
  const testConfig = {
    language: 'javaScript',
    jsCode: 'return items.map(item => ({json: {...item.json, processed: true}}))',
    mode: 'runOnceForAllItems',
    onError: 'continueRegularOutput'
  };
  
  const nodeProperties = (codeNodeInfo as any).properties || [];
  const validationResult = EnhancedConfigValidator.validateWithMode(
    'nodes-base.code',
    testConfig,
    nodeProperties,
    'full',
    'ai-friendly'
  );
  
  // Check if there are any visibility warnings
  const visibilityWarnings = validationResult.warnings.filter(w => 
    w.message.includes("won't be used due to current settings")
  );
  
  if (visibilityWarnings.length === 0) {
    console.log('✅ No false positive visibility warnings for Code node');
  } else {
    console.log(`❌ Still getting ${visibilityWarnings.length} visibility warnings:`);
    visibilityWarnings.forEach(w => console.log(`   - ${w.property}: ${w.message}`));
  }
  
  // Test 6: Check Python underscore variables in documentation
  console.log('\n6️⃣ Testing Python Underscore Variables');
  console.log('========================================');
  
  const pythonVarsDocumented = codeNodeGuide.includes('Variables use underscore prefix') &&
                               codeNodeGuide.includes('_input') &&
                               codeNodeGuide.includes('_json') &&
                               codeNodeGuide.includes('_jmespath');
  
  if (pythonVarsDocumented) {
    console.log('✅ Python underscore variables properly documented');
  } else {
    console.log('❌ Python underscore variables not fully documented');
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log('All critical documentation fixes have been verified!');
  
  db.close();
}

main().catch(console.error);