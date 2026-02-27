/**
 * OpenCode Integration for Multiplatform Autonomous Agent System
 *
 * This module provides OpenCode specific adapters and configuration
 * for the Auto-Agent and Auto-Demo systems.
 *
 * Installation:
 *   npm install auto-agent-multiplatform
 *
 * Usage:
 *   import { AutoDemoSystem, AutoAgentSystem } from 'auto-agent-multiplatform/opencode';
 *
 *   // Initialize demo system
 *   const demo = new AutoDemoSystem();
 *   demo.startRecording({ name: 'My Demo' });
 *
 *   // ... perform actions ...
 *
 *   const result = demo.stopRecording();
 *   await demo.export(result, { format: 'html', outputPath: './demos' });
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// ============================================================================
// TYPES
// ============================================================================

const ActionType = {
  FILE_CREATE: 'file_create',
  FILE_EDIT: 'file_edit',
  FILE_DELETE: 'file_delete',
  COMMAND: 'command',
  TEST: 'test',
  GIT: 'git',
  BROWSER: 'browser'
};

const AgentRole = {
  ARCHITECT: 'architect',
  FRONTEND: 'frontend',
  BACKEND: 'backend',
  TESTING: 'testing',
  DOCS: 'docs',
  SECURITY: 'security',
  DEVOPS: 'devops',
  GENERAL: 'general'
};

// ============================================================================
// OPENCODE ADAPTER
// ============================================================================

class OpenCodeAdapter {
  constructor() {
    this.name = 'opencode';
    this.apiMode = 'standard';
  }

  /**
   * Execute a shell command
   */
  async executeCommand(command, args = []) {
    return new Promise((resolve) => {
      exec(`${command} ${args.join(' ')}`, { timeout: 300000 }, (error, stdout, stderr) => {
        resolve({
          stdout: stdout || '',
          stderr: stderr || (error?.message || ''),
          exitCode: error ? 1 : 0,
          success: !error
        });
      });
    });
  }

  /**
   * Read file contents
   */
  async readFile(filePath) {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  /**
   * Write content to file
   */
  async writeFile(filePath, content) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  /**
   * Get current git reference
   */
  async getGitRef() {
    const result = await this.executeCommand('git', ['rev-parse', 'HEAD']);
    return result.success ? result.stdout.trim() : null;
  }

  /**
   * Create a checkpoint
   */
  async createCheckpoint(state) {
    return {
      id: `checkpoint-${Date.now()}`,
      timestamp: new Date().toISOString(),
      state,
      gitRef: await this.getGitRef()
    };
  }
}

// ============================================================================
// DEMO RECORDER
// ============================================================================

class DemoRecorder {
  constructor(config) {
    this.config = config;
    this.actions = [];
    this.isRecording = false;
    this.startTime = null;
    this.actionCounter = 0;
  }

  start() {
    this.isRecording = true;
    this.startTime = new Date();
    this.actions = [];
    this.actionCounter = 0;
  }

  stop() {
    this.isRecording = false;
    const steps = this.groupActionsIntoSteps();
    return {
      id: `demo-${Date.now()}`,
      config: this.config,
      status: 'ready',
      steps,
      metadata: this.calculateMetadata(),
      createdAt: this.startTime,
      updatedAt: new Date()
    };
  }

  recordFileAction(type, filePath, before = null, after = null) {
    if (!this.isRecording) return;

    this.actions.push({
      id: `action-${++this.actionCounter}`,
      timestamp: new Date(),
      type,
      target: filePath,
      before,
      after,
      duration: Date.now() - this.startTime.getTime()
    });
  }

  recordCommand(command, output) {
    if (!this.isRecording) return;

    this.actions.push({
      id: `action-${++this.actionCounter}`,
      timestamp: new Date(),
      type: ActionType.COMMAND,
      target: 'terminal',
      command,
      output,
      duration: Date.now() - this.startTime.getTime()
    });
  }

  recordTest(testName, passed, output) {
    if (!this.isRecording) return;

    this.actions.push({
      id: `action-${++this.actionCounter}`,
      timestamp: new Date(),
      type: ActionType.TEST,
      target: testName,
      command: passed ? 'PASS' : 'FAIL',
      output,
      duration: Date.now() - this.startTime.getTime()
    });
  }

  explain(text) {
    if (this.actions.length > 0) {
      this.actions[this.actions.length - 1].explanation = text;
    }
  }

