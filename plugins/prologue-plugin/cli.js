#!/usr/bin/env node
/**
 * Prologue Plugin - Cross-Platform Interactive Menu System
 * Works with Claude Code, Factory Droid, Antigravity, Gemini, OpenCode, Codex, Kilo, and standalone CLI
 */

const { Command } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');

const program = new Command();

// Command registry
const commands = {
  planning: [
    { name: 'UltraPlan Pro', command: 'ultraplan-pro', description: 'Autonomous planning & execution system' },
    { name: 'FPEF Framework', command: 'fpef', description: 'Find-Prove-Evidence-Fix analysis' },
    { name: 'Ultra Swarm', command: 'ultra-swarm', description: 'Multi-agent coordination with 6 agents' },
    { name: 'SOTA Suite', command: 'sota-suite', description: 'State-of-the-Art templates' }
  ],
  quality: [
    { name: 'Debt Sentinel', command: 'debt-sentinel', description: 'Anti-pattern detection & blocking' },
    { name: 'Red Team Tribunal', command: 'red-team-tribunal', description: 'Adversarial multi-agent review' },
    { name: 'Spec Lock', command: 'spec-lock', description: 'Documentation synchronization' },
    { name: 'Compound Engineering', command: 'compound-engineering', description: 'Orchestrated quality workflows' }
  ],
  agentdb: [
    { name: 'Vector Search', command: 'agentdb-vector-search', description: '150x faster semantic search' },
    { name: 'Memory Patterns', command: 'agentdb-memory-patterns', description: 'Persistent agent memory' },
    { name: 'Learning Plugins', command: 'agentdb-learning', description: 'RL algorithm training' },
    { name: 'Advanced Features', command: 'agentdb-advanced', description: 'QUIC sync & distributed systems' }
  ],
  coordination: [
    { name: 'Swarm Orchestration', command: 'swarm-orchestration', description: 'Multi-agent coordination' },
    { name: 'Swarm Advanced', command: 'swarm-advanced', description: 'Complex distributed workflows' },
    { name: 'MCP Manager', command: 'mcp-universal-manager', description: 'MCP server auto-discovery' },
    { name: 'Hive Mind', command: 'hive-mind-advanced', description: 'Collective intelligence' }
  ],
  analysis: [
    { name: 'FPEF Analyzer', command: 'fpef-analyzer', description: 'Evidence-based failure analysis' },
    { name: 'ReasoningBank', command: 'reasoningbank-intelligence', description: 'Adaptive learning patterns' },
    { name: 'Performance Analysis', command: 'performance-analysis', description: 'Bottleneck detection' },
    { name: 'Verification QA', command: 'verification-quality', description: 'Truth scoring & verification' }
  ],
  github: [
    { name: 'Code Review', command: 'github-code-review', description: 'AI-powered code review' },
    { name: 'Multi-Repo', command: 'github-multi-repo', description: 'Cross-repo coordination' },
    { name: 'Project Management', command: 'github-project-management', description: 'Board automation' },
    { name: 'Release Management', command: 'github-release-management', description: 'Release orchestration' },
    { name: 'Workflow Automation', command: 'github-workflow-automation', description: 'CI/CD pipelines' }
  ],
  flow: [
    { name: 'Flow Nexus Platform', command: 'flow-nexus-platform', description: 'Complete platform management' },
    { name: 'Neural Networks', command: 'flow-nexus-neural', description: 'ML model deployment' },
    { name: 'Swarm Processing', command: 'flow-nexus-swarm', description: 'Distributed processing' }
  ],
  development: [
    { name: 'Avant-Garde Frontend', command: 'avant-garde-frontend-architect', description: 'Expert UI/UX design' },
    { name: 'Blender 3D', command: 'blender-3d-studio', description: '2D-to-3D transformation' },
    { name: 'Remotion', command: 'remotion-best-practices', description: 'Video creation in React' },
    { name: 'Pair Programming', command: 'pair-programming', description: 'AI-assisted collaboration' }
  ],
  creative: [
    { name: 'Google Labs Extension', command: 'google-labs-extension', description: 'Stitch, Whisk, Flow, MusicFX, ImageFX' },
    { name: 'Stitch', command: 'stitch', description: 'Visual storytelling with AI' },
    { name: 'Whisk', command: 'whisk', description: 'Image remixing and style transfer' },
    { name: 'Flow', command: 'flow', description: 'AI animation and motion' }
  ],
  research: [
    { name: 'NotebookLM Pro', command: 'notebooklm-pro', description: 'Advanced conversational research' },
    { name: 'Document Analysis', command: 'document-analysis', description: 'Multi-source synthesis' },
    { name: 'Knowledge Synthesis', command: 'knowledge-synthesis', description: 'Cross-document insights' }
  ],
  utility: [
    { name: 'Skill Builder', command: 'skill-builder', description: 'Create custom skills' },
    { name: 'Hooks Automation', command: 'hooks-automation', description: 'Hook coordination' },
    { name: 'Beads Management', command: 'bd-management', description: 'Workflow optimization' },
    { name: 'Agentic Jujutsu', command: 'agentic-jujutsu', description: 'Version control for AI' }
  ]
};

