# Phase 1: One-Page Foundation

Initialize Next.js 15 one-page site with monochrome noir theme and platinum/gold accents.

## Requirements

- Next.js 15 + React 19
- TypeScript configuration
- Tailwind CSS v4 with custom noir theme
- Framer Motion for smooth animations
- Spline integration for 3D typography
- RuVector DB client setup
- Dodo Payments integration
- Environment variables configured

## Section Structure

One-page site with sections:
1. Hero - Large typography, creative Spline font
2. Tools Grid - 3D wireframe cards with hover effects
3. Features - Technical diagrams and details
4. Pricing - PPP-adjusted tiers with Dodo Payments
5. Newsletter - Email capture (wireframe form)
6. Community - Skool link
7. Footer - Links and resources

## Steps

1. Create Next.js app with TypeScript
2. Install dependencies:
   ```bash
   bun add @splinetool/react-spline framer-motion
   bun add @ruvector/core @dodopayments/express
   ```
3. Configure Tailwind with noir theme:
   - Base: pure black (#000000)
   - Platinum: #C0C0C0
   - Burnt gold: #B8860B
   - No purple gradients
4. Set up fonts: Playfair Display + Inter + JetBrains Mono
5. Create base layout with smooth scroll
6. Configure environment variables
7. Test build with all sections

## Design Tokens

```css
:root {
  /* Noir palette */
  --noir-black: #000000;
  --noir-platinum: #C0C0C0;
  --gold-base: #B8860B;
  --gold-light: #D4A017;

  /* Typography */
  --font-display: 'Playfair Display', serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

## Success Criteria

- One-page site with all sections
- Smooth scroll navigation
- Monochrome noir theme applied
- No emojis anywhere
- Spline typography working
- Mobile responsive
- Fast performance (<2s LCP)

Output <promise>PHASE1_COMPLETE</promise>
