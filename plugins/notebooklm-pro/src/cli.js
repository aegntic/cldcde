#!/usr/bin/env node
/**
 * NotebookLM Pro - Main CLI
 * Advanced conversational research and document analysis
 */

const { Command } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const NotebookLM = require('./core/notebooklm');
const AuthManager = require('./auth/auth-manager');
const { ModelManager } = require('./config/models');

const program = new Command();
const nb = new NotebookLM();
const auth = new AuthManager();
const modelManager = new ModelManager();

program
  .name('notebooklm')
  .alias('nbpro')
  .description('NotebookLM Pro - Advanced research and document analysis')
  .version('1.0.0');

// Authentication
program
  .command('auth')
  .description('Authenticate with Google')
  .option('--reset', 'Reset authentication')
  .option('--switch', 'Switch Google account')
  .action(async (options) => {
    console.log(chalk.cyan('\n📓 NotebookLM Pro Authentication\n'));
    
    if (options.reset) {
      await auth.logout();
      console.log(chalk.yellow('✓ Previous session cleared'));
    }
    
    const success = await auth.authenticate();
    if (success) {
      console.log(chalk.green('\n✅ Authenticated successfully!'));
      console.log(chalk.gray('   Ready to analyze documents\n'));
    } else {
      console.log(chalk.red('\n❌ Authentication failed\n'));
      process.exit(1);
    }
  });

// Model Management
program
  .command('model')
  .description('Manage Gemini model settings')
  .option('-l, --list', 'List all available models')
  .option('-s, --set <model>', 'Set active model')
  .option('--recommended', 'Show recommended models only')
  .action(async (options) => {
    if (options.list || (!options.set && !options.recommended)) {
      // Show all models
      console.log(modelManager.formatModelList());
      
      const current = modelManager.getCurrentModel();
      console.log(chalk.cyan(`\nCurrent Model: ${current.name} (${current.id})\n`));
    } else if (options.recommended) {
      // Show recommended models
      console.log('\n' + chalk.yellow('Recommended Models:'));
      const recommended = modelManager.getRecommendedModels();
      Object.entries(recommended).forEach(([id, info]) => {
        console.log(`\n  ${chalk.green('•')} ${chalk.bold(info.name)}`);
        console.log(`    ${info.description}`);
        console.log(`    ${chalk.gray(`Context: ${(info.contextWindow / 1024 / 1024).toFixed(1)}M tokens`)}`);
      });
      console.log('');
    } else if (options.set) {
      // Set model
      if (modelManager.validateModel(options.set)) {
        modelManager.setModel(options.set);
        const model = modelManager.getCurrentModel();
        console.log(chalk.green(`\n✅ Model set to: ${model.name}`));
        console.log(chalk.gray(`   ${model.description}`));
        console.log(chalk.gray(`   Context window: ${(model.contextWindow / 1024 / 1024).toFixed(1)}M tokens\n`));
      } else {
        console.log(chalk.red(`\n❌ Invalid model: ${options.set}`));
        console.log(chalk.gray('   Run "notebooklm model --list" to see available models\n'));
        process.exit(1);
      }
    }
  });

program
  .command('models')
  .description('Interactive model selector')
  .action(async () => {
    const models = modelManager.getAllModels();
    
    const { selectedModel } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedModel',
      message: 'Select a Gemini model:',
      choices: Object.entries(models).map(([id, info]) => ({
        name: `${info.name} - ${info.description} ${info.recommended ? '(Recommended)' : ''}`,
        value: id
      })),
      pageSize: 15
    }]);
    
    modelManager.setModel(selectedModel);
    const model = modelManager.getCurrentModel();
    
    console.log(chalk.green(`\n✅ Switched to: ${model.name}`));
    console.log(chalk.gray(`   ${model.description}\n`));
  });

// Notebook Management
program
  .command('create <name>')
  .description('Create a new notebook')
  .option('-d, --description <text>', 'Notebook description')
  .option('-t, --type <type>', 'Notebook type (research|educational|business)', 'research')
  .action(async (name, options) => {
    const notebook = await nb.createNotebook(name, options);
    console.log(chalk.green(`\n✅ Created notebook: ${notebook.name}`));
    console.log(chalk.gray(`   ID: ${notebook.id}\n`));
  });

