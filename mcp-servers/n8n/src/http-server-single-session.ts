#!/usr/bin/env node
/**
 * Single-Session HTTP server for n8n-MCP
 * Implements Hybrid Single-Session Architecture for protocol compliance
 * while maintaining simplicity for single-player use case
 */
import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { N8NDocumentationMCPServer } from './mcp/server';
import { ConsoleManager } from './utils/console-manager';
import { logger } from './utils/logger';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import { getStartupBaseUrl, formatEndpointUrls, detectBaseUrl } from './utils/url-detector';
import { PROJECT_VERSION } from './utils/version';
import { v4 as uuidv4 } from 'uuid';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { 
  negotiateProtocolVersion, 
  logProtocolNegotiation,
  STANDARD_PROTOCOL_VERSION 
} from './utils/protocol-version';

dotenv.config();

// Protocol version constant - will be negotiated per client
const DEFAULT_PROTOCOL_VERSION = STANDARD_PROTOCOL_VERSION;

// Session management constants
const MAX_SESSIONS = 100;
const SESSION_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface Session {
  server: N8NDocumentationMCPServer;
  transport: StreamableHTTPServerTransport | SSEServerTransport;
  lastAccess: Date;
  sessionId: string;
  initialized: boolean;
  isSSE: boolean;
}

interface SessionMetrics {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  lastCleanup: Date;
}

