# Avant-Garde Frontend Architect - Quick Reference

## What is this?

A Claude Code skill for **bespoke frontend design and UI architecture** with two modes:
1. **Standard Mode**: Direct implementation with concise responses
2. **ULTRATHINK Mode**: Exhaustive multi-dimensional analysis

## Key Features

✅ **Personal Component Library** - Save and reuse unique components across projects
✅ **Auto-Detects UI Libraries** - Uses Shadcn, Radix, MUI when available
✅ **Accessibility-First** - WCAG AAA compliance by default
✅ **Performance Optimized** - Core Web Vitals focus
✅ **Multiple Frameworks** - React, Vue, Svelte support

## Quick Commands

### Within Claude Code
```
# Standard usage
"Create a navigation bar with glassmorphism"

# ULTRATHINK mode
"ULTRATHINK: Design a dashboard component system"

# Use library component
"Implement the floating asymmetric navigation component"
```

### Library Management (Terminal)
```bash
cd ~/.claude/skills/avant-garde-frontend-architect

# Add new component
./scripts/add-component.sh --category "components/cards" --name "my-card"

# List all components
./scripts/list-components.sh --all

# Search library
./scripts/search-library.sh "glass"

# Get component details
./scripts/get-component.sh "floating-asymmetric-nav"
```

## Pre-Loaded Components

### Navigation
- **Floating Asymmetric Nav** - Modern pill-shaped nav with glassmorphism

### Cards
- **Holographic Glass Card** - Animated gradient borders with glass effect

### Layouts
- **Kinetic Split Hero** - 40/60 split with scroll-triggered animations

## Design Philosophy

### Intentional Minimalism
- Every element earns its place
- Delete anything without purpose
- Reduction = sophistication

### Anti-Generic
- No template-looking designs
- Embrace asymmetry
- Unique typography

### Library Discipline
- ALWAYS use existing UI libraries
- Wrap for custom styling
- Never reinvent unnecessarily

## ULTRATHINK Analysis

When triggered, analyzes through:
- **Psychological**: Cognitive load, decision fatigue
- **Technical**: Rendering performance, state complexity
- **Accessibility**: WCAG AAA compliance
- **Scalability**: Maintainability, reusability

## File Structure

```
~/.claude/skills/avant-garde-frontend-architect/
├── SKILL.md              # Main skill documentation
├── README.md             # Quick reference
├── scripts/              # Library management scripts
│   ├── add-component.sh
│   ├── list-components.sh
│   ├── search-library.sh
│   └── get-component.sh
├── library/              # Your component library
│   ├── components/
│   ├── patterns/
│   ├── layouts/
│   └── animations/
└── examples/             # Usage examples
```

## Performance Targets

- LCP < 2.5s ✅
- FID < 100ms ✅
- CLS < 0.1 ✅
- 60fps animations ✅

## Compatible Tech Stack

**Frameworks**: React, Vue, Svelte, Next.js, Nuxt, Solid, Astro
**Styling**: Tailwind CSS, CSS Modules, Styled Components
**Animation**: Framer Motion, GSAP, Motion One

## When to Use

✅ Custom UI components
✅ Landing pages & marketing sites
✅ Dashboard interfaces
✅ Portfolio websites
✅ Unique visual identity needed

❌ Standard CRUD operations
❌ Internal tools with no design needs
❌ Quick prototypes
❌ Strict design systems you must follow

## Getting Started

1. **Use the skill** in Claude Code for frontend tasks
2. **Add unique components** to your library as you create them
3. **Reference your library** for consistency across projects
4. **Grow your library** into a personal design system

## Example Workflow

```bash
# 1. Create unique component in a project
# (design and implement "liquid morph button")

# 2. Add to library
./scripts/add-component.sh \
  --category "components/buttons" \
  --name "liquid-morph-button" \
  --description "Button with organic liquid morphing effect"

# 3. Edit the file with full implementation
# ~/.claude/skills/avant-garde-frontend-architect/library/components/buttons/liquid-morph-button.md

# 4. Use in future projects
# "Create a CTA using our liquid morph button component"

# 5. Skill retrieves and implements your saved component
```

## Learning Resources

- `SKILL.md` - Complete skill documentation
- `README.md` - Comprehensive reference
- `examples/adding-components.md` - How to grow your library
- Pre-loaded components in `library/` - Implementation examples

## Version

**1.0.0** | Created 2024-12-24

---

**Where intentionality meets innovation in UI design.**
