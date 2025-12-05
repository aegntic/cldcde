/**
 * VS Code Extension integration for DailyDoco Pro
 * Provides capture triggers, Git integration, and development workflow automation
 */

import { z } from 'zod';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

// VS Code Extension Tool Schema
const VSCodeExtensionInputSchema = z.object({
  action: z.enum([
    'install-extension',
    'create-capture-trigger',
    'setup-git-hooks',
    'start-capture',
    'stop-capture',
    'configure-settings',
    'show-status',
    'open-dashboard'
  ]),
  projectPath: z.string().optional(),
  settings: z.record(z.any()).optional(),
  triggerEvents: z.array(z.string()).optional(),
});

interface CaptureEvent {
  type: 'git-commit' | 'test-run' | 'debug-start' | 'file-save' | 'build-complete';
  timestamp: Date;
  context: Record<string, any>;
}

interface VSCodeExtensionManifest {
  name: string;
  displayName: string;
  description: string;
  version: string;
  engines: {
    vscode: string;
  };
  categories: string[];
  activationEvents: string[];
  main: string;
  contributes: {
    commands: Command[];
    configuration: Configuration;
    views: Views;
    menus: Menus;
    keybindings: KeyBinding[];
  };
  scripts: Record<string, string>;
  devDependencies: Record<string, string>;
  dependencies: Record<string, string>;
}

interface Command {
  command: string;
  title: string;
  category: string;
  icon?: string;
}

interface Configuration {
  title: string;
  properties: Record<string, ConfigProperty>;
}

interface ConfigProperty {
  type: string;
  default: any;
  description: string;
  enum?: string[];
}

interface Views {
  explorer: ViewContainer[];
}

interface ViewContainer {
  id: string;
  name: string;
  when: string;
}

interface Menus {
  'view/title': MenuItem[];
  'view/item/context': MenuItem[];
  'editor/context': MenuItem[];
  commandPalette: MenuItem[];
}

interface MenuItem {
  command: string;
  when?: string;
  group?: string;
}

interface KeyBinding {
  command: string;
  key: string;
  when?: string;
}

/**
 * VS Code Extension Builder and Manager
 */
