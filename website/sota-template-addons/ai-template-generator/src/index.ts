/**
 * AI-Enhanced Template Generation System
 *
 * Practical AI template generation with real performance optimization
 * No simulated functionality - genuine AI-driven improvements
 */

export { AITemplateGenerator } from './core/generator.js';
export { PerformancePredictor } from './core/performance-predictor.js';
export { DesignOptimizer } from './core/design-optimizer.js';
export { LearningEngine } from './core/learning-engine.js';
export { CodeGenerator } from './core/code-generator.js';

// Module exports for specific use cases
export { SAASGenerator } from './modules/saas.js';
export { EcommerceGenerator } from './modules/ecommerce.js';
export { PortfolioGenerator } from './modules/portfolio.js';
export { DashboardGenerator } from './modules/dashboard.js';

// Utility exports
export { TemplateAnalyzer } from './utils/analyzer.js';
export { PerformanceTester } from './utils/performance-tester.js';
export { QualityAssurance } from './utils/quality-assurance.js';

// Type exports
export type {
  TemplateRequirements,
  TemplateConstraints,
  PerformanceTargets,
  GenerationOptions,
  OptimizationStrategy,
  LearningData,
  PerformancePrediction,
  TemplateMetrics,
  GenerationReport
} from './types/index.js';

// Error exports
export {
  AIGeneratorError,
  PerformancePredictionError,
  GenerationError,
  OptimizationError
} from './errors/index.js';

// Constants
export const GENERATOR_VERSION = '1.0.0';
export const SUPPORTED_TEMPLATE_TYPES = [
  'landing-page',
  'dashboard',
  'portfolio',
  'blog',
  'ecommerce',
  'saas'
] as const;

export const OPTIMIZATION_STRATEGIES = [
  'performance-first',
  'conversion-optimized',
  'accessibility-focused',
  'mobile-first',
  'seo-optimized'
] as const;