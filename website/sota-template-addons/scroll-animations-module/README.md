# Scroll Animations Module

**ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ**
**ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ ae.ˡᵗᵈ**

Advanced scroll-triggered animations with 60fps performance and sophisticated easing functions.

---

## **Features**

### **🚀 Performance Optimized**
- **Intersection Observer API** for efficient element detection
- **RequestAnimationFrame throttling** for 60fps animations
- **GPU acceleration** with transform properties
- **Batched DOM updates** to minimize layout thrashing
- **Memory-efficient** with automatic cleanup

### **🎨 Advanced Animations**
- **Scroll-driven timelines** with precise control
- **Multi-layer parallax** with depth effects
- **Scroll velocity detection** for dynamic animations
- **Custom easing functions** (elastic, bounce, cubic, etc.)
- **Direction-aware animations** based on scroll direction

### **⚙️ Developer Friendly**
- **TypeScript support** with full type definitions
- **Animation presets** for common effects
- **Debug mode** for development
- **Progress callbacks** for custom logic
- **Viewport-based triggers** (top, center, bottom, percentages)

### **🔧 Highly Configurable**
- **Flexible trigger points** (pixels, percentages, viewport positions)
- **Srubbing control** for responsive animations
- **Pin functionality** for sticky elements
- **Toggle classes** for CSS transitions
- **Once animations** for one-time effects

---

## **Installation**

```bash
npm install @sota/scroll-animations-module
```

---

## **Quick Start**

```typescript
import { ScrollAnimationModule, ANIMATION_PRESETS } from '@sota/scroll-animations-module';

// Initialize the module
const scrollModule = new ScrollAnimationModule({
  smoothScrolling: true,
  enableGPUAcceleration: true,
  debugMode: false
});

await scrollModule.initialize();

// Create scroll-triggered animations
const animation = scrollModule.createAnimation({
  target: document.querySelector('.element'),
  start: 'top 80%',
  end: 'bottom 20%',
  animation: ANIMATION_PRESETS.fadeInUp,
  toggleClass: 'visible'
});

// Create parallax effects
const parallax = scrollModule.createParallax(element, {
  speed: 0.5,
  direction: 'vertical',
  scale: true,
  opacity: true
});
```

---

## **API Reference**

### **ScrollAnimationModule**

#### **Constructor Options**
```typescript
interface ScrollConfig {
  container?: Element | Window;        // Scroll container (default: window)
  smoothScrolling?: boolean;           // Enable smooth scrolling (default: false)
  scrollDuration?: number;             // Smooth scroll duration (default: 1000ms)
  easing?: EasingFunction;             // Global easing function
  lerpFactor?: number;                 // Linear interpolation factor (default: 0.1)
  enableGPUAcceleration?: boolean;     // GPU acceleration for transforms (default: true)
  debugMode?: boolean;                 // Enable debug information (default: false)
}
```

#### **Methods**
```typescript
// Initialize the module
await initialize(config?: Partial<ScrollConfig>): Promise<void>;

// Create scroll-triggered animation
createAnimation(config: ScrollAnimationConfig): ScrollAnimation;

// Create parallax effect
createParallax(element: Element, config?: ParallaxConfig): ParallaxAnimation;

// Create scroll timeline
createTimeline(config: TimelineConfig): ScrollTimeline;

// Refresh all animations (call after DOM changes)
refresh(): void;

// Get current scroll metrics
getScrollMetrics(): ScrollMetrics;

// Destroy the module and clean up
destroy(): void;
```

### **Animation Configuration**

```typescript
interface ScrollAnimationConfig {
  target: Element | Element[];        // Elements to animate
  trigger?: Element;                   // Custom trigger element
  start?: string | number;             // Start trigger ("top 80%", "center", 500)
  end?: string | number;               // End trigger ("bottom 20%", "center", 1000)
  scrub?: boolean | number;            // Scrub to scroll (true or smoothing factor)
  pin?: boolean | PinConfig;           // Pin element during animation
  animation?: AnimationConfig;         // Animation properties
  onEnter?: (animation: ScrollAnimation) => void;    // Callback when entering viewport
  onLeave?: (animation: ScrollAnimation) => void;    // Callback when leaving viewport
  onProgress?: (progress: number, animation: ScrollAnimation) => void; // Progress callback
  toggleClass?: string | string[];     // CSS classes to toggle
  once?: boolean;                      // Run animation only once
  markers?: boolean;                   // Show debug markers
}
```

