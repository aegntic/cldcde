# n8n-MCP Comprehensive Testing Strategy

## Executive Summary

This document outlines a comprehensive testing strategy for the n8n-MCP project to achieve 80%+ test coverage from the current 2.45%. The strategy addresses critical risks, establishes testing infrastructure, and provides a phased implementation plan to ensure reliable development without fear of regression.

## Current State Analysis

### Testing Metrics
- **Current Coverage**: 2.45%
- **Test Suites**: 6 (2 failing, 4 passing)
- **Total Tests**: 57 (3 failing, 54 passing)
- **CI/CD**: No automated testing pipeline
- **Test Types**: Minimal unit tests, no integration/E2E tests

### Key Problems
1. **Infrastructure Issues**: TypeScript compilation errors, missing test utilities
2. **Coverage Gaps**: Core components (MCP server, validators, parsers) have 0% coverage
3. **Test Confusion**: 35+ diagnostic scripts mixed with actual tests
4. **No Automation**: Tests not run on commits/PRs

## Testing Architecture

### Framework Selection

**Primary Framework: Vitest**
- 10-100x faster than Jest
- Native ESM support
- Superior TypeScript integration
- Built-in benchmarking

**Supporting Tools:**
- **MSW**: API mocking
- **Fishery**: Test data factories
- **Testcontainers**: Integration testing
- **Playwright**: E2E testing (future)

### Directory Structure

```
tests/
├── unit/                    # 70% - Isolated component tests
│   ├── services/           # Validators, parsers, filters
│   ├── database/           # Repository patterns
│   ├── mcp/               # MCP handlers and tools
│   └── utils/             # Utility functions
├── integration/            # 20% - Component interaction tests
│   ├── mcp-protocol/      # JSON-RPC compliance
│   ├── n8n-api/           # API integration
│   └── database/          # SQLite operations
├── e2e/                   # 10% - Complete workflow tests
│   ├── workflows/         # Full workflow creation/execution
│   └── mcp-sessions/      # Complete MCP sessions
├── performance/           # Benchmarks and load tests
│   ├── node-loading/      # Node loading performance
│   ├── search/            # Search performance
│   └── validation/        # Validation speed
├── fixtures/              # Test data
│   ├── factories/         # Object factories
│   ├── nodes/             # Sample node definitions
│   └── workflows/         # Sample workflows
├── setup/                 # Global configuration
│   ├── global-setup.ts
│   └── test-environment.ts
└── utils/                 # Test helpers
    ├── builders/          # Test data builders
    ├── mocks/            # Mock implementations
    └── assertions/        # Custom assertions
```

## Testing Layers

### 1. Unit Tests (70% of tests)

**Focus**: Individual components in isolation

**Key Areas**:
- **Services**: Config validators, expression validators, property filters
- **Parsers**: Node parser, property extractor
- **Database**: Repository methods with mocked SQLite
- **MCP Handlers**: Individual tool handlers

**Example**:
```typescript
describe('ConfigValidator', () => {
  it('should validate required fields', () => {
    const validator = new ConfigValidator();
    const result = validator.validate('nodes-base.slack', {
      resource: 'message',
      operation: 'post'
    });
    expect(result.errors).toContain('channel is required');
  });
});
```

### 2. Integration Tests (20% of tests)

**Focus**: Component interactions and external dependencies

**Key Areas**:
- **MCP Protocol**: JSON-RPC compliance, session management
- **n8n API**: CRUD operations, authentication, error handling
- **Database Operations**: Complex queries, transactions
- **Node Loading**: Package loading and parsing pipeline

**Example**:
```typescript
describe('MCP Server Integration', () => {
  let server: MCPServer;
  let client: MCPClient;
  
  beforeEach(async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    server = new MCPServer();
    client = new MCPClient();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
  });
  
  it('should handle complete tool call cycle', async () => {
    const response = await client.callTool('list_nodes', { limit: 10 });
    expect(response.nodes).toHaveLength(10);
  });
});
```

