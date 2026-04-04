---
name: Frontend Design (Official Anthropic)
description: |
  Official Anthropic skill for creating distinctive, production-grade frontend interfaces that avoid generic AI aesthetics. Guides creation of bespoke, minimal, and unique UI designs with modern CSS best practices. Framework-agnostic design patterns that prioritize accessibility, performance, and visual distinction over template-based approaches.
---

## Overview

Frontend Design is the official Anthropic skill for building production-grade user interfaces that stand out from the crowd. Unlike typical AI-generated interfaces that rely on purple gradients and generic patterns, this skill enables creation of truly distinctive designs that reflect your brand identity.

## Core Philosophy

### Avoiding Generic AI Aesthetics

**The "Purple Gradient" Problem:**
- AI tools consistently generate similar-looking interfaces
- Predictable color schemes (purple/blue gradients)
- Generic layouts and component structures
- Template-based thinking

**The Frontend Design Solution:**
- Intentional minimalism and visual hierarchy
- Bespoke color schemes with purpose
- Unique layout structures
- Component libraries that scale

### Design Principles

1. **Less is More**: Intentional minimalism over visual clutter
2. **Visual Hierarchy**: Clear information architecture
3. **Accessibility First**: WCAG AA compliance as baseline
4. **Performance**: Fast load times, smooth animations
5. **Responsive**: Mobile-first, touch-friendly

## Quick Start

### Initialize Design System

```bash
/frontend-design-init
```

**This creates:**
- Design tokens for colors, spacing, typography
- Component library structure
- CSS architecture (Tailwind or custom)
- Accessibility testing setup

### Create a Component

```bash
/frontend-design-component "Button" --variants "primary,secondary,ghost"
```

**Generates:**
- Accessible button component
- Hover/focus states
- Loading states
- Size variants
- Dark mode support

## Design System Architecture

### Design Tokens

```yaml
colors:
  primary:
    light: "#0F172A"
    main: "#020617"
    dark: "#000000"
  accent:
    coral: "#FF6B6B"
    teal: "#4ECDC4"
    gold: "#FFD93D"

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px

typography:
  sans: "Inter, system-ui, sans-serif"
  mono: "Fira Code, monospace"
  sizes:
    xs: 0.75rem
    sm: 0.875rem
    base: 1rem
    lg: 1.125rem
    xl: 1.25rem
```

### Component Patterns

**1. Atomic Design**
```
atoms → molecules → organisms → templates → pages
```

**2. Compound Components**
```jsx
<Card>
  <Card.Header>
    <Card.Title>Tool Name</Card.Title>
    <Card.Subtitle>Version 1.0</Card.Subtitle>
  </Card.Header>
  <Card.Body>
    Description and features
  </Card.Body>
  <Card.Footer>
    <Button>Install</Button>
  </Card.Footer>
</Card>
```

**3. Render Props**
```jsx
<ToolCard
  renderHeader={(tool) => <h3>{tool.name}</h3>}
  renderActions={(tool) => <InstallButton tool={tool} />}
/>
```

## Layout Strategies

### Bespoke Grid Systems

**Tool Showcase Grid:**
```css
.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 2rem;
}

@media (min-width: 1024px) {
  .tool-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Masonry Layouts

**For varying card heights:**
```jsx
<MasonryGrid columns={3} gap={24}>
  {tools.map(tool => (
    <ToolCard key={tool.id} tool={tool} />
  ))}
</MasonryGrid>
```

### Asymmetric Layouts

**Break from grid patterns:**
```jsx
<div className="grid grid-cols-12 gap-8">
  <div className="col-span-7">
    <FeaturedTool />
  </div>
  <div className="col-span-5">
    <ToolList />
  </div>
</div>
```

## Color Psychology

### Avoiding Clichés

**Don't Use:**
- Purple/blue gradients (AI cliché)
- Generic "tech blue"
- Overused neons

**Use Instead:**
- Coral/salmon for warmth
- Teal/turquoise for trust
- Gold/amber for premium
- Charcoal/slate for sophistication

### Dark Mode Design

**Best Practices:**
- Pure black (#000000) for OLEDs
- Off-white (#F7F7F7) for text
- Accent colors pop more
- Increase contrast slightly

## Animation Principles

### Purposeful Motion

```css
/* Good: Intentional */
.tool-card {
  transition: transform 0.2s ease-out;
}

