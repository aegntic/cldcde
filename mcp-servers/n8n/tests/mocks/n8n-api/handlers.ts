import { http, HttpResponse, RequestHandler } from 'msw';
import { mockWorkflows } from './data/workflows';
import { mockExecutions } from './data/executions';
import { mockCredentials } from './data/credentials';

// Base URL for n8n API (will be overridden by actual URL in tests)
const API_BASE = process.env.N8N_API_URL || 'http://localhost:5678';

/**
 * Default handlers for n8n API endpoints
 * These can be overridden in specific tests using server.use()
 */
export const handlers: RequestHandler[] = [
  // Health check endpoint
  http.get('*/api/v1/health', () => {
    return HttpResponse.json({
      status: 'ok',
      version: '1.103.2',
      features: {
        workflows: true,
        executions: true,
        credentials: true,
        webhooks: true,
      }
    });
  }),

  // Workflow endpoints
  http.get('*/api/v1/workflows', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const cursor = url.searchParams.get('cursor');
    const active = url.searchParams.get('active');
    
    let filtered = mockWorkflows;
    
    // Filter by active status if provided
    if (active !== null) {
      filtered = filtered.filter(w => w.active === (active === 'true'));
    }
    
    // Simple pagination simulation
    const startIndex = cursor ? parseInt(cursor) : 0;
    const paginatedData = filtered.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < filtered.length;
    const nextCursor = hasMore ? String(startIndex + limit) : null;
    
    return HttpResponse.json({
      data: paginatedData,
      nextCursor,
      hasMore
    });
  }),

  http.get('*/api/v1/workflows/:id', ({ params }) => {
    const workflow = mockWorkflows.find(w => w.id === params.id);
    
    if (!workflow) {
      return HttpResponse.json(
        { message: 'Workflow not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({ data: workflow });
  }),

  http.post('*/api/v1/workflows', async ({ request }) => {
    const body = await request.json() as any;
    
    // Validate required fields
    if (!body.name || !body.nodes || !body.connections) {
      return HttpResponse.json(
        { 
          message: 'Validation failed', 
          errors: {
            name: !body.name ? 'Name is required' : undefined,
            nodes: !body.nodes ? 'Nodes are required' : undefined,
            connections: !body.connections ? 'Connections are required' : undefined,
          },
          code: 'VALIDATION_ERROR' 
        },
        { status: 400 }
      );
    }
    
    const newWorkflow = {
      id: `workflow_${Date.now()}`,
      name: body.name,
      active: body.active || false,
      nodes: body.nodes,
      connections: body.connections,
      settings: body.settings || {},
      tags: body.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versionId: '1'
    };
    
    mockWorkflows.push(newWorkflow);
    
    return HttpResponse.json({ data: newWorkflow }, { status: 201 });
  }),

  http.patch('*/api/v1/workflows/:id', async ({ params, request }) => {
    const workflowIndex = mockWorkflows.findIndex(w => w.id === params.id);
    
    if (workflowIndex === -1) {
      return HttpResponse.json(
        { message: 'Workflow not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    
    const body = await request.json() as any;
    const updatedWorkflow = {
      ...mockWorkflows[workflowIndex],
      ...body,
      id: params.id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
      versionId: String(parseInt(mockWorkflows[workflowIndex].versionId) + 1)
    };
    
    mockWorkflows[workflowIndex] = updatedWorkflow;
    
    return HttpResponse.json({ data: updatedWorkflow });
  }),

  http.delete('*/api/v1/workflows/:id', ({ params }) => {
    const workflowIndex = mockWorkflows.findIndex(w => w.id === params.id);
    
    if (workflowIndex === -1) {
      return HttpResponse.json(
        { message: 'Workflow not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    
    mockWorkflows.splice(workflowIndex, 1);
    
    return HttpResponse.json({ success: true });
  }),

  // Execution endpoints
  http.get('*/api/v1/executions', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const cursor = url.searchParams.get('cursor');
    const workflowId = url.searchParams.get('workflowId');
    const status = url.searchParams.get('status');
    
    let filtered = mockExecutions;
    
    // Filter by workflow ID if provided
    if (workflowId) {
      filtered = filtered.filter(e => e.workflowId === workflowId);
    }
    
    // Filter by status if provided
    if (status) {
      filtered = filtered.filter(e => e.status === status);
    }
    
    // Simple pagination simulation
    const startIndex = cursor ? parseInt(cursor) : 0;
    const paginatedData = filtered.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < filtered.length;
    const nextCursor = hasMore ? String(startIndex + limit) : null;
    
    return HttpResponse.json({
      data: paginatedData,
      nextCursor,
      hasMore
    });
  }),

  http.get('*/api/v1/executions/:id', ({ params }) => {
    const execution = mockExecutions.find(e => e.id === params.id);
    
    if (!execution) {
      return HttpResponse.json(
        { message: 'Execution not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({ data: execution });
  }),

  http.delete('*/api/v1/executions/:id', ({ params }) => {
    const executionIndex = mockExecutions.findIndex(e => e.id === params.id);
    
    if (executionIndex === -1) {
      return HttpResponse.json(
        { message: 'Execution not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    
    mockExecutions.splice(executionIndex, 1);
    
    return HttpResponse.json({ success: true });
  }),

  // Webhook endpoints (dynamic handling)
  http.all('*/webhook/*', async ({ request }) => {
    const url = new URL(request.url);
    const method = request.method;
    const body = request.body ? await request.json() : undefined;
    
    // Log webhook trigger in debug mode
    if (process.env.MSW_DEBUG === 'true') {
      console.log('[MSW] Webhook triggered:', {
        url: url.pathname,
        method,
        body
      });
    }
    
    // Return success response by default
    return HttpResponse.json({
      success: true,
      webhookUrl: url.pathname,
      method,
      timestamp: new Date().toISOString(),
      data: body
    });
  }),

  // Catch-all for unhandled API routes (helps identify missing handlers)
  http.all('*/api/*', ({ request }) => {
    console.warn('[MSW] Unhandled API request:', request.method, request.url);
    
    return HttpResponse.json(
      { 
        message: 'Not implemented in mock', 
        code: 'NOT_IMPLEMENTED',
        path: new URL(request.url).pathname,
        method: request.method
      },
      { status: 501 }
    );
  }),
];

/**
 * Dynamic handler registration helpers
 */
export const dynamicHandlers = {
  /**
   * Add a workflow that will be returned by GET requests
   */
  addWorkflow: (workflow: any) => {
    mockWorkflows.push(workflow);
  },

  /**
   * Clear all mock workflows
   */
  clearWorkflows: () => {
    mockWorkflows.length = 0;
  },

  /**
   * Add an execution that will be returned by GET requests
   */
  addExecution: (execution: any) => {
    mockExecutions.push(execution);
  },

  /**
   * Clear all mock executions
   */
  clearExecutions: () => {
    mockExecutions.length = 0;
  },

  /**
   * Reset all mock data to initial state
   */
  resetAll: () => {
    // Reset arrays to initial state (implementation depends on data modules)
    mockWorkflows.length = 0;
    mockExecutions.length = 0;
    mockCredentials.length = 0;
  }
};