### 3. End-to-End Tests (10% of tests)

**Focus**: Testing MCP server with real n8n instance to simulate AI agent interactions

**Key Components**:
- **n8n Instance**: Docker-based n8n for test isolation
- **Browser Automation**: Playwright for initial n8n setup
- **MCP Client**: Simulated AI agent sending protocol messages
- **Real Operations**: Actual workflow creation and execution

#### E2E Test Infrastructure

**1. Docker Compose Setup**

For E2E testing, we'll use the simplest official n8n setup with SQLite (default database):

```yaml
# tests/e2e/docker-compose.yml
version: '3.8'

volumes:
  n8n_data:

services:
  n8n:
    image: docker.n8n.io/n8nio/n8n
    container_name: n8n-test
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      # Disable auth for testing
      - N8N_BASIC_AUTH_ACTIVE=false
      # API configuration
      - N8N_PUBLIC_API_ENDPOINT=http://localhost:5678/api
      - N8N_PUBLIC_API_DISABLED=false
      # Basic settings
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=test
      - WEBHOOK_URL=http://localhost:5678/
      - GENERIC_TIMEZONE=UTC
      # Metrics for monitoring
      - N8N_METRICS=true
      # Executions data retention (keep for tests)
      - EXECUTIONS_DATA_SAVE_ON_ERROR=all
      - EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
      - EXECUTIONS_DATA_SAVE_ON_PROGRESS=true
    volumes:
      - n8n_data:/home/node/.n8n
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:5678/healthz"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 30s
```

For more complex testing scenarios requiring PostgreSQL:

```yaml
# tests/e2e/docker-compose.postgres.yml
version: '3.8'

volumes:
  db_storage:
  n8n_storage:

services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=n8n_test_password
      - POSTGRES_DB=n8n
    volumes:
      - db_storage:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -h localhost -U n8n -d n8n']
      interval: 5s
      timeout: 5s
      retries: 10

  n8n:
    image: docker.n8n.io/n8nio/n8n
    container_name: n8n-test
    restart: unless-stopped
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=n8n_test_password
      # Other settings same as above
      - N8N_BASIC_AUTH_ACTIVE=false
      - N8N_PUBLIC_API_ENDPOINT=http://localhost:5678/api
      - N8N_PUBLIC_API_DISABLED=false
    ports:
      - 5678:5678
    volumes:
      - n8n_storage:/home/node/.n8n
    depends_on:
      postgres:
        condition: service_healthy
```

**2. n8n Setup Automation**
```typescript
// tests/e2e/setup/n8n-setup.ts
import { chromium, Browser, Page } from 'playwright';
import { execSync } from 'child_process';

export class N8nTestSetup {
  private browser: Browser;
  private page: Page;
  
  async setup(): Promise<{ apiKey: string; instanceUrl: string }> {
    // Start n8n with Docker Compose
    execSync('docker-compose -f tests/e2e/docker-compose.yml up -d');
    
    // Wait for n8n to be ready
    await this.waitForN8n();
    
    // Set up admin account via browser
    this.browser = await chromium.launch();
    this.page = await this.browser.newPage();
    
    await this.page.goto('http://localhost:5678');
    
    // Complete setup wizard
    await this.completeSetupWizard();
    
    // Generate API key
    const apiKey = await this.generateApiKey();
    
    await this.browser.close();
    
    return {
      apiKey,
      instanceUrl: 'http://localhost:5678'
    };
  }
  
  private async completeSetupWizard() {
    // Fill admin email
    await this.page.fill('input[name="email"]', 'test@example.com');
    await this.page.fill('input[name="password"]', 'TestPassword123!');
    await this.page.fill('input[name="firstName"]', 'Test');
    await this.page.fill('input[name="lastName"]', 'Admin');
    
    await this.page.click('button[type="submit"]');
    
    // Skip optional steps
    await this.page.click('button:has-text("Skip")');
  }
  
  private async generateApiKey(): Promise<string> {
    // Navigate to API settings
    await this.page.goto('http://localhost:5678/settings/api');
    
    // Generate new API key
    await this.page.click('button:has-text("Create API Key")');
    
    // Copy the key
    const apiKey = await this.page.textContent('.api-key-display');
    
    return apiKey!;
  }
  
  async teardown() {
    execSync('docker-compose -f tests/e2e/docker-compose.yml down -v');
  }
}
```

