#!/usr/bin/env node

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

server.method({
  name: 'useProject',
  description: 'Set the current Firebase project',
  parameters: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Firebase project ID'
      }
    },
    required: ['projectId']
  },
  handler: async ({ projectId }) => {
    return executeCommand('firebase', ['use', projectId]);
  }
});

server.method({
  name: 'createProject',
  description: 'Create a new Firebase project',
  parameters: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID (must be unique)'
      },
      displayName: {
        type: 'string',
        description: 'Display name for the project'
      }
    },
    required: ['projectId']
  },
  handler: async ({ projectId, displayName }) => {
    const args = ['projects:create', projectId];
    if (displayName) args.push('--display-name', displayName);
    return executeCommand('firebase', args);
  }
});

// Firebase Hosting
server.method({
  name: 'deployHosting',
  description: 'Deploy to Firebase Hosting',
  parameters: {
    type: 'object',
    properties: {
      projectPath: {
        type: 'string',
        description: 'Path to project directory'
      },
      only: {
        type: 'boolean',
        description: 'Deploy only hosting resources'
      }
    },
    required: ['projectPath']
  },
  handler: async ({ projectPath, only }) => {
    const args = ['deploy'];
    if (only) args.push('--only', 'hosting');
    return executeCommand('firebase', args, { cwd: projectPath });
  }
});

