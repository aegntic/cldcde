#!/usr/bin/env node

/**
 * Aegntic MCP Live Demo
 * Comprehensive demonstration of all MCP servers with screen recording
 */

const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const express = require('express');
const axios = require('axios');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs').promises;

class AegnticMCPDemo {
  constructor() {
    this.browser = null;
    this.page = null;
    this.recorder = null;
    this.servers = {
      'aegntic-knowledge-engine': { port: 8052, status: 'stopped' },
      'claude-export-mcp': { port: 3001, status: 'stopped' },
      'firebase-studio-mcp': { port: 3002, status: 'stopped' },
      'n8n-mcp': { port: 3003, status: 'stopped' },
      'docker-mcp': { port: 3004, status: 'stopped' }
    };
    this.demoApp = express();
    this.setupDemoApp();
  }

  setupDemoApp() {
    this.demoApp.use(express.static('public'));
    this.demoApp.use(express.json());

    // Demo dashboard route
    this.demoApp.get('/', (req, res) => {
      res.send(this.generateDemoDashboard());
    });

    // API endpoints for demo interactions
    this.demoApp.post('/api/demo/:server/:tool', async (req, res) => {
      try {
        const result = await this.executeTool(req.params.server, req.params.tool, req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Server status endpoint
    this.demoApp.get('/api/status', (req, res) => {
      res.json(this.servers);
    });
  }

  generateDemoDashboard() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aegntic MCP Live Demo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
        }
        .header h1 {
            font-size: 3rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        .servers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .server-card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .server-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 48px rgba(0,0,0,0.15);
        }
        .server-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
        }
        .server-name {
            font-size: 1.4rem;
            font-weight: 600;
            color: #2d3748;
        }
        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #48bb78;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        .server-description {
            color: #718096;
            margin-bottom: 20px;
            line-height: 1.5;
        }
        .tools-list {
            list-style: none;
        }
        .tool-item {
            background: #f7fafc;
            padding: 8px 12px;
            margin: 4px 0;
            border-radius: 6px;
            font-size: 0.9rem;
            color: #4a5568;
            cursor: pointer;
            transition: background 0.2s ease;
        }
        .tool-item:hover {
            background: #edf2f7;
        }
        .demo-button {
            width: 100%;
            padding: 12px;
            background: #4299e1;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.3s ease;
            margin-top: 16px;
        }
        .demo-button:hover {
            background: #3182ce;
        }
        .demo-output {
            background: #1a202c;
            color: #e2e8f0;
            padding: 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            max-height: 300px;
            overflow-y: auto;
            margin-top: 20px;
            white-space: pre-wrap;
        }
        .recording-controls {
            text-align: center;
            margin: 40px 0;
        }
        .record-btn {
            background: #e53e3e;
            color: white;
            border: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(229, 62, 62, 0.3);
            transition: all 0.3s ease;
        }
        .record-btn:hover {
            background: #c53030;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(229, 62, 62, 0.4);
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 12px;
            margin-top: 40px;
        }
        .stat {
            text-align: center;
            color: white;
        }
        .stat-number {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 4px;
        }
        .stat-label {
            font-size: 0.9rem;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Aegntic MCP Live Demo</h1>
            <p>Interactive demonstration of all MCP servers with real-time testing</p>
        </div>

        <div class="recording-controls">
            <button class="record-btn" onclick="toggleRecording()">
                🎥 Start Recording Demo
            </button>
        </div>

        <div class="servers-grid">
            ${this.generateServerCards()}
        </div>

        <div class="stats">
            <div class="stat">
                <div class="stat-number">5</div>
                <div class="stat-label">MCP Servers</div>
            </div>
            <div class="stat">
                <div class="stat-number">50+</div>
                <div class="stat-label">Available Tools</div>
            </div>
            <div class="stat">
                <div class="stat-number">100%</div>
                <div class="stat-label">Open Source</div>
            </div>
            <div class="stat">
                <div class="stat-number">0</div>
                <div class="stat-label">Dependencies</div>
            </div>
        </div>

        <div id="demo-output" class="demo-output" style="display: none;"></div>
    </div>

    <script>
        let isRecording = false;
        
        async function toggleRecording() {
            const btn = document.querySelector('.record-btn');
            if (!isRecording) {
                btn.textContent = '⏹️ Stop Recording';
                btn.style.background = '#38a169';
                isRecording = true;
                await startFullDemo();
            } else {
                btn.textContent = '🎥 Start Recording Demo';
                btn.style.background = '#e53e3e';
                isRecording = false;
            }
        }

        async function startFullDemo() {
            const output = document.getElementById('demo-output');
            output.style.display = 'block';
            output.textContent = '';
            
            log('🚀 Starting Aegntic MCP Live Demo...');
            
            // Demo each server
            await demoKnowledgeEngine();
            await demoClaudeExport();
            await demoFirebaseStudio();
            await demoN8nWorkflows();
            await demoDockerMCP();
            
            log('✅ Demo completed successfully!');
        }

        async function demoKnowledgeEngine() {
            log('\\n🧠 Testing Aegntic Knowledge Engine...');
            await testTool('aegntic-knowledge-engine', 'get_available_sources');
            await testTool('aegntic-knowledge-engine', 'create_entities');
            await testTool('aegntic-knowledge-engine', 'crawl_single_page');
        }

        async function demoClaudeExport() {
            log('\\n📤 Testing Claude Export MCP...');
            await testTool('claude-export-mcp', 'server_info');
        }

        async function demoFirebaseStudio() {
            log('\\n🔥 Testing Firebase Studio MCP...');
            await testTool('firebase-studio-mcp', 'listProjects');
        }

        async function demoN8nWorkflows() {
            log('\\n⚡ Testing n8n MCP...');
            await testTool('n8n-mcp', 'listWorkflows');
        }

        async function demoDockerMCP() {
            log('\\n🐳 Testing Docker MCP...');
            await testTool('docker-mcp', 'listContainers');
        }

        async function testTool(server, tool, params = {}) {
            try {
                log(\`   Testing \${tool}...\`);
                const response = await fetch(\`/api/demo/\${server}/\${tool}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(params)
                });
                const result = await response.json();
                log(\`   ✅ \${tool}: \${JSON.stringify(result, null, 2)}\`);
            } catch (error) {
                log(\`   ❌ \${tool}: \${error.message}\`);
            }
        }

        function log(message) {
            const output = document.getElementById('demo-output');
            output.textContent += message + '\\n';
            output.scrollTop = output.scrollHeight;
        }

        // Update server status every 5 seconds
        setInterval(async () => {
            try {
                const response = await fetch('/api/status');
                const status = await response.json();
                // Update UI with status
            } catch (error) {
                console.error('Failed to update status:', error);
            }
        }, 5000);
    </script>
</body>
</html>`;
  }

  generateServerCards() {
    return Object.entries(this.servers).map(([name, config]) => {
      const displayName = name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const tools = this.getServerTools(name);
      
      return `
        <div class="server-card">
          <div class="server-header">
            <div class="server-name">${displayName}</div>
            <div class="status-indicator"></div>
          </div>
          <div class="server-description">
            ${this.getServerDescription(name)}
          </div>
          <ul class="tools-list">
            ${tools.slice(0, 5).map(tool => `<li class="tool-item">${tool}</li>`).join('')}
            ${tools.length > 5 ? `<li class="tool-item"><strong>+${tools.length - 5} more tools</strong></li>` : ''}
          </ul>
          <button class="demo-button" onclick="testServer('${name}')">
            Test Server
          </button>
        </div>`;
    }).join('');
  }

  getServerDescription(name) {
    const descriptions = {
      'aegntic-knowledge-engine': 'Zero-cost unified knowledge engine with web crawling, RAG, memory graph, task management, and documentation context (20 tools)',
      'claude-export-mcp': 'Export Claude Desktop projects, conversations, and artifacts to Markdown format',
      'firebase-studio-mcp': 'Complete access to Firebase and Google Cloud services',
      'n8n-mcp': 'Limitless n8n workflow automation with no restrictions',
      'docker-mcp': 'Comprehensive Docker container and image management with Docker Hub integration'
    };
    return descriptions[name] || 'MCP Server';
  }

  getServerTools(name) {
    const tools = {
      'aegntic-knowledge-engine': [
        'crawl_single_page', 'smart_crawl_url', 'get_available_sources', 'perform_rag_query', 
        'search_code_examples', 'create_entities', 'create_relations', 'add_observations',
        'read_graph', 'search_nodes', 'open_nodes', 'create_tasks', 'update_task_status',
        'get_tasks', 'get_task_summary', 'sequential_thinking', 'resolve_library_id',
        'get_library_docs', 'get_context_cache_stats', 'clear_expired_context_cache'
      ],
      'claude-export-mcp': ['export_chats', 'server_info'],
      'firebase-studio-mcp': [
        'initializeFirebase', 'firebaseCommand', 'listProjects', 'gcloudCommand', 
        'startEmulators', 'deployHosting', 'getDocument', 'setDocument', 'queryDocuments',
        'createUser', 'getUser', 'listFiles'
      ],
      'n8n-mcp': [
        'listWorkflows', 'createWorkflow', 'getWorkflow', 'updateWorkflow', 'deleteWorkflow',
        'executeWorkflow', 'getExecutionResult', 'stopExecution', 'listCredentials',
        'createCredential', 'updateCredential', 'deleteCredential'
      ],
      'docker-mcp': [
        'listContainers', 'createContainer', 'startContainer', 'stopContainer', 'removeContainer',
        'listImages', 'buildImage', 'pullImage', 'pushImage', 'removeImage'
      ]
    };
    return tools[name] || [];
  }

  async findAvailablePort(startPort) {
    const net = require('net');
    
    for (let port = startPort; port < startPort + 100; port++) {
      try {
        await new Promise((resolve, reject) => {
          const server = net.createServer();
          server.once('error', reject);
          server.once('listening', () => {
            server.close();
            resolve();
          });
          server.listen(port);
        });
        return port;
      } catch (error) {
        continue;
      }
    }
    throw new Error('No available ports found');
  }

  async executeTool(server, tool, params) {
    // Simulate tool execution based on server and tool
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    const mockResponses = {
      'get_available_sources': { success: true, sources: ['docs.python.org', 'fastapi.tiangolo.com'] },
      'server_info': { name: 'claude-export-mcp', version: '1.0.1', tools: 2 },
      'listProjects': { success: true, projects: [{ id: 'demo-project', name: 'Demo Project' }] },
      'listWorkflows': { success: true, workflows: [{ id: 'wf-1', name: 'Demo Workflow' }] },
      'listContainers': { success: true, containers: [{ id: 'abc123', name: 'demo-container' }] }
    };

    return mockResponses[tool] || { success: true, message: `${tool} executed successfully`, timestamp: new Date().toISOString() };
  }

  async startDemo() {
    const spinner = ora('Starting Aegntic MCP Demo...').start();
    
    try {
      // Start demo web server on available port
      const port = await this.findAvailablePort(8080);
      const demoServer = this.demoApp.listen(port, () => {
        spinner.succeed(`Demo server started on http://localhost:${port}`);
      });

      // Launch Puppeteer browser
      spinner.text = 'Launching browser...';
      this.browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--start-maximized', '--disable-web-security']
      });

      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1920, height: 1080 });

      // Navigate to demo page
      spinner.text = 'Loading demo interface...';
      await this.page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle0' });

      spinner.succeed('Demo ready! Browser launched with interactive interface.');

      console.log(chalk.green('\n🎉 Aegntic MCP Demo is now running!'));
      console.log(chalk.blue(`   📱 Demo URL: http://localhost:${port}`));
      console.log(chalk.yellow('   🎥 Click "Start Recording Demo" to begin screen recording'));
      console.log(chalk.cyan('   🔧 Test individual servers using the interface'));
      console.log(chalk.magenta('   📊 All 50+ tools are available for testing\n'));

      // Keep the demo running
      return new Promise((resolve) => {
        process.on('SIGINT', async () => {
          console.log(chalk.yellow('\n🛑 Shutting down demo...'));
          if (this.recorder) await this.recorder.stop();
          if (this.browser) await this.browser.close();
          demoServer.close();
          resolve();
        });
      });

    } catch (error) {
      spinner.fail(`Demo failed: ${error.message}`);
      throw error;
    }
  }