export class VSCodeExtensionBuilder {
  private projectPath: string;
  private settings: Record<string, any>;
  private captureEvents: CaptureEvent[] = [];

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.settings = {};
  }

  /**
   * Create the complete VS Code extension
   */
  async createExtension(): Promise<string> {
    const extensionPath = path.join(this.projectPath, '.vscode', 'extensions', 'dailydoco-pro');
    
    // Create extension directory structure
    await fs.mkdir(extensionPath, { recursive: true });
    await fs.mkdir(path.join(extensionPath, 'src'), { recursive: true });
    await fs.mkdir(path.join(extensionPath, 'media'), { recursive: true });

    // Generate package.json manifest
    const manifest = this.generateManifest();
    await fs.writeFile(
      path.join(extensionPath, 'package.json'),
      JSON.stringify(manifest, null, 2)
    );

    // Generate main extension file
    const mainCode = this.generateMainExtensionCode();
    await fs.writeFile(
      path.join(extensionPath, 'src', 'extension.ts'),
      mainCode
    );

    // Generate status provider
    const statusCode = this.generateStatusProvider();
    await fs.writeFile(
      path.join(extensionPath, 'src', 'statusProvider.ts'),
      statusCode
    );

    // Generate capture controller
    const captureCode = this.generateCaptureController();
    await fs.writeFile(
      path.join(extensionPath, 'src', 'captureController.ts'),
      captureCode
    );

    // Generate Git hooks
    await this.setupGitHooks();

    // Generate TypeScript configuration
    const tsConfig = this.generateTsConfig();
    await fs.writeFile(
      path.join(extensionPath, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );

    // Generate webpack configuration
    const webpackConfig = this.generateWebpackConfig();
    await fs.writeFile(
      path.join(extensionPath, 'webpack.config.js'),
      webpackConfig
    );

    return extensionPath;
  }

  /**
   * Generate VS Code extension manifest (package.json)
   */
  private generateManifest(): VSCodeExtensionManifest {
    return {
      name: 'dailydoco-pro-vscode',
      displayName: 'DailyDoco Pro',
      description: 'Automatic development documentation capture and video generation',
      version: '1.0.0',
      engines: {
        vscode: '^1.60.0'
      },
      categories: ['Other', 'Debuggers', 'Testing'],
      activationEvents: [
        'onStartupFinished',
        'onCommand:dailydoco.startCapture',
        'workspaceContains:**/.git'
      ],
      main: './out/src/extension.js',
      contributes: {
        commands: [
          {
            command: 'dailydoco.startCapture',
            title: 'Start Capture',
            category: 'DailyDoco',
            icon: '$(record)'
          },
          {
            command: 'dailydoco.stopCapture',
            title: 'Stop Capture',
            category: 'DailyDoco',
            icon: '$(stop)'
          },
          {
            command: 'dailydoco.openDashboard',
            title: 'Open Dashboard',
            category: 'DailyDoco',
            icon: '$(dashboard)'
          },
          {
            command: 'dailydoco.viewProjects',
            title: 'View Projects',
            category: 'DailyDoco',
            icon: '$(folder-opened)'
          },
          {
            command: 'dailydoco.configureSettings',
            title: 'Configure Settings',
            category: 'DailyDoco',
            icon: '$(gear)'
          },
          {
            command: 'dailydoco.refreshStatus',
            title: 'Refresh Status',
            category: 'DailyDoco',
            icon: '$(refresh)'
          }
        ],
        configuration: {
          title: 'DailyDoco Pro',
          properties: {
            'dailydoco.enableAutoCapture': {
              type: 'boolean',
              default: true,
              description: 'Automatically start capture when VS Code opens'
            },
            'dailydoco.captureEvents': {
              type: 'array',
              default: ['git-commit', 'test-run', 'debug-start'],
              description: 'Events that trigger documentation capture',
              enum: ['git-commit', 'test-run', 'debug-start', 'file-save', 'build-complete']
            },
            'dailydoco.serverUrl': {
              type: 'string',
              default: 'http://localhost:8080',
              description: 'DailyDoco Pro server URL'
            },
            'dailydoco.enableAegnt27': {
              type: 'boolean',
              default: true,
              description: 'Enable aegnt-27 humanization features'
            },
            'dailydoco.captureQuality': {
              type: 'string',
              default: 'high',
              description: 'Video capture quality',
              enum: ['draft', 'good', 'high', 'lossless']
            },
            'dailydoco.enableNotifications': {
              type: 'boolean',
              default: true,
              description: 'Show notifications for capture events'
            }
          }
        },
        views: {
          explorer: [
            {
              id: 'dailydocoStatus',
              name: 'DailyDoco Status',
              when: 'workspaceContains:**/.git'
            }
          ]
        },
        menus: {
          'view/title': [
            {
              command: 'dailydoco.refreshStatus',
              when: 'view == dailydocoStatus',
              group: 'navigation'
            }
          ],
          'view/item/context': [
            {
              command: 'dailydoco.startCapture',
              when: 'view == dailydocoStatus && viewItem == project',
              group: 'inline'
            }
          ],
          'editor/context': [
            {
              command: 'dailydoco.startCapture',
              group: 'dailydoco@1'
            }
          ],
          commandPalette: [
            {
              command: 'dailydoco.startCapture'
            },
            {
              command: 'dailydoco.stopCapture'
            },
            {
              command: 'dailydoco.openDashboard'
            }
          ]
        },
        keybindings: [
          {
            command: 'dailydoco.startCapture',
            key: 'ctrl+shift+r',
            when: 'editorTextFocus'
          },
          {
            command: 'dailydoco.stopCapture',
            key: 'ctrl+shift+s',
            when: 'editorTextFocus'
          }
        ]
      },
      scripts: {
        'vscode:prepublish': 'npm run compile',
        compile: 'webpack --mode production',
        watch: 'webpack --mode development --watch',
        pretest: 'npm run compile && npm run lint',
        lint: 'eslint src --ext ts',
        test: 'node ./out/test/runTest.js'
      },
      devDependencies: {
        '@types/vscode': '^1.60.0',
        '@types/node': '16.x',
        '@typescript-eslint/eslint-plugin': '^4.31.1',
        '@typescript-eslint/parser': '^4.31.1',
        'eslint': '^7.32.0',
        'typescript': '^4.4.3',
        'webpack': '^5.52.1',
        'webpack-cli': '^4.8.0',
        'ts-loader': '^9.2.5'
      },
      dependencies: {
        'axios': '^0.24.0',
        'ws': '^8.2.3'
      }
    };
  }

  /**
   * Generate main extension code
   */
  private generateMainExtensionCode(): string {
    return `import * as vscode from 'vscode';
import { StatusProvider } from './statusProvider';
import { CaptureController } from './captureController';

export function activate(context: vscode.ExtensionContext) {
    console.log('DailyDoco Pro extension is now active!');

    // Initialize components
    const statusProvider = new StatusProvider();
    const captureController = new CaptureController();

    // Register tree data provider
    vscode.window.createTreeView('dailydocoStatus', {
        treeDataProvider: statusProvider,
        showCollapseAll: true
    });

    // Register commands
    const commands = [
        vscode.commands.registerCommand('dailydoco.startCapture', () => {
            captureController.startCapture();
        }),
        
        vscode.commands.registerCommand('dailydoco.stopCapture', () => {
            captureController.stopCapture();
        }),
        
        vscode.commands.registerCommand('dailydoco.openDashboard', () => {
            vscode.env.openExternal(vscode.Uri.parse('http://localhost:8080/dashboard'));
        }),
        
        vscode.commands.registerCommand('dailydoco.viewProjects', () => {
            vscode.env.openExternal(vscode.Uri.parse('http://localhost:8080/projects'));
        }),
        
        vscode.commands.registerCommand('dailydoco.configureSettings', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', 'dailydoco');
        }),
        
        vscode.commands.registerCommand('dailydoco.refreshStatus', () => {
            statusProvider.refresh();
        })
    ];

    // Auto-start capture if enabled
    const config = vscode.workspace.getConfiguration('dailydoco');
    if (config.get('enableAutoCapture', true)) {
        captureController.startCapture();
    }

    // Listen for workspace events
    setupEventListeners(captureController);

    // Add all commands to context
    commands.forEach(command => context.subscriptions.push(command));

    // Register providers
    context.subscriptions.push(statusProvider);
    context.subscriptions.push(captureController);

    // Show welcome message
    vscode.window.showInformationMessage(
        'DailyDoco Pro is ready to capture your development workflow!',
        'Open Dashboard',
        'Configure Settings'
    ).then(selection => {
        if (selection === 'Open Dashboard') {
            vscode.commands.executeCommand('dailydoco.openDashboard');
        } else if (selection === 'Configure Settings') {
            vscode.commands.executeCommand('dailydoco.configureSettings');
        }
    });
}

function setupEventListeners(captureController: CaptureController) {
    const config = vscode.workspace.getConfiguration('dailydoco');
    const captureEvents = config.get('captureEvents', ['git-commit', 'test-run', 'debug-start']);

    // File save events
    if (captureEvents.includes('file-save')) {
        vscode.workspace.onDidSaveTextDocument(() => {
            captureController.triggerEvent('file-save');
        });
    }

    // Debug events
    if (captureEvents.includes('debug-start')) {
        vscode.debug.onDidStartDebugSession(() => {
            captureController.triggerEvent('debug-start');
        });
    }

    // Terminal events for test runs and builds
    vscode.window.onDidChangeActiveTerminal(() => {
        // Monitor terminal for test/build commands
        captureController.monitorTerminalActivity();
    });

    // Git events (through file system watcher)
    const gitWatcher = vscode.workspace.createFileSystemWatcher('**/.git/**');
    gitWatcher.onDidChange(() => {
        if (captureEvents.includes('git-commit')) {
            captureController.triggerEvent('git-commit');
        }
    });
}

export function deactivate() {
    console.log('DailyDoco Pro extension is now deactivated');
}`;
  }

  /**
   * Generate status provider code
   */
  private generateStatusProvider(): string {
    return `import * as vscode from 'vscode';
import axios from 'axios';

export class StatusProvider implements vscode.TreeDataProvider<StatusItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<StatusItem | undefined | null | void> = new vscode.EventEmitter<StatusItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<StatusItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private status: any = null;

    constructor() {
        this.refreshStatus();
        // Refresh every 5 seconds
        setInterval(() => this.refreshStatus(), 5000);
    }

    refresh(): void {
        this.refreshStatus();
        this._onDidChangeTreeData.fire();
    }

    async refreshStatus(): Promise<void> {
        try {
            const config = vscode.workspace.getConfiguration('dailydoco');
            const serverUrl = config.get('serverUrl', 'http://localhost:8080');
            
            const response = await axios.get(\`\${serverUrl}/api/status\`, {
                timeout: 2000
            });
            
            this.status = response.data;
        } catch (error) {
            this.status = {
                connected: false,
                error: 'Cannot connect to DailyDoco Pro server'
            };
        }
    }

    getTreeItem(element: StatusItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: StatusItem): Thenable<StatusItem[]> {
        if (!this.status) {
            return Promise.resolve([
                new StatusItem('Loading...', vscode.TreeItemCollapsibleState.None, 'loading', '$(loading~spin)')
            ]);
        }

        if (!this.status.connected) {
            return Promise.resolve([
                new StatusItem('Disconnected', vscode.TreeItemCollapsibleState.None, 'error', '$(error)'),
                new StatusItem(this.status.error || 'Server unavailable', vscode.TreeItemCollapsibleState.None, 'info')
            ]);
        }

        if (!element) {
            // Root level items
            return Promise.resolve([
                new StatusItem(
                    \`Capture: \${this.status.capture?.isActive ? 'Active' : 'Inactive'}\`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'capture',
                    this.status.capture?.isActive ? '$(record)' : '$(stop)'
                ),
                new StatusItem(
                    \`Processing: \${this.status.processing?.queueLength || 0} jobs\`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'processing',
                    '$(gear)'
                ),
                new StatusItem(
                    \`AI Models: \${this.status.ai?.modelsLoaded?.length || 0} loaded\`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'ai',
                    '$(robot)'
                ),
                new StatusItem(
                    \`System Health\`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'system',
                    '$(pulse)'
                )
            ]);
        }

        // Child items based on parent
        switch (element.contextValue) {
            case 'capture':
                return Promise.resolve([
                    new StatusItem(\`FPS: \${this.status.capture?.fps || 0}\`, vscode.TreeItemCollapsibleState.None, 'info'),
                    new StatusItem(\`Resolution: \${this.status.capture?.resolution || 'Unknown'}\`, vscode.TreeItemCollapsibleState.None, 'info'),
                    new StatusItem(\`CPU: \${this.status.capture?.cpuUsage || 0}%\`, vscode.TreeItemCollapsibleState.None, 'info'),
                    new StatusItem(\`Memory: \${this.status.capture?.memoryUsage || 0}MB\`, vscode.TreeItemCollapsibleState.None, 'info')
                ]);

            case 'processing':
                return Promise.resolve([
                    new StatusItem(\`Queue: \${this.status.processing?.queueLength || 0}\`, vscode.TreeItemCollapsibleState.None, 'info'),
                    new StatusItem(\`Completed Today: \${this.status.processing?.completedToday || 0}\`, vscode.TreeItemCollapsibleState.None, 'info'),
                    new StatusItem(\`Avg Time: \${this.status.processing?.averageProcessingTime || 0}s\`, vscode.TreeItemCollapsibleState.None, 'info'),
                    ...(this.status.processing?.currentJob ? [
                        new StatusItem(\`Current: \${this.status.processing.currentJob}\`, vscode.TreeItemCollapsibleState.None, 'info')
                    ] : [])
                ]);

            case 'ai':
                return Promise.resolve([
                    new StatusItem(\`Capacity: \${this.status.ai?.availableCapacity || 0}%\`, vscode.TreeItemCollapsibleState.None, 'info'),
                    new StatusItem(\`Active Tasks: \${this.status.ai?.currentTasks || 0}\`, vscode.TreeItemCollapsibleState.None, 'info'),
                    ...(this.status.ai?.modelsLoaded?.map((model: string) => 
                        new StatusItem(model, vscode.TreeItemCollapsibleState.None, 'info', '$(chip)')
                    ) || [])
                ]);

            case 'system':
                return Promise.resolve([
                    new StatusItem(\`Disk: \${100 - (this.status.system?.diskSpace || 0)}% free\`, vscode.TreeItemCollapsibleState.None, 'info'),
                    new StatusItem(\`Temp: \${this.status.system?.temperature || 0}°C\`, vscode.TreeItemCollapsibleState.None, 'info'),
                    new StatusItem(\`Network: \${this.status.system?.networkStatus || 'Unknown'}\`, vscode.TreeItemCollapsibleState.None, 'info'),
                    ...(this.status.system?.batteryLevel ? [
                        new StatusItem(\`Battery: \${this.status.system.batteryLevel}%\`, vscode.TreeItemCollapsibleState.None, 'info')
                    ] : [])
                ]);

            default:
                return Promise.resolve([]);
        }
    }
}

class StatusItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue?: string,
        public readonly iconPath?: string
    ) {
        super(label, collapsibleState);
        this.tooltip = \`\${this.label}\`;
    }
}`;
  }

  /**
   * Generate capture controller code
   */
  private generateCaptureController(): string {
    return `import * as vscode from 'vscode';
import axios from 'axios';
import * as WebSocket from 'ws';

export class CaptureController implements vscode.Disposable {
    private ws: WebSocket | null = null;
    private isCapturing = false;
    private terminalWatcher: vscode.Disposable | null = null;

    constructor() {
        this.connectWebSocket();
    }

    private connectWebSocket(): void {
        const config = vscode.workspace.getConfiguration('dailydoco');
        const serverUrl = config.get('serverUrl', 'http://localhost:8080');
        const wsUrl = serverUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws';

        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.on('open', () => {
                console.log('Connected to DailyDoco WebSocket');
            });

            this.ws.on('message', (data: WebSocket.Data) => {
                const message = JSON.parse(data.toString());
                this.handleWebSocketMessage(message);
            });

            this.ws.on('close', () => {
                console.log('DailyDoco WebSocket connection closed');
                // Reconnect after 5 seconds
                setTimeout(() => this.connectWebSocket(), 5000);
            });

            this.ws.on('error', (error) => {
                console.error('DailyDoco WebSocket error:', error);
            });
        } catch (error) {
            console.error('Failed to connect to DailyDoco WebSocket:', error);
        }
    }

    private handleWebSocketMessage(message: any): void {
        switch (message.type) {
            case 'capture-started':
                this.isCapturing = true;
                this.showNotification('Capture started', 'DailyDoco is now recording your workflow');
                break;

            case 'capture-stopped':
                this.isCapturing = false;
                this.showNotification('Capture stopped', 'Recording has been saved');
                break;

            case 'video-processed':
                this.showNotification(
                    'Video ready',
                    \`Your documentation video has been processed with \${message.data.authenticityScore}% authenticity\`,
                    'View Video'
                );
                break;

            case 'error':
                vscode.window.showErrorMessage(\`DailyDoco Error: \${message.data.error}\`);
                break;
        }
    }

    async startCapture(): Promise<void> {
        try {
            const config = vscode.workspace.getConfiguration('dailydoco');
            const serverUrl = config.get('serverUrl', 'http://localhost:8080');
            
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            const response = await axios.post(\`\${serverUrl}/api/capture/start\`, {
                projectPath: workspaceFolder.uri.fsPath,
                captureQuality: config.get('captureQuality', 'high'),
                enableAegnt27: config.get('enableAegnt27', true)
            });

            this.isCapturing = true;
            this.showNotification('Capture started', 'DailyDoco is now recording your workflow');

        } catch (error) {
            vscode.window.showErrorMessage(\`Failed to start capture: \${error}\`);
        }
    }

    async stopCapture(): Promise<void> {
        try {
            const config = vscode.workspace.getConfiguration('dailydoco');
            const serverUrl = config.get('serverUrl', 'http://localhost:8080');
            
            await axios.post(\`\${serverUrl}/api/capture/stop\`);
            
            this.isCapturing = false;
            this.showNotification('Capture stopped', 'Processing your documentation video...');

        } catch (error) {
            vscode.window.showErrorMessage(\`Failed to stop capture: \${error}\`);
        }
    }

    triggerEvent(eventType: string): void {
        if (!this.isCapturing) {
            return;
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'capture-event',
                data: {
                    eventType,
                    timestamp: new Date().toISOString(),
                    workspace: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
                    activeFile: vscode.window.activeTextEditor?.document.fileName
                }
            }));
        }

        this.showNotification(
            'Event captured',
            \`Recorded \${eventType} event for documentation\`
        );
    }

    monitorTerminalActivity(): void {
        // Clean up existing watcher
        if (this.terminalWatcher) {
            this.terminalWatcher.dispose();
        }

        const activeTerminal = vscode.window.activeTerminal;
        if (!activeTerminal) {
            return;
        }

        // Listen for terminal text changes (simplified)
        // In a real implementation, this would be more sophisticated
        this.terminalWatcher = vscode.window.onDidWriteTerminalData(e => {
            const data = e.data.toLowerCase();
            
            if (data.includes('npm test') || data.includes('yarn test') || data.includes('jest')) {
                this.triggerEvent('test-run');
            } else if (data.includes('npm run build') || data.includes('yarn build')) {
                this.triggerEvent('build-complete');
            }
        });
    }

    private showNotification(title: string, message: string, action?: string): void {
        const config = vscode.workspace.getConfiguration('dailydoco');
        if (!config.get('enableNotifications', true)) {
            return;
        }

        if (action) {
            vscode.window.showInformationMessage(message, action).then(selection => {
                if (selection === action && action === 'View Video') {
                    vscode.env.openExternal(vscode.Uri.parse('http://localhost:8080/videos'));
                }
            });
        } else {
            vscode.window.showInformationMessage(message);
        }
    }

    dispose(): void {
        if (this.ws) {
            this.ws.close();
        }
        if (this.terminalWatcher) {
            this.terminalWatcher.dispose();
        }
    }
}`;
  }

  /**
   * Setup Git hooks for capture events
   */
  private async setupGitHooks(): Promise<void> {
    const gitHooksPath = path.join(this.projectPath, '.git', 'hooks');
    
    try {
      await fs.access(gitHooksPath);
    } catch {
      // No .git directory, skip Git hooks
      return;
    }

    // Pre-commit hook
    const preCommitHook = `#!/bin/sh
# DailyDoco Pro pre-commit hook
curl -X POST http://localhost:8080/api/capture/event \\
  -H "Content-Type: application/json" \\
  -d '{"type": "pre-commit", "timestamp": "'$(date -Iseconds)'"}' \\
  --silent --max-time 2 || true
`;

    await fs.writeFile(path.join(gitHooksPath, 'pre-commit'), preCommitHook);
    await fs.chmod(path.join(gitHooksPath, 'pre-commit'), 0o755);

    // Post-commit hook
    const postCommitHook = `#!/bin/sh
# DailyDoco Pro post-commit hook
curl -X POST http://localhost:8080/api/capture/event \\
  -H "Content-Type: application/json" \\
  -d '{"type": "git-commit", "timestamp": "'$(date -Iseconds)'", "commit": "'$(git rev-parse HEAD)'"}' \\
  --silent --max-time 2 || true
`;

    await fs.writeFile(path.join(gitHooksPath, 'post-commit'), postCommitHook);
    await fs.chmod(path.join(gitHooksPath, 'post-commit'), 0o755);
  }

  /**
   * Generate TypeScript configuration
   */
  private generateTsConfig(): any {
    return {
      compilerOptions: {
        module: 'commonjs',
        target: 'es6',
        lib: ['es6'],
        declaration: true,
        outDir: 'out',
        rootDir: 'src',
        strict: true,
        moduleResolution: 'node',
        baseUrl: './src',
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true
      },
      exclude: ['node_modules', '.vscode-test']
    };
  }

  /**
   * Generate Webpack configuration
   */
  private generateWebpackConfig(): string {
    return `const path = require('path');

module.exports = {
  target: 'node',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  }
};`;
  }
}

