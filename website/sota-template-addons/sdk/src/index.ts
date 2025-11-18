/**
 * SOTA Template SDK - Professional Development Kit
 *
 * ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ
 * ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ ae.ˡᵗᵈ
 */

// Core exports
export { SOTATemplate } from './core/template.js';
export { ModuleManager } from './core/modules.js';
export { PerformanceMonitor } from './core/performance.js';
export { AnimationManager } from './core/animations.js';
export { ThemeManager } from './core/theme.js';

// Module exports
export { ScrollAnimationModule } from './modules/scroll-animations.js';
export { WebAssemblyModule } from './modules/webassembly.js';
export { AIFeaturesModule } from './modules/ai-features.js';
export { DataVisualizationModule } from './modules/data-visualization.js';
export { PWAModule } from './modules/pwa.js';
export { SecurityModule } from './modules/security.js';
export { CMSModule } from './modules/cms.js';
export { EcommerceModule } from './modules/ecommerce.js';

// Utility exports
export { ANIMATION_PRESETS } from './utils/animation-presets.js';
export { PERFORMANCE_THRESHOLDS } from './utils/performance-constants.js';
export { createLogger } from './utils/logger.js';
export { debounce, throttle, raf } from './utils/performance-helpers.js';

// Type exports
export type {
  TemplateOptions,
  TemplateStatus,
  PerformanceMetrics,
  AnimationConfig,
  ScrollAnimationConfig,
  ThemeConfig,
  ModuleConfig,
  PerformanceTargets,
  ModuleInterface,
  DesignTokens
} from './types/index.js';

// Error exports
export {
  SOTAError,
  ModuleError,
  PerformanceError,
  AnimationError
} from './errors/index.js';

// Version
export const VERSION = '1.0.0';

// Default configuration
export const DEFAULT_CONFIG = {
  performance: {
    enableRealTimeMonitoring: true,
    autoOptimization: true,
    targets: {
      LCP: 2500,
      CLS: 0.1,
      INP: 200,
      FCP: 1800,
      TTFB: 800
    }
  },
  animations: {
    scrollActivated: true,
    gpuAcceleration: true,
    smoothScrolling: true,
    respectMotionPreference: true
  },
  theme: {
    mode: 'dark' as const,
    designSystem: 'solid' as const
  },
  debug: false
};