#!/usr/bin/env npx tsx

import { EnhancedConfigValidator } from '../src/services/enhanced-config-validator.js';

console.log('🧪 Testing JMESPath Validation\n');

const testCases = [
  {
    name: 'JMESPath with unquoted numeric literal',
    config: {
      language: 'javaScript',
      jsCode: `const data = { users: [{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }] };
const adults = $jmespath(data, 'users[?age >= 18]');
return [{json: {adults}}];`
    },
    expectError: true
  },
  {
    name: 'JMESPath with properly quoted numeric literal',
    config: {
      language: 'javaScript',
      jsCode: `const data = { users: [{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }] };
const adults = $jmespath(data, 'users[?age >= \`18\`]');
return [{json: {adults}}];`
    },
    expectError: false
  },
  {
    name: 'Multiple JMESPath filters with unquoted numbers',
    config: {
      language: 'javaScript',
      jsCode: `const products = items.map(item => item.json);
const expensive = $jmespath(products, '[?price > 100]');
const lowStock = $jmespath(products, '[?quantity < 10]');
const highPriority = $jmespath(products, '[?priority == 1]');
return [{json: {expensive, lowStock, highPriority}}];`
    },
    expectError: true
  },
  {
    name: 'JMESPath with string comparison (no backticks needed)',
    config: {
      language: 'javaScript',
      jsCode: `const data = { users: [{ name: 'John', status: 'active' }, { name: 'Jane', status: 'inactive' }] };
const activeUsers = $jmespath(data, 'users[?status == "active"]');
return [{json: {activeUsers}}];`
    },
    expectError: false
  },
  {
    name: 'Python JMESPath with unquoted numeric literal',
    config: {
      language: 'python',
      pythonCode: `data = { 'users': [{ 'name': 'John', 'age': 30 }, { 'name': 'Jane', 'age': 25 }] }
adults = _jmespath(data, 'users[?age >= 18]')
return [{'json': {'adults': adults}}]`
    },
    expectError: true
  },
  {
    name: 'Complex filter with decimal numbers',
    config: {
      language: 'javaScript',
      jsCode: `const items = [{ price: 99.99 }, { price: 150.50 }, { price: 200 }];
const expensive = $jmespath(items, '[?price >= 99.95]');
return [{json: {expensive}}];`
    },
    expectError: true
  }
];

let passCount = 0;
let failCount = 0;

for (const test of testCases) {
  console.log(`Test: ${test.name}`);
  const result = EnhancedConfigValidator.validateWithMode(
    'nodes-base.code',
    test.config,
    [
      { name: 'language', type: 'options', options: ['javaScript', 'python'] },
      { name: 'jsCode', type: 'string' },
      { name: 'pythonCode', type: 'string' }
    ],
    'operation',
    'strict'
  );
  
  const hasJMESPathError = result.errors.some(e => 
    e.message.includes('JMESPath numeric literal') || 
    e.message.includes('must be wrapped in backticks')
  );
  
  const passed = hasJMESPathError === test.expectError;
  
  console.log(`  Expected error: ${test.expectError}`);
  console.log(`  Has JMESPath error: ${hasJMESPathError}`);
  console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (result.errors.length > 0) {
    console.log(`  Errors: ${result.errors.map(e => e.message).join(', ')}`);
  }
  if (result.warnings.length > 0) {
    console.log(`  Warnings: ${result.warnings.slice(0, 2).map(w => w.message).join(', ')}`);
  }
  
  if (passed) passCount++;
  else failCount++;
  
  console.log();
}

console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed`);
console.log(failCount === 0 ? '✅ All JMESPath validation tests passed!' : '❌ Some tests failed');