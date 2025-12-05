# n8n-MCP Testing Implementation Guide

## Phase 1: Foundation Setup (Week 1-2)

### 1.1 Install Vitest and Dependencies

```bash
# Remove Jest
npm uninstall jest ts-jest @types/jest

# Install Vitest and related packages
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/jest-dom
npm install -D msw # For API mocking
npm install -D @faker-js/faker # For test data
npm install -D fishery # For factories
```

### 1.2 Update package.json Scripts

```json
{
  "scripts": {
    // Testing
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "vitest run tests/e2e",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:coverage:check": "vitest run --coverage --coverage.thresholdAutoUpdate=false",
    
    // Benchmarks
    "bench": "vitest bench",
    "bench:compare": "vitest bench --compare",
    
    // CI specific
    "test:ci": "vitest run --reporter=junit --reporter=default",
    "test:ci:coverage": "vitest run --coverage --reporter=junit --reporter=default"
  }
}
```

### 1.3 Migrate Existing Tests

```typescript
// Before (Jest)
import { describe, test, expect } from '@jest/globals';

// After (Vitest)
import { describe, it, expect, vi } from 'vitest';

// Update mock syntax
// Jest: jest.mock('module')
// Vitest: vi.mock('module')

// Update timer mocks
// Jest: jest.useFakeTimers()
// Vitest: vi.useFakeTimers()
```

### 1.4 Create Test Database Setup

```typescript
// tests/setup/test-database.ts
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

export class TestDatabase {
  private db: Database.Database;
  
  constructor() {
    this.db = new Database(':memory:');
    this.initialize();
  }
  
  private initialize() {
    const schema = readFileSync(
      join(__dirname, '../../src/database/schema.sql'),
      'utf8'
    );
    this.db.exec(schema);
  }
  
  seedNodes(nodes: any[]) {
    const stmt = this.db.prepare(`
      INSERT INTO nodes (type, displayName, name, group, version, description, properties)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertMany = this.db.transaction((nodes) => {
      for (const node of nodes) {
        stmt.run(
          node.type,
          node.displayName,
          node.name,
          node.group,
          node.version,
          node.description,
          JSON.stringify(node.properties)
        );
      }
    });
    
    insertMany(nodes);
  }
  
  close() {
    this.db.close();
  }
  
  getDb() {
    return this.db;
  }
}
```

## Phase 2: Core Unit Tests (Week 3-4)

### 2.1 Test Organization Template

```typescript
// tests/unit/services/[service-name].test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServiceName } from '@/services/service-name';

describe('ServiceName', () => {
  let service: ServiceName;
  let mockDependency: any;
  
  beforeEach(() => {
    // Setup mocks
    mockDependency = {
      method: vi.fn()
    };
    
    // Create service instance
    service = new ServiceName(mockDependency);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('methodName', () => {
    it('should handle happy path', async () => {
      // Arrange
      const input = { /* test data */ };
      mockDependency.method.mockResolvedValue({ /* mock response */ });
      
      // Act
      const result = await service.methodName(input);
      
      // Assert
      expect(result).toEqual(/* expected output */);
      expect(mockDependency.method).toHaveBeenCalledWith(/* expected args */);
    });
    
    it('should handle errors gracefully', async () => {
      // Arrange
      mockDependency.method.mockRejectedValue(new Error('Test error'));
      
      // Act & Assert
      await expect(service.methodName({})).rejects.toThrow('Expected error message');
    });
  });
});
```

### 2.2 Mock Strategies by Layer

#### Database Layer
```typescript
// tests/unit/database/node-repository.test.ts
import { vi } from 'vitest';

vi.mock('better-sqlite3', () => ({
  default: vi.fn(() => ({
    prepare: vi.fn(() => ({
      all: vi.fn(() => mockData),
      get: vi.fn((id) => mockData.find(d => d.id === id)),
      run: vi.fn(() => ({ changes: 1 }))
    })),
    exec: vi.fn(),
    close: vi.fn()
  }))
}));
```

#### External APIs
```typescript
// tests/unit/services/__mocks__/axios.ts
export default {
  create: vi.fn(() => ({
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: { id: '123' } })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} }))
  }))
};
```

#### File System
```typescript
// Use memfs for file system mocking
import { vol } from 'memfs';

vi.mock('fs', () => vol);

beforeEach(() => {
  vol.reset();
  vol.fromJSON({
    '/test/file.json': JSON.stringify({ test: 'data' })
  });
});
```

### 2.3 Critical Path Tests

```typescript
// Priority 1: Node Loading and Parsing
// tests/unit/loaders/node-loader.test.ts

// Priority 2: Configuration Validation
// tests/unit/services/config-validator.test.ts

// Priority 3: MCP Tools
// tests/unit/mcp/tools.test.ts

// Priority 4: Database Operations
// tests/unit/database/node-repository.test.ts

// Priority 5: Workflow Validation
// tests/unit/services/workflow-validator.test.ts
```

## Phase 3: Integration Tests (Week 5-6)

### 3.1 Test Container Setup

```typescript
// tests/setup/test-containers.ts
import { GenericContainer, StartedTestContainer } from 'testcontainers';

export class N8nTestContainer {
  private container: StartedTestContainer;
  
