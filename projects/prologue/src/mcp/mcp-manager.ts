/**
 * MCP Manager
 * Central orchestrator for MCP auto-detection, installation, and management
 */

import { EventEmitter } from 'events';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import {
  MCPServer,
  MCPSearchRequest,
  MCPSearchResult,
  MCPInstallationResult,
  MCPProjectConfig,
  MCPServerInstance,
  MCPCategory,
  AutoInstallSettings,
  MCPGlobalSettings,
  MCPRegistrySettings,
  MCPHealthCheck,
  MCPUsageStats,
  MCPError
} from '../types/mcp';
import { MCPRegistryScanner } from './mcp-registry-scanner';
import { MCPInstaller } from './mcp-installer';

export class MCPManager extends EventEmitter {
  private scanner: MCPRegistryScanner;
  private installer: MCPInstaller;
  private config: MCPProjectConfig;
  private configPath: string;
  private projectUsageStats: Map<string, MCPUsageStats> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(
    configPath?: string,
    installationPath?: string
  ) {
    super();

    this.configPath = configPath || path.join(process.cwd(), '.prologue', 'mcp.json');
    this.config = this.getDefaultConfig();

    this.scanner = new MCPRegistryScanner();
    this.installer = new MCPInstaller(installationPath);

    this.setupEventHandlers();
    this.loadConfiguration();
    this.loadInstalledServers();
  }

  private getDefaultConfig(): MCPProjectConfig {
    return {
      servers: {},
      globalSettings: {
        defaultTransport: 'stdio',
        timeout: 30000,
        retryAttempts: 3,
        logLevel: 'info',
        securityMode: 'balanced',
        autoUpdate: true,
        telemetryEnabled: false
      },
      registrySettings: {
        enabledRegistries: ['official', 'github', 'npm'],
        syncInterval: 3600000, // 1 hour
        autoSync: true,
        cacheTimeout: 900000, // 15 minutes
        maxCacheSize: 1000
      },
      autoInstall: {
        enabled: true,
        confidenceThreshold: 0.8,
        autoConfirm: false,
        requireVerification: true,
        allowedCategories: ['development', 'productivity', 'data-analysis'],
        blockedServers: [],
        installDelay: 5000 // 5 seconds
      }
    };
  }

  private setupEventHandlers(): void {
    // Scanner events
    this.scanner.on('searchCompleted', (data) => {
      this.emit('searchCompleted', data);
    });

    this.scanner.on('searchError', (data) => {
      this.emit('searchError', data);
    });

    this.scanner.on('registrySearchCompleted', (data) => {
      this.emit('registrySearchCompleted', data);
    });

    this.scanner.on('rateLimited', (data) => {
      this.emit('rateLimited', data);
    });

    // Installer events
    this.installer.on('installationStarted', (data) => {
      this.emit('installationStarted', data);
    });

    this.installer.on('installationCompleted', (result) => {
      this.handleInstallationCompleted(result);
    });

    this.installer.on('installationFailed', (result) => {
      this.emit('installationFailed', result);
    });

    this.installer.on('verificationCompleted', (data) => {
      this.emit('verificationCompleted', data);
    });

    this.installer.on('configurationCompleted', (data) => {
      this.emit('configurationCompleted', data);
    });

    this.installer.on('securityWarning', (data) => {
      this.emit('securityWarning', data);
    });
  }

  private async loadConfiguration(): Promise<void> {
    try {
      if (await fs.pathExists(this.configPath)) {
        const configData = await fs.readJson(this.configPath);
        this.config = this.mergeConfig(this.config, configData);
      }
      await this.saveConfiguration();
    } catch (error) {
      this.emit('error', new MCPError(
        `Failed to load MCP configuration: ${error}`,
        'CONFIG_LOAD_ERROR'
      ));
    }
  }

  private mergeConfig(defaultConfig: MCPProjectConfig, userConfig: Partial<MCPProjectConfig>): MCPProjectConfig {
    return {
      servers: { ...defaultConfig.servers, ...userConfig.servers },
      globalSettings: { ...defaultConfig.globalSettings, ...userConfig.globalSettings },
      registrySettings: { ...defaultConfig.registrySettings, ...userConfig.registrySettings },
      autoInstall: { ...defaultConfig.autoInstall, ...userConfig.autoInstall }
    };
  }

