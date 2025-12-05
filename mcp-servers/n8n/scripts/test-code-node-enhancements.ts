#!/usr/bin/env npx tsx

/**
 * Test script for Code node enhancements
 * Tests:
 * 1. Code node documentation in tools_documentation
 * 2. Enhanced validation for Code nodes
 * 3. Code node examples
 * 4. Code node task templates
 */

import { EnhancedConfigValidator } from '../src/services/enhanced-config-validator.js';
import { ExampleGenerator } from '../src/services/example-generator.js';
import { TaskTemplates } from '../src/services/task-templates.js';
import { getToolDocumentation } from '../src/mcp/tools-documentation.js';

console.log('🧪 Testing Code Node Enhancements\n');

// Test 1: Code node documentation
console.log('1️⃣ Testing Code Node Documentation');
console.log('=====================================');
const codeNodeDocs = getToolDocumentation('code_node_guide', 'essentials');
console.log('✅ Code node documentation available');
console.log('First 500 chars:', codeNodeDocs.substring(0, 500) + '...\n');

// Test 2: Code node validation
console.log('2️⃣ Testing Code Node Validation');
console.log('=====================================');

// Test cases
const validationTests = [
  {
    name: 'Empty code',
    config: {
      language: 'javaScript',
      jsCode: ''
    }
  },
  {
    name: 'No return statement',
    config: {
      language: 'javaScript',
      jsCode: 'const data = items;'
    }
  },
  {
    name: 'Invalid return format',
    config: {
      language: 'javaScript',
      jsCode: 'return "hello";'
    }
  },
  {
    name: 'Valid code',
    config: {
      language: 'javaScript',
      jsCode: 'return [{json: {result: "success"}}];'
    }
  },
  {
    name: 'Python with external library',
    config: {
      language: 'python',
      pythonCode: 'import pandas as pd\nreturn [{"json": {"result": "fail"}}]'
    }
  },
  {
    name: 'Code with $json in wrong mode',
    config: {
      language: 'javaScript',
      jsCode: 'const value = $json.field;\nreturn [{json: {value}}];'
    }
  },
  {
    name: 'Code with security issue',
    config: {
      language: 'javaScript',
      jsCode: 'const result = eval(item.json.code);\nreturn [{json: {result}}];'
    }
  }
];

for (const test of validationTests) {
  console.log(`\nTest: ${test.name}`);
  const result = EnhancedConfigValidator.validateWithMode(
    'nodes-base.code',
    test.config,
    [
      { name: 'language', type: 'options', options: ['javaScript', 'python'] },
      { name: 'jsCode', type: 'string' },
      { name: 'pythonCode', type: 'string' },
      { name: 'mode', type: 'options', options: ['runOnceForAllItems', 'runOnceForEachItem'] }
    ],
    'operation',
    'ai-friendly'
  );
  
  console.log(`  Valid: ${result.valid}`);
  if (result.errors.length > 0) {
    console.log(`  Errors: ${result.errors.map(e => e.message).join(', ')}`);
  }
  if (result.warnings.length > 0) {
    console.log(`  Warnings: ${result.warnings.map(w => w.message).join(', ')}`);
  }
  if (result.suggestions.length > 0) {
    console.log(`  Suggestions: ${result.suggestions.join(', ')}`);
  }
}

// Test 3: Code node examples
console.log('\n\n3️⃣ Testing Code Node Examples');
console.log('=====================================');

const codeExamples = ExampleGenerator.getExamples('nodes-base.code');
console.log('Available examples:', Object.keys(codeExamples));
console.log('\nMinimal example:');
console.log(JSON.stringify(codeExamples.minimal, null, 2));
console.log('\nCommon example preview:');
console.log(codeExamples.common?.jsCode?.substring(0, 200) + '...');

// Test 4: Code node task templates
console.log('\n\n4️⃣ Testing Code Node Task Templates');
console.log('=====================================');

const codeNodeTasks = [
  'transform_data',
  'custom_ai_tool',
  'aggregate_data',
  'batch_process_with_api',
  'error_safe_transform',
  'async_data_processing',
  'python_data_analysis'
];

for (const taskName of codeNodeTasks) {
  const template = TaskTemplates.getTemplate(taskName);
  if (template) {
    console.log(`\n✅ ${taskName}:`);
    console.log(`   Description: ${template.description}`);
    console.log(`   Language: ${template.configuration.language || 'javaScript'}`);
    console.log(`   Code preview: ${template.configuration.jsCode?.substring(0, 100) || template.configuration.pythonCode?.substring(0, 100)}...`);
  } else {
    console.log(`\n❌ ${taskName}: Template not found`);
  }
}

// Test 5: Validate a complex Code node configuration
console.log('\n\n5️⃣ Testing Complex Code Node Validation');
console.log('==========================================');

const complexCode = {
  language: 'javaScript',
  mode: 'runOnceForEachItem',
  jsCode: `// Complex validation test
try {
  const email = $json.email;
  const response = await $helpers.httpRequest({
    method: 'POST',
    url: 'https://api.example.com/validate',
    body: { email }
  });
  
  return [{
    json: {
      ...response,
      validated: true
    }
  }];
} catch (error) {
  return [{
    json: {
      error: error.message,
      validated: false
    }
  }];
}`,
  onError: 'continueRegularOutput',
  retryOnFail: true,
  maxTries: 3
};

const complexResult = EnhancedConfigValidator.validateWithMode(
  'nodes-base.code',
  complexCode,
  [
    { name: 'language', type: 'options', options: ['javaScript', 'python'] },
    { name: 'jsCode', type: 'string' },
    { name: 'mode', type: 'options', options: ['runOnceForAllItems', 'runOnceForEachItem'] },
    { name: 'onError', type: 'options' },
    { name: 'retryOnFail', type: 'boolean' },
    { name: 'maxTries', type: 'number' }
  ],
  'operation',
  'strict'
);

console.log('Complex code validation:');
console.log(`  Valid: ${complexResult.valid}`);
console.log(`  Errors: ${complexResult.errors.length}`);
console.log(`  Warnings: ${complexResult.warnings.length}`);
console.log(`  Suggestions: ${complexResult.suggestions.length}`);

console.log('\n✅ All Code node enhancement tests completed!');