/**
 * VS Code Extension Tool Implementation
 */
export const vscodeExtensionTool: Tool = {
  name: 'vscode-extension',
  description: 'Create and manage VS Code extension for DailyDoco Pro integration',
  inputSchema: VSCodeExtensionInputSchema,
};

export async function handleVSCodeExtension(input: z.infer<typeof VSCodeExtensionInputSchema>) {
  const { action, projectPath = process.cwd(), settings = {}, triggerEvents = [] } = input;

  const builder = new VSCodeExtensionBuilder(projectPath);

  switch (action) {
    case 'install-extension':
      return await installExtension(projectPath);

    case 'create-capture-trigger':
      return await createCaptureTrigger(projectPath, triggerEvents);

    case 'setup-git-hooks':
      return await setupGitHooksForProject(projectPath);

    case 'start-capture':
      return await startCaptureFromExtension(projectPath);

    case 'stop-capture':
      return await stopCaptureFromExtension(projectPath);

    case 'configure-settings':
      return await configureExtensionSettings(projectPath, settings);

    case 'show-status':
      return await showExtensionStatus(projectPath);

    case 'open-dashboard':
      return await openDashboardFromExtension();

    default:
      throw new Error(`Unknown VS Code extension action: ${action}`);
  }
}

async function installExtension(projectPath: string): Promise<string> {
  const builder = new VSCodeExtensionBuilder(projectPath);
  const extensionPath = await builder.createExtension();
  
  // Install the extension via command line
  const installCommand = `code --install-extension ${extensionPath}`;
  
  return new Promise((resolve, reject) => {
    cp.exec(installCommand, (error, stdout, stderr) => {
      if (error) {
        reject(`Failed to install extension: ${error.message}`);
      } else {
        resolve(`DailyDoco Pro VS Code extension installed successfully at ${extensionPath}`);
      }
    });
  });
}

