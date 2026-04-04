# Core vs Pro Plugin System Design

Inspired by [Smart Connections](https://smartconnections.app/pro-plugins/) but designed for CLDCDE's platform-first approach.

## Design Philosophy

### Core Plugins
- **Free & Open Source**: All core plugins are fully open-source
- **Zero Setup**: They "just work" out of the box
- **Essential Features**: Include the 80% of features that most users need
- **No Authentication**: Work immediately without signup

### Pro Plugins
- **Enhanced Features**: Advanced capabilities for power users
- **Simple Activation**: Sign up + review = full access (no payments initially)
- **Progressive Enhancement**: Build on core features, don't replace them
- **Community Trust**: Review system ensures quality

## Key Improvements Over Smart Connections

1. **No Payment Gate**: Pro features activate with just sign-up (monetization later)
2. **Unified Plugin System**: Single codebase with feature flags
3. **Auto-Provisioning**: Get Pro access instantly after review
4. **Better Discovery**: Clear feature comparison in UI
5. **Community-Driven**: Review system for Pro feature requests

---

## Plugin Schema v2.0

### Enhanced plugin.json Structure

```json
{
  "id": "smart-connections",
  "name": "Smart Connections",
  "version": "2.0.0",
  "type": "extension",

  // Tier system
  "tiers": {
    "core": {
      "enabled": true,
      "auto_activate": true,
      "features": [
        "zero_setup_embeddings",
        "real_time_connections",
        "semantic_search",
        "mobile_compatible"
      ]
    },
    "pro": {
      "enabled": true,
      "activation": "signup_review",
      "features": [
        "graph_visualization",
        "inline_connections",
        "footer_view",
        "algorithm_control"
      ],
      "review_required": true,
      "review_criteria": ["active_user", "quality_contributor"]
    }
  },

  // Feature matrix
  "features": [
    {
      "id": "zero_setup_embeddings",
      "name": "Zero-Setup Embeddings",
      "tier": "core",
      "description": "Local embeddings work automatically",
      "icon": "⚡"
    },
    {
      "id": "graph_visualization",
      "name": "Graph Visualization",
      "tier": "pro",
      "description": "Visualize connections in interactive graph",
      "icon": "🕸️",
      "requires": ["zero_setup_embeddings"]
    }
  ],

  // Access control
  "access": {
    "authentication": "optional_for_core",
    "pro_activation": "signup_review",
    "grace_period_days": 30,
    "rate_limits": {
      "core": "1000/hour",
      "pro": "10000/hour"
    }
  }
}
```

---

## API Design

### 1. Plugin Discovery with Tier Awareness

```typescript
GET /api/plugins
Response: {
  plugins: [
    {
      id: "smart-connections",
      name: "Smart Connections",
      tiers: {
        core: { enabled: true, installed: true },
        pro: { enabled: false, available: true }
      },
      features: {
        core: ["zero_setup_embeddings", "semantic_search"],
        pro: ["graph_visualization", "algorithm_control"]
      },
      comparison_table: {
        "Zero-Setup Embeddings": { core: true, pro: true },
        "Graph Visualization": { core: false, pro: true }
      }
    }
  ]
}
```

### 2. Pro Activation Flow

```typescript
// Step 1: Check eligibility
POST /api/plugins/{id}/pro/check-eligibility
{
  user_id: "auth_123",
  requested_features: ["graph_visualization", "algorithm_control"]
}
Response: {
  eligible: true,
  review_required: true,
  review_criteria: ["active_user"],
  estimated_activation_time: "24-48 hours"
}

// Step 2: Submit request
POST /api/plugins/{id}/pro/request
{
  user_id: "auth_123",
  use_case: "Research project requiring advanced graph analysis",
  expected_impact: "Will share back improvements"
}
Response: {
  request_id: "req_456",
  status: "pending_review",
  estimated_time: "24-48 hours"
}

// Step 3: Review approval (admin)
POST /api/admin/pro-requests/{id}/approve
{
  reviewer_notes: "Active community member, approve",
  granted_features: ["all"],
  expires_at: "2025-12-31"
}
Response: {
  activated: true,
  features_granted: ["graph_visualization", "algorithm_control"],
  message: "Pro features now available!"
}
```

### 3. Feature Gate Middleware

```typescript
// src/middleware/feature-gate.ts
export async function checkFeatureAccess(
  userId: string,
  pluginId: string,
  featureId: string
): Promise<{ allowed: boolean; tier: 'core' | 'pro' }> {

  const plugin = await getPlugin(pluginId)
  const feature = plugin.features.find(f => f.id === featureId)

  // Core features available to everyone
  if (feature.tier === 'core') {
    return { allowed: true, tier: 'core' }
  }

  // Pro features require activation
  const proAccess = await checkProAccess(userId, pluginId)
  return {
    allowed: proAccess.enabled,
    tier: 'pro'
  }
}
```

---

## Feature Comparison Tables

### Template for Plugin Pages

```
┌─────────────────────────────────────────────────────┐
│ Smart Connections                                  │
├─────────────────────────────────────────────────────┤
│ ✓ Core (Free & Open)    │ ⭐ Pro (Sign Up Required) │
├─────────────────────────────────────────────────────┤
│ Zero-Setup Embeddings   │ Graph Visualization       │
│ Real-Time Connections   │ Granular Inline View      │
│ Semantic Search         │ Footer Connections        │
│ Mobile Compatible       │ Algorithm Control         │
├─────────────────────────────────────────────────────┤
│           [Get Core]              [Request Pro]     │
└─────────────────────────────────────────────────────┘
```

### Example: Smart Connections CLDCDE Edition

| Feature | Core (Free) | Pro (Sign Up) |
|---------|-------------|---------------|
| **Essential (Both)** |
| Zero-Setup Embeddings | ✅ | ✅ |
| Real-Time Connections | ✅ | ✅ |
| Semantic Search | ✅ | ✅ |
| Mobile Compatible | ✅ | ✅ |
| **Pro-Only Enhancements** |
| Graph Visualization | ❌ | ✅ |
| Inline Connections | ❌ | ✅ |
| Footer View | ❌ | ✅ |
| Algorithm Control | ❌ | ✅ |
| **Differences** |
| Cost | Free | Sign Up Only |
| Activation | Automatic | Review (24-48h) |
| Rate Limit | 1K/hour | 10K/hour |
| Support | Community | Priority |

---

## Implementation Plan

### Phase 1: Database Schema

```sql
-- Plugin tiers
CREATE TABLE plugin_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plugin_id UUID REFERENCES plugins(id) ON DELETE CASCADE,
  tier_type VARCHAR(10) CHECK (tier_type IN ('core', 'pro')),
  enabled BOOLEAN DEFAULT true,
  activation_method VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature definitions
CREATE TABLE plugin_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plugin_id UUID REFERENCES plugins(id) ON DELETE CASCADE,
  feature_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  tier VARCHAR(10) CHECK (tier IN ('core', 'pro')),
  description TEXT,
  icon VARCHAR(50),
  dependencies TEXT[], -- Array of feature IDs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User pro access
CREATE TABLE user_pro_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id UUID REFERENCES plugins(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  features TEXT[], -- Array of feature IDs
  status VARCHAR(20) CHECK (status IN ('pending', 'active', 'expired', 'revoked')),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB,
  UNIQUE(user_id, plugin_id)
);

-- Pro access requests
CREATE TABLE pro_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id UUID REFERENCES plugins(id) ON DELETE CASCADE,
  requested_features TEXT[],
  use_case TEXT,
  expected_impact TEXT,
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'denied')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Phase 2: API Endpoints

```typescript
// src/api/plugins-v3.ts - New version with tier support
const pluginRoutes = new Hono<{ Bindings: Env }>()

// List plugins with tier awareness
pluginRoutes.get('/', async (c) => {
  const userId = c.get('user')?.id
  const { tier } = c.req.query()

  // Get all plugins with their tier configurations
  const plugins = await getPluginsWithTiers()

  // For each plugin, check user's access
  const enriched = await Promise.all(
    plugins.map(async (plugin) => ({
      ...plugin,
      userAccess: userId ? await getUserAccess(userId, plugin.id) : null,
      comparisonTable: buildComparisonTable(plugin)
    }))
  )

  return c.json({ plugins: enriched })
})

// Activate core features (automatic)
pluginRoutes.post('/:id/core/activate', async (c) => {
  const userId = c.get('user')?.id
  const { id } = c.req.param()

  // Core features activate automatically for logged-in users
  await activateCoreFeatures(userId, id)

  return c.json({ activated: true, tier: 'core' })
})

// Request pro access
pluginRoutes.post('/:id/pro/request', async (c) => {
  const userId = c.get('user').id
  const { id } = c.req.param()
  const body = await c.req.json()

  // Create pro request
  const request = await createProRequest({
    user_id: userId,
    plugin_id: id,
    use_case: body.use_case,
    expected_impact: body.expected_impact
  })

  return c.json({
    request_id: request.id,
    status: 'pending_review',
    estimated_time: '24-48 hours'
  })
})

// Check feature access (internal)
pluginRoutes.get('/:id/features/:featureId/check', async (c) => {
  const userId = c.get('user')?.id
  const { id, featureId } = c.req.param()

  const access = await checkFeatureAccess(userId, id, featureId)

  return c.json(access)
})
```

### Phase 3: Middleware & Auth

```typescript
// src/middleware/pro-feature-gate.ts
export function proFeatureGate(pluginId: string, featureId: string) {
  return async (c: Context, next: Next) => {
    const userId = c.get('user')?.id

    if (!userId) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const access = await checkFeatureAccess(userId, pluginId, featureId)

    if (!access.allowed) {
      return c.json({
        error: 'Pro feature required',
        tier: 'pro',
        activation_url: `/api/plugins/${pluginId}/pro/request`
      }, 403)
    }

    // Add access info to context
    c.set('featureAccess', access)
    await next()
  }
}
```

### Phase 4: Admin Panel

```typescript
// src/api/admin/pro-approvals.ts
const adminRoutes = new Hono<{ Bindings: Env }>()

// List pending requests
adminRoutes.get('/pro-requests', async (c) => {
  const { status = 'pending' } = c.req.query()

  const requests = await getProRequests({ status })

  return c.json({ requests })
})

// Approve request
adminRoutes.post('/pro-requests/:id/approve', async (c) => {
  const { id } = c.req.param()
  const { features, expires_at, notes } = await c.req.json()

  // Grant pro access
  await grantProAccess({
    request_id: id,
    features,
    expires_at,
    reviewer_notes: notes
  })

  return c.json({ approved: true })
})
```

---

## Frontend Components

### Plugin Card with Tier UI

```tsx
// website/components/PluginCard.tsx
interface PluginCardProps {
  plugin: PluginWithTiers
  userAccess?: UserAccess
}

export function PluginCard({ plugin, userAccess }: PluginCardProps) {
  return (
    <div className="plugin-card">
      <div className="plugin-header">
        <h3>{plugin.name}</h3>
        <div className="tier-badges">
          <span className="badge core">Core</span>
          {plugin.tiers.pro.enabled && (
            <span className="badge pro">Pro Available</span>
          )}
        </div>
      </div>

      <p className="description">{plugin.description}</p>

      {/* Feature comparison */}
      <div className="feature-table">
        {plugin.features.map(feature => (
          <div key={feature.id} className="feature-row">
            <span>{feature.name}</span>
            <div className="tier-indicators">
              <span className={feature.tier === 'core' ? 'active' : ''}>
                {feature.tier === 'core' ? '✓' : '—'}
              </span>
              <span className={feature.tier === 'pro' ? 'active' : ''}>
                {feature.tier === 'pro' ? '✓' : '—'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="actions">
        {!userAccess?.core ? (
          <button onClick={() => activateCore(plugin.id)}>
            Get Core (Free)
          </button>
        ) : (
          <span className="installed">Core Installed ✓</span>
        )}

        {plugin.tiers.pro.enabled && !userAccess?.pro && (
          <button
            className="btn-pro"
            onClick={() => requestPro(plugin.id)}
          >
            Request Pro
          </button>
        )}

        {userAccess?.pro && (
          <span className="pro-active">Pro Active ⭐</span>
        )}
      </div>
    </div>
  )
}
```

---

## Review & Approval System

### Automated Criteria

```typescript
// src/lib/pro-review-criteria.ts
export const reviewCriteria = {
  active_user: {
    check: async (userId: string) => {
      const user = await getUser(userId)
      const daysSinceSignup = differenceInDays(
        new Date(),
        new Date(user.created_at)
      )
      return daysSinceSignup >= 7
    },
    reason: 'Must be active for 7+ days'
  },

  quality_contributor: {
    check: async (userId: string) => {
      const contributions = await getUserContributions(userId)
      return contributions.length >= 3
    },
    reason: 'Must have 3+ quality contributions'
  },

  community_trust: {
    check: async (userId: string) => {
      const karma = await getUserKarma(userId)
      return karma >= 100
    },
    reason: 'Must have 100+ karma points'
  }
}
```

### Review Queue

```typescript
// src/workflows/pro-review-queue.ts
export async function processReviewQueue() {
  const pending = await getPendingProRequests()

  for (const request of pending) {
    // Auto-approve if criteria met
    const autoApproved = await checkAutoApproval(request.user_id)

    if (autoApproved) {
      await grantProAccess({
        user_id: request.user_id,
        plugin_id: request.plugin_id,
        features: request.requested_features,
        granted_by: 'system',
        reason: 'Auto-approved: All criteria met'
      })
    } else {
      // Flag for manual review
      await flagForManualReview(request)
    }
  }
}
```

---

## Migration Strategy

### Phase 1: Add Schema (Week 1)
- Create new tables
- Keep existing plugins working
- Add tier columns to existing plugins

### Phase 2: API Migration (Week 2)
- Launch `/api/v3/plugins` with tier support
- Keep v2 API running
- Update frontend to use v3

### Phase 3: UI Updates (Week 3)
- Add tier badges to plugin cards
- Implement comparison tables
- Add pro request flow

### Phase 4: Pro Activation (Week 4)
- Launch review system
- Enable pro requests
- Monitor and iterate

---

## Success Metrics

### Core Plugin Adoption
- Target: 1000+ core installs in first month
- Metric: Active core plugin installations

### Pro Request Conversion
- Target: 20% of core users request pro
- Metric: Pro requests / core installs

### Pro Activation Rate
- Target: 80% approval rate
- Metric: Approved pro requests / total requests

### Community Engagement
- Target: 30% increase in contributions
- Metric: User contributions before/after pro access

---

## FAQ

**Q: Why no payment for Pro initially?**
A: We want to build trust and community first. Payment gates add friction. Once we prove value, we can add paid tiers.

**Q: How do we prevent abuse?**
A: Rate limits, review criteria, and community moderation. Pro can be revoked if abused.

**Q: What happens to existing plugins?**
A: They become "Core" by default. We'll work with authors to identify "Pro" features.

**Q: Can plugin authors monetize?**
A: Yes! In the future, we'll allow plugin authors to set their own Pro pricing (with platform fee).

**Q: How is this different from Smart Connections?**
A:
- No payment friction (sign-up only)
- Unified codebase (feature flags vs separate versions)
- Community-driven reviews
- Open-source first philosophy

---

## Next Steps

1. ✅ Review this design with team
2. ⬜ Set up database migration
3. ⬜ Create API v3 endpoints
4. ⬜ Build frontend components
5. ⬜ Launch with 3 pilot plugins
6. ⬜ Gather feedback and iterate
