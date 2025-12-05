/**
 * Firebase Studio MCP Server Implementation
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const mcp = require('mcp-server');

// Create MCP server
const server = new mcp.Server({
  name: 'Firebase Studio MCP Server',
  description: 'Complete access to Firebase and Google Cloud services'
});

// Firebase Admin SDK state
let firebaseApp = null;
let serviceAccount = null;

// Helper function to execute shell commands with promise
const executeCommand = (command, args = [], options = {}) => {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { 
      shell: true, 
      ...options 
    });
    
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout.trim() });
      } else {
        resolve({ 
          success: false, 
          error: stderr.trim() || 'Command failed', 
          code,
          command: `${command} ${args.join(' ')}`
        });
      }
    });
  });
};

// Initialize Firebase Admin SDK
server.method({
  name: 'initializeFirebase',
  description: 'Initialize Firebase Admin SDK with service account',
  parameters: {
    type: 'object',
    properties: {
      serviceAccountPath: {
        type: 'string',
        description: 'Path to service account JSON file'
      },
      databaseURL: {
        type: 'string',
        description: 'Firebase database URL (optional)'
      },
      storageBucket: {
        type: 'string',
        description: 'Firebase storage bucket (optional)'
      }
    },
    required: ['serviceAccountPath']
  },
  handler: async ({ serviceAccountPath, databaseURL, storageBucket }) => {
    try {
      // Dynamically import firebase-admin
      const admin = require('firebase-admin');
      
      if (!fs.existsSync(serviceAccountPath)) {
        return { success: false, error: `Service account file not found at: ${serviceAccountPath}` };
      }
      
      serviceAccount = require(path.resolve(serviceAccountPath));
      
      const config = {
        credential: admin.credential.cert(serviceAccount)
      };
      
      if (databaseURL) config.databaseURL = databaseURL;
      if (storageBucket) config.storageBucket = storageBucket;
      
      // Cleanup previous app if it exists
      if (firebaseApp) {
        await admin.app().delete();
      }
      
      firebaseApp = admin.initializeApp(config);
      
      return { 
        success: true, 
        message: 'Firebase Admin SDK initialized successfully',
        projectId: serviceAccount.project_id
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

// Firebase CLI Methods
server.method({
  name: 'firebaseCommand',
  description: 'Execute any Firebase CLI command directly',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string', 
        description: 'Firebase command to run (e.g., "deploy", "serve")'
      },
      args: {
        type: 'array',
        items: { type: 'string' },
        description: 'Command arguments'
      },
      cwd: {
        type: 'string',
        description: 'Working directory for command execution'
      },
      json: {
        type: 'boolean',
        description: 'Parse output as JSON if possible',
        default: true
      }
    },
    required: ['command']
  },
  handler: async ({ command, args = [], cwd, json = true }) => {
    try {
      const options = cwd ? { cwd } : {};
      const result = await executeCommand('firebase', [command, ...(args || [])], options);
      
      if (result.success && json) {
        try {
          return { success: true, data: JSON.parse(result.output) };
        } catch (e) {
          // Not JSON, return as is
          return result;
        }
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

// Project management
server.method({
  name: 'listProjects',
  description: 'List all Firebase projects',
  parameters: {
    type: 'object',
    properties: {}
  },
  handler: async () => {
    try {
      const result = await executeCommand('firebase', ['projects:list', '--json']);
      if (result.success) {
        try {
          return { success: true, projects: JSON.parse(result.output) };
        } catch (e) {
          return { 
            success: true, 
            output: result.output,
            note: 'Could not parse JSON output, returning raw output'
          };
        }
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

// Google Cloud SDK Methods
server.method({
  name: 'gcloudCommand',
  description: 'Execute any Google Cloud CLI command',
  parameters: {
    type: 'object',
    properties: {
      service: {
        type: 'string',
        description: 'GCloud service (e.g., "compute", "firestore", "functions")'
      },
      command: {
        type: 'string',
        description: 'Command to execute'
      },
      args: {
        type: 'array',
        items: { type: 'string' },
        description: 'Command arguments'
      },
      project: {
        type: 'string',
        description: 'Project ID (overrides default)'
      },
      json: {
        type: 'boolean',
        description: 'Parse output as JSON',
        default: true
      }
    },
    required: ['service', 'command']
  },
  handler: async ({ service, command, args = [], project, json = true }) => {
    const cmdArgs = [service, command, ...args];
    
    if (project) {
      cmdArgs.push('--project', project);
    }
    
    if (json) {
      cmdArgs.push('--format=json');
    }
    
    const result = await executeCommand('gcloud', cmdArgs);
    
    if (result.success && json) {
      try {
        return { success: true, data: JSON.parse(result.output) };
      } catch (e) {
        // Not JSON, return as is
        return result;
      }
    }
    
    return result;
  }
});

// Firebase Emulator Suite
server.method({
  name: 'startEmulators',
  description: 'Start Firebase emulators',
  parameters: {
    type: 'object',
    properties: {
      services: {
        type: 'array',
        items: { 
          type: 'string',
          enum: ['auth', 'functions', 'firestore', 'database', 'hosting', 'pubsub', 'storage']
        },
        description: 'Services to emulate'
      },
      projectPath: {
        type: 'string',
        description: 'Path to Firebase project'
      },
      exportOnExit: {
        type: 'string',
        description: 'Directory to export data on exit'
      },
      importData: {
        type: 'string',
        description: 'Directory to import data from'
      }
    }
  },
  handler: async ({ services, projectPath, exportOnExit, importData }) => {
    const args = ['emulators:start'];
    
    if (services && services.length > 0) {
      args.push('--only', services.join(','));
    }
    
    if (exportOnExit) {
      args.push('--export-on-exit', exportOnExit);
    }
    
    if (importData) {
      args.push('--import', importData);
    }
    
    const options = projectPath ? { cwd: projectPath } : {};
    
    // Run in background
    const proc = spawn('firebase', args, { 
      ...options, 
      detached: true,
      stdio: 'ignore'
    });
    
    proc.unref();
    
    return { 
      success: true, 
      message: 'Emulators started in background',
      pid: proc.pid,
      command: `firebase ${args.join(' ')}`
    };
  }
});

// Additional methods would be implemented here...

module.exports = server;