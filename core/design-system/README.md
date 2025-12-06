# @cld/design-system

> Unified design system for CLDCDE+ marketplace

## Installation

```bash
npm install @cld/design-system
# or
bun add @cld/design-system
```

## Usage

### Import CSS (Global Styles)

```css
/* In your main CSS file */
@import '@cld/design-system/css';
```

### Import Tokens (JavaScript/TypeScript)

```typescript
import { colors, typography, spacing, themes, darkTheme, lightTheme } from '@cld/design-system';

// Use design tokens
const primaryColor = colors.brand.primary; // #2563eb

// Apply theme
document.documentElement.style.setProperty('--cld-bg-primary', darkTheme.colors.bg.primary);
```

### Use CSS Classes

```html
<!-- Buttons -->
<button class="cld-btn cld-btn-primary">Primary Action</button>
<button class="cld-btn cld-btn-accent">Get Started</button>
<button class="cld-btn cld-btn-secondary">Cancel</button>

<!-- Cards -->
<div class="cld-card cld-card-interactive">
  <h3>Card Title</h3>
  <p class="cld-text-secondary">Card content</p>
</div>

<!-- Inputs -->
<input class="cld-input" placeholder="Enter text..." />

<!-- Badges -->
<span class="cld-badge cld-badge-success">Active</span>
<span class="cld-badge cld-badge-warning">Pending</span>
```

### Theme Switching

```html
<!-- Dark theme (default) -->
<html data-theme="dark">

<!-- Light theme -->
<html data-theme="light">

<!-- Or use classes -->
<body class="cld-dark">
<body class="cld-light">
```

## Design Tokens

- **Colors**: Brand, neutral, semantic, terminal, syntax
- **Typography**: Fonts, sizes, weights, line-heights
- **Spacing**: Consistent spacing scale (0-32)
- **Borders**: Widths and radius
- **Shadows**: sm, md, lg, glow effects
- **Animations**: Durations, easing, keyframes
- **Breakpoints**: sm, md, lg, xl, 2xl
- **Z-index**: Organized layer system
