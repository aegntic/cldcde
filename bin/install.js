#!/usr/bin/env node

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = dirname(fileURLToPath(import.meta.url));

class ClaudeAddonInstaller {
  constructor() {
    this.claudeDir = join(homedir(), '.claude');
    this.addonDir = join(this.claudeDir, 'addons');
    this.hookFile = join(this.claudeDir, 'hooks.json');
    this.monitorFile = join(this.addonDir, 'context-monitor.js');
  }

  // Ensure required directories exist
  ensureDirectories() {
    [this.claudeDir, this.addonDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        console.log(chalk.green(`✓ Created directory: ${dir}`));
      }
    });
  }

  // Copy context monitor to Claude directory
  installMonitor() {
    const sourceFile = join(__dirname, '..', 'lib', 'context-monitor.js');
    const monitorCode = readFileSync(sourceFile, 'utf8');
    
    writeFileSync(this.monitorFile, monitorCode);
    console.log(chalk.green('✓ Installed context monitor'));
  }

  // Create or update hooks configuration
  setupHooks() {
    let hooks = {};
    
    // Load existing hooks if they exist
    if (existsSync(this.hookFile)) {
      try {
        hooks = JSON.parse(readFileSync(this.hookFile, 'utf8'));
      } catch (error) {
        console.log(chalk.yellow('⚠ Could not read existing hooks, creating new'));
      }
    }

    // Add context monitor hook
    hooks.preCommand = hooks.preCommand || [];
    hooks.postCommand = hooks.postCommand || [];
    
    const monitorHook = {
      name: 'context-monitor',
      script: this.monitorFile,
      enabled: true,
      description: 'Display context window usage monitor'
    };

    // Remove existing context monitor hooks
    hooks.preCommand = hooks.preCommand.filter(h => h.name !== 'context-monitor');
    hooks.postCommand = hooks.postCommand.filter(h => h.name !== 'context-monitor');
    
    // Add to preCommand
    hooks.preCommand.push(monitorHook);

    // Write hooks file
    writeFileSync(this.hookFile, JSON.stringify(hooks, null, 2));
    console.log(chalk.green('✓ Configured Claude hooks'));
  }

  // Create wrapper script for Claude Code
  createWrapper() {
    const wrapperScript = `#!/usr/bin/env node

import { spawn } from 'child_process';
import ContextMonitor from '${this.monitorFile}';

// Initialize context monitor
const monitor = new ContextMonitor();

// Intercept Claude Code execution
const args = process.argv.slice(2);
const claude = spawn('claude', args, {
  stdio: ['pipe', 'inherit', 'inherit']
});

// Attach monitor to input stream
const rl = monitor.attachToInput();

// Handle Claude process
claude.on('close', (code) => {
  rl.close();
  process.exit(code);
});

// Forward input to Claude
process.stdin.pipe(claude.stdin);
`;

    const wrapperFile = join(this.addonDir, 'claude-with-monitor.js');
    writeFileSync(wrapperFile, wrapperScript);
    console.log(chalk.green('✓ Created Claude wrapper script'));
    
    return wrapperFile;
  }

  // Add alias to shell configuration
  setupAlias(wrapperFile) {
    const aliasCommand = `alias claude-monitor='node ${wrapperFile}'`;
    const bashrc = join(homedir(), '.bashrc');
    const zshrc = join(homedir(), '.zshrc');
    
    console.log(chalk.cyan('\n📝 To complete installation, add this alias to your shell:'));
    console.log(chalk.white(aliasCommand));
    console.log(chalk.cyan('\nOr run:'));
    console.log(chalk.white(`echo "${aliasCommand}" >> ~/.bashrc`));
    console.log(chalk.white(`echo "${aliasCommand}" >> ~/.zshrc`));
  }

  // Main installation process
  async install() {
    console.log(chalk.bold.blue('🚀 Installing Claude Context Monitor...\n'));
    
    try {
      this.ensureDirectories();
      this.installMonitor();
      this.setupHooks();
      const wrapperFile = this.createWrapper();
      this.setupAlias(wrapperFile);
      
      console.log(chalk.bold.green('\n✅ Installation completed successfully!'));
      console.log(chalk.cyan('\n📋 Usage:'));
      console.log(chalk.white('  claude-monitor            # Start Claude with context monitor'));
      console.log(chalk.white('  claude                    # Use regular Claude (monitor disabled)'));
      console.log(chalk.cyan('\n💡 The monitor will appear below your input showing token usage in real-time.'));
      
    } catch (error) {
      console.error(chalk.red('❌ Installation failed:'), error.message);
      process.exit(1);
    }
  }
}

// Run installation
const installer = new ClaudeAddonInstaller();
installer.install();