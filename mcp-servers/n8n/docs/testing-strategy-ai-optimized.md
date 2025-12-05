# n8n-MCP Testing Strategy - AI/LLM Optimized

## Overview for AI Implementation

This testing strategy is optimized for implementation by AI agents like Claude Code. Each section contains explicit instructions, file paths, and complete code examples to minimize ambiguity.

## Key Principles for AI Implementation

1. **Explicit Over Implicit**: Every instruction includes exact file paths and complete code
2. **Sequential Dependencies**: Tasks are ordered to avoid forward references
3. **Atomic Tasks**: Each task can be completed independently
4. **Verification Steps**: Each task includes verification commands
5. **Error Recovery**: Each section includes troubleshooting steps

## Phase 0: Immediate Fixes (Day 1) ✅ COMPLETED

### Task 0.1: Fix Failing Tests

**Files to modify:**
- `/tests/src/tests/single-session.test.ts`
- `/tests/http-server-auth.test.ts`

**Step 1: Fix TypeScript errors in single-session.test.ts**
```typescript
// FIND these lines (around line 147, 188, 189):
expect(resNoAuth.body).toEqual({

// REPLACE with:
expect((resNoAuth as any).body).toEqual({
```

**Step 2: Fix auth test issues**
```typescript
// In tests/http-server-auth.test.ts
// FIND the mockExit setup
const mockExit = jest.spyOn(process, 'exit').mockImplementation();

// REPLACE with:
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('Process exited');
});
```

**Verification:**
```bash
npm test
# Should show 4 passing test suites instead of 2
```

### Task 0.2: Setup GitHub Actions

**Create file:** `.github/workflows/test.yml`
```yaml
name: Test Suite
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - run: npm run lint
      - run: npm run typecheck || true  # Allow to fail initially
```

**Verification:**
```bash
git add .github/workflows/test.yml
git commit -m "chore: add GitHub Actions for testing"
git push
# Check Actions tab on GitHub - should see workflow running
```

## Phase 1: Vitest Migration (Week 1) ✅ COMPLETED

### Task 1.1: Install Vitest

**Execute these commands in order:**
```bash
# Remove Jest
npm uninstall jest ts-jest @types/jest

# Install Vitest
npm install -D vitest @vitest/ui @vitest/coverage-v8

# Install testing utilities
npm install -D @testing-library/jest-dom
npm install -D msw
npm install -D @faker-js/faker
npm install -D fishery
```

**Verification:**
```bash
npm list vitest  # Should show vitest version
```

### Task 1.2: Create Vitest Configuration

**Create file:** `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/global-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.test.ts',
        'scripts/',
        'dist/'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
});
```

### Task 1.3: Create Global Setup

**Create file:** `tests/setup/global-setup.ts`
```typescript
import { beforeEach, afterEach, vi } from 'vitest';

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
  vi.restoreAllMocks();
});

// Global test timeout
vi.setConfig({ testTimeout: 10000 });

// Silence console during tests unless DEBUG=true
if (process.env.DEBUG !== 'true') {
  global.console = {
    ...console,
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}
```

### Task 1.4: Update package.json Scripts

**Modify file:** `package.json`
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "vitest run tests/e2e"
  }
}
```

### Task 1.5: Migrate First Test File

**Modify file:** `tests/logger.test.ts`
```typescript
// Change line 1 FROM:
import { jest } from '@jest/globals';

// TO:
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Replace all occurrences:
// FIND: jest.fn()
// REPLACE: vi.fn()

// FIND: jest.spyOn
// REPLACE: vi.spyOn
```

**Verification:**
```bash
npm test tests/logger.test.ts
# Should pass with Vitest
```

## Phase 2: Test Infrastructure (Week 2)

### Task 2.1: Create Directory Structure

**Execute these commands:**
```bash
# Create test directories
mkdir -p tests/unit/{services,database,mcp,utils,loaders,parsers}
mkdir -p tests/integration/{mcp-protocol,n8n-api,database}
mkdir -p tests/e2e/{workflows,setup,fixtures}
mkdir -p tests/performance/{node-loading,search,validation}
mkdir -p tests/fixtures/{factories,nodes,workflows}
mkdir -p tests/utils/{builders,mocks,assertions}
mkdir -p tests/setup
```

### Task 2.2: Create Database Mock

**Create file:** `tests/unit/database/__mocks__/better-sqlite3.ts`
```typescript
import { vi } from 'vitest';