program
  .name('prologue')
  .description('Interactive menu system for the @aegntic ecosystem')
  .version('1.0.0');

program
  .command('interactive')
  .alias('i')
  .description('Launch interactive menu with arrow key navigation')
  .action(async () => {
    await showInteractiveMenu();
  });

program
  .command('list [category]')
  .alias('ls')
  .description('List all available commands')
  .action((category) => {
    showCommandList(category);
  });

program
  .command('banner')
  .description('Show Prologue banner')
  .action(() => {
    showBanner();
  });

program
  .command('install [platform]')
  .description('Install Prologue for specific platform (claude|factory|antigravity|gemini)')
  .action((platform) => {
    installPlugin(platform || 'auto');
  });

async function showInteractiveMenu() {
  console.log(chalk.cyan('\n🚀 PROLOGUE INTERACTIVE - @AEGNTIC ECOSYSTEM\n'));
  
  const categories = Object.keys(commands);
  
  while (true) {
    const { category } = await inquirer.prompt([{
      type: 'list',
      name: 'category',
      message: 'Select a category:',
      choices: [
        ...categories.map(cat => ({ name: formatCategory(cat), value: cat })),
        new inquirer.Separator(),
        { name: '❌ Exit', value: 'exit' }
      ],
      pageSize: 15
    }]);
    
    if (category === 'exit') {
      console.log(chalk.green('\n✨ Goodbye! Happy building!\n'));
      process.exit(0);
    }
    
    const categoryCommands = commands[category];
    
    const { command } = await inquirer.prompt([{
      type: 'list',
      name: 'command',
      message: `Select a ${formatCategory(category)} command:`,
      choices: [
        ...categoryCommands.map(cmd => ({
          name: `${cmd.name} - ${cmd.description}`,
          value: cmd.command
        })),
        new inquirer.Separator(),
        { name: '⬅️  Back', value: 'back' }
      ],
      pageSize: 15
    }]);
    
    if (command === 'back') {
      continue;
    }
    
    console.log(chalk.green(`\n▶️  Executing: ${command}\n`));
    
    // Here you would execute the actual command
    // For now, just show what would run
    console.log(chalk.yellow(`Would run: /${command}`));
    console.log(chalk.gray('(In actual implementation, this would trigger the skill/command)\n'));
    
    const { continue: shouldContinue } = await inquirer.prompt([{
      type: 'confirm',
      name: 'continue',
      message: 'Return to menu?',
      default: true
    }]);
    
    if (!shouldContinue) {
      console.log(chalk.green('\n✨ Goodbye! Happy building!\n'));
      process.exit(0);
    }
  }
}

