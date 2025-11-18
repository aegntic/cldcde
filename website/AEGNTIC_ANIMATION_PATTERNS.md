# AEGNTIC Animation Pattern Library
*Comprehensive research and implementation guide for modern animated web themes*
<p align="right"><sup>https://github.com/aegntic/animation-patterns</sup></p>
<p align="center"><sup>ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ</sup></p>
<p align="center"><sup>ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ ae.ˡᵗᵈ</sup></p>

## Core Animation Principles

### Performance-First Approach
- **GPU Acceleration**: Use `transform3d()` and `will-change` strategically
- **60fps Target**: All animations must maintain 60fps on mobile devices
- **Reduced Motion**: Respect `prefers-reduced-motion` media queries
- **Battery Optimization**: Minimize continuous animations on mobile

### Animation Hierarchy
1. **Micro-interactions** (0.1-0.3s): Hover states, button feedback
2. **Component Transitions** (0.3-0.6s): Modal opens, page transitions
3. **Layout Animations** (0.6-1.2s): Scroll-triggered content reveals
4. **Scene Transitions** (1.2-2.0s): Major page/state changes

---

## 1. Timing Functions & Easing Patterns

### Primary Easing Functions
```css
/* Smooth Entry */
.ease-smooth-enter {
  cubic-bezier(0.16, 1, 0.3, 1);
  /* Usage: 0.4s - Gentle acceleration, natural deceleration */
}

/* Elastic Exit */
.elastic-exit {
  cubic-bezier(0.68, -0.55, 0.265, 1.55);
  /* Usage: 0.6s - Overshoot for attention */
}

/* Power Transitions */
.ease-power-in {
  cubic-bezier(0.12, 0, 0.39, 0);
}

.ease-power-out {
  cubic-bezier(0.61, 1, 0.88, 1);
}

/* Natural Motion */
.ease-natural {
  cubic-bezier(0.25, 0.46, 0.45, 0.94);
  /* Usage: 0.8s - Physics-based feel */
}
```

### Duration Standards
```css
/* Atomic durations for consistency */
.duration-instant { transition-duration: 0.1s; }
.duration-fast { transition-duration: 0.2s; }
.duration-normal { transition-duration: 0.3s; }
.duration-slow { transition-duration: 0.5s; }
.duration-page { transition-duration: 0.8s; }
.duration-hero { transition-duration: 1.2s; }
```

---

## 2. Scroll-Triggered Animation Patterns

### Intersection Observer Configuration
```javascript
const scrollOptions = {
  root: null,
  rootMargin: '-10% 0px -10% 0px',
  threshold: [0.1, 0.5, 0.9]
};

// Performance optimization with requestAnimationFrame
const optimizedScrollHandler = () => {
  if (!ticking) {
    requestAnimationFrame(updateAnimations);
    ticking = true;
  }
};
```

### Staggered Content Reveals
```css
/* Base fade-up animation */
.fade-up {
  opacity: 0;
  transform: translateY(60px) translateZ(0);
  transition:
    opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-up.is-visible {
  opacity: 1;
  transform: translateY(0) translateZ(0);
}

/* Stagger delays for list items */
.stagger-item:nth-child(1) { transition-delay: 0.1s; }
.stagger-item:nth-child(2) { transition-delay: 0.15s; }
.stagger-item:nth-child(3) { transition-delay: 0.2s; }
.stagger-item:nth-child(4) { transition-delay: 0.25s; }
.stagger-item:nth-child(5) { transition-delay: 0.3s; }
```

### Parallax Scroll Effects
```css
.parallax-element {
  transform: translateZ(0);
  will-change: transform;
}

/* Subtle parallax for depth */
.parallax-slow {
  transform: translateY(calc(var(--scroll-y) * 0.2px));
}

/* Medium parallax for content */
.parallax-medium {
  transform: translateY(calc(var(--scroll-y) * 0.5px));
}

/* Fast parallax for background elements */
.parallax-fast {
  transform: translateY(calc(var(--scroll-y) * 0.8px));
}
```

---

## 3. Color Schemes & Design Tokens

