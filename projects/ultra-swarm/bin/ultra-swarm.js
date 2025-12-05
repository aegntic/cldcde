#!/usr/bin/env node

/**
 * Ultra Sequential Swarm - Universal AI Assistant Integration
 * Custom slash command interface for Claude Code
 *
 * @author Mattae Cooper - AI Complex Systems Integrity Strategist
 * @license Commercial/Free (see LICENSE.md)
 */

const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

// Load the Ultra Swarm modules
const { UltraSwarmOrchestrator } = require('../src/core/orchestrator');
const { FPEFFramework } = require('../src/core/fpef-framework');
const { UltraThinkEngine } = require('../src/core/ultrathink-engine');

class UltraSwarmCLI {
  constructor() {
    this.orchestrator = new UltraSwarmOrchestrator();
    this.fpef = new FPEFFramework();
    this.ultraThink = new UltraThinkEngine();
  }

  async run(args = []) {
    console.log(chalk.cyan('🧠 Ultra Sequential Swarm - FPEF + UltraThink Enhanced'));
    console.log(chalk.gray('Universal AI Assistant Integration for Claude Code\\n'));

    const command = args[0] || 'help';

    switch (command) {
      case 'fpef':
        await this.runFPEF(args.slice(1));
        break;
      case 'ultrathink':
      case 'think':
        await this.runUltraThink(args.slice(1));
        break;
      case 'swarm':
        await this.runSwarm(args.slice(1));
        break;
      case 'analyze':
        await this.analyze(args.slice(1));
        break;
      case 'cross-reference':
        await this.crossReference(args.slice(1));
        break;
      case 'assess':
        await this.assess(args.slice(1));
        break;
      case 'sequential':
        await this.sequential(args.slice(1));
        break;
      case 'install':
        await this.install(args.slice(1));
        break;
      case 'help':
      default:
        this.showHelp();
        break;
    }
  }

  async runFPEF(args) {
    console.log(chalk.yellow('🔍 FPEF Framework - Find-Prove-Evidence-Fix'));

    const phase = args[0] || 'all';

    switch (phase) {
      case 'map':
        await this.fpef.systemMapping();
        break;
      case 'verify':
        await this.fpef.evidenceVerification();
        break;
      case 'intervene':
        await this.fpef.minimalIntervention();
        break;
      case 'all':
        await this.fpef.completeCycle();
        break;
      default:
        console.log(chalk.red('❌ Unknown FPEF phase. Available: map, verify, intervene, all'));
    }
  }

  async runUltraThink(args) {
    console.log(chalk.blue('🧠 UltraThink Enhanced Reasoning'));

    const mode = args[0] || 'sequential';
    const context = args.slice(1).join(' ');

    switch (mode) {
      case 'sequential':
        await this.ultraThink.sequentialThinking(context);
        break;
      case 'parallel':
        await this.ultraThink.parallelProcessing(context);
        break;
      case 'predictive':
        await this.ultraThink.predictiveModeling(context);
        break;
      case 'adaptive':
        await this.ultraThink.adaptiveLearning(context);
        break;
      default:
        await this.ultraThink.defaultMode(context);
    }
  }

  async runSwarm(args) {
    console.log(chalk.magenta('🔥 Ultra Swarm - Multi-Agent Collaboration'));

    const agents = args[0] || '4';
    const task = args.slice(1).join(' ') || 'comprehensive analysis';

    await this.orchestrator.executeSwarm({
      agentCount: parseInt(agents),
      task: task,
      framework: 'fpef-ultrathink',
      parallel: true
    });
  }

  async analyze(args) {
    console.log(chalk.green('📊 Comprehensive Analysis'));
    const target = args[0] || 'current-project';

    const analysis = await this.orchestrator.analyze({
      target: target,
      method: 'fpef-ultrathink',
      depth: 'comprehensive'
    });

    console.log(chalk.cyan('\\nAnalysis Results:'));
    console.log(JSON.stringify(analysis, null, 2));
  }

  async crossReference(args) {
    console.log(chalk.yellow('🔗 Cross-Reference Analysis'));
    const systems = args.length > 0 ? args : ['frontend', 'backend', 'database', 'deployment'];

    await this.orchestrator.crossReference({
      systems: systems,
      method: 'fpef-evidence-driven'
    });
  }

  async assess(args) {
    console.log(chalk.red('🎯 Assessment & Evaluation'));
    const criteria = args.length > 0 ? args : ['performance', 'security', 'scalability', 'maintainability'];

    await this.orchestrator.assess({
      criteria: criteria,
      framework: 'fpef',
      thorough: true
    });
  }