  groupActionsIntoSteps() {
    const steps = [];
    let currentStep = null;
    let stepOrder = 0;

    for (const action of this.actions) {
      if (action.type === ActionType.FILE_CREATE || !currentStep) {
        if (currentStep) steps.push(currentStep);

        currentStep = {
          id: `step-${++stepOrder}`,
          order: stepOrder,
          title: this.generateStepTitle(action),
          description: '',
          actions: [],
          annotations: [],
          navigation: {}
        };
      }

      currentStep.actions.push(action);

      if (action.type === ActionType.FILE_EDIT && action.after) {
        currentStep.code = action.after;
        currentStep.language = this.detectLanguage(action.target);
      }
    }

    if (currentStep) steps.push(currentStep);

    // Setup navigation
    for (let i = 0; i < steps.length; i++) {
      if (i > 0) steps[i].navigation.previous = steps[i - 1].id;
      if (i < steps.length - 1) steps[i].navigation.next = steps[i + 1].id;
    }

    return steps;
  }

  generateStepTitle(action) {
    const filename = action.target.split('/').pop();
    const titles = {
      [ActionType.FILE_CREATE]: `Create ${filename}`,
      [ActionType.FILE_EDIT]: `Update ${filename}`,
      [ActionType.FILE_DELETE]: `Delete ${filename}`,
      [ActionType.COMMAND]: `Run: ${action.command?.split(' ')[0] || 'Command'}`,
      [ActionType.TEST]: `Test: ${action.target}`,
      [ActionType.GIT]: `Git: ${action.command}`
    };
    return titles[action.type] || 'Step';
  }

  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const langMap = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.java': 'java',
      '.kt': 'kotlin',
      '.swift': 'swift',
      '.c': 'c',
      '.cpp': 'cpp',
      '.css': 'css',
      '.scss': 'scss',
      '.html': 'html',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.md': 'markdown',
      '.sh': 'bash'
    };
    return langMap[ext] || 'plaintext';
  }

  calculateMetadata() {
    const filesChanged = new Set();
    let commandsRun = 0;
    let testsPassed = 0;
    let testsFailed = 0;

    for (const action of this.actions) {
      if (action.type === ActionType.FILE_EDIT || action.type === ActionType.FILE_CREATE) {
        filesChanged.add(action.target);
      }
      if (action.type === ActionType.COMMAND) commandsRun++;
      if (action.type === ActionType.TEST) {
        if (action.command === 'PASS') testsPassed++;
        else testsFailed++;
      }
    }

    return {
      totalDuration: Date.now() - this.startTime.getTime(),
      filesChanged: Array.from(filesChanged),
      commandsRun,
      testsPassed,
      testsFailed,
      platform: 'opencode'
    };
  }
}

// ============================================================================
// DEMO EXPORTER
// ============================================================================

class DemoExporter {
  async export(demo, options) {
    const { format, outputPath } = options;

    switch (format) {
      case 'html':
        return this.exportHTML(demo, outputPath);
      case 'reveal':
        return this.exportReveal(demo, outputPath);
      case 'json':
        return this.exportJSON(demo, outputPath);
      default:
        throw new Error(`Unknown export format: ${format}`);
    }
  }

  async exportHTML(demo, outputPath) {
    const html = this.generateHTML(demo);
    const filePath = path.join(outputPath, `${demo.config.name}.html`);
    await fs.mkdir(outputPath, { recursive: true });
    await fs.writeFile(filePath, html, 'utf-8');
    return filePath;
  }

