---
name: Monochrome Noir Design System
description: |
  Sophisticated monochrome noir theme with platinum and burnt gold sheen for edge details. Creative typography with Spline integration. All visual elements are detailed wireframe flat or 3D with transparent backgrounds and subtle floating shadows. Hover effects trigger 3D isometric exploded technical diagrams with clever labeled parts. Click effects implode and load content.
---

## Design Philosophy

### Core Principles

**Monochrome Noir Base**
- Pure black (#000000) and near-black (#0A0A0A) backgrounds
- Grayscale palette for content (#1A1A1A to #E5E5E5)
- Platinum accents (#C0C0C0) for subtle highlights
- Burnt gold sheen (#B8860B) for tiny edge details
- High contrast: 7:1 minimum for WCAG AAA compliance

**Typography First**
- Large, bold type as primary visual element
- Creative font pairings (serif + sans-serif mix)
- Editorial-style layouts
- Variable font weights for hierarchy
- Letter-spacing as design element

**Wireframe Aesthetic**
- All icons/images start as detailed wireframes
- Flat or 3D with transparent backgrounds
- Subtle floating shadows (box-shadow: 0 4px 20px rgba(0,0,0,0.3))
- Technical drawing aesthetic
- Blueprint-inspired grid lines

## Color Palette

```css
:root {
  /* Base Colors - Noir */
  --noir-black: #000000;
  --noir-near-black: #0A0A0A;
  --noir-dark-gray: #1A1A1A;
  --noir-medium-gray: #4A4A4A;
  --noir-light-gray: #9A9A9A;
  --noir-platinum: #C0C0C0;
  --noir-off-white: #E5E5E5;
  --noir-pure-white: #FFFFFF;

  /* Accent Colors - Gold */
  --gold-dark: #8B6914;
  --gold-base: #B8860B;
  --gold-light: #D4A017;
  --gold-sheen: linear-gradient(135deg, #B8860B 0%, #D4A017 50%, #B8860B 100%);

  /* Functional Colors */
  --success: #2E7D32;
  --warning: #F57C00;
  --error: #C62828;
  --info: #1565C0;
}
```

## Typography System

### Font Families

```css
:root {
  --font-display: 'Playfair Display', serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-accent: 'Bebas Neue', display;
}
```

### Type Scale

```css
/* Display Typography */
.heading-hero {
  font-family: var(--font-display);
  font-size: clamp(3rem, 10vw, 8rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 0.9;
}

.heading-section {
  font-family: var(--font-accent);
  font-size: clamp(2rem, 6vw, 5rem);
  font-weight: 400;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.heading-card {
  font-family: var(--font-body);
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

/* Body Typography */
.body-large {
  font-family: var(--font-body);
  font-size: 1.25rem;
  line-height: 1.6;
  font-weight: 400;
}

.body-base {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.6;
  font-weight: 400;
}

.body-small {
  font-family: var(--font-body);
  font-size: 0.875rem;
  line-height: 1.5;
  font-weight: 400;
}

/* Technical Labels */
.label-wireframe {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
```

## Visual Components

### Wireframe Icons

All icons, images, and major headings must follow this pattern:

**Base State (No Hover)**
```css
.wireframe-element {
  position: relative;
  background: transparent;
  filter: grayscale(100%);
  opacity: 0.9;
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

/* Floating animation */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.wireframe-element {
  animation: float 4s ease-in-out infinite;
}
```

**Hover State - Exploded Diagram**
```css
.wireframe-element:hover {
  transform: scale(1.5) translateY(-20px);
  filter: grayscale(0%);
  opacity: 1;
  z-index: 100;
  cursor: pointer;
}

/* 3D isometric transformation */
.wireframe-element:hover .diagram-container {
  transform: rotateX(60deg) rotateZ(-45deg) scale(1.2);
  transform-style: preserve-3d;
  perspective: 1000px;
}

/* Exploded parts */
.wireframe-element:hover .diagram-part {
  position: absolute;
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.wireframe-element:hover .diagram-part:nth-child(1) {
  transform: translateZ(40px) translateY(-30px);
}

.wireframe-element:hover .diagram-part:nth-child(2) {
  transform: translateZ(-40px) translateY(30px);
}

.wireframe-element:hover .diagram-part:nth-child(3) {
  transform: translateX(40px) translateZ(20px);
}

/* Technical labels */
.wireframe-element:hover .tech-label {
  opacity: 1;
  font-size: 0.7rem;
  color: var(--gold-base);
  font-family: var(--font-mono);
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  padding: 4px 8px;
  border: 1px solid var(--gold-base);
  white-space: nowrap;
}
```

**Click State - Implosion**
```css
.wireframe-element:active {
  animation: implode 0.3s ease-in forwards;
}

@keyframes implode {
  0% {
    transform: scale(1.5);
    opacity: 1;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}
```

### Component Examples

**Tool Card with Exploded View**
```tsx
function ToolCard({ tool }) {
  return (
    <div className="wireframe-element tool-card">
      {/* Base wireframe icon */}
      <div className="diagram-container">
        <svg className="diagram-part part-core" viewBox="0 0 100 100">
          {/* Wireframe base */}
          <path
            d={tool.wireframePath}
            stroke="var(--noir-platinum)"
            strokeWidth="1"
            fill="transparent"
          />
          {/* Technical markings */}
          <line x1="0" y1="50" x2="100" y2="50"
            stroke="var(--gold-base)"
            strokeDasharray="2 2"
            strokeWidth="0.5"
          />
        </svg>

        {/* Exploded parts (hidden by default) */}
        <div className="diagram-part part-1">
          <span className="tech-label">CORE_V2.0</span>
          {/* Technical drawing */}
        </div>

        <div className="diagram-part part-2">
          <span className="tech-label">DATA_BUS</span>
        </div>

        <div className="diagram-part part-3">
          <span className="tech-label">QUANTUM_FLUX</span>
        </div>

        {/* Silly labeled parts */}
        <div className="diagram-part part-4">
          <span className="tech-label">MAGIC_SMOKE</span>
        </div>

        <div className="diagram-part part-5">
          <span className="tech-label">PIXIE_DUST_GENERATOR</span>
        </div>
      </div>

      {/* Card content */}
      <h3 className="heading-card">{tool.name}</h3>
      <p className="body-base">{tool.description}</p>
    </div>
  );
}
```

## Section Layouts

### One-Page Site Structure

```tsx
export default function ShowcasePage() {
  return (
    <main className="noir-page">
      {/* Hero Section */}
      <section id="hero" className="section-full">
        <h1 className="heading-hero">
          Creative Tools
          <span className="gold-accent">.</span>
        </h1>
      </section>

      {/* Tools Grid */}
      <section id="tools" className="section-full">
        <h2 className="heading-section">The Collection</h2>
        <div className="tools-grid">
          {tools.map(tool => <ToolCard key={tool.id} tool={tool} />)}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="section-full">
        <h2 className="heading-section">Acquire Access</h2>
        <PricingTiers />
      </section>

      {/* Newsletter */}
      <section id="newsletter" className="section-full">
        <h2 className="heading-section">Stay Informed</h2>
        <EmailCapture />
      </section>

      {/* Community */}
      <section id="community" className="section-full">
        <h2 className="heading-section">Join The Collective</h2>
        <SkoolCommunityLink />
      </section>
    </main>
  );
}
```

### Section Styling

```css
.noir-page {
  background: var(--noir-black);
  color: var(--noir-off-white);
  min-height: 100vh;
}

.section-full {
  min-height: 100vh;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-bottom: 1px solid rgba(192, 192, 192, 0.1);
}

/* Grid overlay for technical aesthetic */
.section-full::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(192, 192, 192, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(192, 192, 192, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
}
```

## Interactive Elements

### Email Capture Form

```tsx
function EmailCapture() {
  return (
    <form className="email-capture wireframe-element">
      <div className="form-group">
        <label className="label-wireframe">EMAIL_ADDRESS</label>
        <input
          type="email"
          placeholder="your@email.com"
          className="input-noir"
        />
        <button type="submit" className="button-noir">
          <span className="button-text">SUBSCRIBE</span>
          <div className="button-border-gold" />
        </button>
      </div>
    </form>
  );
}
```

```css
.input-noir {
  background: transparent;
  border: 1px solid var(--noir-medium-gray);
  color: var(--noir-off-white);
  font-family: var(--font-mono);
  padding: 1rem;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.input-noir:focus {
  outline: none;
  border-color: var(--gold-base);
  box-shadow: 0 0 20px rgba(184, 134, 11, 0.2);
}

.button-noir {
  position: relative;
  background: transparent;
  border: none;
  color: var(--noir-off-white);
  font-family: var(--font-accent);
  font-size: 1.2rem;
  letter-spacing: 0.2em;
  padding: 1rem 2rem;
  cursor: pointer;
  overflow: hidden;
}

.button-noir::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid var(--gold-base);
  opacity: 0.5;
}

.button-noir:hover::before {
  opacity: 1;
  box-shadow: 0 0 30px rgba(184, 134, 11, 0.4);
}
```

### Skool Community Link

```tsx
function SkoolCommunityLink() {
  return (
    <a
      href="https://your-community.skool.com"
      className="skool-link wireframe-element"
      target="_blank"
      rel="noopener"
    >
      <div className="diagram-container">
        {/* Wireframe community icon */}
        <svg viewBox="0 0 100 100" className="diagram-part">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="var(--noir-platinum)"
            strokeWidth="1"
            fill="none"
          />
          {/* Exploded on hover */}
          <circle className="diagram-inner" cx="50" cy="50" r="20" />
          <text className="tech-label">NEURAL_NET_V9</text>
        </svg>
      </div>

      <span className="heading-card">Join Community</span>
      <span className="body-small">Exclusive access</span>
    </a>
  );
}
```

## Spline Integration

### 3D Typography

```typescript
// components/SplineText.tsx
import { SplineScene } from '@splinetool/react-spline';

export function SplineHeading({ text }: { text: string }) {
  return (
    <div className="spline-heading-container">
      <SplineScene
        scene="/models/heading-3d.spline"
        style={{ width: '100%', height: '400px' }}
      />
      <h1 className="heading-hero">{text}</h1>
    </div>
  );
}
```

### Interactive 3D Elements

```typescript
// components/SplineWireframe.tsx
export function SplineWireframe({ model }: { model: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="spline-wireframe"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <SplineScene
        scene={`/models/${model}.spline`}
        style={{
          width: hovered ? '150%' : '100%',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      />
    </div>
  );
}
```

## Performance Optimization

### Lazy Loading

```typescript
import dynamic from 'next/dynamic';

const SplineWireframe = dynamic(
  () => import('./SplineWireframe'),
  {
    loading: () => <div className="wireframe-placeholder" />,
    ssr: false
  }
);
```

### Image Optimization

```typescript
import Image from 'next/image';

export function WireframeImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="wireframe-image-container">
      <Image
        src={src}
        alt={alt}
        width={800}
        height={600}
        className="wireframe-element"
        style={{ filter: 'grayscale(100%)' }}
      />
    </div>
  );
}
```

## Accessibility

### WCAG AAA Compliance

```css
/* High contrast focus indicators */
:focus-visible {
  outline: 2px solid var(--gold-base);
  outline-offset: 4px;
}

/* Skip link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--gold-base);
  color: var(--noir-black);
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

## Responsive Design

```css
@media (max-width: 768px) {
  .heading-hero {
    font-size: clamp(2rem, 12vw, 4rem);
  }

  .section-full {
    padding: 2rem 1rem;
  }

  .wireframe-element:hover {
    transform: scale(1.2);
    /* Scale down hover effect on mobile */
  }
}
```

## Animation Best Practices

### Smooth Transitions

```css
* {
  transition-property:
    transform,
    opacity,
    filter,
    color,
    border-color,
    box-shadow;
  transition-duration: 0.3s;
  transition-timing-function:
    cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Implementation Checklist

- [ ] Monochrome noir base colors
- [ ] Platinum and burnt gold accent colors
- [ ] Typography-first layout
- [ ] Wireframe icons/images with transparent backgrounds
- [ ] Floating shadow effects
- [ ] Hover: 3D isometric exploded diagrams
- [ ] Click: Implosion animation
- [ ] Technical labels on exploded parts
- [ ] One-page structure with sections
- [ ] Email capture form
- [ ] Skool community link
- [ ] WCAG AAA contrast ratios
- [ ] Smooth animations with reduced motion support

---

**Sources:**
- [Dodo Payments Official Docs](https://github.com/dodopayments/dodo-docs)
- [NotebookLM + n8n Integration Guide](https://scalevise.com/resources/notebooklm-with-n8n/)
- [RuVector Integration Guide](https://github.com/cldcde/ruvector)

**Part of the Showcase Builder Bundle - Updated for Monochrome Noir Theme**