### AEGNTIC Color Palette
```css
:root {
  /* Primary Brand Colors */
  --aegntic-primary: #00ff88;
  --aegntic-primary-dark: #00cc6a;
  --aegntic-primary-light: #1aff99;

  /* Gradient Accents (for specific effects only) */
  --aegntic-gradient-start: #00ff88;
  --aegntic-gradient-end: #00aaff;

  /* Dark Theme Base */
  --bg-primary: #0a0a0a;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #2a2a2a;

  /* Text Colors */
  --text-primary: #e0e0e0;
  --text-secondary: #b0b0b0;
  --text-muted: #808080;

  /* Accent Colors */
  --accent-cyan: #00ffff;
  --accent-magenta: #ff00ff;
  --accent-yellow: #ffff00;

  /* Animation Colors */
  --glow-primary: rgba(0, 255, 136, 0.8);
  --glow-secondary: rgba(0, 170, 255, 0.8);

  /* Shadow Depths */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.8);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.8);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.8);
  --shadow-xl: 0 16px 32px rgba(0, 0, 0, 0.8);
}
```

### Dynamic Color Transitions
```css
/* Smooth color shifting effects */
.color-shift {
  transition: color 0.3s var(--ease-natural),
              background-color 0.3s var(--ease-natural),
              border-color 0.3s var(--ease-natural);
}

/* Glow pulse effect */
.glow-pulse {
  animation: glowPulse 2s ease-in-out infinite alternate;
}

@keyframes glowPulse {
  0% {
    box-shadow: 0 0 5px var(--glow-primary),
                0 0 10px var(--glow-primary),
                0 0 15px var(--glow-primary);
  }
  100% {
    box-shadow: 0 0 10px var(--glow-secondary),
                0 0 20px var(--glow-secondary),
                0 0 30px var(--glow-secondary);
  }
}
```

---

## 4. Interactive Elements & User Flows

### Button Animation Suite
```css
/* Primary 3D Button */
.btn-3d {
  position: relative;
  background: var(--bg-secondary);
  border: 1px solid #333;
  border-bottom: 3px solid #000;
  border-right: 3px solid #000;
  color: var(--text-primary);
  padding: 12px 24px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  transition: all 0.2s ease;
  transform: translateZ(0);
}

.btn-3d:hover {
  transform: translateY(-2px);
  box-shadow:
    0 6px 12px rgba(0, 255, 136, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.8);
  border-bottom: 4px solid #000;
  border-right: 4px solid #000;
}

.btn-3d:active {
  transform: translateY(1px);
  border-bottom: 2px solid #000;
  border-right: 2px solid #000;
  transition: all 0.1s ease;
}

/* Ripple Effect on Click */
.btn-ripple {
  overflow: hidden;
  position: relative;
}

.btn-ripple::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn-ripple:active::before {
  width: 300px;
  height: 300px;
}
```

### Hover State Animations
```css
/* Image Lift Effect */
.hover-lift {
  transition: transform 0.3s var(--ease-smooth-enter),
              box-shadow 0.3s var(--ease-smooth-enter);
}

.hover-lift:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.8),
    0 10px 20px rgba(0, 255, 136, 0.1);
}

/* Text Glow on Hover */
.text-glow-hover {
  transition: text-shadow 0.3s var(--ease-smooth-enter);
}

.text-glow-hover:hover {
  text-shadow:
    0 0 10px var(--glow-primary),
    0 0 20px var(--glow-primary),
    0 0 30px var(--glow-primary);
}

/* Scale and Rotate Combo */
.hover-transform {
  transition: transform 0.3s var(--ease-elastic-exit);
}

.hover-transform:hover {
  transform: scale(1.05) rotate(1deg);
}
```

---

## 5. Loading Sequences

### Skeleton Loading Animation
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 0%,
    var(--bg-tertiary) 50%,
    var(--bg-secondary) 100%
  );
  background-size: 200% 100%;
  animation: skeleton 1.5s ease-in-out infinite;
}