  async start() {
    this.container = await new GenericContainer('n8nio/n8n:latest')
      .withExposedPorts(5678)
      .withEnv('N8N_BASIC_AUTH_ACTIVE', 'false')
      .withEnv('N8N_ENCRYPTION_KEY', 'test-key')
      .start();
    
    return {
      url: `http://localhost:${this.container.getMappedPort(5678)}`,
      stop: () => this.container.stop()
    };
  }
}
```

### 3.2 Integration Test Pattern

```typescript
// tests/integration/n8n-api/workflow-crud.test.ts
import { N8nTestContainer } from '@tests/setup/test-containers';
import { N8nAPIClient } from '@/services/n8n-api-client';

describe('n8n API Integration', () => {
  let container: any;
  let apiClient: N8nAPIClient;
  
  beforeAll(async () => {
    container = await new N8nTestContainer().start();
    apiClient = new N8nAPIClient(container.url);
  }, 30000);
  
  afterAll(async () => {
    await container.stop();
  });
  
  it('should create and retrieve workflow', async () => {
    // Create workflow
    const workflow = createTestWorkflow();
    const created = await apiClient.createWorkflow(workflow);
    
    expect(created.id).toBeDefined();
    
    // Retrieve workflow
    const retrieved = await apiClient.getWorkflow(created.id);
    expect(retrieved.name).toBe(workflow.name);
  });
});
```

## Phase 4: E2E & Performance (Week 7-8)

### 4.1 E2E Test Setup

```typescript
// tests/e2e/workflows/complete-workflow.test.ts
import { MCPClient } from '@tests/utils/mcp-client';
import { N8nTestContainer } from '@tests/setup/test-containers';

describe('Complete Workflow E2E', () => {
  let mcpServer: any;
  let n8nContainer: any;
  let mcpClient: MCPClient;
  
  beforeAll(async () => {
    // Start n8n
    n8nContainer = await new N8nTestContainer().start();
    
    // Start MCP server
    mcpServer = await startMCPServer({
      n8nUrl: n8nContainer.url
    });
    
    // Create MCP client
    mcpClient = new MCPClient(mcpServer.url);
  }, 60000);
  
  it('should execute complete workflow creation flow', async () => {
    // 1. Search for nodes
    const searchResult = await mcpClient.call('search_nodes', {
      query: 'webhook http slack'
    });
    
    // 2. Get node details
    const webhookInfo = await mcpClient.call('get_node_info', {
      nodeType: 'nodes-base.webhook'
    });
    
    // 3. Create workflow
    const workflow = new WorkflowBuilder('E2E Test')
      .addWebhookNode()
      .addHttpRequestNode()
      .addSlackNode()
      .connectSequentially()
      .build();
    
    // 4. Validate workflow
    const validation = await mcpClient.call('validate_workflow', {
      workflow
    });
    
    expect(validation.isValid).toBe(true);
    
    // 5. Deploy to n8n
    const deployed = await mcpClient.call('n8n_create_workflow', {
      ...workflow
    });
    
    expect(deployed.id).toBeDefined();
    expect(deployed.active).toBe(false);
  });
});
```

### 4.2 Performance Benchmarks

```typescript
// vitest.benchmark.config.ts
export default {
  test: {
    benchmark: {
      // Output benchmark results
      outputFile: './benchmark-results.json',
      
      // Compare with baseline
      compare: './benchmark-baseline.json',
      
      // Fail if performance degrades by more than 10%
      threshold: {
        p95: 1.1, // 110% of baseline
        p99: 1.2  // 120% of baseline
      }
    }
  }
};
```

## Testing Best Practices

### 1. Test Naming Convention
```typescript
// Format: should [expected behavior] when [condition]
it('should return user data when valid ID is provided')
it('should throw ValidationError when email is invalid')
it('should retry 3 times when network fails')
```

### 2. Test Data Builders
```typescript
// Use builders for complex test data
const user = new UserBuilder()
  .withEmail('test@example.com')
  .withRole('admin')
  .build();
```

### 3. Custom Matchers
```typescript
// tests/utils/matchers.ts
export const toBeValidNode = (received: any) => {
  const pass = 
    received.type &&
    received.displayName &&
    received.properties &&
    Array.isArray(received.properties);
  
  return {
    pass,
    message: () => `expected ${received} to be a valid node`
  };
};

// Usage
expect(node).toBeValidNode();
```

### 4. Snapshot Testing
```typescript
// For complex structures
it('should generate correct node schema', () => {
  const schema = generateNodeSchema(node);
  expect(schema).toMatchSnapshot();
});
```

### 5. Test Isolation
```typescript
// Always clean up after tests
afterEach(async () => {
  await cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});
```

## Coverage Goals by Module

| Module | Target | Priority | Notes |
|--------|--------|----------|-------|
| services/config-validator | 95% | High | Critical for reliability |
| services/workflow-validator | 90% | High | Core functionality |
| mcp/tools | 90% | High | User-facing API |
| database/node-repository | 85% | Medium | Well-tested DB layer |
| loaders/node-loader | 85% | Medium | External dependencies |
| parsers/* | 90% | High | Data transformation |
| utils/* | 80% | Low | Helper functions |
| scripts/* | 50% | Low | One-time scripts |

## Continuous Improvement

1. **Weekly Reviews**: Review test coverage and identify gaps
2. **Performance Baselines**: Update benchmarks monthly
3. **Flaky Test Detection**: Monitor and fix within 48 hours
4. **Test Documentation**: Keep examples updated
5. **Developer Training**: Pair programming on tests

## Success Metrics

- [ ] All tests pass in CI (0 failures)
- [ ] Coverage > 80% overall
- [ ] No flaky tests
- [ ] CI runs < 5 minutes
- [ ] Performance benchmarks stable
- [ ] Zero production bugs from tested code