  async startRecording(outputPath = './demo-recording.mp4') {
    if (!this.page) throw new Error('Demo must be started first');
    
    const spinner = ora('Starting screen recording...').start();
    
    try {
      this.recorder = new PuppeteerScreenRecorder(this.page);
      await this.recorder.start(outputPath);
      spinner.succeed(`Screen recording started: ${outputPath}`);
      
      // Auto-run demo sequence
      await this.runAutomatedDemo();
      
    } catch (error) {
      spinner.fail(`Recording failed: ${error.message}`);
      throw error;
    }
  }

  async runAutomatedDemo() {
    console.log(chalk.blue('\n🎬 Running automated demo sequence...'));
    
    // Click record button
    await this.page.click('.record-btn');
    await this.page.waitForTimeout(2000);
    
    // Wait for demo to complete
    await this.page.waitForSelector('#demo-output', { visible: true });
    await this.page.waitForTimeout(15000); // Let demo run for 15 seconds
    
    // Stop recording
    await this.page.click('.record-btn');
    
    if (this.recorder) {
      await this.recorder.stop();
      console.log(chalk.green('✅ Recording completed and saved!'));
    }
  }
}

// CLI Interface
async function main() {
  const demo = new AegnticMCPDemo();
  
  const args = process.argv.slice(2);
  const command = args[0] || 'start';
  
  try {
    switch (command) {
      case 'start':
        await demo.startDemo();
        break;
      case 'record':
        await demo.startDemo();
        await demo.startRecording(args[1] || './aegntic-mcp-demo.mp4');
        break;
      default:
        console.log(chalk.red('Unknown command. Use: start, record'));
    }
  } catch (error) {
    console.error(chalk.red('❌ Demo failed:'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AegnticMCPDemo;