**3. MCP E2E Test Suite**
```typescript
// tests/e2e/mcp-ai-agent-simulation.test.ts
import { MCPClient, InMemoryTransport } from '@modelcontextprotocol/sdk';
import { N8nTestSetup } from './setup/n8n-setup';
import { MCPServer } from '../../src/mcp/server';

describe('MCP Server E2E - AI Agent Simulation', () => {
  let n8nSetup: N8nTestSetup;
  let mcpServer: MCPServer;
  let mcpClient: MCPClient;
  let n8nConfig: { apiKey: string; instanceUrl: string };
  
  beforeAll(async () => {
    // Set up real n8n instance
    n8nSetup = new N8nTestSetup();
    n8nConfig = await n8nSetup.setup();
    
    // Configure MCP server with real n8n
    process.env.N8N_API_KEY = n8nConfig.apiKey;
    process.env.N8N_API_URL = n8nConfig.instanceUrl;
    
    // Start MCP server
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    mcpServer = new MCPServer();
    mcpClient = new MCPClient();
    
    await mcpServer.connect(serverTransport);
    await mcpClient.connect(clientTransport);
    
    // Initialize session
    await mcpClient.initialize();
  }, 60000); // 60s timeout for setup
  
  afterAll(async () => {
    await n8nSetup.teardown();
  });
  
  describe('AI Agent Workflow Creation Scenario', () => {
    it('should complete full workflow creation as an AI agent would', async () => {
      // 1. AI Agent: "I need to create a workflow that posts to Slack when a webhook is received"
      
      // Search for webhook trigger
      const webhookSearch = await mcpClient.callTool('search_nodes', {
        query: 'webhook trigger'
      });
      expect(webhookSearch.content[0].text).toContain('n8n-nodes-base.webhook');
      
      // Get webhook node details
      const webhookInfo = await mcpClient.callTool('get_node_essentials', {
        nodeType: 'n8n-nodes-base.webhook'
      });
      
      // Search for Slack node
      const slackSearch = await mcpClient.callTool('search_nodes', {
        query: 'slack message'
      });
      
      // Get Slack node configuration template
      const slackTemplate = await mcpClient.callTool('get_node_for_task', {
        task: 'send_slack_message'
      });
      
      // Create the workflow
      const createResult = await mcpClient.callTool('n8n_create_workflow', {
        name: 'Webhook to Slack',
        nodes: [
          {
            id: 'webhook',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 1.1,
            position: [250, 300],
            parameters: {
              path: 'test-webhook',
              method: 'POST'
            }
          },
          {
            id: 'slack',
            name: 'Slack',
            type: 'n8n-nodes-base.slack',
            typeVersion: 2.2,
            position: [450, 300],
            parameters: {
              resource: 'message',
              operation: 'post',
              channel: '#general',
              text: '={{ $json.message }}'
            }
          }
        ],
        connections: {
          'webhook': {
            'main': [
              [
                {
                  node: 'slack',
                  type: 'main',
                  index: 0
                }
              ]
            ]
          }
        }
      });
      
      const workflowId = JSON.parse(createResult.content[0].text).id;
      
      // Validate the workflow
      const validation = await mcpClient.callTool('n8n_validate_workflow', {
        id: workflowId
      });
      expect(JSON.parse(validation.content[0].text).isValid).toBe(true);
      
      // Activate the workflow
      await mcpClient.callTool('n8n_update_partial_workflow', {
        id: workflowId,
        operations: [
          {
            type: 'updateSettings',
            settings: { active: true }
          }
        ]
      });
      
      // Test webhook execution
      const webhookUrl = `${n8nConfig.instanceUrl}/webhook/test-webhook`;
      const triggerResult = await mcpClient.callTool('n8n_trigger_webhook_workflow', {
        webhookUrl,
        httpMethod: 'POST',
        data: { message: 'Hello from E2E test!' }
      });
      
      expect(triggerResult.content[0].text).toContain('success');
    });
  });
  
  describe('AI Agent Workflow Management Scenario', () => {
    it('should list, modify, and manage workflows', async () => {
      // List existing workflows
      const listResult = await mcpClient.callTool('n8n_list_workflows', {
        limit: 10
      });
      
      const workflows = JSON.parse(listResult.content[0].text).data;
      expect(workflows.length).toBeGreaterThan(0);
      
      // Get details of first workflow
      const workflowId = workflows[0].id;
      const detailsResult = await mcpClient.callTool('n8n_get_workflow_structure', {
        id: workflowId
      });
      
      // Update workflow with a new node
      const updateResult = await mcpClient.callTool('n8n_update_partial_workflow', {
        id: workflowId,
        operations: [
          {
            type: 'addNode',
            node: {
              id: 'setData',
              name: 'Set Data',
              type: 'n8n-nodes-base.set',
              typeVersion: 3.4,
              position: [350, 300],
              parameters: {
                mode: 'manual',
                fields: {
                  values: [
                    {
                      name: 'timestamp',
                      value: '={{ $now }}'
                    }
                  ]
                }
              }
            }
          }
        ]
      });
      
      expect(JSON.parse(updateResult.content[0].text).success).toBe(true);
    });
  });
  
  describe('AI Agent Error Handling Scenario', () => {
    it('should handle and recover from errors gracefully', async () => {
      // Try to create an invalid workflow
      const invalidResult = await mcpClient.callTool('n8n_create_workflow', {
        name: 'Invalid Workflow',
        nodes: [
          {
            id: 'invalid',
            name: 'Invalid Node',
            type: 'n8n-nodes-base.nonexistent',
            typeVersion: 1,
            position: [250, 300],
            parameters: {}
          }
        ],
        connections: {}
      });
      
      // Should get validation error
      expect(invalidResult.content[0].text).toContain('error');
      
      // AI agent should understand the error and search for correct node
      const searchResult = await mcpClient.callTool('search_nodes', {
        query: 'http request'
      });
      
      // Get proper node configuration
      const nodeInfo = await mcpClient.callTool('get_node_essentials', {
        nodeType: 'n8n-nodes-base.httpRequest'
      });
      
      // Retry with correct configuration
      const retryResult = await mcpClient.callTool('n8n_create_workflow', {
        name: 'Corrected Workflow',
        nodes: [
          {
            id: 'httpRequest',
            name: 'HTTP Request',
            type: 'n8n-nodes-base.httpRequest',
            typeVersion: 4.2,
            position: [250, 300],
            parameters: {
              method: 'GET',
              url: 'https://api.example.com/data'
            }
          }
        ],
        connections: {}
      });
      
      expect(JSON.parse(retryResult.content[0].text).id).toBeDefined();
    });
  });
  
  describe('AI Agent Template Usage Scenario', () => {
    it('should discover and use workflow templates', async () => {
      // Search for templates
      const templateSearch = await mcpClient.callTool('search_templates', {
        query: 'webhook slack'
      });
      
      // Get template details
      const templates = JSON.parse(templateSearch.content[0].text);
      if (templates.length > 0) {
        const templateId = templates[0].id;
        const templateDetails = await mcpClient.callTool('get_template', {
          templateId
        });
        
        // AI agent would analyze and potentially use this template
        expect(templateDetails.content[0].text).toContain('nodes');
      }
      
      // Get curated templates for specific task
      const curatedTemplates = await mcpClient.callTool('get_templates_for_task', {
        task: 'webhook_processing'
      });
      
      expect(curatedTemplates.content[0].text).toBeDefined();
    });
  });
});
```

