# Example: Smart Connections - CLDCDE Edition

Complete example showing Core vs Pro feature split.

## Feature Matrix

| Feature | Core (Free) | Pro (Sign Up) | Notes |
|---------|-------------|---------------|-------|
| **Zero-Setup Embeddings** | ✅ | ✅ | Works out of the box |
| **Real-Time Connections** | ✅ | ✅ | Automatic as you type |
| **Semantic Search** | ✅ | ✅ | Basic search in lookup view |
| **Mobile Compatible** | ✅ | ✅ | Full mobile support |
| **Walk Random Connections** | ✅ | ✅ | Discovery feature |
| **Graph Visualization** | ❌ | ✅ | Interactive network graph |
| **Inline Connections** | ❌ | ✅ | See connections in context |
| **Footer Connections View** | ❌ | ✅ | Perfect for mobile |
| **Bases Connection Functions** | ❌ | ✅ | Score and list operations |
| **Algorithm Control** | ❌ | ✅ | Tweak connection parameters |

## Usage Examples

### Core Features (Everyone Gets)

```typescript
// Zero-Setup: Just start using it
import { SmartConnections } from '@cldcde/smart-connections'

const connections = new SmartConnections()

// Automatically indexes your notes
await connections.initialize() // Works immediately!

// Semantic search
const results = await connections.search("AI research papers")
// Returns related notes automatically
```

### Pro Features (Sign Up Required)

```typescript
// After Pro activation
import { SmartConnectionsPro } from '@cldcde/smart-connections/pro'

const pro = new SmartConnectionsPro()

// Graph visualization
await pro.showGraph({
  layout: 'force-directed',
  filter: 'strong-connections-only',
  animate: true
})

// Inline connections
await pro.showInlineConnections({
  position: 'after-paragraphs',
  threshold: 0.8
})

// Custom algorithms
await pro.setConnectionAlgorithm({
  model: 'advanced-semantic',
  weight: {
    recency: 0.3,
    similarity: 0.5,
    manual_links: 0.2
  }
})
```

## Implementation Guide

### Check Feature Access

```typescript
import { checkFeature } from '@cldcde/plugin-runtime'

// Core feature - always available
if (await checkFeature('semantic_search')) {
  const results = await search(query)
}

// Pro feature - requires activation
if (await checkFeature('graph_visualization')) {
  await showGraph()
} else {
  // Show upgrade prompt
  showUpgradePrompt('graph_visualization')
}
```

### Feature Upgrade Flow

```typescript
// User tries to use Pro feature
try {
  await showGraph()
} catch (error) {
  if (error.code === 'FEATURE_NOT_AVAILABLE') {
    // Show friendly upgrade UI
    showDialog({
      title: 'Upgrade to Pro',
      message: 'Graph visualization is a Pro feature',
      features: [
        'Graph Visualization',
        'Inline Connections',
        'Algorithm Control'
      ],
      actions: [
        {
          text: 'Request Pro Access',
          action: () => requestProAccess()
        },
        {
          text: 'Learn More',
          action: () => openDocs('/pro-features')
        }
      ]
    })
  }
}
```

## Sample UI Comparison

### Core Version UI

```
┌─────────────────────────────────────┐
│ Smart Connections (Core)            │
├─────────────────────────────────────┤
│ Search: [_____________] 🔍          │
├─────────────────────────────────────┤
│ Related Notes:                      │
│ • AI Research Paper #3 (0.92)       │
│ • Machine Learning Basics (0.87)    │
│ • Neural Network Architecture (0.81)│
├─────────────────────────────────────┤
│ ⭐ Upgrade to Pro for more features │
└─────────────────────────────────────┘
```

### Pro Version UI

```
┌─────────────────────────────────────┐
│ Smart Connections Pro ⭐            │
├─────────────────────────────────────┤
│ [Search] [Graph] [Inline] [Settings]│
├─────────────────────────────────────┤
│ Graph Visualization:                │
│ ┌───┐     ┌───┐     ┌───┐          │
│ │ A1├─────┤ B2├─────┤ C3│          │
│ └───┘     └───┘     └───┘          │
│            │                         │
│         ┌───┐                        │
│         │ D4│                        │
│         └───┘                        │
├─────────────────────────────────────┤
│ Inline Connections Active ✓         │
│ Footer View Active ✓                │
│ Custom Algorithm: Advanced          │
└─────────────────────────────────────┘
```

## Migration from Standalone

If you have the standalone Smart Connections plugin:

1. **Install Core version** (automatic)
2. **Existing data transfers** seamlessly
3. **Request Pro** for advanced features
4. **Keep using** your current workflows

```bash
# Install CLDCDE version
npm install @cldcde/smart-connections

# Core features work immediately
npx smart-connections --init

# Request Pro access
npx smart-connections --request-pro
```

## Pro Activation Process

1. **Use Core for 7+ days** (builds trust)
2. **Submit Pro request** with use case
3. **Automatic approval** if criteria met
4. **Manual review** within 24-48h otherwise
5. **Instant activation** once approved

### Example Request

```typescript
await requestProAccess({
  plugin: 'smart-connections',
  use_case: 'PhD research on knowledge graph visualization',
  expected_impact: 'Will contribute back graph layout algorithms',
  requested_features: ['graph_visualization', 'algorithm_control']
})
```

## Comparison with Original

| Aspect | Smart Connections (Original) | CLDCDE Edition |
|--------|------------------------------|----------------|
| **Core Features** | Paid ($29 one-time) | Free forever |
| **Pro Features** | Separate license | Sign up only |
| **Source Code** | Closed source | Fully open |
| **Activation** | Manual license key | Automatic (review-based) |
| **Community** | Discord only | Full platform |
| **Extensions** | Not supported | Plugin ecosystem |

## Why CLDCDE Edition is Better

1. **Free Core**: Everyone gets essential features
2. **No Payments**: Pro access through community trust
3. **Open Source**: Transparent and community-driven
4. **Platform Integration**: Works with all CLDCDE tools
5. **Better Discovery**: Find related plugins easily
6. **Community Support**: Help from other users
7. **Continuous Updates**: Regular improvements

## Getting Started

```bash
# Install the plugin
npm install @cldcde/smart-connections

# Use core features immediately
npx smart-connections

# Request Pro when you need advanced features
npx smart-connections --pro-request
```

**Documentation**: https://cldcde.cc/docs/smart-connections
**Community**: https://discord.gg/cldcde
**Issues**: https://github.com/cldcde/smart-connections/issues
