# Phase 3: Tool Showcase & Search

Build tool showcase section with RuVector-powered search and 3D wireframe cards.

## Requirements

- Fetch tools from GitHub API
- Create vector embeddings with RuVector
- Display in responsive grid
- Implement semantic search
- 3D wireframe cards on hover
- Smooth scroll to sections

## Implementation

### Tool Grid with RuVector Search
```tsx
'use client';

import { useState } from 'react';
import { ruvector } from '@/lib/ruvector';

export function ToolShowcase() {
  const [tools, setTools] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Initial load
  useEffect(() => {
    loadTools();
  }, []);

  // Search with RuVector
  const handleSearch = async (query: string) => {
    if (!query) {
      loadTools();
      return;
    }

    const queryVector = await generateEmbedding(query);
    const results = await ruvector.search(queryVector, { limit: 20 });
    setTools(results.map(r => r.metadata));
  };

  return (
    <section id="tools" className="section-full">
      <h2 className="heading-section">THE COLLECTION</h2>

      <SearchBar onSearch={handleSearch} />

      <div className="tools-grid">
        {tools.map(tool => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}
```

### Tool Card with Wireframe
```tsx
function ToolCard({ tool }: { tool: Tool }) {
  return (
    <div className="wireframe-element tool-card" onClick={() => loadTool(tool.id)}>
      <div className="card-visual">
        {/* Wireframe icon */}
        <svg className="diagram-container" viewBox="0 0 100 100">
          <path
            d={generateWireframePath(tool.category)}
            stroke="var(--noir-platinum)"
            strokeWidth="1"
            fill="none"
          />

          {/* Exploded parts */}
          <g className="diagram-part part-core">
            <span className="tech-label">{tool.name.toUpperCase()}_V{tool.version}</span>
          </g>

          <g className="diagram-part part-features">
            <span className="tech-label">FEATURE_MATRIX</span>
          </g>

          <g className="diagram-part part-guts">
            <span className="tech-label">GUTS_EXPOSED</span>
          </g>

          {/* Silly labeled parts */}
          <g className="diagram-part part-magic">
            <span className="tech-label">WHERE_THE_MAGIC_HAPPENS</span>
          </g>

          <g className="diagram-part part-unknown">
            <span className="tech-label">ABRACADABRA_CIRCUIT</span>
          </g>
        </svg>
      </div>

      <div className="card-content">
        <h3 className="heading-card">{tool.name}</h3>
        <p className="body-small">{tool.description}</p>

        <div className="card-stats">
          <span className="label-wireframe">STARS: {tool.stars}</span>
          <span className="label-wireframe">FORKS: {tool.forks}</span>
        </div>
      </div>
    </div>
  );
}
```

## RuVector Integration

### Index Tools
```typescript
// Index tools on build
async function indexTools(tools: Tool[]) {
  const embeddings = await generateEmbeddingsBatch(
    tools.map(t => t.description)
  );

  await ruvector.insertBatch(
    tools.map((tool, i) => ({
      id: tool.id,
      vector: embeddings[i],
      metadata: {
        name: tool.name,
        description: tool.description,
        category: tool.category,
        stars: tool.stars,
        url: tool.url,
        tags: tool.tags,
      },
    }))
  );
}
```

### Semantic Search
```typescript
// Search with RuVector
async function searchTools(query: string) {
  const queryVector = await generateEmbedding(
    query + ' developer tools software'
  );

  const results = await ruvector.search(queryVector, {
    limit: 12,
    scoreThreshold: 0.6,
  });

  return results.map(r => r.metadata);
}
```

## Section Navigation

```tsx
function SectionNav() {
  const sections = ['hero', 'tools', 'pricing', 'newsletter', 'community'];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="section-nav">
      {sections.map(section => (
        <button
          key={section}
          onClick={() => scrollToSection(section)}
          className="nav-link wireframe-element"
        >
          {section.toUpperCase()}
        </button>
      ))}
    </nav>
  );
}
```

## Success Criteria

- Tools displayed in responsive grid
- RuVector search working
- 3D wireframe cards with hover effects
- Click implodes and loads tool details
- Smooth scroll between sections
- No emojis, monochrome noir theme
- Mobile responsive

Output <promise>PHASE3_COMPLETE</promise>
