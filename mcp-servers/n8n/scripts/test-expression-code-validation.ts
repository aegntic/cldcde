#!/usr/bin/env npx tsx

/**
 * Test script for Expression vs Code Node validation
 * Tests that we properly detect and warn about expression syntax in Code nodes
 */

import { EnhancedConfigValidator } from '../src/services/enhanced-config-validator.js';

console.log('🧪 Testing Expression vs Code Node Validation\n');

// Test cases with expression syntax that shouldn't work in Code nodes
const testCases = [
  {
    name: 'Expression syntax in Code node',
    config: {
      language: 'javaScript',
      jsCode: `// Using expression syntax
const value = {{$json.field}};
return [{json: {value}}];`
    },
    expectedError: 'Expression syntax {{...}} is not valid in Code nodes'
  },
  {
    name: 'Wrong $node syntax',
    config: {
      language: 'javaScript',
      jsCode: `// Using expression $node syntax
const data = $node['Previous Node'].json;
return [{json: data}];`
    },
    expectedWarning: 'Use $(\'Node Name\') instead of $node[\'Node Name\'] in Code nodes'
  },
  {
    name: 'Expression-only functions',
    config: {
      language: 'javaScript',
      jsCode: `// Using expression functions
const now = $now();
const unique = items.unique();
return [{json: {now, unique}}];`
    },
    expectedWarning: '$now() is an expression-only function'
  },
  {
    name: 'Wrong JMESPath parameter order',
    config: {
      language: 'javaScript',
      jsCode: `// Wrong parameter order
const result = $jmespath("users[*].name", data);
return [{json: {result}}];`
    },
    expectedWarning: 'Code node $jmespath has reversed parameter order'
  },
  {
    name: 'Correct Code node syntax',
    config: {
      language: 'javaScript',
      jsCode: `// Correct syntax
const prevData = $('Previous Node').first();
const now = DateTime.now();
const result = $jmespath(data, "users[*].name");
return [{json: {prevData, now, result}}];`
    },
    shouldBeValid: true
  }
];

// Basic node properties for Code node
const codeNodeProperties = [
  { name: 'language', type: 'options', options: ['javaScript', 'python'] },
  { name: 'jsCode', type: 'string' },
  { name: 'pythonCode', type: 'string' },
  { name: 'mode', type: 'options', options: ['runOnceForAllItems', 'runOnceForEachItem'] }
];

console.log('Running validation tests...\n');

testCases.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test.name}`);
  console.log('─'.repeat(50));
  
  const result = EnhancedConfigValidator.validateWithMode(
    'nodes-base.code',
    test.config,
    codeNodeProperties,
    'operation',
    'ai-friendly'
  );
  
  console.log(`Valid: ${result.valid}`);
  console.log(`Errors: ${result.errors.length}`);
  console.log(`Warnings: ${result.warnings.length}`);
  
  if (test.expectedError) {
    const hasExpectedError = result.errors.some(e => 
      e.message.includes(test.expectedError)
    );
    console.log(`✅ Expected error found: ${hasExpectedError}`);
    if (!hasExpectedError) {
      console.log('❌ Missing expected error:', test.expectedError);
      console.log('Actual errors:', result.errors.map(e => e.message));
    }
  }
  
  if (test.expectedWarning) {
    const hasExpectedWarning = result.warnings.some(w => 
      w.message.includes(test.expectedWarning)
    );
    console.log(`✅ Expected warning found: ${hasExpectedWarning}`);
    if (!hasExpectedWarning) {
      console.log('❌ Missing expected warning:', test.expectedWarning);
      console.log('Actual warnings:', result.warnings.map(w => w.message));
    }
  }
  
  if (test.shouldBeValid) {
    console.log(`✅ Should be valid: ${result.valid && result.errors.length === 0}`);
    if (!result.valid || result.errors.length > 0) {
      console.log('❌ Unexpected errors:', result.errors);
    }
  }
  
  // Show actual messages
  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach(e => console.log(`  - ${e.message}`));
  }
  
  if (result.warnings.length > 0) {
    console.log('\nWarnings:');
    result.warnings.forEach(w => console.log(`  - ${w.message}`));
  }
  
  console.log('\n');
});

console.log('✅ Expression vs Code Node validation tests completed!');