.tool-card:hover {
  transform: translateY(-4px);
}

/* Bad: Distracting */
@keyframes rainbow {
  /* Don't do this */
}
```

### Micro-interactions

**Button Press:**
```css
.button:active {
  transform: scale(0.98);
}
```

**Loading State:**
```jsx
<Skeleton className="animate-pulse" />
```

## Accessibility Checklist

### WCAG AA Compliance

**Color Contrast:**
- Text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

**Keyboard Navigation:**
- All interactive elements focusable
- Visible focus indicators
- Logical tab order
- Skip links available

**Screen Readers:**
- Semantic HTML
- ARIA labels where needed
- Alt text for images
- Error announcements

### Testing

```bash
/frontend-design-a11y-test
```

**Checks:**
- Automated a11y tests
- Keyboard navigation
- Screen reader testing
- Color contrast validation

## Performance Optimization

### Critical CSS

```css
/* Above-the-fold styles inline */
.hero {
  /* ... */
}
```

### Lazy Loading

```jsx
<img
  loading="lazy"
  src={tool.image}
  alt={tool.name}
/>
```

### Code Splitting

```jsx
const ToolDetails = lazy(() => import('./ToolDetails'));
```

## Common Patterns

### Tool Showcase Card

```jsx
function ToolCard({ tool }) {
  return (
    <article className="tool-card">
      <div className="tool-card-header">
        <ToolIcon name={tool.icon} />
        <div className="tool-meta">
          <h3>{tool.name}</h3>
          <Badge>{tool.category}</Badge>
        </div>
      </div>
      <p className="tool-description">{tool.description}</p>
      <div className="tool-stats">
        <Stat icon="★" value={tool.stars} />
        <Stat icon="↓" value={tool.downloads} />
      </div>
      <div className="tool-actions">
        <Button variant="primary">Install</Button>
        <Button variant="ghost">Docs</Button>
      </div>
    </article>
  );
}
```

### Pricing Table

```jsx
function PricingTier({ tier, highlighted }) {
  return (
    <div className={`pricing-tier ${highlighted ? 'highlighted' : ''}`}>
      <h3>{tier.name}</h3>
      <div className="price">
        <span className="amount">{tier.price}</span>
        <span className="period">/month</span>
      </div>
      <ul className="features">
        {tier.features.map(feature => (
          <li key={feature}>
            <CheckIcon /> {feature}
          </li>
        ))}
      </ul>
      <Button>{tier.cta}</Button>
    </div>
  );
}
```

## Framework Integration

### Next.js 15 + React 19

```tsx
// app/page.tsx
export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Hero />
      <ToolGrid />
      <Pricing />
    </main>
  );
}
```

### Tailwind CSS v4

```css
@theme {
  --color-primary: #020617;
  --color-accent: #FF6B6B;
  --spacing-unit: 4px;
}
```

### Framer Motion

```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <ToolCard />
</motion.div>
```

## Best Practices

### Do's

✓ Use semantic HTML
✓ Implement proper heading hierarchy
✓ Ensure sufficient color contrast
✓ Provide alt text for images
✓ Support keyboard navigation
✓ Test with screen readers
✓ Optimize images and assets
✓ Use proper loading states
✓ Implement error boundaries
✓ Write maintainable CSS

### Don'ts

✗ Rely solely on color for meaning
✗ Use fixed font sizes
✗ Ignore mobile users
✗ Auto-play media
✗ Use small tap targets
✗ Skip accessibility testing
✗ Over-animate
✗ Use generic templates
✗ Ignore performance
✗ Hardcode values

## Resources

### Official Documentation
- [Anthropic Frontend Design Skill](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md)
- [Improving Frontend Design Through Skills](https://claude.com/blog/improving-frontend-design-through-skills)

### Design Systems
- [Design Systems for Developers](https://www.designsystems.com/)
- [Atomic Design by Brad Frost](https://atomicdesign.bradfrost.com/)

### Accessibility
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

### Inspiration
- [Awwwards](https://www.awwwards.com/)
- [Dribbble](https://dribbble.com/)
- [SiteInspire](https://www.siteinspire.org/)

---

**Source:** [Official Anthropic Frontend Design Skill](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md)

**Part of the Showcase Builder Bundle**
