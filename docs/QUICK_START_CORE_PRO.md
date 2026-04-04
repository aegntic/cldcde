# Quick Start: Implementing Core vs Pro System

Step-by-step guide to launching your Core vs Pro plugin system with Ruvector integration.

## Week 1: Database & Schema

### Day 1-2: Set up tables

```bash
# Run migration script
bun run db:migrate
```

```sql
-- Copy from CORE_VS_PRO_DESIGN.md Phase 1
-- Creates: plugin_tiers, plugin_features, user_pro_access, pro_requests
```

### Day 3-4: Update plugin.json

Add tiers to your existing plugins:

```json
{
  "name": "your-plugin",
  "tiers": {
    "core": {
      "enabled": true,
      "auto_activate": true,
      "features": ["basic_feature"]
    },
    "pro": {
      "enabled": true,
      "activation_method": "signup_review",
      "features": ["advanced_feature"]
    }
  }
}
```

### Day 5: Test schema

```bash
# Verify tables exist
bun run db:verify

# Test feature access
bun run test:feature-gate
```

---

## Week 2: API Implementation

### Day 1-2: Feature gate middleware

```typescript
// src/middleware/feature-gate.ts
export async function checkFeatureAccess(
  userId: string,
  pluginId: string,
  featureId: string
) {
  // Copy from CORE_VS_PRO_DESIGN.md
}
```

### Day 3-4: API v3 endpoints

```typescript
// src/api/plugins-v3.ts
// Copy from CORE_VS_PRO_DESIGN.md Phase 2

// Main routes:
// GET  /api/v3/plugins - List with tier info
// POST /api/v3/plugins/:id/core/activate - Activate core
// POST /api/v3/plugins/:id/pro/request - Request pro
// GET  /api/v3/plugins/:id/features/:id/check - Check access
```

### Day 5: Ruvector integration

```typescript
// src/lib/ruvector-client.ts
import { VectorDB } from 'ruvector'

export class RuvectorClient {
  private db: VectorDB

  constructor(dimensions: number = 1536) {
    this.db = new VectorDB({ dimensions })
  }

  async initialize() {
    await this.db.load('ruvector.db')
  }
}
```

---

## Week 3: Frontend Components

### Day 1-2: Plugin card with tiers

```tsx
// website/components/PluginCard.tsx
// Copy from CORE_VS_PRO_DESIGN.md

// Shows:
// - Core/Pro badges
// - Feature comparison table
// - Activate/Request buttons
```

### Day 3-4: Comparison tables

```tsx
// website/components/FeatureComparison.tsx
export function FeatureComparison({ plugin }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Feature</th>
          <th>Core (Free)</th>
          <th>Pro (Sign Up)</th>
        </tr>
      </thead>
      <tbody>
        {plugin.features.map(feature => (
          <tr key={feature.id}>
            <td>{feature.name}</td>
            <td>{feature.tier === 'core' ? '✅' : '❌'}</td>
            <td>{feature.tier === 'pro' ? '✅' : '❌'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

### Day 5: Pro request modal

```tsx
// website/components/ProRequestModal.tsx
export function ProRequestModal({ plugin, onClose }) {
  return (
    <Modal onClose={onClose}>
      <h2>Request Pro Access</h2>
      <p>{plugin.name} Pro features:</p>
      <ul>
        {plugin.proFeatures.map(f => <li>{f.name}</li>)}
      </ul>

      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="How will you use Pro features?"
          required
        />
        <button type="submit">Submit Request</button>
      </form>

      <p className="note">
        Usually approved within 24-48 hours
      </p>
    </Modal>
  )
}
```

---

## Week 4: Launch with Pilot Plugins

### Day 1-2: Update 3 pilot plugins

**1. Smart Connections (Notes Plugin)**

```typescript
// plugins/smart-connections/src/index.ts
import { RuvectorClient } from '@cldcde/ruvector-client'
import { checkFeature } from '@cldcde/plugin-runtime'

export class SmartConnections {
  // Core: Basic search (always available)
  async search(query: string) {
    const embedding = await this.embed(query)
    return await this.vectorDB.search({
      vector: embedding,
      k: 10 // Core limit
    })
  }

  // Pro: Graph-augmented search
  async searchPro(query: string) {
    if (!(await checkFeature('graph_search'))) {
      throw new Error('Graph search requires Pro')
    }

    const embedding = await this.embed(query)
    const graphContext = await this.getGraphNeighborhood(embedding)

    return await this.gnnSearch(embedding, graphContext)
  }
}
```

**2. Extension Marketplace**

```typescript
// plugins/extension-marketplace/src/index.ts
export class ExtensionSearch {
  // Core: Basic search
  async search(query: string) {
    return await this.vectorDB.search({
      vector: await this.embed(query),
      k: 20
    })
  }

  // Pro: Personalized recommendations
  async getRecommendations(userId: string) {
    if (!(await checkFeature('personalized_recommendations'))) {
      throw new Error('Recommendations require Pro')
    }

    // Use GNN for better recommendations
    return await this.gnnRecommend(userId)
  }
}
```

**3. RAG Engine**

```typescript
// plugins/rag-engine/src/index.ts
export class RAGEngine {
  // Core: Simple retrieval
  async retrieve(query: string) {
    const embedding = await this.embed(query)
    return await this.vectorDB.search({
      vector: embedding,
      k: 10
    })
  }

