#!/usr/bin/env node

import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { execSync } from 'child_process';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ShortcutsInstaller {
  constructor() {
    this.homeDir = homedir();
    this.claudeDir = join(this.homeDir, '.claude');
    this.shortcutsDir = join(this.claudeDir, 'shortcuts');
    this.sourceFile = join(__dirname, '..', 'shortcuts', 'claude-shortcuts.sh');
    this.targetFile = join(this.shortcutsDir, 'claude-shortcuts.sh');
    this.bashrcFile = join(this.homeDir, '.bashrc');
    this.zshrcFile = join(this.homeDir, '.zshrc');
  }

  // Create necessary directories
  createDirectories() {
    if (!existsSync(this.claudeDir)) {
      mkdirSync(this.claudeDir, { recursive: true });
      console.log(chalk.green('✅ Created ~/.claude directory'));
    }

    if (!existsSync(this.shortcutsDir)) {
      mkdirSync(this.shortcutsDir, { recursive: true });
      console.log(chalk.green('✅ Created ~/.claude/shortcuts directory'));
    }
  }

  // Copy shortcuts file
  copyShortcutsFile() {
    try {
      copyFileSync(this.sourceFile, this.targetFile);
      console.log(chalk.green('✅ Copied Claude CLI shortcuts to ~/.claude/shortcuts/'));
      
      // Make executable
      execSync(`chmod +x "${this.targetFile}"`);
      console.log(chalk.green('✅ Made shortcuts file executable'));
      
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Failed to copy shortcuts file:'), error.message);
      return false;
    }
  }

  // Check if shell config already sources shortcuts
  isAlreadyConfigured(configFile) {
    if (!existsSync(configFile)) return false;
    
    try {
      const content = readFileSync(configFile, 'utf8');
      return content.includes('claude-shortcuts.sh') || content.includes('CLDCDE CLI Shortcuts');
    } catch (error) {
      return false;
    }
  }

  // Add shortcuts to shell configuration
  addToShellConfig(configFile, shellName) {
    if (this.isAlreadyConfigured(configFile)) {
      console.log(chalk.yellow(`⚠️  ${shellName} already configured for CLDCDE shortcuts`));
      return true;
    }

    try {
      const sourceCommand = `
# CLDCDE CLI Shortcuts - Auto-installed by @aegntic/cldcde-cli-shortcuts
if [ -f "$HOME/.claude/shortcuts/claude-shortcuts.sh" ]; then
    source "$HOME/.claude/shortcuts/claude-shortcuts.sh"
fi
`;

      appendFileSync(configFile, sourceCommand);
      console.log(chalk.green(`✅ Added CLDCDE shortcuts to ${shellName}`));
      return true;
    } catch (error) {
      console.error(chalk.red(`❌ Failed to configure ${shellName}:`), error.message);
      return false;
    }
  }

  // Configure shell environments
  configureShells() {
    let configured = false;

    // Configure Bash
    if (existsSync(this.bashrcFile)) {
      if (this.addToShellConfig(this.bashrcFile, '.bashrc')) {
        configured = true;
      }
    }

    // Configure Zsh
    if (existsSync(this.zshrcFile)) {
      if (this.addToShellConfig(this.zshrcFile, '.zshrc')) {
        configured = true;
      }
    }

    return configured;
  }

  // Create a test script to verify installation
  createTestScript() {
    const testScript = join(this.shortcutsDir, 'test-shortcuts.sh');
    const testContent = `#!/bin/bash
# Test script for CLDCDE CLI Shortcuts

echo "🧪 Testing CLDCDE CLI Shortcuts..."

# Source the shortcuts
source "$HOME/.claude/shortcuts/claude-shortcuts.sh"

# Test basic aliases
if command -v cld >/dev/null 2>&1; then
    echo "✅ Basic shortcuts loaded"
else
    echo "❌ Basic shortcuts not found"
fi

# Test functions
if declare -f cld-help >/dev/null 2>&1; then
    echo "✅ Utility functions loaded"
else
    echo "❌ Utility functions not found"
fi

echo "🎉 Test complete! Run 'cld-help' to see all shortcuts"
`;

    try {
      writeFileSync(testScript, testContent);
      execSync(`chmod +x "${testScript}"`);
      console.log(chalk.green('✅ Created test script'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not create test script'));
    }
  }

  // Main installation process
  async install() {
    console.log(chalk.cyan.bold('\n🚀 Installing CLDCDE CLI Shortcuts...'));
    console.log(chalk.gray('Package: @aegntic/cldcde-cli-shortcuts v1.0.0'));
    console.log(chalk.gray('Updated for Claude 4 - August 2025\n'));

    // Step 1: Create directories
    this.createDirectories();

    // Step 2: Copy shortcuts file
    if (!this.copyShortcutsFile()) {
      console.log(chalk.red('\n❌ Installation failed!'));
      process.exit(1);
    }

    // Step 3: Configure shells
    const shellConfigured = this.configureShells();
    
    // Step 4: Create test script
    this.createTestScript();

    // Installation complete
    console.log(chalk.green.bold('\n🎉 CLDCDE CLI Shortcuts installed successfully!'));
    
    if (shellConfigured) {
      console.log(chalk.yellow('\n📋 Next Steps:'));
      console.log(chalk.blue('1. Restart your terminal or run:'));
      console.log(chalk.gray('   source ~/.bashrc  # or source ~/.zshrc'));
      console.log(chalk.blue('2. Type "cld-help" to see all 40+ shortcuts'));
      console.log(chalk.blue('3. Start using shortcuts like "cld", "cldp", "cldc"'));
    } else {
      console.log(chalk.yellow('\n📋 Manual Setup Required:'));
      console.log(chalk.blue('Add this line to your ~/.bashrc or ~/.zshrc:'));
      console.log(chalk.gray('source "$HOME/.claude/shortcuts/claude-shortcuts.sh"'));
    }

    console.log(chalk.cyan('\n🔗 More info: https://github.com/aegntic/cldcde'));
    console.log(chalk.green('✨ Happy coding with Claude!\n'));
  }
}

// Run installation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const installer = new ShortcutsInstaller();
  installer.install().catch(error => {
    console.error(chalk.red('❌ Installation error:'), error);
    process.exit(1);
  });
}

export default ShortcutsInstaller;