async function createCaptureTrigger(projectPath: string, triggerEvents: string[]): Promise<string> {
  const triggerConfig = {
    events: triggerEvents,
    projectPath,
    timestamp: new Date().toISOString()
  };

  const configPath = path.join(projectPath, '.vscode', 'dailydoco.json');
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(triggerConfig, null, 2));

  return `Capture triggers configured for events: ${triggerEvents.join(', ')}`;
}

async function setupGitHooksForProject(projectPath: string): Promise<string> {
  const builder = new VSCodeExtensionBuilder(projectPath);
  await builder['setupGitHooks'](); // Access private method for this specific case
  
  return 'Git hooks configured for DailyDoco Pro capture events';
}

async function startCaptureFromExtension(projectPath: string): Promise<string> {
  try {
    const response = await fetch('http://localhost:8080/api/capture/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectPath })
    });

    if (response.ok) {
      return 'Capture started from VS Code extension';
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    throw new Error(`Failed to start capture: ${error}`);
  }
}

async function stopCaptureFromExtension(projectPath: string): Promise<string> {
  try {
    const response = await fetch('http://localhost:8080/api/capture/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectPath })
    });

    if (response.ok) {
      return 'Capture stopped from VS Code extension';
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    throw new Error(`Failed to stop capture: ${error}`);
  }
}