  // Pro: Multi-layered retrieval with graph
  async retrievePro(query: string, layers: string[]) {
    if (!(await checkFeature('advanced_retrieval'))) {
      throw new Error('Advanced retrieval requires Pro')
    }

    // Combine vector + graph + temporal layers
    return await this.multiLayerRetrieve(query, layers)
  }
}
```

### Day 3-4: Test pilot plugins

```bash
# Test core features
bun run test:pilot-core

# Test pro features
bun run test:pilot-pro

# Performance tests
bun run benchmark:ruvector
```

### Day 5: Documentation

```bash
# Create docs
bun run docs:generate

# Publish to website
bun run deploy:docs
```

---

## Implementation Checklist

### Database
- [ ] Run migrations
- [ ] Verify tables created
- [ ] Test feature access queries
- [ ] Seed with sample data

### Backend API
- [ ] Feature gate middleware
- [ ] API v3 endpoints
- [ ] Ruvector client
- [ ] Pro request handling
- [ ] Admin approval panel

### Frontend
- [ ] Plugin card with tiers
- [ ] Feature comparison tables
- [ ] Pro request modal
- [ ] Upgrade prompts
- [ ] Success notifications

### Plugins
- [ ] Update plugin.json with tiers
- [ ] Implement core features
- [ ] Implement pro features
- [ ] Add feature checks
- [ ] Test both tiers

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance benchmarks
- [ ] User acceptance testing

### Documentation
- [ ] API docs
- [ ] Plugin author guide
- [ ] User guide
- [ ] FAQ
- [ ] Migration guide

---

## Common Tasks

### Add Core Feature

```typescript
// 1. Update plugin.json
{
  "features": [
    {
      "id": "new_core_feature",
      "name": "New Core Feature",
      "tier": "core"
    }
  ]
}

// 2. Implement (no check needed)
async function newCoreFeature() {
  // Always available
}
```

### Add Pro Feature

```typescript
// 1. Update plugin.json
{
  "features": [
    {
      "id": "new_pro_feature",
      "name": "New Pro Feature",
      "tier": "pro"
    }
  ]
}

// 2. Implement with check
async function newProFeature() {
  if (!(await checkFeature('new_pro_feature'))) {
    showUpgradePrompt('new_pro_feature')
    return
  }

  // Pro feature logic
}
```

### Migrate Existing Plugin

```typescript
// Before: All features available
class MyPlugin {
  async doWork() {
    return await this.advancedWork()
  }
}

// After: Split into tiers
class MyPlugin {
  // Core: Basic work
  async doWork() {
    return await this.basicWork()
  }

  // Pro: Advanced work
  async doWorkPro() {
    if (!(await checkFeature('advanced_work'))) {
      return await this.basicWork()
    }

    return await this.advancedWork()
  }
}
```

---

## Testing Commands

```bash
# Test all core features
bun run test:core

# Test pro features
bun run test:pro

# Test ruvector performance
bun run benchmark:ruvector

# Test feature gate
bun run test:feature-gate

# Integration tests
bun run test:integration

# E2E tests
bun run test:e2e
```

---

## Troubleshooting

### Pro feature not working

```typescript
// Check if feature is defined
const features = plugin.features.find(f => f.id === 'my_feature')
if (!features) {
  console.error('Feature not defined in plugin.json')
}

// Check if user has access
const access = await checkFeatureAccess(userId, pluginId, featureId)
console.log('Access:', access)
```

### Ruvector slow

```typescript
// Check DB size
const stats = await db.getStats()
console.log('Vector count:', stats.count)

// If > 10K, suggest Pro upgrade
if (stats.count > 10000 && !(await checkFeature('unlimited_vectors'))) {
  showUpgradePrompt('unlimited_vectors')
}
```

### Feature check always returns false

```typescript
// Verify user is logged in
const user = getAuthUser()
if (!user) {
  console.error('User not authenticated')
}

// Check if feature is assigned to user
const assignments = await getUserFeatures(user.id)
console.log('Assigned features:', assignments)
```

---

## Success Metrics

Track these metrics weekly:

```typescript
// Core adoption
const coreInstalls = await countCoreInstalls()
const coreActive = await countActiveCoreUsers()

// Pro requests
const proRequests = await countProRequests()
const proApproved = await countApprovedRequests()
const proActive = await countActiveProUsers()

// Engagement
const featureUsage = await getFeatureUsage()
const userRetention = await getRetentionRate()

// Performance
const searchLatency = await getSearchLatency()
const insertRate = await getInsertRate()
```

---

## Next Steps After Launch

1. **Week 5**: Gather feedback from pilot users
2. **Week 6**: Iterate on features based on usage
3. **Week 7**: Add more plugins to the system
4. **Week 8**: Launch to all plugin authors
5. **Week 9+**: Continue improving and adding features

---

## Resources

- **Design Doc**: `/docs/CORE_VS_PRO_DESIGN.md`
- **Ruvector Integration**: `/docs/RUVECTOR_CORE_PRO_INTEGRATION.md`
- **Plugin Author Guide**: `/docs/PLUGIN_AUTHOR_GUIDE.md`
- **Example Plugin**: `/examples/smart-connections/`
- **API Reference**: `/docs/api-reference.md`

---

## Support

Need help? Join the community:
- Discord: https://discord.gg/cldcde
- GitHub Issues: https://github.com/cldcde/platform/issues
- Email: support@cldcde.cc
