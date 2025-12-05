# n8n-nodes-base Mock

This directory contains comprehensive mocks for n8n packages used in unit tests.

## n8n-nodes-base Mock

The `n8n-nodes-base.ts` mock provides a complete testing infrastructure for code that depends on n8n nodes.

### Features

1. **Pre-configured Node Types**
   - `webhook` - Trigger node with webhook functionality
   - `httpRequest` - HTTP request node with mock responses
   - `slack` - Slack integration with all resources and operations
   - `function` - JavaScript code execution node
   - `noOp` - Pass-through utility node
   - `merge` - Data stream merging node
   - `if` - Conditional branching node
   - `switch` - Multi-output routing node

2. **Flexible Mock Behavior**
   - Override node execution logic
   - Customize node descriptions
   - Add custom nodes dynamically
   - Reset all mocks between tests

### Basic Usage

```typescript
import { vi } from 'vitest';

// Mock the module
vi.mock('n8n-nodes-base', () => import('../__mocks__/n8n-nodes-base'));

// In your test
import { getNodeTypes, mockNodeBehavior, resetAllMocks } from '../__mocks__/n8n-nodes-base';

describe('Your test', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('should get node description', () => {
    const registry = getNodeTypes();
    const slackNode = registry.getByName('slack');
    
    expect(slackNode?.description.name).toBe('slack');
  });
});
```

### Advanced Usage

#### Override Node Behavior

```typescript
mockNodeBehavior('httpRequest', {
  execute: async function(this: IExecuteFunctions) {
    return [[{ json: { custom: 'response' } }]];
  }
});
```

#### Add Custom Nodes

```typescript
import { registerMockNode } from '../__mocks__/n8n-nodes-base';

const customNode = {
  description: {
    displayName: 'Custom Node',
    name: 'customNode',
    group: ['transform'],
    version: 1,
    description: 'A custom test node',
    defaults: { name: 'Custom' },
    inputs: ['main'],
    outputs: ['main'],
    properties: []
  },
  execute: async function() {
    return [[{ json: { result: 'custom' } }]];
  }
};

registerMockNode('customNode', customNode);
```

#### Mock Execution Context

```typescript
const mockContext = {
  getInputData: vi.fn(() => [{ json: { test: 'data' } }]),
  getNodeParameter: vi.fn((name: string) => {
    const params = {
      method: 'POST',
      url: 'https://api.example.com'
    };
    return params[name];
  }),
  getCredentials: vi.fn(async () => ({ apiKey: 'test-key' })),
  helpers: {
    returnJsonArray: vi.fn(),
    httpRequest: vi.fn()
  }
};

const result = await node.execute.call(mockContext);
```

### Mock Structure

Each mock node implements the `INodeType` interface with:

- `description`: Complete node metadata including properties, inputs/outputs, credentials
- `execute`: Mock implementation for regular nodes (returns `INodeExecutionData[][]`)
- `webhook`: Mock implementation for trigger nodes (returns webhook data)

### Testing Patterns

1. **Unit Testing Node Logic**
   ```typescript
   const node = registry.getByName('slack');
   const result = await node.execute.call(mockContext);
   expect(result[0][0].json.ok).toBe(true);
   ```

2. **Testing Node Properties**
   ```typescript
   const node = registry.getByName('httpRequest');
   const methodProp = node.description.properties.find(p => p.name === 'method');
   expect(methodProp.options).toHaveLength(6);
   ```

3. **Testing Conditional Nodes**
   ```typescript
   const ifNode = registry.getByName('if');
   const [trueOutput, falseOutput] = await ifNode.execute.call(mockContext);
   expect(trueOutput).toHaveLength(2);
   expect(falseOutput).toHaveLength(1);
   ```

### Utilities

- `resetAllMocks()` - Clear all mock function calls
- `mockNodeBehavior(name, overrides)` - Override specific node behavior
- `registerMockNode(name, node)` - Add new mock nodes
- `getNodeTypes()` - Get the node registry with `getByName` and `getByNameAndVersion`

### See Also

- `tests/unit/examples/using-n8n-nodes-base-mock.test.ts` - Complete usage examples
- `tests/unit/__mocks__/n8n-nodes-base.test.ts` - Mock test coverage