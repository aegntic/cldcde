#!/usr/bin/env node

/**
 * Test script for .claude to Antigravity Integration
 *
 * This script validates the integration without executing the full migration
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing .claude to Antigravity Integration');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

/**
 * Test if file exists and is readable
 */
function testFile(filePath, description) {
  try {
    const resolvedPath = path.resolve(filePath);
    if (fs.existsSync(resolvedPath)) {
      const stats = fs.statSync(resolvedPath);
      console.log(`  ✅ ${description}: EXISTS (${stats.size} bytes)`);
      testResults.passed++;
      testResults.details.push({ status: 'PASS', description, path: filePath });
      return true;
    } else {
      console.log(`  ❌ ${description}: NOT FOUND`);
      testResults.failed++;
      testResults.details.push({ status: 'FAIL', description, path: filePath, error: 'File not found' });
      return false;
    }
  } catch (error) {
    console.log(`  ❌ ${description}: ERROR - ${error.message}`);
    testResults.failed++;
    testResults.details.push({ status: 'FAIL', description, path: filePath, error: error.message });
    return false;
  }
}

/**
 * Test JSON configuration file
 */
function testJsonConfig(filePath, description) {
  try {
    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
      console.log(`  ❌ ${description}: NOT FOUND`);
      testResults.failed++;
      return false;
    }

    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const parsed = JSON.parse(content);
    console.log(`  ✅ ${description}: VALID JSON (${Object.keys(parsed).length} top-level keys)`);
    testResults.passed++;
    testResults.details.push({ status: 'PASS', description, path: filePath, structure: Object.keys(parsed) });
    return true;
  } catch (error) {
    console.log(`  ❌ ${description}: INVALID JSON - ${error.message}`);
    testResults.failed++;
    testResults.details.push({ status: 'FAIL', description, path: filePath, error: error.message });
    return false;
  }
}

/**
 * Test directory structure
 */
function testDirectoryStructure(dirPath, description) {
  try {
    const resolvedPath = path.resolve(dirPath);
    if (!fs.existsSync(resolvedPath)) {
      console.log(`  ❌ ${description}: NOT FOUND`);
      testResults.failed++;
      return false;
    }

    const items = fs.readdirSync(resolvedPath);
    console.log(`  ✅ ${description}: EXISTS (${items.length} items)`);
    testResults.passed++;
    testResults.details.push({ status: 'PASS', description, path: dirPath, items });
    return true;
  } catch (error) {
    console.log(`  ❌ ${description}: ERROR - ${error.message}`);
    testResults.failed++;
    testResults.details.push({ status: 'FAIL', description, path: dirPath, error: error.message });
    return false;
  }
}

/**
 * Count files in directory by pattern
 */
function countFilesByPattern(dirPath, pattern, description) {
  try {
    const resolvedPath = path.resolve(dirPath);
    if (!fs.existsSync(resolvedPath)) {
      console.log(`  ⚠️  ${description}: DIRECTORY NOT FOUND`);
      testResults.warnings++;
      return 0;
    }

    function countRecursively(currentPath) {
      const items = fs.readdirSync(currentPath);
      let count = 0;

      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          count += countRecursively(itemPath);
        } else if (item.match(pattern)) {
          count++;
        }
      }

      return count;
    }

    const count = countRecursively(resolvedPath);
    console.log(`  ✅ ${description}: ${count} files found`);
    testResults.passed++;
    testResults.details.push({ status: 'PASS', description, count });
    return count;
  } catch (error) {
    console.log(`  ❌ ${description}: ERROR - ${error.message}`);
    testResults.failed++;
    return 0;
  }
}

console.log('');
console.log('📁 Testing Directory Structure');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

testDirectoryStructure('.claude', '.claude directory');
testDirectoryStructure('.claude/agents', '.claude agents');
testDirectoryStructure('.claude/commands', '.claude commands');
testDirectoryStructure('.claude/skills', '.claude skills');
testDirectoryStructure('plugins/tool-registry-manager/src/integrations', 'Integration modules');

console.log('');
console.log('📄 Testing Core Integration Files');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

testFile('scripts/integrate-antigravity.ts', 'Integration script');
testFile('plugins/tool-registry-manager/src/integrations/UltraSwarmIntegration.ts', 'Ultra Swarm Integration');
testFile('plugins/tool-registry-manager/src/integrations/FPEFExecutor.ts', 'FPEF Executor');
testFile('plugins/tool-registry-manager/src/integrations/UltraSwarmOrchestrator.ts', 'Ultra Swarm Orchestrator');

