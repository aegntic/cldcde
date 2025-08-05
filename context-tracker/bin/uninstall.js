#!/usr/bin/env node

import { unlinkSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';

class ClaudeAddonUninstaller {
  constructor() {
    this.claudeDir = join(homedir(), '.claude');
    this.addonDir = join(this.claudeDir, 'addons');
    this.hookFile = join(this.claudeDir, 'hooks.json');
    this.monitorFile = join(this.addonDir, 'context-monitor.js');
    this.wrapperFile = join(this.addonDir, 'claude-with-monitor.js');
  }

  // Remove context monitor files
  removeFiles() {
    const filesToRemove = [this.monitorFile, this.wrapperFile];
    
    filesToRemove.forEach(file => {
      if (existsSync(file)) {
        unlinkSync(file);
        console.log(chalk.green(`✓ Removed ${file}`));
      }
    });
  }

  // Remove hooks configuration
  removeHooks() {
    if (!existsSync(this.hookFile)) return;
    
    try {
      const hooks = JSON.parse(readFileSync(this.hookFile, 'utf8'));
      
      // Remove context monitor hooks
      if (hooks.preCommand) {
        hooks.preCommand = hooks.preCommand.filter(h => h.name !== 'context-monitor');
      }
      if (hooks.postCommand) {
        hooks.postCommand = hooks.postCommand.filter(h => h.name !== 'context-monitor');
      }
      
      writeFileSync(this.hookFile, JSON.stringify(hooks, null, 2));
      console.log(chalk.green('✓ Removed hooks configuration'));
      
    } catch (error) {
      console.log(chalk.yellow('⚠ Could not update hooks file'));
    }
  }

  // Main uninstallation process
  async uninstall() {
    console.log(chalk.bold.blue('🗑️  Uninstalling Claude Context Monitor...\n'));
    
    try {
      this.removeFiles();
      this.removeHooks();
      
      console.log(chalk.bold.green('\n✅ Uninstallation completed successfully!'));
      console.log(chalk.cyan('\n📝 Don\'t forget to remove the alias from your shell configuration:'));
      console.log(chalk.white('  Remove: alias claude-monitor=... from ~/.bashrc or ~/.zshrc'));
      
    } catch (error) {
      console.error(chalk.red('❌ Uninstallation failed:'), error.message);
      process.exit(1);
    }
  }
}

// Run uninstallation
const uninstaller = new ClaudeAddonUninstaller();
uninstaller.uninstall();