export class MockDatabase {
  private data = new Map<string, any[]>();
  private prepared = new Map<string, any>();
  
  constructor() {
    this.data.set('nodes', []);
    this.data.set('templates', []);
    this.data.set('tools_documentation', []);
  }
  
  prepare(sql: string) {
    const key = this.extractTableName(sql);
    
    return {
      all: vi.fn(() => this.data.get(key) || []),
      get: vi.fn((id: string) => {
        const items = this.data.get(key) || [];
        return items.find(item => item.id === id);
      }),
      run: vi.fn((params: any) => {
        const items = this.data.get(key) || [];
        items.push(params);
        this.data.set(key, items);
        return { changes: 1, lastInsertRowid: items.length };
      })
    };
  }
  
  exec(sql: string) {
    // Mock schema creation
    return true;
  }
  
  close() {
    // Mock close
    return true;
  }
  
  // Helper to extract table name from SQL
  private extractTableName(sql: string): string {
    const match = sql.match(/FROM\s+(\w+)|INTO\s+(\w+)|UPDATE\s+(\w+)/i);
    return match ? (match[1] || match[2] || match[3]) : 'nodes';
  }
  
  // Test helper to seed data
  _seedData(table: string, data: any[]) {
    this.data.set(table, data);
  }
}

export default vi.fn(() => new MockDatabase());
```

### Task 2.3: Create Node Factory

**Create file:** `tests/fixtures/factories/node.factory.ts`
```typescript
import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';

interface NodeDefinition {
  name: string;
  displayName: string;
  description: string;
  version: number;
  defaults: { name: string };
  inputs: string[];
  outputs: string[];
  properties: any[];
  credentials?: any[];
  group?: string[];
}

export const nodeFactory = Factory.define<NodeDefinition>(() => ({
  name: faker.helpers.slugify(faker.word.noun()),
  displayName: faker.company.name(),
  description: faker.lorem.sentence(),
  version: faker.number.int({ min: 1, max: 5 }),
  defaults: {
    name: faker.word.noun()
  },
  inputs: ['main'],
  outputs: ['main'],
  group: [faker.helpers.arrayElement(['transform', 'trigger', 'output'])],
  properties: [
    {
      displayName: 'Resource',
      name: 'resource',
      type: 'options',
      default: 'user',
      options: [
        { name: 'User', value: 'user' },
        { name: 'Post', value: 'post' }
      ]
    }
  ],
  credentials: []
}));

// Specific node factories
export const webhookNodeFactory = nodeFactory.params({
  name: 'webhook',
  displayName: 'Webhook',
  description: 'Starts the workflow when a webhook is called',
  group: ['trigger'],
  properties: [
    {
      displayName: 'Path',
      name: 'path',
      type: 'string',
      default: 'webhook',
      required: true
    },
    {
      displayName: 'Method',
      name: 'method',
      type: 'options',
      default: 'GET',
      options: [
        { name: 'GET', value: 'GET' },
        { name: 'POST', value: 'POST' }
      ]
    }
  ]
});

export const slackNodeFactory = nodeFactory.params({
  name: 'slack',
  displayName: 'Slack',
  description: 'Send messages to Slack',
  group: ['output'],
  credentials: [
    {
      name: 'slackApi',
      required: true
    }
  ],
  properties: [
    {
      displayName: 'Resource',
      name: 'resource',
      type: 'options',
      default: 'message',
      options: [
        { name: 'Message', value: 'message' },
        { name: 'Channel', value: 'channel' }
      ]
    },
    {
      displayName: 'Operation',
      name: 'operation',
      type: 'options',
      displayOptions: {
        show: {
          resource: ['message']
        }
      },
      default: 'post',
      options: [
        { name: 'Post', value: 'post' },
        { name: 'Update', value: 'update' }
      ]
    },
    {
      displayName: 'Channel',
      name: 'channel',
      type: 'string',
      required: true,
      displayOptions: {
        show: {
          resource: ['message'],
          operation: ['post']
        }
      },
      default: ''
    }
  ]
});
```

### Task 2.4: Create Workflow Builder

**Create file:** `tests/utils/builders/workflow.builder.ts`
```typescript
interface INode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: any;
}

