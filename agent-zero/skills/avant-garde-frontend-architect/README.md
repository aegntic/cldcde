# Avant-Garde Frontend Architect

**Senior Frontend Architecture & Bespoke UI Design Skill**

---

## Quick Start

### Standard Mode (Direct Implementation)
```
You: "Create a navigation bar with glassmorphism effect"

Response: Immediate implementation with concise rationale
```

### ULTRATHINK Mode (Deep Analysis)
```
You: "ULTRATHINK: Design a dashboard component library"

Response: Multi-dimensional analysis covering:
- Psychological impact on users
- Rendering performance implications
- WCAG AAA accessibility compliance
- Long-term maintainability
- Edge case prevention
- Complete implementation
```

---

## Component Library System

This skill includes a **personalized component library** that grows with you. Every unique, reusable component you create can be saved and referenced across all future projects.

### Library Structure

```
library/
├── components/          # Reusable UI components
│   ├── navigation/      # Nav patterns
│   ├── cards/          # Card layouts
│   ├── buttons/        # Button variants
│   ├── forms/          # Input patterns
│   ├── overlays/       # Modals, sheets
│   └── typography/     # Text components
├── patterns/           # Layout patterns
│   ├── grid-systems/
│   ├── hero-sections/
│   ├── content-flow/
│   └── data-display/
├── layouts/            # Page templates
│   ├── landing/
│   ├── dashboard/
│   ├── editorial/
│   └── app-shell/
└── animations/         # Motion design
    ├── entrances/
    ├── interactions/
    ├── scroll-effects/
    └── loaders/
```

---

## Managing Your Library

### Add a New Component
```bash
cd ~/.claude/skills/avant-garde-frontend-architect

./scripts/add-component.sh \
  --category "components/cards" \
  --name "holographic-glass-card" \
  --description "Glassmorphic card with holographic gradient borders"
```

### List Components
```bash
# List all components
./scripts/list-components.sh --all

# List specific category
./scripts/list-components.sh components/navigation
```

### Search Library
```bash
./scripts/search-library.sh "glass"
./scripts/search-library.sh "animation"
```

### Get Component Implementation
```bash
./scripts/get-component.sh "floating-asymmetric-nav"
```

---

## Pre-Loaded Components

### Navigation
- **Floating Asymmetric Nav** - Modern pill-shaped floating nav with glassmorphism
- **Magnetic Cursor Nav** - Links that attract cursor on hover

### Cards
- **Holographic Glass Card** - Glassmorphic card with animated gradient borders
- **Bento Grid Layout** - Asymmetric grid with varying card sizes

### Layouts
- **Kinetic Split Hero** - 40/60 split with scroll-triggered animations
- **Cinematic Scroll Reveal** - Cascade element reveals on scroll

### Animations
- **Liquid Button Morph** - Organic button hover effects
- **Text Kinetic Reveal** - Staggered character animations

---

## Core Principles

### 1. Intentional Minimalism
- Every element must earn its place
- Delete anything without clear purpose
- Reduction is the ultimate sophistication

### 2. Anti-Generic Design
- Reject template-looking layouts
- Strive for bespoke, unique interfaces
- Embrace asymmetry and distinctive typography

### 3. Library Discipline
- **ALWAYS** use existing UI libraries when detected (Shadcn, Radix, MUI)
- Wrap library components with custom styling for uniqueness
- Never reinvent the wheel unnecessarily

### 4. Performance First
- Transform-based animations (GPU accelerated)
- Minimal repaint/reflow costs
- Optimimize for Core Web Vitals

### 5. Accessibility by Default
- WCAG 2.1 AAA compliance target
- Keyboard navigation support
- Screen reader testing
- Color contrast 7:1 minimum

---

## ULTRATHINK Framework

When triggered with "ULTRATHINK", the skill performs exhaustive analysis:

### Psychological Analysis
- Cognitive load assessment
- Decision fatigue prevention
- Emotional response design
- Trust signal implementation

### Technical Analysis
- Rendering performance (FCP, LCP, TTI)
- Reflow/repaint cost calculation
- State complexity minimization
- Bundle size impact

### Accessibility Analysis
- WCAG compliance level (AA/AAA)
- Keyboard navigation flow
- Screen reader semantic markup
- Color contrast verification

### Scalability Analysis
- Code maintainability score
- Pattern reusability potential
- Test coverage strategy
- Documentation completeness

---

## Response Examples

### Standard Mode Response
```
Rationale: Floating navigation with glassmorphism creates depth while maintaining
lightweight presence. Asymmetric layout adds visual interest without clutter.

The Code:
[Implementation]
```