  private async saveConfiguration(): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.configPath));
      await fs.writeJson(this.configPath, this.config, { spaces: 2 });
    } catch (error) {
      this.emit('error', new MCPError(
        `Failed to save MCP configuration: ${error}`,
        'CONFIG_SAVE_ERROR'
      ));
    }
  }

  private async loadInstalledServers(): Promise<void> {
    try {
      await this.installer.loadInstalledServers();
      const instances = this.installer.getInstalledServers();

      // Load instances into configuration
      for (const instance of instances) {
        this.config.servers[instance.serverId] = instance;
      }

      // Start health checks
      this.startHealthChecks();

      this.emit('serversLoaded', { count: instances.length });
    } catch (error) {
      this.emit('error', new MCPError(
        `Failed to load installed servers: ${error}`,
        'SERVERS_LOAD_ERROR'
      ));
    }
  }

  private startHealthChecks(): void {
    // Check server health every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 300000);

    // Initial health check
    this.performHealthChecks();
  }

  private async performHealthChecks(): Promise<void> {
    const instances = Object.values(this.config.servers);

    for (const instance of instances) {
      try {
        const healthCheck = await this.installer.performHealthCheck(instance);
        instance.healthStatus = healthCheck.status;

        if (healthCheck.status === 'unhealthy') {
          this.emit('serverUnhealthy', { serverId: instance.serverId, healthCheck });
        }
      } catch (error) {
        instance.healthStatus = 'unknown';
        this.emit('healthCheckError', { serverId: instance.serverId, error });
      }
    }

    await this.saveConfiguration();
  }

  private handleInstallationCompleted(result: MCPInstallationResult): Promise<void> {
    if (result.success && result.configuration) {
      const instance: MCPServerInstance = {
        serverId: result.server.id,
        enabled: true,
        configuration: result.configuration,
        autoStart: true,
        priority: 50,
        installedAt: result.installedAt,
        version: result.server.version,
        healthStatus: 'healthy'
      };

      this.config.servers[result.server.id] = instance;
      this.saveConfiguration();

      // Initialize usage stats
      this.projectUsageStats.set(result.server.id, {
        serverId: result.server.id,
        projectId: this.getProjectId(),
        usageCount: 0,
        lastUsed: new Date(),
        averageResponseTime: 0,
        errors: 0,
        popularTools: []
      });
    }

    this.emit('installationCompleted', result);
  }

  // Public API methods

  public async searchServers(request: MCPSearchRequest): Promise<MCPSearchResult[]> {
    try {
      this.emit('searchStarted', { request });
      const results = await this.scanner.searchServers(request);

      // Apply filters based on configuration
      const filteredResults = this.filterSearchResults(results);

      this.emit('searchCompleted', { request, results: filteredResults });
      return filteredResults;
    } catch (error) {
      this.emit('searchError', { request, error });
      throw error;
    }
  }

  private filterSearchResults(results: MCPSearchResult[]): MCPSearchResult[] {
    return results.map(result => ({
      ...result,
      servers: result.servers.filter(server => {
        // Filter out blocked servers
        if (this.config.autoInstall.blockedServers.includes(server.id)) {
          return false;
        }

        // Filter by allowed categories if auto-install is enabled
        if (this.config.autoInstall.enabled &&
            !this.config.autoInstall.allowedCategories.includes(server.category)) {
          return false;
        }

        // Filter unverified servers if in strict mode
        if (this.config.globalSettings.securityMode === 'strict' && !server.metadata.verified) {
          return false;
        }

        return true;
      })
    }));
  }

  public async installServer(
    server: MCPServer,
    configuration?: Record<string, any>,
    autoInstall: boolean = false
  ): Promise<MCPInstallationResult> {
    // Check if auto-install is allowed
    if (autoInstall && !this.isAutoInstallAllowed(server)) {
      throw new MCPError(
        'Auto-install not allowed for this server',
        'AUTO_INSTALL_NOT_ALLOWED'
      );
    }

    try {
      this.emit('installRequested', { server, configuration, autoInstall });

      const result = await this.installer.installServer(server, configuration);

      // Track installation event
      this.trackInstallation(server, autoInstall);

      return result;
    } catch (error) {
      this.emit('installationFailed', { server, error });
      throw error;
    }
  }

  private isAutoInstallAllowed(server: MCPServer): boolean {
    const settings = this.config.autoInstall;

    if (!settings.enabled) return false;
    if (settings.blockedServers.includes(server.id)) return false;
    if (!settings.allowedCategories.includes(server.category)) return false;
    if (settings.requireVerification && !server.metadata.verified) return false;

    // Calculate confidence score (simplified)
    const confidenceScore = this.calculateConfidenceScore(server);
    if (confidenceScore < settings.confidenceThreshold) return false;

    return true;
  }

  private calculateConfidenceScore(server: MCPServer): number {
    let score = 0.5; // Base score

    // Increase score for verified servers
    if (server.metadata.verified) score += 0.3;

    // Increase score based on community metrics
    if (server.metadata.stars > 100) score += 0.1;
    if (server.metadata.downloads > 1000) score += 0.1;

    // Increase score for official registries
    // This would be determined by which registry the server came from
    score += 0.1;

    return Math.min(score, 1.0);
  }

  private async trackInstallation(server: MCPServer, autoInstall: boolean): Promise<void> {
    // This would send telemetry if enabled
    if (this.config.globalSettings.telemetryEnabled) {
      // Implementation would send anonymous usage data
      this.emit('telemetry', {
        event: 'server_installed',
        data: {
          serverId: server.id,
          category: server.category,
          autoInstall,
          timestamp: new Date()
        }
      });
    }
  }

  public async uninstallServer(serverId: string): Promise<void> {
    try {
      this.emit('uninstallRequested', { serverId });

      await this.installer.uninstallServer(serverId);

      // Remove from configuration
      delete this.config.servers[serverId];
      await this.saveConfiguration();

      // Remove usage stats
      this.projectUsageStats.delete(serverId);

      this.emit('uninstallationCompleted', { serverId });
    } catch (error) {
      this.emit('uninstallationFailed', { serverId, error });
      throw error;
    }
  }

  public async enableServer(serverId: string): Promise<void> {
    const instance = this.config.servers[serverId];
    if (!instance) {
      throw new MCPError('Server not found', 'SERVER_NOT_FOUND');
    }

    instance.enabled = true;
    await this.saveConfiguration();
    this.emit('serverEnabled', { serverId });
  }

  public async disableServer(serverId: string): Promise<void> {
    const instance = this.config.servers[serverId];
    if (!instance) {
      throw new MCPError('Server not found', 'SERVER_NOT_FOUND');
    }

    instance.enabled = false;
    await this.saveConfiguration();
    this.emit('serverDisabled', { serverId });
  }

  public async updateServerConfiguration(
    serverId: string,
    configuration: Record<string, any>
  ): Promise<void> {
    const instance = this.config.servers[serverId];
    if (!instance) {
      throw new MCPError('Server not found', 'SERVER_NOT_FOUND');
    }

    instance.configuration = { ...instance.configuration, ...configuration };
    await this.saveConfiguration();
    this.emit('serverConfigurationUpdated', { serverId, configuration });
  }

  public async detectAndInstall(projectContext?: any): Promise<MCPInstallationResult[]> {
    if (!this.config.autoInstall.enabled) {
      throw new MCPError('Auto-install is disabled', 'AUTO_INSTALL_DISABLED');
    }

    this.emit('autoDetectionStarted', { projectContext });

    try {
      // Analyze project context to determine required capabilities
      const requiredCapabilities = this.analyzeProjectRequirements(projectContext);

      // Search for servers that match requirements
      const searchResults = await this.searchServers({
        capabilities: requiredCapabilities.capabilities,
        category: requiredCapabilities.category as MCPCategory,
        verified: this.config.autoInstall.requireVerification,
        limit: 20
      });

      // Filter and rank servers for auto-installation
      const candidates = this.rankAutoInstallCandidates(searchResults, requiredCapabilities);

      // Install top candidates
      const results: MCPInstallationResult[] = [];
      for (const candidate of candidates.slice(0, 5)) { // Max 5 auto-installs
        try {
          // Add delay between installations
          if (this.config.autoInstall.installDelay > 0 && results.length > 0) {
            await new Promise(resolve => setTimeout(resolve, this.config.autoInstall.installDelay));
          }

          const result = await this.installServer(candidate.server, undefined, true);
          results.push(result);
        } catch (error) {
          this.emit('autoInstallFailed', { server: candidate.server, error });
        }
      }

      this.emit('autoDetectionCompleted', { results, projectContext });
      return results;

    } catch (error) {
      this.emit('autoDetectionFailed', { projectContext, error });
      throw error;
    }
  }

  private analyzeProjectRequirements(projectContext?: any): { capabilities: string[]; category: MCPCategory } {
    const capabilities: string[] = [];
    let category: MCPCategory = 'development';

    // Analyze project files and dependencies
    if (projectContext?.packageJson) {
      const deps = { ...projectContext.packageJson.dependencies, ...projectContext.packageJson.devDependencies };

      if (deps.react || deps.vue || deps.angular) {
        capabilities.push('tools', 'prompts');
        category = 'development';
      }

      if (deps.puppeteer || deps.playwright) {
        capabilities.push('browser-automation');
      }

      if (deps.express || deps.fastify) {
        capabilities.push('api-testing');
      }

      if (deps.mongodb || deps.postgresql || deps.mysql) {
        capabilities.push('database');
        category = 'database';
      }

      if (deps.tensorflow || deps.pytorch || deps.scikit-learn) {
        capabilities.push('ai-ml');
        category = 'ai-ml';
      }
    }

    // Analyze file structure
    if (projectContext?.files) {
      const hasTests = projectContext.files.some((file: string) =>
        file.includes('.test.') || file.includes('.spec.') || file.includes('test/')
      );
      if (hasTests) {
        capabilities.push('testing');
      }

      const hasDocs = projectContext.files.some((file: string) =>
        file.includes('.md') || file.includes('docs/')
      );
      if (hasDocs) {
        capabilities.push('documentation');
      }
    }

    return { capabilities, category };
  }

  private rankAutoInstallCandidates(
    searchResults: MCPSearchResult[],
    requirements: { capabilities: string[]; category: MCPCategory }
  ): Array<{ server: MCPServer; score: number }> {
    const candidates: Array<{ server: MCPServer; score: number }> = [];

    for (const result of searchResults) {
      for (const server of result.servers) {
        let score = 0;

        // Score based on capability match
        const matchingCapabilities = server.capabilities.tools ? requirements.capabilities.length : 0;
        score += (matchingCapabilities / Math.max(requirements.capabilities.length, 1)) * 0.4;

        // Score based on category match
        if (server.category === requirements.category) {
          score += 0.2;
        }

        // Score based on popularity
        score += Math.min(server.metadata.stars / 1000, 0.2);

        // Score based on verification status
        if (server.metadata.verified) {
          score += 0.2;
        }

        candidates.push({ server, score });
      }
    }

    return candidates.sort((a, b) => b.score - a.score);
  }

  public getInstalledServers(): MCPServerInstance[] {
    return Object.values(this.config.servers);
  }

  public getServerInstance(serverId: string): MCPServerInstance | undefined {
    return this.config.servers[serverId];
  }

  public getConfiguration(): MCPProjectConfig {
    return { ...this.config };
  }

  public async updateConfiguration(updates: Partial<MCPProjectConfig>): Promise<void> {
    this.config = this.mergeConfig(this.config, updates);
    await this.saveConfiguration();
    this.emit('configurationUpdated', { configuration: this.config });
  }

  public getServerUsageStats(): MCPUsageStats[] {
    return Array.from(this.projectUsageStats.values());
  }

  public recordServerUsage(serverId: string, toolName: string, responseTime: number, success: boolean): void {
    let stats = this.projectUsageStats.get(serverId);
    if (!stats) {
      stats = {
        serverId,
        projectId: this.getProjectId(),
        usageCount: 0,
        lastUsed: new Date(),
        averageResponseTime: 0,
        errors: 0,
        popularTools: []
      };
      this.projectUsageStats.set(serverId, stats);
    }

    stats.usageCount++;
    stats.lastUsed = new Date();

    // Update average response time
    stats.averageResponseTime = (stats.averageResponseTime * (stats.usageCount - 1) + responseTime) / stats.usageCount;

    if (!success) {
      stats.errors++;
    }

    // Update tool usage
    let toolUsage = stats.popularTools.find(t => t.toolName === toolName);
    if (!toolUsage) {
      toolUsage = {
        toolName,
        usageCount: 0,
        averageExecutionTime: 0,
        successRate: 1.0
      };
      stats.popularTools.push(toolUsage);
    }

    toolUsage.usageCount++;
    toolUsage.averageExecutionTime = (toolUsage.averageExecutionTime * (toolUsage.usageCount - 1) + responseTime) / toolUsage.usageCount;
    toolUsage.successRate = ((toolUsage.successRate * (toolUsage.usageCount - 1)) + (success ? 1 : 0)) / toolUsage.usageCount;

    // Sort tools by usage
    stats.popularTools.sort((a, b) => b.usageCount - a.usageCount);
  }

  private getProjectId(): string {
    // Generate or retrieve project ID
    return 'project-' + path.basename(process.cwd());
  }

  public async performHealthCheck(serverId: string): Promise<MCPHealthCheck> {
    const instance = this.config.servers[serverId];
    if (!instance) {
      throw new MCPError('Server not found', 'SERVER_NOT_FOUND');
    }

    const healthCheck = await this.installer.performHealthCheck(instance);
    instance.healthStatus = healthCheck.status;
    await this.saveConfiguration();

    return healthCheck;
  }

  public async syncRegistries(): Promise<void> {
    this.emit('registrySyncStarted');

    try {
      // This would trigger registry synchronization
      // For now, just clear the scanner cache
      this.scanner.clearCache();

      this.emit('registrySyncCompleted');
    } catch (error) {
      this.emit('registrySyncFailed', { error });
      throw error;
    }
  }

  public async cleanup(): Promise<void> {
    // Stop health checks
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Save final configuration
    await this.saveConfiguration();

    this.emit('cleanupCompleted');
  }
}