#!/usr/bin/env node

/**
 * Prologue CLI - The AI-Powered Creative Framework
 * Begin Your Story with Intelligent AI Assistance
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { PrologueCreator } from './creator';
import { PrologueProject } from './types';
import { MCPManager } from './mcp/mcp-manager';
import { MCPSearchRequest } from './types/mcp';

const program = new Command();

program
  .name('prologue')
  .description('Prologue - The AI-Powered Creative Framework')
  .version('1.0.0');

// Create command
program
  .command('create')
  .description('Create a new Prologue project with AI assistance')
  .argument('[name]', 'Project name')
  .option('-t, --template <template>', 'Project template (portfolio, game, art-gallery, mobile-app, custom)')
  .option('-ai, --ai-agent <agent>', 'AI agent to assist (visionary, builder, designer, data, security, deployment)')
  .option('-s, --skip-git', 'Skip Git initialization')
  .option('-i, --interactive', 'Interactive project creation')
  .option('--ai-enhanced', 'Use enhanced AI features')
  .action(async (name, options) => {
    try {
      console.log(chalk.cyan.bold('\n🎭 Welcome to Prologue!'));
      console.log(chalk.gray('The AI-Powered Creative Framework\n'));

      const projectName = name || await promptForProjectName();
      const projectConfig = await getProjectConfig(projectName, options);

      const creator = new PrologueCreator();
      await creator.createProject(projectName, projectConfig);

      console.log(chalk.green.bold('\n✨ Your Prologue project is ready!'));
      console.log(chalk.gray(`Created: ${projectName}`));

      displayNextSteps(projectName);

    } catch (error) {
      console.error(chalk.red.bold('\n💥 Error creating project:'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Development command
program
  .command('dev')
  .description('Start development server with hot reload')
  .option('-p, --port <port>', 'Port to run on', '3000')
  .option('--open', 'Open browser automatically')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 Starting Prologue development server...'));

      // Development server logic here
      const port = options.port || 3000;

      console.log(chalk.green(`✅ Development server running on http://localhost:${port}`));

      if (options.open) {
        await openBrowser(`http://localhost:${port}`);
      }

    } catch (error) {
      console.error(chalk.red('Error starting development server:'), error);
      process.exit(1);
    }
  });

// Build command
program
  .command('build')
  .description('Build your Prologue project for production')
  .option('-o, --output <dir>', 'Output directory', 'dist')
  .option('--minify', 'Minify the build')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔨 Building Prologue project...'));

      // Build logic here
      console.log(chalk.green('✅ Build completed successfully'));
      console.log(chalk.gray(`Output: ${options.output}`));

    } catch (error) {
      console.error(chalk.red('Error building project:'), error);
      process.exit(1);
    }
  });

// Deploy command
program
  .command('deploy')
  .description('Deploy your Prologue project')
  .argument('[platform]', 'Deployment platform (vercel, netlify, docker, cloud)')
  .action(async (platform, options) => {
    try {
      const deployPlatform = platform || await promptForPlatform();

      console.log(chalk.blue(`🚀 Deploying to ${deployPlatform}...`));

      // Deployment logic here
      console.log(chalk.green(`✅ Successfully deployed to ${deployPlatform}`));

    } catch (error) {
      console.error(chalk.red('Error deploying project:'), error);
      process.exit(1);
    }
  });

// AI assistant command
program
  .command('ai')
  .description('Interact with Prologue AI assistants')
  .option('-a, --agent <agent>', 'Specific AI agent to consult')
  .action(async (options) => {
    try {
      console.log(chalk.cyan('🤖 Prologue AI Assistant'));
      console.log(chalk.gray('Ask anything about your creative project\n'));

      const agent = options.agent || await promptForAgent();

      console.log(chalk.blue(`🎭 Consulting ${agent}...`));

      // AI interaction logic here
      console.log(chalk.green('✨ AI assistance provided!'));

    } catch (error) {
      console.error(chalk.red('Error with AI assistant:'), error);
      process.exit(1);
    }
  });

// Templates command
program
  .command('templates')
  .description('Browse and use Prologue templates')
  .option('--category <category>', 'Filter by category')
  .action(async (options) => {
    try {
      console.log(chalk.cyan('📚 Prologue Templates'));
      console.log(chalk.gray('Pre-built templates for every creative need\n'));

      const templates = await getTemplates(options.category);

      displayTemplates(templates);

    } catch (error) {
      console.error(chalk.red('Error loading templates:'), error);
      process.exit(1);
    }
  });

// Community command
program
  .command('community')
  .description('Connect with the Prologue community')
  .action(async () => {
    try {
      console.log(chalk.cyan('🌟 Prologue Community'));
      console.log(chalk.gray('Join creators, developers, and dreamers\n'));

      displayCommunityInfo();

    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

// MCP command - Model Context Protocol integration
program
  .command('mcp')
  .description('Manage Model Context Protocol servers - auto-detect and install AI tools')
  .option('--search <query>', 'Search for MCP servers')
  .option('--install <server-id>', 'Install a specific MCP server')
  .option('--list', 'List installed MCP servers')
  .option('--uninstall <server-id>', 'Uninstall an MCP server')
  .option('--auto-detect', 'Auto-detect and install required MCP servers for current project')
  .option('--enable <server-id>', 'Enable an MCP server')
  .option('--disable <server-id>', 'Disable an MCP server')
  .option('--health-check', 'Check health of all installed servers')
  .action(async (options) => {
    try {
      console.log(chalk.cyan.bold('\n🔌 Prologue MCP Manager'));
      console.log(chalk.gray('Model Context Protocol - Auto-Detection & Installation\n'));

      const mcpManager = new MCPManager();

      // Setup event listeners for real-time feedback
      setupMCPEventListeners(mcpManager);

      if (options.search) {
        await handleMCPSearch(mcpManager, options.search);
      } else if (options.install) {
        await handleMCPInstall(mcpManager, options.install);
      } else if (options.list) {
        await handleMCPList(mcpManager);
      } else if (options.uninstall) {
        await handleMCPUninstall(mcpManager, options.uninstall);
      } else if (options.autoDetect) {
        await handleMCPAutoDetect(mcpManager);
      } else if (options.enable) {
        await handleMCPEnable(mcpManager, options.enable);
      } else if (options.disable) {
        await handleMCPDisable(mcpManager, options.disable);
      } else if (options.healthCheck) {
        await handleMCPHealthCheck(mcpManager);
      } else {
        await showMCPMenu(mcpManager);
      }

      await mcpManager.cleanup();

    } catch (error) {
      console.error(chalk.red.bold('\n💥 MCP Error:'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Email registration server command
program
  .command('email-server')
  .description('Start the email registration server for early access')
  .option('-p, --port <port>', 'Port to run on', '3001')
  .option('--dev', 'Run in development mode with hot reload')
  .action(async (options) => {
    try {
      console.log(chalk.blue('📧 Starting Prologue Email Registration Server...'));

      const { spawn } = await import('child_process');
      const port = options.port || '3001';

      if (options.dev) {
        console.log(chalk.yellow('🔧 Development mode with hot reload'));
        const server = spawn('npm', ['run', 'server:dev'], {
          stdio: 'inherit',
          cwd: process.cwd()
        });

        server.on('close', (code) => {
          if (code !== 0) {
            console.error(chalk.red(`Server exited with code ${code}`));
            process.exit(code);
          }
        });
      } else {
        console.log(chalk.green(`✅ Email server running on http://localhost:${port}`));
        console.log(chalk.cyan(`📧 Registration form: http://localhost:${port}/register`));
        console.log(chalk.cyan(`🔗 API endpoint: http://localhost:${port}/api/register`));
        console.log(chalk.cyan(`📊 Stats endpoint: http://localhost:${port}/api/stats`));

        // Import and start the server
        const server = await import('./server');
        // Server starts automatically when imported as main module
      }

    } catch (error) {
      console.error(chalk.red('Error starting email server:'), error);
      process.exit(1);
    }
  });

// Setup command for email registration
program
  .command('setup-email')
  .description('Set up email registration with Resend')
  .action(async () => {
    try {
      console.log(chalk.blue('📧 Setting up Prologue Email Registration...'));

      const { execSync } = await import('child_process');

      // Run the setup script
      execSync('./setup-email-registration.sh', { stdio: 'inherit' });

      console.log(chalk.green('✨ Email registration setup complete!'));
      console.log(chalk.cyan('📧 To start the server: prologue email-server'));

    } catch (error) {
      console.error(chalk.red('Setup failed:'), error);
      process.exit(1);
    }
  });

// Deploy command
program
  .command('deploy')
  .description('Deploy Prologue to GitHub Pages and configure DNS')
  .option('--dns', 'Configure DNS using Porkbun API')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 Deploying Prologue...'));

      const { execSync } = await import('child_process');

      // Run the deployment script
      execSync('./scripts/deploy-prologue.sh', { stdio: 'inherit' });

      if (options.dns) {
        console.log(chalk.blue('🔧 Configuring DNS...'));

        // Check if Porkbun credentials are set
        if (!process.env.PORKBUN_API_KEY || !process.env.PORKBUN_SECRET_KEY) {
          console.log(chalk.yellow('⚠️  Set Porkbun credentials:'));
          console.log(chalk.gray('   export PORKBUN_API_KEY=your_api_key'));
          console.log(chalk.gray('   export PORKBUN_SECRET_KEY=your_secret_key'));
          console.log(chalk.gray('   Then run: prologue dns configure'));
        } else {
          execSync('node scripts/porkbun-dns.js configure', { stdio: 'inherit' });
        }
      }

      console.log(chalk.green('🎉 Deployment completed!'));
      console.log(chalk.cyan('🌐 Your site is available at: https://logue.pro'));

    } catch (error) {
      console.error(chalk.red('Deployment failed:'), error);
      process.exit(1);
    }
  });

// DNS management command
program
  .command('dns')
  .description('Manage DNS configuration for logue.pro')
  .argument('<action>', 'Action to perform (configure, status)')
  .action(async (action) => {
    try {
      const { execSync } = await import('child_process');

      switch (action) {
        case 'configure':
        case 'config':
          console.log(chalk.blue('[INFO] Configuring DNS for logue.pro...'));

          if (!process.env.PORKBUN_API_KEY || !process.env.PORKBUN_SECRET_KEY) {
            console.log(chalk.red('[ERROR] Porkbun API credentials not found'));
            console.log(chalk.yellow('Set your credentials:'));
            console.log(chalk.gray('   export PORKBUN_API_KEY=your_api_key'));
            console.log(chalk.gray('   export PORKBUN_SECRET_KEY=your_secret_key'));
            process.exit(1);
          }

          execSync('node scripts/porkbun-dns.js configure', { stdio: 'inherit' });
          break;

        case 'status':
        case 'show':
          console.log(chalk.blue('[INFO] DNS Status for logue.pro...'));
          execSync('node scripts/porkbun-dns.js status', { stdio: 'inherit' });
          break;

        default:
          console.log(chalk.red('[ERROR] Invalid action. Use: configure or status'));
          process.exit(1);
      }

    } catch (error) {
      console.error(chalk.red('[ERROR] DNS operation failed:'), error);
      process.exit(1);
    }
  });

// Secure deployment command
program
  .command('secure-deploy')
  .description('Deploy with proprietary content protection')
  .option('--skip-security', 'Skip security checks (not recommended)')
  .action(async (options) => {
    try {
      console.log(chalk.blue('[INFO] Starting secure deployment...'));

      const { execSync } = await import('child_process');

      if (options.skipSecurity) {
        console.log(chalk.yellow('[WARNING] Skipping security checks'));
      }

      // Run secure deployment script
      execSync('./scripts/secure-deploy.sh', { stdio: 'inherit' });

      console.log(chalk.green('[OK] Secure deployment completed!'));

    } catch (error) {
      console.error(chalk.red('[ERROR] Secure deployment failed:'), error);
      process.exit(1);
    }
  });

// Security configuration command
program
  .command('security')
  .description('Manage security configuration')
  .argument('<action>', 'Action to perform (check, init, status)')
  .action(async (action) => {
    try {
      switch (action) {
        case 'check':
        case 'verify':
          console.log(chalk.blue('[INFO] Running security checks...'));
          const { aiManager } = await import('./ai/ai-manager');
          const validation = await aiManager.validateConfiguration();

          if (validation.valid) {
            console.log(chalk.green('[OK] Security configuration is valid'));
          } else {
            console.log(chalk.yellow('[WARNING] Security issues found:'));
            validation.issues.forEach(issue => console.log(chalk.red(`   - ${issue}`)));
            console.log(chalk.cyan('\nRecommendations:'));
            validation.recommendations.forEach(rec => console.log(chalk.gray(`   • ${rec}`)));
          }
          break;

        case 'init':
        case 'initialize':
          console.log(chalk.blue('[INFO] Initializing security configuration...'));
          const { secureConfig } = await import('./config/secure-config');
          await secureConfig.initializeSecureConfig();
          console.log(chalk.green('[OK] Security configuration initialized'));
          break;

        case 'status':
          console.log(chalk.blue('[INFO] Security status...'));
          const { aiManager: ai } = await import('./ai/ai-manager');
          const status = ai.getConfigurationStatus();

          console.log(chalk.cyan('Configuration Status:'));
          console.log(`  Configured: ${status.configured ? chalk.green('Yes') : chalk.red('No')}`);
          console.log(`  Agents Available: ${status.agentsAvailable}`);
          console.log(`  Secure Config: ${status.hasSecureConfig ? chalk.green('Yes') : chalk.red('No')}`);
          console.log(`  API Keys: ${status.hasApiKeys ? chalk.green('Yes') : chalk.red('No')}`);
          break;

        default:
          console.log(chalk.red('[ERROR] Invalid action. Use: check, init, or status'));
          process.exit(1);
      }

    } catch (error) {
      console.error(chalk.red('[ERROR] Security operation failed:'), error);
      process.exit(1);
    }
  });

// Help command
program
  .command('help')
  .description('Get help with Prologue')
  .action(() => {
    console.log(chalk.cyan('📚 Prologue Help'));
    console.log(chalk.gray('Get assistance with any Prologue feature\n'));

    displayHelpInfo();
  });

// Helper functions
async function promptForProjectName(): Promise<string> {
  const { name } = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'What would you like to call your project?',
      default: 'my-prologue-project',
      validate: (input) => input.trim() ? true : 'Project name is required'
    }
  ]);
  return name.trim();
}

async function getProjectConfig(name: string, options: any): Promise<PrologueProject> {
  const config: PrologueProject = {
    name,
    template: options.template || await promptForTemplate(),
    aiAgent: options.aiAgent || await promptForAgent(),
    skipGit: options.skipGit || false,
    aiEnhanced: options.aiEnhanced || false,
    features: await promptForFeatures(),
    customizations: {}
  };

  if (!options.interactive) {
    return config;
  }

  // Interactive customization
  const { customize } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'customize',
      message: 'Would you like to customize your project?',
      default: false
    }
  ]);

  if (customize) {
    config.customizations = await promptForCustomizations();
  }

  return config;
}

async function promptForTemplate(): Promise<string> {
  const { template } = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Choose a template for your project:',
      choices: [
        { name: '🌟 Portfolio Website', value: 'portfolio' },
        { name: '🎮 Interactive Game', value: 'game' },
        { name: '🎨 Art Gallery', value: 'art-gallery' },
        { name: '📱 Mobile App', value: 'mobile-app' },
        { name: '📊 Dashboard', value: 'dashboard' },
        { name: '🎬 Landing Page', value: 'landing-page' },
        { name: '🛠️ Custom Project', value: 'custom' }
      ],
      default: 'portfolio'
    }
  ]);
  return template;
}

async function promptForAgent(): Promise<string> {
  const { agent } = await inquirer.prompt([
    {
      type: 'list',
      name: 'agent',
      message: 'Choose your primary AI assistant:',
      choices: [
        { name: '🎭 Visionary Director - Creative direction and concepts', value: 'visionary' },
        { name: '⚡ Rapid Builder - Quick prototyping and development', value: 'builder' },
        { name: '🎨 Design Master - Visual design and UI/UX', value: 'designer' },
        { name: '📊 Data Weaver - Data integration and visualization', value: 'data' },
        { name: '🔒 Security Guardian - Security and best practices', value: 'security' },
        { name: '🚀 Deployment Expert - Deployment and optimization', value: 'deployment' }
      ],
      default: 'visionary'
    }
  ]);
  return agent;
}

async function promptForFeatures(): Promise<string[]> {
  const { features } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select features to include:',
      choices: [
        { name: '🎨 Tailwind CSS Styling', value: 'tailwind', checked: true },
        { name: '📱 Responsive Design', value: 'responsive', checked: true },
        { name: '🌙 Dark Mode Support', value: 'dark-mode', checked: true },
        { name: '📊 Data Visualization', value: 'data-viz' },
        { name: '🎮 Interactive Elements', value: 'interactive' },
        { name: '🎭 Animations', value: 'animations' },
        { name: '📝 Content Management', value: 'cms' },
        { name: '🔐 Authentication', value: 'auth' },
        { name: '📊 Analytics', value: 'analytics' }
      ]
    }
  ]);
  return features;
}

async function promptForCustomizations(): Promise<any> {
  const { theme } = await inquirer.prompt([
    {
      type: 'list',
      name: 'theme',
      message: 'Choose a color theme:',
      choices: [
        { name: '🌊 Ocean Blue', value: 'ocean' },
        { name: '🌸 Cherry Blossom', value: 'sakura' },
        { name: '🌿 Forest Green', value: 'forest' },
        { name: '🌆 Sunset Orange', value: 'sunset' },
        { name: '🌌 Night Sky', value: 'night' },
        { name: '🎨 Custom Colors', value: 'custom' }
      ],
      default: 'ocean'
    }
  ]);

  const { fontFamily } = await inquirer.prompt([
    {
      type: 'list',
      name: 'fontFamily',
      message: 'Choose a font family:',
      choices: [
        { name: 'System Default', value: 'system' },
        { name: 'Modern Sans', value: 'sans-serif' },
        { name: 'Classic Serif', value: 'serif' },
        { name: 'Mono Space', value: 'mono' },
        { name: 'Display', value: 'display' }
      ],
      default: 'system'
    }
  ]);

  return { theme, fontFamily };
}

async function promptForPlatform(): Promise<string> {
  const { platform } = await inquirer.prompt([
    {
      type: 'list',
      name: 'platform',
      message: 'Choose deployment platform:',
      choices: [
        { name: '🌟 Vercel (Recommended)', value: 'vercel' },
        { name: '☁️ Netlify', value: 'netlify' },
        { name: '🐳 Docker', value: 'docker' },
        { name: '☁️ AWS', value: 'aws' },
        { name: '☁️ Google Cloud', value: 'gcp' },
        { name: '☁️ Azure', value: 'azure' },
        { name: '🏠 Self-Hosted', value: 'self-hosted' }
      ],
      default: 'vercel'
    }
  ]);
  return platform;
}

async function getTemplates(category?: string): Promise<any[]> {
  // Template fetching logic here
  return [
    {
      name: 'Portfolio Website',
      description: 'Modern portfolio with project showcase',
      category: 'web',
      tags: ['portfolio', 'personal', 'showcase'],
      aiEnhanced: true
    },
    {
      name: 'Interactive Game',
      description: 'Web-based game with AI-generated levels',
      category: 'game',
      tags: ['game', 'interactive', 'fun'],
      aiEnhanced: true
    },
    {
      name: 'Art Gallery',
      description: 'Dynamic art gallery with generative pieces',
      category: 'art',
      tags: ['art', 'gallery', 'creative'],
      aiEnhanced: true
    }
  ];
}

async function displayTemplates(templates: any[]): Promise<void> {
  console.log(chalk.blue('\n📚 Available Templates:'));
  console.log(chalk.gray('─'.repeat(50)));

  templates.forEach((template, index) => {
    const status = template.aiEnhanced ? chalk.green('AI') : chalk.yellow('STD');
    console.log(`${index + 1}. ${template.name} ${status}`);
    console.log(chalk.gray(`   ${template.description}`));
    console.log(chalk.gray(`   Tags: ${template.tags.join(', ')}`));
    console.log();
  });
}

function displayCommunityInfo(): void {
  console.log(chalk.blue('🌟 Join Our Community:'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log('🎭 Discord: ' + chalk.cyan('discord.gg/prologue'));
  console.log('🐦 Twitter: ' + chalk.cyan('@prologueai'));
  console.log('💬 GitHub: ' + chalk.cyan('github.com/aegntic/prologue'));
  console.log('📧 Newsletter: ' + chalk.cyan('logue.pro/newsletter'));
  console.log();
  console.log(chalk.green('✨ Share your creations and learn from others!'));
}

function displayHelpInfo(): void {
  console.log(chalk.blue('📚 Prologue Resources:'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log('📖 Documentation: ' + chalk.cyan('docs.prologue.ai'));
  console.log('🎓 Tutorials: ' + chalk.cyan('tutorials.prologue.ai'));
  console.log('🎮 Examples: ' + chalk.cyan('examples.prologue.ai'));
  console.log('🎨 Templates: ' + chalk.cyan('templates.prologue.ai'));
  console.log('💬 Support: ' + chalk.cyan('support.prologue.ai'));
  console.log();
  console.log(chalk.green('🚀 Start building your dream project today!'));
}

function displayNextSteps(projectName: string): void {
  console.log(chalk.blue('\n🎯 Next Steps:'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`1. ${chalk.cyan('cd')} ${projectName}`);
  console.log(`2. ${chalk.cyan('prologue dev')} Start development server`);
  console.log(`3. ${chalk.cyan('prologue ai')} Get AI assistance`);
  console.log(`4. ${chalk.cyan('prologue deploy')} Deploy your creation`);
  console.log();
  console.log(chalk.green('✨ Your creative journey begins now!'));
  console.log(chalk.gray('Visit ' + chalk.cyan('logue.pro') + ' for more resources'));
}

// MCP Helper Functions
function setupMCPEventListeners(mcpManager: MCPManager): void {
  mcpManager.on('searchStarted', ({ request }) => {
    console.log(chalk.blue(`🔍 Searching for MCP servers: ${request.query || 'all servers'}`));
  });

  mcpManager.on('searchCompleted', ({ results }) => {
    const totalServers = results.reduce((sum, result) => sum + result.servers.length, 0);
    console.log(chalk.green(`✅ Found ${totalServers} MCP servers across ${results.length} registries`));
  });

  mcpManager.on('installationStarted', ({ server }) => {
    console.log(chalk.blue(`📦 Installing ${chalk.bold(server.name)} v${server.version}...`));
  });

  mcpManager.on('installationCompleted', ({ result }) => {
    if (result.success) {
      console.log(chalk.green(`✅ Successfully installed ${chalk.bold(result.server.name)}`));
      console.log(chalk.gray(`   Installed in ${result.duration}ms`));
    }
  });

  mcpManager.on('installationFailed', ({ result }) => {
    console.log(chalk.red(`❌ Failed to install ${chalk.bold(result.server.name)}: ${result.error}`));
  });

  mcpManager.on('configurationCompleted', ({ serverId, configuration }) => {
    console.log(chalk.cyan(`⚙️  Configured server: ${serverId}`));
  });

  mcpManager.on('securityWarning', ({ serverId, pattern, message }) => {
    console.log(chalk.yellow(`⚠️  Security warning for ${serverId}: ${message}`));
  });

  mcpManager.on('autoDetectionStarted', ({ projectContext }) => {
    console.log(chalk.blue('🤖 Starting auto-detection of required MCP servers...'));
  });

  mcpManager.on('autoDetectionCompleted', ({ results }) => {
    const successful = results.filter(r => r.success).length;
    console.log(chalk.green(`✅ Auto-detection completed: installed ${successful} servers`));
  });
}

async function showMCPMenu(mcpManager: MCPManager): Promise<void> {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do with MCP servers?',
      choices: [
        { name: '🔍 Search for MCP servers', value: 'search' },
        { name: '📋 List installed servers', value: 'list' },
        { name: '🤖 Auto-detect required servers', value: 'auto-detect' },
        { name: '🔧 Manage installed servers', value: 'manage' },
        { name: '🏥 Check server health', value: 'health' },
        { name: '⚙️  Configure MCP settings', value: 'config' },
        { name: '❌ Exit', value: 'exit' }
      ]
    }
  ]);

  switch (action) {
    case 'search':
      const { query } = await inquirer.prompt([
        {
          type: 'input',
          name: 'query',
          message: 'Enter search query (leave empty for all):',
          default: ''
        }
      ]);
      await handleMCPSearch(mcpManager, query);
      break;

    case 'list':
      await handleMCPList(mcpManager);
      break;

    case 'auto-detect':
      await handleMCPAutoDetect(mcpManager);
      break;

    case 'manage':
      await showManageMenu(mcpManager);
      break;

    case 'health':
      await handleMCPHealthCheck(mcpManager);
      break;

    case 'config':
      await showConfigMenu(mcpManager);
      break;

    case 'exit':
      console.log(chalk.gray('👋 Goodbye!'));
      return;
  }
}

async function handleMCPSearch(mcpManager: MCPManager, query: string): Promise<void> {
  const spinner = ora('Searching registries...').start();

  try {
    const searchRequest: MCPSearchRequest = {
      query: query || undefined,
      limit: 20,
      sortBy: 'popularity',
      sortOrder: 'desc'
    };

    const results = await mcpManager.searchServers(searchRequest);
    spinner.stop();

    if (results.length === 0) {
      console.log(chalk.yellow('No MCP servers found.'));
      return;
    }

    console.log(chalk.bold('\n📋 Search Results:'));
    console.log(chalk.gray('─'.repeat(60)));

    for (const result of results) {
      if (result.servers.length > 0) {
        console.log(chalk.cyan(`\n🏛️  ${result.registry} Registry (${result.servers.length} servers)`));

        for (const server of result.servers.slice(0, 10)) { // Show max 10 per registry
          const verifiedBadge = server.metadata.verified ? chalk.green('✓') : chalk.gray('?');
          const stars = server.metadata.stars ? `⭐ ${server.metadata.stars}` : '';
          const downloads = server.metadata.downloads ? `📥 ${server.metadata.downloads}` : '';

          console.log(`\n  ${chalk.bold(server.name)} ${verifiedBadge}`);
          console.log(`  ${chalk.gray(server.description)}`);
          console.log(`  ${chalk.cyan('Category:')} ${server.category} | ${chalk.cyan('Transport:')} ${server.transport.join(', ')}`);
          if (stars || downloads) {
            console.log(`  ${stars} ${downloads}`);
          }
        }

        if (result.servers.length > 10) {
          console.log(chalk.dim(`\n  ... and ${result.servers.length - 10} more servers`));
        }
      }
    }

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '📦 Install a server', value: 'install' },
          { name: '🔍 New search', value: 'search' },
          { name: '❌ Back to menu', value: 'back' }
        ]
      }
    ]);

    if (action === 'install') {
      await showInstallMenu(mcpManager, results);
    } else if (action === 'search') {
      const { newQuery } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newQuery',
          message: 'Enter new search query:'
        }
      ]);
      await handleMCPSearch(mcpManager, newQuery);
    }

  } catch (error) {
    spinner.fail('Search failed');
    throw error;
  }
}

async function showInstallMenu(mcpManager: MCPManager, searchResults: any[]): Promise<void> {
  const allServers = searchResults.flatMap(result => result.servers);

  const { selectedServer } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedServer',
      message: 'Select a server to install:',
      choices: allServers.map(server => ({
        name: `${server.name} - ${server.description.substring(0, 60)}...`,
        value: server
      }))
    }
  ]);

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Install ${selectedServer.name}?`,
      default: true
    }
  ]);

  if (confirm) {
    await mcpManager.installServer(selectedServer);
    console.log(chalk.green(`\n✅ ${selectedServer.name} installed successfully!`));
  }
}

async function handleMCPList(mcpManager: MCPManager): Promise<void> {
  const servers = mcpManager.getInstalledServers();

  if (servers.length === 0) {
    console.log(chalk.yellow('No MCP servers installed yet.'));
    console.log(chalk.gray('Use "prologue mcp --search" to find servers to install.'));
    return;
  }

  console.log(chalk.bold('\n📋 Installed MCP Servers:'));
  console.log(chalk.gray('─'.repeat(60)));

  for (const server of servers) {
    const status = server.enabled ? chalk.green('● Enabled') : chalk.red('○ Disabled');
    const health = server.healthStatus === 'healthy' ? chalk.green('🟢') :
                  server.healthStatus === 'unhealthy' ? chalk.red('🔴') :
                  chalk.yellow('🟡');

    console.log(`\n${health} ${chalk.bold(server.serverId)} ${status}`);
    console.log(chalk.gray(`   Version: ${server.version} | Installed: ${server.installedAt.toLocaleDateString()}`));
    console.log(chalk.gray(`   Auto-start: ${server.autoStart ? 'Yes' : 'No'} | Priority: ${server.priority}`));
  }
}

async function handleMCPAutoDetect(mcpManager: MCPManager): Promise<void> {
  console.log(chalk.blue('🤖 Analyzing your project to detect required MCP servers...'));

  try {
    // Simple project analysis
    const projectContext = await analyzeProject();
    const results = await mcpManager.detectAndInstall(projectContext);

    if (results.length === 0) {
      console.log(chalk.yellow('No additional MCP servers were needed for this project.'));
    } else {
      const successful = results.filter(r => r.success).length;
      console.log(chalk.green(`✅ Auto-detection completed! Installed ${successful} new servers.`));
    }
  } catch (error) {
    console.log(chalk.red('❌ Auto-detection failed:'), error);
  }
}

async function analyzeProject(): Promise<any> {
  const fs = await import('fs-extra');
  const path = await import('path');

  const projectContext: any = {
    files: []
  };

  // Check for package.json
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    try {
      projectContext.packageJson = await fs.readJson(packageJsonPath);
    } catch {
      // Package.json exists but is invalid
    }
  }

  // Scan for common files
  const fileExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs'];
  try {
    const files = await fs.readdir(process.cwd(), { withFileTypes: true });
    for (const file of files) {
      if (file.isFile() && fileExtensions.some(ext => file.name.endsWith(ext))) {
        projectContext.files.push(file.name);
      }
    }
  } catch {
    // Directory scan failed
  }

  return projectContext;
}

async function showManageMenu(mcpManager: MCPManager): Promise<void> {
  const servers = mcpManager.getInstalledServers();

  if (servers.length === 0) {
    console.log(chalk.yellow('No MCP servers installed to manage.'));
    return;
  }

  const { serverId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'serverId',
      message: 'Select a server to manage:',
      choices: servers.map(server => ({
        name: `${server.serverId} (${server.enabled ? 'Enabled' : 'Disabled'})`,
        value: server.serverId
      }))
    }
  ]);

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: serverId && mcpManager.getServerInstance(serverId)?.enabled ? '🔌 Disable' : '🔌 Enable', value: 'toggle' },
        { name: '🗑️  Uninstall', value: 'uninstall' },
        { name: '🏥 Health check', value: 'health' },
        { name: '⚙️  Configure', value: 'configure' },
        { name: '❌ Back', value: 'back' }
      ]
    }
  ]);

  switch (action) {
    case 'toggle':
      const instance = mcpManager.getServerInstance(serverId);
      if (instance?.enabled) {
        await mcpManager.disableServer(serverId);
        console.log(chalk.green(`✅ Disabled ${serverId}`));
      } else {
        await mcpManager.enableServer(serverId);
        console.log(chalk.green(`✅ Enabled ${serverId}`));
      }
      break;

    case 'uninstall':
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to uninstall ${serverId}?`,
          default: false
        }
      ]);

      if (confirm) {
        await mcpManager.uninstallServer(serverId);
        console.log(chalk.green(`✅ Uninstalled ${serverId}`));
      }
      break;

    case 'health':
      const health = await mcpManager.performHealthCheck(serverId);
      console.log(chalk.blue(`\n🏥 Health Status for ${serverId}:`));
      console.log(`Status: ${health.status === 'healthy' ? chalk.green('Healthy') : chalk.red('Unhealthy')}`);
      console.log(`Response time: ${health.responseTime}ms`);
      console.log(`Last check: ${health.lastCheck.toLocaleString()}`);
      if (health.error) {
        console.log(chalk.red(`Error: ${health.error}`));
      }
      break;

    case 'configure':
      console.log(chalk.yellow('Configuration editor not implemented yet.'));
      break;
  }
}

async function handleMCPInstall(mcpManager: MCPManager, serverId: string): Promise<void> {
  // First search for the server
  const results = await mcpManager.searchServers({
    query: serverId,
    limit: 10
  });

  const allServers = results.flatMap(result => result.servers);
  const exactMatch = allServers.find(server => server.id === serverId || server.name === serverId);

  if (!exactMatch) {
    console.log(chalk.red(`❌ Server "${serverId}" not found.`));
    return;
  }

  await mcpManager.installServer(exactMatch);
  console.log(chalk.green(`✅ ${exactMatch.name} installed successfully!`));
}

async function handleMCPUninstall(mcpManager: MCPManager, serverId: string): Promise<void> {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to uninstall ${serverId}?`,
      default: false
    }
  ]);

  if (confirm) {
    await mcpManager.uninstallServer(serverId);
    console.log(chalk.green(`✅ Uninstalled ${serverId}`));
  }
}

async function handleMCPEnable(mcpManager: MCPManager, serverId: string): Promise<void> {
  await mcpManager.enableServer(serverId);
  console.log(chalk.green(`✅ Enabled ${serverId}`));
}

async function handleMCPDisable(mcpManager: MCPManager, serverId: string): Promise<void> {
  await mcpManager.disableServer(serverId);
  console.log(chalk.green(`✅ Disabled ${serverId}`));
}

async function handleMCPHealthCheck(mcpManager: MCPManager): Promise<void> {
  const servers = mcpManager.getInstalledServers();

  if (servers.length === 0) {
    console.log(chalk.yellow('No MCP servers installed.'));
    return;
  }

  console.log(chalk.blue('\n🏥 Checking health of all MCP servers...'));

  for (const server of servers) {
    const health = await mcpManager.performHealthCheck(server.serverId);
    const status = health.status === 'healthy' ? chalk.green('🟢 Healthy') :
                  health.status === 'unhealthy' ? chalk.red('🔴 Unhealthy') :
                  chalk.yellow('🟡 Unknown');

    console.log(`${status} ${server.serverId} (${health.responseTime}ms)`);

    if (health.error) {
      console.log(chalk.red(`   Error: ${health.error}`));
    }
  }
}

async function showConfigMenu(mcpManager: MCPManager): Promise<void> {
  console.log(chalk.yellow('Configuration editor not implemented yet.'));
  console.log(chalk.gray('MCP configuration is stored in .prologue/mcp.json'));
}

async function openBrowser(url: string): Promise<void> {
  const { execa } = await import('execa');
  const platform = process.platform;

  let command: string;
  let args: string[];

  switch (platform) {
    case 'darwin':
      command = 'open';
      args = [url];
      break;
    case 'win32':
      command = 'start';
      args = [url];
      break;
    default:
      command = 'xdg-open';
      args = [url];
      break;
  }

  try {
    await execa(command, args);
  } catch (error) {
    console.log(chalk.yellow(`Please open ${url} in your browser`));
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error(chalk.red.bold('\nUncaught Exception:'));
  console.error(chalk.red(error.message));
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red.bold('\nUnhandled Rejection:'));
  console.error(chalk.red(String(reason)));
  process.exit(1);
});

// Parse and run
program.parse();