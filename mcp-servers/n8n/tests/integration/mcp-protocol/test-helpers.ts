import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { N8NDocumentationMCPServer } from '../../../src/mcp/server';

let sharedMcpServer: N8NDocumentationMCPServer | null = null;

export class TestableN8NMCPServer {
  private mcpServer: N8NDocumentationMCPServer;
  private server: Server;
  private transports = new Set<Transport>();
  private connections = new Set<any>();
  private static instanceCount = 0;
  private testDbPath: string;

  constructor() {
    // Use a unique test database for each instance to avoid conflicts
    // This prevents concurrent test issues with database locking
    const instanceId = TestableN8NMCPServer.instanceCount++;
    this.testDbPath = `/tmp/n8n-mcp-test-${process.pid}-${instanceId}.db`;
    process.env.NODE_DB_PATH = this.testDbPath;
    
    this.server = new Server({
      name: 'n8n-documentation-mcp',
      version: '1.0.0'
    }, {
      capabilities: {
        tools: {}
      }
    });
    
    this.mcpServer = new N8NDocumentationMCPServer();
    this.setupHandlers();
  }

  private setupHandlers() {
    // Initialize handler
    this.server.setRequestHandler(InitializeRequestSchema, async () => {
      return {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'n8n-documentation-mcp',
          version: '1.0.0'
        }
      };
    });

    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // Import the tools directly from the tools module
      const { n8nDocumentationToolsFinal } = await import('../../../src/mcp/tools');
      const { n8nManagementTools } = await import('../../../src/mcp/tools-n8n-manager');
      const { isN8nApiConfigured } = await import('../../../src/config/n8n-api');
      
      // Combine documentation tools with management tools if API is configured
      const tools = [...n8nDocumentationToolsFinal];
      if (isN8nApiConfigured()) {
        tools.push(...n8nManagementTools);
      }
      
      return { tools };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        // The mcpServer.executeTool returns raw data, we need to wrap it in the MCP response format
        const result = await this.mcpServer.executeTool(request.params.name, request.params.arguments || {});
        
        return {
          content: [
            {
              type: 'text' as const,
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error: any) {
        // If it's already an MCP error, throw it as is
        if (error.code && error.message) {
          throw error;
        }
        // Otherwise, wrap it in an MCP error
        throw new McpError(
          ErrorCode.InternalError,
          error.message || 'Unknown error'
        );
      }
    });
  }

  async initialize(): Promise<void> {
    // Copy production database to test location for realistic testing
    try {
      const fs = await import('fs');
      const path = await import('path');
      const prodDbPath = path.join(process.cwd(), 'data', 'nodes.db');
      
      if (await fs.promises.access(prodDbPath).then(() => true).catch(() => false)) {
        await fs.promises.copyFile(prodDbPath, this.testDbPath);
      }
    } catch (error) {
      // Ignore copy errors, database will be created fresh
    }
    
    // The MCP server initializes its database lazily
    // We can trigger initialization by calling executeTool
    try {
      await this.mcpServer.executeTool('get_database_statistics', {});
    } catch (error) {
      // Ignore errors, we just want to trigger initialization
    }
  }

  async connectToTransport(transport: Transport): Promise<void> {
    // Ensure transport has required properties before connecting
    if (!transport || typeof transport !== 'object') {
      throw new Error('Invalid transport provided');
    }
    
    // Set up any missing transport handlers to prevent "Cannot set properties of undefined" errors
    if (transport && typeof transport === 'object') {
      const transportAny = transport as any;
      if (transportAny.serverTransport && !transportAny.serverTransport.onclose) {
        transportAny.serverTransport.onclose = () => {};
      }
    }
    
    // Track this transport for cleanup
    this.transports.add(transport);
    
    const connection = await this.server.connect(transport);
    this.connections.add(connection);
  }

  async close(): Promise<void> {
    // Use a timeout to prevent hanging during cleanup
    const closeTimeout = new Promise<void>((resolve) => {
      setTimeout(() => {
        console.warn('TestableN8NMCPServer close timeout - forcing cleanup');
        resolve();
      }, 3000);
    });

    const performClose = async () => {
      // Close all connections first with timeout protection
      const connectionPromises = Array.from(this.connections).map(async (connection) => {
        const connTimeout = new Promise<void>((resolve) => setTimeout(resolve, 500));
        
        try {
          if (connection && typeof connection.close === 'function') {
            await Promise.race([connection.close(), connTimeout]);
          }
        } catch (error) {
          // Ignore errors during connection cleanup
        }
      });
      
      await Promise.allSettled(connectionPromises);
      this.connections.clear();
      
      // Close all tracked transports with timeout protection
      const transportPromises: Promise<void>[] = [];
      
      for (const transport of this.transports) {
        const transportTimeout = new Promise<void>((resolve) => setTimeout(resolve, 500));
        
        try {
          // Force close all transports
          const transportAny = transport as any;
          
          // Try different close methods
          if (transportAny.close && typeof transportAny.close === 'function') {
            transportPromises.push(
              Promise.race([transportAny.close(), transportTimeout])
            );
          }
          if (transportAny.serverTransport?.close) {
            transportPromises.push(
              Promise.race([transportAny.serverTransport.close(), transportTimeout])
            );
          }
          if (transportAny.clientTransport?.close) {
            transportPromises.push(
              Promise.race([transportAny.clientTransport.close(), transportTimeout])
            );
          }
        } catch (error) {
          // Ignore errors during transport cleanup
        }
      }
      
      // Wait for all transports to close with timeout
      await Promise.allSettled(transportPromises);
      
      // Clear the transports set
      this.transports.clear();
      
      // Don't shut down the shared MCP server instance
    };

    // Race between actual close and timeout
    await Promise.race([performClose(), closeTimeout]);
    
    // Clean up test database
    if (this.testDbPath) {
      try {
        const fs = await import('fs');
        await fs.promises.unlink(this.testDbPath).catch(() => {});
        await fs.promises.unlink(`${this.testDbPath}-shm`).catch(() => {});
        await fs.promises.unlink(`${this.testDbPath}-wal`).catch(() => {});
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }
  
  static async shutdownShared(): Promise<void> {
    if (sharedMcpServer) {
      await sharedMcpServer.shutdown();
      sharedMcpServer = null;
    }
  }
}