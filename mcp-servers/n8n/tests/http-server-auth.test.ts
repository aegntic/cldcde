import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { MockedFunction } from 'vitest';

// Import the actual functions we'll be testing
import { loadAuthToken, startFixedHTTPServer } from '../src/http-server';

// Mock dependencies
vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  },
  Logger: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  })),
  LogLevel: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  }
}));

vi.mock('dotenv');

// Mock other dependencies to prevent side effects
vi.mock('../src/mcp/server', () => ({
  N8NDocumentationMCPServer: vi.fn().mockImplementation(() => ({
    executeTool: vi.fn()
  }))
}));

vi.mock('../src/mcp/tools', () => ({
  n8nDocumentationToolsFinal: []
}));

vi.mock('../src/mcp/tools-n8n-manager', () => ({
  n8nManagementTools: []
}));

vi.mock('../src/utils/version', () => ({
  PROJECT_VERSION: '2.7.4'
}));

vi.mock('../src/config/n8n-api', () => ({
  isN8nApiConfigured: vi.fn().mockReturnValue(false)
}));

vi.mock('../src/utils/url-detector', () => ({
  getStartupBaseUrl: vi.fn().mockReturnValue('http://localhost:3000'),
  formatEndpointUrls: vi.fn().mockReturnValue({
    health: 'http://localhost:3000/health',
    mcp: 'http://localhost:3000/mcp'
  }),
  detectBaseUrl: vi.fn().mockReturnValue('http://localhost:3000')
}));

// Create mock server instance
const mockServer = {
  on: vi.fn(),
  close: vi.fn((callback) => callback())
};

// Mock Express to prevent server from starting
const mockExpressApp = {
  use: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  listen: vi.fn((port: any, host: any, callback: any) => {
    // Call the callback immediately to simulate server start
    if (callback) callback();
    return mockServer;
  }),
  set: vi.fn()
};

vi.mock('express', () => {
  const express: any = vi.fn(() => mockExpressApp);
  express.json = vi.fn();
  express.urlencoded = vi.fn();
  express.static = vi.fn();
  express.Request = {};
  express.Response = {};
  express.NextFunction = {};
  return { default: express };
});

describe('HTTP Server Authentication', () => {
  const originalEnv = process.env;
  let tempDir: string;
  let authTokenFile: string;

  beforeEach(() => {
    // Reset modules and environment
    vi.clearAllMocks();
    vi.resetModules();
    process.env = { ...originalEnv };
    
    // Create temporary directory for test files
    tempDir = join(tmpdir(), `http-server-auth-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    authTokenFile = join(tempDir, 'auth-token');
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Clean up temporary directory
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('loadAuthToken', () => {
    it('should load token when AUTH_TOKEN environment variable is set', () => {
      process.env.AUTH_TOKEN = 'test-token-from-env';
      delete process.env.AUTH_TOKEN_FILE;

      const token = loadAuthToken();
      expect(token).toBe('test-token-from-env');
    });

    it('should load token from file when only AUTH_TOKEN_FILE is set', () => {
      delete process.env.AUTH_TOKEN;
      process.env.AUTH_TOKEN_FILE = authTokenFile;
      
      // Write test token to file
      writeFileSync(authTokenFile, 'test-token-from-file\n');

      const token = loadAuthToken();
      expect(token).toBe('test-token-from-file');
    });

    it('should trim whitespace when reading token from file', () => {
      delete process.env.AUTH_TOKEN;
      process.env.AUTH_TOKEN_FILE = authTokenFile;
      
      // Write token with whitespace
      writeFileSync(authTokenFile, '  test-token-with-spaces  \n\n');

      const token = loadAuthToken();
      expect(token).toBe('test-token-with-spaces');
    });

    it('should prefer AUTH_TOKEN when both variables are set', () => {
      process.env.AUTH_TOKEN = 'env-token';
      process.env.AUTH_TOKEN_FILE = authTokenFile;
      writeFileSync(authTokenFile, 'file-token');

      const token = loadAuthToken();
      expect(token).toBe('env-token');
    });

    it('should return null when AUTH_TOKEN_FILE points to non-existent file', async () => {
      delete process.env.AUTH_TOKEN;
      process.env.AUTH_TOKEN_FILE = join(tempDir, 'non-existent-file');

      // Import logger to check calls
      const { logger } = await import('../src/utils/logger');
      
      // Clear any previous mock calls
      vi.clearAllMocks();
      
      const token = loadAuthToken();
      expect(token).toBeNull();
      expect(logger.error).toHaveBeenCalled();
      const errorCall = (logger.error as MockedFunction<any>).mock.calls[0];
      expect(errorCall[0]).toContain('Failed to read AUTH_TOKEN_FILE');
      // Check that the second argument exists and is truthy (the error object)
      expect(errorCall[1]).toBeTruthy();
    });

    it('should return null when no auth variables are set', () => {
      delete process.env.AUTH_TOKEN;
      delete process.env.AUTH_TOKEN_FILE;

      const token = loadAuthToken();
      expect(token).toBeNull();
    });
  });

  describe('validateEnvironment', () => {
    it('should exit process when no auth token is available', async () => {
      delete process.env.AUTH_TOKEN;
      delete process.env.AUTH_TOKEN_FILE;

      const mockExit = vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
        throw new Error('Process exited');
      });

      // validateEnvironment is called when starting the server
      await expect(async () => {
        await startFixedHTTPServer();
      }).rejects.toThrow('Process exited');

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('should warn when token length is less than 32 characters', async () => {
      process.env.AUTH_TOKEN = 'short-token';

      // Import logger to check calls
      const { logger } = await import('../src/utils/logger');
      
      // Clear any previous mock calls
      vi.clearAllMocks();
      
      // Ensure the mock server is properly configured
      mockExpressApp.listen.mockReturnValue(mockServer);
      mockServer.on.mockReturnValue(undefined);
      
      // Start the server which will trigger validateEnvironment
      await startFixedHTTPServer();
      
      expect(logger.warn).toHaveBeenCalledWith(
        'AUTH_TOKEN should be at least 32 characters for security'
      );
    });
  });

  describe('Integration test scenarios', () => {
    it('should authenticate successfully when token is loaded from file', () => {
      // This is more of an integration test placeholder
      // In a real scenario, you'd start the server and make HTTP requests
      
      writeFileSync(authTokenFile, 'very-secure-token-with-more-than-32-characters');
      process.env.AUTH_TOKEN_FILE = authTokenFile;
      delete process.env.AUTH_TOKEN;

      const token = loadAuthToken();
      expect(token).toBe('very-secure-token-with-more-than-32-characters');
    });

    it('should load token when using Docker secrets pattern', () => {
      // Docker secrets are typically mounted at /run/secrets/
      const dockerSecretPath = join(tempDir, 'run', 'secrets', 'auth_token');
      mkdirSync(join(tempDir, 'run', 'secrets'), { recursive: true });
      writeFileSync(dockerSecretPath, 'docker-secret-token');
      
      process.env.AUTH_TOKEN_FILE = dockerSecretPath;
      delete process.env.AUTH_TOKEN;

      const token = loadAuthToken();
      expect(token).toBe('docker-secret-token');
    });
  });
});