program
  .command('list')
  .alias('ls')
  .description('List all notebooks')
  .action(async () => {
    const notebooks = await nb.listNotebooks();
    
    console.log(chalk.cyan('\n📚 Your Notebooks\n'));
    
    if (notebooks.length === 0) {
      console.log(chalk.gray('   No notebooks yet. Create one with: notebooklm create <name>\n'));
      return;
    }
    
    notebooks.forEach(nb => {
      console.log(`  📓 ${chalk.bold(nb.name)}`);
      console.log(`     ${chalk.gray(nb.description || 'No description')}`);
      console.log(`     ${chalk.gray(`${nb.documents} documents · ${nb.lastModified}\n`)}`);
    });
  });

program
  .command('delete <name>')
  .description('Delete a notebook')
  .option('-f, --force', 'Force delete without confirmation')
  .action(async (name, options) => {
    if (!options.force) {
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `Delete notebook "${name}"?`,
        default: false
      }]);
      
      if (!confirm) {
        console.log(chalk.yellow('\nCancelled\n'));
        return;
      }
    }
    
    await nb.deleteNotebook(name);
    console.log(chalk.green(`\n✅ Deleted notebook: ${name}\n`));
  });

// Document Upload
program
  .command('upload <files...>')
  .description('Upload documents to notebook')
  .requiredOption('-n, --notebook <name>', 'Target notebook')
  .option('-c, --collection <name>', 'Collection/tag for documents')
  .action(async (files, options) => {
    console.log(chalk.cyan(`\n📤 Uploading to: ${options.notebook}\n`));
    
    for (const file of files) {
      try {
        console.log(`  Uploading: ${file}`);
        await nb.uploadDocument(file, options.notebook, options.collection);
        console.log(chalk.green(`  ✓ Uploaded\n`));
      } catch (error) {
        console.log(chalk.red(`  ✗ Failed: ${error.message}\n`));
      }
    }
    
    console.log(chalk.green('✅ Upload complete\n'));
  });

program
  .command('add-url <url>')
  .description('Add web page to notebook')
  .requiredOption('-n, --notebook <name>', 'Target notebook')
  .option('-t, --tag <tag>', 'Tag for organization')
  .action(async (url, options) => {
    console.log(chalk.cyan(`\n🌐 Adding URL to: ${options.notebook}\n`));
    await nb.addUrl(url, options.notebook, options.tag);
    console.log(chalk.green('✅ Added to notebook\n'));
  });

program
  .command('add-video <url>')
  .description('Add YouTube video (with transcription)')
  .requiredOption('-n, --notebook <name>', 'Target notebook')
  .option('--transcribe', 'Auto-transcribe video', true)
  .action(async (url, options) => {
    console.log(chalk.cyan(`\n📺 Processing video\n`));
    console.log(chalk.gray(`URL: ${url}`));
    
    if (options.transcribe) {
      console.log('  🎵 Transcribing audio...');
    }
    
    await nb.addVideo(url, options.notebook, options.transcribe);
    console.log(chalk.green('\n✅ Video added to notebook\n'));
  });

// Conversational Research
program
  .command('chat')
  .alias('conversation')
  .description('Start interactive research session')
  .requiredOption('-n, --notebook <name>', 'Notebook to query')
  .option('-m, --model <model>', 'Gemini model to use', modelManager.getCurrentModel().id)
  .action(async (options) => {
    const modelId = options.model || modelManager.getCurrentModel().id;
    const model = modelManager.getModel(modelId);
    
    console.log(chalk.cyan(`\n💬 Research Session: ${options.notebook}\n`));
    console.log(chalk.gray(`Model: ${model.name}\n`));
    console.log(chalk.gray('Type your questions (or "exit" to quit, "model" to change model)\n'));
    
    const session = await nb.startSession(options.notebook, { model: modelId });
    
    while (true) {
      const { question } = await inquirer.prompt([{
        type: 'input',
        name: 'question',
        message: chalk.cyan('You:'),
        validate: (val) => val.length > 0 || 'Question required'
      }]);
      
      if (question.toLowerCase() === 'exit') {
        console.log(chalk.green('\n✨ Session ended\n'));
        break;
      }
      
      if (question.toLowerCase() === 'model') {
        // Interactive model switcher
        const models = modelManager.getAllModels();
        const { newModel } = await inquirer.prompt([{
          type: 'list',
          name: 'newModel',
          message: 'Select model:',
          choices: Object.entries(models).map(([id, info]) => ({
            name: `${info.name} - ${info.description}`,
            value: id
          })),
          pageSize: 10
        }]);
        
        session.setModel(newModel);
        const selectedModel = modelManager.getModel(newModel);
        console.log(chalk.green(`\n✅ Switched to: ${selectedModel.name}\n`));
        continue;
      }
      
      console.log(chalk.gray('\n🤖 Thinking...\n'));
      
      try {
        const response = await session.ask(question);
        
        console.log(chalk.yellow('NotebookLM:'));
        console.log(response.text);
        
        if (response.citations && response.citations.length > 0) {
          console.log(chalk.gray(`\n📚 Sources: ${response.citations.join(', ')}`));
        }
        
        console.log('');
      } catch (error) {
        console.log(chalk.red(`\n❌ Error: ${error.message}\n`));
      }
    }
  });

