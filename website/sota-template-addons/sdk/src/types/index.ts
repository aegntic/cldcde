/**
 * Type definitions for SOTA Template SDK
 */

// Core Types
export type TemplateStatus = 'initializing' | 'ready' | 'error' | 'destroyed';

export interface TemplateOptions {
  performance: PerformanceConfig;
  animations: AnimationConfig;
  theme: ThemeConfig;
  modules?: ModuleConfig[];
  debug?: boolean;
}

export interface PerformanceConfig {
  enableRealTimeMonitoring: boolean;
  autoOptimization: boolean;
  targets: PerformanceTargets;
}

export interface AnimationConfig {
  scrollActivated: boolean;
  gpuAcceleration: boolean;
  smoothScrolling: boolean;
  respectMotionPreference: boolean;
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  designSystem: 'solid' | 'minimal' | 'advanced';
  customTokens?: DesignTokens;
}

export interface ModuleConfig {
  name: string;
  enabled: boolean;
  options?: Record<string, any>;
}

// Performance Types
export interface PerformanceTargets {
  LCP: number;  // Largest Contentful Paint (ms)
  CLS: number;  // Cumulative Layout Shift
  INP: number;  // Interaction to Next Paint (ms)
  FCP: number;  // First Contentful Paint (ms)
  TTFB: number; // Time to First Byte (ms)
}

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  id: string;
}

export interface PerformanceMetrics {
  [key: string]: PerformanceMetric;
}

export interface PerformanceWarning {
  type: string;
  message: string;
  severity: 'warning' | 'error';
  value: number;
}

// Animation Types
export interface AnimationConfig {
  target: Element | string;
  properties: {
    [key: string]: AnimationProperty;
  };
  duration: number;
  easing: string;
  delay?: number;
  repeat?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate';
}

export interface AnimationProperty {
  from: number | string;
  to: number | string;
  unit?: string;
}

export interface ScrollAnimationConfig extends AnimationConfig {
  start: string;
  end: string;
  once?: boolean;
  pin?: boolean;
}

// Theme Types
export interface DesignTokens {
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  shadows: ShadowTokens;
  borderRadius: BorderRadiusTokens;
}

export interface ColorTokens {
  primary: string;
  secondary: string;
  tertiary: string;
  accent: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderStrong: string;
  background: string;
  surface: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface SpacingTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

export interface TypographyTokens {
  fontFamilyMono: string;
  fontFamilySans: string;
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface ShadowTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  inner: string;
}

export interface BorderRadiusTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

// Module Types
export interface ModuleInterface {
  name: string;
  version: string;
  initialize(): Promise<void>;
  destroy(): void;
  getStatus(): ModuleStatus;
}

export interface ModuleStatus {
  initialized: boolean;
  active: boolean;
  performance: 'optimized' | 'degraded' | 'offline';
  lastUpdate: number;
}

// Error Types
export interface SOTAErrorOptions {
  code?: string;
  details?: Record<string, any>;
  cause?: Error;
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
}

// Event Types
export type TemplateEvent =
  | { type: 'initialized'; timestamp: number }
  | { type: 'statusChange'; status: TemplateStatus; timestamp: number }
  | { type: 'performanceUpdate'; metric: PerformanceMetric; timestamp: number }
  | { type: 'performanceWarning'; warning: PerformanceWarning; timestamp: number }
  | { type: 'animationStart'; animation: any; timestamp: number }
  | { type: 'animationEnd'; animation: any; timestamp: number }
  | { type: 'moduleLoaded'; module: string; timestamp: number }
  | { type: 'moduleError'; module: string; error: Error; timestamp: number }
  | { type: 'themeChanged'; theme: ThemeConfig; timestamp: number }
  | { type: 'mounted'; container: Element; timestamp: number };

// Configuration Validation Types
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

// Performance Monitoring Types
export interface PerformanceReport {
  timestamp: string;
  url: string;
  metrics: PerformanceMetrics;
  overallScore: number;
  targets: PerformanceTargets;
  deviceInfo?: DeviceInfo;
  networkInfo?: NetworkInfo;
  recommendations: PerformanceRecommendation[];
}

export interface DeviceInfo {
  userAgent: string;
  deviceMemory?: number;
  hardwareConcurrency: number;
  platform: string;
  screen: {
    width: number;
    height: number;
    colorDepth: number;
  };
}

export interface NetworkInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface PerformanceRecommendation {
  metric: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  description: string;
  expectedImprovement: string;
}

// Animation Preset Types
export interface AnimationPreset {
  name: string;
  properties: AnimationProperty[];
  duration: number;
  easing: string;
}

export interface ScrollAnimationPreset extends AnimationPreset {
  start: string;
  end: string;
}

// Plugin Types
export interface Plugin {
  name: string;
  version: string;
  initialize: (template: any) => Promise<void>;
  destroy: () => Promise<void>;
}

export interface PluginConfig {
  enabled: boolean;
  options?: Record<string, any>;
}

// API Types
export interface APIConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  headers?: Record<string, string>;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;