  async sequential(args) {
    console.log(chalk.blue('⚡ Sequential Processing Pipeline'));
    const steps = args.length > 0 ? args : ['map', 'verify', 'intervene', 'validate'];

    await this.ultraThink.sequentialPipeline({
      steps: steps,
      context: 'current-session',
      output: 'detailed-report'
    });
  }

  async install(args) {
    console.log(chalk.green('🚀 Installing Ultra Sequential Swarm...'));

    // Try to install as MCP server first
    try {
      await this.installMCPServer();
      console.log(chalk.green('✅ MCP Server installed successfully'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  MCP Server installation failed, trying shell integration...'));
      await this.installShellIntegration();
    }
  }

  async installMCPServer() {
    const claudeConfigPath = path.join(process.env.HOME, '.config', 'claude-desktop', 'claude_desktop_config');
    await fs.ensureDir(claudeConfigPath);

    const serverConfig = {
      "mcpServers": {
        "ultra-sequential-swarm": {
          "command": "node",
          "args": [path.join(__dirname, '..', 'mcp-server', 'index.js')],
          "env": {
            "ULTRA_SWARM_MODE": "claude-code",
            "FPEF_FRAMEWORK": "enabled",
            "ULTRATHINK_ENHANCED": "true"
          }
        }
      }
    };

    await fs.writeFile(
      path.join(claudeConfigPath, 'ultra-swarm-mcp.json'),
      JSON.stringify(serverConfig, null, 2)
    );
  }

  async installShellIntegration() {
    const binPath = path.join(process.env.HOME, '.local', 'bin');
    await fs.ensureDir(binPath);

    const scriptContent = `#!/bin/bash
node ${path.join(__dirname, '..', 'bin', 'ultra-swarm.js')} "$@"
`;

    await fs.writeFile(path.join(binPath, 'ultra-swarm'), scriptContent);
    await fs.chmod(path.join(binPath, 'ultra-swarm'), '755');
  }

  showHelp() {
    console.log(chalk.cyan('\\n🧠 Ultra Sequential Swarm - FPEF + UltraThink Enhanced\\n'));
    console.log(chalk.white('Available Commands:\\n'));

    console.log(chalk.yellow('FPEF Framework:'));
    console.log(chalk.gray('  /fpef-ultra fpef map        - System mapping phase'));
    console.log(chalk.gray('  /fpef-ultra fpef verify     - Evidence verification phase'));
    console.log(chalk.gray('  /fpef-ultra fpef intervene   - Minimal intervention phase'));
    console.log(chalk.gray('  /fpef-ultra fpef all         - Complete FPEF cycle\\n'));

    console.log(chalk.blue('UltraThink Engine:'));
    console.log(chalk.gray('  /fpef-ultra think           - Default enhanced reasoning'));
    console.log(chalk.gray('  /fpef-ultra think sequential  - Sequential thinking'));
    console.log(chalk.gray('  /fpef-ultra think parallel     - Parallel processing'));
    console.log(chalk.gray('  /fpef-ultra think predictive    - Predictive modeling\\n'));

    console.log(chalk.magenta('Swarm Operations:'));
    console.log(chalk.gray('  /fpef-ultra swarm 4 [task]  - Run 4-agent swarm'));
    console.log(chalk.gray('  /fpef-ultra analyze          - Comprehensive analysis'));
    console.log(chalk.gray('  /fpef-ultra cross-reference   - Cross-reference systems\\n'));

    console.log(chalk.red('Assessment Tools:'));
    console.log(chalk.gray('  /fpef-ultra assess           - Full assessment'));
    console.log(chalk.gray('  /fpef-ultra sequential       - Sequential pipeline\\n'));

    console.log(chalk.green('Setup:'));
    console.log(chalk.gray('  /fpef-ultra install          - Install as MCP server'));
    console.log(chalk.gray('  /fpef-ultra help             - Show this help\\n'));

    console.log(chalk.cyan('Examples:'));
    console.log(chalk.gray('  /fpef-ultra fpef all'));
    console.log(chalk.gray('  /fpef-ultra think parallel "analyze current code"'));
    console.log(chalk.gray('  /fpef-ultra swarm 6 "review architecture"'));
    console.log(chalk.gray('  /fpef-ultra cross-reference frontend backend database'));
  }
}

// Main execution
if (require.main === module) {
  const cli = new UltraSwarmCLI();
  const args = process.argv.slice(2);
  cli.run(args).catch(error => {
    console.error(chalk.red('❌ Error:'), error.message);
    process.exit(1);
  });
}

module.exports = UltraSwarmCLI;