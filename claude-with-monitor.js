#!/usr/bin/env node

import { spawn } from 'child_process';
import ContextMonitor from '/home/tabs/.claude/addons/context-monitor.js';

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
