#!/usr/bin/env node

/**
 * OpenCode Setup Script
 * Configures Cloud Aegnts for OpenCode
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
  console.log(`${COLORS.cyan}💻 Setting up Cloud Aegnts for OpenCode...${COLORS.reset}\n`);

  const packageDir = path.dirname(__dirname);

  // Check for OpenCode
  try {
    execSync('npm list -g opencode', { stdio: 'ignore' });
  } catch (e) {
    console.log(`${COLORS.yellow}⚠ OpenCode not detected globally.${COLORS.reset}`);
    console.log(`${COLORS.cyan}The package is still usable via imports.${COLORS.reset}\n`);
  }

  // Create OpenCode config directory
  const configDir = path.join(os.homedir(), '.opencode');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Create config file
  const config = {
    plugins: ['@aegntic/cldcde-cloud-aegnts'],
    cloudAegnts: {
      enabled: true,
      defaultSandbox: 'docker',
      recording: {
        enabled: true,
        fps: 30,
        quality: 'high'
      }
    }
  };

  fs.writeFileSync(
    path.join(configDir, 'cloud-aegnts.json'),
    JSON.stringify(config, null, 2)
  );
  console.log(`${COLORS.green}✓ Created OpenCode config${COLORS.reset}`);

  console.log(`\n${COLORS.green}✅ OpenCode setup complete!${COLORS.reset}`);
  console.log(`${COLORS.cyan}Use: import { CloudAegnt } from '@aegntic/cldcde-cloud-aegnts'${COLORS.reset}\n`);
}

setup();