**4. Test Scenarios Coverage**

```typescript
// tests/e2e/scenarios/comprehensive-tool-test.ts
export const E2E_TEST_SCENARIOS = {
  // Node Discovery Tools
  nodeDiscovery: [
    { tool: 'list_nodes', args: { limit: 10, category: 'trigger' } },
    { tool: 'search_nodes', args: { query: 'webhook', mode: 'FUZZY' } },
    { tool: 'get_node_info', args: { nodeType: 'n8n-nodes-base.webhook' } },
    { tool: 'get_node_essentials', args: { nodeType: 'n8n-nodes-base.slack' } },
    { tool: 'get_node_documentation', args: { nodeType: 'n8n-nodes-base.httpRequest' } },
    { tool: 'list_ai_tools', args: {} },
    { tool: 'get_node_as_tool_info', args: { nodeType: 'n8n-nodes-base.openAi' } }
  ],
  
  // Validation Tools
  validation: [
    { tool: 'validate_node_operation', args: { /* node config */ } },
    { tool: 'validate_workflow', args: { /* workflow */ } },
    { tool: 'get_property_dependencies', args: { nodeType: 'n8n-nodes-base.httpRequest' } }
  ],
  
  // n8n Management Tools
  workflowManagement: [
    { tool: 'n8n_create_workflow', args: { /* workflow data */ } },
    { tool: 'n8n_list_workflows', args: { limit: 10 } },
    { tool: 'n8n_get_workflow', args: { id: '${workflowId}' } },
    { tool: 'n8n_update_partial_workflow', args: { /* update ops */ } },
    { tool: 'n8n_validate_workflow', args: { id: '${workflowId}' } },
    { tool: 'n8n_trigger_webhook_workflow', args: { /* webhook data */ } },
    { tool: 'n8n_list_executions', args: { workflowId: '${workflowId}' } }
  ],
  
  // Template Tools
  templates: [
    { tool: 'search_templates', args: { query: 'automation' } },
    { tool: 'get_templates_for_task', args: { task: 'webhook_processing' } },
    { tool: 'list_node_templates', args: { nodeTypes: ['n8n-nodes-base.webhook'] } }
  ],
  
  // System Tools
  system: [
    { tool: 'n8n_health_check', args: {} },
    { tool: 'n8n_diagnostic', args: { verbose: true } },
    { tool: 'tools_documentation', args: { topic: 'overview' } }
  ]
};
```

