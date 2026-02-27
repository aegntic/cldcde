#!/usr/bin/env node

/**
 * Agent-Zero Setup Script
 * Configures Cloud Aegnts for Agent-Zero (Python)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function setup() {
  console.log(`${COLORS.cyan}🤖 Setting up Cloud Aegnts for Agent-Zero...${COLORS.reset}\n`);

  const packageDir = path.dirname(__dirname);

  // Check for Agent-Zero
  try {
    execSync('python3 -c "import agent_zero"', { stdio: 'ignore' });
  } catch (e) {
    console.log(`${COLORS.yellow}⚠ Agent-Zero not detected. Install with: pip install agent-zero${COLORS.reset}\n`);
    return;
  }

  // Create plugin directory
  const pluginDir = path.join(os.homedir(), '.agent-zero', 'plugins');
  if (!fs.existsSync(pluginDir)) {
    fs.mkdirSync(pluginDir, { recursive: true });
  }

  // Copy Python adapter
  const adapterSource = path.join(packageDir, 'platforms', 'agent-zero-config.py');
  if (fs.existsSync(adapterSource)) {
    fs.copyFileSync(adapterSource, path.join(pluginDir, 'cloud_aegnts.py'));
    console.log(`${COLORS.green}✓ Installed Python adapter${COLORS.reset}`);
  }

  console.log(`\n${COLORS.green}✅ Agent-Zero setup complete!${COLORS.reset}`);
  console.log(`${COLORS.cyan}Use: from cloud_aegnts import CloudAegnt${COLORS.reset}\n`);
}

setup();