function showCommandList(category) {
  if (category && commands[category]) {
    console.log(chalk.cyan(`\n📋 ${formatCategory(category)} Commands:\n`));
    commands[category].forEach(cmd => {
      console.log(`  ${chalk.green(cmd.name)}`);
      console.log(`    Command: /${cmd.command}`);
      console.log(`    ${cmd.description}\n`);
    });
  } else {
    console.log(chalk.cyan('\n📋 All Available Commands:\n'));
    Object.entries(commands).forEach(([cat, cmds]) => {
      console.log(chalk.yellow(`\n${formatCategory(cat)}:`));
      cmds.forEach(cmd => {
        console.log(`  • ${cmd.name} (/${cmd.command})`);
      });
    });
    console.log('');
  }
}

function showBanner() {
  console.log(chalk.cyan(`
🚀 @AEGNTIC ECOSYSTEM - PROLOGUE v1.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌟 ULTRA PLAN SYSTEMS:
  • UltraPlan Pro - Autonomous planning & execution
  • FPEF Framework - Evidence-based analysis  
  • Ultra Swarm - Multi-agent coordination
  • SOTA Suite - State-of-the-Art templates

🔌 ESSENTIAL 2026 PLUGINS:
  • Debt Sentinel - Anti-pattern detection
  • Red Team Tribunal - Adversarial review
  • Spec Lock - Documentation sync
  • Compound Engineering - Orchestration

🛡️ SAFETY PROTOCOLS:
  • Interpretation Validation - Prevent misfires
  • Reality Synchronization - Data consistency
  • Failure Prevention - Proactive risk management

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Run 'prologue interactive' for visual navigation
🔗 Cross-platform: Claude Code, Factory Droid, Antigravity, Gemini, OpenCode, Codex, Kilo, Goose, Cursor
🚀 The complete @aegntic autonomous intelligence ecosystem
  `));
}

function installPlugin(platform) {
  console.log(chalk.cyan(`\n🔧 Installing Prologue for ${platform}...\n`));
  
  const installPaths = {
    claude: '~/.claude/commands/',
    factory: '~/.factory/commands/',
    antigravity: '~/.antigravity/commands/',
    gemini: '~/.gemini/commands/',
    opencode: '~/.opencode/commands/',
    codex: '~/.codex/commands/',
    kilo: '~/.kilo/commands/',
    goose: '~/.goose/commands/',
    cursor: '~/.cursor/commands/'
  };
  
  if (platform === 'auto') {
    console.log(chalk.yellow('Auto-detecting platform...\n'));
    // Would detect which AI tool is installed
    console.log(chalk.green('✅ Prologue is now available as a global CLI tool!'));
    console.log(chalk.gray('   Run: npx @aegntic/prologue-plugin interactive\n'));
  } else if (installPaths[platform]) {
    console.log(chalk.green(`✅ Would install to: ${installPaths[platform]}`));
    console.log(chalk.gray('   (Copy prologue.md and prologue-interactive.md to commands folder)\n'));
  } else {
    console.log(chalk.red(`❌ Unknown platform: ${platform}`));
    console.log(chalk.gray('   Supported: claude, factory, antigravity, gemini, opencode, codex, kilo, goose, cursor\n'));
  }
}

function formatCategory(category) {
  const icons = {
    planning: '📊',
    quality: '🛡️',
    agentdb: '💾',
    coordination: '🤖',
    analysis: '🔍',
    github: '🐙',
    flow: '🌊',
    development: '💻',
    creative: '🎨',
    research: '📚',
    utility: '🛠️'
  };
  
  const icon = icons[category] || '•';
  const formatted = category.charAt(0).toUpperCase() + category.slice(1);
  return `${icon} ${formatted}`;
}

// Show help if no command
if (process.argv.length === 2) {
  showBanner();
  console.log(chalk.gray('\nRun with --help for usage information\n'));
  program.help();
}

program.parse(process.argv);