  generateHTML(demo) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${demo.config.name}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
  <style>
    :root {
      --primary: #6366f1;
      --bg: #0f172a;
      --fg: #f1f5f9;
      --muted: #64748b;
      --card: #1e293b;
      --border: #334155;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--fg);
      line-height: 1.6;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    header { margin-bottom: 3rem; text-align: center; }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .metadata { color: var(--muted); font-size: 0.9rem; }
    nav { position: fixed; left: 0; top: 0; width: 250px; height: 100vh; background: var(--card); padding: 2rem; overflow-y: auto; border-right: 1px solid var(--border); }
    nav a { display: block; padding: 0.5rem; color: var(--muted); text-decoration: none; border-radius: 4px; transition: all 0.2s; }
    nav a:hover, nav a.active { background: var(--primary); color: white; }
    main { margin-left: 270px; padding: 2rem; }
    .step { background: var(--card); border-radius: 8px; padding: 2rem; margin-bottom: 2rem; border: 1px solid var(--border); }
    .step h2 { color: var(--primary); margin-bottom: 1rem; }
    pre { background: #0d1117; border-radius: 8px; padding: 1rem; overflow-x: auto; }
    code { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
    .explanation { margin-top: 1rem; color: var(--muted); }
    .navigation { display: flex; justify-content: space-between; margin-top: 2rem; }
    .navigation button { padding: 0.75rem 1.5rem; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; }
    .navigation button:hover { opacity: 0.9; }
    .navigation button:disabled { opacity: 0.5; cursor: not-allowed; }
  </style>
</head>
<body>
  <nav>
    <h3 style="margin-bottom: 1rem; color: var(--fg);">Steps</h3>
    ${demo.steps.map((step, i) => `<a href="#step-${i + 1}" class="${i === 0 ? 'active' : ''}">${i + 1}. ${step.title}</a>`).join('\n    ')}
  </nav>
  <main>
    <header>
      <h1>${demo.config.name}</h1>
      <p class="metadata">${demo.metadata.filesChanged.length} files | ${demo.metadata.commandsRun} commands | ${demo.metadata.testsPassed} tests passed</p>
    </header>
    ${demo.steps.map((step, i) => `
    <section class="step" id="step-${i + 1}">
      <h2>Step ${i + 1}: ${step.title}</h2>
      ${step.code ? `<pre><code class="language-${step.language}">${this.escapeHtml(step.code)}</code></pre>` : ''}
      ${step.actions[0]?.explanation ? `<p class="explanation">${step.actions[0].explanation}</p>` : ''}
    </section>`).join('')}
    <div class="navigation">
      <button id="prev-btn" onclick="navigate(-1)" disabled>← Previous</button>
      <button id="next-btn" onclick="navigate(1)">Next →</button>
    </div>
  </main>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script>
    hljs.highlightAll();
    let currentStep = 0;
    const steps = document.querySelectorAll('.step');
    const navLinks = document.querySelectorAll('nav a');
    function navigate(delta) {
      currentStep = Math.max(0, Math.min(steps.length - 1, currentStep + delta));
      updateView();
    }
    function updateView() {
      steps.forEach((s, i) => s.style.display = i === currentStep ? 'block' : 'none');
      navLinks.forEach((a, i) => a.classList.toggle('active', i === currentStep));
      document.getElementById('prev-btn').disabled = currentStep === 0;
      document.getElementById('next-btn').disabled = currentStep === steps.length - 1;
      steps[currentStep].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    navLinks.forEach((a, i) => a.addEventListener('click', (e) => { e.preventDefault(); currentStep = i; updateView(); }));
    updateView();
  </script>
</body>
</html>`;
  }

  escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async exportReveal(demo, outputPath) {
    const markdown = `---
theme: black
---

# ${demo.config.name}

${demo.metadata.filesChanged.length} files | ${demo.metadata.commandsRun} commands

---

${demo.steps.map((step, i) => `## Step ${i + 1}: ${step.title}\n\n${step.code ? `\`\`\`${step.language || ''}\n${step.code}\n\`\`\`` : ''}\n\n---`).join('\n')}

# Thank You!`;

    const filePath = path.join(outputPath, `${demo.config.name}-reveal.md`);
    await fs.mkdir(outputPath, { recursive: true });
    await fs.writeFile(filePath, markdown, 'utf-8');
    return filePath;
  }

  async exportJSON(demo, outputPath) {
    const filePath = path.join(outputPath, `${demo.config.name}.json`);
    await fs.mkdir(outputPath, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(demo, null, 2), 'utf-8');
    return filePath;
  }
}

// ============================================================================
// AUTO DEMO SYSTEM
// ============================================================================

class AutoDemoSystem {
  constructor() {
    this.platform = 'opencode';
    this.adapter = new OpenCodeAdapter();
    this.recorder = null;
    this.exporter = new DemoExporter();
  }

  startRecording(config = {}) {
    const fullConfig = {
      id: `demo-${Date.now()}`,
      name: config.name || 'Untitled Demo',
      format: config.format || 'walkthrough',
      style: config.style || 'tutorial',
      outputPath: config.outputPath || './demos',
      captureTerminal: config.captureTerminal ?? true,
      captureBrowser: config.captureBrowser ?? false,
      excludePatterns: config.excludePatterns || ['node_modules/**', '*.log']
    };

    this.recorder = new DemoRecorder(fullConfig);
    this.recorder.start();
    return fullConfig.id;
  }

  stopRecording() {
    if (!this.recorder) return null;
    return this.recorder.stop();
  }

  recordAction(type, target, data = {}) {
    if (!this.recorder) return;

    switch (type) {
      case ActionType.FILE_CREATE:
      case ActionType.FILE_EDIT:
      case ActionType.FILE_DELETE:
        this.recorder.recordFileAction(type, target, data.before, data.after);
        break;
      case ActionType.COMMAND:
        this.recorder.recordCommand(data.command || '', data.output || '');
        break;
      case ActionType.TEST:
        this.recorder.recordTest(target, data.command === 'PASS', data.output || '');
        break;
    }
  }

  explain(text) {
    this.recorder?.explain(text);
  }

  async export(demo, options) {
    return this.exporter.export(demo, options);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  AutoDemoSystem,
  DemoRecorder,
  DemoExporter,
  OpenCodeAdapter,
  ActionType,
  AgentRole
};
