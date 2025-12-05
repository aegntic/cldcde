import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { N8nApiClient } from '@/services/n8n-api-client';
import { WorkflowValidator } from '@/services/workflow-validator';
import { NodeRepository } from '@/database/node-repository';
import {
  N8nApiError,
  N8nAuthenticationError,
  N8nNotFoundError,
  N8nValidationError,
  N8nRateLimitError,
  N8nServerError,
} from '@/utils/n8n-errors';
import { ExecutionStatus } from '@/types/n8n-api';

// Mock dependencies
vi.mock('@/services/n8n-api-client');
vi.mock('@/services/workflow-validator');
vi.mock('@/database/node-repository');
vi.mock('@/config/n8n-api', () => ({
  getN8nApiConfig: vi.fn()
}));
vi.mock('@/services/n8n-validation', () => ({
  validateWorkflowStructure: vi.fn(),
  hasWebhookTrigger: vi.fn(),
  getWebhookUrl: vi.fn(),
}));
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
  Logger: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  })),
  LogLevel: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
  }
}));

describe('handlers-n8n-manager', () => {
  let mockApiClient: any;
  let mockRepository: any;
  let mockValidator: any;
  let handlers: any;
  let getN8nApiConfig: any;
  let n8nValidation: any;

  // Helper function to create test data
  const createTestWorkflow = (overrides = {}) => ({
    id: 'test-workflow-id',
    name: 'Test Workflow',
    active: true,
    nodes: [
      {
        id: 'node1',
        name: 'Start',
        type: 'n8n-nodes-base.start',
        typeVersion: 1,
        position: [100, 100],
        parameters: {},
      },
    ],
    connections: {},
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    tags: [],
    settings: {},
    ...overrides,
  });

  const createTestExecution = (overrides = {}) => ({
    id: 'exec-123',
    workflowId: 'test-workflow-id',
    status: ExecutionStatus.SUCCESS,
    startedAt: '2024-01-01T00:00:00Z',
    stoppedAt: '2024-01-01T00:01:00Z',
    ...overrides,
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup mock API client
    mockApiClient = {
      createWorkflow: vi.fn(),
      getWorkflow: vi.fn(),
      updateWorkflow: vi.fn(),
      deleteWorkflow: vi.fn(),
      listWorkflows: vi.fn(),
      triggerWebhook: vi.fn(),
      getExecution: vi.fn(),
      listExecutions: vi.fn(),
      deleteExecution: vi.fn(),
      healthCheck: vi.fn(),
    };

    // Setup mock repository
    mockRepository = {
      getNodeByType: vi.fn(),
      getAllNodes: vi.fn(),
    };

    // Setup mock validator
    mockValidator = {
      validateWorkflow: vi.fn(),
    };

    // Import mocked modules
    getN8nApiConfig = (await import('@/config/n8n-api')).getN8nApiConfig;
    n8nValidation = await import('@/services/n8n-validation');
    
    // Mock the API config
    vi.mocked(getN8nApiConfig).mockReturnValue({
      baseUrl: 'https://n8n.test.com',
      apiKey: 'test-key',
      timeout: 30000,
      maxRetries: 3,
    });

    // Mock validation functions
    vi.mocked(n8nValidation.validateWorkflowStructure).mockReturnValue([]);
    vi.mocked(n8nValidation.hasWebhookTrigger).mockReturnValue(false);
    vi.mocked(n8nValidation.getWebhookUrl).mockReturnValue(null);

    // Mock the N8nApiClient constructor
    vi.mocked(N8nApiClient).mockImplementation(() => mockApiClient);

    // Mock WorkflowValidator constructor
    vi.mocked(WorkflowValidator).mockImplementation(() => mockValidator);

    // Mock NodeRepository constructor
    vi.mocked(NodeRepository).mockImplementation(() => mockRepository);

    // Import handlers module after setting up mocks
    handlers = await import('@/mcp/handlers-n8n-manager');
  });

  afterEach(() => {
    // Clean up singleton state by accessing the module internals
    if (handlers) {
      // Access the module's internal state via the getN8nApiClient function
      const clientGetter = handlers.getN8nApiClient;
      if (clientGetter) {
        // Force reset by setting config to null first
        vi.mocked(getN8nApiConfig).mockReturnValue(null);
        clientGetter();
      }
    }
  });

  describe('getN8nApiClient', () => {
    it('should create new client when config is available', () => {
      const client = handlers.getN8nApiClient();
      expect(client).toBe(mockApiClient);
      expect(N8nApiClient).toHaveBeenCalledWith({
        baseUrl: 'https://n8n.test.com',
        apiKey: 'test-key',
        timeout: 30000,
        maxRetries: 3,
      });
    });

    it('should return null when config is not available', () => {
      vi.mocked(getN8nApiConfig).mockReturnValue(null);
      const client = handlers.getN8nApiClient();
      expect(client).toBeNull();
    });

    it('should reuse existing client when config has not changed', () => {
      // First call creates the client
      const client1 = handlers.getN8nApiClient();
      
      // Second call should reuse the same client
      const client2 = handlers.getN8nApiClient();
      
      expect(client1).toBe(client2);
      expect(N8nApiClient).toHaveBeenCalledTimes(1);
    });

    it('should create new client when config URL changes', () => {
      // First call with initial config
      const client1 = handlers.getN8nApiClient();
      expect(N8nApiClient).toHaveBeenCalledTimes(1);
      
      // Change the config URL
      vi.mocked(getN8nApiConfig).mockReturnValue({
        baseUrl: 'https://different.test.com',
        apiKey: 'test-key',
        timeout: 30000,
        maxRetries: 3,
      });
      
      // Second call should create a new client
      const client2 = handlers.getN8nApiClient();
      expect(N8nApiClient).toHaveBeenCalledTimes(2);
      
      // Verify the second call used the new config
      expect(N8nApiClient).toHaveBeenNthCalledWith(2, {
        baseUrl: 'https://different.test.com',
        apiKey: 'test-key',
        timeout: 30000,
        maxRetries: 3,
      });
    });
  });

  describe('handleCreateWorkflow', () => {
    it('should create workflow successfully', async () => {
      const testWorkflow = createTestWorkflow();
      const input = {
        name: 'Test Workflow',
        nodes: testWorkflow.nodes,
        connections: testWorkflow.connections,
      };

      mockApiClient.createWorkflow.mockResolvedValue(testWorkflow);

      const result = await handlers.handleCreateWorkflow(input);

      expect(result).toEqual({
        success: true,
        data: testWorkflow,
        message: 'Workflow "Test Workflow" created successfully with ID: test-workflow-id',
      });
      expect(mockApiClient.createWorkflow).toHaveBeenCalledWith(input);
      expect(n8nValidation.validateWorkflowStructure).toHaveBeenCalledWith(input);
    });

    it('should handle validation errors', async () => {
      const input = { invalid: 'data' };

      const result = await handlers.handleCreateWorkflow(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid input');
      expect(result.details).toHaveProperty('errors');
    });

    it('should handle workflow structure validation failures', async () => {
      const input = {
        name: 'Test Workflow',
        nodes: [],
        connections: {},
      };

      vi.mocked(n8nValidation.validateWorkflowStructure).mockReturnValue([
        'Workflow must have at least one node',
      ]);

      const result = await handlers.handleCreateWorkflow(input);

      expect(result).toEqual({
        success: false,
        error: 'Workflow validation failed',
        details: { errors: ['Workflow must have at least one node'] },
      });
    });

    it('should handle API errors', async () => {
      const input = {
        name: 'Test Workflow',
        nodes: [{ 
          id: 'node1', 
          name: 'Start', 
          type: 'n8n-nodes-base.start',
          typeVersion: 1,
          position: [100, 100],
          parameters: {}
        }],
        connections: {},
      };

      const apiError = new N8nValidationError('Invalid workflow data', {
        field: 'nodes',
        message: 'Node configuration invalid',
      });
      mockApiClient.createWorkflow.mockRejectedValue(apiError);

      const result = await handlers.handleCreateWorkflow(input);

      expect(result).toEqual({
        success: false,
        error: 'Invalid request: Invalid workflow data',
        code: 'VALIDATION_ERROR',
        details: { field: 'nodes', message: 'Node configuration invalid' },
      });
    });

    it('should handle API not configured error', async () => {
      vi.mocked(getN8nApiConfig).mockReturnValue(null);

      const result = await handlers.handleCreateWorkflow({ name: 'Test', nodes: [], connections: {} });

      expect(result).toEqual({
        success: false,
        error: 'n8n API not configured. Please set N8N_API_URL and N8N_API_KEY environment variables.',
      });
    });
  });

  describe('handleGetWorkflow', () => {
    it('should get workflow successfully', async () => {
      const testWorkflow = createTestWorkflow();
      mockApiClient.getWorkflow.mockResolvedValue(testWorkflow);

      const result = await handlers.handleGetWorkflow({ id: 'test-workflow-id' });

      expect(result).toEqual({
        success: true,
        data: testWorkflow,
      });
      expect(mockApiClient.getWorkflow).toHaveBeenCalledWith('test-workflow-id');
    });

    it('should handle not found error', async () => {
      const notFoundError = new N8nNotFoundError('Workflow', 'non-existent');
      mockApiClient.getWorkflow.mockRejectedValue(notFoundError);

      const result = await handlers.handleGetWorkflow({ id: 'non-existent' });

      expect(result).toEqual({
        success: false,
        error: 'Workflow with ID non-existent not found',
        code: 'NOT_FOUND',
      });
    });

    it('should handle invalid input', async () => {
      const result = await handlers.handleGetWorkflow({ notId: 'test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid input');
    });
  });

  describe('handleGetWorkflowDetails', () => {
    it('should get workflow details with execution stats', async () => {
      const testWorkflow = createTestWorkflow();
      const testExecutions = [
        createTestExecution({ status: ExecutionStatus.SUCCESS }),
        createTestExecution({ status: ExecutionStatus.ERROR }),
        createTestExecution({ status: ExecutionStatus.SUCCESS }),
      ];

      mockApiClient.getWorkflow.mockResolvedValue(testWorkflow);
      mockApiClient.listExecutions.mockResolvedValue({
        data: testExecutions,
        nextCursor: null,
      });

      const result = await handlers.handleGetWorkflowDetails({ id: 'test-workflow-id' });

      expect(result).toEqual({
        success: true,
        data: {
          workflow: testWorkflow,
          executionStats: {
            totalExecutions: 3,
            successCount: 2,
            errorCount: 1,
            lastExecutionTime: '2024-01-01T00:00:00Z',
          },
          hasWebhookTrigger: false,
          webhookPath: null,
        },
      });
    });

    it('should handle workflow with webhook trigger', async () => {
      const testWorkflow = createTestWorkflow({
        nodes: [
          {
            id: 'webhook1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 1,
            position: [100, 100],
            parameters: { path: 'test-webhook' },
          },
        ],
      });

      mockApiClient.getWorkflow.mockResolvedValue(testWorkflow);
      mockApiClient.listExecutions.mockResolvedValue({ data: [], nextCursor: null });
      vi.mocked(n8nValidation.hasWebhookTrigger).mockReturnValue(true);
      vi.mocked(n8nValidation.getWebhookUrl).mockReturnValue('/webhook/test-webhook');

      const result = await handlers.handleGetWorkflowDetails({ id: 'test-workflow-id' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('hasWebhookTrigger', true);
      expect(result.data).toHaveProperty('webhookPath', '/webhook/test-webhook');
    });
  });

  describe('handleListWorkflows', () => {
    it('should list workflows with minimal data', async () => {
      const workflows = [
        createTestWorkflow({ id: 'wf1', name: 'Workflow 1', nodes: [{}, {}] }),
        createTestWorkflow({ id: 'wf2', name: 'Workflow 2', active: false, nodes: [{}, {}, {}] }),
      ];

      mockApiClient.listWorkflows.mockResolvedValue({
        data: workflows,
        nextCursor: 'next-page-cursor',
      });

      const result = await handlers.handleListWorkflows({
        limit: 50,
        active: true,
      });

      expect(result).toEqual({
        success: true,
        data: {
          workflows: [
            {
              id: 'wf1',
              name: 'Workflow 1',
              active: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
              tags: [],
              nodeCount: 2,
            },
            {
              id: 'wf2',
              name: 'Workflow 2',
              active: false,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
              tags: [],
              nodeCount: 3,
            },
          ],
          returned: 2,
          nextCursor: 'next-page-cursor',
          hasMore: true,
          _note: 'More workflows available. Use cursor to get next page.',
        },
      });
    });
  });

  describe('handleValidateWorkflow', () => {
    it('should validate workflow from n8n instance', async () => {
      const testWorkflow = createTestWorkflow();
      const mockNodeRepository = {} as any; // Mock repository

      mockApiClient.getWorkflow.mockResolvedValue(testWorkflow);
      mockValidator.validateWorkflow.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [
          {
            nodeName: 'node1',
            message: 'Consider using newer version',
            details: { currentVersion: 1, latestVersion: 2 },
          },
        ],
        suggestions: ['Add error handling to workflow'],
        statistics: {
          totalNodes: 1,
          enabledNodes: 1,
          triggerNodes: 1,
          validConnections: 0,
          invalidConnections: 0,
          expressionsValidated: 0,
        },
      });

      const result = await handlers.handleValidateWorkflow(
        { id: 'test-workflow-id', options: { validateNodes: true } },
        mockNodeRepository
      );

      expect(result).toEqual({
        success: true,
        data: {
          valid: true,
          workflowId: 'test-workflow-id',
          workflowName: 'Test Workflow',
          summary: {
            totalNodes: 1,
            enabledNodes: 1,
            triggerNodes: 1,
            validConnections: 0,
            invalidConnections: 0,
            expressionsValidated: 0,
            errorCount: 0,
            warningCount: 1,
          },
          warnings: [
            {
              node: 'node1',
              message: 'Consider using newer version',
              details: { currentVersion: 1, latestVersion: 2 },
            },
          ],
          suggestions: ['Add error handling to workflow'],
        },
      });
    });
  });

  describe('handleHealthCheck', () => {
    it('should check health successfully', async () => {
      const healthData = {
        status: 'ok',
        instanceId: 'n8n-instance-123',
        n8nVersion: '1.0.0',
        features: ['webhooks', 'api'],
      };

      mockApiClient.healthCheck.mockResolvedValue(healthData);

      const result = await handlers.handleHealthCheck();

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        status: 'ok',
        instanceId: 'n8n-instance-123',
        n8nVersion: '1.0.0',
        features: ['webhooks', 'api'],
        apiUrl: 'https://n8n.test.com',
      });
    });

    it('should handle API errors', async () => {
      const apiError = new N8nServerError('Service unavailable');
      mockApiClient.healthCheck.mockRejectedValue(apiError);

      const result = await handlers.handleHealthCheck();

      expect(result).toEqual({
        success: false,
        error: 'n8n server error. Please try again later or contact support.',
        code: 'SERVER_ERROR',
        details: {
          apiUrl: 'https://n8n.test.com',
          hint: 'Check if n8n is running and API is enabled',
        },
      });
    });
  });

  describe('handleDiagnostic', () => {
    it('should provide diagnostic information', async () => {
      const healthData = {
        status: 'ok',
        n8nVersion: '1.0.0',
      };
      mockApiClient.healthCheck.mockResolvedValue(healthData);

      // Set environment variables for the test
      process.env.N8N_API_URL = 'https://n8n.test.com';
      process.env.N8N_API_KEY = 'test-key';

      const result = await handlers.handleDiagnostic({ params: { arguments: {} } });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        environment: {
          N8N_API_URL: 'https://n8n.test.com',
          N8N_API_KEY: '***configured***',
        },
        apiConfiguration: {
          configured: true,
          status: {
            configured: true,
            connected: true,
            version: '1.0.0',
          },
        },
        toolsAvailability: {
          documentationTools: {
            count: 22,
            enabled: true,
          },
          managementTools: {
            count: 16,
            enabled: true,
          },
          totalAvailable: 38,
        },
      });

      // Clean up env vars
      process.env.N8N_API_URL = undefined as any;
      process.env.N8N_API_KEY = undefined as any;
    });
  });

  describe('Error handling', () => {
    it('should handle authentication errors', async () => {
      const authError = new N8nAuthenticationError('Invalid API key');
      mockApiClient.getWorkflow.mockRejectedValue(authError);

      const result = await handlers.handleGetWorkflow({ id: 'test-id' });

      expect(result).toEqual({
        success: false,
        error: 'Failed to authenticate with n8n. Please check your API key.',
        code: 'AUTHENTICATION_ERROR',
      });
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = new N8nRateLimitError(60);
      mockApiClient.listWorkflows.mockRejectedValue(rateLimitError);

      const result = await handlers.handleListWorkflows({});

      expect(result).toEqual({
        success: false,
        error: 'Too many requests. Please wait a moment and try again.',
        code: 'RATE_LIMIT_ERROR',
      });
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Something went wrong');
      mockApiClient.createWorkflow.mockRejectedValue(genericError);

      const result = await handlers.handleCreateWorkflow({
        name: 'Test',
        nodes: [],
        connections: {},
      });

      expect(result).toEqual({
        success: false,
        error: 'Something went wrong',
      });
    });
  });
});