async function configureExtensionSettings(projectPath: string, settings: Record<string, any>): Promise<string> {
  const vscodeSettingsPath = path.join(projectPath, '.vscode', 'settings.json');
  
  let existingSettings = {};
  try {
    const existingContent = await fs.readFile(vscodeSettingsPath, 'utf8');
    existingSettings = JSON.parse(existingContent);
  } catch {
    // File doesn't exist or is invalid, start with empty settings
  }

  // Merge DailyDoco settings
  const updatedSettings = {
    ...existingSettings,
    ...Object.fromEntries(
      Object.entries(settings).map(([key, value]) => [`dailydoco.${key}`, value])
    )
  };

  await fs.mkdir(path.dirname(vscodeSettingsPath), { recursive: true });
  await fs.writeFile(vscodeSettingsPath, JSON.stringify(updatedSettings, null, 2));

  return `VS Code settings updated with DailyDoco configuration`;
}

async function showExtensionStatus(projectPath: string): Promise<string> {
  try {
    const response = await fetch('http://localhost:8080/api/status');
    const status = await response.json();

    return `DailyDoco Pro Status:
Capture: ${status.capture?.isActive ? 'Active' : 'Inactive'}
Processing Queue: ${status.processing?.queueLength || 0} jobs
AI Models: ${status.ai?.modelsLoaded?.length || 0} loaded
System Health: ${status.system?.networkStatus || 'Unknown'}`;
  } catch (error) {
    return `Unable to connect to DailyDoco Pro server: ${error}`;
  }
}

async function openDashboardFromExtension(): Promise<string> {
  // Open dashboard in default browser
  const dashboardUrl = 'http://localhost:8080/dashboard';
  
  const openCommand = process.platform === 'win32' ? 'start' :
                    process.platform === 'darwin' ? 'open' : 'xdg-open';
                    
  return new Promise((resolve, reject) => {
    cp.exec(`${openCommand} ${dashboardUrl}`, (error) => {
      if (error) {
        reject(`Failed to open dashboard: ${error.message}`);
      } else {
        resolve(`DailyDoco Pro dashboard opened: ${dashboardUrl}`);
      }
    });
  });
}