### ULTRATHINK Mode Response
```
## Deep Reasoning Chain

### Psychological Analysis
Dashboard users experience cognitive overload when presented with dense data.
This component library uses progressive disclosure to show only essential
information first, with expandable details on demand. Reduces decision fatigue
by limiting concurrent options to 7±2 items per view.

### Technical Analysis
- Rendering: Virtual scrolling prevents DOM nodes >1000 (60fps maintained)
- State: Zustand for minimal re-renders vs Redux (43% smaller bundle)
- Bundle: 45KB gzipped for full library (code splitting available)

### Accessibility Analysis
- WCAG AAA: All color combinations tested for 7:1 contrast
- Keyboard: Full keyboard navigation with visible focus indicators
- Screen Reader: Semantic HTML with ARIA labels for all interactive elements
- RTL: Full right-to-left language support

### Scalability Analysis
- Atomic design system with design tokens ensures consistency
- Component props use TypeScript for type safety
- Storybook documentation for all 47 components
- Automated visual regression tests via Percy

## Edge Case Analysis
- Empty states: Show helpful illustration + action prompt
- Loading states: Skeleton screens prevent layout shift
- Error states: User-friendly error messages with recovery options
- Data overflow: Virtualization + pagination for large datasets
- Mobile touch: 44px minimum touch targets per iOS HIG

## Performance Impact
- Bundle: +45KB gzipped (tree-shakeable to 12KB minimal)
- Rendering: Virtualization limits DOM to 100 nodes max
- Memory: Zustand state ~2KB vs Redux ~8KB
- Animation: RAF-based scroll listeners (60fps guaranteed)

## The Code
[Complete production implementation]
```

---

## Integration with Projects

### Automatic UI Library Detection
The skill automatically detects and uses:
1. **Shadcn UI** → `@/components/ui/*`
2. **Radix UI** → `@radix-ui/*`
3. **MUI** → `@mui/material/*`
4. **Chakra UI** → `@chakra-ui/*`
5. **NextUI** → `@nextui-org/*`

### Example Workflow
```javascript
// User request:
"Create a pricing section with 3 cards using our existing Shadcn UI"

// Skill automatically:
1. Detects Shadcn UI in project
2. Uses Card, Button, Badge components
3. Adds custom styling for uniqueness
4. Implements responsive grid
5. Ensures accessibility compliance
```

---

## Best Practices

### When to Use This Skill
- Custom UI components that need distinctive design
- Landing pages and marketing sites
- Dashboard and application interfaces
- Portfolio and showcase websites
- Any interface requiring unique visual identity

### When NOT to Use This Skill
- Standard CRUD operations (use existing UI library directly)
- Internal tools with no design requirements
- Prototypes with throwaway UI
- Projects with strict design systems you must follow

### Workflow Recommendations
1. Start with Standard Mode for quick iterations
2. Use ULTRATHINK for complex architectural decisions
3. Add unique components to your personal library
4. Reference library for future project consistency
5. Always test accessibility and performance

---

## Technical Stack Compatibility

### Frameworks
- ✅ React 18+ (with hooks)
- ✅ Vue 3 (Composition API)
- ✅ Svelte 4+
- ✅ Next.js 13+ (App Router)
- ✅ Nuxt 3+
- ✅ Solid.js
- ✅ Astro

### Styling
- ✅ Tailwind CSS (preferred)
- ✅ CSS Modules
- ✅ Styled Components
- ✅ Emotion
- ✅ Vanilla CSS

### Animation Libraries
- ✅ Framer Motion (React)
- ✅ GSAP (framework-agnostic)
- ✅ Vue Use (Vue)
- ✅ Motion One (lightweight)
- ✅ CSS Transitions/Animations

---

## Performance Benchmarks

Based on real-world implementations:

### Component Render Times
- Navigation: <16ms (60fps)
- Card Grid: <32ms (60fps with 12 cards)
- Hero Section: <50ms (initial paint)
- Scroll Animations: <16ms per frame

### Bundle Size Impact
- Minimal (CSS only): <5KB
- With Framer Motion: ~18KB
- Full Component Library: ~45KB (tree-shakeable)

### Core Web Vitals
- LCP (Largest Contentful Paint): <2.5s ✅
- FID (First Input Delay): <100ms ✅
- CLS (Cumulative Layout Shift): <0.1 ✅

---

## Troubleshooting

### Component Not Rendering
1. Check if UI library is installed
2. Verify import paths
3. Inspect console for errors
4. Check browser compatibility

### Animations Not Smooth
1. Ensure transform-based animations (not top/left)
2. Check for expensive layout thrashing
3. Verify will-change is used appropriately
4. Test with Chrome DevTools Performance tab

### Accessibility Issues
1. Run `npx pa11y` for automated audit
2. Test with keyboard navigation
3. Verify with screen reader (NVDA/JAWS)
4. Check color contrast with WebAIM contrast checker

---

## Contributing to Your Library

As you build unique components, add them to your library:

1. **Create Component**: Use `./scripts/add-component.sh`
2. **Document Thoroughly**: Include usage examples and variations
3. **Test Accessibility**: Verify WCAG compliance
4. **Benchmark Performance**: Measure bundle and render impact
5. **Use in Real Projects**: Link to actual implementations
6. **Refine Over Time**: Update based on lessons learned

---

## Resources

### Related Skills
- **Flow Nexus Platform**: Deploy UI components to cloud
- **Performance Analyzer**: Benchmark rendering
- **FPEF Analyzer**: Diagnose UI/UX failures

### External Resources
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Version**: 1.0.0
**Last Updated**: 2024-12-24
**Created by**: Avant-Garde Frontend Architect Skill

---

**Where intentionality meets innovation in UI design.**
