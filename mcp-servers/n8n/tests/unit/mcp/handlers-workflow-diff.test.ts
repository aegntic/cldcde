import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleUpdatePartialWorkflow } from '@/mcp/handlers-workflow-diff';
import { WorkflowDiffEngine } from '@/services/workflow-diff-engine';
import { N8nApiClient } from '@/services/n8n-api-client';
import {
  N8nApiError,
  N8nAuthenticationError,
  N8nNotFoundError,
  N8nValidationError,
  N8nRateLimitError,
  N8nServerError,
} from '@/utils/n8n-errors';
import { z } from 'zod';

// Mock dependencies
vi.mock('@/services/workflow-diff-engine');
vi.mock('@/services/n8n-api-client');
vi.mock('@/config/n8n-api');
vi.mock('@/utils/logger');
vi.mock('@/mcp/handlers-n8n-manager', () => ({
  getN8nApiClient: vi.fn(),
}));

// Import mocked modules
import { getN8nApiClient } from '@/mcp/handlers-n8n-manager';
import { logger } from '@/utils/logger';

describe('handlers-workflow-diff', () => {
  let mockApiClient: any;
  let mockDiffEngine: any;

  // Helper function to create test workflow
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
      {
        id: 'node2',
        name: 'HTTP Request',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 3,
        position: [300, 100],
        parameters: { url: 'https://api.test.com' },
      },
    ],
    connections: {
      node1: {
        main: [[{ node: 'node2', type: 'main', index: 0 }]],
      },
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    tags: [],
    settings: {},
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock API client
    mockApiClient = {
      getWorkflow: vi.fn(),
      updateWorkflow: vi.fn(),
    };

    // Setup mock diff engine
    mockDiffEngine = {
      applyDiff: vi.fn(),
    };

    // Mock the API client getter
    vi.mocked(getN8nApiClient).mockReturnValue(mockApiClient);

    // Mock WorkflowDiffEngine constructor
    vi.mocked(WorkflowDiffEngine).mockImplementation(() => mockDiffEngine);

    // Set up default environment
    process.env.DEBUG_MCP = 'false';
  });

  describe('handleUpdatePartialWorkflow', () => {
    it('should apply diff operations successfully', async () => {
      const testWorkflow = createTestWorkflow();
      const updatedWorkflow = {
        ...testWorkflow,
        nodes: [
          ...testWorkflow.nodes,
          {
            id: 'node3',
            name: 'New Node',
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [500, 100],
            parameters: {},
          },
        ],
      };

      const diffRequest = {
        id: 'test-workflow-id',
        operations: [
          {
            type: 'addNode',
            node: {
              id: 'node3',
              name: 'New Node',
              type: 'n8n-nodes-base.set',
              typeVersion: 1,
              position: [500, 100],
              parameters: {},
            },
          },
        ],
      };

      mockApiClient.getWorkflow.mockResolvedValue(testWorkflow);
      mockDiffEngine.applyDiff.mockResolvedValue({
        success: true,
        workflow: updatedWorkflow,
        operationsApplied: 1,
        message: 'Successfully applied 1 operation',
        errors: [],
      });
      mockApiClient.updateWorkflow.mockResolvedValue(updatedWorkflow);

      const result = await handleUpdatePartialWorkflow(diffRequest);

      expect(result).toEqual({
        success: true,
        data: updatedWorkflow,
        message: 'Workflow "Test Workflow" updated successfully. Applied 1 operations.',
        details: {
          operationsApplied: 1,
          workflowId: 'test-workflow-id',
          workflowName: 'Test Workflow',
        },
      });

      expect(mockApiClient.getWorkflow).toHaveBeenCalledWith('test-workflow-id');
      expect(mockDiffEngine.applyDiff).toHaveBeenCalledWith(testWorkflow, diffRequest);
      expect(mockApiClient.updateWorkflow).toHaveBeenCalledWith('test-workflow-id', updatedWorkflow);
    });

    it('should handle validation-only mode', async () => {
      const testWorkflow = createTestWorkflow();
      const diffRequest = {
        id: 'test-workflow-id',
        operations: [
          {
            type: 'updateNode',
            nodeId: 'node2',
            changes: { name: 'Updated HTTP Request' },
          },
        ],
        validateOnly: true,
      };

      mockApiClient.getWorkflow.mockResolvedValue(testWorkflow);
      mockDiffEngine.applyDiff.mockResolvedValue({
        success: true,
        workflow: testWorkflow,
        operationsApplied: 1,
        message: 'Validation successful',
        errors: [],
      });

      const result = await handleUpdatePartialWorkflow(diffRequest);

      expect(result).toEqual({
        success: true,
        message: 'Validation successful',
        data: {
          valid: true,
          operationsToApply: 1,
        },
      });

      expect(mockApiClient.updateWorkflow).not.toHaveBeenCalled();
    });

    it('should handle multiple operations', async () => {
      const testWorkflow = createTestWorkflow();
      const diffRequest = {
        id: 'test-workflow-id',
        operations: [
          {
            type: 'updateNode',
            nodeId: 'node1',
            changes: { name: 'Updated Start' },
          },
          {
            type: 'addNode',
            node: {
              id: 'node3',
              name: 'Set Node',
              type: 'n8n-nodes-base.set',
              typeVersion: 1,
              position: [500, 100],
              parameters: {},
            },
          },
          {
            type: 'addConnection',
            source: 'node2',
            target: 'node3',
            sourceOutput: 'main',
            targetInput: 'main',
          },
        ],
      };

      mockApiClient.getWorkflow.mockResolvedValue(testWorkflow);
      mockDiffEngine.applyDiff.mockResolvedValue({
        success: true,
        workflow: { ...testWorkflow, nodes: [...testWorkflow.nodes, {}] },
        operationsApplied: 3,
        message: 'Successfully applied 3 operations',
        errors: [],
      });
      mockApiClient.updateWorkflow.mockResolvedValue({ ...testWorkflow });

      const result = await handleUpdatePartialWorkflow(diffRequest);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Applied 3 operations');
    });

    it('should handle diff application failures', async () => {
      const testWorkflow = createTestWorkflow();
      const diffRequest = {
        id: 'test-workflow-id',
        operations: [
          {
            type: 'updateNode',
            nodeId: 'non-existent-node',
            changes: { name: 'Updated' },
          },
        ],
      };

      mockApiClient.getWorkflow.mockResolvedValue(testWorkflow);
      mockDiffEngine.applyDiff.mockResolvedValue({
        success: false,
        workflow: null,
        operationsApplied: 0,
        message: 'Failed to apply operations',
        errors: ['Node "non-existent-node" not found'],
      });

      const result = await handleUpdatePartialWorkflow(diffRequest);

      expect(result).toEqual({
        success: false,
        error: 'Failed to apply diff operations',
        details: {
          errors: ['Node "non-existent-node" not found'],
          operationsApplied: 0,
        },
      });

      expect(mockApiClient.updateWorkflow).not.toHaveBeenCalled();
    });

    it('should handle API not configured error', async () => {
      vi.mocked(getN8nApiClient).mockReturnValue(null);

      const result = await handleUpdatePartialWorkflow({
        id: 'test-id',
        operations: [],
      });

      expect(result).toEqual({
        success: false,
        error: 'n8n API not configured. Please set N8N_API_URL and N8N_API_KEY environment variables.',
      });
    });

    it('should handle workflow not found error', async () => {
      const notFoundError = new N8nNotFoundError('Workflow', 'non-existent');
      mockApiClient.getWorkflow.mockRejectedValue(notFoundError);

      const result = await handleUpdatePartialWorkflow({
        id: 'non-existent',
        operations: [],
      });

      expect(result).toEqual({
        success: false,
        error: 'Workflow with ID non-existent not found',
        code: 'NOT_FOUND',
      });
    });

    it('should handle API errors during update', async () => {
      const testWorkflow = createTestWorkflow();
      const validationError = new N8nValidationError('Invalid workflow structure', {
        field: 'connections',
        message: 'Invalid connection configuration',
      });

      mockApiClient.getWorkflow.mockResolvedValue(testWorkflow);
      mockDiffEngine.applyDiff.mockResolvedValue({
        success: true,
        workflow: testWorkflow,
        operationsApplied: 1,
        message: 'Success',
        errors: [],
      });
      mockApiClient.updateWorkflow.mockRejectedValue(validationError);

      const result = await handleUpdatePartialWorkflow({
        id: 'test-id',
        operations: [{ type: 'updateNode', nodeId: 'node1', changes: {} }],
      });

      expect(result).toEqual({
        success: false,
        error: 'Invalid request: Invalid workflow structure',
        code: 'VALIDATION_ERROR',
        details: {
          field: 'connections',
          message: 'Invalid connection configuration',
        },
      });
    });

    it('should handle input validation errors', async () => {
      const invalidInput = {
        id: 'test-id',
        operations: [
          {
            // Missing required 'type' field
            nodeId: 'node1',
            changes: {},
          },
        ],
      };

      const result = await handleUpdatePartialWorkflow(invalidInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid input');
      expect(result.details).toHaveProperty('errors');
      expect(result.details?.errors).toBeInstanceOf(Array);
    });

    it('should handle complex operation types', async () => {
      const testWorkflow = createTestWorkflow();
      const diffRequest = {
        id: 'test-workflow-id',
        operations: [
          {
            type: 'moveNode',
            nodeId: 'node2',
            position: [400, 200],
          },
          {
            type: 'removeConnection',
            source: 'node1',
            target: 'node2',
            sourceOutput: 'main',
            targetInput: 'main',
          },
          {
            type: 'updateSettings',
            settings: {
              executionOrder: 'v1',
              timezone: 'America/New_York',
            },
          },
          {
            type: 'addTag',
            tag: 'automated',
          },
        ],
      };

      mockApiClient.getWorkflow.mockResolvedValue(testWorkflow);
      mockDiffEngine.applyDiff.mockResolvedValue({
        success: true,
        workflow: { ...testWorkflow, settings: { executionOrder: 'v1' } },
        operationsApplied: 4,
        message: 'Successfully applied 4 operations',
        errors: [],
      });
      mockApiClient.updateWorkflow.mockResolvedValue({ ...testWorkflow });

      const result = await handleUpdatePartialWorkflow(diffRequest);

      expect(result.success).toBe(true);
      expect(mockDiffEngine.applyDiff).toHaveBeenCalledWith(testWorkflow, diffRequest);
    });

    it('should handle debug logging when enabled', async () => {
      process.env.DEBUG_MCP = 'true';
      const testWorkflow = createTestWorkflow();

      mockApiClient.getWorkflow.mockResolvedValue(testWorkflow);
      mockDiffEngine.applyDiff.mockResolvedValue({
        success: true,
        workflow: testWorkflow,
        operationsApplied: 1,
        message: 'Success',
        errors: [],
      });
      mockApiClient.updateWorkflow.mockResolvedValue(testWorkflow);

      await handleUpdatePartialWorkflow({
        id: 'test-id',
        operations: [{ type: 'updateNode', nodeId: 'node1', changes: {} }],
      });

      expect(logger.debug).toHaveBeenCalledWith(
        'Workflow diff request received',
        expect.objectContaining({
          argsType: 'object',
          operationCount: 1,
        })
      );
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Something went wrong');
      mockApiClient.getWorkflow.mockRejectedValue(genericError);

      const result = await handleUpdatePartialWorkflow({
        id: 'test-id',
        operations: [],
      });

      expect(result).toEqual({
        success: false,
        error: 'Something went wrong',
      });
      expect(logger.error).toHaveBeenCalledWith('Failed to update partial workflow', genericError);
    });

    it('should handle authentication errors', async () => {
      const authError = new N8nAuthenticationError('Invalid API key');
      mockApiClient.getWorkflow.mockRejectedValue(authError);

      const result = await handleUpdatePartialWorkflow({
        id: 'test-id',
        operations: [],
      });

      expect(result).toEqual({
        success: false,
        error: 'Failed to authenticate with n8n. Please check your API key.',
        code: 'AUTHENTICATION_ERROR',
      });
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = new N8nRateLimitError(60);
      mockApiClient.getWorkflow.mockRejectedValue(rateLimitError);

      const result = await handleUpdatePartialWorkflow({
        id: 'test-id',
        operations: [],
      });

      expect(result).toEqual({
        success: false,
        error: 'Too many requests. Please wait a moment and try again.',
        code: 'RATE_LIMIT_ERROR',
      });
    });

    it('should handle server errors', async () => {
      const serverError = new N8nServerError('Internal server error');
      mockApiClient.getWorkflow.mockRejectedValue(serverError);

      const result = await handleUpdatePartialWorkflow({
        id: 'test-id',
        operations: [],
      });

      expect(result).toEqual({
        success: false,
        error: 'n8n server error. Please try again later or contact support.',
        code: 'SERVER_ERROR',
      });
    });

    it('should validate operation structure', async () => {
      const testWorkflow = createTestWorkflow();
      const diffRequest = {
        id: 'test-workflow-id',
        operations: [
          {
            type: 'updateNode',
            nodeId: 'node1',
            nodeName: 'Start', // Both nodeId and nodeName provided
            changes: { name: 'New Start' },
            description: 'Update start node name',
          },
          {
            type: 'addConnection',
            source: 'node1',
            target: 'node2',
            sourceOutput: 'main',
            targetInput: 'main',
            sourceIndex: 0,
            targetIndex: 0,
          },
        ],
      };

      mockApiClient.getWorkflow.mockResolvedValue(testWorkflow);
      mockDiffEngine.applyDiff.mockResolvedValue({
        success: true,
        workflow: testWorkflow,
        operationsApplied: 2,
        message: 'Success',
        errors: [],
      });
      mockApiClient.updateWorkflow.mockResolvedValue(testWorkflow);

      const result = await handleUpdatePartialWorkflow(diffRequest);

      expect(result.success).toBe(true);
      expect(mockDiffEngine.applyDiff).toHaveBeenCalledWith(testWorkflow, diffRequest);
    });

    it('should handle empty operations array', async () => {
      const testWorkflow = createTestWorkflow();
      const diffRequest = {
        id: 'test-workflow-id',
        operations: [],
      };

      mockApiClient.getWorkflow.mockResolvedValue(testWorkflow);
      mockDiffEngine.applyDiff.mockResolvedValue({
        success: true,
        workflow: testWorkflow,
        operationsApplied: 0,
        message: 'No operations to apply',
        errors: [],
      });
      mockApiClient.updateWorkflow.mockResolvedValue(testWorkflow);

      const result = await handleUpdatePartialWorkflow(diffRequest);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Applied 0 operations');
    });

    it('should handle partial diff application', async () => {
      const testWorkflow = createTestWorkflow();
      const diffRequest = {
        id: 'test-workflow-id',
        operations: [
          { type: 'updateNode', nodeId: 'node1', changes: { name: 'Updated' } },
          { type: 'updateNode', nodeId: 'invalid-node', changes: { name: 'Fail' } },
          { type: 'addTag', tag: 'test' },
        ],
      };

      mockApiClient.getWorkflow.mockResolvedValue(testWorkflow);
      mockDiffEngine.applyDiff.mockResolvedValue({
        success: false,
        workflow: null,
        operationsApplied: 1,
        message: 'Partially applied operations',
        errors: ['Operation 2 failed: Node "invalid-node" not found'],
      });

      const result = await handleUpdatePartialWorkflow(diffRequest);

      expect(result).toEqual({
        success: false,
        error: 'Failed to apply diff operations',
        details: {
          errors: ['Operation 2 failed: Node "invalid-node" not found'],
          operationsApplied: 1,
        },
      });
    });
  });
});