interface IConnection {
  node: string;
  type: string;
  index: number;
}

interface IConnections {
  [key: string]: {
    [key: string]: IConnection[][];
  };
}

interface IWorkflow {
  name: string;
  nodes: INode[];
  connections: IConnections;
  active: boolean;
  settings?: any;
}

export class WorkflowBuilder {
  private workflow: IWorkflow;
  private nodeCounter = 0;
  
  constructor(name: string) {
    this.workflow = {
      name,
      nodes: [],
      connections: {},
      active: false,
      settings: {}
    };
  }
  
  addNode(params: Partial<INode>): this {
    const node: INode = {
      id: params.id || `node_${this.nodeCounter++}`,
      name: params.name || params.type?.split('.').pop() || 'Node',
      type: params.type || 'n8n-nodes-base.noOp',
      typeVersion: params.typeVersion || 1,
      position: params.position || [250 + this.nodeCounter * 200, 300],
      parameters: params.parameters || {}
    };
    
    this.workflow.nodes.push(node);
    return this;
  }
  
  addWebhookNode(path: string = 'test-webhook'): this {
    return this.addNode({
      type: 'n8n-nodes-base.webhook',
      name: 'Webhook',
      parameters: {
        path,
        method: 'POST'
      }
    });
  }
  
  addSlackNode(channel: string = '#general'): this {
    return this.addNode({
      type: 'n8n-nodes-base.slack',
      name: 'Slack',
      typeVersion: 2.2,
      parameters: {
        resource: 'message',
        operation: 'post',
        channel,
        text: '={{ $json.message }}'
      }
    });
  }
  
  connect(fromId: string, toId: string, outputIndex = 0): this {
    if (!this.workflow.connections[fromId]) {
      this.workflow.connections[fromId] = { main: [] };
    }
    
    if (!this.workflow.connections[fromId].main[outputIndex]) {
      this.workflow.connections[fromId].main[outputIndex] = [];
    }
    
    this.workflow.connections[fromId].main[outputIndex].push({
      node: toId,
      type: 'main',
      index: 0
    });
    
    return this;
  }
  
  connectSequentially(): this {
    for (let i = 0; i < this.workflow.nodes.length - 1; i++) {
      this.connect(
        this.workflow.nodes[i].id,
        this.workflow.nodes[i + 1].id
      );
    }
    return this;
  }
  
  activate(): this {
    this.workflow.active = true;
    return this;
  }
  
  build(): IWorkflow {
    return JSON.parse(JSON.stringify(this.workflow));
  }
}

// Usage example:
// const workflow = new WorkflowBuilder('Test Workflow')
//   .addWebhookNode()
//   .addSlackNode()
//   .connectSequentially()
//   .build();
```

## Phase 3: Unit Tests (Week 3-4)

### Task 3.1: Test Config Validator

**Create file:** `tests/unit/services/config-validator.test.ts`
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigValidator } from '@/services/config-validator';
import { nodeFactory, slackNodeFactory } from '@tests/fixtures/factories/node.factory';

// Mock the database
vi.mock('better-sqlite3');

describe('ConfigValidator', () => {
  let validator: ConfigValidator;
  let mockDb: any;
  
  beforeEach(() => {
    // Setup mock database with test data
    mockDb = {
      prepare: vi.fn().mockReturnValue({
        get: vi.fn().mockReturnValue({
          properties: JSON.stringify(slackNodeFactory.build().properties)
        })
      })
    };
    
    validator = new ConfigValidator(mockDb);
  });
  
  describe('validate', () => {
    it('should validate required fields for Slack message post', () => {
      const config = {
        resource: 'message',
        operation: 'post'
        // Missing required 'channel' field
      };
      
      const result = validator.validate('n8n-nodes-base.slack', config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('channel is required');
    });
    
    it('should pass validation with all required fields', () => {
      const config = {
        resource: 'message',
        operation: 'post',
        channel: '#general'
      };
      
      const result = validator.validate('n8n-nodes-base.slack', config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should handle unknown node types', () => {
      const result = validator.validate('unknown.node', {});
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unknown node type: unknown.node');
    });
  });
});
```

