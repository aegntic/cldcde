/**
 * Advanced Scroll-Triggered Animations Module
 *
 * High-performance scroll animations featuring:
 * - Intersection Observer API for efficient detection
 * - Parallax effects with depth layers
 * - Scroll-driven timeline animations
 * - Performance-optimized with RAF throttling
 * - Advanced easing functions and physics
 * - Viewport-based animation triggers
 * - Scroll velocity and direction detection
 * - Batched DOM updates for 60fps performance
 */

export interface ScrollAnimationModule {
  initialize(config?: ScrollConfig): Promise<void>;
  createAnimation(config: ScrollAnimationConfig): ScrollAnimation;
  createParallax(element: Element, config: ParallaxConfig): ParallaxAnimation;
  createTimeline(config: TimelineConfig): ScrollTimeline;
  destroy(): void;
  refresh(): void;
  getScrollMetrics(): ScrollMetrics;
}

export interface ScrollConfig {
  container?: Element | Window;
  smoothScrolling?: boolean;
  scrollDuration?: number;
  easing?: EasingFunction;
  lerpFactor?: number;
  enableGPUAcceleration?: boolean;
  debugMode?: boolean;
}

export interface ScrollAnimationConfig {
  target: Element | Element[];
  trigger?: Element;
  start?: string | number;
  end?: string | number;
  scrub?: boolean | number;
  pin?: boolean | PinConfig;
  animation?: AnimationConfig;
  onEnter?: (animation: ScrollAnimation) => void;
  onLeave?: (animation: ScrollAnimation) => void;
  onProgress?: (progress: number, animation: ScrollAnimation) => void;
  toggleClass?: string | string[];
  once?: boolean;
  markers?: boolean;
}

export interface AnimationConfig {
  properties: Record<string, KeyframeValue>;
  duration?: number;
  easing?: string | EasingFunction;
  delay?: number;
}

export interface KeyframeValue {
  from: any;
  to: any;
  unit?: string;
  easing?: string | EasingFunction;
}

export interface ParallaxConfig {
  speed?: number;
  direction?: 'vertical' | 'horizontal' | 'both';
  scale?: boolean;
  rotation?: boolean;
  opacity?: boolean;
  blur?: boolean;
  brightness?: boolean;
  customEffects?: CustomEffect[];
}

export interface CustomEffect {
  property: string;
  from: number | string;
  to: number | string;
  unit?: string;
  easing?: EasingFunction;
}

export interface PinConfig {
  element?: Element;
  spacer?: boolean;
  pushFollowers?: boolean;
  pinnedClass?: string;
}

export interface TimelineConfig {
  targets: TimelineTarget[];
  duration?: string | number;
  ease?: string | EasingFunction;
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

export interface TimelineTarget {
  element: Element;
  start: number | string;
  end: number | string;
  animations: AnimationConfig[];
}

export interface ScrollAnimation {
  play(): void;
  pause(): void;
  reverse(): void;
  seek(progress: number): void;
  kill(): void;
  refresh(): void;
  update(): void;
  progress: number;
  isActive: boolean;
  direction: 1 | -1;
  velocity: number;
}

export interface ParallaxAnimation {
  update(scrollTop: number, velocity: number): void;
  destroy(): void;
  element: Element;
  config: ParallaxConfig;
}

export interface ScrollTimeline {
  add(animation: ScrollAnimation): void;
  remove(animation: ScrollAnimation): void;
  play(): void;
  pause(): void;
  seek(time: number): void;
  time: number;
  duration: number;
}

export interface ScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  viewportHeight: number;
  viewportWidth: number;
  scrollProgress: number;
  maxScroll: number;
  direction: 'up' | 'down' | 'none';
  velocity: number;
  isScrolling: boolean;
}

export interface EasingFunction {
  (progress: number): number;
}

/**
 * Main Scroll Animation Module Implementation
 */
