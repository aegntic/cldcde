/**
 * Performance Monitoring System
 * Real-time Core Web Vitals tracking and optimization
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB, getINP } from 'web-vitals';
import type {
  PerformanceMetrics,
  PerformanceTargets,
  PerformanceMetric,
  PerformanceWarning
} from '../types/index.js';
import { PerformanceError } from '../errors/index.js';

interface PerformanceMonitorOptions {
  enableRealTimeMonitoring: boolean;
  autoOptimization: boolean;
  targets: PerformanceTargets;
  onMetricUpdate?: (metric: PerformanceMetric) => void;
  onWarning?: (warning: PerformanceWarning) => void;
}

export class PerformanceMonitor {
  private options: PerformanceMonitorOptions;
  private metrics: PerformanceMetrics = {};
  private observers: Map<string, PerformanceObserver> = new Map();
  private initialized = false;

  constructor(options: Partial<PerformanceMonitorOptions> = {}) {
    this.options = {
      enableRealTimeMonitoring: true,
      autoOptimization: true,
      targets: {
        LCP: 2500,
        CLS: 0.1,
        INP: 200,
        FCP: 1800,
        TTFB: 800
      },
      ...options
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize Web Vitals monitoring
      if (this.options.enableRealTimeMonitoring) {
        this.initializeWebVitals();
      }

      // Initialize native performance observers
      this.initializePerformanceObservers();

      this.initialized = true;
    } catch (error) {
      throw new PerformanceError(`Failed to initialize performance monitor: ${error.message}`);
    }
  }

  private initializeWebVitals(): void {
    getCLS((metric) => this.handleMetric(metric));
    getFID((metric) => this.handleMetric(metric));
    getFCP((metric) => this.handleMetric(metric));
    getLCP((metric) => this.handleMetric(metric));
    getTTFB((metric) => this.handleMetric(metric));
    getINP((metric) => this.handleMetric(metric));
  }

  private initializePerformanceObservers(): void {
    // Long task observer
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handleLongTask(entry as PerformanceEntry);
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);

      // Layout shift observer (for additional CLS data)
      const layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handleLayoutShift(entry as PerformanceEntry);
        }
      });
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('layout-shift', layoutShiftObserver);

      // Navigation timing observer
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handleNavigationTiming(entry as PerformanceNavigationTiming);
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navigationObserver);
    }
  }

  private handleMetric(metric: any): void {
    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      rating: this.getRating(metric.name, metric.value),
      timestamp: Date.now(),
      id: metric.id
    };

    this.metrics[metric.name] = performanceMetric;

    if (this.options.onMetricUpdate) {
      this.options.onMetricUpdate(performanceMetric);
    }

    if (this.options.autoOptimization) {
      this.optimizeMetric(performanceMetric);
    }
  }

  private handleLongTask(entry: PerformanceEntry): void {
    if (entry.duration > 50) {
      this.emitWarning({
        type: 'long-task',
        message: `Long task detected: ${entry.duration.toFixed(2)}ms`,
        severity: 'warning',
        value: entry.duration
      });
    }
  }

  private handleLayoutShift(entry: PerformanceEntry): void {
    // Additional layout shift handling if needed
    const shiftEntry = entry as any;
    if (shiftEntry.hadRecentInput === false) {
      this.emitWarning({
        type: 'layout-shift',
        message: `Layout shift without user input: ${shiftEntry.value.toFixed(3)}`,
        severity: 'warning',
        value: shiftEntry.value
      });
    }
  }

  private handleNavigationTiming(entry: PerformanceNavigationTiming): void {
    // Extract additional navigation timing metrics
    const metrics = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      dnsLookup: entry.domainLookupEnd - entry.domainLookupStart,
      tcpConnection: entry.connectEnd - entry.connectStart,
      sslConnection: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0
    };

    Object.entries(metrics).forEach(([name, value]) => {
      const metric: PerformanceMetric = {
        name: name.replace(/([A-Z])/g, '-$1').toLowerCase(),
        value,
        rating: 'good', // These don't have standard thresholds
        timestamp: Date.now(),
        id: `navigation-${name}`
      };
      this.metrics[metric.name] = metric;
    });
  }

  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const target = this.options.targets[metricName as keyof PerformanceTargets];
    if (!target) return 'good';

    const thresholds = {
      LCP: { good: 2500, needsImprovement: 4000 },
      CLS: { good: 0.1, needsImprovement: 0.25 },
      INP: { good: 200, needsImprovement: 500 },
      FCP: { good: 1800, needsImprovement: 3000 },
      TTFB: { good: 800, needsImprovement: 1800 },
      FID: { good: 100, needsImprovement: 300 }
    };

    const threshold = thresholds[metricName as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  private optimizeMetric(metric: PerformanceMetric): void {
    if (metric.rating === 'poor') {
      switch (metric.name) {
        case 'LCP':
          this.optimizeLCP();
          break;
        case 'CLS':
          this.optimizeCLS();
          break;
        case 'INP':
          this.optimizeINP();
          break;
        case 'FCP':
          this.optimizeFCP();
          break;
        case 'TTFB':
          this.emitWarning({
            type: 'server-performance',
            message: 'Server response time is poor. Check server configuration and hosting.',
            severity: 'error',
            value: metric.value
          });
          break;
      }
    }
  }

  private optimizeLCP(): void {
    // Optimize for Largest Contentful Paint
    document.querySelectorAll('img').forEach(img => {
      if (!img.loading) {
        img.loading = 'lazy';
      }
      if (!img.decoding) {
        img.decoding = 'async';
      }
    });

    // Preload critical resources
    this.preloadCriticalResources();
  }

  private optimizeCLS(): void {
    // Optimize for Cumulative Layout Shift
    document.querySelectorAll('img').forEach(img => {
      if (!img.style.aspectRatio && img.naturalWidth && img.naturalHeight) {
        img.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
      }
    });

    // Reserve space for ads and iframes
    document.querySelectorAll('iframe, .ad-container').forEach(element => {
      if (!element.style.width || !element.style.height) {
        element.style.width = element.style.width || '300px';
        element.style.height = element.style.height || '250px';
      }
    });
  }

  private optimizeINP(): void {
    // Optimize for Interaction to Next Paint
    if ('scheduler' in window && 'postTask' in (scheduler as any)) {
      // Break up long tasks
      (scheduler as any).postTask(() => {
        this.optimizeMainThread();
      }, { priority: 'background' });
    }
  }

  private optimizeFCP(): void {
    // Optimize for First Contentful Paint
    const criticalCSS = this.extractCriticalCSS();
    if (criticalCSS) {
      this.inlineCriticalCSS(criticalCSS);
    }
  }

  private preloadCriticalResources(): void {
    // Preload critical fonts
    const fontPreload = document.createElement('link');
    fontPreload.rel = 'preload';
    fontPreload.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    fontPreload.as = 'style';
    fontPreload.crossOrigin = 'anonymous';
    document.head.appendChild(fontPreload);

    // Preconnect to font domains
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect);
  }

  private extractCriticalCSS(): string {
    // Simple critical CSS extraction - in production, use more sophisticated tools
    const criticalElements = document.querySelectorAll('head, body > *:first-child');
    let criticalCSS = '';

    criticalElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      // Extract key styles for above-the-fold content
      criticalCSS += `${element.tagName.toLowerCase()} { display: ${styles.display}; }`;
    });

    return criticalCSS;
  }

  private inlineCriticalCSS(css: string): void {
    const styleElement = document.createElement('style');
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
  }

  private optimizeMainThread(): void {
    // Use requestIdleCallback for non-critical tasks
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        // Defer non-critical scripts
        document.querySelectorAll('script[data-defer]').forEach(script => {
          if (script.getAttribute('data-defer') === 'true') {
            const newScript = document.createElement('script');
            newScript.src = (script as HTMLScriptElement).src;
            newScript.async = true;
            document.body.appendChild(newScript);
            script.remove();
          }
        });
      });
    }
  }

  private emitWarning(warning: PerformanceWarning): void {
    if (this.options.onWarning) {
      this.options.onWarning(warning);
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getOverallScore(): number {
    const coreMetrics = ['LCP', 'CLS', 'INP', 'FCP'];
    let totalScore = 0;
    let validMetrics = 0;

    coreMetrics.forEach(metricName => {
      const metric = this.metrics[metricName];
      if (metric) {
        const score = metric.rating === 'good' ? 100 :
                     metric.rating === 'needs-improvement' ? 70 : 30;
        totalScore += score;
        validMetrics++;
      }
    });

    return validMetrics > 0 ? Math.round(totalScore / validMetrics) : 0;
  }

  optimize(): void {
    // Run all optimizations
    this.optimizeLCP();
    this.optimizeCLS();
    this.optimizeINP();
    this.optimizeFCP();
  }

  generateReport(options: { includeDeviceInfo?: boolean; includeNetworkInfo?: boolean } = {}): any {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      metrics: this.metrics,
      overallScore: this.getOverallScore(),
      targets: this.options.targets
    };

    if (options.includeDeviceInfo) {
      report.deviceInfo = {
        userAgent: navigator.userAgent,
        deviceMemory: (navigator as any).deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency,
        platform: navigator.platform
      };
    }

    if (options.includeNetworkInfo && (navigator as any).connection) {
      const connection = (navigator as any).connection;
      report.networkInfo = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      };
    }

    return report;
  }

  destroy(): void {
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    this.initialized = false;
  }
}