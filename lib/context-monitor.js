#!/usr/bin/env node

import { createInterface } from 'readline';
import { performance } from 'perf_hooks';
import chalk from 'chalk';

class ContextMonitor {
  constructor() {
    this.maxTokens = 200000; // Claude's context window
    this.currentTokens = 0;
    this.enabled = true;
    this.lastUpdate = performance.now();
  }

  // Estimate tokens from text (roughly 3.5 chars per token)
  estimateTokens(text) {
    if (!text || typeof text !== 'string') return 0;
    
    // More sophisticated estimation
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const chars = text.length;
    
    // Account for punctuation, code, and special formatting
    let tokens = chars / 3.5;
    
    // Adjust for code blocks (typically more tokens)
    const codeBlocks = (text.match(/```[\s\S]*?```/g) || []).length;
    tokens += codeBlocks * 10;
    
    // Adjust for markdown formatting
    const markdown = (text.match(/[*_`#\[\]()]/g) || []).length;
    tokens += markdown * 0.5;
    
    return Math.ceil(tokens);
  }

  // Format token count with color coding
  formatTokenCount(tokens) {
    const percentage = (tokens / this.maxTokens) * 100;
    
    if (percentage < 25) {
      return chalk.green(`${tokens.toLocaleString()} tokens`);
    } else if (percentage < 50) {
      return chalk.yellow(`${tokens.toLocaleString()} tokens`);
    } else if (percentage < 75) {
      return chalk.orange(`${tokens.toLocaleString()} tokens`);
    } else if (percentage < 90) {
      return chalk.red(`${tokens.toLocaleString()} tokens`);
    } else {
      return chalk.red.bold(`${tokens.toLocaleString()} tokens ⚠️`);
    }
  }

  // Create visual progress bar
  createProgressBar(tokens) {
    const percentage = Math.min((tokens / this.maxTokens) * 100, 100);
    const barLength = 20;
    const filled = Math.round((percentage / 100) * barLength);
    const empty = barLength - filled;
    
    let bar = '';
    let color = chalk.green;
    
    if (percentage > 75) color = chalk.red;
    else if (percentage > 50) color = chalk.yellow;
    
    bar += color('█'.repeat(filled));
    bar += chalk.gray('░'.repeat(empty));
    
    return `[${bar}] ${percentage.toFixed(1)}%`;
  }

  // Display compact monitor below text input
  display(input = '') {
    if (!this.enabled) return;
    
    const tokens = this.estimateTokens(input);
    this.currentTokens = tokens;
    
    const tokenDisplay = this.formatTokenCount(tokens);
    const progressBar = this.createProgressBar(tokens);
    
    // Clear previous line and display monitor
    process.stdout.write('\r\x1b[K'); // Clear current line
    process.stdout.write(`${tokenDisplay} ${progressBar}`);
    
    // Add warning if approaching limit
    if (tokens > this.maxTokens * 0.9) {
      process.stdout.write(chalk.red.bold(' [NEAR LIMIT]'));
    }
  }

  // Hook into Claude Code input stream
  attachToInput() {
    let inputBuffer = '';
    
    // Create readline interface to monitor input
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });

    // Monitor each keypress
    process.stdin.on('keypress', (str, key) => {
      if (key && key.name === 'return') {
        inputBuffer = '';
        this.display('');
      } else if (key && key.name === 'backspace') {
        inputBuffer = inputBuffer.slice(0, -1);
        this.display(inputBuffer);
      } else if (str && !key.ctrl && !key.meta) {
        inputBuffer += str;
        this.display(inputBuffer);
      }
    });

    return rl;
  }

  // Enable/disable monitor
  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      process.stdout.write('\r\x1b[K'); // Clear monitor line
    }
  }
}

export default ContextMonitor;