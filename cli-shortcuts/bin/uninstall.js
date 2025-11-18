#!/usr/bin/env node

import { existsSync, unlinkSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';

class ShortcutsUninstaller {
  constructor() {
    this.homeDir = homedir();
    this.claudeDir = join(this.homeDir, '.claude');
    this.shortcutsDir = join(this.claudeDir, 'shortcuts');
    this.targetFile = join(this.shortcutsDir, 'claude-shortcuts.sh');
    this.testFile = join(this.shortcutsDir, 'test-shortcuts.sh');
    this.bashrcFile = join(this.homeDir, '.bashrc');
    this.zshrcFile = join(this.homeDir, '.zshrc');
  }

  // Remove shortcuts file
  removeShortcutsFile() {
    if (existsSync(this.targetFile)) {
      try {
        unlinkSync(this.targetFile);
        console.log(chalk.green('✅ Removed shortcuts file'));
        return true;
      } catch (error) {
        console.error(chalk.red('❌ Failed to remove shortcuts file:'), error.message);
        return false;
      }
    }
    return true;
  }

  // Remove test file
  removeTestFile() {
    if (existsSync(this.testFile)) {
      try {
        unlinkSync(this.testFile);
        console.log(chalk.green('✅ Removed test file'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not remove test file'));
      }
    }
  }

  // Clean shell configuration
  cleanShellConfig(configFile, shellName) {
    if (!existsSync(configFile)) return true;

    try {
      const content = readFileSync(configFile, 'utf8');
      
      // Remove CLDCDE shortcuts section
      const lines = content.split('\n');
      const filteredLines = [];
      let skipSection = false;

      for (const line of lines) {
        if (line.includes('CLDCDE CLI Shortcuts - Auto-installed')) {
          skipSection = true;
          continue;
        }
        
        if (skipSection && line.trim() === 'fi') {
          skipSection = false;
          continue;
        }
        
        if (!skipSection && !line.includes('claude-shortcuts.sh')) {
          filteredLines.push(line);
        }
      }

      const cleanedContent = filteredLines.join('\n');
      writeFileSync(configFile, cleanedContent);
      console.log(chalk.green(`✅ Cleaned ${shellName}`));
      return true;
    } catch (error) {
      console.error(chalk.red(`❌ Failed to clean ${shellName}:`), error.message);
      return false;
    }
  }

  // Clean all shell configurations
  cleanShells() {
    let cleaned = false;

    // Clean Bash
    if (existsSync(this.bashrcFile)) {
      if (this.cleanShellConfig(this.bashrcFile, '.bashrc')) {
        cleaned = true;
      }
    }

    // Clean Zsh
    if (existsSync(this.zshrcFile)) {
      if (this.cleanShellConfig(this.zshrcFile, '.zshrc')) {
        cleaned = true;
      }
    }

    return cleaned;
  }

  // Main uninstallation process
  async uninstall() {
    console.log(chalk.cyan.bold('\n🗑️  Uninstalling CLDCDE CLI Shortcuts...'));

    // Check if installed
    if (!existsSync(this.targetFile)) {
      console.log(chalk.yellow('⚠️  CLDCDE CLI Shortcuts not found (may already be uninstalled)'));
      return;
    }

    // Remove shortcuts file
    if (!this.removeShortcutsFile()) {
      console.log(chalk.red('\n❌ Uninstallation failed!'));
      process.exit(1);
    }

    // Remove test file
    this.removeTestFile();

    // Clean shell configurations
    const shellsCleaned = this.cleanShells();

    // Uninstallation complete
    console.log(chalk.green.bold('\n✅ CLDCDE CLI Shortcuts uninstalled successfully!'));
    
    if (shellsCleaned) {
      console.log(chalk.yellow('\n📋 Final Steps:'));
      console.log(chalk.blue('1. Restart your terminal to complete removal'));
      console.log(chalk.blue('2. Shell configurations have been cleaned'));
    } else {
      console.log(chalk.yellow('\n📋 Manual Cleanup:'));
      console.log(chalk.blue('You may need to manually remove CLDCDE references from:'));
      console.log(chalk.gray('   ~/.bashrc or ~/.zshrc'));
    }

    console.log(chalk.cyan('\n👋 Thanks for trying CLDCDE CLI Shortcuts!'));
    console.log(chalk.gray('🔗 https://github.com/aegntic/cldcde\n'));
  }
}

// Run uninstallation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const uninstaller = new ShortcutsUninstaller();
  uninstaller.uninstall().catch(error => {
    console.error(chalk.red('❌ Uninstallation error:'), error);
    process.exit(1);
  });
}

export default ShortcutsUninstaller;