@keyframes skeleton {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Staggered skeleton appearance */
.skeleton-item:nth-child(1) { animation-delay: 0.1s; }
.skeleton-item:nth-child(2) { animation-delay: 0.2s; }
.skeleton-item:nth-child(3) { animation-delay: 0.3s; }
```

### Page Transition Effects
```css
/* Fade and Slide Entry */
.page-enter {
  opacity: 0;
  transform: translateX(30px) translateZ(0);
}

.page-enter-active {
  opacity: 1;
  transform: translateX(0) translateZ(0);
  transition:
    opacity 0.6s var(--ease-smooth-enter),
    transform 0.6s var(--ease-smooth-enter);
}

/* Page Exit */
.page-exit {
  opacity: 1;
  transform: translateX(0) translateZ(0);
}

.page-exit-active {
  opacity: 0;
  transform: translateX(-30px) translateZ(0);
  transition:
    opacity 0.4s var(--ease-power-out),
    transform 0.4s var(--ease-power-out);
}
```

---

## 6. Performance Optimizations

### GPU Acceleration Patterns
```css
/* Force GPU layer creation */
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform, opacity;
}

/* Optimize for animations */
.optimize-animation {
  /* Avoid layout thrashing */
  transform: translate3d(0, 0, 0);
  /* Hint browser for optimization */
  will-change: transform;
  /* Ensure smooth rendering */
  backface-visibility: hidden;
  perspective: 1000px;
}
```

### Reduced Motion Support
```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Battery optimization on mobile */
@media (max-width: 768px) {
  .animation-mobile-optimized {
    animation: none;
    transition: transform 0.2s ease;
  }
}
```

### Intersection Observer for Lazy Loading
```javascript
// Efficient animation triggering
const createIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px 0px',
    threshold: 0.1
  };

  return new IntersectionObserver(callback, { ...defaultOptions, ...options });
};

// Usage for performance optimization
const observer = createIntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
      observer.unobserve(entry.target); // Animate only once
    }
  });
});
```

---

## 7. Advanced Animation Techniques

### Morphing SVG Effects
```css
/* Logo morph animation */
.logo-morph {
  transition: d 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Animated path drawing */
.path-draw {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: drawPath 2s ease-in-out forwards;
}

@keyframes drawPath {
  to {
    stroke-dashoffset: 0;
  }
}
```

### Particle Animation Patterns
```css
/* Floating particles background */
.particle {
  position: absolute;
  background: var(--aegntic-primary);
  border-radius: 50%;
  opacity: 0.6;
  animation: float 20s infinite linear;
}

@keyframes float {
  0% {
    transform: translateY(100vh) translateX(0) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-100vh) translateX(100px) scale(1);
    opacity: 0;
  }
}

/* Staggered particle generation */
.particle:nth-child(1) { animation-delay: 0s; left: 10%; }
.particle:nth-child(2) { animation-delay: 2s; left: 20%; }
.particle:nth-child(3) { animation-delay: 4s; left: 30%; }
.particle:nth-child(4) { animation-delay: 6s; left: 40%; }
.particle:nth-child(5) { animation-delay: 8s; left: 50%; }
```

### Text Animation Effects
```css
/* Glitch text effect */
.text-glitch {
  position: relative;
  color: var(--text-primary);
}

.text-glitch::before,
.text-glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.text-glitch::before {
  animation: glitch-1 0.5s infinite;
  color: var(--accent-cyan);
  z-index: -1;
}

.text-glitch::after {
  animation: glitch-2 0.5s infinite;
  color: var(--accent-magenta);
  z-index: -2;
}

@keyframes glitch-1 {
  0%, 100% { clip-path: inset(0 0 0 0); transform: translate(0); }
  20% { clip-path: inset(20% 0 30% 0); transform: translate(-2px, 2px); }
  40% { clip-path: inset(50% 0 20% 0); transform: translate(2px, -2px); }
  60% { clip-path: inset(10% 0 60% 0); transform: translate(-2px, 1px); }
  80% { clip-path: inset(80% 0 5% 0); transform: translate(1px, -1px); }
}