export class ScrollAnimationModuleManager implements ScrollAnimationModule {
  private container: Element | Window;
  private config: ScrollConfig;
  private animations: Map<string, ScrollAnimation> = new Map();
  private parallaxAnimations: ParallaxAnimation[] = [];
  private timelines: ScrollTimeline[] = [];
  private intersectionObserver: IntersectionObserver;
  private resizeObserver: ResizeObserver;
  private rafId: number | null = null;
  private isInitialized = false;
  private isScrolling = false;
  private scrollTimeout: number | null = null;
  private lastScrollTop = 0;
  private lastTimestamp = 0;
  private currentVelocity = 0;
  private scrollDirection: 'up' | 'down' | 'none' = 'none';
  private updateQueue: (() => void)[] = [];
  private metrics: ScrollMetrics;

  constructor(config: ScrollConfig = {}) {
    this.config = {
      container: window,
      smoothScrolling: false,
      scrollDuration: 1,
      easing: this.createEasingFunction('ease-out-cubic'),
      lerpFactor: 0.1,
      enableGPUAcceleration: true,
      debugMode: false,
      ...config
    };

    this.container = this.config.container!;
    this.metrics = this.initializeMetrics();
  }

  async initialize(config?: Partial<ScrollConfig>): Promise<void> {
    if (this.isInitialized) return;

    if (config) {
      this.config = { ...this.config, ...config };
      this.container = this.config.container!;
    }

    console.log('Initializing Scroll Animation Module...');

    // Initialize intersection observer
    this.initializeIntersectionObserver();

    // Initialize resize observer
    this.initializeResizeObserver();

    // Set up scroll event listeners
    this.initializeScrollListeners();

    // Initialize smooth scrolling if enabled
    if (this.config.smoothScrolling) {
      this.initializeSmoothScrolling();
    }

    // Start animation loop
    this.startAnimationLoop();

    this.isInitialized = true;
    console.log('Scroll Animation Module initialized');

    // Initial refresh
    this.refresh();
  }

  createAnimation(config: ScrollAnimationConfig): ScrollAnimation {
    const animation = new ScrollAnimationImpl(config, this);
    const id = this.generateId();
    this.animations.set(id, animation);

    // Set up intersection observer
    if (config.trigger) {
      this.intersectionObserver.observe(config.trigger);
    } else if (Array.isArray(config.target)) {
      config.target.forEach(target => {
        this.intersectionObserver.observe(target);
      });
    } else {
      this.intersectionObserver.observe(config.target);
    }

    return animation;
  }

  createParallax(element: Element, config: ParallaxConfig = {}): ParallaxAnimation {
    const parallax = new ParallaxAnimationImpl(element, {
      speed: 0.5,
      direction: 'vertical',
      scale: false,
      rotation: false,
      opacity: false,
      blur: false,
      brightness: false,
      customEffects: [],
      ...config
    });

    this.parallaxAnimations.push(parallax);
    this.intersectionObserver.observe(element);

    return parallax;
  }

  createTimeline(config: TimelineConfig): ScrollTimeline {
    const timeline = new ScrollTimelineImpl(config, this);
    this.timelines.push(timeline);
    return timeline;
  }

  destroy(): void {
    // Clean up animations
    this.animations.forEach(animation => animation.kill());
    this.animations.clear();

    // Clean up parallax animations
    this.parallaxAnimations.forEach(parallax => parallax.destroy());
    this.parallaxAnimations = [];

    // Clean up timelines
    this.timelines.forEach(timeline => timeline.pause());
    this.timelines = [];

    // Clean up observers
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    // Clean up event listeners
    if (this.container === window) {
      window.removeEventListener('scroll', this.handleScroll);
      window.removeEventListener('resize', this.handleResize);
    } else {
      this.container.removeEventListener('scroll', this.handleScroll);
    }

    // Cancel animation frame
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    this.isInitialized = false;
  }

  refresh(): void {
    // Update metrics
    this.metrics = this.calculateMetrics();

    // Refresh all animations
    this.animations.forEach(animation => animation.refresh());

    // Refresh parallax animations
    this.parallaxAnimations.forEach(parallax => {
      parallax.update(this.metrics.scrollTop, this.currentVelocity);
    });
  }

