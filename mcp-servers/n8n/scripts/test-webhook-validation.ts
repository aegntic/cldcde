#!/usr/bin/env npx tsx

import { EnhancedConfigValidator } from '../src/services/enhanced-config-validator.js';

console.log('🧪 Testing Webhook Data Access Validation\n');

const testCases = [
  {
    name: 'Direct webhook data access (incorrect)',
    config: {
      language: 'javaScript',
      jsCode: `// Processing data from Webhook node
const prevWebhook = $('Webhook').first();
const command = items[0].json.testCommand;
const data = items[0].json.payload;
return [{json: {command, data}}];`
    },
    expectWarning: true
  },
  {
    name: 'Correct webhook data access through body',
    config: {
      language: 'javaScript',
      jsCode: `// Processing data from Webhook node
const webhookData = items[0].json.body;
const command = webhookData.testCommand;
const data = webhookData.payload;
return [{json: {command, data}}];`
    },
    expectWarning: false
  },
  {
    name: 'Common webhook field names without body',
    config: {
      language: 'javaScript',
      jsCode: `// Processing webhook
const command = items[0].json.command;
const action = items[0].json.action;
const payload = items[0].json.payload;
return [{json: {command, action, payload}}];`
    },
    expectWarning: true
  },
  {
    name: 'Non-webhook data access (should not warn)',
    config: {
      language: 'javaScript',
      jsCode: `// Processing data from HTTP Request node
const data = items[0].json.results;
const status = items[0].json.status;
return [{json: {data, status}}];`
    },
    expectWarning: false
  },
  {
    name: 'Mixed correct and incorrect access',
    config: {
      language: 'javaScript',
      jsCode: `// Mixed access patterns
const webhookBody = items[0].json.body;  // Correct
const directAccess = items[0].json.command;  // Incorrect if webhook
return [{json: {webhookBody, directAccess}}];`
    },
    expectWarning: false  // If user already uses .body, we assume they know the pattern
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
      { name: 'jsCode', type: 'string' }
    ],
    'operation',
    'ai-friendly'
  );
  
  const hasWebhookWarning = result.warnings.some(w => 
    w.message.includes('Webhook data is nested under .body') ||
    w.message.includes('webhook data, remember it\'s nested under .body')
  );
  
  const passed = hasWebhookWarning === test.expectWarning;
  
  console.log(`  Expected warning: ${test.expectWarning}`);
  console.log(`  Has webhook warning: ${hasWebhookWarning}`);
  console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (result.warnings.length > 0) {
    const relevantWarnings = result.warnings
      .filter(w => w.message.includes('webhook') || w.message.includes('Webhook'))
      .map(w => w.message);
    if (relevantWarnings.length > 0) {
      console.log(`  Webhook warnings: ${relevantWarnings.join(', ')}`);
    }
  }
  
  if (passed) passCount++;
  else failCount++;
  
  console.log();
}

console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed`);
console.log(failCount === 0 ? '✅ All webhook validation tests passed!' : '❌ Some tests failed');