export class SingleSessionHTTPServer {
  // Map to store transports by session ID (following SDK pattern)
  private transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};
  private servers: { [sessionId: string]: N8NDocumentationMCPServer } = {};
  private sessionMetadata: { [sessionId: string]: { lastAccess: Date; createdAt: Date } } = {};
  private session: Session | null = null;  // Keep for SSE compatibility
  private consoleManager = new ConsoleManager();
  private expressServer: any;
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes
  private authToken: string | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  
  constructor() {
    // Validate environment on construction
    this.validateEnvironment();
    // No longer pre-create session - will be created per initialize request following SDK pattern
    
    // Start periodic session cleanup
    this.startSessionCleanup();
  }
  
  /**
   * Start periodic session cleanup
   */
  private startSessionCleanup(): void {
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanupExpiredSessions();
      } catch (error) {
        logger.error('Error during session cleanup', error);
      }
    }, SESSION_CLEANUP_INTERVAL);
    
    logger.info('Session cleanup started', { 
      interval: SESSION_CLEANUP_INTERVAL / 1000 / 60,
      maxSessions: MAX_SESSIONS,
      sessionTimeout: this.sessionTimeout / 1000 / 60
    });
  }
  
  /**
   * Clean up expired sessions based on last access time
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];
    
    // Check for expired sessions
    for (const sessionId in this.sessionMetadata) {
      const metadata = this.sessionMetadata[sessionId];
      if (now - metadata.lastAccess.getTime() > this.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    }
    
    // Remove expired sessions
    for (const sessionId of expiredSessions) {
      this.removeSession(sessionId, 'expired');
    }
    
    if (expiredSessions.length > 0) {
      logger.info('Cleaned up expired sessions', { 
        removed: expiredSessions.length,
        remaining: this.getActiveSessionCount()
      });
    }
  }
  
  /**
   * Remove a session and clean up resources
   */
  private async removeSession(sessionId: string, reason: string): Promise<void> {
    try {
      // Close transport if exists
      if (this.transports[sessionId]) {
        await this.transports[sessionId].close();
        delete this.transports[sessionId];
      }
      
      // Remove server and metadata
      delete this.servers[sessionId];
      delete this.sessionMetadata[sessionId];
      
      logger.info('Session removed', { sessionId, reason });
    } catch (error) {
      logger.warn('Error removing session', { sessionId, reason, error });
    }
  }
  
  /**
   * Get current active session count
   */
  private getActiveSessionCount(): number {
    return Object.keys(this.transports).length;
  }
  
  /**
   * Check if we can create a new session
   */
  private canCreateSession(): boolean {
    return this.getActiveSessionCount() < MAX_SESSIONS;
  }
  
  /**
   * Validate session ID format
   */
  private isValidSessionId(sessionId: string): boolean {
    // UUID v4 format validation
    const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidv4Regex.test(sessionId);
  }
  
  /**
   * Sanitize error information for client responses
   */
  private sanitizeErrorForClient(error: unknown): { message: string; code: string } {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (error instanceof Error) {
      // In production, only return generic messages
      if (isProduction) {
        // Map known error types to safe messages
        if (error.message.includes('Unauthorized') || error.message.includes('authentication')) {
          return { message: 'Authentication failed', code: 'AUTH_ERROR' };
        }
        if (error.message.includes('Session') || error.message.includes('session')) {
          return { message: 'Session error', code: 'SESSION_ERROR' };
        }
        if (error.message.includes('Invalid') || error.message.includes('validation')) {
          return { message: 'Validation error', code: 'VALIDATION_ERROR' };
        }
        // Default generic error
        return { message: 'Internal server error', code: 'INTERNAL_ERROR' };
      }
      
      // In development, return more details but no stack traces
      return {
        message: error.message.substring(0, 200), // Limit message length
        code: error.name || 'ERROR'
      };
    }
    
    // For non-Error objects
    return { message: 'An error occurred', code: 'UNKNOWN_ERROR' };
  }
  
  /**
   * Update session last access time
   */
  private updateSessionAccess(sessionId: string): void {
    if (this.sessionMetadata[sessionId]) {
      this.sessionMetadata[sessionId].lastAccess = new Date();
    }
  }
  
  /**
   * Get session metrics for monitoring
   */
  private getSessionMetrics(): SessionMetrics {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const sessionId in this.sessionMetadata) {
      const metadata = this.sessionMetadata[sessionId];
      if (now - metadata.lastAccess.getTime() > this.sessionTimeout) {
        expiredCount++;
      }
    }
    
    return {
      totalSessions: Object.keys(this.sessionMetadata).length,
      activeSessions: this.getActiveSessionCount(),
      expiredSessions: expiredCount,
      lastCleanup: new Date()
    };
  }
  
  /**
   * Load auth token from environment variable or file
   */
  private loadAuthToken(): string | null {
    // First, try AUTH_TOKEN environment variable
    if (process.env.AUTH_TOKEN) {
      logger.info('Using AUTH_TOKEN from environment variable');
      return process.env.AUTH_TOKEN;
    }
    
    // Then, try AUTH_TOKEN_FILE
    if (process.env.AUTH_TOKEN_FILE) {
      try {
        const token = readFileSync(process.env.AUTH_TOKEN_FILE, 'utf-8').trim();
        logger.info(`Loaded AUTH_TOKEN from file: ${process.env.AUTH_TOKEN_FILE}`);
        return token;
      } catch (error) {
        logger.error(`Failed to read AUTH_TOKEN_FILE: ${process.env.AUTH_TOKEN_FILE}`, error);
        console.error(`ERROR: Failed to read AUTH_TOKEN_FILE: ${process.env.AUTH_TOKEN_FILE}`);
        console.error(error instanceof Error ? error.message : 'Unknown error');
        return null;
      }
    }
    
    return null;
  }
  
  /**
   * Validate required environment variables
   */
  private validateEnvironment(): void {
    // Load auth token from env var or file
    this.authToken = this.loadAuthToken();
    
    if (!this.authToken || this.authToken.trim() === '') {
      const message = 'No authentication token found or token is empty. Set AUTH_TOKEN environment variable or AUTH_TOKEN_FILE pointing to a file containing the token.';
      logger.error(message);
      throw new Error(message);
    }
    
    // Update authToken to trimmed version
    this.authToken = this.authToken.trim();
    
    if (this.authToken.length < 32) {
      logger.warn('AUTH_TOKEN should be at least 32 characters for security');
    }
    
    // Check for default token and show prominent warnings
    const isDefaultToken = this.authToken === 'REPLACE_THIS_AUTH_TOKEN_32_CHARS_MIN_abcdefgh';
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isDefaultToken) {
      if (isProduction) {
        const message = 'CRITICAL SECURITY ERROR: Cannot start in production with default AUTH_TOKEN. Generate secure token: openssl rand -base64 32';
        logger.error(message);
        console.error('\n🚨 CRITICAL SECURITY ERROR 🚨');
        console.error(message);
        console.error('Set NODE_ENV to development for testing, or update AUTH_TOKEN for production\n');
        throw new Error(message);
      }
      
      logger.warn('⚠️ SECURITY WARNING: Using default AUTH_TOKEN - CHANGE IMMEDIATELY!');
      logger.warn('Generate secure token with: openssl rand -base64 32');
      
      // Only show console warnings in HTTP mode
      if (process.env.MCP_MODE === 'http') {
        console.warn('\n⚠️  SECURITY WARNING ⚠️');
        console.warn('Using default AUTH_TOKEN - CHANGE IMMEDIATELY!');
        console.warn('Generate secure token: openssl rand -base64 32');
        console.warn('Update via Railway dashboard environment variables\n');
      }
    }
  }
  

  /**
   * Handle incoming MCP request using proper SDK pattern
   */
  async handleRequest(req: express.Request, res: express.Response): Promise<void> {
    const startTime = Date.now();
    
    // Wrap all operations to prevent console interference
    return this.consoleManager.wrapOperation(async () => {
      try {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        const isInitialize = req.body ? isInitializeRequest(req.body) : false;
        
        // Log comprehensive incoming request details for debugging
        logger.info('handleRequest: Processing MCP request - SDK PATTERN', {
          requestId: req.get('x-request-id') || 'unknown',
          sessionId: sessionId,
          method: req.method,
          url: req.url,
          bodyType: typeof req.body,
          bodyContent: req.body ? JSON.stringify(req.body, null, 2) : 'undefined',
          existingTransports: Object.keys(this.transports),
          isInitializeRequest: isInitialize
        });
        
        let transport: StreamableHTTPServerTransport;
        
        if (isInitialize) {
          // Check session limits before creating new session
          if (!this.canCreateSession()) {
            logger.warn('handleRequest: Session limit reached', {
              currentSessions: this.getActiveSessionCount(),
              maxSessions: MAX_SESSIONS
            });
            
            res.status(429).json({
              jsonrpc: '2.0',
              error: {
                code: -32000,
                message: `Session limit reached (${MAX_SESSIONS}). Please wait for existing sessions to expire.`
              },
              id: req.body?.id || null
            });
            return;
          }
          
          // For initialize requests: always create new transport and server
          logger.info('handleRequest: Creating new transport for initialize request');
          
          // Use client-provided session ID or generate one if not provided
          const sessionIdToUse = sessionId || uuidv4();
          const server = new N8NDocumentationMCPServer();
          
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => sessionIdToUse,
            onsessioninitialized: (initializedSessionId: string) => {
              // Store both transport and server by session ID when session is initialized
              logger.info('handleRequest: Session initialized, storing transport and server', { 
                sessionId: initializedSessionId 
              });
              this.transports[initializedSessionId] = transport;
              this.servers[initializedSessionId] = server;
              
              // Store session metadata
              this.sessionMetadata[initializedSessionId] = {
                lastAccess: new Date(),
                createdAt: new Date()
              };
            }
          });
          
          // Set up cleanup handlers
          transport.onclose = () => {
            const sid = transport.sessionId;
            if (sid) {
              logger.info('handleRequest: Transport closed, cleaning up', { sessionId: sid });
              this.removeSession(sid, 'transport_closed');
            }
          };
          
          // Handle transport errors to prevent connection drops
          transport.onerror = (error: Error) => {
            const sid = transport.sessionId;
            logger.error('Transport error', { sessionId: sid, error: error.message });
            if (sid) {
              this.removeSession(sid, 'transport_error').catch(err => {
                logger.error('Error during transport error cleanup', { error: err });
              });
            }
          };
          
          // Connect the server to the transport BEFORE handling the request
          logger.info('handleRequest: Connecting server to new transport');
          await server.connect(transport);
          
        } else if (sessionId && this.transports[sessionId]) {
          // Validate session ID format
          if (!this.isValidSessionId(sessionId)) {
            logger.warn('handleRequest: Invalid session ID format', { sessionId });
            res.status(400).json({
              jsonrpc: '2.0',
              error: {
                code: -32602,
                message: 'Invalid session ID format'
              },
              id: req.body?.id || null
            });
            return;
          }
          
          // For non-initialize requests: reuse existing transport for this session
          logger.info('handleRequest: Reusing existing transport for session', { sessionId });
          transport = this.transports[sessionId];
          
          // Update session access time
          this.updateSessionAccess(sessionId);
          
        } else {
          // Invalid request - no session ID and not an initialize request
          const errorDetails = {
            hasSessionId: !!sessionId,
            isInitialize: isInitialize,
            sessionIdValid: sessionId ? this.isValidSessionId(sessionId) : false,
            sessionExists: sessionId ? !!this.transports[sessionId] : false
          };
          
          logger.warn('handleRequest: Invalid request - no session ID and not initialize', errorDetails);
          
          let errorMessage = 'Bad Request: No valid session ID provided and not an initialize request';
          if (sessionId && !this.isValidSessionId(sessionId)) {
            errorMessage = 'Bad Request: Invalid session ID format';
          } else if (sessionId && !this.transports[sessionId]) {
            errorMessage = 'Bad Request: Session not found or expired';
          }
          
          res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: errorMessage
            },
            id: req.body?.id || null
          });
          return;
        }
        
        // Handle request with the transport
        logger.info('handleRequest: Handling request with transport', { 
          sessionId: isInitialize ? 'new' : sessionId,
          isInitialize 
        });
        await transport.handleRequest(req, res, req.body);
        
        const duration = Date.now() - startTime;
        logger.info('MCP request completed', { duration, sessionId: transport.sessionId });
        
      } catch (error) {
        logger.error('handleRequest: MCP request error:', {
          error: error instanceof Error ? error.message : error,
          errorName: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined,
          activeTransports: Object.keys(this.transports),
          requestDetails: {
            method: req.method,
            url: req.url,
            hasBody: !!req.body,
            sessionId: req.headers['mcp-session-id']
          },
          duration: Date.now() - startTime
        });
        
        if (!res.headersSent) {
          // Send sanitized error to client
          const sanitizedError = this.sanitizeErrorForClient(error);
          res.status(500).json({ 
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: sanitizedError.message,
              data: {
                code: sanitizedError.code
              }
            },
            id: req.body?.id || null
          });
        }
      }
    });
  }
  

  /**
   * Reset the session for SSE - clean up old and create new SSE transport
   */
  private async resetSessionSSE(res: express.Response): Promise<void> {
    // Clean up old session if exists
    if (this.session) {
      try {
        logger.info('Closing previous session for SSE', { sessionId: this.session.sessionId });
        await this.session.transport.close();
      } catch (error) {
        logger.warn('Error closing previous session:', error);
      }
    }
    
    try {
      // Create new session
      logger.info('Creating new N8NDocumentationMCPServer for SSE...');
      const server = new N8NDocumentationMCPServer();
      
      // Generate cryptographically secure session ID
      const sessionId = uuidv4();
      
      logger.info('Creating SSEServerTransport...');
      const transport = new SSEServerTransport('/mcp', res);
      
      logger.info('Connecting server to SSE transport...');
      await server.connect(transport);
      
      // Note: server.connect() automatically calls transport.start(), so we don't need to call it again
      
      this.session = {
        server,
        transport,
        lastAccess: new Date(),
        sessionId,
        initialized: false,
        isSSE: true
      };
      
      logger.info('Created new SSE session successfully', { sessionId: this.session.sessionId });
    } catch (error) {
      logger.error('Failed to create SSE session:', error);
      throw error;
    }
  }
  
  /**
   * Check if current session is expired
   */
  private isExpired(): boolean {
    if (!this.session) return true;
    return Date.now() - this.session.lastAccess.getTime() > this.sessionTimeout;
  }
  
  /**
   * Start the HTTP server
   */
  async start(): Promise<void> {
    const app = express();
    
    // Create JSON parser middleware for endpoints that need it
    const jsonParser = express.json({ limit: '10mb' });
    
    // Configure trust proxy for correct IP logging behind reverse proxies
    const trustProxy = process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : 0;
    if (trustProxy > 0) {
      app.set('trust proxy', trustProxy);
      logger.info(`Trust proxy enabled with ${trustProxy} hop(s)`);
    }
    
    // DON'T use any body parser globally - StreamableHTTPServerTransport needs raw stream
    // Only use JSON parser for specific endpoints that need it
    
    // Security headers
    app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      next();
    });
    
    // CORS configuration
    app.use((req, res, next) => {
      const allowedOrigin = process.env.CORS_ORIGIN || '*';
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Mcp-Session-Id');
      res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
      res.setHeader('Access-Control-Max-Age', '86400');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
      }
      next();
    });
    
    // Request logging middleware
    app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        contentLength: req.get('content-length')
      });
      next();
    });
    
    // Root endpoint with API information
    app.get('/', (req, res) => {
      const port = parseInt(process.env.PORT || '3000');
      const host = process.env.HOST || '0.0.0.0';
      const baseUrl = detectBaseUrl(req, host, port);
      const endpoints = formatEndpointUrls(baseUrl);
      
      res.json({
        name: 'n8n Documentation MCP Server',
        version: PROJECT_VERSION,
        description: 'Model Context Protocol server providing comprehensive n8n node documentation and workflow management',
        endpoints: {
          health: {
            url: endpoints.health,
            method: 'GET',
            description: 'Health check and status information'
          },
          mcp: {
            url: endpoints.mcp,
            method: 'GET/POST',
            description: 'MCP endpoint - GET for info, POST for JSON-RPC'
          }
        },
        authentication: {
          type: 'Bearer Token',
          header: 'Authorization: Bearer <token>',
          required_for: ['POST /mcp']
        },
        documentation: 'https://github.com/czlonkowski/n8n-mcp'
      });
    });

    // Health check endpoint (no body parsing needed for GET)
    app.get('/health', (req, res) => {
      const activeTransports = Object.keys(this.transports);
      const activeServers = Object.keys(this.servers);
      const sessionMetrics = this.getSessionMetrics();
      const isProduction = process.env.NODE_ENV === 'production';
      const isDefaultToken = this.authToken === 'REPLACE_THIS_AUTH_TOKEN_32_CHARS_MIN_abcdefgh';
      
      res.json({ 
        status: 'ok', 
        mode: 'sdk-pattern-transports',
        version: PROJECT_VERSION,
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.floor(process.uptime()),
        sessions: {
          active: sessionMetrics.activeSessions,
          total: sessionMetrics.totalSessions,
          expired: sessionMetrics.expiredSessions,
          max: MAX_SESSIONS,
          usage: `${sessionMetrics.activeSessions}/${MAX_SESSIONS}`,
          sessionIds: activeTransports
        },
        security: {
          production: isProduction,
          defaultToken: isDefaultToken,
          tokenLength: this.authToken?.length || 0
        },
        activeTransports: activeTransports.length, // Legacy field
        activeServers: activeServers.length, // Legacy field
        legacySessionActive: !!this.session, // For SSE compatibility
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        },
        timestamp: new Date().toISOString()
      });
    });
    
    // Test endpoint for manual testing without auth
    app.post('/mcp/test', jsonParser, async (req: express.Request, res: express.Response): Promise<void> => {
      logger.info('TEST ENDPOINT: Manual test request received', {
        method: req.method,
        headers: req.headers,
        body: req.body,
        bodyType: typeof req.body,
        bodyContent: req.body ? JSON.stringify(req.body, null, 2) : 'undefined'
      });
      
      // Negotiate protocol version for test endpoint
      const negotiationResult = negotiateProtocolVersion(
        undefined, // no client version in test
        undefined, // no client info
        req.get('user-agent'),
        req.headers
      );
      
      logProtocolNegotiation(negotiationResult, logger, 'TEST_ENDPOINT');
      
      // Test what a basic MCP initialize request should look like
      const testResponse = {
        jsonrpc: '2.0',
        id: req.body?.id || 1,
        result: {
          protocolVersion: negotiationResult.version,
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'n8n-mcp',
            version: PROJECT_VERSION
          }
        }
      };
      
      logger.info('TEST ENDPOINT: Sending test response', {
        response: testResponse
      });
      
      res.json(testResponse);
    });

    // MCP information endpoint (no auth required for discovery) and SSE support
    app.get('/mcp', async (req, res) => {
      // Handle StreamableHTTP transport requests with new pattern
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      if (sessionId && this.transports[sessionId]) {
        // Let the StreamableHTTPServerTransport handle the GET request
        try {
          await this.transports[sessionId].handleRequest(req, res, undefined);
          return;
        } catch (error) {
          logger.error('StreamableHTTP GET request failed:', error);
          // Fall through to standard response
        }
      }
      
      // Check Accept header for text/event-stream (SSE support)
      const accept = req.headers.accept;
      if (accept && accept.includes('text/event-stream')) {
        logger.info('SSE stream request received - establishing SSE connection');
        
        try {
          // Create or reset session for SSE
          await this.resetSessionSSE(res);
          logger.info('SSE connection established successfully');
        } catch (error) {
          logger.error('Failed to establish SSE connection:', error);
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Failed to establish SSE connection'
            },
            id: null
          });
        }
        return;
      }

      // In n8n mode, return protocol version and server info
      if (process.env.N8N_MODE === 'true') {
        // Negotiate protocol version for n8n mode
        const negotiationResult = negotiateProtocolVersion(
          undefined, // no client version in GET request
          undefined, // no client info
          req.get('user-agent'),
          req.headers
        );
        
        logProtocolNegotiation(negotiationResult, logger, 'N8N_MODE_GET');
        
        res.json({
          protocolVersion: negotiationResult.version,
          serverInfo: {
            name: 'n8n-mcp',
            version: PROJECT_VERSION,
            capabilities: {
              tools: {}
            }
          }
        });
        return;
      }
      
      // Standard response for non-n8n mode
      res.json({
        description: 'n8n Documentation MCP Server',
        version: PROJECT_VERSION,
        endpoints: {
          mcp: {
            method: 'POST',
            path: '/mcp',
            description: 'Main MCP JSON-RPC endpoint',
            authentication: 'Bearer token required'
          },
          health: {
            method: 'GET',
            path: '/health',
            description: 'Health check endpoint',
            authentication: 'None'
          },
          root: {
            method: 'GET',
            path: '/',
            description: 'API information',
            authentication: 'None'
          }
        },
        documentation: 'https://github.com/czlonkowski/n8n-mcp'
      });
    });

    // Session termination endpoint
    app.delete('/mcp', async (req: express.Request, res: express.Response): Promise<void> => {
      const mcpSessionId = req.headers['mcp-session-id'] as string;
      
      if (!mcpSessionId) {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32602,
            message: 'Mcp-Session-Id header is required'
          },
          id: null
        });
        return;
      }
      
      // Validate session ID format
      if (!this.isValidSessionId(mcpSessionId)) {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32602,
            message: 'Invalid session ID format'
          },
          id: null
        });
        return;
      }
      
      // Check if session exists in new transport map
      if (this.transports[mcpSessionId]) {
        logger.info('Terminating session via DELETE request', { sessionId: mcpSessionId });
        try {
          await this.removeSession(mcpSessionId, 'manual_termination');
          res.status(204).send(); // No content
        } catch (error) {
          logger.error('Error terminating session:', error);
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Error terminating session'
            },
            id: null
          });
        }
      } else {
        res.status(404).json({
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: 'Session not found'
          },
          id: null
        });
      }
    });


    // Main MCP endpoint with authentication
    app.post('/mcp', jsonParser, async (req: express.Request, res: express.Response): Promise<void> => {
      // Log comprehensive debug info about the request
      logger.info('POST /mcp request received - DETAILED DEBUG', {
        headers: req.headers,
        readable: req.readable,
        readableEnded: req.readableEnded,
        complete: req.complete,
        bodyType: typeof req.body,
        bodyContent: req.body ? JSON.stringify(req.body, null, 2) : 'undefined',
        contentLength: req.get('content-length'),
        contentType: req.get('content-type'),
        userAgent: req.get('user-agent'),
        ip: req.ip,
        method: req.method,
        url: req.url,
        originalUrl: req.originalUrl
      });
      
      // Handle connection close to immediately clean up sessions
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      // Only add event listener if the request object supports it (not in test mocks)
      if (typeof req.on === 'function') {
        const closeHandler = () => {
          if (!res.headersSent && sessionId) {
            logger.info('Connection closed before response sent', { sessionId });
            // Schedule immediate cleanup if connection closes unexpectedly
            setImmediate(() => {
              if (this.sessionMetadata[sessionId]) {
                const metadata = this.sessionMetadata[sessionId];
                const timeSinceAccess = Date.now() - metadata.lastAccess.getTime();
                // Only remove if it's been inactive for a bit to avoid race conditions
                if (timeSinceAccess > 60000) { // 1 minute
                  this.removeSession(sessionId, 'connection_closed').catch(err => {
                    logger.error('Error during connection close cleanup', { error: err });
                  });
                }
              }
            });
          }
        };
        
        req.on('close', closeHandler);
        
        // Clean up event listener when response ends to prevent memory leaks
        res.on('finish', () => {
          req.removeListener('close', closeHandler);
        });
      }
      
      // Enhanced authentication check with specific logging
      const authHeader = req.headers.authorization;
      
      // Check if Authorization header is missing
      if (!authHeader) {
        logger.warn('Authentication failed: Missing Authorization header', { 
          ip: req.ip,
          userAgent: req.get('user-agent'),
          reason: 'no_auth_header'
        });
        res.status(401).json({ 
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: 'Unauthorized'
          },
          id: null
        });
        return;
      }
      
      // Check if Authorization header has Bearer prefix
      if (!authHeader.startsWith('Bearer ')) {
        logger.warn('Authentication failed: Invalid Authorization header format (expected Bearer token)', { 
          ip: req.ip,
          userAgent: req.get('user-agent'),
          reason: 'invalid_auth_format',
          headerPrefix: authHeader.substring(0, Math.min(authHeader.length, 10)) + '...'  // Log first 10 chars for debugging
        });
        res.status(401).json({ 
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: 'Unauthorized'
          },
          id: null
        });
        return;
      }
      
      // Extract token and trim whitespace
      const token = authHeader.slice(7).trim();
      
      // Check if token matches
      if (token !== this.authToken) {
        logger.warn('Authentication failed: Invalid token', { 
          ip: req.ip,
          userAgent: req.get('user-agent'),
          reason: 'invalid_token'
        });
        res.status(401).json({ 
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: 'Unauthorized'
          },
          id: null
        });
        return;
      }
      
      // Handle request with single session
      logger.info('Authentication successful - proceeding to handleRequest', {
        hasSession: !!this.session,
        sessionType: this.session?.isSSE ? 'SSE' : 'StreamableHTTP',
        sessionInitialized: this.session?.initialized
      });
      
      await this.handleRequest(req, res);
      
      logger.info('POST /mcp request completed - checking response status', {
        responseHeadersSent: res.headersSent,
        responseStatusCode: res.statusCode,
        responseFinished: res.finished
      });
    });
    
    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ 
        error: 'Not found',
        message: `Cannot ${req.method} ${req.path}`
      });
    });
    
    // Error handler
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Express error handler:', err);
      
      if (!res.headersSent) {
        res.status(500).json({ 
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
            data: process.env.NODE_ENV === 'development' ? err.message : undefined
          },
          id: null
        });
      }
    });
    
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';
    
    this.expressServer = app.listen(port, host, () => {
      const isProduction = process.env.NODE_ENV === 'production';
      const isDefaultToken = this.authToken === 'REPLACE_THIS_AUTH_TOKEN_32_CHARS_MIN_abcdefgh';
      
      logger.info(`n8n MCP Single-Session HTTP Server started`, { 
        port, 
        host, 
        environment: process.env.NODE_ENV || 'development',
        maxSessions: MAX_SESSIONS,
        sessionTimeout: this.sessionTimeout / 1000 / 60,
        production: isProduction,
        defaultToken: isDefaultToken
      });
      
      // Detect the base URL using our utility
      const baseUrl = getStartupBaseUrl(host, port);
      const endpoints = formatEndpointUrls(baseUrl);
      
      console.log(`n8n MCP Single-Session HTTP Server running on ${host}:${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Session Limits: ${MAX_SESSIONS} max sessions, ${this.sessionTimeout / 1000 / 60}min timeout`);
      console.log(`Health check: ${endpoints.health}`);
      console.log(`MCP endpoint: ${endpoints.mcp}`);
      
      if (isProduction) {
        console.log('🔒 Running in PRODUCTION mode - enhanced security enabled');
      } else {
        console.log('🛠️ Running in DEVELOPMENT mode');
      }
      
      console.log('\nPress Ctrl+C to stop the server');
      
      // Start periodic warning timer if using default token
      if (isDefaultToken && !isProduction) {
        setInterval(() => {
          logger.warn('⚠️ Still using default AUTH_TOKEN - security risk!');
          if (process.env.MCP_MODE === 'http') {
            console.warn('⚠️ REMINDER: Still using default AUTH_TOKEN - please change it!');
          }
        }, 300000); // Every 5 minutes
      }
      
      if (process.env.BASE_URL || process.env.PUBLIC_URL) {
        console.log(`\nPublic URL configured: ${baseUrl}`);
      } else if (process.env.TRUST_PROXY && Number(process.env.TRUST_PROXY) > 0) {
        console.log(`\nNote: TRUST_PROXY is enabled. URLs will be auto-detected from proxy headers.`);
      }
    });
    
    // Handle server errors
    this.expressServer.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${port} is already in use`);
        console.error(`ERROR: Port ${port} is already in use`);
        process.exit(1);
      } else {
        logger.error('Server error:', error);
        console.error('Server error:', error);
        process.exit(1);
      }
    });
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Single-Session HTTP server...');
    
    // Stop session cleanup timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      logger.info('Session cleanup timer stopped');
    }
    
    // Close all active transports (SDK pattern)
    const sessionIds = Object.keys(this.transports);
    logger.info(`Closing ${sessionIds.length} active sessions`);
    
    for (const sessionId of sessionIds) {
      try {
        logger.info(`Closing transport for session ${sessionId}`);
        await this.removeSession(sessionId, 'server_shutdown');
      } catch (error) {
        logger.warn(`Error closing transport for session ${sessionId}:`, error);
      }
    }
    
    // Clean up legacy session (for SSE compatibility)
    if (this.session) {
      try {
        await this.session.transport.close();
        logger.info('Legacy session closed');
      } catch (error) {
        logger.warn('Error closing legacy session:', error);
      }
      this.session = null;
    }
    
    // Close Express server
    if (this.expressServer) {
      await new Promise<void>((resolve) => {
        this.expressServer.close(() => {
          logger.info('HTTP server closed');
          resolve();
        });
      });
    }
    
    logger.info('Single-Session HTTP server shutdown completed');
  }
  
  /**
   * Get current session info (for testing/debugging)
   */
  getSessionInfo(): { 
    active: boolean; 
    sessionId?: string; 
    age?: number;
    sessions?: {
      total: number;
      active: number;
      expired: number;
      max: number;
      sessionIds: string[];
    };
  } {
    const metrics = this.getSessionMetrics();
    
    // Legacy SSE session info
    if (!this.session) {
      return { 
        active: false,
        sessions: {
          total: metrics.totalSessions,
          active: metrics.activeSessions,
          expired: metrics.expiredSessions,
          max: MAX_SESSIONS,
          sessionIds: Object.keys(this.transports)
        }
      };
    }
    
    return {
      active: true,
      sessionId: this.session.sessionId,
      age: Date.now() - this.session.lastAccess.getTime(),
      sessions: {
        total: metrics.totalSessions,
        active: metrics.activeSessions,
        expired: metrics.expiredSessions,
        max: MAX_SESSIONS,
        sessionIds: Object.keys(this.transports)
      }
    };
  }
}

// Start if called directly
if (require.main === module) {
  const server = new SingleSessionHTTPServer();
  
  // Graceful shutdown handlers
  const shutdown = async () => {
    await server.shutdown();
    process.exit(0);
  };
  
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  
  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    console.error('Uncaught exception:', error);
    shutdown();
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection:', reason);
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    shutdown();
  });
  
  // Start server
  server.start().catch(error => {
    logger.error('Failed to start Single-Session HTTP server:', error);
    console.error('Failed to start Single-Session HTTP server:', error);
    process.exit(1);
  });
}