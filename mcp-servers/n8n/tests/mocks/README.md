# MSW (Mock Service Worker) Setup for n8n API

This directory contains the MSW infrastructure for mocking n8n API responses in tests.

## Structure

```
mocks/
├── n8n-api/
│   ├── handlers.ts       # Default MSW handlers for n8n API endpoints
│   ├── data/            # Mock data for responses
│   │   ├── workflows.ts # Mock workflow data and factories
│   │   ├── executions.ts # Mock execution data and factories
│   │   └── credentials.ts # Mock credential data
│   └── index.ts         # Central exports
```

## Usage

### Basic Usage (Automatic)

MSW is automatically initialized for all tests via `vitest.config.ts`. The default handlers will intercept all n8n API requests.

```typescript
// Your test file
import { describe, it, expect } from 'vitest';
import { N8nApiClient } from '@/services/n8n-api-client';

describe('My Integration Test', () => {
  it('should work with mocked n8n API', async () => {
    const client = new N8nApiClient({ baseUrl: 'http://localhost:5678' });
    
    // This will hit the MSW mock, not the real API
    const workflows = await client.getWorkflows();
    
    expect(workflows).toBeDefined();
  });
});
```

### Custom Handlers for Specific Tests

```typescript
import { useHandlers, http, HttpResponse } from '@tests/setup/msw-setup';

it('should handle custom response', async () => {
  // Add custom handler for this test only
  useHandlers(
    http.get('*/api/v1/workflows', () => {
      return HttpResponse.json({
        data: [{ id: 'custom-workflow', name: 'Custom' }]
      });
    })
  );
  
  // Your test code here
});
```

### Using Factory Functions

```typescript
import { workflowFactory, executionFactory } from '@tests/mocks/n8n-api';

it('should test with factory data', async () => {
  const workflow = workflowFactory.simple('n8n-nodes-base.httpRequest', {
    method: 'POST',
    url: 'https://example.com/api'
  });
  
  useHandlers(
    http.get('*/api/v1/workflows/test-id', () => {
      return HttpResponse.json({ data: workflow });
    })
  );
  
  // Your test code here
});
```

### Integration Test Server

For integration tests that need more control:

```typescript
import { mswTestServer, n8nApiMock } from '@tests/integration/setup/msw-test-server';

describe('Integration Tests', () => {
  beforeAll(() => {
    mswTestServer.start({ onUnhandledRequest: 'error' });
  });
  
  afterAll(() => {
    mswTestServer.stop();
  });
  
  afterEach(() => {
    mswTestServer.reset();
  });
  
  it('should test workflow creation', async () => {
    // Use helper to mock workflow creation
    mswTestServer.use(
      n8nApiMock.mockWorkflowCreate({
        id: 'new-workflow',
        name: 'Created Workflow'
      })
    );
    
    // Your test code here
  });
});
```

### Debugging

Enable MSW debug logging:

```bash
MSW_DEBUG=true npm test
```

This will log all intercepted requests and responses.

### Best Practices

1. **Use factories for test data**: Don't hardcode test data, use the provided factories
2. **Reset handlers between tests**: This is done automatically, but be aware of it
3. **Be specific with handlers**: Use specific URLs/patterns to avoid conflicts
4. **Test error scenarios**: Use the error helpers to test error handling
5. **Verify unhandled requests**: In integration tests, verify no unexpected requests were made

### Common Patterns

#### Testing Success Scenarios
```typescript
useHandlers(
  http.get('*/api/v1/workflows/:id', ({ params }) => {
    return HttpResponse.json({
      data: workflowFactory.custom({ id: params.id as string })
    });
  })
);
```

#### Testing Error Scenarios
```typescript
useHandlers(
  http.get('*/api/v1/workflows/:id', () => {
    return HttpResponse.json(
      { message: 'Not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  })
);
```

#### Testing Pagination
```typescript
const workflows = Array.from({ length: 150 }, (_, i) => 
  workflowFactory.custom({ id: `workflow_${i}` })
);

useHandlers(
  http.get('*/api/v1/workflows', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const cursor = url.searchParams.get('cursor');
    
    const start = cursor ? parseInt(cursor) : 0;
    const data = workflows.slice(start, start + limit);
    
    return HttpResponse.json({
      data,
      nextCursor: start + limit < workflows.length ? String(start + limit) : null
    });
  })
);
```