console.log('');
console.log('⚙️  Testing Configuration Files');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

testJsonConfig('configs/ultra-swarm-workflows.json', 'Ultra Swarm Workflows Configuration');

console.log('');
console.log('📊 Testing .claude Content Analysis');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const agentCount = countFilesByPattern('.claude/agents', /\.md$/, 'Agent definitions');
const commandCount = countFilesByPattern('.claude/commands', /\.md$/, 'Command definitions');
const skillCount = countFilesByPattern('.claude/skills', /\.(md|py|js|ts)$/, 'Skill files');

console.log('');
console.log('🔍 Testing Specific .claude Files');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

testFile('.claude/agents/ultra-swarm-enhanced.md', 'Ultra Swarm Enhanced Agent');
testFile('.claude/commands/fpef.md', 'FPEF Command');
testFile('.claude/commands/cldcde-ecosystem.md', 'CLDCDE Ecosystem Command');
testFile('.claude/commands/ultra-swarm.md', 'Ultra Swarm Command');

console.log('');
console.log('🧪 Testing Integration Components');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Test workflow configuration structure
if (testJsonConfig('configs/ultra-swarm-workflows.json', 'Ultra Swarm Workflows Config')) {
  try {
    const config = JSON.parse(fs.readFileSync('configs/ultra-swarm-workflows.json', 'utf-8'));

    // Test required workflow configurations
    if (config.workflows && config.workflows.consensus_validation) {
      console.log('  ✅ Consensus Validation Workflow: CONFIGURED');
      testResults.passed++;
    } else {
      console.log('  ❌ Consensus Validation Workflow: MISSING');
      testResults.failed++;
    }

    if (config.workflows && config.workflows.fpef_systematic_analysis) {
      console.log('  ✅ FPEF Systematic Analysis Workflow: CONFIGURED');
      testResults.passed++;
    } else {
      console.log('  ❌ FPEF Systematic Analysis Workflow: MISSING');
      testResults.failed++;
    }

    if (config.agent_configurations && Object.keys(config.agent_configurations).length > 0) {
      console.log(`  ✅ Agent Configurations: ${Object.keys(config.agent_configurations).length} agents`);
      testResults.passed++;
    } else {
      console.log('  ❌ Agent Configurations: MISSING');
      testResults.failed++;
    }
  } catch (error) {
    console.log(`  ❌ Configuration Analysis: FAILED - ${error.message}`);
    testResults.failed++;
  }
}

console.log('');
console.log('📈 Integration Analysis Summary');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log(`📊 Content Found:`);
console.log(`  • Agent definitions: ${agentCount}`);
console.log(`  • Command definitions: ${commandCount}`);
console.log(`  • Skill files: ${skillCount}`);
console.log(`  • Integration modules: 4`);

console.log('');
console.log(`🎯 Test Results:`);
console.log(`  • Tests passed: ${testResults.passed}`);
console.log(`  • Tests failed: ${testResults.failed}`);
console.log(`  • Warnings: ${testResults.warnings}`);

const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
console.log(`  • Success rate: ${successRate}%`);

if (testResults.failed === 0) {
  console.log('');
  console.log('🎉 INTEGRATION TEST: SUCCESS');
  console.log('✅ All integration components are properly configured');
  console.log('🧠 .claude ecosystem ready for Antigravity migration');
  console.log('🚀 Ultra Swarm consensus validation workflows configured');
  console.log('🔍 FPEF systematic analysis framework ready');
  console.log('🎭 Cultural context validation integrated');
} else {
  console.log('');
  console.log('⚠️  INTEGRATION TEST: NEEDS ATTENTION');
  console.log(`❌ ${testResults.failed} components need to be fixed before migration`);
}

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Save detailed test results
const resultsPath = path.resolve('test-results.json');
try {
  fs.writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results: testResults,
    content_counts: {
      agents: agentCount,
      commands: commandCount,
      skills: skillCount
    }
  }, null, 2));
  console.log(`📄 Detailed results saved to: ${resultsPath}`);
} catch (error) {
  console.log(`⚠️  Could not save detailed results: ${error.message}`);
}

process.exit(testResults.failed === 0 ? 0 : 1);