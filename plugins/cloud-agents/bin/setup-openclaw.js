#!/usr/bin/env node

/**
 * OpenClaw Setup Script
 * Configures Cloud Aegnts for OpenClaw (Rust)
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
  console.log(`${COLORS.cyan}🦀 Setting up Cloud Aegnts for OpenClaw...${COLORS.reset}\n`);

  const packageDir = path.dirname(__dirname);

  // Check for Rust/Cargo
  try {
    execSync('cargo --version', { stdio: 'ignore' });
  } catch (e) {
    console.log(`${COLORS.yellow}⚠ Rust/Cargo not detected. Install from: https://rustup.rs${COLORS.reset}\n`);
    return;
  }

  // Create Cargo config directory
  const cargoDir = path.join(os.homedir(), '.cargo');
  if (!fs.existsSync(cargoDir)) {
    fs.mkdirSync(cargoDir, { recursive: true });
  }

  // Copy Rust adapter
  const adapterSource = path.join(packageDir, 'platforms', 'openclaw-config.rs');
  if (fs.existsSync(adapterSource)) {
    const destDir = path.join(cargoDir, 'cloud-aegnts');
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Copy the source file
    fs.copyFileSync(adapterSource, path.join(destDir, 'lib.rs'));
    console.log(`${COLORS.green}✓ Installed Rust adapter source${COLORS.reset}`);

    // Create Cargo.toml for the library
    const cargoToml = `[package]
name = "cloud_aegnts"
version = "1.0.0"
edition = "2021"
authors = ["AE.ltd <research@aegntic.ai>"]
description = "Cloud Aegnts with Computer Use for OpenClaw"

[dependencies]
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
`;

    fs.writeFileSync(path.join(destDir, 'Cargo.toml'), cargoToml);
    console.log(`${COLORS.green}✓ Created Cargo.toml${COLORS.reset}`);

    console.log(`\n${COLORS.cyan}To compile: cd ${destDir} && cargo build${COLORS.reset}`);
  }

  console.log(`\n${COLORS.green}✅ OpenClaw setup complete!${COLORS.reset}`);
  console.log(`${COLORS.cyan}Use: use cloud_aegnts::CloudAegnt;${COLORS.reset}\n`);
}

setup();
