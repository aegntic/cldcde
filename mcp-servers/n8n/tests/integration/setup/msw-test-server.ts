import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';
import type { RequestHandler } from 'msw';
import { handlers as defaultHandlers } from '../../mocks/n8n-api/handlers';

/**
 * MSW server instance for integration tests
 * This is separate from the global MSW setup to allow for more control
 * in integration tests that may need specific handler configurations
 */
export const integrationTestServer = setupServer(...defaultHandlers);

/**
 * Enhanced server controls for integration tests
 */
export const mswTestServer = {
  /**
   * Start the server with specific options
   */
  start: (options?: {
    onUnhandledRequest?: 'error' | 'warn' | 'bypass';
    quiet?: boolean;
  }) => {
    integrationTestServer.listen({
      onUnhandledRequest: options?.onUnhandledRequest || 'warn',
    });

    if (!options?.quiet && process.env.MSW_DEBUG === 'true') {
      integrationTestServer.events.on('request:start', ({ request }) => {
        console.log('[Integration MSW] %s %s', request.method, request.url);
      });
    }
  },

  /**
   * Stop the server
   */
  stop: () => {
    integrationTestServer.close();
  },

  /**
   * Reset handlers to defaults
   */
  reset: () => {
    integrationTestServer.resetHandlers();
  },

  /**
   * Add handlers for a specific test
   */
  use: (...handlers: RequestHandler[]) => {
    integrationTestServer.use(...handlers);
  },

  /**
   * Replace all handlers (useful for isolated test scenarios)
   */
  replaceAll: (...handlers: RequestHandler[]) => {
    integrationTestServer.resetHandlers(...handlers);
  },

  /**
   * Wait for a specific number of requests to be made
   */
  waitForRequests: (count: number, timeout = 5000): Promise<Request[]> => {
    return new Promise((resolve, reject) => {
      const requests: Request[] = [];
      let timeoutId: NodeJS.Timeout | null = null;
      
      // Event handler function to allow cleanup
      const handleRequest = ({ request }: { request: Request }) => {
        requests.push(request);
        if (requests.length === count) {
          cleanup();
          resolve(requests);
        }
      };
      
      // Cleanup function to remove listener and clear timeout
      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        integrationTestServer.events.removeListener('request:match', handleRequest);
      };
      
      // Set timeout
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout waiting for ${count} requests. Got ${requests.length}`));
      }, timeout);
      
      // Add event listener
      integrationTestServer.events.on('request:match', handleRequest);
    });
  },

  /**
   * Verify no unhandled requests were made
   */
  verifyNoUnhandledRequests: (): Promise<void> => {
    return new Promise((resolve, reject) => {
      let hasUnhandled = false;
      let timeoutId: NodeJS.Timeout | null = null;
      
      const handleUnhandled = ({ request }: { request: Request }) => {
        hasUnhandled = true;
        cleanup();
        reject(new Error(`Unhandled request: ${request.method} ${request.url}`));
      };
      
      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        integrationTestServer.events.removeListener('request:unhandled', handleUnhandled);
      };
      
      // Add event listener
      integrationTestServer.events.on('request:unhandled', handleUnhandled);

      // Give a small delay to allow any pending requests
      timeoutId = setTimeout(() => {
        cleanup();
        if (!hasUnhandled) {
          resolve();
        }
      }, 100);
    });
  },

  /**
   * Create a scoped server for a specific test
   * Automatically starts and stops the server
   */
  withScope: async <T>(
    handlers: RequestHandler[],
    testFn: () => Promise<T>
  ): Promise<T> => {
    // Save current handlers
    const currentHandlers = [...defaultHandlers];
    
    try {
      // Replace with scoped handlers
      integrationTestServer.resetHandlers(...handlers);
      
      // Run the test
      return await testFn();
    } finally {
      // Restore original handlers
      integrationTestServer.resetHandlers(...currentHandlers);
    }
  }
};

/**
 * Integration test utilities for n8n API mocking
 */
export const n8nApiMock = {
  /**
   * Mock a successful workflow creation
   */
  mockWorkflowCreate: (response?: any) => {
    return http.post('*/api/v1/workflows', async ({ request }) => {
      const body = await request.json() as Record<string, any>;
      return HttpResponse.json({
        data: {
          id: 'test-workflow-id',
          ...body,
          ...response,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }, { status: 201 });
    });
  },

  /**
   * Mock a workflow validation endpoint
   */
  mockWorkflowValidate: (validationResult: { valid: boolean; errors?: any[] }) => {
    return http.post('*/api/v1/workflows/validate', async () => {
      return HttpResponse.json(validationResult);
    });
  },

  /**
   * Mock webhook execution
   */
  mockWebhookExecution: (webhookPath: string, response: any) => {
    return http.all(`*/webhook/${webhookPath}`, async ({ request }) => {
      const body = request.body ? await request.json() : undefined;
      
      // Simulate webhook processing
      return HttpResponse.json({
        ...response,
        webhookReceived: {
          path: webhookPath,
          method: request.method,
          body,
          timestamp: new Date().toISOString()
        }
      });
    });
  },

  /**
   * Mock API error responses
   */
  mockError: (endpoint: string, error: { status: number; message: string; code?: string }) => {
    return http.all(endpoint, () => {
      return HttpResponse.json(
        {
          message: error.message,
          code: error.code || 'ERROR',
          timestamp: new Date().toISOString()
        },
        { status: error.status }
      );
    });
  },

  /**
   * Mock rate limiting
   */
  mockRateLimit: (endpoint: string) => {
    let requestCount = 0;
    const limit = 5;
    
    return http.all(endpoint, () => {
      requestCount++;
      
      if (requestCount > limit) {
        return HttpResponse.json(
          {
            message: 'Rate limit exceeded',
            code: 'RATE_LIMIT',
            retryAfter: 60
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(limit),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Date.now() + 60000)
            }
          }
        );
      }
      
      return HttpResponse.json({ success: true });
    });
  }
};

/**
 * Test data builders for integration tests
 */
export const testDataBuilders = {
  /**
   * Build a workflow for testing
   */
  workflow: (overrides?: any) => ({
    name: 'Integration Test Workflow',
    nodes: [
      {
        id: 'start',
        name: 'Start',
        type: 'n8n-nodes-base.start',
        typeVersion: 1,
        position: [250, 300],
        parameters: {}
      }
    ],
    connections: {},
    settings: {},
    active: false,
    ...overrides
  }),

  /**
   * Build an execution result
   */
  execution: (workflowId: string, overrides?: any) => ({
    id: `exec_${Date.now()}`,
    workflowId,
    status: 'success',
    mode: 'manual',
    startedAt: new Date().toISOString(),
    stoppedAt: new Date().toISOString(),
    data: {
      resultData: {
        runData: {}
      }
    },
    ...overrides
  })
};