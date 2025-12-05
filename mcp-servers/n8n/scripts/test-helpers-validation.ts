#!/usr/bin/env npx tsx

import { EnhancedConfigValidator } from '../src/services/enhanced-config-validator.js';

console.log('🧪 Testing $helpers Validation\n');

const testCases = [
  {
    name: 'Incorrect $helpers.getWorkflowStaticData',
    config: {
      language: 'javaScript',
      jsCode: `const data = $helpers.getWorkflowStaticData('global');
data.counter = 1;
return [{json: {counter: data.counter}}];`
    }
  },
  {
    name: 'Correct $getWorkflowStaticData',
    config: {
      language: 'javaScript',
      jsCode: `const data = $getWorkflowStaticData('global');
data.counter = 1;
return [{json: {counter: data.counter}}];`
    }
  },
  {
    name: '$helpers without check',
    config: {
      language: 'javaScript',
      jsCode: `const response = await $helpers.httpRequest({
  method: 'GET',
  url: 'https://api.example.com'
});
return [{json: response}];`
    }
  },
  {
    name: '$helpers with proper check',
    config: {
      language: 'javaScript',
      jsCode: `if (typeof $helpers !== 'undefined' && $helpers.httpRequest) {
  const response = await $helpers.httpRequest({
    method: 'GET',
    url: 'https://api.example.com'
  });
  return [{json: response}];
}
return [{json: {error: 'HTTP not available'}}];`
    }
  },
  {
    name: 'Crypto without require',
    config: {
      language: 'javaScript',
      jsCode: `const token = crypto.randomBytes(32).toString('hex');
return [{json: {token}}];`
    }
  },
  {
    name: 'Crypto with require',
    config: {
      language: 'javaScript',
      jsCode: `const crypto = require('crypto');
const token = crypto.randomBytes(32).toString('hex');
return [{json: {token}}];`
    }
  }
];

for (const test of testCases) {
  console.log(`Test: ${test.name}`);
  const result = EnhancedConfigValidator.validateWithMode(
    'nodes-base.code',
    test.config,
    [
      { name: 'language', type: 'options', options: ['javaScript', 'python'] },
      { name: 'jsCode', type: 'string' }
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
  console.log();
}

console.log('✅ $helpers validation tests completed!');