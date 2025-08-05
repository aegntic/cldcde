#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';

class ShortcutsTest {
  constructor() {
    this.homeDir = homedir();
    this.shortcutsFile = join(this.homeDir, '.claude', 'shortcuts', 'claude-shortcuts.sh');
    this.testResults = [];
  }

  // Test if shortcuts file exists
  testFileExists() {
    const exists = existsSync(this.shortcutsFile);
    this.testResults.push({
      name: 'Shortcuts file exists',
      passed: exists,
      details: exists ? this.shortcutsFile : 'File not found'
    });
    return exists;
  }

  // Test if file is executable
  testFileExecutable() {
    try {
      const result = execSync(`test -x "${this.shortcutsFile}"`, { encoding: 'utf8' });
      this.testResults.push({
        name: 'File is executable',
        passed: true,
        details: 'File has execute permissions'
      });
      return true;
    } catch (error) {
      this.testResults.push({
        name: 'File is executable',
        passed: false,
        details: 'File does not have execute permissions'
      });
      return false;
    }
  }

  // Test if aliases can be sourced
  testAliasesLoad() {
    try {
      const testCommand = `source "${this.shortcutsFile}" && echo "Aliases loaded"`;
      const result = execSync(testCommand, { encoding: 'utf8', shell: '/bin/bash' });
      const passed = result.includes('Aliases loaded') || result.includes('CLDCDE CLI Shortcuts loaded');
      
      this.testResults.push({
        name: 'Aliases load successfully',
        passed: passed,
        details: passed ? 'Shortcuts sourced without errors' : 'Failed to source shortcuts'
      });
      return passed;
    } catch (error) {
      this.testResults.push({
        name: 'Aliases load successfully',
        passed: false,
        details: `Error sourcing file: ${error.message}`
      });
      return false;
    }
  }

  // Test specific aliases
  testSpecificAliases() {
    const aliasesToTest = ['cld', 'cldp', 'cldc', 'cldr', 'clds', 'cldo'];
    let passedCount = 0;

    for (const alias of aliasesToTest) {
      try {
        const testCommand = `source "${this.shortcutsFile}" && alias ${alias}`;
        execSync(testCommand, { encoding: 'utf8', shell: '/bin/bash', stdio: 'pipe' });
        passedCount++;
      } catch (error) {
        // Alias not found
      }
    }

    const passed = passedCount === aliasesToTest.length;
    this.testResults.push({
      name: 'Core aliases defined',
      passed: passed,
      details: `${passedCount}/${aliasesToTest.length} core aliases found`
    });
    return passed;
  }

  // Test utility functions
  testUtilityFunctions() {
    const functionsToTest = ['cld-help', 'cld-quick', 'cld-session', 'cld-auto'];
    let passedCount = 0;

    for (const func of functionsToTest) {
      try {
        const testCommand = `source "${this.shortcutsFile}" && declare -f ${func}`;
        execSync(testCommand, { encoding: 'utf8', shell: '/bin/bash', stdio: 'pipe' });
        passedCount++;
      } catch (error) {
        // Function not found
      }
    }

    const passed = passedCount === functionsToTest.length;
    this.testResults.push({
      name: 'Utility functions defined',
      passed: passed,
      details: `${passedCount}/${functionsToTest.length} utility functions found`
    });
    return passed;
  }

  // Test help function output
  testHelpFunction() {
    try {
      const testCommand = `source "${this.shortcutsFile}" && cld-help`;
      const result = execSync(testCommand, { encoding: 'utf8', shell: '/bin/bash' });
      const passed = result.includes('Claude CLI Shortcuts') && result.includes('Basic Commands');
      
      this.testResults.push({
        name: 'Help function works',
        passed: passed,
        details: passed ? 'Help output contains expected content' : 'Help output missing expected content'
      });
      return passed;
    } catch (error) {
      this.testResults.push({
        name: 'Help function works',
        passed: false,
        details: `Error running help: ${error.message}`
      });
      return false;
    }
  }

  // Run all tests
  runTests() {
    console.log(chalk.cyan.bold('\n🧪 Testing CLDCDE CLI Shortcuts Installation\n'));

    // Run tests
    this.testFileExists();
    this.testFileExecutable();
    this.testAliasesLoad();
    this.testSpecificAliases();
    this.testUtilityFunctions();
    this.testHelpFunction();

    // Display results
    console.log('Test Results:');
    console.log('─'.repeat(50));

    let passedCount = 0;
    for (const test of this.testResults) {
      const status = test.passed ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
      console.log(`${status} ${test.name}`);
      if (!test.passed || process.argv.includes('--verbose')) {
        console.log(chalk.gray(`     ${test.details}`));
      }
      if (test.passed) passedCount++;
    }

    console.log('─'.repeat(50));
    const totalTests = this.testResults.length;
    const allPassed = passedCount === totalTests;
    
    if (allPassed) {
      console.log(chalk.green.bold(`🎉 All ${totalTests} tests passed!`));
      console.log(chalk.blue('\n💡 Try running: cld-help'));
    } else {
      console.log(chalk.red(`❌ ${totalTests - passedCount}/${totalTests} tests failed`));
      console.log(chalk.yellow('\n💡 Try reinstalling: npm install -g @aegntic/cldcde-cli-shortcuts'));
    }

    console.log('');
    return allPassed;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ShortcutsTest();
  const success = tester.runTests();
  process.exit(success ? 0 : 1);
}

export default ShortcutsTest;