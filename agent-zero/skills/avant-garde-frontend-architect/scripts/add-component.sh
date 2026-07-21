#!/bin/bash
# Add a new component to your personal library

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIBRARY_DIR="$(dirname "$SCRIPT_DIR")/library"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --category)
      CATEGORY="$2"
      shift 2
      ;;
    --name)
      NAME="$2"
      shift 2
      ;;
    --description)
      DESCRIPTION="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [ -z "$CATEGORY" ] || [ -z "$NAME" ]; then
  echo "Usage: $0 --category <category> --name <name> [--description <description>]"
  echo ""
  echo "Categories:"
  echo "  components/navigation, components/cards, components/buttons"
  echo "  components/forms, components/overlays, components/typography"
  echo "  patterns/grid-systems, patterns/hero-sections, patterns/content-flow"
  echo "  patterns/data-display, layouts/landing, layouts/dashboard"
  echo "  layouts/editorial, layouts/app-shell"
  echo "  animations/entrances, animations/interactions, animations/scroll-effects"
  echo "  animations/loaders"
  exit 1
fi

# Create directory if it doesn't exist
CATEGORY_DIR="$LIBRARY_DIR/$CATEGORY"
mkdir -p "$CATEGORY_DIR"

# Slugify the name
SLUG=$(echo "$NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr '/' '-')

# Create component file
FILE="$CATEGORY_DIR/$SLUG.md"

if [ -f "$FILE" ]; then
  echo "Component already exists: $FILE"
  exit 1
fi

cat > "$FILE" << EOF
# ${NAME}

## Description
${DESCRIPTION:-No description provided.}

## Visual Characteristics
- **Layout Pattern**: [asymmetric/split/centered/etc]
- **Animation Style**: [smooth/kinetic/elastic/etc]
- **Distinctive Features**: [what makes this unique]
- **Color Scheme**: [dark/light/adaptive]
- **Typography**: [font choices if specific]

## When to Use
- [Use case 1]
- [Use case 2]
- [Use case 3]

## Language-Agnostic Implementation
\`\`\`
[Paste framework-agnostic pseudocode or logic here]
\`\`\`

## React Implementation
\`\`\`jsx
import React from 'react'

function ${NAME// /-}({ /* props */ }) {
  return (
    <div>
      {/* Your React code here */}
    </div>
  )
}

export default ${NAME// /-}
\`\`\`

## Vue 3 Implementation
\`\`\`vue
<template>
  <div>
    <!-- Your Vue template here -->
  </div>
</template>

<script setup>
// Your Vue script here
</script>

<style scoped>
/* Your Vue styles here */
</style>
\`\`\`

## Tailwind Classes
\`\`\`
[List key utility classes used, e.g., bg-black/80 backdrop-blur-xl]
\`\`\`

## Custom CSS (if any)
\`\`\`css
/* Any custom CSS beyond Tailwind */
\`\`\`

## Dependencies
- **UI Library**: [Shadcn UI/Radix UI/MUI/Chakra/None]
- **Animation Library**: [Framer Motion/GSAP/React Spring/None]
- **Icon Library**: [Lucide/Heroicons/Phosphor/None]
- **Other**: [Any other dependencies]

## Accessibility Notes
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard navigation supported
- [ ] Screen reader tested
- [ ] Color contrast 4.5:1 minimum
- [ ] Focus indicators visible
- [ ] ARIA labels included

**ARIA Implementation**:
\`\`\`jsx
// Example ARIA attributes
<div role="region" aria-label="${NAME}" aria-describedby="description">
  <p id="description">...</p>
</div>
\`\`\`

## Performance Notes
- **Bundle Size Impact**: [estimated KB added]
- **Rendering Cost**: [low/medium/high]
- **Optimization Techniques**:
  - [ ] Memoization (React.memo, useMemo)
  - [ ] Code splitting
  - [ ] Lazy loading
  - [ ] Virtual scrolling (for lists)
  - [ ] Image optimization

## Responsive Behavior
- **Mobile**: [behavior on screens < 640px]
- **Tablet**: [behavior on screens 640px - 1024px]
- **Desktop**: [behavior on screens > 1024px]

## Variations
1. **Variation Name**: [brief description]
2. **Variation Name**: [brief description]

## Testing
- [ ] Unit tests written
- [ ] Integration tests passed
- [ ] Visual regression tests
- [ ] Accessibility audit passed
- [ ] Performance benchmarks met

## Used In Projects
- [Project Name](URL) - [Brief context of usage]
- [Project Name](URL) - [Brief context of usage]

## Created
$(date +%Y-%m-%d)

## Last Updated
$(date +%Y-%m-%d)
EOF

echo "✅ Component template created: $FILE"
echo ""
echo "Next steps:"
echo "1. Edit the file to add your implementation"
echo "2. Fill in the description and usage examples"
echo "3. Add code examples for different frameworks"
echo "4. Test accessibility and performance"
echo "5. Mark as used in real projects"