  getScrollMetrics(): ScrollMetrics {
    return { ...this.metrics };
  }

  // Private methods
  private initializeIntersectionObserver(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const animation = this.findAnimationByElement(entry.target);
          if (animation) {
            if (entry.isIntersecting) {
              animation.update();
              if (animation.isActive) {
                this.onAnimationEnter(animation);
              }
            } else {
              if (animation.isActive) {
                this.onAnimationLeave(animation);
              }
            }
          }
        });
      },
      {
        root: this.container === window ? null : this.container,
        rootMargin: '0px',
        threshold: [0, 0.1, 0.5, 1]
      }
    );
  }

  private initializeResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.refresh();
    });

    // Observe container if it's an element
    if (this.container !== window) {
      this.resizeObserver.observe(this.container as Element);
    }
  }

  private initializeScrollListeners(): void {
    this.handleScroll = this.throttle(() => {
      this.updateScrollMetrics();
      this.processAnimations();
    }, 16); // ~60fps

    this.handleResize = this.debounce(() => {
      this.refresh();
    }, 250);

    if (this.container === window) {
      window.addEventListener('scroll', this.handleScroll, { passive: true });
      window.addEventListener('resize', this.handleResize);
    } else {
      this.container.addEventListener('scroll', this.handleScroll, { passive: true });
    }

    // Track scroll velocity
    this.trackScrollVelocity();
  }

  private initializeSmoothScrolling(): void {
    if (this.container === window) {
      document.documentElement.style.scrollBehavior = 'smooth';
    } else {
      (this.container as Element).style.scrollBehavior = 'smooth';
    }
  }

  private startAnimationLoop(): void {
    const animate = (timestamp: number) => {
      // Process batched updates
      if (this.updateQueue.length > 0) {
        this.processBatchedUpdates();
      }

      // Update parallax animations
      if (this.parallaxAnimations.length > 0) {
        this.parallaxAnimations.forEach(parallax => {
          parallax.update(this.metrics.scrollTop, this.currentVelocity);
        });
      }

      // Update timelines
      this.timelines.forEach(timeline => {
        timeline.seek(this.metrics.scrollProgress * timeline.duration);
      });

      this.rafId = requestAnimationFrame(animate);
    };

    this.rafId = requestAnimationFrame(animate);
  }

  private updateScrollMetrics(): void {
    const newScrollTop = this.getScrollTop();
    const timestamp = performance.now();

    // Calculate velocity
    const deltaTime = timestamp - this.lastTimestamp;
    if (deltaTime > 0) {
      const deltaScroll = newScrollTop - this.lastScrollTop;
      this.currentVelocity = Math.abs(deltaScroll / deltaTime * 1000); // pixels per second
      this.scrollDirection = deltaScroll > 0 ? 'down' : deltaScroll < 0 ? 'up' : 'none';
    }

    this.lastScrollTop = newScrollTop;
    this.lastTimestamp = timestamp;

    // Update scroll state
    this.isScrolling = true;

    // Clear scroll timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    // Set scroll timeout to detect when scrolling stops
    this.scrollTimeout = window.setTimeout(() => {
      this.isScrolling = false;
      this.currentVelocity = 0;
      this.scrollDirection = 'none';
    }, 150) as unknown as number;

    // Update metrics
    this.metrics = this.calculateMetrics();
  }

  private processAnimations(): void {
    this.animations.forEach(animation => {
      if (animation.isActive) {
        animation.update();
      }
    });
  }

  private processBatchedUpdates(): void {
    // Process all batched DOM updates in a single frame
    this.updateQueue.forEach(update => update());
    this.updateQueue = [];
  }

  private onAnimationEnter(animation: ScrollAnimation): void {
    if (animation.config.onEnter) {
      animation.config.onEnter(animation);
    }
  }

  private onAnimationLeave(animation: ScrollAnimation): void {
    if (animation.config.onLeave) {
      animation.config.onLeave(animation);
    }
  }

  private findAnimationByElement(element: Element): ScrollAnimation | null {
    for (const animation of this.animations.values()) {
      const targets = Array.isArray(animation.config.target)
        ? animation.config.target
        : [animation.config.target];

      if (targets.includes(element) || animation.config.trigger === element) {
        return animation;
      }
    }
    return null;
  }

  private getScrollTop(): number {
    if (this.container === window) {
      return window.pageYOffset || document.documentElement.scrollTop;
    } else {
      return (this.container as Element).scrollTop;
    }
  }

  private calculateMetrics(): ScrollMetrics {
    const scrollTop = this.getScrollTop();
    const container = this.container === window ? document.documentElement : this.container as Element;

    const viewportHeight = this.container === window
      ? window.innerHeight
      : (this.container as Element).clientHeight;

    const viewportWidth = this.container === window
      ? window.innerWidth
      : (this.container as Element).clientWidth;

    const scrollHeight = container.scrollHeight;
    const maxScroll = Math.max(0, scrollHeight - viewportHeight);
    const scrollProgress = maxScroll > 0 ? scrollTop / maxScroll : 0;

    return {
      scrollTop,
      scrollHeight,
      viewportHeight,
      viewportWidth,
      scrollProgress,
      maxScroll,
      direction: this.scrollDirection,
      velocity: this.currentVelocity,
      isScrolling: this.isScrolling
    };
  }

  private initializeMetrics(): ScrollMetrics {
    return {
      scrollTop: 0,
      scrollHeight: 0,
      viewportHeight: 0,
      viewportWidth: 0,
      scrollProgress: 0,
      maxScroll: 0,
      direction: 'none',
      velocity: 0,
      isScrolling: false
    };
  }

  private trackScrollVelocity(): void {
    let lastScrollTop = 0;
    let lastTimestamp = performance.now();

    const updateVelocity = () => {
      const scrollTop = this.getScrollTop();
      const timestamp = performance.now();
      const deltaTime = timestamp - lastTimestamp;

      if (deltaTime > 0) {
        const deltaScroll = scrollTop - lastScrollTop;
        this.currentVelocity = Math.abs(deltaScroll / deltaTime * 1000);
      }

      lastScrollTop = scrollTop;
      lastTimestamp = timestamp;

      if (this.isInitialized) {
        requestAnimationFrame(updateVelocity);
      }
    };

    requestAnimationFrame(updateVelocity);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Utility methods
  private throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }

  private debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
    let timeoutId: number;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => func.apply(this, args), delay);
    }) as T;
  }

  // Public utility for creating easing functions
  createEasingFunction(type: string | EasingFunction, params?: any): EasingFunction {
    if (typeof type === 'function') {
      return type;
    }

    switch (type) {
      case 'linear':
        return (t) => t;
      case 'ease-in':
        return (t) => t * t;
      case 'ease-out':
        return (t) => t * (2 - t);
      case 'ease-in-out':
        return (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case 'ease-in-cubic':
        return (t) => t * t * t;
      case 'ease-out-cubic':
        return (t) => (--t) * t * t + 1;
      case 'ease-in-out-cubic':
        return (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      case 'ease-in-quad':
        return (t) => t * t;
      case 'ease-out-quad':
        return (t) => t * (2 - t);
      case 'ease-in-out-quad':
        return (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case 'ease-in-expo':
        return (t) => t === 0 ? 0 : Math.pow(2, 10 * t - 10);
      case 'ease-out-expo':
        return (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      case 'ease-in-out-expo':
        return (t) => {
          if (t === 0) return 0;
          if (t === 1) return 1;
          if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
          return (2 - Math.pow(2, -20 * t + 10)) / 2;
        };
      case 'ease-in-back':
        return (t) => {
          const c1 = 1.70158;
          const c3 = c1 + 1;
          return c3 * t * t * t - c1 * t * t;
        };
      case 'ease-out-back':
        return (t) => {
          const c1 = 1.70158;
          const c3 = c1 + 1;
          return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        };
      case 'ease-in-out-back':
        return (t) => {
          const c1 = 1.70158;
          const c2 = c1 * 1.525;
          return t < 0.5
            ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
            : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
        };
      case 'ease-in-bounce':
        return (t) => 1 - this.createEasingFunction('ease-out-bounce')(1 - t);
      case 'ease-out-bounce':
        return (t) => {
          const n1 = 7.5625;
          const d1 = 2.75;
          if (t < 1 / d1) return n1 * t * t;
          else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
          else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
          else return n1 * (t -= 2.625 / d1) * t + 0.984375;
        };
      case 'ease-in-out-bounce':
        return (t) => t < 0.5
          ? (1 - this.createEasingFunction('ease-out-bounce')(1 - 2 * t)) / 2
          : (1 + this.createEasingFunction('ease-out-bounce')(2 * t - 1)) / 2;
      case 'ease-out-elastic':
        return (t) => {
          const c4 = (2 * Math.PI) / 3;
          return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
        };
      case 'steps':
        const steps = params?.steps || 10;
        return (t) => Math.round(t * steps) / steps;
      default:
        return (t) => t;
    }
  }

  // Add batched DOM updates for performance
  batchUpdate(updateFn: () => void): void {
    this.updateQueue.push(updateFn);
  }

  private handleScroll = () => {};
  private handleResize = () => {};
}

/**
 * Scroll Animation Implementation
 */
class ScrollAnimationImpl implements ScrollAnimation {
  public progress = 0;
  public isActive = false;
  public direction: 1 | -1 = 1;
  public velocity = 0;

  constructor(
    public config: ScrollAnimationConfig,
    private module: ScrollAnimationModuleManager
  ) {}

  play(): void {
    this.isActive = true;
    this.update();
  }

  pause(): void {
    this.isActive = false;
  }

  reverse(): void {
    this.direction *= -1;
    this.update();
  }

  seek(progress: number): void {
    this.progress = Math.max(0, Math.min(1, progress));
    this.applyAnimation();

    if (this.config.onProgress) {
      this.config.onProgress(this.progress, this);
    }
  }

  kill(): void {
    this.isActive = false;
    this.resetAnimation();
  }

  refresh(): void {
    this.update();
  }

  update(): void {
    if (!this.isActive) return;

    const metrics = this.module.getScrollMetrics();
    const newProgress = this.calculateProgress(metrics);

    if (Math.abs(newProgress - this.progress) > 0.001) {
      const oldProgress = this.progress;
      this.progress = newProgress;
      this.direction = newProgress > oldProgress ? 1 : -1;

      this.applyAnimation();

      if (this.config.onProgress) {
        this.config.onProgress(this.progress, this);
      }

      // Handle toggle classes
      if (this.config.toggleClass) {
        this.toggleClasses();
      }
    }

    // Handle once property
    if (this.config.once && this.progress >= 1) {
      this.kill();
    }
  }

  private calculateProgress(metrics: ScrollMetrics): number {
    let start = 0;
    let end = 1;

    // Calculate start position
    if (this.config.start !== undefined) {
      if (typeof this.config.start === 'string') {
        start = this.parseValue(this.config.start, metrics);
      } else {
        start = this.config.start;
      }
    }

    // Calculate end position
    if (this.config.end !== undefined) {
      if (typeof this.config.end === 'string') {
        end = this.parseValue(this.config.end, metrics);
      } else {
        end = this.config.end;
      }
    }

    // Handle scrubbing
    if (this.config.scrub) {
      const scrubValue = typeof this.config.scrub === 'number' ? this.config.scrub : 1;
      const duration = end - start;
      start = start - (duration * scrubValue);
      end = end + (duration * scrubValue);
    }

    // Calculate progress
    const clampedStart = Math.max(0, start);
    const clampedEnd = Math.min(1, end);
    const range = clampedEnd - clampedStart;

    if (range <= 0) return 0;

    const rawProgress = (metrics.scrollProgress - clampedStart) / range;
    return Math.max(0, Math.min(1, rawProgress));
  }

  private parseValue(value: string, metrics: ScrollMetrics): number {
    // Parse percentage values
    if (value.endsWith('%')) {
      const percentage = parseFloat(value) / 100;
      return percentage;
    }

    // Parse pixel values
    if (value.endsWith('px')) {
      const pixels = parseFloat(value);
      return pixels / metrics.maxScroll;
    }

    // Parse viewport units
    if (value.endsWith('vh')) {
      const vh = parseFloat(value);
      return (vh / 100 * metrics.viewportHeight) / metrics.maxScroll;
    }

    // Parse keywords
    switch (value.toLowerCase()) {
      case 'top':
        return 0;
      case 'center':
        return 0.5;
      case 'bottom':
        return 1;
      default:
        return parseFloat(value) / 100;
    }
  }

  private applyAnimation(): void {
    if (!this.config.animation) return;

    const targets = Array.isArray(this.config.target)
      ? this.config.target
      : [this.config.target];

    targets.forEach(target => {
      Object.entries(this.config.animation!.properties).forEach(([property, keyframe]) => {
        const easedProgress = this.module.createEasingFunction(
          keyframe.easing || 'linear'
        )(this.progress);

        const value = this.interpolateValue(keyframe.from, keyframe.to, easedProgress, keyframe.unit);
        this.applyProperty(target, property, value);
      });
    });
  }

  private interpolateValue(from: any, to: any, progress: number, unit?: string): string {
    const fromNum = typeof from === 'number' ? from : parseFloat(from);
    const toNum = typeof to === 'number' ? to : parseFloat(to);

    if (isNaN(fromNum) || isNaN(toNum)) {
      return progress > 0.5 ? String(to) : String(from);
    }

    const interpolated = fromNum + (toNum - fromNum) * progress;
    return unit ? `${interpolated}${unit}` : String(interpolated);
  }

  private applyProperty(target: Element, property: string, value: string): void {
    // Use CSS custom properties for better performance
    if (property.startsWith('--')) {
      (target as HTMLElement).style.setProperty(property, value);
    } else {
      // Transform properties for GPU acceleration
      if (this.module.config.enableGPUAcceleration && this.isTransformProperty(property)) {
        (target as HTMLElement).style.transform = this.updateTransform(
          (target as HTMLElement).style.transform,
          property,
          value
        );
      } else {
        (target as HTMLElement).style[property as any] = value;
      }
    }
  }

  private isTransformProperty(property: string): boolean {
    const transformProperties = [
      'translateX', 'translateY', 'translateZ',
      'scale', 'scaleX', 'scaleY', 'scaleZ',
      'rotate', 'rotateX', 'rotateY', 'rotateZ',
      'skewX', 'skewY', 'perspective'
    ];
    return transformProperties.some(prop => property.toLowerCase().includes(prop.toLowerCase()));
  }

  private updateTransform(currentTransform: string, property: string, value: string): string {
    // Simple transform management - in a real implementation this would be more sophisticated
    const transforms = currentTransform ? currentTransform.split(' ') : [];
    const newTransform = `${property}(${value})`;

    // Remove existing transform of the same type
    const filteredTransforms = transforms.filter(transform =>
      !transform.toLowerCase().startsWith(property.toLowerCase().replace(/[XYZ]/, '').toLowerCase())
    );

    return [...filteredTransforms, newTransform].join(' ');
  }

  private toggleClasses(): void {
    const targets = Array.isArray(this.config.target)
      ? this.config.target
      : [this.config.target];

    const classes = Array.isArray(this.config.toggleClass)
      ? this.config.toggleClass
      : [this.config.toggleClass];

    targets.forEach(target => {
      classes.forEach(className => {
        if (this.progress > 0.5) {
          target.classList.add(className);
        } else {
          target.classList.remove(className);
        }
      });
    });
  }

  private resetAnimation(): void {
    if (!this.config.animation) return;

    const targets = Array.isArray(this.config.target)
      ? this.config.target
      : [this.config.target];

    targets.forEach(target => {
      Object.entries(this.config.animation!.properties).forEach(([property, keyframe]) => {
        this.applyProperty(target, property, String(keyframe.from));
      });
    });

    this.progress = 0;
  }
}

/**
 * Parallax Animation Implementation
 */
class ParallaxAnimationImpl implements ParallaxAnimation {
  private baseOffset = 0;
  private lastScrollTop = 0;

  constructor(
    public element: Element,
    public config: ParallaxConfig
  ) {
    this.baseOffset = this.getInitialOffset();
  }

  update(scrollTop: number, velocity: number): void {
    const rect = this.element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const elementCenter = rect.top + rect.height / 2;
    const viewportCenter = viewportHeight / 2;

    // Calculate parallax offset
    const parallaxOffset = (elementCenter - viewportCenter) * this.config.speed!;

    // Apply parallax effects
    this.applyParallaxEffects(parallaxOffset, velocity);

    this.lastScrollTop = scrollTop;
  }

  destroy(): void {
    // Reset element styles
    const element = this.element as HTMLElement;
    element.style.transform = '';
    element.style.opacity = '';
    element.style.filter = '';
  }

  private getInitialOffset(): number {
    const rect = this.element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return rect.top + scrollTop;
  }

  private applyParallaxEffects(offset: number, velocity: number): void {
    const element = this.element as HTMLElement;
    let transform = '';

    // Position parallax
    if (this.config.direction === 'vertical' || this.config.direction === 'both') {
      transform += `translateY(${offset}px) `;
    }
    if (this.config.direction === 'horizontal' || this.config.direction === 'both') {
      transform += `translateX(${offset}px) `;
    }

    // Scale effect
    if (this.config.scale) {
      const scale = 1 + (offset * 0.0001); // Subtle scale effect
      transform += `scale(${scale}) `;
    }

    // Rotation effect
    if (this.config.rotation) {
      const rotation = offset * 0.1; // Subtle rotation
      transform += `rotate(${rotation}deg) `;
    }

    element.style.transform = transform.trim() || 'none';

    // Opacity effect
    if (this.config.opacity) {
      const opacity = Math.max(0, Math.min(1, 1 - Math.abs(offset * 0.001)));
      element.style.opacity = opacity.toString();
    }

    // Blur effect based on velocity
    if (this.config.blur) {
      const blur = Math.min(5, velocity * 0.01);
      element.style.filter = `blur(${blur}px)`;
    }

    // Brightness effect based on velocity
    if (this.config.brightness) {
      const brightness = Math.max(0.5, Math.min(1.5, 1 - velocity * 0.0001));
      element.style.filter = element.style.filter
        ? `${element.style.filter} brightness(${brightness})`
        : `brightness(${brightness})`;
    }

    // Custom effects
    if (this.config.customEffects) {
      this.config.customEffects.forEach(effect => {
        const easedProgress = Math.max(0, Math.min(1, offset / 1000));
        const easingFunction = (t: number) => t; // Linear easing for custom effects
        const value = this.interpolateValue(effect.from, effect.to, easedProgress, effect.unit);

        if (effect.property.startsWith('--')) {
          element.style.setProperty(effect.property, value);
        } else {
          (element.style as any)[effect.property] = value;
        }
      });
    }
  }

  private interpolateValue(from: number | string, to: number | string, progress: number, unit?: string): string {
    const fromNum = typeof from === 'number' ? from : parseFloat(from);
    const toNum = typeof to === 'number' ? to : parseFloat(to);

    if (isNaN(fromNum) || isNaN(toNum)) {
      return progress > 0.5 ? String(to) : String(from);
    }

    const interpolated = fromNum + (toNum - fromNum) * progress;
    return unit ? `${interpolated}${unit}` : String(interpolated);
  }
}

/**
 * Scroll Timeline Implementation
 */
class ScrollTimelineImpl implements ScrollTimeline {
  private animations: ScrollAnimation[] = [];
  private currentTime = 0;
  private isPlaying = false;

  constructor(
    public config: TimelineConfig,
    private module: ScrollAnimationModuleManager
  ) {
    this.duration = typeof config.duration === 'string'
      ? this.parseDuration(config.duration)
      : (config.duration || 1000);
  }

  add(animation: ScrollAnimation): void {
    this.animations.push(animation);
  }

  remove(animation: ScrollAnimation): void {
    const index = this.animations.indexOf(animation);
    if (index > -1) {
      this.animations.splice(index, 1);
    }
  }

  play(): void {
    this.isPlaying = true;
  }

  pause(): void {
    this.isPlaying = false;
  }

  seek(time: number): void {
    this.currentTime = Math.max(0, Math.min(this.duration, time));

    this.animations.forEach(animation => {
      const progress = this.currentTime / this.duration;
      animation.seek(progress);
    });

    if (this.config.onUpdate) {
      this.config.onUpdate(this.currentTime / this.duration);
    }
  }

  get time(): number {
    return this.currentTime;
  }

  get duration(): number {
    return this._duration;
  }

  set duration(value: number) {
    this._duration = value;
  }

  private _duration = 1000;

  private parseDuration(duration: string): number {
    // Parse duration strings like "100vh", "50%", etc.
    if (duration.endsWith('vh')) {
      const vh = parseFloat(duration);
      return vh * window.innerHeight;
    }

    if (duration.endsWith('%')) {
      const percentage = parseFloat(duration);
      return percentage * this.module.getScrollMetrics().maxScroll;
    }

    return parseFloat(duration);
  }
}

// Utility functions and exports
export function createScrollAnimationModule(config?: ScrollConfig): ScrollAnimationModule {
  return new ScrollAnimationModuleManager(config);
}

export function createScrollParallax(element: Element, config?: ParallaxConfig): ParallaxAnimation {
  const module = new ScrollAnimationModuleManager();
  return module.createParallax(element, config);
}

// Predefined animation presets
export const ANIMATION_PRESETS = {
  fadeInUp: {
    properties: {
      opacity: { from: 0, to: 1 },
      translateY: { from: 50, to: 0, unit: 'px' }
    },
    easing: 'ease-out-cubic',
    duration: 1000
  },
  fadeInDown: {
    properties: {
      opacity: { from: 0, to: 1 },
      translateY: { from: -50, to: 0, unit: 'px' }
    },
    easing: 'ease-out-cubic',
    duration: 1000
  },
  fadeInLeft: {
    properties: {
      opacity: { from: 0, to: 1 },
      translateX: { from: -50, to: 0, unit: 'px' }
    },
    easing: 'ease-out-cubic',
    duration: 1000
  },
  fadeInRight: {
    properties: {
      opacity: { from: 0, to: 1 },
      translateX: { from: 50, to: 0, unit: 'px' }
    },
    easing: 'ease-out-cubic',
    duration: 1000
  },
  scaleIn: {
    properties: {
      opacity: { from: 0, to: 1 },
      scale: { from: 0.8, to: 1 }
    },
    easing: 'ease-out-back',
    duration: 800
  },
  slideInLeft: {
    properties: {
      translateX: { from: '-100%', to: '0%' }
    },
    easing: 'ease-out-cubic',
    duration: 800
  },
  slideInRight: {
    properties: {
      translateX: { from: '100%', to: '0%' }
    },
    easing: 'ease-out-cubic',
    duration: 800
  },
  rotateIn: {
    properties: {
      opacity: { from: 0, to: 1 },
      rotate: { from: -180, to: 0, unit: 'deg' }
    },
    easing: 'ease-out-back',
    duration: 1200
  },
  bounceIn: {
    properties: {
      opacity: { from: 0, to: 1 },
      scale: { from: 0.3, to: 1 }
    },
    easing: 'ease-out-bounce',
    duration: 1000
  }
} as const;

export default ScrollAnimationModuleManager;