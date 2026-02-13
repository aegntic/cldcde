#!/usr/bin/env node
/**
 * Google Labs Extension - Main CLI
 * Access Google's experimental AI tools with OAuth and browser automation
 */

const { Command } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const GoogleLabs = require('./core/google-labs');
const AuthManager = require('./auth/auth-manager');
const WorkflowEngine = require('./workflows/workflow-engine');

const program = new Command();
const labs = new GoogleLabs();
const auth = new AuthManager();

program
  .name('glabs')
  .description('Google Suite Labs Extension - Access experimental AI tools')
  .version('1.0.0');

// Authentication
program
  .command('auth')
  .description('Authenticate with Google Labs (OAuth)')
  .option('--reset', 'Reset authentication and re-login')
  .action(async (options) => {
    console.log(chalk.cyan('\n🔐 Google Labs Authentication\n'));
    
    if (options.reset) {
      await auth.logout();
      console.log(chalk.yellow('✓ Previous authentication cleared'));
    }
    
    const success = await auth.authenticate();
    if (success) {
      console.log(chalk.green('\n✅ Authentication successful!'));
      console.log(chalk.gray('   You can now use all Google Labs tools\n'));
    } else {
      console.log(chalk.red('\n❌ Authentication failed'));
      console.log(chalk.gray('   Please try again\n'));
      process.exit(1);
    }
  });

// Interactive Mode
program
  .command('interactive')
  .alias('i')
  .description('Launch interactive tool selector')
  .action(async () => {
    await showInteractiveMenu();
  });

// Individual Tools
program
  .command('stitch <prompt>')
  .description('Use Google Stitch for visual storytelling')
  .option('-v, --variations <n>', 'Number of variations', '4')
  .option('-s, --style <style>', 'Visual style', 'cinematic')
  .option('-o, --output <dir>', 'Output directory', './output/stitch')
  .option('--headless', 'Run in headless mode')
  .option('--visible', 'Show browser window')
  .action(async (prompt, options) => {
    console.log(chalk.cyan(`\n🧵 Stitch: ${prompt}\n`));
    
    await labs.stitch({
      prompt,
      variations: parseInt(options.variations),
      style: options.style,
      outputDir: options.output,
      headless: !options.visible,
      visible: options.visible
    });
  });

program
  .command('whisk <input>')
  .description('Use Google Whisk to remix images')
  .option('-s, --style <style>', 'Target style', 'modern')
  .option('--strength <n>', 'Remix strength (0.1-1.0)', '0.7')
  .option('-o, --output <dir>', 'Output directory', './output/whisk')
  .option('--headless', 'Run in headless mode')
  .option('--visible', 'Show browser window')
  .action(async (input, options) => {
    console.log(chalk.cyan(`\n🎨 Whisk: Remixing ${input}\n`));
    
    await labs.whisk({
      input,
      style: options.style,
      strength: parseFloat(options.strength),
      outputDir: options.output,
      headless: !options.visible,
      visible: options.visible
    });
  });

program
  .command('flow <input>')
  .description('Use Google Flow to animate images')
  .option('-d, --duration <sec>', 'Animation duration', '3')
  .option('--fps <n>', 'Frames per second', '30')
  .option('-s, --style <style>', 'Motion style', 'smooth')
  .option('-o, --output <dir>', 'Output directory', './output/flow')
  .option('--headless', 'Run in headless mode')
  .option('--visible', 'Show browser window')
  .action(async (input, options) => {
    console.log(chalk.cyan(`\n🌊 Flow: Animating ${input}\n`));
    
    await labs.flow({
      input,
      duration: parseInt(options.duration),
      fps: parseInt(options.fps),
      style: options.style,
      outputDir: options.output,
      headless: !options.visible,
      visible: options.visible
    });
  });

program
  .command('musicfx <prompt>')
  .description('Use MusicFX to generate AI music')
  .option('-d, --duration <sec>', 'Music duration', '30')
  .option('-g, --genre <genre>', 'Music genre', 'electronic')
  .option('-o, --output <dir>', 'Output directory', './output/musicfx')
  .action(async (prompt, options) => {
    console.log(chalk.cyan(`\n🎵 MusicFX: ${prompt}\n`));
    
    await labs.musicfx({
      prompt,
      duration: parseInt(options.duration),
      genre: options.genre,
      outputDir: options.output
    });
  });

program
  .command('imagefx <prompt>')
  .description('Use ImageFX for advanced image editing')
  .option('-e, --edit <type>', 'Edit type (enhance, stylize, expand)', 'enhance')
  .option('-o, --output <dir>', 'Output directory', './output/imagefx')
  .action(async (prompt, options) => {
    console.log(chalk.cyan(`\n🖼️  ImageFX: ${prompt}\n`));
    
    await labs.imagefx({
      prompt,
      editType: options.edit,
      outputDir: options.output
    });
  });

// Compound Workflows
program
  .command('pipeline')
  .description('Run compound workflow across multiple tools')
  .requiredOption('-i, --input <text>', 'Input prompt or concept')
  .requiredOption('-t, --tools <list>', 'Comma-separated tools (stitch,whisk,flow)')
  .option('-o, --output <dir>', 'Output directory', './output/pipeline')
  .option('--headless', 'Run in headless mode')
  .action(async (options) => {
    console.log(chalk.cyan(`\n🔗 Compound Pipeline\n`));
    console.log(chalk.gray(`Input: ${options.input}`));
    console.log(chalk.gray(`Tools: ${options.tools}\n`));
    
    const workflow = new WorkflowEngine();
    await workflow.execute({
      input: options.input,
      tools: options.tools.split(','),
      outputDir: options.output,
      headless: options.headless
    });
  });

