import { beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers as defaultHandlers } from '../../mocks/n8n-api/handlers';

// Create the MSW server instance with default handlers
export const server = setupServer(...defaultHandlers);

// Enable request logging in development/debugging
if (process.env.MSW_DEBUG === 'true' || process.env.TEST_DEBUG === 'true') {
  server.events.on('request:start', ({ request }) => {
    console.log('[MSW] %s %s', request.method, request.url);
  });

  server.events.on('request:match', ({ request }) => {
    console.log('[MSW] Request matched:', request.method, request.url);
  });

  server.events.on('request:unhandled', ({ request }) => {
    console.warn('[MSW] Unhandled request:', request.method, request.url);
  });

  server.events.on('response:mocked', ({ request, response }) => {
    console.log('[MSW] Mocked response for %s %s: %d', 
      request.method, 
      request.url, 
      response.status
    );
  });
}

// Start server before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: process.env.CI === 'true' ? 'error' : 'warn',
  });
});

// Reset handlers after each test (important for test isolation)
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
  // Remove all event listeners to prevent memory leaks
  server.events.removeAllListeners();
  
  // Close the server
  server.close();
});

// Export the server and utility functions for use in integration tests
export { server as integrationServer };
export { http, HttpResponse } from 'msw';

/**
 * Utility function to add temporary handlers for specific tests
 * @param handlers Array of MSW request handlers
 */
export function useHandlers(...handlers: any[]) {
  server.use(...handlers);
}

/**
 * Utility to wait for a specific request to be made
 * Useful for testing async operations
 */
export function waitForRequest(method: string, url: string | RegExp, timeout = 5000): Promise<Request> {
  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout;
    
    const handler = ({ request }: { request: Request }) => {
      if (request.method === method && 
          (typeof url === 'string' ? request.url === url : url.test(request.url))) {
        clearTimeout(timeoutId);
        server.events.removeListener('request:match', handler);
        resolve(request);
      }
    };
    
    // Set timeout
    timeoutId = setTimeout(() => {
      server.events.removeListener('request:match', handler);
      reject(new Error(`Timeout waiting for ${method} request to ${url}`));
    }, timeout);
    
    server.events.on('request:match', handler);
  });
}