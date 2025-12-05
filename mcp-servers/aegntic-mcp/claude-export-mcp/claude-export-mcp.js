#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');

// Configuration
const PORT = process.env.PORT || 3000;

// Claude Desktop default paths based on OS
const getDefaultClaudePath = () => {
  const homedir = os.homedir();
  
  switch (process.platform) {
    case 'win32':
      return path.join(homedir, 'AppData', 'Roaming', 'Claude Desktop');
    case 'darwin': // macOS
      return path.join(homedir, 'Library', 'Application Support', 'Claude Desktop');
    case 'linux':
      return path.join(homedir, '.config', 'Claude Desktop');
    default:
      return null;
  }
};

// Utility to convert Claude Desktop conversation to Markdown
const convertToMarkdown = (conversation) => {
  let markdown = `# ${conversation.title || 'Untitled Conversation'}\n\n`;
  
  for (const message of conversation.messages) {
    const role = message.role === 'user' ? 'Human' : 'Assistant';
    markdown += `## ${role}\n\n${message.content}\n\n`;
    
    // Handle artifacts if present
    if (message.artifacts && message.artifacts.length > 0) {
      for (const artifact of message.artifacts) {
        markdown += `### Artifact: ${artifact.title || 'Untitled'}\n\n`;
        markdown += `\`\`\`${artifact.language || ''}\n${artifact.content}\n\`\`\`\n\n`;
      }
    }
  }
  
  return markdown;
};

// Helper to determine file extension based on language
const getExtension = (language) => {
  const extensionMap = {
    'javascript': 'js',
    'python': 'py',
    'html': 'html',
    'css': 'css',
    'markdown': 'md',
    'json': 'json',
    'application/vnd.ant.code': 'txt',
    'application/vnd.ant.react': 'jsx',
    'text/markdown': 'md',
    'text/html': 'html',
    'image/svg+xml': 'svg',
    'application/vnd.ant.mermaid': 'mermaid',
    // Add more mappings as needed
  };
  
  return extensionMap[language?.toLowerCase()] || 'txt';
};

// Get the project ID from a conversation
const getProjectId = (conversation) => {
  return conversation.projectId || 'default-project';
};