program
  .command('batch')
  .description('Process multiple inputs with workflow')
  .requiredOption('-i, --input <dir>', 'Input directory')
  .requiredOption('-w, --workflow <steps>', 'Workflow steps (e.g., stitch→whisk→flow)')
  .option('-o, --output <dir>', 'Output directory', './output/batch')
  .option('--parallel <n>', 'Parallel jobs', '2')
  .action(async (options) => {
    console.log(chalk.cyan(`\n📦 Batch Processing\n`));
    console.log(chalk.gray(`Input: ${options.input}`));
    console.log(chalk.gray(`Workflow: ${options.workflow}\n`));
    
    const workflow = new WorkflowEngine();
    await workflow.batch({
      inputDir: options.input,
      workflow: options.workflow,
      outputDir: options.output,
      parallel: parseInt(options.parallel)
    });
  });

// Status & Info
program
  .command('status')
  .description('Check authentication status')
  .action(async () => {
    const status = await auth.checkStatus();
    
    if (status.authenticated) {
      console.log(chalk.green('\n✅ Authenticated'));
      console.log(chalk.gray(`   Account: ${status.email}`));
      console.log(chalk.gray(`   Token expires: ${status.expires}\n`));
    } else {
      console.log(chalk.yellow('\n⚠️  Not authenticated'));
      console.log(chalk.gray('   Run: glabs auth\n'));
    }
  });

program
  .command('list')
  .alias('ls')
  .description('List available tools')
  .action(() => {
    console.log(chalk.cyan('\n🧰 Available Google Labs Tools\n'));
    
    const tools = [
      { name: 'Stitch', desc: 'Visual storytelling and storyboards', emoji: '🧵' },
      { name: 'Whisk', desc: 'Image remixing and style transfer', emoji: '🎨' },
      { name: 'Flow', desc: 'Animation and motion generation', emoji: '🌊' },
      { name: 'MusicFX', desc: 'AI music generation', emoji: '🎵' },
      { name: 'ImageFX', desc: 'Advanced image editing', emoji: '🖼️' },
      { name: 'VideoFX', desc: 'AI video creation', emoji: '🎬' },
      { name: 'TextFX', desc: 'Creative text generation', emoji: '📝' }
    ];
    
    tools.forEach(tool => {
      console.log(`  ${tool.emoji} ${chalk.bold(tool.name)}`);
      console.log(`     ${tool.desc}\n`);
    });
  });

// Show help if no command
if (process.argv.length === 2) {
  console.log(chalk.cyan(`
🧪 GOOGLE SUITE LABS EXTENSION v1.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Unlock Google's experimental AI tools:
  🧵 Stitch - Visual storytelling
  🎨 Whisk - Image remixing  
  🌊 Flow - Animation & motion
  🎵 MusicFX - AI music
  🖼️  ImageFX - Advanced editing

Quick Start:
  glabs auth                    # Authenticate
  glabs interactive             # Interactive menu
  glabs stitch "your prompt"    # Use individual tool
  glabs pipeline -i "prompt" -t stitch,whisk,flow

🔗 Compound workflows for enhanced results
🛡️  OAuth authentication with secure token storage
🌐 Browser automation with stealth mode

Run 'glabs --help' for all commands
  `));
  program.help();
}

program.parse(process.argv);

// Interactive Menu Function
async function showInteractiveMenu() {
  console.log(chalk.cyan('\n🧪 Google Labs Interactive Menu\n'));
  
  const tools = [
    { name: '🧵 Stitch - Visual Storytelling', value: 'stitch' },
    { name: '🎨 Whisk - Image Remix', value: 'whisk' },
    { name: '🌊 Flow - Animation', value: 'flow' },
    { name: '🎵 MusicFX - AI Music', value: 'musicfx' },
    { name: '🖼️  ImageFX - Image Editing', value: 'imagefx' },
    { name: '🔗 Compound Pipeline', value: 'pipeline' },
    { name: '📦 Batch Processing', value: 'batch' }
  ];
  
  while (true) {
    const { tool } = await inquirer.prompt([{
      type: 'list',
      name: 'tool',
      message: 'Select a tool:',
      choices: [
        ...tools,
        new inquirer.Separator(),
        { name: '❌ Exit', value: 'exit' }
      ],
      pageSize: 10
    }]);
    
    if (tool === 'exit') {
      console.log(chalk.green('\n✨ Goodbye!\n'));
      process.exit(0);
    }
    
    if (tool === 'pipeline' || tool === 'batch') {
      console.log(chalk.yellow(`\n${tool} workflow - Use command line for complex options`));
      console.log(chalk.gray(`Run: glabs ${tool} --help\n`));
      continue;
    }
    
    const { input } = await inquirer.prompt([{
      type: 'input',
      name: 'input',
      message: `Enter your ${tool} prompt or input:`,
      validate: (val) => val.length > 0 || 'Input required'
    }]);
    
    const { visible } = await inquirer.prompt([{
      type: 'confirm',
      name: 'visible',
      message: 'Show browser window?',
      default: false
    }]);
    
    console.log(chalk.cyan(`\n▶️  Running ${tool}...\n`));
    
    try {
      await labs[tool]({
        prompt: input,
        visible,
        headless: !visible,
        outputDir: `./output/${tool}`
      });
      
      console.log(chalk.green('\n✅ Complete!'));
    } catch (error) {
      console.log(chalk.red(`\n❌ Error: ${error.message}`));
    }
    
    const { again } = await inquirer.prompt([{
      type: 'confirm',
      name: 'again',
      message: 'Run another tool?',
      default: true
    }]);
    
    if (!again) {
      console.log(chalk.green('\n✨ Goodbye!\n'));
      process.exit(0);
    }
  }
}