### 4. Performance Tests

**Focus**: Speed and resource usage

**Benchmarks**:
- Node loading: < 50ms for 500+ nodes
- Search operations: < 100ms for complex queries
- Validation: < 10ms per node configuration
- Memory usage: < 500MB for full node set

## Mock Strategies

### 1. Database Mocking

```typescript
// tests/unit/database/__mocks__/better-sqlite3.ts
export class MockDatabase {
  private data = new Map<string, any[]>();
  
  prepare(sql: string) {
    return {
      all: () => this.executeQuery(sql),
      run: (params: any) => this.executeInsert(sql, params),
      get: () => this.executeQuery(sql)[0]
    };
  }
}
```

### 2. n8n API Mocking

```typescript
// tests/utils/mocks/n8n-api.mock.ts
export const mockN8nAPI = {
  workflows: {
    create: jest.fn().mockResolvedValue({ id: 'mock-id' }),
    update: jest.fn().mockResolvedValue({ success: true }),
    delete: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue({ /* workflow data */ })
  }
};
```

### 3. Node Package Mocking

```typescript
// tests/utils/mocks/node-loader.mock.ts
export class MockNodeLoader {
  async loadFromPackage(packageName: string) {
    return mockNodeDefinitions[packageName] || [];
  }
}
```