**Verification:**
```bash
npm test tests/unit/services/config-validator.test.ts
# Should create and pass the test
```

### Task 3.2: Create Test Template for Each Service

**For each service in `src/services/`, create a test file using this template:**

```typescript
// tests/unit/services/[service-name].test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceName } from '@/services/[service-name]';

describe('ServiceName', () => {
  let service: ServiceName;
  
  beforeEach(() => {
    service = new ServiceName();
  });
  
  describe('mainMethod', () => {
    it('should handle basic case', () => {
      // Arrange
      const input = {};
      
      // Act
      const result = service.mainMethod(input);
      
      // Assert
      expect(result).toBeDefined();
    });
  });
});
```

**Files to create tests for:**
1. `tests/unit/services/enhanced-config-validator.test.ts`
2. `tests/unit/services/workflow-validator.test.ts`
3. `tests/unit/services/expression-validator.test.ts`
4. `tests/unit/services/property-filter.test.ts`
5. `tests/unit/services/example-generator.test.ts`

## Phase 4: Integration Tests (Week 5-6) 🚧 IN PROGRESS

### Real Situation Assessment (Updated July 29, 2025)

**Context**: This is a new test suite being developed from scratch. The main branch has been working without tests.

### Current Status:
- **Total Integration Tests**: 246 tests across 14 files
- **Failing**: 58 tests (23.6% failure rate)
- **Passing**: 187 tests
- **CI/CD Issue**: Tests appear green due to `|| true` in workflow file

### Categories of Failures:

#### 1. Database Issues (9 failures)
- **Root Cause**: Tests not properly isolating database state
- **Symptoms**: 
  - "UNIQUE constraint failed: templates.workflow_id"
  - "database disk image is malformed"
  - FTS5 rebuild syntax error

#### 2. MCP Protocol (30 failures)
- **Root Cause**: Response structure mismatch
- **Fixed**: tool-invocation.test.ts (30 tests now passing)
- **Remaining**: error-handling.test.ts (16 failures)
- **Issue**: Tests expect different response format than server provides

#### 3. MSW Mock Server (6 failures)
- **Root Cause**: MSW not properly initialized after removal from global setup
- **Symptoms**: "Request failed with status code 501"

#### 4. FTS5 Search (7 failures)
- **Root Cause**: Incorrect query syntax and expectations
- **Issues**: Empty search terms, NOT queries, result count mismatches

#### 5. Session Management (5 failures)
- **Root Cause**: Async operations not cleaned up
- **Symptom**: Tests timing out at 360+ seconds

#### 6. Performance Tests (1 failure)
- **Root Cause**: Operations slower than expected thresholds

### Task 4.1: Fix Integration Test Infrastructure

**Priority Order for Fixes:**

1. **Remove CI Error Suppression** (Critical)
   ```yaml
   # In .github/workflows/test.yml
   - name: Run integration tests
     run: npm run test:integration -- --reporter=default --reporter=junit
     # Remove the || true that's hiding failures
   ```

2. **Fix Database Isolation** (High Priority)
   - Each test needs its own database instance
   - Proper cleanup in afterEach hooks
   - Fix FTS5 rebuild syntax: `INSERT INTO templates_fts(templates_fts) VALUES('rebuild')`

3. **Fix MSW Initialization** (High Priority)
   - Add MSW setup to each test file that needs it
   - Ensure proper start/stop lifecycle

4. **Fix MCP Response Structure** (Medium Priority)
   - Already fixed in tool-invocation.test.ts
   - Apply same pattern to error-handling.test.ts