// Firestore Database
server.method({
  name: 'getDocument',
  description: 'Get a document from Firestore',
  parameters: {
    type: 'object',
    properties: {
      collection: {
        type: 'string',
        description: 'Collection path'
      },
      documentId: {
        type: 'string',
        description: 'Document ID'
      }
    },
    required: ['collection', 'documentId']
  },
  handler: async ({ collection, documentId }) => {
    try {
      const admin = require('firebase-admin');
      if (!firebaseApp) {
        return { success: false, error: 'Firebase Admin SDK not initialized. Call initializeFirebase first.' };
      }
      
      const db = admin.firestore();
      const docRef = db.collection(collection).doc(documentId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return { success: false, message: 'Document not found' };
      }
      
      return { success: true, data: doc.data() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

server.method({
  name: 'setDocument',
  description: 'Set a document in Firestore',
  parameters: {
    type: 'object',
    properties: {
      collection: {
        type: 'string',
        description: 'Collection path'
      },
      documentId: {
        type: 'string',
        description: 'Document ID'
      },
      data: {
        type: 'object',
        description: 'Document data'
      },
      merge: {
        type: 'boolean',
        description: 'Whether to merge with existing document',
        default: false
      }
    },
    required: ['collection', 'documentId', 'data']
  },
  handler: async ({ collection, documentId, data, merge }) => {
    try {
      const admin = require('firebase-admin');
      if (!firebaseApp) {
        return { success: false, error: 'Firebase Admin SDK not initialized. Call initializeFirebase first.' };
      }
      
      const db = admin.firestore();
      const docRef = db.collection(collection).doc(documentId);
      
      await docRef.set(data, { merge });
      
      return { success: true, message: 'Document written successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

server.method({
  name: 'queryDocuments',
  description: 'Query documents from Firestore',
  parameters: {
    type: 'object',
    properties: {
      collection: {
        type: 'string',
        description: 'Collection path'
      },
      where: {
        type: 'array',
        items: {
          type: 'array',
          minItems: 3,
          maxItems: 3
        },
        description: 'Array of where conditions [field, operator, value]'
      },
      orderBy: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          direction: { type: 'string', enum: ['asc', 'desc'] }
        },
        description: 'Order results by field'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of documents to return'
      }
    },
    required: ['collection']
  },
  handler: async ({ collection, where, orderBy, limit }) => {
    try {
      const admin = require('firebase-admin');
      if (!firebaseApp) {
        return { success: false, error: 'Firebase Admin SDK not initialized. Call initializeFirebase first.' };
      }
      
      const db = admin.firestore();
      let query = db.collection(collection);
      
      if (where && Array.isArray(where)) {
        for (const [field, operator, value] of where) {
          query = query.where(field, operator, value);
        }
      }
      
      if (orderBy) {
        query = query.orderBy(orderBy.field, orderBy.direction || 'asc');
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const snapshot = await query.get();
      const documents = [];
      
      snapshot.forEach(doc => {
        documents.push({
          id: doc.id,
          data: doc.data()
        });
      });
      
      return { success: true, documents };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

// Firebase Auth
server.method({
  name: 'createUser',
  description: 'Create a new Firebase Auth user',
  parameters: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        description: 'User email'
      },
      password: {
        type: 'string',
        description: 'User password'
      },
      displayName: {
        type: 'string',
        description: 'User display name'
      },
      phoneNumber: {
        type: 'string',
        description: 'User phone number'
      }
    },
    required: ['email', 'password']
  },
  handler: async ({ email, password, displayName, phoneNumber }) => {
    try {
      const admin = require('firebase-admin');
      if (!firebaseApp) {
        return { success: false, error: 'Firebase Admin SDK not initialized. Call initializeFirebase first.' };
      }
      
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
        phoneNumber
      });
      
      return { success: true, user: userRecord.toJSON() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

server.method({
  name: 'getUser',
  description: 'Get a Firebase Auth user by ID or email',
  parameters: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
        description: 'User ID'
      },
      email: {
        type: 'string',
        description: 'User email'
      }
    }
  },
  handler: async ({ uid, email }) => {
    try {
      const admin = require('firebase-admin');
      if (!firebaseApp) {
        return { success: false, error: 'Firebase Admin SDK not initialized. Call initializeFirebase first.' };
      }
      
      let userRecord;
      
      if (uid) {
        userRecord = await admin.auth().getUser(uid);
      } else if (email) {
        userRecord = await admin.auth().getUserByEmail(email);
      } else {
        return { success: false, error: 'Either uid or email must be provided' };
      }
      
      return { success: true, user: userRecord.toJSON() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

// Firebase Storage
server.method({
  name: 'listFiles',
  description: 'List files in Firebase Storage',
  parameters: {
    type: 'object',
    properties: {
      prefix: {
        type: 'string',
        description: 'Prefix to filter files'
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of files to return'
      }
    }
  },
  handler: async ({ prefix, maxResults }) => {
    try {
      const admin = require('firebase-admin');
      if (!firebaseApp) {
        return { success: false, error: 'Firebase Admin SDK not initialized. Call initializeFirebase first.' };
      }
      
      const bucket = admin.storage().bucket();
      const options = {};
      
      if (prefix) options.prefix = prefix;
      if (maxResults) options.maxResults = maxResults;
      
      const [files] = await bucket.getFiles(options);
      
      return { 
        success: true, 
        files: files.map(file => ({
          name: file.name,
          size: file.metadata.size,
          contentType: file.metadata.contentType,
          updated: file.metadata.updated,
          md5Hash: file.metadata.md5Hash
        }))
      };
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

// Firebase Studio specific methods
server.method({
  name: 'openFirebaseConsole',
  description: 'Get link to Firebase Console for current or specified project',
  parameters: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID (optional)'
      },
      feature: {
        type: 'string',
        enum: ['overview', 'authentication', 'database', 'firestore', 'storage', 'hosting', 'functions', 'ml', 'analytics'],
        description: 'Specific feature to open'
      }
    }
  },
  handler: async ({ projectId, feature }) => {
    try {
      if (!projectId) {
        // Get current project
        const result = await executeCommand('firebase', ['projects:list']);
        if (!result.success) {
          return result;
        }
        
        const lines = result.output.split('\n');
        const currentLine = lines.find(line => line.includes('*'));
        
        if (currentLine) {
          const parts = currentLine.trim().split(/\s+/);
          if (parts.length >= 2) {
            projectId = parts[1].trim();
          }
        }
        
        if (!projectId) {
          return { success: false, message: 'No current project found' };
        }
      }
      
      let url = `https://console.firebase.google.com/project/${projectId}`;
      
      if (feature) {
        url += `/${feature}`;
      }
      
      return { success: true, consoleUrl: url };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

// Firebase Extensions
server.method({
  name: 'listExtensions',
  description: 'List available Firebase Extensions',
  parameters: {
    type: 'object',
    properties: {}
  },
  handler: async () => {
    return executeCommand('firebase', ['ext:list', '--json']);
  }
});

server.method({
  name: 'installExtension',
  description: 'Install a Firebase Extension',
  parameters: {
    type: 'object',
    properties: {
      extensionName: {
        type: 'string',
        description: 'Extension name (e.g., "storage-resize-images")'
      },
      projectPath: {
        type: 'string',
        description: 'Path to Firebase project'
      }
    },
    required: ['extensionName']
  },
  handler: async ({ extensionName, projectPath }) => {
    const options = projectPath ? { cwd: projectPath } : {};
    return executeCommand('firebase', ['ext:install', extensionName, '--non-interactive'], options);
  }
});

// Firebase Realtime Database
server.method({
  name: 'getDatabaseValue',
  description: 'Get value from Firebase Realtime Database',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Database path'
      },
      projectId: {
        type: 'string',
        description: 'Project ID (optional)'
      },
      instance: {
        type: 'string',
        description: 'Database instance (optional)'
      }
    },
    required: ['path']
  },
  handler: async ({ path, projectId, instance }) => {
    const args = ['database:get', path, '--json'];
    
    if (projectId) {
      args.push('--project', projectId);
    }
    
    if (instance) {
      args.push('--instance', instance);
    }
    
    return executeCommand('firebase', args);
  }
});

server.method({
  name: 'setDatabaseValue',
  description: 'Set value in Firebase Realtime Database',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Database path'
      },
      data: {
        description: 'Data to write'
      },
      projectId: {
        type: 'string',
        description: 'Project ID (optional)'
      },
      instance: {
        type: 'string',
        description: 'Database instance (optional)'
      }
    },
    required: ['path', 'data']
  },
  handler: async ({ path, data, projectId, instance }) => {
    // Create temp file with data
    const tempFile = path.join(process.cwd(), 'temp-data.json');
    fs.writeFileSync(tempFile, JSON.stringify(data));
    
    const args = ['database:set', path, tempFile, '--json'];
    
    if (projectId) {
      args.push('--project', projectId);
    }
    
    if (instance) {
      args.push('--instance', instance);
    }
    
    const result = await executeCommand('firebase', args);
    
    // Clean up temp file
    try { fs.unlinkSync(tempFile); } catch (e) {}
    
    return result;
  }
});

// Google Auth
server.method({
  name: 'login',
  description: 'Login to Firebase and Google Cloud',
  parameters: {
    type: 'object',
    properties: {
      noLocalhost: {
        type: 'boolean',
        description: 'Don\'t use localhost for authentication',
        default: false
      }
    }
  },
  handler: async ({ noLocalhost }) => {
    const firebaseArgs = ['login'];
    const gcloudArgs = ['auth', 'login'];
    
    if (noLocalhost) {
      firebaseArgs.push('--no-localhost');
      gcloudArgs.push('--no-launch-browser');
    }
    
    const firebaseLogin = await executeCommand('firebase', firebaseArgs);
    const gcloudLogin = await executeCommand('gcloud', gcloudArgs);
    
    return {
      success: firebaseLogin.success && gcloudLogin.success,
      firebase: firebaseLogin,
      gcloud: gcloudLogin
    };
  }
});

// Start the server
const port = process.env.PORT || 3000;
server.start({ port }).then(() => {
  console.log(`Firebase Studio MCP Server running on port ${port}`);
  console.log('Available methods:');
  
  // List all methods
  server.methods.forEach(method => {
    console.log(` - ${method.name}: ${method.description}`);
  });
  
  // Check if required tools are available
  exec('firebase --version', (error) => {
    if (error) {
      console.log('\nWARNING: Firebase CLI not found in PATH');
      console.log('Run ./setup.sh to install the required tools');
    }
  });
  
  exec('gcloud --version', (error) => {
    if (error) {
      console.log('\nWARNING: Google Cloud SDK not found in PATH');
      console.log('Run ./setup.sh to install the required tools');
    }
  });
});