program
  .command('ask <question>')
  .description('Ask a single question')
  .requiredOption('-n, --notebook <name>', 'Notebook to query')
  .option('--context', 'Include conversation context', false)
  .option('-m, --model <model>', 'Gemini model to use', modelManager.getCurrentModel().id)
  .action(async (question, options) => {
    console.log(chalk.cyan(`\n❓ ${question}\n`));
    
    // Show which model is being used
    const modelId = options.model || modelManager.getCurrentModel().id;
    const model = modelManager.getModel(modelId);
    console.log(chalk.gray(`🤖 Analyzing with ${model.name}...\n`));
    
    const response = await nb.ask(question, options.notebook, {
      context: options.context,
      model: modelId
    });
    
    console.log(chalk.yellow('Answer:'));
    console.log(response.text);
    
    if (response.citations && response.citations.length > 0) {
      console.log(chalk.gray(`\n📚 Sources:`));
      response.citations.forEach(cite => {
        console.log(chalk.gray(`  • ${cite}`));
      });
    }
    
    console.log('');
  });

// Synthesis & Analysis
program
  .command('synthesize')
  .description('Generate synthesis of notebook')
  .requiredOption('-n, --notebook <name>', 'Notebook to synthesize')
  .option('-f, --format <format>', 'Output format (executive-summary|detailed|bullet-points)', 'executive-summary')
  .option('-o, --output <file>', 'Output file')
  .option('-m, --model <model>', 'Gemini model to use', modelManager.getCurrentModel().id)
  .action(async (options) => {
    const modelId = options.model || modelManager.getCurrentModel().id;
    const model = modelManager.getModel(modelId);
    
    console.log(chalk.cyan(`\n🧬 Synthesizing: ${options.notebook}\n`));
    console.log(chalk.gray(`Format: ${options.format}`));
    console.log(chalk.gray(`Model: ${model.name}\n`));
    
    const synthesis = await nb.synthesize(options.notebook, {
      format: options.format,
      model: modelId
    });
    
    if (options.output) {
      await nb.saveToFile(synthesis, options.output);
      console.log(chalk.green(`✅ Saved to: ${options.output}\n`));
    } else {
      console.log(synthesis);
      console.log('');
    }
  });

program
  .command('compare')
  .description('Compare sources in notebook')
  .requiredOption('-n, --notebook <name>', 'Notebook')
  .option('--sources <list>', 'Specific sources to compare (comma-separated)')
  .option('--topic <topic>', 'Topic to focus comparison on')
  .action(async (options) => {
    console.log(chalk.cyan(`\n⚖️  Comparing sources in: ${options.notebook}\n`));
    
    if (options.topic) {
      console.log(chalk.gray(`Topic: ${options.topic}\n`));
    }
    
    const comparison = await nb.compare(options.notebook, options.sources, options.topic);
    
    console.log(chalk.yellow('Comparison:'));
    console.log(comparison);
    console.log('');
  });

program
  .command('analyze')
  .description('Analyze notebook content')
  .requiredOption('-n, --notebook <name>', 'Notebook')
  .option('--detect-contradictions', 'Find contradictions between sources')
  .option('--find-gaps', 'Identify knowledge gaps')
  .option('--themes', 'Extract main themes')
  .action(async (options) => {
    console.log(chalk.cyan(`\n🔍 Analyzing: ${options.notebook}\n`));
    
    const analysis = await nb.analyze(options.notebook, {
      contradictions: options.detectContradictions,
      gaps: options.findGaps,
      themes: options.themes
    });
    
    console.log(analysis);
    console.log('');
  });

