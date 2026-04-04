# Plugin Author's Guide to Core vs Pro

How to structure your plugin with Core and Pro tiers.

## Quick Start

### 1. Design Your Feature Split

Ask yourself these questions:

**Core Features (Free)**
- What does every user need?
- What works without configuration?
- What's the 80% use case?

**Pro Features (Sign Up)**
- What do power users want?
- What requires advanced configuration?
- What provides additional value?

### 2. Update Your plugin.json

Add the `tiers` and `features` sections:

```json
{
  "name": "my-awesome-plugin",
  "version": "1.0.0",

  "tiers": {
    "core": {
      "enabled": true,
      "auto_activate": true,
      "features": ["basic_feature", "search", "export"]
    },
    "pro": {
      "enabled": true,
      "activation_method": "signup_review",
      "features": ["advanced_analytics", "automation", "api_access"]
    }
  },

  "features": [
    {
      "id": "basic_feature",
      "name": "Basic Feature",
      "tier": "core",
      "description": "Everyone gets this"
    },
    {
      "id": "advanced_analytics",
      "name": "Advanced Analytics",
      "tier": "pro",
      "description": "Power user feature",
      "pro_benefits": [
        "Detailed insights",
        "Export to CSV",
        "Custom reports"
      ]
    }
  ]
}
```

### 3. Check Feature Access in Code

```typescript
import { checkFeature } from '@cldcde/plugin-runtime'

async function doSomething() {
  // Core feature - always available
  if (await checkFeature('basic_feature')) {
    await performBasicOperation()
  }

  // Pro feature - needs check
  if (await checkFeature('advanced_analytics')) {
    await showAdvancedAnalytics()
  } else {
    // Show friendly upgrade prompt
    showUpgradePrompt('advanced_analytics', {
      feature_name: 'Advanced Analytics',
      benefits: [
        'Detailed insights',
        'Export to CSV',
        'Custom reports'
      ],
      activation_url: '/api/plugins/my-awesome-plugin/pro/request'
    })
  }
}
```

## Feature Design Patterns

### Pattern 1: Progressive Enhancement

Core works great, Pro adds power.

```typescript
// Core: Basic search
async function search(query: string) {
  return await database.simpleSearch(query)
}

// Pro: Advanced search with filters
if (await checkFeature('advanced_search')) {
  async function search(query: string, filters: SearchFilters) {
    return await database.advancedSearch(query, filters)
  }
}
```

### Pattern 2: Usage Limits

Core has limits, Pro removes them.

```typescript
const MAX_REQUESTS = await checkFeature('unlimited_requests')
  ? Infinity
  : 100

let requestCount = 0

async function makeRequest() {
  if (requestCount >= MAX_REQUESTS) {
    showUpgradePrompt('unlimited_requests')
    return
  }

  requestCount++
  return await performRequest()
}
```

### Pattern 3: Access to Advanced Tools

Pro unlocks entirely new capabilities.

```typescript
// Core: Manual work
async function processItems(items: Item[]) {
  for (const item of items) {
    await processItem(item)
  }
}

// Pro: Batch automation
if (await checkFeature('automation')) {
  async function processItems(items: Item[]) {
    await batchProcessor.process(items, {
      parallel: true,
      retries: 3,
      logging: 'detailed'
    })
  }
}
```

## Best Practices

### 1. Core Should Be Valuable

**Bad**: Core is useless without Pro
```json
{
  "core": {
    "features": ["view_only"] // Too limited
  }
}
```

**Good**: Core is fully functional
```json
{
  "core": {
    "features": ["view", "edit", "export", "search"] // Complete basic workflow
  }
}
```

### 2. Pro Should Provide Clear Value

**Bad**: Pro features are vague
```typescript
if (await checkFeature('pro_mode')) {
  // What does this even do?
}
```

**Good**: Pro features are specific
```typescript
if (await checkFeature('batch_export')) {
  await exportAllItems({ format: 'csv', includeMetadata: true })
}
```

### 3. Graceful Degradation

Always handle feature unavailability:

```typescript
async function performAction() {
  if (await checkFeature('advanced_action')) {
    await doAdvancedAction()
  } else {
    // Fall back to basic version
    await doBasicAction()
    // Suggest upgrade
    showFeatureHighlight('advanced_action')
  }
}
```

### 4. Clear Communication

Tell users what they're missing:

```typescript
function showUpgradePrompt(featureId: string, details: FeatureDetails) {
  return (
    <UpgradeDialog>
      <h2>Upgrade to Pro</h2>
      <p>{details.feature_name} is a Pro feature</p>

      <h3>You'll get:</h3>
      <ul>
        {details.benefits.map(benefit => (
          <li key={benefit}>{benefit}</li>
        ))}
      </ul>

      <Button onClick={requestProAccess}>
        Request Pro Access (Free)
      </Button>

      <p className="note">
        Usually approved within 24-48 hours
      </p>
    </UpgradeDialog>
  )
}
```

## Testing Core vs Pro

### Unit Tests

```typescript
describe('MyPlugin', () => {
  describe('Core features', () => {
    it('should work without Pro', async () => {
      // Mock Pro as unavailable
      mockFeatureAccess('advanced_feature', false)

      // Core should still work
      await expect(doBasicWork()).resolves.toBeDefined()
    })
  })

  describe('Pro features', () => {
    it('should enhance when Pro available', async () => {
      // Mock Pro as available
      mockFeatureAccess('advanced_feature', true)

      // Should use Pro feature
      await expect(doAdvancedWork()).resolves.toBeDefined()
    })

    it('should show upgrade prompt when Pro unavailable', async () => {
      mockFeatureAccess('advanced_feature', false)

      await expect(doAdvancedWork()).rejects.toThrow('FEATURE_NOT_AVAILABLE')
    })
  })
})
```

