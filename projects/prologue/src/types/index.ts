/**
 * Prologue Type Definitions
 * Type definitions for the AI-powered creative framework
 */

export interface PrologueConfig {
  name: string;
  template: string;
  aiAgent: string;
  skipGit: boolean;
  aiEnhanced: boolean;
  features: string[];
  customizations: {
    theme?: string;
    fontFamily?: string;
    colors?: Record<string, string>;
    layout?: string;
    [key: string]: any;
  };
}

export interface PrologueProject extends PrologueConfig {}

export interface PrologueTemplate {
  name: string;
  description: string;
  category: string;
  tags: string[];
  aiEnhanced: boolean;
  files: string[];
  dependencies: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  specialties: string[];
  model: string;
  status: 'active' | 'idle' | 'busy' | 'error';
}

export interface AIInteraction {
  id: string;
  agentId: string;
  userMessage: string;
  agentResponse: string;
  timestamp: Date;
  context?: any;
  suggestions?: string[];
}

export interface ProjectTemplate {
  portfolio: {
    sections: ProjectSection[];
    features: string[];
    theme: ThemeConfig;
  };
  game: {
    gameType: '2d' | '3d' | 'text';
    mechanics: string[];
    assets: AssetConfig[];
    physics: boolean;
    audio: boolean;
  };
  artGallery: {
    galleryType: 'static' | 'interactive' | 'generative';
    artworkTypes: string[];
    curationMode: 'manual' | 'ai' | 'hybrid';
    monetization?: boolean;
  };
  mobileApp: {
    platform: 'ios' | 'android' | 'cross-platform';
    appType: 'native' | 'web' | 'hybrid';
    features: string[];
    monetization?: boolean;
  };
  dashboard: {
    widgets: DashboardWidget[];
    dataSources: DataSource[];
    realTimeUpdates: boolean;
    exportOptions: string[];
  };
  landingPage: {
    sections: LandingSection[];
    conversionGoal: string;
    integrations: string[];
    analytics: boolean;
  };
  custom: any;
}

export interface ProjectSection {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
  visible: boolean;
  customizable: boolean;
}

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  mode: 'light' | 'dark' | 'auto';
  customColors?: Record<string, string>;
}

export interface AssetConfig {
  type: 'image' | 'audio' | 'video' | '3d-model' | 'font';
  source: string;
  license?: string;
  attribution?: string;
}

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  dataSource: string;
  config: Record<string, any>;
}

export interface DataSource {
  id: string;
  type: 'api' | 'database' | 'file' | 'realtime';
  name: string;
  endpoint?: string;
  credentials?: any;
  refreshInterval?: number;
}

export interface LandingSection {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  content: string;
  backgroundImage?: string;
  callToAction?: CallToAction;
  order: number;
}

export interface CallToAction {
  text: string;
  url: string;
  style: 'button' | 'link' | 'form';
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

export interface DeploymentConfig {
  platform: string;
  environment: 'development' | 'staging' | 'production';
  buildCommand: string;
  outputDirectory: string;
  deployCommand?: string;
  environmentVariables?: Record<string, string>;
  customSettings?: Record<string, any>;
}

export interface BuildConfig {
  entry: string;
  output: string;
  minify: boolean;
  sourcemap: boolean;
  target: 'es2015' | 'es2020' | 'esnext';
  module: 'esnext' | 'commonjs' | 'umd';
  plugins?: string[];
  optimization?: {
    usedExports: boolean;
    minimize: boolean;
    concatenateModules: boolean;
  };
}

export interface DevServerConfig {
  port: number;
  host: string;
  open: boolean;
  hot: boolean;
  https: boolean;
  proxy?: Record<string, string>;
}

export interface LintingConfig {
  rules: Record<string, string | boolean>;
  extends?: string[];
  ignorePatterns: string[];
}

export interface TestConfig {
  framework: string;
  setupFiles: string[];
  testMatch: string[];
  coverage: {
    reporter: string[];
    threshold: number;
  };
}

export interface AIModelConfig {
  provider: string;
  model: string;
  apiKey: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt?: string;
}

export interface AIConversation {
  id: string;
  projectId: string;
  agentId: string;
  messages: AIMessage[];
  context: Record<string, any>;
  timestamp: Date;
  status: 'active' | 'completed' | 'abandoned';
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ProjectMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTemplates: number;
  aiInteractions: number;
  deployments: number;
  communityProjects: number;
  averageProjectTime: number;
  popularTemplates: TemplateUsage[];
}

export interface TemplateUsage {
  template: string;
  usageCount: number;
  category: string;
  aiEnhanced: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
  subscription: SubscriptionInfo;
  projects: ProjectInfo[];
  skills: string[];
  interests: string[];
  joinDate: Date;
  lastActive: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  aiSettings: AISettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  updates: boolean;
  community: boolean;
  aiResponses: boolean;
}

export interface AISettings {
  model: string;
  temperature: number;
  maxTokens: number;
  autoSuggest: boolean;
  learnFromUser: boolean;
  contextAwareness: boolean;
}

export interface PrivacySettings {
  dataCollection: boolean;
  analytics: boolean;
  telemetry: boolean;
  sharing: boolean;
  publicProfile: boolean;
}

export interface SubscriptionInfo {
  tier: 'free' | 'pro' | 'enterprise';
  features: string[];
  limits: SubscriptionLimits;
  billing: BillingInfo;
  renewalDate: Date;
}

export interface SubscriptionLimits {
  projects: number;
  aiInteractions: number;
  storage: number;
  bandwidth: number;
  customDomains: number;
  collaborators: number;
}

export interface BillingInfo {
  method: 'card' | 'bank' | 'crypto';
  status: 'active' | 'inactive' | 'cancelled';
  nextBillingDate: Date;
  amount: number;
  currency: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  template: string;
  description: string;
  thumbnail?: string;
  tags: string[];
  visibility: 'public' | 'private' | 'unlisted';
  status: 'draft' | 'in-progress' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  deployment?: DeploymentInfo;
}

export interface DeploymentInfo {
  platform: string;
  url?: string;
  environment: string;
  buildNumber?: number;
  deployedAt: Date;
  status: 'deploying' | 'success' | 'failed';
  logs?: string[];
}

export interface CommunityProject {
  id: string;
  title: string;
  description: string;
  author: string;
  authorId: string;
  thumbnail?: string;
  url?: string;
  tags: string[];
  likes: number;
  forks: number;
  downloads: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  author: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  tags: string[];
  thumbnail?: string;
  videoUrl?: string;
  content: TutorialSection[];
  prerequisites: string[];
  outcomes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TutorialSection {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'code' | 'video' | 'interactive';
  order: number;
  duration?: number;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: {
    timestamp: Date;
    requestId: string;
    version: string;
  };
}

// Error types
export class PrologueError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'PrologueError';
  }
}

export class ValidationError extends PrologueError {
  constructor(message: string, field: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends PrologueError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends PrologueError {
  constructor(message: string) {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends PrologueError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends PrologueError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class ServerError extends PrologueError {
  constructor(message: string) {
    super(message, 'SERVER_ERROR', 500);
    this.name = 'ServerError';
  }
}