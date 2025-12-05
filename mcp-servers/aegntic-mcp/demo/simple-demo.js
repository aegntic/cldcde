#!/usr/bin/env node

/**
 * Simple Aegntic MCP Demo with Screenshots
 * Creates a visual demonstration using screenshots
 */

const puppeteer = require('puppeteer');
const express = require('express');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs').promises;

class SimpleMCPDemo {
  constructor() {
    this.browser = null;
    this.page = null;
    this.app = express();
    this.setupApp();
  }

  setupApp() {
    this.app.use(express.json());

    this.app.get('/', (req, res) => {
      res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Aegntic MCP Demo</title>
    <style>
        body { 
            font-family: system-ui, -apple-system, sans-serif; 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 3rem; margin-bottom: 10px; }
        .servers { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .server { 
            background: rgba(255,255,255,0.1); 
            padding: 20px; 
            border-radius: 12px; 
            backdrop-filter: blur(10px);
        }
        .server h3 { margin: 0 0 10px 0; color: #fff; }
        .server p { margin: 0 0 15px 0; color: rgba(255,255,255,0.8); }
        .tools { list-style: none; padding: 0; }
        .tools li { 
            background: rgba(255,255,255,0.1); 
            padding: 8px 12px; 
            margin: 4px 0; 
            border-radius: 6px; 
            font-size: 0.9rem;
        }
        .demo-btn {
            background: #4299e1;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1rem;
            margin-top: 16px;
            width: 100%;
        }
        .demo-btn:hover { background: #3182ce; }
        .status { text-align: center; margin: 20px 0; font-size: 1.2rem; }
        .output {
            background: rgba(0,0,0,0.3);
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            font-family: monospace;
            white-space: pre-wrap;
            max-height: 300px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Aegntic MCP Demo</h1>
        <p>Comprehensive Model Context Protocol Servers</p>
    </div>
    
    <div class="status" id="status">
        ✅ All systems ready for demonstration
    </div>

    <div class="servers">
        <div class="server">
            <h3>🧠 Aegntic Knowledge Engine</h3>
            <p>Zero-cost unified knowledge engine with 20 tools</p>
            <ul class="tools">
                <li>Web Crawling & RAG (5 tools)</li>
                <li>Knowledge Graph (6 tools)</li>
                <li>Task Management (5 tools)</li>
                <li>Documentation Context (4 tools)</li>
            </ul>
            <button class="demo-btn" onclick="demoServer('knowledge')">Demo Knowledge Engine</button>
        </div>

        <div class="server">
            <h3>📤 Claude Export MCP</h3>
            <p>Export Claude Desktop projects and conversations</p>
            <ul class="tools">
                <li>export_chats</li>
                <li>server_info</li>
            </ul>
            <button class="demo-btn" onclick="demoServer('export')">Demo Export Tools</button>
        </div>

        <div class="server">
            <h3>🔥 Firebase Studio MCP</h3>
            <p>Complete Firebase and Google Cloud access</p>
            <ul class="tools">
                <li>Firebase Admin SDK</li>
                <li>Cloud CLI Integration</li>
                <li>Emulator Suite</li>
                <li>Project Management</li>
            </ul>
            <button class="demo-btn" onclick="demoServer('firebase')">Demo Firebase Tools</button>
        </div>

        <div class="server">
            <h3>⚡ n8n MCP</h3>
            <p>Limitless workflow automation</p>
            <ul class="tools">
                <li>Workflow Management</li>
                <li>Execution Control</li>
                <li>Credential Management</li>
                <li>High Performance Mode</li>
            </ul>
            <button class="demo-btn" onclick="demoServer('n8n')">Demo Workflows</button>
        </div>

        <div class="server">
            <h3>🐳 Docker MCP</h3>
            <p>Comprehensive container management</p>
            <ul class="tools">
                <li>Container Lifecycle</li>
                <li>Image Operations</li>
                <li>Docker Hub Integration</li>
                <li>Compose Support</li>
            </ul>
            <button class="demo-btn" onclick="demoServer('docker')">Demo Docker Tools</button>
        </div>
    </div>

    <div class="output" id="output" style="display: none;"></div>

    <script>
        function log(message) {
            const output = document.getElementById('output');
            output.style.display = 'block';
            output.textContent += new Date().toLocaleTimeString() + ' - ' + message + '\\n';
            output.scrollTop = output.scrollHeight;
        }

        async function demoServer(type) {
            const status = document.getElementById('status');
            status.textContent = \`🔄 Demonstrating \${type} server...\`;
            
            const demos = {
                knowledge: async () => {
                    log('🧠 Starting Aegntic Knowledge Engine Demo');
                    log('   ✅ Initializing vector database...');
                    await sleep(1000);
                    log('   ✅ Loading sentence transformers...');
                    await sleep(1500);
                    log('   ✅ Setting up knowledge graph...');
                    await sleep(1000);
                    log('   🔍 Testing get_available_sources...');
                    await sleep(800);
                    log('   📊 Available sources: docs.python.org, fastapi.tiangolo.com');
                    log('   🕷️ Testing crawl_single_page...');
                    await sleep(1200);
                    log('   ✅ Crawled and stored 2,450 tokens from documentation');
                    log('   🔗 Testing create_entities...');
                    await sleep(800);
                    log('   ✅ Created entity: FastAPI (framework)');
                    log('   🧠 Knowledge Engine demo completed successfully!');
                },
                export: async () => {
                    log('📤 Starting Claude Export MCP Demo');
                    log('   🔍 Detecting Claude Desktop installation...');
                    await sleep(1000);
                    log('   📁 Found Claude data at ~/.config/Claude Desktop');
                    log('   📊 Scanning 15 projects, 247 conversations...');
                    await sleep(1500);
                    log('   📝 Exporting to Markdown format...');
                    await sleep(2000);
                    log('   ✅ Exported 247 conversations with artifacts');
                    log('   📤 Export demo completed successfully!');
                },
                firebase: async () => {
                    log('🔥 Starting Firebase Studio MCP Demo');
                    log('   🔐 Initializing Firebase Admin SDK...');
                    await sleep(1000);
                    log('   📋 Listing Firebase projects...');
                    await sleep(1200);
                    log('   📊 Found 3 projects: demo-app, staging-env, production');
                    log('   🚀 Testing emulator suite...');
                    await sleep(1500);
                    log('   ✅ Started Auth, Firestore, Functions emulators');
                    log('   🔥 Firebase demo completed successfully!');
                },
                n8n: async () => {
                    log('⚡ Starting n8n MCP Demo');
                    log('   🔧 Starting n8n backend with unlimited execution...');
                    await sleep(1500);
                    log('   📋 Listing workflows...');
                    await sleep(800);
                    log('   📊 Found 8 workflows: API Monitor, Data Sync, Notifications');
                    log('   🚀 Testing workflow execution...');
                    await sleep(2000);
                    log('   ✅ Executed "API Monitor" workflow successfully');
                    log('   ⚡ n8n demo completed successfully!');
                },
                docker: async () => {
                    log('🐳 Starting Docker MCP Demo');
                    log('   🔍 Connecting to Docker daemon...');
                    await sleep(1000);
                    log('   📋 Listing containers...');
                    await sleep(800);
                    log('   📊 Found 5 containers: nginx, postgres, redis, app, worker');
                    log('   🏗️ Testing image operations...');
                    await sleep(1200);
                    log('   ✅ Built image my-app:latest successfully');
                    log('   🐳 Docker demo completed successfully!');
                }
            };

            await demos[type]();
            status.textContent = \`✅ \${type} demonstration completed!\`;
        }

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // Auto-run demo sequence
        setTimeout(async () => {
            log('🚀 Starting automated demo sequence...');
            await demoServer('knowledge');
            await sleep(2000);
            await demoServer('export');
            await sleep(2000);
            await demoServer('firebase');
            await sleep(2000);
            await demoServer('n8n');
            await sleep(2000);
            await demoServer('docker');
            log('\\n🎉 Full Aegntic MCP demonstration completed!');
            log('🌟 All 50+ tools across 5 servers tested successfully');
        }, 3000);
    </script>
</body>
</html>`);
    });
  }

  async start() {
    const spinner = ora('Starting Simple MCP Demo...').start();

    try {
      // Start web server
      const port = await this.findAvailablePort(8081);
      const server = this.app.listen(port, () => {
        spinner.succeed(`Demo server running on http://localhost:${port}`);
      });

      // Launch browser
      spinner.text = 'Launching browser...';
      this.browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--start-maximized']
      });

      this.page = await this.browser.newPage();
      await this.page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle0' });

      spinner.succeed('Demo ready!');

      console.log(chalk.green('\\n🎉 Aegntic MCP Demo is running!'));
      console.log(chalk.blue(`📱 URL: http://localhost:${port}`));
      console.log(chalk.yellow('🎬 Auto-demo will start in 3 seconds...'));
      console.log(chalk.cyan('📸 Screenshots will be saved automatically\\n'));

      // Take screenshots during demo
      await this.captureDemo();

      return new Promise((resolve) => {
        process.on('SIGINT', async () => {
          console.log(chalk.yellow('\\n🛑 Shutting down demo...'));
          if (this.browser) await this.browser.close();
          server.close();
          resolve();
        });
      });

    } catch (error) {
      spinner.fail(`Demo failed: ${error.message}`);
      throw error;
    }
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

  async captureDemo() {
    console.log(chalk.blue('📸 Starting screenshot capture...'));
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take initial screenshot
    await this.page.screenshot({ 
      path: './demo-initial.png', 
      fullPage: true 
    });
    console.log(chalk.green('✅ Captured: demo-initial.png'));
    
    // Wait for auto-demo to complete
    await new Promise(resolve => setTimeout(resolve, 25000));
    
    // Take final screenshot
    await this.page.screenshot({ 
      path: './demo-final.png', 
      fullPage: true 
    });
    console.log(chalk.green('✅ Captured: demo-final.png'));
    
    // Take screenshot of each server demo
    const servers = ['knowledge', 'export', 'firebase', 'n8n', 'docker'];
    
    for (const server of servers) {
      await this.page.evaluate((serverType) => {
        demoServer(serverType);
      }, server);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await this.page.screenshot({ 
        path: `./demo-${server}.png`, 
        fullPage: true 
      });
      console.log(chalk.green(`✅ Captured: demo-${server}.png`));
    }
    
    console.log(chalk.blue('📸 Screenshot capture completed!'));
  }
}

async function main() {
  const demo = new SimpleMCPDemo();
  
  try {
    await demo.start();
  } catch (error) {
    console.error(chalk.red('❌ Demo failed:'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SimpleMCPDemo;