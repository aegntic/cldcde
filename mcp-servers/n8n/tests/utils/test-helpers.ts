import { vi } from 'vitest';
import { WorkflowNode, Workflow } from '@/types/n8n-api';

// Use any type for INodeDefinition since it's from n8n-workflow package
type INodeDefinition = any;

/**
 * Common test utilities and helpers
 */

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Create a mock node definition with default values
 */
export function createMockNodeDefinition(overrides?: Partial<INodeDefinition>): INodeDefinition {
  return {
    displayName: 'Mock Node',
    name: 'mockNode',
    group: ['transform'],
    version: 1,
    description: 'A mock node for testing',
    defaults: {
      name: 'Mock Node',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [],
    ...overrides
  };
}

/**
 * Create a mock workflow node
 */
export function createMockNode(overrides?: Partial<WorkflowNode>): WorkflowNode {
  return {
    id: 'mock-node-id',
    name: 'Mock Node',
    type: 'n8n-nodes-base.mockNode',
    typeVersion: 1,
    position: [0, 0],
    parameters: {},
    ...overrides
  };
}

/**
 * Create a mock workflow
 */
export function createMockWorkflow(overrides?: Partial<Workflow>): Workflow {
  return {
    id: 'mock-workflow-id',
    name: 'Mock Workflow',
    active: false,
    nodes: [],
    connections: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Mock console methods for tests
 */
export function mockConsole() {
  const originalConsole = { ...console };
  
  const mocks = {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {})
  };
  
  return {
    mocks,
    restore: () => {
      Object.entries(mocks).forEach(([key, mock]) => {
        mock.mockRestore();
      });
    }
  };
}

/**
 * Create a deferred promise for testing async operations
 */
export function createDeferred<T>() {
  let resolve: (value: T) => void;
  let reject: (error: any) => void;
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  
  return {
    promise,
    resolve: resolve!,
    reject: reject!
  };
}

/**
 * Helper to test error throwing
 */
export async function expectToThrowAsync(
  fn: () => Promise<any>,
  errorMatcher?: string | RegExp | Error
) {
  let thrown = false;
  let error: any;
  
  try {
    await fn();
  } catch (e) {
    thrown = true;
    error = e;
  }
  
  if (!thrown) {
    throw new Error('Expected function to throw');
  }
  
  if (errorMatcher) {
    if (typeof errorMatcher === 'string') {
      expect(error.message).toContain(errorMatcher);
    } else if (errorMatcher instanceof RegExp) {
      expect(error.message).toMatch(errorMatcher);
    } else if (errorMatcher instanceof Error) {
      expect(error).toEqual(errorMatcher);
    }
  }
  
  return error;
}

/**
 * Create a test database with initial data
 */
export function createTestDatabase(data: Record<string, any[]> = {}) {
  const db = new Map<string, any[]>();
  
  // Initialize with default tables
  db.set('nodes', data.nodes || []);
  db.set('templates', data.templates || []);
  db.set('tools_documentation', data.tools_documentation || []);
  
  // Add any additional tables from data
  Object.entries(data).forEach(([table, rows]) => {
    if (!db.has(table)) {
      db.set(table, rows);
    }
  });
  
  return {
    prepare: vi.fn((sql: string) => {
      const tableName = extractTableName(sql);
      const rows = db.get(tableName) || [];
      
      return {
        all: vi.fn(() => rows),
        get: vi.fn((params: any) => {
          if (typeof params === 'string') {
            return rows.find((r: any) => r.id === params);
          }
          return rows[0];
        }),
        run: vi.fn((params: any) => {
          rows.push(params);
          return { changes: 1, lastInsertRowid: rows.length };
        })
      };
    }),
    exec: vi.fn(),
    close: vi.fn(),
    transaction: vi.fn((fn: Function) => fn()),
    pragma: vi.fn()
  };
}

/**
 * Extract table name from SQL query
 */
function extractTableName(sql: string): string {
  const patterns = [
    /FROM\s+(\w+)/i,
    /INTO\s+(\w+)/i,
    /UPDATE\s+(\w+)/i,
    /TABLE\s+(\w+)/i
  ];
  
  for (const pattern of patterns) {
    const match = sql.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return 'nodes';
}

/**
 * Create a mock HTTP response
 */
export function createMockResponse(data: any, status = 200) {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: {}
  };
}

/**
 * Create a mock HTTP error
 */
export function createMockHttpError(message: string, status = 500, data?: any) {
  const error: any = new Error(message);
  error.isAxiosError = true;
  error.response = {
    data: data || { message },
    status,
    statusText: status === 500 ? 'Internal Server Error' : 'Error',
    headers: {},
    config: {}
  };
  return error;
}

/**
 * Helper to test MCP tool calls
 */
export async function testMCPToolCall(
  tool: any,
  args: any,
  expectedResult?: any
) {
  const result = await tool.handler(args);
  
  if (expectedResult !== undefined) {
    expect(result).toEqual(expectedResult);
  }
  
  return result;
}

/**
 * Create a mock MCP context
 */
export function createMockMCPContext() {
  return {
    request: vi.fn(),
    notify: vi.fn(),
    expose: vi.fn(),
    onClose: vi.fn()
  };
}

/**
 * Snapshot serializer for dates
 */
export const dateSerializer = {
  test: (value: any) => value instanceof Date,
  serialize: (value: Date) => value.toISOString()
};

/**
 * Snapshot serializer for functions
 */
export const functionSerializer = {
  test: (value: any) => typeof value === 'function',
  serialize: () => '[Function]'
};

/**
 * Clean up test environment
 */
export function cleanupTestEnvironment() {
  vi.clearAllMocks();
  vi.clearAllTimers();
  vi.useRealTimers();
}