### Integration Tests

```typescript
describe('Plugin Integration', () => {
  it('should work end-to-end with Core only', async () => {
    const user = await createFreeUser()
    const result = await plugin.action(user)
    expect(result.success).toBe(true)
  })

  it('should enhance with Pro features', async () => {
    const user = await createProUser()
    const result = await plugin.action(user)
    expect(result.advanced).toBe(true)
  })
})
```

## Migration Guide

### Converting Existing Plugins

**Step 1: Audit Features**

List what you have:
```
- Basic search
- Advanced search with filters
- Export
- Batch operations
- API access
```

**Step 2: Split into Tiers**

Decide what goes where:
```
Core:
- Basic search
- Export (single item)

Pro:
- Advanced search
- Batch operations
- API access
```

**Step 3: Add Feature Checks**

```typescript
// Before
async function search(query: string, filters?: Filters) {
  return await database.search(query, filters)
}

// After
async function search(query: string, filters?: Filters) {
  if (filters && !(await checkFeature('advanced_search'))) {
    showUpgradePrompt('advanced_search')
    return await database.search(query) // Basic search
  }

  return await database.search(query, filters)
}
```

**Step 4: Update Documentation**

Add feature comparison to your README:

```markdown
## Features

| Feature | Core | Pro |
|---------|------|-----|
| Basic Search | ✅ | ✅ |
| Advanced Filters | ❌ | ✅ |
| Export | ✅ | ✅ |
| Batch Export | ❌ | ✅ |
| API Access | ❌ | ✅ |
```

## Example: Complete Plugin Structure

```typescript
// src/index.ts
import { checkFeature, showUpgradePrompt } from '@cldcde/plugin-runtime'

export class MyPlugin {
  async search(query: string) {
    // Core feature - always available
    return await this.db.search(query)
  }

  async advancedSearch(query: string, filters: Filters) {
    // Pro feature - check access
    if (await checkFeature('advanced_search')) {
      return await this.db.search(query, filters)
    }

    // Show upgrade prompt
    showUpgradePrompt('advanced_search', {
      feature_name: 'Advanced Search',
      benefits: [
        'Filter by date, category, tags',
        'Boolean operators (AND, OR, NOT)',
        'Regular expression support'
      ]
    })

    // Fall back to basic search
    return await this.search(query)
  }

  async export(item: Item) {
    // Core - single export
    return await this.exporter.export(item)
  }

  async batchExport(items: Item[]) {
    // Pro - batch operation
    if (await checkFeature('batch_export')) {
      return await this.exporter.exportBatch(items)
    }

    // Limit to single item
    showUpgradePrompt('batch_export', {
      feature_name: 'Batch Export',
      benefits: [
        'Export multiple items at once',
        'Choose from multiple formats',
        'Include metadata and relationships'
      ]
    })

    // Export first item only
    return await this.export(items[0])
  }

  async callApi(endpoint: string, data: any) {
    // Pro - API access
    if (await checkFeature('api_access')) {
      return await this.api.call(endpoint, data)
    }

    throw new Error('API access requires Pro')
  }
}
```

## Pro Activation Flow

### For Users

```typescript
// User tries Pro feature
try {
  await plugin.advancedSearch(query, filters)
} catch (error) {
  if (error.code === 'FEATURE_NOT_AVAILABLE') {
    // Show friendly UI
    showDialog({
      title: 'Upgrade to Pro',
      message: 'Advanced search is a Pro feature',
      cta: {
        text: 'Request Pro Access',
        action: async () => {
          await requestProAccess('my-plugin', {
            use_case: 'I need advanced filters for my research',
            requested_features: ['advanced_search']
          })

          showMessage('Request submitted! Usually approved within 24-48 hours')
        }
      }
    })
  }
}
```

### For Plugin Authors

You don't need to do anything! The platform handles:
- Pro requests
- Reviews
- Activation
- Access checks

Just implement the feature checks in your code.

## FAQ

**Q: Should I make my entire plugin Core?**
A: No, think about what advanced users might want. Even small Pro features help sustain development.

**Q: How many features should be Core vs Pro?**
A: Aim for 80/20 - 80% of users should be happy with Core, 20% need Pro features.

**Q: Can I change features later?**
A: Yes! But be careful not to take away Core features users depend on.

**Q: What if someone abuses Pro features?**
A: Report them to the platform. Pro access can be revoked.

**Q: Do I get paid for Pro features?**
A: Not initially. In the future, you'll be able to set pricing (with platform fee).

**Q: Can I offer both Core and Pro in one package?**
A: Yes! That's the recommended approach. Use feature flags.

## Resources

- **Design Guide**: `/docs/CORE_VS_PRO_DESIGN.md`
- **Example Plugin**: `/examples/smart-connections/`
- **API Reference**: `/docs/plugin-api.md`
- **Community**: https://discord.gg/cldcde

## Support

Need help? Join the plugin author community:
- Discord: #plugin-authors
- GitHub: Create an issue
- Email: plugins@cldcde.cc
