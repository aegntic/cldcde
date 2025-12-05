/**
 * MCP Registry Scanner Tests
 * Tests for the MCP registry discovery and scanning functionality
 */

import { MCPRegistryScanner } from '../mcp-registry-scanner';
import { MCPSearchRequest, MCPCategory } from '../../types/mcp';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('MCPRegistryScanner', () => {
  let scanner: MCPRegistryScanner;

  beforeEach(() => {
    scanner = new MCPRegistryScanner();

    // Mock axios create
    mockAxios.create.mockReturnValue({
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registry management', () => {
    it('should initialize with default registries', () => {
      const registries = scanner.getRegistries();

      expect(registries).toHaveLength(3);
      expect(registries.find(r => r.id === 'official')).toBeDefined();
      expect(registries.find(r => r.id === 'github')).toBeDefined();
      expect(registries.find(r => r.id === 'npm')).toBeDefined();
    });

    it('should add custom registry', () => {
      const customRegistry = {
        id: 'custom-registry',
        name: 'Custom Registry',
        url: 'https://custom-registry.com',
        type: 'community' as const,
        priority: 50,
        active: true
      };

      scanner.addRegistry(customRegistry);
      const registries = scanner.getRegistries();

      expect(registries).toHaveLength(4);
      expect(registries.find(r => r.id === 'custom-registry')).toBeDefined();
    });

    it('should remove registry', () => {
      const removed = scanner.removeRegistry('npm');
      expect(removed).toBe(true);

      const registries = scanner.getRegistries();
      expect(registries).toHaveLength(2);
      expect(registries.find(r => r.id === 'npm')).toBeUndefined();
    });
  });

  describe('search functionality', () => {
    it('should search servers with basic query', async () => {
      // Mock successful search responses
      const mockResponses = [
        {
          data: {
            servers: [
              {
                id: 'test-server-1',
                name: 'Test Server 1',
                description: 'A test server',
                version: '1.0.0',
                category: 'development',
                capabilities: { tools: true },
                transport: ['stdio'],
                installation: { methods: [], dependencies: {} },
                configuration: { required: [], optional: [], env: {}, examples: {} },
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z',
                downloads: 100,
                stars: 50,
                maintainers: ['testauthor'],
                security_score: 0.8,
                performance_score: 0.9,
                community_score: 0.7,
                tags: ['test'],
                verified: true
              }
            ],
            total: 1
          }
        }
      ];

      // Mock the HTTP client get method
      const mockGet = jest.fn().mockResolvedValue(mockResponses[0]);
      mockAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      const searchRequest: MCPSearchRequest = {
        query: 'test',
        limit: 10
      };

      const results = await scanner.searchServers(searchRequest);

      expect(results).toHaveLength(3); // One result per registry
      expect(mockGet).toHaveBeenCalled();
    });

    it('should handle search errors gracefully', async () => {
      // Mock failed search
      const mockGet = jest.fn().mockRejectedValue(new Error('Network error'));
      mockAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      const searchRequest: MCPSearchRequest = {
        query: 'test',
        limit: 10
      };

      const results = await scanner.searchServers(searchRequest);

      expect(results).toHaveLength(3); // Should still return array, even with errors
    });

    it('should use cache for repeated searches', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: {
          servers: [],
          total: 0
        }
      });

      mockAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      const searchRequest: MCPSearchRequest = {
        query: 'cached-search',
        limit: 10
      };

      // First search
      await scanner.searchServers(searchRequest);
      expect(mockGet).toHaveBeenCalledTimes(3);

      // Second search (should use cache)
      await scanner.searchServers(searchRequest);
      expect(mockGet).toHaveBeenCalledTimes(3); // Should not increase
    });
  });

  describe('rate limiting', () => {
    it('should handle rate limiting', async () => {
      const mockGet = jest.fn().mockImplementation(() => {
        const error = new Error('Rate limit exceeded');
        (error as any).response = {
          status: 429,
          headers: {
            'x-ratelimit-reset': Math.floor(Date.now() / 1000) + 1
          }
        };
        throw error;
      });

      mockAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      // Set up event listener to capture rate limit events
      const rateLimitCallback = jest.fn();
      scanner.on('rateLimited', rateLimitCallback);

      const searchRequest: MCPSearchRequest = {
        query: 'test',
        limit: 10
      };

      // This should trigger rate limiting
      await scanner.searchServers(searchRequest);

      expect(rateLimitCallback).toHaveBeenCalled();
    });
  });

  describe('server transformation', () => {
    it('should transform official registry server data correctly', () => {
      const scanner = new MCPRegistryScanner();
      const mockServerData = {
        id: 'official-test-server',
        name: 'Official Test Server',
        description: 'An official test server',
        version: '2.0.0',
        author: 'Official Author',
        repository: 'https://github.com/official/test-server',
        homepage: 'https://official-test-server.com',
        license: 'Apache-2.0',
        keywords: ['official', 'test', 'mcp'],
        category: 'productivity',
        capabilities: {
          tools: true,
          resources: true,
          prompts: false,
          logging: true,
          completions: {
            supports: ['text', 'code'],
            default_provider: 'openai'
          }
        },
        transport: ['stdio', 'sse'],
        installation: {
          methods: [
            { type: 'npm', command: 'npm', args: ['install', 'official-test-server'] },
            { type: 'npx', command: 'npx', args: ['official-test-server'] }
          ],
          dependencies: {
            'axios': '^1.0.0'
          }
        },
        configuration: {
          required: ['API_KEY'],
          optional: ['TIMEOUT'],
          env: {
            'API_KEY': {
              name: 'API_KEY',
              description: 'API key for external service',
              required: true,
              sensitive: true
            }
          },
          examples: {
            'API_KEY': 'your-api-key-here'
          }
        },
        created_at: '2023-06-01T00:00:00Z',
        updated_at: '2023-06-15T00:00:00Z',
        downloads: 5000,
        stars: 250,
        maintainers: ['officialauthor', 'contributor'],
        security_score: 0.95,
        performance_score: 0.88,
        community_score: 0.92,
        tags: ['official', 'productivity', 'api'],
        verified: true
      };

      const result = (scanner as any).transformOfficialServer(mockServerData);

      expect(result.id).toBe('official-test-server');
      expect(result.name).toBe('Official Test Server');
      expect(result.category).toBe('productivity');
      expect(result.capabilities.tools).toBe(true);
      expect(result.capabilities.resources).toBe(true);
      expect(result.capabilities.completions).toBeDefined();
      expect(result.transport).toEqual(['stdio', 'sse']);
      expect(result.installation.methods).toHaveLength(2);
      expect(result.configuration.required).toContain('API_KEY');
      expect(result.metadata.verified).toBe(true);
      expect(result.metadata.downloads).toBe(5000);
      expect(result.metadata.stars).toBe(250);
    });

    it('should transform GitHub repository data correctly', async () => {
      const scanner = new MCPRegistryScanner();
      const mockRepoData = {
        id: 123456789,
        name: 'github-mcp-server',
        full_name: 'testuser/github-mcp-server',
        description: 'A GitHub-based MCP server',
        html_url: 'https://github.com/testuser/github-mcp-server',
        homepage: 'https://github-mcp-server.com',
        license: { key: 'MIT' },
        topics: ['mcp', 'model-context-protocol', 'automation'],
        stargazers_count: 150,
        pushed_at: '2023-06-10T12:00:00Z',
        owner: {
          login: 'testuser',
          type: 'User'
        }
      };

      const mockHttpClient = {
        get: jest.fn().mockResolvedValue({
          data: {
            content: Buffer.from(JSON.stringify({
              capabilities: { tools: true, resources: true },
              transport: ['stdio'],
              installation: {
                methods: [{ type: 'npm', command: 'npx', args: ['github-mcp-server'] }],
                dependencies: { 'node-fetch': '^3.0.0' }
              }
            })).toString('base64')
          }
        })
      };

      const result = await (scanner as any).transformGitHubRepo(mockRepoData, mockHttpClient);

      expect(result.id).toBe('github-123456789');
      expect(result.name).toBe('github-mcp-server');
      expect(result.author).toBe('testuser');
      expect(result.repository).toBe('https://github.com/testuser/github-mcp-server');
      expect(result.category).toBe('automation'); // Should be inferred from topics
      expect(result.metadata.stars).toBe(150);
      expect(result.metadata.verified).toBe(false); // User repos are not verified by default
    });

    it('should transform NPM package data correctly', () => {
      const scanner = new MCPRegistryScanner();
      const mockPackageData = {
        package: {
          name: '@scope/npm-mcp-server',
          version: '1.2.3',
          description: 'An NPM-based MCP server',
          publisher: { username: 'npmpublisher' },
          links: {
            repository: 'https://github.com/npmpublisher/npm-mcp-server',
            homepage: 'https://npm-mcp-server.com'
          },
          license: 'ISC',
          keywords: ['mcp', 'npm', 'server'],
          dependencies: {
            'express': '^4.0.0',
            'lodash': '^4.0.0'
          },
          date: '2023-05-20T00:00:00.000Z',
          downloads: {
            lastWeek: 850
          },
          maintainers: [
            { username: 'npmpublisher' },
            { username: 'contributor' }
          ]
        }
      };

      const result = (scanner as any).transformNPMPackage(mockPackageData);

      expect(result.id).toBe('npm-@scope/npm-mcp-server');
      expect(result.name).toBe('@scope/npm-mcp-server');
      expect(result.version).toBe('1.2.3');
      expect(result.author).toBe('npmpublisher');
      expect(result.metadata.downloads).toBe(850);
      expect(result.installation.dependencies).toEqual({
        'express': '^4.0.0',
        'lodash': '^4.0.0'
      });
    });
  });

  describe('category inference', () => {
    it('should infer categories from topics and descriptions', () => {
      const scanner = new MCPRegistryScanner();

      // Test development category
      expect((scanner as any).inferCategory(['development', 'tools'], 'A development tool')).toBe('development');

      // Test AI/ML category
      expect((scanner as any).inferCategory(['ai', 'machine-learning'], 'An AI-powered server')).toBe('ai-ml');

      // Test database category
      expect((scanner as any).inferCategory(['database', 'postgres'], 'Database tools')).toBe('database');

      // Test default category
      expect((scanner as any).inferCategory(['misc'], 'A general purpose tool')).toBe('other');
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      const cacheClearedCallback = jest.fn();
      scanner.on('cacheCleared', cacheClearedCallback);

      scanner.clearCache();

      expect(cacheClearedCallback).toHaveBeenCalled();
    });

    it('should generate consistent cache keys', () => {
      const scanner = new MCPRegistryScanner();
      const request1: MCPSearchRequest = {
        query: 'test',
        category: 'development' as MCPCategory,
        limit: 10
      };

      const request2: MCPSearchRequest = {
        query: 'test',
        category: 'development' as MCPCategory,
        limit: 10
      };

      const key1 = (scanner as any).generateCacheKey('official', request1);
      const key2 = (scanner as any).generateCacheKey('official', request2);

      expect(key1).toBe(key2);

      // Different requests should generate different keys
      const request3: MCPSearchRequest = {
        query: 'different',
        category: 'development' as MCPCategory,
        limit: 10
      };

      const key3 = (scanner as any).generateCacheKey('official', request3);
      expect(key1).not.toBe(key3);
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockGet = jest.fn().mockRejectedValue(new Error('Network timeout'));
      mockAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      const errorCallback = jest.fn();
      scanner.on('searchError', errorCallback);

      const searchRequest: MCPSearchRequest = {
        query: 'test',
        limit: 10
      };

      const results = await scanner.searchServers(searchRequest);

      expect(results).toHaveLength(3); // Should return results for all registries, even with errors
      expect(errorCallback).toHaveBeenCalledTimes(3);
    });
  });
});