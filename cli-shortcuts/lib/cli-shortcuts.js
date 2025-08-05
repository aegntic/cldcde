#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CLIShortcuts {
  constructor() {
    this.homeDir = homedir();
    this.claudeDir = join(this.homeDir, '.claude');
    this.shortcutsDir = join(this.claudeDir, 'shortcuts');
    this.sourceFile = join(__dirname, '..', 'shortcuts', 'claude-shortcuts.sh');
    this.targetFile = join(this.shortcutsDir, 'claude-shortcuts.sh');
    this.version = '1.0.0';
  }

  // Check if shortcuts are already installed
  isInstalled() {
    return existsSync(this.targetFile);
  }

  // Get list of available shortcuts
  getShortcutsList() {
    const shortcuts = {
      basic: [
        { name: 'cld', description: 'Start Claude (main shortcut)' },
        { name: 'cldp', description: 'Print mode (non-interactive)' },
        { name: 'cldc', description: 'Continue conversation' },
        { name: 'cldr', description: 'Resume a session' },
        { name: 'cldv', description: 'Verbose mode' },
        { name: 'cldd', description: 'Debug mode' }
      ],
      combinations: [
        { name: 'cldpc', description: 'Print + continue' },
        { name: 'cldpr', description: 'Print + resume' },
        { name: 'cldvc', description: 'Verbose + continue' }
      ],
      models: [
        { name: 'clds', description: 'Quick sonnet model' },
        { name: 'cldo', description: 'Quick opus model' },
        { name: 'clds1', description: 'Specific sonnet model' },
        { name: 'cldo1', description: 'Specific opus model' }
      ],
      configuration: [
        { name: 'cldconf', description: 'Configuration management' },
        { name: 'cldmcp', description: 'MCP server management' },
        { name: 'cldup', description: 'Update Claude' },
        { name: 'clddoc', description: 'Health check' },
        { name: 'restcldd', description: 'Restart Claude Desktop' }
      ],
      advanced: [
        { name: 'cldide', description: 'Auto-connect to IDE' },
        { name: 'cldsafe', description: 'Skip permissions (use carefully!)' },
        { name: 'cldae', description: 'Auto-execute for safe operations' },
        { name: 'cldaep', description: 'Auto-execute + print mode' },
        { name: 'cldaec', description: 'Auto-execute + continue' },
        { name: 'cldjson', description: 'JSON output' },
        { name: 'cldstream', description: 'Streaming JSON' }
      ],
      functions: [
        { name: 'cld-session', description: 'Interactive session picker' },
        { name: 'cld-quick', description: 'Quick one-liner with print mode' },
        { name: 'cld-continue-print', description: 'Continue conversation in print mode' },
        { name: 'cld-auto', description: 'Smart auto-execute with safety warnings' },
        { name: 'cld-help', description: 'Show shortcuts help' }
      ]
    };

    return shortcuts;
  }

  // Count total shortcuts
  getTotalShortcutsCount() {
    const shortcuts = this.getShortcutsList();
    return Object.values(shortcuts).reduce((total, category) => total + category.length, 0);
  }

  // Display shortcuts help
  displayHelp() {
    const shortcuts = this.getShortcutsList();
    
    console.log(chalk.cyan.bold('\n🚀 CLDCDE CLI Shortcuts v' + this.version));
    console.log(chalk.gray('Total shortcuts: ' + this.getTotalShortcutsCount()));
    console.log(chalk.gray('Updated for Claude 4 - August 2025\n'));

    console.log(chalk.yellow.bold('🔥 Basic Commands:'));
    shortcuts.basic.forEach(s => {
      console.log(chalk.green(`  ${s.name.padEnd(16)} - ${s.description}`));
    });

    console.log(chalk.yellow.bold('\n⚡ Quick Combinations:'));
    shortcuts.combinations.forEach(s => {
      console.log(chalk.green(`  ${s.name.padEnd(16)} - ${s.description}`));
    });

    console.log(chalk.yellow.bold('\n🤖 Model Shortcuts:'));
    shortcuts.models.forEach(s => {
      console.log(chalk.green(`  ${s.name.padEnd(16)} - ${s.description}`));
    });

    console.log(chalk.yellow.bold('\n⚙️ Configuration:'));
    shortcuts.configuration.forEach(s => {
      console.log(chalk.green(`  ${s.name.padEnd(16)} - ${s.description}`));
    });

    console.log(chalk.yellow.bold('\n🚀 Advanced Features:'));
    shortcuts.advanced.forEach(s => {
      console.log(chalk.green(`  ${s.name.padEnd(16)} - ${s.description}`));
    });

    console.log(chalk.yellow.bold('\n🛠️ Utility Functions:'));
    shortcuts.functions.forEach(s => {
      console.log(chalk.green(`  ${s.name.padEnd(16)} - ${s.description}`));
    });

    console.log(chalk.blue.bold('\n💡 Safety Guidelines:'));
    console.log(chalk.green('  ✅ Safe for Auto-Execute: code analysis, file reading, explanations'));
    console.log(chalk.red('  ❌ Risky Operations: file modifications, system commands, deletions'));
    
    console.log(chalk.cyan('\nFor more info: https://github.com/aegntic/cldcde'));
  }

  // Check installation status
  checkInstallation() {
    if (this.isInstalled()) {
      console.log(chalk.green('✅ CLDCDE CLI Shortcuts are installed'));
      console.log(chalk.gray(`📍 Location: ${this.targetFile}`));
      console.log(chalk.blue('💡 Run "cld-help" to see all shortcuts'));
      return true;
    } else {
      console.log(chalk.yellow('⚠️  CLDCDE CLI Shortcuts not found'));
      console.log(chalk.gray('💡 Run the installation to set up shortcuts'));
      return false;
    }
  }
}

export default CLIShortcuts;