5. **Fix FTS5 Search Queries** (Medium Priority)
   - Handle empty search terms
   - Fix NOT query syntax
   - Adjust result count expectations

6. **Fix Session Management** (Low Priority)
   - Add proper async cleanup
   - Fix transport initialization issues

**Create file:** `tests/integration/mcp-protocol/protocol-compliance.test.ts`
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MCPServer } from '@/mcp/server';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

describe('MCP Protocol Compliance', () => {
  let server: MCPServer;
  let clientTransport: any;
  let serverTransport: any;
  
  beforeEach(async () => {
    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    server = new MCPServer();
    await server.connect(serverTransport);
  });
  
  it('should reject requests without jsonrpc version', async () => {
    const response = await clientTransport.send({
      id: 1,
      method: 'tools/list'
      // Missing jsonrpc: "2.0"
    });
    
    expect(response.error).toBeDefined();
    expect(response.error.code).toBe(-32600); // Invalid Request
  });
  
  it('should handle tools/list request', async () => {
    const response = await clientTransport.send({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    });
    
    expect(response.result).toBeDefined();
    expect(response.result.tools).toBeInstanceOf(Array);
    expect(response.result.tools.length).toBeGreaterThan(0);
  });
});
```

## Phase 5: E2E Tests (Week 7-8)

### Task 5.1: E2E Test Setup without Playwright

**Create file:** `tests/e2e/setup/n8n-test-setup.ts`
```typescript
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

export class N8nTestSetup {
  private containerName = 'n8n-test';
  private dataPath = path.join(__dirname, '../fixtures/n8n-test-data');
  
  async setup(): Promise<{ url: string; cleanup: () => void }> {
    // Stop any existing container
    try {
      execSync(`docker stop ${this.containerName}`, { stdio: 'ignore' });
      execSync(`docker rm ${this.containerName}`, { stdio: 'ignore' });
    } catch (e) {
      // Container doesn't exist, continue
    }
    
    // Start n8n with pre-configured database
    execSync(`
      docker run -d \
        --name ${this.containerName} \
        -p 5678:5678 \
        -e N8N_BASIC_AUTH_ACTIVE=false \
        -e N8N_ENCRYPTION_KEY=test-key \
        -e DB_TYPE=sqlite \
        -e N8N_USER_MANAGEMENT_DISABLED=true \
        -v ${this.dataPath}:/home/node/.n8n \
        n8nio/n8n:latest
    `);
    
    // Wait for n8n to be ready
    await this.waitForN8n();
    
    return {
      url: 'http://localhost:5678',
      cleanup: () => this.cleanup()
    };
  }
  
  private async waitForN8n(maxRetries = 30) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        execSync('curl -f http://localhost:5678/healthz', { stdio: 'ignore' });
        return;
      } catch (e) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    throw new Error('n8n failed to start');
  }
  
  private cleanup() {
    execSync(`docker stop ${this.containerName}`, { stdio: 'ignore' });
    execSync(`docker rm ${this.containerName}`, { stdio: 'ignore' });
  }
}
```

### Task 5.2: Create Pre-configured Database

**Create file:** `tests/e2e/fixtures/setup-test-db.sql`
```sql
-- Create initial user (bypasses setup wizard)
INSERT INTO user (email, password, personalizationAnswers, settings, createdAt, updatedAt) 
VALUES (
  'test@example.com',
  '$2a$10$mockHashedPassword',
  '{}',
  '{"userManagement":{"showSetupOnFirstLoad":false}}',
  datetime('now'),
  datetime('now')
);

