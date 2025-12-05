/**
 * MCP Server implementation for Claude Export
 */

const http = require('http');
const path = require('path');
const utils = require('./utils');
const exporter = require('./exporter');

/**
 * Start the MCP server
 * @param {number} port - The port to listen on
 * @returns {http.Server} The HTTP server instance
 */
function startServer(port = 3000) {
  const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    
    // Only handle POST requests to /invoke
    if (req.method !== 'POST' || !req.url.startsWith('/invoke')) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }
    
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { tool, parameters } = data;
        
        // Handle different tools
        if (tool === 'export_chats') {
          const claudePath = parameters.claudePath || utils.getDefaultClaudePath();
          const exportPath = parameters.exportPath || path.join(process.cwd(), 'claude-export');
          
          if (!claudePath) {
            res.writeHead(400);
            res.end(JSON.stringify({ 
              error: 'Claude Desktop path not found. Please provide it explicitly.' 
            }));
            return;
          }
          
          const result = exporter.exportAllConversations(claudePath, exportPath);
          res.writeHead(result.success ? 200 : 400);
          res.end(JSON.stringify(result));
          return;
        } else if (tool === 'server_info') {
          // Return server information
          res.writeHead(200);
          res.end(JSON.stringify({
            name: 'claude-export-mcp',
            version: '1.0.1',
            description: 'MCP server for exporting Claude Desktop projects, conversations, and artifacts to Markdown',
            tools: [
              {
                name: 'export_chats',
                description: 'Export Claude Desktop projects, conversations, and artifacts to Markdown, maintaining project structure',
                parameters: {
                  type: 'object',
                  properties: {
                    claudePath: {
                      type: 'string',
                      description: 'Path to Claude Desktop folder (optional, detected automatically if not provided)'
                    },
                    exportPath: {
                      type: 'string',
                      description: 'Path where to export the Markdown files (optional, defaults to ./claude-export)'
                    }
                  }
                }
              },
              {
                name: 'server_info',
                description: 'Get information about this MCP server',
                parameters: {
                  type: 'object',
                  properties: {}
                }
              }
            ]
          }));
          return;
        } else {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Unknown tool' }));
          return;
        }
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  });

  server.listen(port, () => {
    console.log(`Claude Export MCP Server running at http://localhost:${port}`);
    console.log('Available tools:');
    console.log('  - export_chats: Export Claude Desktop projects, conversations, and artifacts to Markdown');
    console.log('  - server_info: Get information about this MCP server');
    console.log('\nExport structure:');
    console.log('  /claude-export/');
    console.log('    ├── project-1/');
    console.log('    │   ├── conversations/');
    console.log('    │   │   └── conversation-title/');
    console.log('    │   │       ├── conversation.md');
    console.log('    │   │       └── artifacts/');
    console.log('    │   ├── artifacts/');
    console.log('    │   └── files/');
    console.log('    └── project-2/');
    console.log('\nYou can add this server to Claude by using the Smithery MCP registry.');
    console.log(`Server URL: http://localhost:${port}`);
  });

  return server;
}

module.exports = {
  startServer
};
