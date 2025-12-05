# Database Layer Unit Tests

This directory contains comprehensive unit tests for the database layer components of n8n-mcp.

## Test Coverage

### node-repository.ts - 100% Coverage ✅
- `saveNode` method with JSON serialization
- `getNode` method with JSON deserialization  
- `getAITools` method
- `safeJsonParse` private method
- Edge cases: large JSON, boolean conversion, invalid JSON handling

### template-repository.ts - 80.31% Coverage ✅
- FTS5 initialization and fallback
- `saveTemplate` with sanitization
- `getTemplate` and `getTemplatesByNodes`
- `searchTemplates` with FTS5 and LIKE fallback
- `getTemplatesForTask` with task mapping
- Template statistics and maintenance operations
- Uncovered: Some error paths in FTS5 operations

### database-adapter.ts - Tested via Mocks
- Interface compliance tests
- PreparedStatement implementation
- Transaction support
- FTS5 detection logic
- Error handling patterns

## Test Strategy

The tests use a mock-based approach to:
1. Isolate database operations from actual database dependencies
2. Test business logic without requiring real SQLite/sql.js
3. Ensure consistent test execution across environments
4. Focus on behavior rather than implementation details

## Key Test Files

- `node-repository-core.test.ts` - Core NodeRepository functionality
- `template-repository-core.test.ts` - Core TemplateRepository functionality  
- `database-adapter-unit.test.ts` - DatabaseAdapter interface and patterns

## Running Tests

```bash
# Run all database tests
npm test -- tests/unit/database/

# Run with coverage
npm run test:coverage -- tests/unit/database/

# Run specific test file
npm test -- tests/unit/database/node-repository-core.test.ts
```

## Mock Infrastructure

The tests use custom mock implementations:
- `MockDatabaseAdapter` - Simulates database operations
- `MockPreparedStatement` - Simulates SQL statement execution
- Mock logger and template sanitizer for external dependencies

This approach ensures tests are fast, reliable, and maintainable.