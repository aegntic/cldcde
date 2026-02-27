/**
 * Auto-Demo Core: Multiplatform Automatic Demo Generation System
 * Creates interactive walkthroughs, presentations, and recordings
 *
 * Platforms: Claude Code, Agent-Zero, OpenCode, OpenClaw
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type DemoFormat = 'walkthrough' | 'presentation' | 'video' | 'pdf';
export type DemoStyle = 'tutorial' | 'overview' | 'deep-dive' | 'showcase';
export type DemoStatus = 'recording' | 'processing' | 'ready' | 'exporting' | 'error';
export type ActionType = 'file_create' | 'file_edit' | 'file_delete' | 'command' | 'test' | 'git' | 'browser';

export interface DemoConfig {
  id: string;
  name: string;
  format: DemoFormat;
  style: DemoStyle;
  outputPath: string;
  captureTerminal: boolean;
  captureBrowser: boolean;
  enableNarration: boolean;
  excludePatterns: string[];
}

export interface RecordedAction {
  id: string;
  timestamp: Date;
  type: ActionType;
  target: string;
  before?: string;
  after?: string;
  command?: string;
  output?: string;
  explanation?: string;
  screenshot?: string;
  duration: number;
}

export interface DemoStep {
  id: string;
  order: number;
  title: string;
  description: string;
  actions: RecordedAction[];
  code?: string;
  language?: string;
  annotations: Annotation[];
  navigation: {
    previous?: string;
    next?: string;
  };
}

export interface Annotation {
  id: string;
  lineStart: number;
  lineEnd: number;
  text: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

export interface Demo {
  id: string;
  config: DemoConfig;
  status: DemoStatus;
  steps: DemoStep[];
  metadata: DemoMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface DemoMetadata {
  totalDuration: number;
  filesChanged: string[];
  commandsRun: number;
  testsPassed: number;
  testsFailed: number;
  platform: string;
}

export interface ExportOptions {
  format: 'html' | 'reveal' | 'marp' | 'slidev' | 'pdf' | 'video';
  outputPath: string;
  theme?: string;
  includeNarration?: boolean;
  videoSettings?: VideoSettings;
}

export interface VideoSettings {
  codec: 'libx264' | 'libx265' | 'vp9';
  fps: number;
  resolution: '720p' | '1080p' | '4k';
  includeChapters: boolean;
}

// ============================================================================
// DEMO RECORDER
// ============================================================================

export class DemoRecorder {
  private config: DemoConfig;
  private actions: RecordedAction[] = [];
  private isRecording: boolean = false;
  private startTime: Date | null = null;
  private actionCounter: number = 0;

  constructor(config: DemoConfig) {
    this.config = config;
  }

  /**
   * Start recording a demo session
   */
  start(): void {
    this.isRecording = true;
    this.startTime = new Date();
    this.actions = [];
    this.actionCounter = 0;
  }

  /**
   * Stop recording and return the recorded demo
   */
  stop(): Demo {
    this.isRecording = false;

    const steps = this.groupActionsIntoSteps();
    const metadata = this.calculateMetadata();

    return {
      id: this.config.id,
      config: this.config,
      status: 'ready',
      steps,
      metadata,
      createdAt: this.startTime!,
      updatedAt: new Date()
    };
  }

  /**
   * Record a file action
   */
  recordFileAction(
    type: 'file_create' | 'file_edit' | 'file_delete',
    path: string,
    before?: string,
    after?: string
  ): void {
    if (!this.isRecording) return;
    if (this.shouldExclude(path)) return;

    this.actions.push({
      id: `action-${++this.actionCounter}`,
      timestamp: new Date(),
      type,
      target: path,
      before,
      after,
      duration: Date.now() - (this.startTime?.getTime() || 0)
    });
  }

  /**
   * Record a terminal command
   */
  recordCommand(command: string, output: string): void {
    if (!this.isRecording) return;

    this.actions.push({
      id: `action-${++this.actionCounter}`,
      timestamp: new Date(),
      type: 'command',
      target: 'terminal',
      command,
      output,
      duration: Date.now() - (this.startTime?.getTime() || 0)
    });
  }

  /**
   * Record a test result
   */
  recordTest(testName: string, passed: boolean, output: string): void {
    if (!this.isRecording) return;

    this.actions.push({
      id: `action-${++this.actionCounter}`,
      timestamp: new Date(),
      type: 'test',
      target: testName,
      command: passed ? 'PASS' : 'FAIL',
      output,
      duration: Date.now() - (this.startTime?.getTime() || 0)
    });
  }

  /**
   * Record a git operation
   */
  recordGit(command: string, output: string): void {
    if (!this.isRecording) return;

    this.actions.push({
      id: `action-${++this.actionCounter}`,
      timestamp: new Date(),
      type: 'git',
      target: 'git',
      command,
      output,
      duration: Date.now() - (this.startTime?.getTime() || 0)
    });
  }

  /**
   * Add explanation to the last recorded action
   */
  explain(explanation: string): void {
    if (this.actions.length === 0) return;
    this.actions[this.actions.length - 1].explanation = explanation;
  }

  /**
   * Take a screenshot of current state
   */
  async captureScreenshot(): Promise<string> {
    // Platform-specific screenshot capture
    // Returns base64 encoded image or file path
    return '';
  }

  private shouldExclude(path: string): boolean {
    return this.config.excludePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(path);
    });
  }

  private groupActionsIntoSteps(): DemoStep[] {
    const steps: DemoStep[] = [];
    let currentStep: DemoStep | null = null;
    let stepOrder = 0;

    for (const action of this.actions) {
      // Start new step on file creation or significant action
      if (action.type === 'file_create' || !currentStep) {
        if (currentStep) {
          steps.push(currentStep);
        }
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

      // Extract code if file action
      if (action.type === 'file_edit' && action.after) {
        currentStep.code = action.after;
        currentStep.language = this.detectLanguage(action.target);
      }
    }

    if (currentStep) {
      steps.push(currentStep);
    }

    // Set up navigation
    for (let i = 0; i < steps.length; i++) {
      if (i > 0) steps[i].navigation.previous = steps[i - 1].id;
      if (i < steps.length - 1) steps[i].navigation.next = steps[i + 1].id;
    }

    return steps;
  }

  private generateStepTitle(action: RecordedAction): string {
    switch (action.type) {
      case 'file_create':
        return `Create ${this.getFileName(action.target)}`;
      case 'file_edit':
        return `Update ${this.getFileName(action.target)}`;
      case 'file_delete':
        return `Delete ${this.getFileName(action.target)}`;
      case 'command':
        return `Run: ${action.command?.split(' ')[0] || 'Command'}`;
      case 'test':
        return `Test: ${action.target}`;
      case 'git':
        return `Git: ${action.command}`;
      default:
        return 'Step';
    }
  }

  private getFileName(path: string): string {
    return path.split('/').pop() || path;
  }

  private detectLanguage(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'java': 'java',
      'kt': 'kotlin',
      'swift': 'swift',
      'c': 'c',
      'cpp': 'cpp',
      'css': 'css',
      'scss': 'scss',
      'html': 'html',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sh': 'bash'
    };
    return langMap[ext || ''] || 'plaintext';
  }

  private calculateMetadata(): DemoMetadata {
    const filesChanged = new Set<string>();
    let commandsRun = 0;
    let testsPassed = 0;
    let testsFailed = 0;

    for (const action of this.actions) {
      if (action.type === 'file_edit' || action.type === 'file_create') {
        filesChanged.add(action.target);
      }
      if (action.type === 'command') {
        commandsRun++;
      }
      if (action.type === 'test') {
        if (action.command === 'PASS') testsPassed++;
        else testsFailed++;
      }
    }

    return {
      totalDuration: Date.now() - (this.startTime?.getTime() || 0),
      filesChanged: Array.from(filesChanged),
      commandsRun,
      testsPassed,
      testsFailed,
      platform: 'multiplatform'
    };
  }
}