#### **Animation Properties**
```typescript
interface AnimationConfig {
  properties: Record<string, {
    from: number | string;             // Start value
    to: number | string;               // End value
    unit?: string;                     // CSS unit (px, %, deg, etc.)
    easing?: string | EasingFunction;  // Property-specific easing
  }>;
  duration?: number;                   // Animation duration in ms
  easing?: string | EasingFunction;   // Global easing function
  delay?: number;                      // Delay before animation starts
}
```

### **Parallax Configuration**

```typescript
interface ParallaxConfig {
  speed?: number;                      // Parallax speed multiplier (default: 0.5)
  direction?: 'vertical' | 'horizontal' | 'both';  // Parallax direction
  scale?: boolean;                     // Enable scale effect
  rotation?: boolean;                  // Enable rotation effect
  opacity?: boolean;                   // Enable opacity effect
  blur?: boolean;                      // Enable blur based on velocity
  brightness?: boolean;                // Enable brightness effect
  customEffects?: CustomEffect[];      // Custom effect definitions
}
```

---

## **Animation Presets**

```typescript
// Fade animations
ANIMATION_PRESETS.fadeInUp      // Fade in + slide up
ANIMATION_PRESETS.fadeInDown    // Fade in + slide down
ANIMATION_PRESETS.fadeInLeft    // Fade in + slide left
ANIMATION_PRESETS.fadeInRight   // Fade in + slide right

// Transform animations
ANIMATION_PRESETS.scaleIn       // Scale up + fade in
ANIMATION_PRESETS.slideInLeft   // Slide in from left
ANIMATION_PRESETS.slideInRight  // Slide in from right
ANIMATION_PRESETS.rotateIn      // Rotate in + fade in

// Special animations
ANIMATION_PRESETS.bounceIn      // Bounce entrance effect
```

---

## **Advanced Usage**

### **Custom Easing Functions**

```typescript
// Create custom easing
const customEasing = (t: number) => {
  // Custom mathematical function
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};

// Use in animation
const animation = scrollModule.createAnimation({
  target: element,
  animation: {
    properties: {
      translateX: { from: 0, to: 100, unit: 'px', easing: customEasing }
    }
  }
});
```

### **Scroll Velocity Detection**

```typescript
// Create velocity-responsive animation
const animation = scrollModule.createAnimation({
  target: element,
  onProgress: (progress, animation) => {
    const metrics = scrollModule.getScrollMetrics();
    const velocity = metrics.velocity;

    // Adjust animation based on scroll velocity
    if (velocity > 1000) {
      // Fast scrolling - more dramatic effect
      element.style.transform = `scale(${1 + progress * 0.2})`;
    } else {
      // Slow scrolling - subtle effect
      element.style.transform = `scale(${1 + progress * 0.1})`;
    }
  }
});
```

### **Multi-Stage Animations**

```typescript
// Create timeline with multiple stages
const timeline = scrollModule.createTimeline({
  targets: [
    {
      element: element1,
      start: 0,
      end: 0.3,
      animations: [{
        properties: { opacity: { from: 0, to: 1 } }
      }]
    },
    {
      element: element2,
      start: 0.3,
      end: 0.7,
      animations: [{
        properties: { translateY: { from: 50, to: 0, unit: 'px' } }
      }]
    },
    {
      element: element3,
      start: 0.7,
      end: 1,
      animations: [{
        properties: { scale: { from: 0.8, to: 1 } }
      }]
    }
  ],
  duration: '100vh',
  onUpdate: (progress) => {
    console.log('Timeline progress:', progress);
  }
});
```

### **Pin Functionality**