// Export a single conversation to the appropriate project structure
const exportConversation = (conversationPath, exportBasePath) => {
  try {
    const rawData = fs.readFileSync(conversationPath, 'utf8');
    const conversation = JSON.parse(rawData);
    
    // Get project ID
    const projectId = getProjectId(conversation);
    
    // Create project directory
    const projectDir = path.join(exportBasePath, projectId);
    fs.mkdirSync(projectDir, { recursive: true });
    
    // Create conversations directory within project
    const conversationsDir = path.join(projectDir, 'conversations');
    fs.mkdirSync(conversationsDir, { recursive: true });
    
    // Create artifacts directory within project
    const projectArtifactsDir = path.join(projectDir, 'artifacts');
    fs.mkdirSync(projectArtifactsDir, { recursive: true });
    
    // Create project files directory within project
    const projectFilesDir = path.join(projectDir, 'files');
    fs.mkdirSync(projectFilesDir, { recursive: true });
    
    // Create a directory with the conversation title (or ID if no title)
    const conversationName = conversation.title 
      ? conversation.title.replace(/[/\\?%*:|"<>]/g, '-') 
      : path.basename(conversationPath, '.json');
    
    const conversationDir = path.join(conversationsDir, conversationName);
    fs.mkdirSync(conversationDir, { recursive: true });
    
    // Export main conversation as markdown
    const markdown = convertToMarkdown(conversation);
    fs.writeFileSync(path.join(conversationDir, 'conversation.md'), markdown);
    
    // Export artifacts as separate files
    if (conversation.artifacts && conversation.artifacts.length > 0) {
      // Create conversation-specific artifacts directory
      const conversationArtifactsDir = path.join(conversationDir, 'artifacts');
      fs.mkdirSync(conversationArtifactsDir, { recursive: true });
      
      conversation.artifacts.forEach((artifact, index) => {
        const filename = artifact.title 
          ? `${artifact.title.replace(/[/\\?%*:|"<>]/g, '-')}.${getExtension(artifact.language)}` 
          : `artifact-${index}.${getExtension(artifact.language)}`;
        
        // Save to conversation-specific artifacts directory
        fs.writeFileSync(path.join(conversationArtifactsDir, filename), artifact.content);
        
        // Also save to project-wide artifacts directory
        fs.writeFileSync(path.join(projectArtifactsDir, filename), artifact.content);
      });
    }
    
    return {
      success: true,
      message: `Exported: ${projectId}/${conversationName}`,
      path: conversationDir,
      projectId: projectId
    };
  } catch (error) {
    return {
      success: false,
      message: `Error exporting ${conversationPath}: ${error.message}`
    };
  }
};

// Export all conversations maintaining project structure
const exportAllConversations = (claudePath, exportPath) => {
  // Find conversations directory
  const conversationsDir = path.join(claudePath, 'conversations');
  
  if (!fs.existsSync(conversationsDir)) {
    return {
      success: false,
      message: `Conversations directory not found: ${conversationsDir}`
    };
  }
  
  // Create export directory
  fs.mkdirSync(exportPath, { recursive: true });
  
  // Get all conversation files
  const files = fs.readdirSync(conversationsDir)
    .filter(file => file.endsWith('.json'));
  
  if (files.length === 0) {
    return {
      success: false,
      message: 'No conversation files found'
    };
  }
  
  const results = {
    success: true,
    total: files.length,
    exported: 0,
    failed: 0,
    exportPath,
    projects: {},
    details: []
  };
  
  for (const file of files) {
    const conversationPath = path.join(conversationsDir, file);
    const result = exportConversation(conversationPath, exportPath);
    
    if (result.success) {
      results.exported++;
      
      // Track by project
      if (result.projectId) {
        if (!results.projects[result.projectId]) {
          results.projects[result.projectId] = {
            conversations: 0,
            path: path.join(exportPath, result.projectId)
          };
        }
        results.projects[result.projectId].conversations++;
      }
    } else {
      results.failed++;
    }
    
    results.details.push({
      file,
      ...result
    });
  }
  
  // Also copy over any project files if they exist
  const projectsDir = path.join(claudePath, 'projects');
  if (fs.existsSync(projectsDir)) {
    try {
      const projects = fs.readdirSync(projectsDir);
      
      for (const project of projects) {
        const projectDir = path.join(projectsDir, project);
        if (fs.statSync(projectDir).isDirectory()) {
          const projectFilesSourceDir = path.join(projectDir, 'files');
          if (fs.existsSync(projectFilesSourceDir)) {
            const projectFilesDestDir = path.join(exportPath, project, 'files');
            fs.mkdirSync(projectFilesDestDir, { recursive: true });
            
            // Copy all files from project files directory
            const files = fs.readdirSync(projectFilesSourceDir);
            for (const file of files) {
              const sourcePath = path.join(projectFilesSourceDir, file);
              const destPath = path.join(projectFilesDestDir, file);
              fs.copyFileSync(sourcePath, destPath);
            }
            
            if (!results.projects[project]) {
              results.projects[project] = {
                conversations: 0,
                path: path.join(exportPath, project)
              };
            }
            results.projects[project].files = files.length;
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Error copying project files: ${error.message}`);
    }
  }
  
  return results;
};

// MCP Server implementation
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
        const claudePath = parameters.claudePath || getDefaultClaudePath();
        const exportPath = parameters.exportPath || path.join(process.cwd(), 'claude-export');
        
        if (!claudePath) {
          res.writeHead(400);
          res.end(JSON.stringify({ 
            error: 'Claude Desktop path not found. Please provide it explicitly.' 
          }));
          return;
        }
        
        const result = exportAllConversations(claudePath, exportPath);
        res.writeHead(result.success ? 200 : 400);
        res.end(JSON.stringify(result));
        return;
      } else if (tool === 'server_info') {
        // Return server information
        res.end(JSON.stringify({
          name: 'claude-export-mcp',
          version: '1.0.0',
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

// Start the server
server.listen(PORT, () => {
  console.log(`Claude Export MCP Server running at http://localhost:${PORT}`);
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
  console.log(`Server URL: http://localhost:${PORT}`);
});