@keyframes glitch-2 {
  0%, 100% { clip-path: inset(0 0 0 0); transform: translate(0); }
  20% { clip-path: inset(60% 0 10% 0); transform: translate(2px, -1px); }
  40% { clip-path: inset(20% 0 50% 0); transform: translate(-2px, 2px); }
  60% { clip-path: inset(30% 0 40% 0); transform: translate(1px, -2px); }
  80% { clip-path: inset(5% 0 80% 0); transform: translate(-1px, 1px); }
}
```

---

## 8. Implementation Checklist

### Pre-Launch Validation
- [ ] All animations maintain 60fps on target devices
- [ ] Reduced motion preferences are respected
- [ ] Accessibility: ARIA labels for animated content
- [ ] Performance: Core Web Vitals within acceptable ranges
- [ ] Cross-browser compatibility testing
- [ ] Mobile battery optimization verified

### Animation Audit
- [ ] No layout thrashing during animations
- [ ] Proper use of `will-change` (don't overuse)
- [ ] GPU acceleration where beneficial
- [ ] Memory leak prevention for particle systems
- [ ] Cleanup of event listeners and observers

### User Experience Testing
- [ ] Loading animations don't feel slow
- [ ] Micro-interactions provide clear feedback
- [ ] Scroll animations don't cause motion sickness
- [ ] Performance on low-end devices is acceptable

---

## 9. AEGNTIC-Specific Implementation

### AE Logo Integration Patterns
```css
/* Logo animation states */
.logo-static { /* Default state */ }
.logo-hover { /* Hover interaction */ }
.logo-loading { /* Loading animation */ }
.logo-transition { /* Page transition state */ }

/* Specific to AEGNTIC branding */
.aegntic-glow {
  filter: drop-shadow(0 0 10px var(--aegntic-primary))
          drop-shadow(0 0 20px var(--aegntic-primary));
}

.aegntic-pulse {
  animation: aegnticPulse 2s ease-in-out infinite;
}

@keyframes aegnticPulse {
  0%, 100% {
    transform: scale(1);
    filter: brightness(1) drop-shadow(0 0 5px var(--aegntic-primary));
  }
  50% {
    transform: scale(1.05);
    filter: brightness(1.2) drop-shadow(0 0 15px var(--aegntic-primary));
  }
}
```

### Component Animation Library
```javascript
// AEGNTIC Animation Controller
class AegnticAnimations {
  constructor() {
    this.initObservers();
    this.setupScrollAnimations();
    this.initializeMicroInteractions();
  }

  // Staggered animations for lists/grids
  staggerAnimation(elements, baseDelay = 100) {
    elements.forEach((el, index) => {
      el.style.animationDelay = `${index * baseDelay}ms`;
    });
  }

  // Performance-optimized scroll handling
  setupScrollAnimations() {
    let ticking = false;

    const updateScroll = () => {
      const scrollY = window.scrollY;
      document.documentElement.style.setProperty('--scroll-y', scrollY);
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateScroll);
        ticking = true;
      }
    });
  }
}
```

---

## 10. Testing & Validation Framework

### Performance Metrics
```javascript
// Animation performance monitoring
const measureAnimationPerformance = (element, animationName) => {
  const startTime = performance.now();

  element.addEventListener('animationend', () => {
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`${animationName} duration: ${duration}ms`);

    // Flag if animation is too slow
    if (duration > 1000) {
      console.warn(`Slow animation detected: ${animationName}`);
    }
  });
};
```

### Accessibility Testing
```css
/* High contrast mode support */
@media (prefers-contrast: high) {
  .animated-element {
    border: 2px solid currentColor;
  }
}

/* Focus indicators for animated elements */
.focus-visible {
  outline: 2px solid var(--aegntic-primary);
  outline-offset: 2px;
}
```

---

**Implementation Notes:**
- This pattern library provides the foundation for AEGNTIC's animated theme system
- All timing values and easing functions are optimized for modern web performance
- The design system integrates seamlessly with the AEGNTIC brand identity
- Performance optimizations ensure smooth animations across all target devices
- Accessibility considerations are built into every animation pattern

*Research conducted by analyzing modern web animation best practices and performance optimization techniques suitable for AEGNTIC's requirements.*