```typescript
// Pin element during animation
const animation = scrollModule.createAnimation({
  target: element,
  pin: {
    element: element,                  // Element to pin
    spacer: true,                      // Add spacer to prevent content jump
    pushFollowers: true,               // Push following elements
    pinnedClass: 'pinned'              // CSS class for pinned state
  },
  start: 'top top',
  end: 'bottom top',
  animation: {
    properties: {
      scale: { from: 1, to: 1.5 }
    }
  }
});
```

---

## **Performance Tips**

### **1. Use GPU Acceleration**
```typescript
// Enable GPU acceleration (default: true)
const scrollModule = new ScrollAnimationModule({
  enableGPUAcceleration: true
});
```

### **2. Throttle Expensive Operations**
```typescript
// Use progress callbacks efficiently
animation.onProgress = (progress) => {
  // Throttle expensive calculations
  if (Math.floor(progress * 10) !== Math.floor(lastProgress * 10)) {
    // Only update every 10% progress
    updateExpensiveCalculation(progress);
  }
  lastProgress = progress;
};
```

### **3. Batch DOM Updates**
```typescript
// Use built-in batching for performance
scrollModule.batchUpdate(() => {
  element1.style.opacity = progress;
  element2.style.transform = `translateX(${progress * 100}px)`;
  element3.style.scale = 1 + progress * 0.2;
});
```

### **4. Optimize Parallax**
```typescript
// Use simpler parallax for better performance
const parallax = scrollModule.createParallax(element, {
  speed: 0.2,
  direction: 'vertical',
  // Disable expensive effects on mobile
  scale: window.innerWidth > 768,
  blur: false,
  brightness: false
});
```

---

## **Browser Support**

- **Modern browsers** (Chrome 51+, Firefox 55+, Safari 12.1+, Edge 15+)
- **Intersection Observer** API support required
- **RequestAnimationFrame** for smooth animations
- **CSS Transform** support for GPU acceleration
- **Progressive enhancement** for older browsers

---

## **Examples**

See the `/examples` directory for complete demonstrations:

- **scroll-demonstration.html** - Comprehensive demo showing all features
- **parallax-effects.html** - Advanced parallax examples
- **timeline-animations.html** - Complex timeline animations
- **performance-optimization.html** - Performance best practices

---

## **Integration with Frameworks**

### **React**

```typescript
import { useEffect, useRef } from 'react';
import { ScrollAnimationModule, ANIMATION_PRESETS } from '@sota/scroll-animations-module';

function AnimatedComponent() {
  const elementRef = useRef<HTMLDivElement>(null);
  const moduleRef = useRef<ScrollAnimationModule>();

  useEffect(() => {
    const module = new ScrollAnimationModule();
    moduleRef.current = module;

    module.initialize().then(() => {
      if (elementRef.current) {
        module.createAnimation({
          target: elementRef.current,
          start: 'top 80%',
          animation: ANIMATION_PRESETS.fadeInUp
        });
      }
    });

    return () => {
      module.destroy();
    };
  }, []);

  return <div ref={elementRef}>Animated Content</div>;
}
```

### **Vue**

```vue
<template>
  <div ref="element">Animated Content</div>
</template>

<script>
import { ScrollAnimationModule, ANIMATION_PRESETS } from '@sota/scroll-animations-module';

export default {
  data() {
    return {
      scrollModule: null
    };
  },
  mounted() {
    this.initAnimations();
  },
  beforeUnmount() {
    if (this.scrollModule) {
      this.scrollModule.destroy();
    }
  },
  methods: {
    async initAnimations() {
      this.scrollModule = new ScrollAnimationModule();
      await this.scrollModule.initialize();

      this.scrollModule.createAnimation({
        target: this.$refs.element,
        start: 'top 80%',
        animation: ANIMATION_PRESETS.fadeInUp
      });
    }
  }
};
</script>
```

---

## **Debug Mode**

Enable debug mode to visualize trigger points and animation states:

```typescript
const scrollModule = new ScrollAnimationModule({
  debugMode: true
});
```

Debug mode adds:
- **Trigger markers** showing start/end positions
- **Progress indicators** for active animations
- **Performance metrics** overlay
- **Console logging** for animation events

---

## **License**

MIT License - see LICENSE file for details.