// Audio Generation
program
  .command('audio')
  .description('Generate audio from notebook')
  .requiredOption('-n, --notebook <name>', 'Notebook')
  .option('-f, --format <format>', 'Format (podcast|deep-dive|summary)', 'podcast')
  .option('-l, --length <duration>', 'Length (15min|30min|1hr)', '30min')
  .option('-v, --voices <n>', 'Number of voices', '2')
  .option('-o, --output <file>', 'Output file')
  .action(async (options) => {
    console.log(chalk.cyan(`\n🎵 Generating Audio\n`));
    console.log(chalk.gray(`Notebook: ${options.notebook}`));
    console.log(chalk.gray(`Format: ${options.format}`));
    console.log(chalk.gray(`Length: ${options.length}\n`));
    
    const audio = await nb.generateAudio(options.notebook, {
      format: options.format,
      length: options.length,
      voices: parseInt(options.voices)
    });
    
    const outputFile = options.output || `./${options.notebook}-audio.mp3`;
    await nb.saveAudio(audio, outputFile);
    
    console.log(chalk.green(`✅ Audio saved: ${outputFile}\n`));
  });

// Export
program
  .command('export')
  .description('Export notebook')
  .requiredOption('-n, --notebook <name>', 'Notebook')
  .requiredOption('-f, --format <format>', 'Format (markdown|pdf|json)', 'markdown')
  .option('-o, --output <file>', 'Output file')
  .action(async (options) => {
    console.log(chalk.cyan(`\n📤 Exporting: ${options.notebook}\n`));
    console.log(chalk.gray(`Format: ${options.format}\n`));
    
    const exported = await nb.export(options.notebook, options.format);
    
    const outputFile = options.output || `./${options.notebook}.${options.format}`;
    await nb.saveToFile(exported, outputFile);
    
    console.log(chalk.green(`✅ Exported: ${outputFile}\n`));
  });

// Study Tools
program
  .command('study-guide')
  .description('Generate study materials')
  .requiredOption('-n, --notebook <name>', 'Notebook')
  .option('--format <format>', 'Format (flashcards|outline|quiz)', 'flashcards')
  .option('-o, --output <file>', 'Output file')
  .action(async (options) => {
    console.log(chalk.cyan(`\n📚 Generating Study Guide\n`));
    
    const guide = await nb.generateStudyGuide(options.notebook, options.format);
    
    if (options.output) {
      await nb.saveToFile(guide, options.output);
      console.log(chalk.green(`✅ Saved: ${options.output}\n`));
    } else {
      console.log(guide);
      console.log('');
    }
  });

// Status
program
  .command('status')
  .description('Check authentication status')
  .action(async () => {
    const status = await auth.checkStatus();
    
    if (status.authenticated) {
      console.log(chalk.green('\n✅ Authenticated'));
      console.log(chalk.gray(`   Account: ${status.email}`));
      console.log(chalk.gray(`   Expires: ${status.expires}\n`));
    } else {
      console.log(chalk.yellow('\n⚠️  Not authenticated'));
      console.log(chalk.gray('   Run: notebooklm auth\n'));
    }
  });

// Show help if no command
if (process.argv.length === 2) {
  const currentModel = modelManager.getCurrentModel();
  
  console.log(chalk.cyan(`
📓 NOTEBOOKLM PRO v1.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Advanced conversational research with session-based RAG

🎯 Core Features:
  • Multi-source document analysis
  • Session-based context retention  
  • Conversational research
  • Knowledge synthesis
  • Audio generation

🤖 Current Model: ${currentModel.name}
   Context: ${(currentModel.contextWindow / 1024 / 1024).toFixed(1)}M tokens

Quick Start:
  notebooklm auth                    # Authenticate
  notebooklm create "My Research"    # Create notebook
  notebooklm upload doc.pdf -n "My Research"
  notebooklm chat -n "My Research"   # Interactive session

Model Management:
  notebooklm model --list            # List all models
  notebooklm model --recommended     # Show recommended models
  notebooklm model --set gemini-2.0-flash  # Change model
  notebooklm models                  # Interactive model selector

Run 'notebooklm --help' for all commands
  `));
  program.help();
}

program.parse(process.argv);