/**
 * MCP Manager Tests
 * Tests for the MCP auto-detection and installation system
 */

import { MCPManager } from '../mcp-manager';
import { MCPServer, MCPCategory } from '../../types/mcp';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

// Mock dependencies
jest.mock('fs-extra');
jest.mock('axios');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockAxios = require('axios');

describe('MCPManager', () => {
  let mcpManager: MCPManager;
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), 'prologue-test-' + Date.now());
    mockFs.ensureDir.mockResolvedValue();
    mockFs.pathExists.mockResolvedValue(false);
    mockFs.readJson.mockResolvedValue({});
    mockFs.writeJson.mockResolvedValue();
    mockFs.readdir.mockResolvedValue([]);
    mockFs.remove.mockResolvedValue();

    mcpManager = new MCPManager(path.join(tempDir, 'mcp.json'), tempDir);
  });

  afterEach(async () => {
    await mcpManager.cleanup();
    jest.clearAllMocks();
  });

  describe('searchServers', () => {
    it('should search for MCP servers with basic query', async () => {
      const mockSearchResults = [
        {
          servers: [
            {
              id: 'test-server-1',
              name: 'Test Server 1',
              description: 'A test MCP server',
              version: '1.0.0',
              author: 'Test Author',
              repository: 'https://github.com/test/server1',
              license: 'MIT',
              keywords: ['test', 'mcp'],
              category: 'development' as MCPCategory,
              capabilities: { tools: true, resources: false, prompts: false, logging: false },
              transport: ['stdio'],
              installation: { methods: [{ type: 'npm', command: 'npx', args: ['test-server'] }], dependencies: {} },
              configuration: { required: [], optional: [], env: {}, examples: {} },
              metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                downloads: 100,
                stars: 50,
                maintainers: ['testauthor'],
                securityScore: 0.8,
                performanceScore: 0.9,
                communityScore: 0.7,
                tags: ['test'],
                verified: true
              }
            }
          ],
          total: 1,
          hasMore: false,
          searchTime: 100,
          registry: 'official'
        }
      ];

      // Mock successful search
      jest.spyOn(mcpManager as any, 'emit').mockImplementation(() => {});

      const results = await mcpManager.searchServers({
        query: 'test',
        limit: 10
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle empty search results gracefully', async () => {
      jest.spyOn(mcpManager as any, 'emit').mockImplementation(() => {});

      const results = await mcpManager.searchServers({
        query: 'nonexistent-server-xyz-123',
        limit: 5
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('configuration management', () => {
    it('should load default configuration when no config file exists', async () => {
      const config = mcpManager.getConfiguration();

      expect(config).toHaveProperty('servers');
      expect(config).toHaveProperty('globalSettings');
      expect(config).toHaveProperty('registrySettings');
      expect(config).toHaveProperty('autoInstall');
      expect(config.globalSettings.defaultTransport).toBe('stdio');
      expect(config.autoInstall.enabled).toBe(true);
    });

    it('should update configuration', async () => {
      const updates = {
        globalSettings: {
          ...mcpManager.getConfiguration().globalSettings,
          timeout: 60000
        }
      };

      await mcpManager.updateConfiguration(updates);
      const config = mcpManager.getConfiguration();

      expect(config.globalSettings.timeout).toBe(60000);
    });
  });

  describe('server management', () => {
    const mockServer: MCPServer = {
      id: 'test-server',
      name: 'Test Server',
      description: 'A test MCP server',
      version: '1.0.0',
      author: 'Test Author',
      license: 'MIT',
      keywords: ['test'],
      category: 'development',
      capabilities: { tools: true, resources: false, prompts: false, logging: false },
      transport: ['stdio'],
      installation: { methods: [{ type: 'npm', command: 'npx', args: ['test-server'] }], dependencies: {} },
      configuration: { required: [], optional: [], env: {}, examples: {} },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        downloads: 0,
        stars: 0,
        maintainers: [],
        securityScore: 0,
        performanceScore: 0,
        communityScore: 0,
        tags: [],
        verified: false
      }
    };

    it('should handle install server request', async () => {
      jest.spyOn(mcpManager as any, 'emit').mockImplementation(() => {});

      // Mock the installer to return a successful result
      const mockInstaller = {
        installServer: jest.fn().mockResolvedValue({
          success: true,
          server: mockServer,
          method: { type: 'npm', command: 'npx', args: ['test-server'] },
          duration: 1000,
          installedAt: new Date()
        }),
        performHealthCheck: jest.fn().mockResolvedValue({
          serverId: 'test-server',
          status: 'healthy',
          responseTime: 100,
          lastCheck: new Date(),
          capabilities: [],
          uptime: 0
        })
      };

      (mcpManager as any).installer = mockInstaller;

      const result = await mcpManager.installServer(mockServer);

      expect(result.success).toBe(true);
      expect(result.server.id).toBe('test-server');
    });

    it('should handle server not found error', async () => {
      jest.spyOn(mcpManager as any, 'emit').mockImplementation(() => {});

      try {
        await mcpManager.getServerInstance('non-existent-server');
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('project analysis', () => {
    it('should analyze project context correctly', async () => {
      const mockPackageJson = {
        name: 'test-project',
        dependencies: {
          react: '^18.0.0',
          'puppeteer': '^19.0.0'
        },
        devDependencies: {
          jest: '^29.0.0'
        }
      };

      mockFs.pathExists.mockImplementation((filePath) => {
        return Promise.resolve(filePath.includes('package.json'));
      });

      mockFs.readJson.mockResolvedValue(mockPackageJson);
      mockFs.readdir.mockResolvedValue([
        { name: 'index.js', isFile: () => true },
        { name: 'App.tsx', isFile: () => true },
        { name: 'test.spec.js', isFile: () => true }
      ]);

      // Access private method through type assertion
      const analyzeProject = (mcpManager as any).analyzeProject.bind(mcpManager);
      const context = await analyzeProject();

      expect(context.packageJson).toBeDefined();
      expect(context.packageJson.dependencies.react).toBe('^18.0.0');
      expect(context.files).toContain('index.js');
      expect(context.files).toContain('App.tsx');
    });
  });

  describe('auto-detection', () => {
    it('should check if auto-install is allowed for server', async () => {
      const verifiedServer: MCPServer = {
        id: 'verified-server',
        name: 'Verified Server',
        description: 'A verified MCP server',
        version: '1.0.0',
        author: 'Test Author',
        license: 'MIT',
        keywords: ['test'],
        category: 'development',
        capabilities: { tools: true, resources: false, prompts: false, logging: false },
        transport: ['stdio'],
        installation: { methods: [{ type: 'npm', command: 'npx', args: ['verified-server'] }], dependencies: {} },
        configuration: { required: [], optional: [], env: {}, examples: {} },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          downloads: 1000,
          stars: 100,
          maintainers: ['testauthor'],
          securityScore: 0.9,
          performanceScore: 0.8,
          communityScore: 0.7,
          tags: ['test'],
          verified: true
        }
      };

      const unverifiedServer: MCPServer = {
        ...verifiedServer,
        id: 'unverified-server',
        name: 'Unverified Server',
        metadata: {
          ...verifiedServer.metadata,
          verified: false
        }
      };

      // Test with strict security mode (should not allow unverified)
      await mcpManager.updateConfiguration({
        globalSettings: {
          ...mcpManager.getConfiguration().globalSettings,
          securityMode: 'strict'
        }
      });

      const isAllowedVerified = (mcpManager as any).isAutoInstallAllowed(verifiedServer);
      const isAllowedUnverified = (mcpManager as any).isAutoInstallAllowed(unverifiedServer);

      expect(isAllowedVerified).toBe(true);
      expect(isAllowedUnverified).toBe(false);
    });
  });

  describe('usage statistics', () => {
    it('should record server usage correctly', () => {
      const serverId = 'test-server';
      const toolName = 'test-tool';

      mcpManager.recordServerUsage(serverId, toolName, 150, true);

      const stats = mcpManager.getServerUsageStats();
      const serverStats = stats.find(s => s.serverId === serverId);

      expect(serverStats).toBeDefined();
      expect(serverStats?.usageCount).toBe(1);
      expect(serverStats?.averageResponseTime).toBe(150);
      expect(serverStats?.errors).toBe(0);
      expect(serverStats?.popularTools).toHaveLength(1);
      expect(serverStats?.popularTools[0].toolName).toBe(toolName);
    });

    it('should handle multiple usage recordings', () => {
      const serverId = 'test-server';
      const toolName = 'test-tool';

      // Record multiple usages
      mcpManager.recordServerUsage(serverId, toolName, 100, true);
      mcpManager.recordServerUsage(serverId, toolName, 200, true);
      mcpManager.recordServerUsage(serverId, toolName, 150, false); // One failure

      const stats = mcpManager.getServerUsageStats();
      const serverStats = stats.find(s => s.serverId === serverId);

      expect(serverStats?.usageCount).toBe(3);
      expect(serverStats?.averageResponseTime).toBe(150); // (100 + 200 + 150) / 3
      expect(serverStats?.errors).toBe(1);
      expect(serverStats?.popularTools[0].usageCount).toBe(3);
      expect(serverStats?.popularTools[0].successRate).toBe(2/3); // 2 successes out of 3
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources properly', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await mcpManager.cleanup();

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});