## MCP-Specific Testing

### Protocol Compliance

```typescript
describe('JSON-RPC 2.0 Compliance', () => {
  it('should reject requests without jsonrpc version', async () => {
    const response = await transport.send({
      id: 1,
      method: 'tools/call',
      // Missing jsonrpc: "2.0"
    });
    
    expect(response.error.code).toBe(-32600);
  });
  
  it('should handle batch requests', async () => {
    const batch = [
      { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      { jsonrpc: '2.0', id: 2, method: 'resources/list' }
    ];
    
    const responses = await transport.send(batch);
    expect(responses).toHaveLength(2);
  });
});
```

### Large Dataset Handling

```typescript
describe('Performance with 525+ nodes', () => {
  it('should list all nodes within 1 second', async () => {
    const start = performance.now();
    const response = await client.callTool('list_nodes', { limit: 1000 });
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(1000);
    expect(response.nodes.length).toBeGreaterThan(525);
  });
  
  it('should handle concurrent searches', async () => {
    const searches = Array.from({ length: 50 }, (_, i) => 
      client.callTool('search_nodes', { query: `test${i}` })
    );
    
    const results = await Promise.all(searches);
    expect(results).toHaveLength(50);
  });
});
```

## Test Data Management

### Factory Pattern

```typescript
// tests/fixtures/factories/node.factory.ts
export const nodeFactory = Factory.define<NodeDefinition>(() => ({
  name: faker.random.word(),
  displayName: faker.random.words(2),
  description: faker.lorem.sentence(),
  version: 1,
  defaults: { name: faker.random.word() },
  inputs: ['main'],
  outputs: ['main'],
  properties: []
}));

// Usage
const slackNode = nodeFactory.build({
  name: 'slack',
  displayName: 'Slack',
  properties: [/* specific properties */]
});
```

### Builder Pattern

```typescript
// tests/utils/builders/workflow.builder.ts
export class WorkflowBuilder {
  private nodes: INode[] = [];
  private connections: IConnections = {};
  
  addNode(node: Partial<INode>): this {
    this.nodes.push(createNode(node));
    return this;
  }
  
  connect(from: string, to: string): this {
    // Add connection logic
    return this;
  }
  
  build(): IWorkflow {
    return {
      nodes: this.nodes,
      connections: this.connections,
      name: 'Test Workflow'
    };
  }
}

// Usage
const workflow = new WorkflowBuilder()
  .addNode({ type: 'n8n-nodes-base.webhook' })
  .addNode({ type: 'n8n-nodes-base.slack' })
  .connect('webhook', 'slack')
  .build();
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
        test-suite: [unit, integration, e2e]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ${{ matrix.test-suite }} tests
        run: npm run test:${{ matrix.test-suite }}
        env:
          NODE_ENV: test
      
      - name: Upload coverage
        if: matrix.test-suite == 'unit'
        uses: codecov/codecov-action@v3

  performance:
    runs-on: ubuntu-latest
    steps:
      - name: Run benchmarks
        run: npm run bench
      
      - name: Compare with baseline
        uses: benchmark-action/github-action-benchmark@v1
        with:
          tool: 'vitest'
          output-file-path: bench-results.json
          fail-on-alert: true
```

## Coverage Goals and Enforcement

### Target Coverage

| Component | Target | Priority |
|-----------|--------|----------|
| Config Validators | 95% | Critical |
| Workflow Validators | 95% | Critical |
| MCP Handlers | 90% | High |
| Database Layer | 85% | High |
| API Client | 85% | High |
| Parsers | 80% | Medium |
| Utils | 75% | Low |
| **Overall** | **80%** | - |

### Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.test.ts',
        'scripts/'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
        // Per-file thresholds
        'src/services/config-validator.ts': {
          lines: 95,
          functions: 95,
          branches: 90
        }
      }
    }
  }
});
```

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Fix existing test failures
- [ ] Migrate from Jest to Vitest
- [ ] Set up test infrastructure (mocks, factories, builders)
- [ ] Create CI/CD pipeline
- [ ] Establish coverage baseline

### Phase 2: Core Unit Tests (Weeks 3-4)
- [ ] Test validators (config, workflow, expression)
- [ ] Test parsers and extractors
- [ ] Test database repositories
- [ ] Test MCP handlers
- [ ] **Target**: 50% coverage

### Phase 3: Integration Tests (Weeks 5-6)
- [ ] MCP protocol compliance tests
- [ ] n8n API integration tests
- [ ] Database integration tests
- [ ] Node loading pipeline tests
- [ ] **Target**: 70% coverage

### Phase 4: E2E and Performance (Weeks 7-8)
- [ ] Set up Docker Compose environment for n8n
- [ ] Implement Playwright automation for n8n setup
- [ ] Create comprehensive AI agent simulation tests
- [ ] Test all MCP tools with real n8n instance
- [ ] Performance benchmarks with real data
- [ ] Load testing with concurrent AI agents
- [ ] **Target**: 80%+ coverage

### Phase 5: Maintenance (Ongoing)
- [ ] Monitor flaky tests
- [ ] Update tests for new features
- [ ] Performance regression tracking
- [ ] Documentation updates

## Testing Best Practices

### 1. Test Naming Convention
```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should [expected behavior] when [condition]', () => {
      // Test implementation
    });
  });
});
```

### 2. AAA Pattern
```typescript
it('should validate Slack configuration', () => {
  // Arrange
  const config = { resource: 'message', operation: 'post' };
  const validator = new ConfigValidator();
  
  // Act
  const result = validator.validate('nodes-base.slack', config);
  
  // Assert
  expect(result.isValid).toBe(false);
  expect(result.errors).toContain('channel is required');
});
```

### 3. Test Isolation
- Each test must be independent
- Use beforeEach/afterEach for setup/cleanup
- Avoid shared state between tests

### 4. Performance Limits
- Unit tests: < 10ms
- Integration tests: < 1s
- E2E tests: < 10s
- Fail tests that exceed limits

### 5. Error Testing
```typescript
it('should handle network failures gracefully', async () => {
  mockAPI.simulateNetworkError();
  
  await expect(client.createWorkflow(workflow))
    .rejects.toThrow('Network error');
  
  // Verify retry was attempted
  expect(mockAPI.calls).toBe(3);
});
```

## Debugging and Troubleshooting

### Test Utilities

```typescript
// tests/utils/debug.ts
export function logMCPTransaction(request: any, response: any) {
  if (process.env.DEBUG_MCP) {
    console.log('MCP Request:', JSON.stringify(request, null, 2));
    console.log('MCP Response:', JSON.stringify(response, null, 2));
  }
}

export function dumpTestDatabase(db: Database) {
  if (process.env.DEBUG_DB) {
    console.log('Database State:', db.prepare('SELECT * FROM nodes').all());
  }
}
```

### Common Issues and Solutions

1. **Flaky Tests**: Use explicit waits, increase timeouts, check for race conditions
2. **Memory Leaks**: Ensure proper cleanup in afterEach hooks
3. **Slow Tests**: Profile with Vitest's built-in profiler, optimize database queries
4. **Type Errors**: Keep test types in sync with source types

## E2E Testing Prerequisites and Considerations

### Prerequisites

1. **Docker and Docker Compose**: Required for running n8n test instances
2. **Playwright**: For browser automation during n8n setup
3. **Sufficient Resources**: E2E tests require more CPU/memory than unit tests
4. **Network Access**: Some tests may require internet access for external APIs

### E2E Test Environment Management

```typescript
// tests/e2e/config/test-environment.ts
export class E2ETestEnvironment {
  static async setup() {
    // Ensure clean state
    await this.cleanup();
    
    // Start services
    await this.startN8n();
    await this.waitForHealthy();
    
    // Initialize test data
    await this.seedDatabase();
  }
  
