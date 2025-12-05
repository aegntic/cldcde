# Test Database Utilities

This directory contains comprehensive database testing utilities for the n8n-mcp project. These utilities simplify database setup, data seeding, and state management in tests.

## Overview

The `database-utils.ts` file provides a complete set of utilities for:
- Creating test databases (in-memory or file-based)
- Seeding test data (nodes and templates)
- Managing database state (snapshots, resets)
- Loading fixtures from JSON files
- Helper functions for common database operations

## Quick Start

```typescript
import { createTestDatabase, seedTestNodes, dbHelpers } from '../utils/database-utils';

describe('My Test', () => {
  let testDb;
  
  afterEach(async () => {
    if (testDb) await testDb.cleanup();
  });
  
  it('should test something', async () => {
    // Create in-memory database
    testDb = await createTestDatabase();
    
    // Seed test data
    await seedTestNodes(testDb.nodeRepository);
    
    // Run your tests
    const node = testDb.nodeRepository.getNode('nodes-base.httpRequest');
    expect(node).toBeDefined();
  });
});
```

## Main Functions

### createTestDatabase(options?)
Creates a test database with repositories.

Options:
- `inMemory` (boolean, default: true) - Use in-memory SQLite
- `dbPath` (string) - Custom path for file-based database
- `initSchema` (boolean, default: true) - Initialize database schema
- `enableFTS5` (boolean, default: false) - Enable full-text search

### seedTestNodes(repository, nodes?)
Seeds test nodes into the database. Includes 3 default nodes (httpRequest, webhook, slack) plus any custom nodes provided.

### seedTestTemplates(repository, templates?)
Seeds test templates into the database. Includes 2 default templates plus any custom templates provided.

### createTestNode(overrides?)
Creates a test node with sensible defaults that can be overridden.

### createTestTemplate(overrides?)
Creates a test template with sensible defaults that can be overridden.

### resetDatabase(adapter)
Drops all tables and reinitializes the schema.

### createDatabaseSnapshot(adapter)
Creates a snapshot of the current database state.

### restoreDatabaseSnapshot(adapter, snapshot)
Restores database to a previous snapshot state.

### loadFixtures(adapter, fixturePath)
Loads nodes and templates from a JSON fixture file.

## Database Helpers (dbHelpers)

- `countRows(adapter, table)` - Count rows in a table
- `nodeExists(adapter, nodeType)` - Check if a node exists
- `getAllNodeTypes(adapter)` - Get all node type strings
- `clearTable(adapter, table)` - Clear all rows from a table
- `executeSql(adapter, sql)` - Execute raw SQL

## Testing Patterns

### Unit Tests (In-Memory Database)
```typescript
const testDb = await createTestDatabase(); // Fast, isolated
```

### Integration Tests (File Database)
```typescript
const testDb = await createTestDatabase({
  inMemory: false,
  dbPath: './test.db'
});
```

### Using Fixtures
```typescript
await loadFixtures(testDb.adapter, './fixtures/complex-scenario.json');
```

### State Management with Snapshots
```typescript
// Save current state
const snapshot = await createDatabaseSnapshot(testDb.adapter);

// Do risky operations...

// Restore if needed
await restoreDatabaseSnapshot(testDb.adapter, snapshot);
```

### Transaction Testing
```typescript
await withTransaction(testDb.adapter, async () => {
  // Operations here will be rolled back
  testDb.nodeRepository.saveNode(node);
});
```

### Performance Testing
```typescript
const duration = await measureDatabaseOperation('Bulk Insert', async () => {
  // Insert many nodes
});
expect(duration).toBeLessThan(1000);
```

## Fixture Format

JSON fixtures should follow this format:

```json
{
  "nodes": [
    {
      "nodeType": "nodes-base.example",
      "displayName": "Example Node",
      "description": "Description",
      "category": "Category",
      "isAITool": false,
      "isTrigger": false,
      "isWebhook": false,
      "properties": [],
      "credentials": [],
      "operations": [],
      "version": "1",
      "isVersioned": false,
      "packageName": "n8n-nodes-base"
    }
  ],
  "templates": [
    {
      "id": 1001,
      "name": "Template Name",
      "description": "Template description",
      "workflow": { ... },
      "nodes": [ ... ],
      "categories": [ ... ]
    }
  ]
}
```

## Best Practices

1. **Always cleanup**: Use `afterEach` to call `testDb.cleanup()`
2. **Use in-memory for unit tests**: Faster and isolated
3. **Use snapshots for complex scenarios**: Easy rollback
4. **Seed minimal data**: Only what's needed for the test
5. **Use fixtures for complex scenarios**: Reusable test data
6. **Test both empty and populated states**: Edge cases matter

## TypeScript Support

All utilities are fully typed. Import types as needed:

```typescript
import type { 
  TestDatabase, 
  TestDatabaseOptions, 
  DatabaseSnapshot 
} from '../utils/database-utils';
```

## Examples

See `tests/examples/using-database-utils.test.ts` for comprehensive examples of all features.