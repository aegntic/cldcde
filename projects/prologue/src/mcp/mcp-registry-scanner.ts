/**
 * MCP Registry Scanner
 * Core module for discovering and scanning MCP servers from various registries
 */

import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import {
  MCPServer,
  MCPRegistry,
  MCPSearchRequest,
  MCPSearchResult,
  MCPError,
  MCPRegistryError,
  RateLimit
} from '../types/mcp';

export class MCPRegistryScanner extends EventEmitter {
  private registries: Map<string, MCPRegistry> = new Map();
  private httpClients: Map<string, AxiosInstance> = new Map();
  private rateLimits: Map<string, RateLimit> = new Map();
  private cache: Map<string, { data: any; expires: Date }> = new Map();
  private readonly defaultRegistries: MCPRegistry[] = [
    {
      id: 'official',
      name: 'Official MCP Registry',
      url: 'https://mcp.so',
      type: 'official',
      priority: 100,
      active: true,
      api: {
        search: '/api/v1/servers/search',
        details: '/api/v1/servers/{id}',
        stats: '/api/v1/servers/{id}/stats',
        headers: {
          'User-Agent': 'Prologue-MCP-Scanner/1.0.0'
        },
        rateLimit: {
          requests: 100,
          window: 3600
        }
      }
    },
    {
      id: 'github',
      name: 'GitHub MCP Registry',
      url: 'https://api.github.com',
      type: 'community',
      priority: 90,
      active: true,
      api: {
        search: '/search/repositories',
        details: '/repos/{owner}/{repo}',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Prologue-MCP-Scanner/1.0.0'
        },
        rateLimit: {
          requests: 60,
          window: 3600
        }
      }
    },
    {
      id: 'npm',
      name: 'NPM Registry',
      url: 'https://registry.npmjs.org',
      type: 'community',
      priority: 80,
      active: true,
      api: {
        search: '/-/v1/search',
        details: '/{package}',
        headers: {
          'User-Agent': 'Prologue-MCP-Scanner/1.0.0'
        },
        rateLimit: {
          requests: 1000,
          window: 3600
        }
      }
    }
  ];

  constructor() {
    super();
    this.initializeRegistries();
  }

  private initializeRegistries(): void {
    for (const registry of this.defaultRegistries) {
      this.addRegistry(registry);
    }
  }

  public addRegistry(registry: MCPRegistry): void {
    this.registries.set(registry.id, registry);

    if (registry.api) {
      const httpClient = axios.create({
        baseURL: registry.url,
        headers: registry.api.headers,
        timeout: 30000,
      });

      // Add request interceptor for rate limiting
      httpClient.interceptors.request.use(
        (config) => this.handleRateLimit(registry.id, config),
        (error) => Promise.reject(error)
      );

      // Add response interceptor for rate limit headers
      httpClient.interceptors.response.use(
        (response) => this.updateRateLimit(registry.id, response),
        (error) => Promise.reject(error)
      );

      this.httpClients.set(registry.id, httpClient);

      // Initialize rate limit tracking
      if (registry.api.rateLimit) {
        this.rateLimits.set(registry.id, { ...registry.api.rateLimit });
      }
    }

    this.emit('registryAdded', registry);
  }

  private async handleRateLimit(registryId: string, config: any): Promise<any> {
    const rateLimit = this.rateLimits.get(registryId);
    if (!rateLimit) return config;

    // Check if we're rate limited
    if (rateLimit.current && rateLimit.current >= rateLimit.requests) {
      const now = new Date();
      const resetAt = rateLimit.resetAt || new Date(now.getTime() + rateLimit.window * 1000);

      if (now < resetAt) {
        const waitTime = resetAt.getTime() - now.getTime();
        this.emit('rateLimited', { registryId, waitTime, resetAt });

        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    return config;
  }

  private updateRateLimit(registryId: string, response: any): any {
    const rateLimit = this.rateLimits.get(registryId);
    const registry = this.registries.get(registryId);

    if (!rateLimit || !registry?.api?.rateLimit) return response;

    // Update rate limit based on response headers
    const remaining = response.headers['x-ratelimit-remaining'];
    const reset = response.headers['x-ratelimit-reset'];

    if (remaining !== undefined) {
      rateLimit.current = registry.api.rateLimit.requests - parseInt(remaining);
    } else {
      rateLimit.current = (rateLimit.current || 0) + 1;
    }

    if (reset !== undefined) {
      rateLimit.resetAt = new Date(parseInt(reset) * 1000);
    }

    this.emit('rateLimitUpdated', { registryId, rateLimit });

    return response;
  }

  public async searchServers(request: MCPSearchRequest): Promise<MCPSearchResult[]> {
    const results: MCPSearchResult[] = [];
    const activeRegistries = Array.from(this.registries.values())
      .filter(registry => registry.active)
      .sort((a, b) => b.priority - a.priority);

    const searchPromises = activeRegistries.map(async (registry) => {
      try {
        const result = await this.searchRegistry(registry.id, request);
        return result;
      } catch (error) {
        this.emit('searchError', { registryId: registry.id, error });
        return null;
      }
    });

    const searchResults = await Promise.allSettled(searchPromises);

    for (const searchResult of searchResults) {
      if (searchResult.status === 'fulfilled' && searchResult.value) {
        results.push(searchResult.value);
      }
    }

    this.emit('searchCompleted', { request, results });
    return results;
  }

  private async searchRegistry(registryId: string, request: MCPSearchRequest): Promise<MCPSearchResult> {
    const registry = this.registries.get(registryId);
    if (!registry || !registry.api) {
      throw new MCPRegistryError(`Registry ${registryId} not found or has no API`, registryId);
    }

    const cacheKey = this.generateCacheKey(registryId, request);
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expires > new Date()) {
      this.emit('cacheHit', { registryId, cacheKey });
      return cached.data;
    }

    const startTime = Date.now();
    let servers: MCPServer[] = [];
    let total = 0;

    try {
      switch (registryId) {
        case 'official':
          ({ servers, total } = await this.searchOfficialRegistry(registry, request));
          break;
        case 'github':
          ({ servers, total } = await this.searchGitHubRegistry(registry, request));
          break;
        case 'npm':
          ({ servers, total } = await this.searchNPMRegistry(registry, request));
          break;
        default:
          throw new MCPRegistryError(`Unknown registry: ${registryId}`, registryId);
      }

      const searchTime = Date.now() - startTime;
      const result: MCPSearchResult = {
        servers,
        total,
        hasMore: request.offset ? request.offset + servers.length < total : servers.length < total,
        nextOffset: request.offset ? request.offset + servers.length : servers.length,
        searchTime,
        registry: registryId
      };

      // Cache the result
      const cacheExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      this.cache.set(cacheKey, { data: result, expires: cacheExpiry });

      this.emit('registrySearchCompleted', { registryId, result });
      return result;

    } catch (error) {
      const searchTime = Date.now() - startTime;
      this.emit('registrySearchError', { registryId, error, searchTime });
      throw error;
    }
  }

  private async searchOfficialRegistry(registry: MCPRegistry, request: MCPSearchRequest): Promise<{ servers: MCPServer[]; total: number }> {
    const client = this.httpClients.get(registry.id);
    if (!client) throw new MCPRegistryError('HTTP client not initialized', registry.id);

    const params = this.buildSearchParams(request);
    const response = await client.get(registry.api!.search, { params });

    if (!response.data || !response.data.servers) {
      return { servers: [], total: 0 };
    }

    const servers = response.data.servers.map(this.transformOfficialServer);
    return { servers, total: response.data.total || servers.length };
  }

  private async searchGitHubRegistry(registry: MCPRegistry, request: MCPSearchRequest): Promise<{ servers: MCPServer[]; total: number }> {
    const client = this.httpClients.get(registry.id);
    if (!client) throw new MCPRegistryError('HTTP client not initialized', registry.id);

    // Build GitHub search query
    const query = this.buildGitHubQuery(request);
    const params = {
      q: query,
      sort: this.mapSortBy(request.sortBy),
      order: request.sortOrder || 'desc',
      per_page: Math.min(request.limit || 20, 100),
      page: Math.floor((request.offset || 0) / (request.limit || 20)) + 1
    };

    const response = await client.get(registry.api!.search, { params });

    if (!response.data || !response.data.items) {
      return { servers: [], total: 0 };
    }

    // Filter and transform GitHub repositories
    const mcpRepos = response.data.items.filter(repo =>
      repo.name.includes('mcp') ||
      repo.description?.toLowerCase().includes('model context protocol') ||
      repo.topics?.includes('mcp') ||
      repo.topics?.includes('model-context-protocol')
    );

    const servers = await Promise.all(
      mcpRepos.map(repo => this.transformGitHubRepo(repo, client))
    );

    return { servers, total: response.data.total_count };
  }

  private async searchNPMRegistry(registry: MCPRegistry, request: MCPSearchRequest): Promise<{ servers: MCPServer[]; total: number }> {
    const client = this.httpClients.get(registry.id);
    if (!client) throw new MCPRegistryError('HTTP client not initialized', registry.id);

    const params = {
      text: this.buildNPMQuery(request),
      size: Math.min(request.limit || 20, 250),
      from: request.offset || 0
    };

    const response = await client.get(registry.api!.search, { params });

    if (!response.data || !response.data.objects) {
      return { servers: [], total: 0 };
    }

    // Filter for MCP-related packages
    const mcpPackages = response.data.objects.filter(pkg =>
      pkg.package.name.includes('mcp') ||
      pkg.package.description?.toLowerCase().includes('model context protocol') ||
      pkg.package.keywords?.some((keyword: string) => keyword.includes('mcp'))
    );

    const servers = mcpPackages.map(pkg => this.transformNPMPackage(pkg));
    return { servers, total: response.data.total };
  }

  private buildSearchParams(request: MCPSearchRequest): Record<string, any> {
    const params: any = {
      limit: request.limit || 20,
      offset: request.offset || 0
    };

    if (request.query) params.q = request.query;
    if (request.category) params.category = request.category;
    if (request.capabilities) params.capabilities = request.capabilities.join(',');
    if (request.transport) params.transport = request.transport.join(',');
    if (request.verified !== undefined) params.verified = request.verified;
    if (request.sortBy) params.sort = request.sortBy;
    if (request.sortOrder) params.order = request.sortOrder;

    return params;
  }

  private buildGitHubQuery(request: MCPSearchRequest): string {
    const queryParts = ['topic:mcp OR topic:model-context-protocol'];

    if (request.query) {
      queryParts.unshift(request.query);
    }

    if (request.category) {
      queryParts.push(`${request.category}`);
    }

    return queryParts.join(' ');
  }

  private buildNPMQuery(request: MCPSearchRequest): string {
    const queryParts = ['mcp'];

    if (request.query) {
      queryParts.push(request.query);
    }

    return queryParts.join(' ');
  }

  private mapSortBy(sortBy?: string): string {
    switch (sortBy) {
      case 'popularity': return 'stars';
      case 'updated': return 'updated';
      case 'created': return 'created';
      default: return 'stars';
    }
  }

  private transformOfficialServer(data: any): MCPServer {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      version: data.version,
      author: data.author,
      repository: data.repository,
      homepage: data.homepage,
      license: data.license,
      keywords: data.keywords || [],
      category: data.category || 'other',
      capabilities: data.capabilities || { tools: true, resources: false, prompts: false, logging: false },
      transport: data.transport || ['stdio'],
      installation: data.installation || { methods: [], dependencies: {} },
      configuration: data.configuration || { required: [], optional: [], env: {}, examples: {} },
      metadata: {
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        downloads: data.downloads || 0,
        stars: data.stars || 0,
        maintainers: data.maintainers || [],
        securityScore: data.security_score || 0,
        performanceScore: data.performance_score || 0,
        communityScore: data.community_score || 0,
        tags: data.tags || [],
        verified: data.verified || false
      }
    };
  }

  private async transformGitHubRepo(repo: any, client: AxiosInstance): Promise<MCPServer> {
    // Fetch additional details from the repository
    let mcpJson = null;
    try {
      const contentResponse = await client.get(`/repos/${repo.full_name}/contents/mcp.json`);
      if (contentResponse.data.content) {
        const content = Buffer.from(contentResponse.data.content, 'base64').toString();
        mcpJson = JSON.parse(content);
      }
    } catch (error) {
      // mcp.json not found, use defaults
    }

    return {
      id: `github-${repo.id}`,
      name: repo.name,
      description: repo.description || '',
      version: 'latest',
      author: repo.owner.login,
      repository: repo.html_url,
      homepage: repo.homepage,
      license: repo.license?.key || 'UNKNOWN',
      keywords: repo.topics || [],
      category: this.inferCategory(repo.topics, repo.description),
      capabilities: mcpJson?.capabilities || { tools: true, resources: false, prompts: false, logging: false },
      transport: mcpJson?.transport || ['stdio'],
      installation: mcpJson?.installation || {
        methods: [{ type: 'npm', command: 'npx', args: [repo.name] }],
        dependencies: {}
      },
      configuration: mcpJson?.configuration || { required: [], optional: [], env: {}, examples: {} },
      metadata: {
        createdAt: new Date(repo.created_at),
        updatedAt: new Date(repo.updated_at),
        downloads: 0, // GitHub doesn't provide download counts
        stars: repo.stargazers_count,
        lastCommit: new Date(repo.pushed_at),
        maintainers: [repo.owner.login],
        securityScore: 0,
        performanceScore: 0,
        communityScore: repo.stargazers_count / 100, // Simple heuristic
        tags: repo.topics || [],
        verified: repo.owner.type === 'Organization'
      }
    };
  }

  private transformNPMPackage(pkg: any): MCPServer {
    return {
      id: `npm-${pkg.package.name}`,
      name: pkg.package.name,
      description: pkg.package.description || '',
      version: pkg.package.version,
      author: pkg.package.publisher?.username || 'Unknown',
      repository: pkg.package.links?.repository,
      homepage: pkg.package.links?.homepage,
      license: pkg.package.license || 'UNKNOWN',
      keywords: pkg.package.keywords || [],
      category: this.inferCategory(pkg.package.keywords, pkg.package.description),
      capabilities: { tools: true, resources: false, prompts: false, logging: false },
      transport: ['stdio'],
      installation: {
        methods: [{ type: 'npm', command: 'npx', args: [pkg.package.name] }],
        dependencies: pkg.package.dependencies || {}
      },
      configuration: { required: [], optional: [], env: {}, examples: {} },
      metadata: {
        createdAt: new Date(pkg.package.date),
        updatedAt: new Date(pkg.package.date),
        downloads: pkg.package.downloads?.lastWeek || 0,
        stars: 0,
        maintainers: pkg.package.maintainers?.map((m: any) => m.username) || [],
        securityScore: 0,
        performanceScore: 0,
        communityScore: 0,
        tags: pkg.package.keywords || [],
        verified: false
      }
    };
  }

  private inferCategory(topics: string[] = [], description: string = ''): any {
    const text = `${topics.join(' ')} ${description}`.toLowerCase();

    if (text.includes('develop') || text.includes('code') || text.includes('git')) return 'development';
    if (text.includes('data') || text.includes('analyt')) return 'data-analysis';
    if (text.includes('ai') || text.includes('ml') || text.includes('machine')) return 'ai-ml';
    if (text.includes('test') || text.includes('testing')) return 'testing';
    if (text.includes('monitor') || text.includes('observ')) return 'monitoring';
    if (text.includes('database') || text.includes('db')) return 'database';
    if (text.includes('security') || text.includes('auth')) return 'security';
    if (text.includes('automat') || text.includes('workflow')) return 'automation';

    return 'other';
  }

  private generateCacheKey(registryId: string, request: MCPSearchRequest): string {
    const key = `${registryId}-${JSON.stringify({
      query: request.query,
      category: request.category,
      capabilities: request.capabilities,
      transport: request.transport,
      verified: request.verified,
      limit: request.limit,
      offset: request.offset,
      sortBy: request.sortBy,
      sortOrder: request.sortOrder
    })}`;

    return Buffer.from(key).toString('base64');
  }

  public async getServerDetails(registryId: string, serverId: string): Promise<MCPServer> {
    const registry = this.registries.get(registryId);
    if (!registry || !registry.api) {
      throw new MCPRegistryError(`Registry ${registryId} not found or has no API`, registryId);
    }

    const cacheKey = `${registryId}-details-${serverId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expires > new Date()) {
      return cached.data;
    }

    // Implementation would vary by registry
    // This is a simplified version
    throw new MCPError('Server details not implemented yet', 'NOT_IMPLEMENTED');
  }

  public clearCache(): void {
    this.cache.clear();
    this.emit('cacheCleared');
  }

  public getRegistries(): MCPRegistry[] {
    return Array.from(this.registries.values());
  }

  public getRegistry(id: string): MCPRegistry | undefined {
    return this.registries.get(id);
  }

  public removeRegistry(id: string): boolean {
    const removed = this.registries.delete(id);
    this.httpClients.delete(id);
    this.rateLimits.delete(id);

    if (removed) {
      this.emit('registryRemoved', id);
    }

    return removed;
  }
}