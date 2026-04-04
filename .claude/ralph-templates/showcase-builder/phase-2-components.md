# Phase 2: Wireframe Components

Create wireframe components with hover-to-explode 3D diagrams and click-to-implode animations.

## Requirements

All visual elements must be:
- Detailed wireframe (flat or 3D)
- Transparent backgrounds
- Subtle floating shadows
- Monochrome noir with platinum/gold accents

## Interactions

### Hover Effect
- Scale to 1.5x
- Transform to 3D isometric exploded view
- Show technical labels on parts
- Silly but clever labeled nonsense parts
- Smooth 0.6s cubic-bezier transition

### Click Effect
- Instant implode animation (0.3s)
- Scale to 0
- Opacity to 0
- Load next section/card/page

## Components to Build

### Tool Cards
```tsx
function ToolCard({ tool }) {
  return (
    <div className="wireframe-element tool-card">
      {/* Wireframe icon */}
      <svg className="diagram-container">
        {/* Base wireframe */}
        <path d={tool.wireframePath} stroke="var(--noir-platinum)" />

        {/* Exploded parts on hover */}
        <div className="diagram-part part-1">
          <span className="tech-label">CORE_V2.0</span>
        </div>
        <div className="diagram-part part-2">
          <span className="tech-label">DATA_BUS</span>
        </div>
        <div className="diagram-part part-3">
          <span className="tech-label">QUANTUM_FLUX</span>
        </div>
        <div className="diagram-part part-4">
          <span className="tech-label">MAGIC_SMOKE</span>
        </div>
        <div className="diagram-part part-5">
          <span className="tech-label">PIXIE_DUST_GENERATOR</span>
        </div>
      </svg>

      <h3 className="heading-card">{tool.name}</h3>
      <p className="body-base">{tool.description}</p>
    </div>
  );
}
```

### Email Capture Form
```tsx
function EmailCapture() {
  return (
    <form className="email-capture wireframe-element">
      <label className="label-wireframe">EMAIL_ADDRESS</label>
      <input type="email" className="input-noir" />
      <button className="button-noir">
        SUBSCRIBE
        <div className="button-border-gold" />
      </button>
    </form>
  );
}
```

### Skool Community Link
```tsx
function SkoolLink() {
  return (
    <a href="https://community.skool.com" className="skool-link wireframe-element">
      <svg className="diagram-container">
        <circle cx="50" cy="50" r="40" stroke="var(--noir-platinum)" />
        <text className="tech-label">NEURAL_NET_V9</text>
      </svg>
      <span>Join Community</span>
    </a>
  );
}
```

## CSS Animations

```css
/* Floating animation */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.wireframe-element {
  animation: float 4s ease-in-out infinite;
}

/* Hover - Explode */
.wireframe-element:hover .diagram-container {
  transform: rotateX(60deg) rotateZ(-45deg) scale(1.2);
  transform-style: preserve-3d;
}

.wireframe-element:hover .diagram-part {
  position: absolute;
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Click - Implode */
.wireframe-element:active {
  animation: implode 0.3s ease-in forwards;
}

@keyframes implode {
  to {
    transform: scale(0);
    opacity: 0;
  }
}
```

## Success Criteria

- All components use wireframe aesthetic
- Hover triggers 3D exploded diagrams
- Click triggers implode animation
- Technical labels visible on hover
- Smooth transitions throughout
- No emojis, pure monochrome noir
- Platinum and gold accents only

Output <promise>PHASE2_COMPLETE</promise>
