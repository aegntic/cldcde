#!/usr/bin/env node

/**
 * @aegntic/cldcde-cloud-aegnts - Post-Install Script
 *
 * Automatically sets up Cloud Aegnts for all detected platforms
 * (c) 2025 AE.ltd - Research: aegntic.ai - Led by Mattae Cooper
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function detectPlatforms() {
  const platforms = [];

  // Check for Claude Code
  const claudeDir = path.join(os.homedir(), '.claude');
  if (fs.existsSync(claudeDir)) {
    platforms.push('claude-code');
  }

  // Check for Agent-Zero (Python)
  try {
    require('child_process').execSync('python3 -c "import agent_zero"', { stdio: 'ignore' });
    platforms.push('agent-zero');
  } catch (e) {
    try {
      require('child_process').execSync('python -c "import agent_zero"', { stdio: 'ignore' });
      platforms.push('agent-zero');
    } catch (e2) {}
  }

  // Check for OpenCode (Node.js)
  try {
    require('child_process').execSync('npm list -g opencode', { stdio: 'ignore' });
    platforms.push('opencode');
  } catch (e) {}

  // Check for OpenClaw (Rust)
  try {
    require('child_process').execSync('cargo --version', { stdio: 'ignore' });
    platforms.push('openclaw');
  } catch (e) {}

  return platforms;
}

function setupClaudeCode(packageDir) {
  const claudeDir = path.join(os.homedir(), '.claude');
  const skillsDir = path.join(claudeDir, 'skills');

  // Create skills directory if it doesn't exist
  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }

  // Copy skill files
  const skillsSource = path.join(packageDir, 'skills');
  if (fs.existsSync(skillsSource)) {
    const skills = fs.readdirSync(skillsSource).filter(f => f.endsWith('.yaml'));
    skills.forEach(skill => {
      const src = path.join(skillsSource, skill);
      const dest = path.join(skillsDir, skill);
      fs.copyFileSync(src, dest);
      log(`  ✓ Installed skill: ${skill}`, 'green');
    });
  }

  // Update settings.json
  const settingsPath = path.join(claudeDir, 'settings.json');
  let settings = {};

  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch (e) {
      settings = {};
    }
  }

  // Add skills to settings
  if (!settings.skills) {
    settings.skills = [];
  }

  const skillPaths = [
    '~/.claude/skills/cloud-agent-skill.yaml',
    '~/.claude/skills/auto-agent-skill.yaml',
    '~/.claude/skills/auto-demo-skill.yaml'
  ];

  skillPaths.forEach(skillPath => {
    const expandedPath = skillPath.replace('~', os.homedir());
    if (!settings.skills.includes(skillPath) && fs.existsSync(expandedPath)) {
      settings.skills.push(skillPath);
    }
  });

  // Add hooks
  if (!settings.hooks) {
    settings.hooks = {};
  }

  const hooksSource = path.join(packageDir, 'hooks', 'auto-agent-hooks.js');
  if (fs.existsSync(hooksSource)) {
    const hooksDir = path.join(claudeDir, 'hooks');
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }
    fs.copyFileSync(hooksSource, path.join(hooksDir, 'auto-agent-hooks.js'));

    settings.hooks.PreTask = `node ${path.join(hooksDir, 'auto-agent-hooks.js')} pre-task`;
    settings.hooks.PostTask = `node ${path.join(hooksDir, 'auto-agent-hooks.js')} post-task`;
    settings.hooks.PreEdit = `node ${path.join(hooksDir, 'auto-agent-hooks.js')} pre-edit`;
    settings.hooks.PostEdit = `node ${path.join(hooksDir, 'auto-agent-hooks.js')} post-edit`;
    log('  ✓ Installed hooks', 'green');
  }

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  log('  ✓ Updated Claude Code settings', 'green');
}

function setupAgentZero(packageDir) {
  const pythonDir = path.join(os.homedir(), '.agent-zero', 'plugins');
  if (!fs.existsSync(pythonDir)) {
    fs.mkdirSync(pythonDir, { recursive: true });
  }

  const adapterSource = path.join(packageDir, 'platforms', 'agent-zero-config.py');
  if (fs.existsSync(adapterSource)) {
    fs.copyFileSync(adapterSource, path.join(pythonDir, 'cloud_aegnts.py'));
    log('  ✓ Installed Agent-Zero adapter', 'green');
  }
}

function setupOpenCode(packageDir) {
  const nodeModulesGlobal = require('child_process')
    .execSync('npm root -g', { encoding: 'utf-8' }).trim();

  const adapterSource = path.join(packageDir, 'platforms', 'opencode-config.js');
  if (fs.existsSync(adapterSource)) {
    const destDir = path.join(nodeModulesGlobal, '@aegntic', 'cldcde-cloud-aegnts', 'platforms');
    if (fs.existsSync(destDir)) {
      log('  ✓ OpenCode adapter available via package exports', 'green');
    }
  }
}

function setupOpenClaw(packageDir) {
  const cargoDir = path.join(os.homedir(), '.cargo', 'bin');
  const adapterSource = path.join(packageDir, 'platforms', 'openclaw-config.rs');

  if (fs.existsSync(adapterSource)) {
    // Just note that Rust adapter is available - actual compilation needs cargo
    log('  ✓ OpenClaw adapter available (run cargo build to compile)', 'green');
  }
}

function main() {
  log('\n☁️  Cloud Aegnts Installation', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('(c) 2025 AE.ltd | Research: aegntic.ai | Led by Mattae Cooper\n', 'cyan');

  const packageDir = path.dirname(__dirname);
  const platforms = detectPlatforms();

  log(`Detected platforms: ${platforms.length > 0 ? platforms.join(', ') : 'none'}`, 'blue');

  if (platforms.includes('claude-code')) {
    log('\n📡 Setting up Claude Code...', 'yellow');
    setupClaudeCode(packageDir);
  }

  if (platforms.includes('agent-zero')) {
    log('\n🤖 Setting up Agent-Zero...', 'yellow');
    setupAgentZero(packageDir);
  }

  if (platforms.includes('opencode')) {
    log('\n💻 Setting up OpenCode...', 'yellow');
    setupOpenCode(packageDir);
  }

  if (platforms.includes('openclaw')) {
    log('\n🦀 Setting up OpenClaw...', 'yellow');
    setupOpenClaw(packageDir);
  }

  log('\n✅ Cloud Aegnts installed globally!', 'green');
  log('\nUsage:', 'bright');
  log('  cldcde-aegnts start "Build a REST API"', 'cyan');
  log('  cldcde-aegnts parallel "task1" "task2" "task3"', 'cyan');
  log('  cldcde-aegnts --help\n', 'cyan');
}

main();
