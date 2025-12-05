import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { N8nApiClient, N8nApiClientConfig } from '../../../src/services/n8n-api-client';
import { ExecutionStatus } from '../../../src/types/n8n-api';
import {
  N8nApiError,
  N8nAuthenticationError,
  N8nNotFoundError,
  N8nValidationError,
  N8nRateLimitError,
  N8nServerError,
} from '../../../src/utils/n8n-errors';
import * as n8nValidation from '../../../src/services/n8n-validation';
import { logger } from '../../../src/utils/logger';

// Mock dependencies
vi.mock('axios');
vi.mock('../../../src/utils/logger');

// Mock the validation functions
vi.mock('../../../src/services/n8n-validation', () => ({
  cleanWorkflowForCreate: vi.fn((workflow) => workflow),
  cleanWorkflowForUpdate: vi.fn((workflow) => workflow),
}));

// We don't need to mock n8n-errors since we want the actual error transformation to work

describe('N8nApiClient', () => {
  let client: N8nApiClient;
  let mockAxiosInstance: any;
  
  const defaultConfig: N8nApiClientConfig = {
    baseUrl: 'https://n8n.example.com',
    apiKey: 'test-api-key',
    timeout: 30000,
    maxRetries: 3,
  };
  
  // Helper to create a proper axios error
  const createAxiosError = (config: any) => {
    const error = new Error(config.message || 'Request failed') as any;
    error.isAxiosError = true;
    error.config = {};
    if (config.response) {
      error.response = config.response;
    }
    if (config.request) {
      error.request = config.request;
    }
    return error;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock axios instance
    mockAxiosInstance = {
      defaults: { baseURL: 'https://n8n.example.com/api/v1' },
      interceptors: {
        request: { use: vi.fn() },
        response: { 
          use: vi.fn((onFulfilled, onRejected) => {
            // Store the interceptor handlers for later use
            mockAxiosInstance._responseInterceptor = { onFulfilled, onRejected };
            return 0;
          }) 
        },
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      request: vi.fn(),
      _responseInterceptor: null,
    };

    // Mock axios.create to return our mock instance
    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as any);
    vi.mocked(axios.get).mockResolvedValue({ status: 200, data: { status: 'ok' } });
    
    // Helper function to simulate axios error with interceptor
    mockAxiosInstance.simulateError = async (method: string, errorConfig: any) => {
      const axiosError = createAxiosError(errorConfig);
      
      mockAxiosInstance[method].mockImplementation(async () => {
        if (mockAxiosInstance._responseInterceptor?.onRejected) {
          // Pass error through the interceptor and ensure it's properly handled
          try {
            // The interceptor returns a rejected promise with the transformed error
            const transformedError = await mockAxiosInstance._responseInterceptor.onRejected(axiosError);
            // This shouldn't happen as onRejected should throw
            return Promise.reject(transformedError);
          } catch (error) {
            // This is the expected path - interceptor throws the transformed error
            return Promise.reject(error);
          }
        }
        return Promise.reject(axiosError);
      });
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with default configuration', () => {
      client = new N8nApiClient(defaultConfig);
      
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://n8n.example.com/api/v1',
        timeout: 30000,
        headers: {
          'X-N8N-API-KEY': 'test-api-key',
          'Content-Type': 'application/json',
        },
      });
    });

    it('should handle baseUrl without /api/v1', () => {
      client = new N8nApiClient({
        ...defaultConfig,
        baseUrl: 'https://n8n.example.com/',
      });
      
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://n8n.example.com/api/v1',
        })
      );
    });

    it('should handle baseUrl with /api/v1', () => {
      client = new N8nApiClient({
        ...defaultConfig,
        baseUrl: 'https://n8n.example.com/api/v1',
      });
      
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://n8n.example.com/api/v1',
        })
      );
    });

    it('should use custom timeout', () => {
      client = new N8nApiClient({
        ...defaultConfig,
        timeout: 60000,
      });
      
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 60000,
        })
      );
    });

    it('should setup request and response interceptors', () => {
      client = new N8nApiClient(defaultConfig);
      
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    beforeEach(() => {
      client = new N8nApiClient(defaultConfig);
    });

    it('should check health using healthz endpoint', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        status: 200,
        data: { status: 'ok' },
      });

      const result = await client.healthCheck();
      
      expect(axios.get).toHaveBeenCalledWith(
        'https://n8n.example.com/healthz',
        {
          timeout: 5000,
          validateStatus: expect.any(Function),
        }
      );
      expect(result).toEqual({ status: 'ok', features: {} });
    });

    it('should fallback to workflow list when healthz fails', async () => {
      vi.mocked(axios.get).mockRejectedValueOnce(new Error('healthz not found'));
      mockAxiosInstance.get.mockResolvedValue({ data: [] });

      const result = await client.healthCheck();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/workflows', { params: { limit: 1 } });
      expect(result).toEqual({ status: 'ok', features: {} });
    });

    it('should throw error when both health checks fail', async () => {
      vi.mocked(axios.get).mockRejectedValueOnce(new Error('healthz not found'));
      mockAxiosInstance.get.mockRejectedValue(new Error('API error'));

      await expect(client.healthCheck()).rejects.toThrow();
    });
  });

  describe('createWorkflow', () => {
    beforeEach(() => {
      client = new N8nApiClient(defaultConfig);
    });

    it('should create workflow successfully', async () => {
      const workflow = {
        name: 'Test Workflow',
        nodes: [],
        connections: {},
      };
      const createdWorkflow = { ...workflow, id: '123' };
      
      mockAxiosInstance.post.mockResolvedValue({ data: createdWorkflow });
      
      const result = await client.createWorkflow(workflow);
      
      expect(n8nValidation.cleanWorkflowForCreate).toHaveBeenCalledWith(workflow);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/workflows', workflow);
      expect(result).toEqual(createdWorkflow);
    });

    it('should handle creation error', async () => {
      const workflow = { name: 'Test', nodes: [], connections: {} };
      const error = { 
        message: 'Request failed',
        response: { status: 400, data: { message: 'Invalid workflow' } } 
      };
      
      await mockAxiosInstance.simulateError('post', error);
      
      try {
        await client.createWorkflow(workflow);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).toBeInstanceOf(N8nValidationError);
        expect((err as N8nValidationError).message).toBe('Invalid workflow');
        expect((err as N8nValidationError).statusCode).toBe(400);
      }
    });
  });

  describe('getWorkflow', () => {
    beforeEach(() => {
      client = new N8nApiClient(defaultConfig);
    });

    it('should get workflow successfully', async () => {
      const workflow = { id: '123', name: 'Test', nodes: [], connections: {} };
      mockAxiosInstance.get.mockResolvedValue({ data: workflow });
      
      const result = await client.getWorkflow('123');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/workflows/123');
      expect(result).toEqual(workflow);
    });

    it('should handle 404 error', async () => {
      const error = { 
        message: 'Request failed',
        response: { status: 404, data: { message: 'Not found' } } 
      };
      await mockAxiosInstance.simulateError('get', error);
      
      try {
        await client.getWorkflow('123');
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).toBeInstanceOf(N8nNotFoundError);
        expect((err as N8nNotFoundError).message).toContain('not found');
        expect((err as N8nNotFoundError).statusCode).toBe(404);
      }
    });
  });

  describe('updateWorkflow', () => {
    beforeEach(() => {
      client = new N8nApiClient(defaultConfig);
    });

    it('should update workflow using PUT method', async () => {
      const workflow = { name: 'Updated', nodes: [], connections: {} };
      const updatedWorkflow = { ...workflow, id: '123' };
      
      mockAxiosInstance.put.mockResolvedValue({ data: updatedWorkflow });
      
      const result = await client.updateWorkflow('123', workflow);
      
      expect(n8nValidation.cleanWorkflowForUpdate).toHaveBeenCalledWith(workflow);
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/workflows/123', workflow);
      expect(result).toEqual(updatedWorkflow);
    });

    it('should fallback to PATCH when PUT is not supported', async () => {
      const workflow = { name: 'Updated', nodes: [], connections: {} };
      const updatedWorkflow = { ...workflow, id: '123' };
      
      mockAxiosInstance.put.mockRejectedValue({ response: { status: 405 } });
      mockAxiosInstance.patch.mockResolvedValue({ data: updatedWorkflow });
      
      const result = await client.updateWorkflow('123', workflow);
      
      expect(mockAxiosInstance.put).toHaveBeenCalled();
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/workflows/123', workflow);
      expect(result).toEqual(updatedWorkflow);
    });

    it('should handle update error', async () => {
      const workflow = { name: 'Updated', nodes: [], connections: {} };
      const error = { 
        message: 'Request failed',
        response: { status: 400, data: { message: 'Invalid update' } } 
      };
      
      await mockAxiosInstance.simulateError('put', error);
      
      try {
        await client.updateWorkflow('123', workflow);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).toBeInstanceOf(N8nValidationError);
        expect((err as N8nValidationError).message).toBe('Invalid update');
        expect((err as N8nValidationError).statusCode).toBe(400);
      }
    });
  });

  describe('deleteWorkflow', () => {
    beforeEach(() => {
      client = new N8nApiClient(defaultConfig);
    });

    it('should delete workflow successfully', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: {} });
      
      await client.deleteWorkflow('123');
      
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/workflows/123');
    });

    it('should handle deletion error', async () => {
      const error = { 
        message: 'Request failed',
        response: { status: 404, data: { message: 'Not found' } } 
      };
      await mockAxiosInstance.simulateError('delete', error);
      
      try {
        await client.deleteWorkflow('123');
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).toBeInstanceOf(N8nNotFoundError);
        expect((err as N8nNotFoundError).message).toContain('not found');
        expect((err as N8nNotFoundError).statusCode).toBe(404);
      }
    });
  });

  describe('listWorkflows', () => {
    beforeEach(() => {
      client = new N8nApiClient(defaultConfig);
    });

    it('should list workflows with default params', async () => {
      const response = { data: [], nextCursor: null };
      mockAxiosInstance.get.mockResolvedValue({ data: response });
      
      const result = await client.listWorkflows();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/workflows', { params: {} });
      expect(result).toEqual(response);
    });

    it('should list workflows with custom params', async () => {
      const params = { limit: 10, active: true, tags: ['test'] };
      const response = { data: [], nextCursor: null };
      mockAxiosInstance.get.mockResolvedValue({ data: response });
      
      const result = await client.listWorkflows(params);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/workflows', { params });
      expect(result).toEqual(response);
    });
  });

  describe('getExecution', () => {
    beforeEach(() => {
      client = new N8nApiClient(defaultConfig);
    });

    it('should get execution without data', async () => {
      const execution = { id: '123', status: 'success' };
      mockAxiosInstance.get.mockResolvedValue({ data: execution });
      
      const result = await client.getExecution('123');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/executions/123', {
        params: { includeData: false },
      });
      expect(result).toEqual(execution);
    });

    it('should get execution with data', async () => {
      const execution = { id: '123', status: 'success', data: {} };
      mockAxiosInstance.get.mockResolvedValue({ data: execution });
      
      const result = await client.getExecution('123', true);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/executions/123', {
        params: { includeData: true },
      });
      expect(result).toEqual(execution);
    });
  });

  describe('listExecutions', () => {
    beforeEach(() => {
      client = new N8nApiClient(defaultConfig);
    });

    it('should list executions with filters', async () => {
      const params = { workflowId: '123', status: ExecutionStatus.SUCCESS, limit: 50 };
      const response = { data: [], nextCursor: null };
      mockAxiosInstance.get.mockResolvedValue({ data: response });
      
      const result = await client.listExecutions(params);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/executions', { params });
      expect(result).toEqual(response);
    });
  });

  describe('deleteExecution', () => {
    beforeEach(() => {
      client = new N8nApiClient(defaultConfig);
    });

    it('should delete execution successfully', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: {} });
      
      await client.deleteExecution('123');
      
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/executions/123');
    });
  });

  describe('triggerWebhook', () => {
    beforeEach(() => {
      client = new N8nApiClient(defaultConfig);
    });

    it('should trigger webhook with GET method', async () => {
      const webhookRequest = {
        webhookUrl: 'https://n8n.example.com/webhook/abc-123',
        httpMethod: 'GET' as const,
        data: { key: 'value' },
        waitForResponse: true,
      };
      
      const response = {
        status: 200,
        statusText: 'OK',
        data: { result: 'success' },
        headers: {},
      };
      
      vi.mocked(axios.create).mockReturnValue({
        request: vi.fn().mockResolvedValue(response),
      } as any);
      
      const result = await client.triggerWebhook(webhookRequest);
      
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://n8n.example.com/',
        validateStatus: expect.any(Function),
      });
      
      expect(result).toEqual(response);
    });

    it('should trigger webhook with POST method', async () => {
      const webhookRequest = {
        webhookUrl: 'https://n8n.example.com/webhook/abc-123',
        httpMethod: 'POST' as const,
        data: { key: 'value' },
        headers: { 'Custom-Header': 'test' },
        waitForResponse: false,
      };
      
      const response = {
        status: 201,
        statusText: 'Created',
        data: { id: '456' },
        headers: {},
      };
      
      const mockWebhookClient = {
        request: vi.fn().mockResolvedValue(response),
      };
      
      vi.mocked(axios.create).mockReturnValue(mockWebhookClient as any);
      
      const result = await client.triggerWebhook(webhookRequest);
      
      expect(mockWebhookClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/webhook/abc-123',
        headers: {
          'Custom-Header': 'test',
          'X-N8N-API-KEY': undefined,
        },
        data: { key: 'value' },
        params: undefined,
        timeout: 30000,
      });
      
      expect(result).toEqual(response);
    });

    it('should handle webhook trigger error', async () => {
      const webhookRequest = {
        webhookUrl: 'https://n8n.example.com/webhook/abc-123',
        httpMethod: 'POST' as const,
        data: {},
      };
      
      vi.mocked(axios.create).mockReturnValue({
        request: vi.fn().mockRejectedValue(new Error('Webhook failed')),
      } as any);
      
      await expect(client.triggerWebhook(webhookRequest)).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      client = new N8nApiClient(defaultConfig);
    });

    it('should handle authentication error (401)', async () => {
      const error = { 
        message: 'Request failed',
        response: { 
          status: 401, 
          data: { message: 'Invalid API key' } 
        } 
      };
      await mockAxiosInstance.simulateError('get', error);
      
      try {
        await client.getWorkflow('123');
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).toBeInstanceOf(N8nAuthenticationError);
        expect((err as N8nAuthenticationError).message).toBe('Invalid API key');
        expect((err as N8nAuthenticationError).statusCode).toBe(401);
      }
    });

    it('should handle rate limit error (429)', async () => {
      const error = { 
        message: 'Request failed',
        response: { 
          status: 429, 
          data: { message: 'Rate limit exceeded' },
          headers: { 'retry-after': '60' }
        } 
      };
      await mockAxiosInstance.simulateError('get', error);
      
      try {
        await client.getWorkflow('123');
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).toBeInstanceOf(N8nRateLimitError);
        expect((err as N8nRateLimitError).message).toContain('Rate limit exceeded');
        expect((err as N8nRateLimitError).statusCode).toBe(429);
        expect(((err as N8nRateLimitError).details as any)?.retryAfter).toBe(60);
      }
    });

    it('should handle server error (500)', async () => {
      const error = { 
        message: 'Request failed',
        response: { 
          status: 500, 
          data: { message: 'Internal server error' } 
        } 
      };
      await mockAxiosInstance.simulateError('get', error);
      
      try {
        await client.getWorkflow('123');
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).toBeInstanceOf(N8nServerError);
        expect((err as N8nServerError).message).toBe('Internal server error');
        expect((err as N8nServerError).statusCode).toBe(500);
      }
    });

    it('should handle network error', async () => {
      const error = { 
        message: 'Network error',
        request: {} 
      };
      await mockAxiosInstance.simulateError('get', error);
      
      await expect(client.getWorkflow('123')).rejects.toThrow(N8nApiError);
    });
  });

  describe('credential management', () => {
    beforeEach(() => {
      client = new N8nApiClient(defaultConfig);
    });

    it('should list credentials', async () => {
      const response = { data: [], nextCursor: null };
      mockAxiosInstance.get.mockResolvedValue({ data: response });
      
      const result = await client.listCredentials({ limit: 10 });
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/credentials', { 
        params: { limit: 10 } 
      });
      expect(result).toEqual(response);
    });

    it('should get credential', async () => {
      const credential = { id: '123', name: 'Test Credential' };
      mockAxiosInstance.get.mockResolvedValue({ data: credential });
      
      const result = await client.getCredential('123');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/credentials/123');
      expect(result).toEqual(credential);
    });

    it('should create credential', async () => {
      const credential = { name: 'New Credential', type: 'httpHeader' };
      const created = { ...credential, id: '123' };
      mockAxiosInstance.post.mockResolvedValue({ data: created });
      
      const result = await client.createCredential(credential);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/credentials', credential);
      expect(result).toEqual(created);
    });

    it('should update credential', async () => {
      const updates = { name: 'Updated Credential' };
      const updated = { id: '123', ...updates };
      mockAxiosInstance.patch.mockResolvedValue({ data: updated });
      
      const result = await client.updateCredential('123', updates);
      
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/credentials/123', updates);
      expect(result).toEqual(updated);
    });

    it('should delete credential', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: {} });
      
      await client.deleteCredential('123');
      
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/credentials/123');
    });
  });

  describe('tag management', () => {
    beforeEach(() => {
      client = new N8nApiClient(defaultConfig);
    });

    it('should list tags', async () => {
      const response = { data: [], nextCursor: null };
      mockAxiosInstance.get.mockResolvedValue({ data: response });
      
      const result = await client.listTags();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tags', { params: {} });
      expect(result).toEqual(response);
    });

    it('should create tag', async () => {
      const tag = { name: 'New Tag' };
      const created = { ...tag, id: '123' };
      mockAxiosInstance.post.mockResolvedValue({ data: created });
      
      const result = await client.createTag(tag);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/tags', tag);
      expect(result).toEqual(created);
    });

    it('should update tag', async () => {
      const updates = { name: 'Updated Tag' };
      const updated = { id: '123', ...updates };
      mockAxiosInstance.patch.mockResolvedValue({ data: updated });
      
      const result = await client.updateTag('123', updates);
      
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/tags/123', updates);
      expect(result).toEqual(updated);
    });

    it('should delete tag', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: {} });
      
      await client.deleteTag('123');
      
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/tags/123');
    });
  });

  describe('source control management', () => {
    beforeEach(() => {
      client = new N8nApiClient(defaultConfig);
    });

    it('should get source control status', async () => {
      const status = { connected: true, branch: 'main' };
      mockAxiosInstance.get.mockResolvedValue({ data: status });
      
      const result = await client.getSourceControlStatus();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/source-control/status');
      expect(result).toEqual(status);
    });

    it('should pull source control changes', async () => {
      const pullResult = { pulled: 5, conflicts: 0 };
      mockAxiosInstance.post.mockResolvedValue({ data: pullResult });
      
      const result = await client.pullSourceControl(true);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/source-control/pull', { 
        force: true 
      });
      expect(result).toEqual(pullResult);
    });

    it('should push source control changes', async () => {
      const pushResult = { pushed: 3 };
      mockAxiosInstance.post.mockResolvedValue({ data: pushResult });
      
      const result = await client.pushSourceControl('Update workflows', ['workflow1.json']);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/source-control/push', {
        message: 'Update workflows',
        fileNames: ['workflow1.json'],
      });
      expect(result).toEqual(pushResult);
    });
  });

  describe('variable management', () => {
    beforeEach(() => {
      client = new N8nApiClient(defaultConfig);
    });

    it('should get variables', async () => {
      const variables = [{ id: '1', key: 'VAR1', value: 'value1' }];
      mockAxiosInstance.get.mockResolvedValue({ data: { data: variables } });
      
      const result = await client.getVariables();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/variables');
      expect(result).toEqual(variables);
    });

    it('should return empty array when variables API not available', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Not found'));
      
      const result = await client.getVariables();
      
      expect(result).toEqual([]);
      expect(logger.warn).toHaveBeenCalledWith(
        'Variables API not available, returning empty array'
      );
    });

    it('should create variable', async () => {
      const variable = { key: 'NEW_VAR', value: 'new value' };
      const created = { ...variable, id: '123' };
      mockAxiosInstance.post.mockResolvedValue({ data: created });
      
      const result = await client.createVariable(variable);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/variables', variable);
      expect(result).toEqual(created);
    });

    it('should update variable', async () => {
      const updates = { value: 'updated value' };
      const updated = { id: '123', key: 'VAR1', ...updates };
      mockAxiosInstance.patch.mockResolvedValue({ data: updated });
      
      const result = await client.updateVariable('123', updates);
      
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/variables/123', updates);
      expect(result).toEqual(updated);
    });

    it('should delete variable', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: {} });
      
      await client.deleteVariable('123');
      
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/variables/123');
    });
  });

  describe('interceptors', () => {
    let requestInterceptor: any;
    let responseInterceptor: any;
    let responseErrorInterceptor: any;

    beforeEach(() => {
      // Capture the interceptor functions
      vi.mocked(mockAxiosInstance.interceptors.request.use).mockImplementation((onFulfilled: any) => {
        requestInterceptor = onFulfilled;
        return 0;
      });
      
      vi.mocked(mockAxiosInstance.interceptors.response.use).mockImplementation((onFulfilled: any, onRejected: any) => {
        responseInterceptor = onFulfilled;
        responseErrorInterceptor = onRejected;
        return 0;
      });
      
      client = new N8nApiClient(defaultConfig);
    });

    it('should log requests', () => {
      const config = { 
        method: 'get', 
        url: '/workflows',
        params: { limit: 10 },
        data: undefined,
      };
      
      const result = requestInterceptor(config);
      
      expect(logger.debug).toHaveBeenCalledWith(
        'n8n API Request: GET /workflows',
        { params: { limit: 10 }, data: undefined }
      );
      expect(result).toBe(config);
    });

    it('should log successful responses', () => {
      const response = {
        status: 200,
        config: { url: '/workflows' },
        data: [],
      };
      
      const result = responseInterceptor(response);
      
      expect(logger.debug).toHaveBeenCalledWith(
        'n8n API Response: 200 /workflows'
      );
      expect(result).toBe(response);
    });

    it('should handle response errors', async () => {
      const error = new Error('Request failed');
      Object.assign(error, {
        response: {
          status: 400,
          data: { message: 'Bad request' },
        },
      });
      
      const result = await responseErrorInterceptor(error).catch((e: any) => e);
      expect(result).toBeInstanceOf(N8nValidationError);
      expect(result.message).toBe('Bad request');
    });
  });
});