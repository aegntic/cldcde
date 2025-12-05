/**
 * MCP Auto-Installation Engine
 * Handles automatic installation, configuration, and management of MCP servers
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import {
  MCPServer,
  MCPInstallationResult,
  MCPInstallationError,
  MCPConfigurationError,
  MCPCompatibilityError,
  InstallationMethod,
  SystemRequirement,
  EnvVar,
  MCPServerInstance,
  MCPGlobalSettings,
  MCPHealthCheck
} from '../types/mcp';

const execAsync = promisify(exec);

export class MCPInstaller extends EventEmitter {
  private installations: Map<string, MCPServerInstance> = new Map();
  private installationPath: string;
  private globalSettings: MCPGlobalSettings;
  private isInstalling: Set<string> = new Set();

  constructor(
    installationPath?: string,
    globalSettings?: Partial<MCPGlobalSettings>
  ) {
    super();
    this.installationPath = installationPath || path.join(os.homedir(), '.prologue', 'mcp-servers');
    this.globalSettings = {
      defaultTransport: 'stdio',
      timeout: 30000,
      retryAttempts: 3,
      logLevel: 'info',
      securityMode: 'balanced',
      autoUpdate: true,
      telemetryEnabled: false,
      ...globalSettings
    };

    this.initializeInstallationPath();
  }

  private async initializeInstallationPath(): Promise<void> {
    try {
      await fs.ensureDir(this.installationPath);
      await fs.ensureDir(path.join(this.installationPath, 'configs'));
      await fs.ensureDir(path.join(this.installationPath, 'logs'));
      await fs.ensureDir(path.join(this.installationPath, 'cache'));
    } catch (error) {
      this.emit('error', new MCPInstallationError(
        `Failed to initialize installation path: ${error}`,
        'system',
        { type: 'custom', command: 'mkdir' }
      ));
    }
  }

  public async installServer(
    server: MCPServer,
    configuration?: Record<string, any>,
    method?: InstallationMethod
  ): Promise<MCPInstallationResult> {
    const serverId = server.id;

    // Prevent concurrent installations
    if (this.isInstalling.has(serverId)) {
      throw new MCPInstallationError(
        'Server is already being installed',
        serverId,
        method || server.installation.methods[0]
      );
    }

    this.isInstalling.add(serverId);
    const startTime = Date.now();

    try {
      this.emit('installationStarted', { serverId, server });

      // Pre-installation checks
      await this.performPreInstallationChecks(server, method);

      // Select installation method
      const selectedMethod = method || await this.selectBestInstallationMethod(server);

      // Install dependencies
      await this.installDependencies(server, selectedMethod);

      // Install the server
      const installResult = await this.executeInstallation(server, selectedMethod);

      // Configure the server
      const finalConfiguration = await this.configureServer(server, configuration);

      // Create server instance
      const serverInstance = await this.createServerInstance(server, selectedMethod, finalConfiguration);

      // Verify installation
      await this.verifyInstallation(serverInstance);

      const duration = Date.now() - startTime;
      const result: MCPInstallationResult = {
        success: true,
        server,
        method: selectedMethod,
        duration,
        installedAt: new Date(),
        configuration: finalConfiguration
      };

      this.installations.set(serverId, serverInstance);
      this.emit('installationCompleted', result);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const result: MCPInstallationResult = {
        success: false,
        server,
        method: method || server.installation.methods[0],
        duration,
        installedAt: new Date(),
        error: error instanceof Error ? error.message : String(error)
      };

      this.emit('installationFailed', result);
      throw error;

    } finally {
      this.isInstalling.delete(serverId);
    }
  }

  private async performPreInstallationChecks(
    server: MCPServer,
    method?: InstallationMethod
  ): Promise<void> {
    // Check if already installed
    if (this.installations.has(server.id)) {
      throw new MCPInstallationError(
        'Server is already installed',
        server.id,
        method || server.installation.methods[0]
      );
    }

    // Check system requirements
    await this.checkSystemRequirements(server);

    // Check security constraints
    await this.checkSecurityConstraints(server);

    // Check compatibility
    await this.checkCompatibility(server);
  }

  private async checkSystemRequirements(server: MCPServer): Promise<void> {
    if (!server.installation.systemRequirements) return;

    for (const requirement of server.installation.systemRequirements) {
      try {
        await this.checkSystemRequirement(requirement);
      } catch (error) {
        if (!requirement.optional) {
          throw new MCPCompatibilityError(
            `System requirement not met: ${requirement.requirement}`,
            server.id,
            requirement.requirement
          );
        }
        this.emit('requirementWarning', {
          serverId: server.id,
          requirement: requirement.requirement,
          warning: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  private async checkSystemRequirement(requirement: SystemRequirement): Promise<void> {
    switch (requirement.type) {
      case 'os':
        const platform = os.platform();
        const supportedOSs = requirement.requirement.split(',').map(os => os.trim());
        if (!supportedOSs.includes(platform) && !supportedOSs.includes('any')) {
          throw new Error(`Unsupported OS: ${platform}`);
        }
        break;

      case 'runtime':
        if (requirement.requirement.startsWith('node')) {
          const version = process.version;
          const requiredVersion = requirement.requirement.replace('node', '');
          if (!this.isVersionCompatible(version, requiredVersion)) {
            throw new Error(`Node.js version ${version} not compatible with required ${requiredVersion}`);
          }
        } else if (requirement.requirement.startsWith('python')) {
          try {
            await execAsync('python --version');
          } catch {
            throw new Error('Python is not installed');
          }
        }
        break;

      case 'hardware':
        if (requirement.requirement.includes('ram')) {
          const requiredRAM = parseInt(requirement.requirement.match(/\d+/)?.[0] || '0');
          const totalRAM = os.totalmem() / (1024 * 1024 * 1024); // GB
          if (totalRAM < requiredRAM) {
            throw new Error(`Insufficient RAM: ${totalRAM.toFixed(1)}GB available, ${requiredRAM}GB required`);
          }
        }
        break;

      case 'api':
        // API requirements would be checked during configuration
        break;
    }
  }

  private isVersionCompatible(current: string, required: string): boolean {
    // Simple version compatibility check
    const currentNum = current.replace('v', '').split('.').map(Number);
    const requiredNum = required.split('.').map(Number);

    for (let i = 0; i < Math.max(currentNum.length, requiredNum.length); i++) {
      const currentPart = currentNum[i] || 0;
      const requiredPart = requiredNum[i] || 0;

      if (currentPart > requiredPart) return true;
      if (currentPart < requiredPart) return false;
    }

    return true;
  }

  private async checkSecurityConstraints(server: MCPServer): Promise<void> {
    if (this.globalSettings.securityMode === 'strict' && !server.metadata.verified) {
      throw new MCPInstallationError(
        'Unverified servers are not allowed in strict security mode',
        server.id,
        server.installation.methods[0]
      );
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /eval\s*\(/,
      /exec\s*\(/,
      /require\s*\(\s*['"`]fs['"`]\s*\)/,
      /child_process/,
      /process\.env/
    ];

    const packageJson = await this.getPackageJson(server);
    if (packageJson) {
      const packageStr = JSON.stringify(packageJson);
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(packageStr)) {
          this.emit('securityWarning', {
            serverId: server.id,
            pattern: pattern.source,
            message: 'Suspicious code pattern detected in package'
          });
        }
      }
    }
  }

  private async checkCompatibility(server: MCPServer): Promise<void> {
    // Check transport compatibility
    if (!server.transport.includes(this.globalSettings.defaultTransport)) {
      this.emit('compatibilityWarning', {
        serverId: server.id,
        message: `Server doesn't support default transport ${this.globalSettings.defaultTransport}`
      });
    }

    // Check capability compatibility
    if (server.capabilities.audio && this.globalSettings.securityMode === 'strict') {
      throw new MCPInstallationError(
        'Audio capabilities not allowed in strict security mode',
        server.id,
        server.installation.methods[0]
      );
    }
  }

  private async selectBestInstallationMethod(server: MCPServer): Promise<InstallationMethod> {
    const methods = server.installation.methods;

    // Prioritize methods by preference
    const methodPreference = ['npm', 'npx', 'python', 'docker', 'binary', 'custom'];

    for (const preferredType of methodPreference) {
      const method = methods.find(m => m.type === preferredType);
      if (method && await this.isMethodAvailable(method)) {
        return method;
      }
    }

    // Fallback to first available method
    for (const method of methods) {
      if (await this.isMethodAvailable(method)) {
        return method;
      }
    }

    throw new MCPInstallationError(
      'No compatible installation method found',
      server.id,
      methods[0]
    );
  }

  private async isMethodAvailable(method: InstallationMethod): Promise<boolean> {
    try {
      switch (method.type) {
        case 'npm':
        case 'npx':
          await execAsync('npm --version');
          return true;
        case 'python':
          await execAsync('python --version');
          return true;
        case 'docker':
          await execAsync('docker --version');
          return true;
        case 'binary':
          // Check if binary exists in PATH
          await execAsync(`which ${method.command}`);
          return true;
        case 'custom':
          // Custom methods should be checked based on their specific requirements
          return true;
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  private async installDependencies(server: MCPServer, method: InstallationMethod): Promise<void> {
    const dependencies = {
      ...server.installation.dependencies,
      ...server.installation.devDependencies
    };

    if (Object.keys(dependencies).length === 0) return;

    this.emit('dependenciesInstallationStarted', { serverId: server.id, dependencies });

    try {
      switch (method.type) {
        case 'npm':
        case 'npx':
          const npmArgs = ['install'];
          for (const [dep, version] of Object.entries(dependencies)) {
            npmArgs.push(`${dep}@${version}`);
          }
          await this.runCommand('npm', npmArgs, { cwd: this.installationPath });
          break;

        case 'python':
          const pipArgs = ['install'];
          for (const [dep, version] of Object.entries(dependencies)) {
            pipArgs.push(`${dep}==${version}`);
          }
          await this.runCommand('pip', pipArgs);
          break;

        case 'docker':
          // Docker dependencies are typically handled via Dockerfile
          break;

        case 'binary':
        case 'custom':
          // Dependencies might need to be handled differently
          this.emit('dependencyWarning', {
            serverId: server.id,
            message: `Dependency installation for ${method.type} may require manual intervention`
          });
          break;
      }

      this.emit('dependenciesInstallationCompleted', { serverId: server.id });
    } catch (error) {
      throw new MCPInstallationError(
        `Failed to install dependencies: ${error}`,
        server.id,
        method
      );
    }
  }

  private async executeInstallation(
    server: MCPServer,
    method: InstallationMethod
  ): Promise<void> {
    this.emit('serverInstallationStarted', { serverId: server.id, method });

    try {
      const args = method.args || [];
      const env = { ...process.env, ...method.env };

      switch (method.type) {
        case 'npm':
          await this.runCommand('npm', ['install', method.command, ...args], {
            cwd: this.installationPath,
            env
          });
          break;

        case 'npx':
          // npx doesn't require installation, just verify it works
          await this.runCommand('npx', [method.command, '--help'], {
            env,
            timeout: 10000
          });
          break;

        case 'python':
          await this.runCommand('pip', ['install', method.command, ...args], { env });
          break;

        case 'docker':
          await this.runCommand('docker', ['pull', method.command, ...args], { env });
          break;

        case 'binary':
          // Binary should already be available, just verify
          await this.runCommand(method.command, ['--version'], {
            timeout: 10000
          });
          break;

        case 'custom':
          await this.runCommand(method.command, args, {
            env,
            timeout: this.globalSettings.timeout
          });
          break;
      }

      this.emit('serverInstallationCompleted', { serverId: server.id });
    } catch (error) {
      throw new MCPInstallationError(
        `Failed to install server: ${error}`,
        server.id,
        method
      );
    }
  }

  private async configureServer(
    server: MCPServer,
    userConfiguration?: Record<string, any>
  ): Promise<Record<string, any>> {
    this.emit('configurationStarted', { serverId: server.id });

    try {
      const configPath = path.join(this.installationPath, 'configs', `${server.id}.json`);

      // Merge default configuration with user configuration
      const configuration = {
        ...server.configuration.examples,
        ...userConfiguration
      };

      // Validate required configuration
      for (const requiredKey of server.configuration.required) {
        if (!(requiredKey in configuration)) {
          throw new MCPConfigurationError(
            `Required configuration key missing: ${requiredKey}`,
            server.id,
            requiredKey
          );
        }
      }

      // Process environment variables
      await this.processEnvironmentVariables(server, configuration);

      // Save configuration
      await fs.writeJson(configPath, configuration, { spaces: 2 });

      this.emit('configurationCompleted', { serverId: server.id, configuration });
      return configuration;

    } catch (error) {
      throw new MCPConfigurationError(
        `Failed to configure server: ${error}`,
        server.id,
        'general'
      );
    }
  }

  private async processEnvironmentVariables(
    server: MCPServer,
    configuration: Record<string, any>
  ): Promise<void> {
    const envVars = server.configuration.env;

    for (const [key, envVar] of Object.entries(envVars)) {
      if (envVar.required && !process.env[key] && !envVar.default) {
        throw new MCPConfigurationError(
          `Required environment variable not set: ${key}`,
          server.id,
          key
        );
      }

      const value = process.env[key] || envVar.default;
      if (value) {
        // Validate the value if validation rules are present
        if (envVar.validation) {
          this.validateEnvironmentValue(key, value, envVar.validation);
        }

        // Store in configuration for non-sensitive variables
        if (!envVar.sensitive) {
          configuration[key] = value;
        }
      }
    }
  }

  private validateEnvironmentValue(key: string, value: string, validation: any): void {
    if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
      throw new MCPConfigurationError(
        `Environment variable ${key} doesn't match required pattern: ${validation.pattern}`,
        '',
        key
      );
    }

    if (validation.minLength && value.length < validation.minLength) {
      throw new MCPConfigurationError(
        `Environment variable ${key} is too short (min: ${validation.minLength})`,
        '',
        key
      );
    }

    if (validation.maxLength && value.length > validation.maxLength) {
      throw new MCPConfigurationError(
        `Environment variable ${key} is too long (max: ${validation.maxLength})`,
        '',
        key
      );
    }

    if (validation.allowedValues && !validation.allowedValues.includes(value)) {
      throw new MCPConfigurationError(
        `Environment variable ${key} must be one of: ${validation.allowedValues.join(', ')}`,
        '',
        key
      );
    }
  }

  private async createServerInstance(
    server: MCPServer,
    method: InstallationMethod,
    configuration: Record<string, any>
  ): Promise<MCPServerInstance> {
    const instanceId = uuidv4();
    const instance: MCPServerInstance = {
      serverId: server.id,
      enabled: true,
      configuration,
      autoStart: true,
      priority: 50,
      installedAt: new Date(),
      version: server.version,
      healthStatus: 'unknown'
    };

    // Save instance to file
    const instancePath = path.join(this.installationPath, 'instances', `${instanceId}.json`);
    await fs.ensureDir(path.dirname(instancePath));
    await fs.writeJson(instancePath, instance, { spaces: 2 });

    return instance;
  }

  private async verifyInstallation(instance: MCPServerInstance): Promise<void> {
    try {
      const healthCheck = await this.performHealthCheck(instance);

      if (healthCheck.status === 'unhealthy') {
        throw new Error(`Health check failed: ${healthCheck.error}`);
      }

      instance.healthStatus = 'healthy';
      this.emit('verificationCompleted', { serverId: instance.serverId, healthCheck });

    } catch (error) {
      instance.healthStatus = 'unhealthy';
      this.emit('verificationFailed', { serverId: instance.serverId, error });
      throw new MCPInstallationError(
        `Installation verification failed: ${error}`,
        instance.serverId,
        { type: 'custom', command: 'verify' }
      );
    }
  }

  private async performHealthCheck(instance: MCPServerInstance): Promise<MCPHealthCheck> {
    const startTime = Date.now();

    try {
      // This is a simplified health check
      // In a real implementation, you would try to connect to the MCP server
      // and verify it responds correctly to protocol requests

      const responseTime = Date.now() - startTime;

      return {
        serverId: instance.serverId,
        status: 'healthy',
        responseTime,
        lastCheck: new Date(),
        capabilities: [], // Would be populated from actual server
        uptime: 0
      };

    } catch (error) {
      return {
        serverId: instance.serverId,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : String(error),
        capabilities: [],
        uptime: 0
      };
    }
  }

  private async runCommand(
    command: string,
    args: string[],
    options: {
      cwd?: string;
      env?: Record<string, string>;
      timeout?: number;
    } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'pipe',
        cwd: options.cwd,
        env: { ...process.env, ...options.env }
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      const timeout = options.timeout || this.globalSettings.timeout;
      if (timeout) {
        setTimeout(() => {
          child.kill('SIGTERM');
          reject(new Error(`Command timed out after ${timeout}ms`));
        }, timeout);
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  private async getPackageJson(server: MCPServer): Promise<any> {
    try {
      if (server.repository?.includes('github.com')) {
        const url = server.repository.replace('.git', '') + '/raw/main/package.json';
        const response = await fetch(url);
        return response.json();
      }
    } catch {
      // Package.json not available
    }
    return null;
  }

  public async uninstallServer(serverId: string): Promise<void> {
    const instance = this.installations.get(serverId);
    if (!instance) {
      throw new MCPInstallationError('Server not found', serverId, { type: 'custom', command: 'uninstall' });
    }

    this.emit('uninstallationStarted', { serverId });

    try {
      // Remove instance file
      const instancePath = path.join(this.installationPath, 'instances', `${serverId}.json`);
      await fs.remove(instancePath);

      // Remove configuration file
      const configPath = path.join(this.installationPath, 'configs', `${serverId}.json`);
      await fs.remove(configPath);

      // Remove from memory
      this.installations.delete(serverId);

      this.emit('uninstallationCompleted', { serverId });

    } catch (error) {
      throw new MCPInstallationError(
        `Failed to uninstall server: ${error}`,
        serverId,
        { type: 'custom', command: 'uninstall' }
      );
    }
  }

  public getInstalledServers(): MCPServerInstance[] {
    return Array.from(this.installations.values());
  }

  public getServerInstance(serverId: string): MCPServerInstance | undefined {
    return this.installations.get(serverId);
  }

  public async loadInstalledServers(): Promise<void> {
    const instancesDir = path.join(this.installationPath, 'instances');

    try {
      await fs.ensureDir(instancesDir);
      const files = await fs.readdir(instancesDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const instanceData = await fs.readJson(path.join(instancesDir, file));
            this.installations.set(instanceData.serverId, instanceData);
          } catch (error) {
            this.emit('error', new MCPInstallationError(
              `Failed to load instance from ${file}: ${error}`,
              'unknown',
              { type: 'custom', command: 'load' }
            ));
          }
        }
      }

      this.emit('serversLoaded', { count: this.installations.size });

    } catch (error) {
      throw new MCPInstallationError(
        `Failed to load installed servers: ${error}`,
        'system',
        { type: 'custom', command: 'load' }
      );
    }
  }
}