-- Create API key for testing
INSERT INTO api_keys (userId, label, apiKey, createdAt, updatedAt)
VALUES (
  1,
  'Test API Key',
  'test-api-key-for-e2e-testing',
  datetime('now'),
  datetime('now')
);
```

## Pragmatic Fix Strategy

### Immediate Actions (Do First)

1. **Get Stakeholder Buy-in**
   - Explain that CI will show "red" for 1-2 weeks
   - This is necessary to see real test status
   - Tests have been passing falsely

2. **Create Tracking Dashboard**
   ```markdown
   # Integration Test Fix Progress
   - [ ] Database Isolation (9 tests)
   - [ ] MCP Error Handling (16 tests)
   - [ ] MSW Setup (6 tests)
   - [ ] FTS5 Search (7 tests)
   - [ ] Session Management (5 tests)
   - [ ] Performance (15 tests)
   Total: 58 failing tests to fix
   ```

3. **Remove Error Suppression**
   - Only after team is prepared
   - Commit with clear message about expected failures

### Fix Implementation Plan

#### Week 1: Critical Infrastructure
- Fix database isolation issues
- Fix MSW initialization
- Target: 15-20 tests fixed

#### Week 2: Protocol & Search
- Fix remaining MCP protocol tests
- Fix FTS5 search syntax
- Target: 20-25 tests fixed

#### Week 3: Performance & Cleanup
- Adjust performance thresholds if needed
- Fix session management
- Target: All tests passing

## AI Implementation Guidelines

### 1. Task Execution Order

Always execute tasks in this sequence:
1. Fix failing tests (Phase 0)
2. Set up CI/CD (Phase 0)
3. Migrate to Vitest (Phase 1)
4. Create test infrastructure (Phase 2)
5. Write unit tests (Phase 3)
6. Write integration tests (Phase 4)
7. Write E2E tests (Phase 5)

### 2. File Creation Pattern

When creating a new test file:
1. Create the file with the exact path specified
2. Copy the provided template exactly
3. Run the verification command
4. If it fails, check imports and file paths
5. Commit after each successful test file

### 3. Error Recovery

If a test fails:
1. Check the exact error message
2. Verify all imports are correct
3. Ensure mocks are properly set up
4. Check that the source file exists
5. Run with DEBUG=true for more information

### 4. Coverage Tracking

After each phase:
```bash
npm run test:coverage
# Check coverage/index.html for detailed report
# Ensure coverage is increasing
```

### 5. Commit Strategy

Make atomic commits:
```bash
# After each successful task
git add [specific files]
git commit -m "test: [phase] - [specific task completed]"

# Examples:
git commit -m "test: phase 0 - fix failing tests"
git commit -m "test: phase 1 - migrate to vitest"
git commit -m "test: phase 2 - create test infrastructure"
```

## Verification Checklist

After each phase, verify:

**Phase 0:**
- [ ] All 6 test suites pass
- [ ] GitHub Actions workflow runs

**Phase 1:**
- [ ] Vitest installed and configured
- [ ] npm test runs Vitest
- [ ] At least one test migrated

**Phase 2:**
- [ ] Directory structure created
- [ ] Database mock works
- [ ] Factories generate valid data
- [ ] Builders create valid workflows

**Phase 3:**
- [ ] Config validator tests pass
- [ ] Coverage > 50%

**Phase 4:** 🚧 IN PROGRESS
- [x] Database integration tests created ✅
- [x] MCP protocol tests created ✅
- [ ] MCP protocol tests pass ⚠️ (67/255 failing - response structure issues)
- [ ] n8n API integration tests created (MSW ready)
- [ ] Coverage > 70% (currently ~65%)

**Phase 5:**
- [ ] E2E tests run without Playwright
- [ ] Coverage > 80%

## Common Issues and Solutions

### Issue: Cannot find module '@/services/...'
**Solution:** Check tsconfig.json has path aliases configured

### Issue: Mock not working
**Solution:** Ensure vi.mock() is at top of file, outside describe blocks

### Issue: Test timeout
**Solution:** Increase timeout for specific test:
```typescript
it('should handle slow operation', async () => {
  // test code
}, 30000); // 30 second timeout
```

### Issue: Coverage not updating
**Solution:** 
```bash
rm -rf coverage/
npm run test:coverage
```

## Success Criteria

The implementation is successful when:
1. All tests pass (0 failures)
2. Coverage exceeds 80%
3. CI/CD pipeline is green
4. No TypeScript errors
5. All phases completed

This AI-optimized plan provides explicit, step-by-step instructions that can be followed sequentially without ambiguity.