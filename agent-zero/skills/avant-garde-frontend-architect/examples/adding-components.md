# Example: Adding a New Component to Your Library

## Scenario
You just created a unique "Liquid Morph Button" for a project and want to save it for future use.

## Step 1: Add Component to Library
```bash
cd ~/.claude/skills/avant-garde-frontend-architect

./scripts/add-component.sh \
  --category "components/buttons" \
  --name "liquid-morph-button" \
  --description "Button with organic liquid morphing effect on hover using SVG filters"
```

## Step 2: Edit the Component File
The script creates: `library/components/buttons/liquid-morph-button.md`

Fill in the implementation details:

```markdown
# Liquid Morph Button

## Description
Button with organic liquid morphing effect on hover using SVG displacement filters. Creates a mesmerizing, organic animation that feels alive and responsive.

## Visual Characteristics
- **Layout Pattern**: Inline block with organic boundary
- **Animation Style**: Liquid morph with SVG filter displacement
- **Distinctive Features**: Fluid movement, elastic response
- **Color Scheme**: Adaptive (any color)
- **Typography**: Button text remains stable during morph

## React Implementation
```jsx
// Add your code here
```

## ... rest of template
```

## Step 3: Use in Future Projects

Next time you need this button:

```bash
# Find it
./scripts/search-library.sh "liquid"

# Get the implementation
./scripts/get-component.sh "liquid-morph-button"
```

Then invoke the skill:

```
You: "Create a CTA button using our liquid morph component"

Avant-Garde Frontend Architect: [Retrieves and implements your saved component]
```

## Example: Real-World Usage

### Project A (E-commerce)
You create a unique "Product Card with 3D tilt effect"

Add to library:
```bash
./scripts/add-component.sh \
  --category "components/cards" \
  --name "3d-tilt-product-card" \
  --description "Product card with 3D parallax tilt on hover"
```

### Project B (Portfolio)
Six months later, you need a similar card:

```bash
./scripts/search-library.sh "tilt"
# Returns: 3d-tilt-product-card

./scripts/get-component.sh "3d-tilt-product-card"
# Shows full implementation with React/Vue code
```

Adapt the component for the portfolio without starting from scratch.

## Best Practices

### 1. Document Thoroughly
Include:
- When to use the component
- Accessibility considerations
- Performance notes
- Responsive behavior
- Variations and customization options

### 2. Include Multiple Frameworks
If you work with multiple frameworks, add implementations for:
- React
- Vue
- Svelte
- Vanilla JS

### 3. Track Real-World Usage
In the "Used In Projects" section:
```markdown
## Used In Projects
- [Elevate E-commerce](https://elevate.example.com) - Product listing cards
- [Portfolio 2024](https://portfolio.example.com) - Project showcase
```

### 4. Update and Refine
As you use components in different projects:
- Update the implementation based on lessons learned
- Add new variations discovered
- Note performance optimizations
- Record accessibility improvements

### 5. Tag Strategically
Use descriptive, searchable names:
- ✅ "glassmorphic-card-with-holographic-border"
- ✅ "asymmetric-floating-navigation"
- ❌ "card-variant-1"
- ❌ "nav-component"

## Library Growth Over Time

### Month 1
- 3 components (navigation, cards, buttons)

### Month 3
- 12 components (add forms, overlays, patterns)

### Month 6
- 30+ components (full component ecosystem)

### Month 12
- Mature personal design system used across all projects

## Advanced: Component Categories

As your library grows, organize into subcategories:

```
components/
├── navigation/
│   ├── floating/
│   ├── sidebar/
│   └── tabs/
├── cards/
│   ├── glassmorphic/
│   ├── minimal/
│   └── interactive/
└── buttons/
    ├── primary/
    ├── secondary/
    └── special-effects/
```

## Integration with Design Systems

Your personal library can:
1. Complement existing design systems (Shadcn, MUI)
2. Provide unique brand differentiators
3. Speed up prototyping and MVP development
4. Maintain consistency across personal projects

## Backup and Sync

Consider:
1. **Git tracking**: Commit your library to a private repo
2. **Cloud sync**: Use GitHub/GitLab for backup
3. **Version control**: Tag major library versions
4. **Documentation**: Keep README updated with changes

## Example: Complete Component Entry

See the pre-loaded components for complete examples:
- `library/components/navigation/floating-asymmetric-nav.md`
- `library/components/cards/holographic-glass-card.md`
- `library/patterns/hero-sections/kinetic-split-hero.md`

Each includes:
- ✅ Multiple framework implementations
- ✅ Accessibility documentation
- ✅ Performance notes
- ✅ Responsive behavior
- ✅ Variations and customization
- ✅ Testing checklist

---

**Start building your personal component library today!**

Every unique, well-documented component you create is an investment in your future productivity as a frontend architect.
