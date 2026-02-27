#!/usr/bin/env node

/**
 * Claude Code Setup Script
 * Configures Cloud Aegnts for Claude Code
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function setup() {
  console.log(`${COLORS.cyan}📡 Setting up Cloud Aegnts for Claude Code...${COLORS.reset}\n`);

  const claudeDir = path.join(os.homedir(), '.claude');
  const skillsDir = path.join(claudeDir, 'skills');
  const hooksDir = path.join(claudeDir, 'hooks');
  const packageDir = path.dirname(__dirname);

  // Create directories
  [skillsDir, hooksDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`${COLORS.green}✓ Created: ${dir}${COLORS.reset}`);
    }
  });

  // Copy skills
  const skillsSource = path.join(packageDir, 'skills');
  if (fs.existsSync(skillsSource)) {
    fs.readdirSync(skillsSource)
      .filter(f => f.endsWith('.yaml'))
      .forEach(skill => {
        fs.copyFileSync(
          path.join(skillsSource, skill),
          path.join(skillsDir, skill)
        );
        console.log(`${COLORS.green}✓ Installed skill: ${skill}${COLORS.reset}`);
      });
  }

  // Copy hooks
  const hooksSource = path.join(packageDir, 'hooks');
  if (fs.existsSync(hooksSource)) {
    fs.readdirSync(hooksSource)
      .filter(f => f.endsWith('.js'))
      .forEach(hook => {
        fs.copyFileSync(
          path.join(hooksSource, hook),
          path.join(hooksDir, hook)
        );
        console.log(`${COLORS.green}✓ Installed hook: ${hook}${COLORS.reset}`);
      });
  }

  // Update settings.json
  const settingsPath = path.join(claudeDir, 'settings.json');
  let settings = fs.existsSync(settingsPath)
    ? JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    : {};

  if (!settings.skills) settings.skills = [];
  if (!settings.hooks) settings.hooks = {};

  // Add skill paths
  ['cloud-agent-skill.yaml', 'auto-agent-skill.yaml', 'auto-demo-skill.yaml'].forEach(skill => {
    const skillPath = `~/.claude/skills/${skill}`;
    if (!settings.skills.includes(skillPath)) {
      settings.skills.push(skillPath);
    }
  });

  // Add hooks
  settings.hooks.PreTask = 'node ~/.claude/hooks/auto-agent-hooks.js pre-task';
  settings.hooks.PostTask = 'node ~/.claude/hooks/auto-agent-hooks.js post-task';
  settings.hooks.PreEdit = 'node ~/.claude/hooks/auto-agent-hooks.js pre-edit';
  settings.hooks.PostEdit = 'node ~/.claude/hooks/auto-agent-hooks.js post-edit';

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log(`${COLORS.green}✓ Updated settings.json${COLORS.reset}`);

  console.log(`\n${COLORS.green}✅ Claude Code setup complete!${COLORS.reset}`);
  console.log(`${COLORS.cyan}Use: /cloud-agent start "your task"${COLORS.reset}\n`);
}

setup();