  static async cleanup() {
    // Remove any existing containers
    execSync('docker-compose -f tests/e2e/docker-compose.yml down -v', {
      stdio: 'ignore'
    });
  }
  
  static async startN8n() {
    // Start with specific test configuration
    execSync('docker-compose -f tests/e2e/docker-compose.yml up -d', {
      env: {
        ...process.env,
        N8N_VERSION: process.env.TEST_N8N_VERSION || 'latest'
      }
    });
  }
  
  private async waitForN8n() {
    const maxRetries = 30;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch('http://localhost:5678/healthz');
        if (response.ok) return;
      } catch (e) {
        // Not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error('n8n failed to start within timeout');
  }
}
```

### CI/CD Considerations for E2E Tests

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on:
  pull_request:
    types: [opened, synchronize]
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    # No need for service containers - we'll use Docker Compose
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install chromium
      
      - name: Build MCP server
        run: npm run build
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true
          E2E_TEST_TIMEOUT: 300000 # 5 minutes per test
      
      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-test-results
          path: |
            tests/e2e/screenshots/
            tests/e2e/videos/
            tests/e2e/logs/
```

### E2E Test Data Management

```typescript
// tests/e2e/fixtures/test-workflows.ts
export const TEST_WORKFLOWS = {
  simple: {
    name: 'Simple Webhook to HTTP',
    description: 'Basic workflow for testing',
    nodes: [/* ... */]
  },
  
  complex: {
    name: 'Multi-Branch Conditional',
    description: 'Tests complex routing and conditions',
    nodes: [/* ... */]
  },
  
  aiEnabled: {
    name: 'AI Agent Workflow',
    description: 'Workflow with AI tools for agent testing',
    nodes: [/* ... */]
  }
};

// tests/e2e/utils/workflow-assertions.ts
export async function assertWorkflowExecutionSuccess(
  client: MCPClient,
  workflowId: string,
  timeout = 30000
) {
  const start = Date.now();
  let execution;
  
  while (Date.now() - start < timeout) {
    const result = await client.callTool('n8n_list_executions', {
      workflowId,
      limit: 1
    });
    
    const executions = JSON.parse(result.content[0].text).data;
    if (executions.length > 0 && executions[0].status === 'success') {
      execution = executions[0];
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  expect(execution).toBeDefined();
  expect(execution.status).toBe('success');
  return execution;
}
```

### E2E Test Isolation

Each E2E test should be completely isolated:

```typescript
// tests/e2e/helpers/test-isolation.ts
export function isolatedTest(
  name: string,
  fn: (context: E2ETestContext) => Promise<void>
) {
  return async () => {
    const context = await E2ETestContext.create();
    
    try {
      await fn(context);
    } finally {
      // Clean up all resources created during test
      await context.cleanup();
    }
  };
}

// Usage
it('should handle concurrent workflow executions', 
  isolatedTest(async (context) => {
    const { client, n8nUrl } = context;
    
    // Test implementation...
  })
);
```

## Success Metrics

### Quantitative Metrics
- Test coverage: 80%+
- Test execution time: < 5 minutes for full suite
- Flaky test rate: < 1%
- CI/CD success rate: > 95%

### Qualitative Metrics
- Developer confidence in making changes
- Reduced bug escape rate
- Faster feature development
- Improved code quality

## Conclusion

This comprehensive testing strategy provides a clear path from 2.45% to 80%+ test coverage. By following this phased approach, the n8n-MCP project will achieve:

1. **Reliability**: Catch bugs before production
2. **Maintainability**: Refactor with confidence
3. **Performance**: Track and prevent regressions
4. **Documentation**: Tests serve as living documentation
5. **Developer Experience**: Fast, reliable tests enable rapid iteration

The investment in testing infrastructure will pay dividends in reduced bugs, faster development cycles, and increased confidence in the codebase.