// ============================================================================
// DEMO GENERATOR
// ============================================================================

export class DemoGenerator {
  /**
   * Generate a demo from existing code without recording
   */
  async generateFromCode(
    path: string,
    style: DemoStyle,
    options: Partial<DemoConfig> = {}
  ): Promise<Demo> {
    const config: DemoConfig = {
      id: `demo-${Date.now()}`,
      name: path.split('/').pop() || 'Code Demo',
      format: 'walkthrough',
      style,
      outputPath: './demos',
      captureTerminal: false,
      captureBrowser: false,
      enableNarration: false,
      excludePatterns: [],
      ...options
    };

    const steps = await this.analyzeCode(path, style);

    return {
      id: config.id,
      config,
      status: 'ready',
      steps,
      metadata: {
        totalDuration: 0,
        filesChanged: [path],
        commandsRun: 0,
        testsPassed: 0,
        testsFailed: 0,
        platform: 'multiplatform'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Generate an interactive walkthrough from a task description
   */
  async generateWalkthrough(
    taskDescription: string,
    options: { interactive?: boolean; narrate?: boolean } = {}
  ): Promise<Demo> {
    // This would integrate with the autonomous agent system
    // to execute the task and record the steps
    const config: DemoConfig = {
      id: `walkthrough-${Date.now()}`,
      name: taskDescription.slice(0, 50),
      format: 'walkthrough',
      style: 'tutorial',
      outputPath: './demos',
      captureTerminal: true,
      captureBrowser: options.interactive || false,
      enableNarration: options.narrate || false,
      excludePatterns: ['node_modules/**', '*.log', '.git/**']
    };

    // Would use AutoAgent to execute and record
    const steps: DemoStep[] = [];

    return {
      id: config.id,
      config,
      status: 'ready',
      steps,
      metadata: {
        totalDuration: 0,
        filesChanged: [],
        commandsRun: 0,
        testsPassed: 0,
        testsFailed: 0,
        platform: 'multiplatform'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async analyzeCode(path: string, style: DemoStyle): Promise<DemoStep[]> {
    // Analyze code structure and generate steps
    // This is a placeholder - real implementation would parse the code
    const steps: DemoStep[] = [];

    switch (style) {
      case 'tutorial':
        // Break down into learning steps
        break;
      case 'overview':
        // High-level structure overview
        break;
      case 'deep-dive':
        // Detailed analysis of each component
        break;
      case 'showcase':
        // Highlight key features
        break;
    }

    return steps;
  }
}

// ============================================================================
// DEMO EXPORTER
// ============================================================================

export class DemoExporter {
  /**
   * Export demo to specified format
   */
  async export(demo: Demo, options: ExportOptions): Promise<string> {
    switch (options.format) {
      case 'html':
        return this.exportHTML(demo, options);
      case 'reveal':
        return this.exportReveal(demo, options);
      case 'marp':
        return this.exportMarp(demo, options);
      case 'slidev':
        return this.exportSlidev(demo, options);
      case 'pdf':
        return this.exportPDF(demo, options);
      case 'video':
        return this.exportVideo(demo, options);
      default:
        throw new Error(`Unknown export format: ${options.format}`);
    }
  }

  private async exportHTML(demo: Demo, options: ExportOptions): Promise<string> {
    const html = `<!DOCTYPE html>
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
    nav {
      position: fixed;
      left: 0;
      top: 0;
      width: 250px;
      height: 100vh;
      background: var(--card);
      padding: 2rem;
      overflow-y: auto;
      border-right: 1px solid var(--border);
    }
    nav a {
      display: block;
      padding: 0.5rem;
      color: var(--muted);
      text-decoration: none;
      border-radius: 4px;
      transition: all 0.2s;
    }
    nav a:hover, nav a.active { background: var(--primary); color: white; }
    main { margin-left: 270px; padding: 2rem; }
    .step {
      background: var(--card);
      border-radius: 8px;
      padding: 2rem;
      margin-bottom: 2rem;
      border: 1px solid var(--border);
    }
    .step h2 { color: var(--primary); margin-bottom: 1rem; }
    pre {
      background: #0d1117;
      border-radius: 8px;
      padding: 1rem;
      overflow-x: auto;
    }
    code { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
    .explanation { margin-top: 1rem; color: var(--muted); }
    .navigation {
      display: flex;
      justify-content: space-between;
      margin-top: 2rem;
    }
    .navigation button {
      padding: 0.75rem 1.5rem;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .navigation button:hover { opacity: 0.9; }
    .navigation button:disabled { opacity: 0.5; cursor: not-allowed; }
  </style>
</head>
<body>
  <nav>
    <h3 style="margin-bottom: 1rem; color: var(--fg);">Steps</h3>
    ${demo.steps.map((step, i) => `
      <a href="#step-${i + 1}" class="${i === 0 ? 'active' : ''}">${i + 1}. ${step.title}</a>
    `).join('')}
  </nav>
  <main>
    <header>
      <h1>${demo.config.name}</h1>
      <p class="metadata">
        ${demo.metadata.filesChanged.length} files | ${demo.metadata.commandsRun} commands | ${demo.metadata.testsPassed} tests passed
      </p>
    </header>
    ${demo.steps.map((step, i) => `
      <section class="step" id="step-${i + 1}">
        <h2>Step ${i + 1}: ${step.title}</h2>
        ${step.description ? `<p>${step.description}</p>` : ''}
        ${step.code ? `
          <pre><code class="language-${step.language}">${this.escapeHtml(step.code)}</code></pre>
        ` : ''}
        ${step.actions[0]?.explanation ? `<p class="explanation">${step.actions[0].explanation}</p>` : ''}
      </section>
    `).join('')}
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

    navLinks.forEach((a, i) => a.addEventListener('click', (e) => {
      e.preventDefault();
      currentStep = i;
      updateView();
    }));

    updateView();
  </script>
</body>
</html>`;

    const outputPath = `${options.outputPath}/${demo.config.name}.html`;
    // Write file would be platform-specific
    return outputPath;
  }

  private async exportReveal(demo: Demo, options: ExportOptions): Promise<string> {
    const markdown = `---
theme: black
highlight: github-dark
---

# ${demo.config.name}

${demo.metadata.filesChanged.length} files | ${demo.metadata.commandsRun} commands

---

${demo.steps.map((step, i) => `
## Step ${i + 1}: ${step.title}

${step.description || ''}

${step.code ? `\`\`\`${step.language || ''}\n${step.code}\n\`\`\`` : ''}

${step.actions[0]?.explanation ? `> ${step.actions[0].explanation}` : ''}

---
`).join('\n')}

## Summary

- Files changed: ${demo.metadata.filesChanged.length}
- Commands run: ${demo.metadata.commandsRun}
- Tests: ${demo.metadata.testsPassed} passed, ${demo.metadata.testsFailed} failed

---

# Thank You!
`;

    const outputPath = `${options.outputPath}/${demo.config.name}-reveal.md`;
    return outputPath;
  }

  private async exportMarp(demo: Demo, options: ExportOptions): Promise<string> {
    const markdown = `---
marp: true
theme: gaia
paginate: true
---

# ${demo.config.name}

Auto-Demo Presentation

---

${demo.steps.map((step, i) => `
## ${i + 1}. ${step.title}

${step.code ? `\`\`\`${step.language || ''}\n${step.code}\n\`\`\`` : ''}

`).join('\n---\n')}
`;

    const outputPath = `${options.outputPath}/${demo.config.name}-marp.md`;
    return outputPath;
  }

  private async exportSlidev(demo: Demo, options: ExportOptions): Promise<string> {
    const markdown = `---
theme: default
layout: cover
---

# ${demo.config.name}

Multiplatform Auto-Demo

---
layout: default
---

${demo.steps.map((step, i) => `
# ${i + 1}. ${step.title}

<v-click>

${step.code ? `\`\`\`${step.language || 'typescript'}{all|2|5-7}\n${step.code}\n\`\`\`` : ''}

</v-click>

---
`).join('\n')}
`;

    const outputPath = `${options.outputPath}/${demo.config.name}-slidev.md`;
    return outputPath;
  }

  private async exportPDF(demo: Demo, options: ExportOptions): Promise<string> {
    // Would use puppeteer or similar to convert HTML to PDF
    const outputPath = `${options.outputPath}/${demo.config.name}.pdf`;
    return outputPath;
  }

  private async exportVideo(demo: Demo, options: ExportOptions): Promise<string> {
    // Would use ffmpeg to create video from screenshots
    const outputPath = `${options.outputPath}/${demo.config.name}.mp4`;
    return outputPath;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// ============================================================================
// MULTIPLATFORM ADAPTER
// ============================================================================

export interface AutoDemoPlatformAdapter {
  name: string;
  startRecording(): Promise<void>;
  stopRecording(): Promise<Demo>;
  recordAction(action: RecordedAction): void;
  writeFile(path: string, content: string): Promise<void>;
  takeScreenshot(): Promise<string>;
}

export class ClaudeCodeDemoAdapter implements AutoDemoPlatformAdapter {
  name = 'claude-code';

  async startRecording(): Promise<void> {
    // Integrate with Claude Code hooks
  }

  async stopRecording(): Promise<Demo> {
    // Return recorded demo
    return {} as Demo;
  }

  recordAction(action: RecordedAction): void {
    // Record via hook
  }

  async writeFile(path: string, content: string): Promise<void> {
    // Use Write tool
  }

  async takeScreenshot(): Promise<string> {
    // Platform-specific screenshot
    return '';
  }
}

export class AgentZeroDemoAdapter implements AutoDemoPlatformAdapter {
  name = 'agent-zero';

  async startRecording(): Promise<void> {}
  async stopRecording(): Promise<Demo> { return {} as Demo; }
  recordAction(action: RecordedAction): void {}
  async writeFile(path: string, content: string): Promise<void> {}
  async takeScreenshot(): Promise<string> { return ''; }
}

export class OpenCodeDemoAdapter implements AutoDemoPlatformAdapter {
  name = 'opencode';

  async startRecording(): Promise<void> {}
  async stopRecording(): Promise<Demo> { return {} as Demo; }
  recordAction(action: RecordedAction): void {}
  async writeFile(path: string, content: string): Promise<void> {}
  async takeScreenshot(): Promise<string> { return ''; }
}

export class OpenClawDemoAdapter implements AutoDemoPlatformAdapter {
  name = 'openclaw';

  async startRecording(): Promise<void> {}
  async stopRecording(): Promise<Demo> { return {} as Demo; }
  recordAction(action: RecordedAction): void {}
  async writeFile(path: string, content: string): Promise<void> {}
  async takeScreenshot(): Promise<string> { return ''; }
}

// ============================================================================
// MAIN AUTO-DEMO SYSTEM
// ============================================================================

export class AutoDemoSystem {
  private recorder: DemoRecorder | null = null;
  private generator: DemoGenerator;
  private exporter: DemoExporter;
  private adapter: AutoDemoPlatformAdapter;

  constructor(platform: string = 'claude-code') {
    this.generator = new DemoGenerator();
    this.exporter = new DemoExporter();
    this.adapter = this.createAdapter(platform);
  }

  /**
   * Start recording a new demo
   */
  startRecording(config: Partial<DemoConfig>): string {
    const fullConfig: DemoConfig = {
      id: `demo-${Date.now()}`,
      name: config.name || 'Untitled Demo',
      format: config.format || 'walkthrough',
      style: config.style || 'tutorial',
      outputPath: config.outputPath || './demos',
      captureTerminal: config.captureTerminal ?? true,
      captureBrowser: config.captureBrowser ?? false,
      enableNarration: config.enableNarration ?? false,
      excludePatterns: config.excludePatterns || ['node_modules/**', '*.log']
    };

    this.recorder = new DemoRecorder(fullConfig);
    this.recorder.start();

    return fullConfig.id;
  }

  /**
   * Stop recording and get the demo
   */
  stopRecording(): Demo | null {
    if (!this.recorder) return null;
    return this.recorder.stop();
  }

  /**
   * Record an action (called by platform hooks)
   */
  recordAction(
    type: ActionType,
    target: string,
    data: { before?: string; after?: string; command?: string; output?: string }
  ): void {
    if (!this.recorder) return;

    switch (type) {
      case 'file_create':
      case 'file_edit':
      case 'file_delete':
        this.recorder.recordFileAction(type, target, data.before, data.after);
        break;
      case 'command':
        this.recorder.recordCommand(data.command || '', data.output || '');
        break;
      case 'test':
        this.recorder.recordTest(target, data.command === 'PASS', data.output || '');
        break;
      case 'git':
        this.recorder.recordGit(data.command || '', data.output || '');
        break;
    }
  }

  /**
   * Add explanation to current action
   */
  explain(text: string): void {
    this.recorder?.explain(text);
  }

  /**
   * Generate demo from existing code
   */
  async generateFromCode(path: string, style: DemoStyle): Promise<Demo> {
    return this.generator.generateFromCode(path, style);
  }

  /**
   * Generate interactive walkthrough
   */
  async generateWalkthrough(task: string, options?: { interactive?: boolean; narrate?: boolean }): Promise<Demo> {
    return this.generator.generateWalkthrough(task, options);
  }

  /**
   * Export demo to specified format
   */
  async export(demo: Demo, options: ExportOptions): Promise<string> {
    return this.exporter.export(demo, options);
  }

  private createAdapter(platform: string): AutoDemoPlatformAdapter {
    switch (platform) {
      case 'claude-code':
        return new ClaudeCodeDemoAdapter();
      case 'agent-zero':
        return new AgentZeroDemoAdapter();
      case 'opencode':
        return new OpenCodeDemoAdapter();
      case 'openclaw':
        return new OpenClawDemoAdapter();
      default:
        return new ClaudeCodeDemoAdapter();
    }
  }
}

export default AutoDemoSystem;
