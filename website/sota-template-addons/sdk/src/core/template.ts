/**
 * Core SOTA Template Class
 * Main entry point for the SOTA Template System
 */

import { EventEmitter } from 'events';
import type {
  TemplateOptions,
  TemplateStatus,
  PerformanceMetrics,
  ModuleInterface
} from '../types/index.js';
import { ModuleManager } from './modules.js';
import { PerformanceMonitor } from './performance.js';
import { AnimationManager } from './animations.js';
import { ThemeManager } from './theme.js';
import { DEFAULT_CONFIG } from '../index.js';
import { SOTAError } from '../errors/index.js';

export class SOTATemplate extends EventEmitter {
  private options: TemplateOptions;
  private moduleManager: ModuleManager;
  private performanceMonitor: PerformanceMonitor;
  private animationManager: AnimationManager;
  private themeManager: ThemeManager;
  private status: TemplateStatus = 'initializing';
  private initialized = false;

  constructor(options: Partial<TemplateOptions> = {}) {
    super();

    this.options = {
      ...DEFAULT_CONFIG,
      ...options,
      performance: {
        ...DEFAULT_CONFIG.performance,
        ...options.performance
      },
      animations: {
        ...DEFAULT_CONFIG.animations,
        ...options.animations
      },
      theme: {
        ...DEFAULT_CONFIG.theme,
        ...options.theme
      }
    };

    this.initializeManagers();
  }

  private initializeManagers(): void {
    this.moduleManager = new ModuleManager(this.options.modules || []);
    this.performanceMonitor = new PerformanceMonitor({
      ...this.options.performance,
      onMetricUpdate: (metric) => this.emit('performanceUpdate', metric),
      onWarning: (warning) => this.emit('performanceWarning', warning)
    });
    this.animationManager = new AnimationManager({
      ...this.options.animations,
      onAnimationStart: (animation) => this.emit('animationStart', animation),
      onAnimationEnd: (animation) => this.emit('animationEnd', animation)
    });
    this.themeManager = new ThemeManager(this.options.theme);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      throw new SOTAError('Template already initialized');
    }

    try {
      this.status = 'initializing';
      this.emit('statusChange', this.status);

      // Initialize theme first
      await this.themeManager.initialize();

      // Initialize performance monitoring
      await this.performanceMonitor.initialize();

      // Initialize modules
      await this.moduleManager.initialize();

      // Initialize animation system
      await this.animationManager.initialize();

      this.status = 'ready';
      this.initialized = true;

      this.emit('initialized');
      this.emit('statusChange', this.status);

    } catch (error) {
      this.status = 'error';
      this.emit('statusChange', this.status);
      throw new SOTAError(`Failed to initialize template: ${error.message}`);
    }
  }

  destroy(): void {
    if (!this.initialized) return;

    try {
      this.performanceMonitor.destroy();
      this.animationManager.destroy();
      this.moduleManager.destroy();
      this.themeManager.destroy();

      this.removeAllListeners();
      this.initialized = false;
      this.status = 'destroyed';

    } catch (error) {
      console.error('Error during template destruction:', error);
    }
  }

  getStatus(): TemplateStatus {
    return this.status;
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMonitor.getMetrics();
  }

  optimizePerformance(): void {
    this.performanceMonitor.optimize();
  }

  createAnimation(config: any): any {
    return this.animationManager.createAnimation(config);
  }

  createScrollAnimation(config: any): any {
    return this.animationManager.createScrollAnimation(config);
  }

  setTheme(themeConfig: any): void {
    this.themeManager.setTheme(themeConfig);
  }

  getTheme(): any {
    return this.themeManager.getCurrentTheme();
  }

  mount(container: Element): void {
    if (!this.initialized) {
      throw new SOTAError('Template must be initialized before mounting');
    }

    // Apply theme to container
    this.themeManager.apply(container);

    // Auto-setup scroll animations for common elements
    this.animationManager.setupAutoScrollAnimations(container);

    // Emit mounted event
    this.emit('mounted', container);
  }

  getDebugInfo(): any {
    return {
      status: this.status,
      initialized: this.initialized,
      options: this.options,
      modules: this.moduleManager.getLoadedModules(),
      performance: this.getPerformanceMetrics(),
      version: process.env.VERSION || '1.0.0'
    };
  }
}