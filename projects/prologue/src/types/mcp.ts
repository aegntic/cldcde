/**
 * MCP Type Definitions
 * Type definitions for Model Context Protocol integration in Prologue
 */

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  repository?: string;
  homepage?: string;
  license: string;
  keywords: string[];
  category: MCPCategory;
  capabilities: MCPCapabilities;
  transport: MCPTransport[];
  installation: MCPInstallation;
  configuration: MCPConfiguration;
  metadata: MCPMetadata;
}

export interface MCPCapabilities {
  tools: boolean;
  resources: boolean;
  prompts: boolean;
  logging: boolean;
  completions?: CompletionsCapability;
  audio?: AudioCapability;
}

export interface CompletionsCapability {
  supports: string[];
  default_provider?: string;
}

export interface AudioCapability {
  input: boolean;
  output: boolean;
  formats: string[];
}

export type MCPTransport = 'stdio' | 'sse' | 'websocket' | 'streamable-http';

export interface MCPInstallation {
  methods: InstallationMethod[];
  dependencies: Record<string, string>;
  devDependencies?: Record<string, string>;
  systemRequirements?: SystemRequirement[];
  installationTime?: number;
}

export interface InstallationMethod {
  type: 'npm' | 'npx' | 'docker' | 'python' | 'binary' | 'custom';
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface SystemRequirement {
  type: 'os' | 'runtime' | 'hardware' | 'api';
  requirement: string;
  optional: boolean;
}

export interface MCPConfiguration {
  required: string[];
  optional: string[];
  env: Record<string, EnvVar>;
  examples: Record<string, any>;
  schema?: JSONSchema;
}

export interface EnvVar {
  name: string;
  description: string;
  required: boolean;
  sensitive: boolean;
  default?: string;
  validation?: ValidationRule;
}

export interface ValidationRule {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  allowedValues?: string[];
}

export interface MCPMetadata {
  createdAt: Date;
  updatedAt: Date;
  downloads: number;
  stars: number;
  lastCommit?: Date;
  maintainers: string[];
  securityScore: number;
  performanceScore: number;
  communityScore: number;
  tags: string[];
  verified: boolean;
}

export type MCPCategory =
  | 'development'
  | 'productivity'
  | 'communication'
  | 'data-analysis'
  | 'media'
  | 'automation'
  | 'security'
  | 'database'
  | 'ai-ml'
  | 'gaming'
  | 'education'
  | 'finance'
  | 'healthcare'
  | 'iot'
  | 'testing'
  | 'monitoring'
  | 'other';

export interface MCPRegistry {
  id: string;
  name: string;
  url: string;
  type: 'official' | 'community' | 'enterprise' | 'private';
  api?: RegistryAPI;
  authentication?: RegistryAuth;
  priority: number;
  active: boolean;
  lastSync?: Date;
  serverCount?: number;
}

export interface RegistryAPI {
  search: string;
  details: string;
  download?: string;
  stats?: string;
  headers?: Record<string, string>;
  rateLimit?: RateLimit;
}

export interface RegistryAuth {
  type: 'none' | 'api-key' | 'oauth' | 'token';
  apiKey?: string;
  token?: string;
  scopes?: string[];
}

export interface RateLimit {
  requests: number;
  window: number; // in seconds
  current?: number;
  resetAt?: Date;
}

export interface MCPSearchRequest {
  query?: string;
  category?: MCPCategory;
  capabilities?: string[];
  transport?: MCPTransport[];
  verified?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'popularity' | 'updated' | 'created' | 'downloads';
  sortOrder?: 'asc' | 'desc';
}

export interface MCPSearchResult {
  servers: MCPServer[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
  searchTime: number;
  registry: string;
}

export interface MCPInstallationResult {
  success: boolean;
  server: MCPServer;
  method: InstallationMethod;
  duration: number;
  installedAt: Date;
  error?: string;
  warnings?: string[];
  configuration?: Record<string, any>;
}

export interface MCPProjectConfig {
  servers: Record<string, MCPServerInstance>;
  globalSettings: MCPGlobalSettings;
  registrySettings: MCPRegistrySettings;
  autoInstall: AutoInstallSettings;
}

export interface MCPServerInstance {
  serverId: string;
  enabled: boolean;
  configuration: Record<string, any>;
  autoStart: boolean;
  priority: number;
  installedAt: Date;
  lastUsed?: Date;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  version: string;
}

export interface MCPGlobalSettings {
  defaultTransport: MCPTransport;
  timeout: number;
  retryAttempts: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  securityMode: 'strict' | 'balanced' | 'permissive';
  autoUpdate: boolean;
  telemetryEnabled: boolean;
}

export interface MCPRegistrySettings {
  enabledRegistries: string[];
  syncInterval: number;
  autoSync: boolean;
  cacheTimeout: number;
  maxCacheSize: number;
}

export interface AutoInstallSettings {
  enabled: boolean;
  confidenceThreshold: number;
  autoConfirm: boolean;
  requireVerification: boolean;
  allowedCategories: MCPCategory[];
  blockedServers: string[];
  installDelay: number;
}

export interface MCPHealthCheck {
  serverId: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastCheck: Date;
  error?: string;
  capabilities: string[];
  uptime: number;
}

export interface MCPUsageStats {
  serverId: string;
  projectId: string;
  usageCount: number;
  lastUsed: Date;
  averageResponseTime: number;
  errors: number;
  popularTools: ToolUsage[];
}

export interface ToolUsage {
  toolName: string;
  usageCount: number;
  averageExecutionTime: number;
  successRate: number;
}

export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
  definitions?: Record<string, any>;
}

// Error types
export class MCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public serverId?: string
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export class MCPInstallationError extends MCPError {
  constructor(message: string, serverId: string, public method: InstallationMethod) {
    super(message, 'INSTALLATION_ERROR', 500, serverId);
    this.name = 'MCPInstallationError';
  }
}

export class MCPConfigurationError extends MCPError {
  constructor(message: string, serverId: string, public configKey: string) {
    super(message, 'CONFIGURATION_ERROR', 400, serverId);
    this.name = 'MCPConfigurationError';
  }
}

export class MCPRegistryError extends MCPError {
  constructor(message: string, public registryId: string) {
    super(message, 'REGISTRY_ERROR', 500);
    this.name = 'MCPRegistryError';
  }
}

export class MCPCompatibilityError extends MCPError {
  constructor(message: string, serverId: string, public requirement: string) {
    super(message, 'COMPATIBILITY_ERROR', 400, serverId);
    this.name = 'MCPCompatibilityError';
  }
}