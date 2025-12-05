import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskTemplates } from '@/services/task-templates';
import type { TaskTemplate } from '@/services/task-templates';

// Mock the database
vi.mock('better-sqlite3');

describe('TaskTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTaskTemplate', () => {
    it('should return template for get_api_data task', () => {
      const template = TaskTemplates.getTaskTemplate('get_api_data');

      expect(template).toBeDefined();
      expect(template?.task).toBe('get_api_data');
      expect(template?.nodeType).toBe('nodes-base.httpRequest');
      expect(template?.configuration).toMatchObject({
        method: 'GET',
        retryOnFail: true,
        maxTries: 3
      });
    });

    it('should return template for webhook tasks', () => {
      const template = TaskTemplates.getTaskTemplate('receive_webhook');

      expect(template).toBeDefined();
      expect(template?.nodeType).toBe('nodes-base.webhook');
      expect(template?.configuration).toMatchObject({
        httpMethod: 'POST',
        responseMode: 'lastNode',
        alwaysOutputData: true
      });
    });

    it('should return template for database tasks', () => {
      const template = TaskTemplates.getTaskTemplate('query_postgres');

      expect(template).toBeDefined();
      expect(template?.nodeType).toBe('nodes-base.postgres');
      expect(template?.configuration).toMatchObject({
        operation: 'executeQuery',
        onError: 'continueRegularOutput'
      });
    });

    it('should return undefined for unknown task', () => {
      const template = TaskTemplates.getTaskTemplate('unknown_task');

      expect(template).toBeUndefined();
    });

    it('should have getTemplate alias working', () => {
      const template1 = TaskTemplates.getTaskTemplate('get_api_data');
      const template2 = TaskTemplates.getTemplate('get_api_data');

      expect(template1).toEqual(template2);
    });
  });

  describe('template structure', () => {
    it('should have all required fields in templates', () => {
      const allTasks = TaskTemplates.getAllTasks();

      allTasks.forEach(task => {
        const template = TaskTemplates.getTaskTemplate(task);
        
        expect(template).toBeDefined();
        expect(template?.task).toBe(task);
        expect(template?.description).toBeTruthy();
        expect(template?.nodeType).toBeTruthy();
        expect(template?.configuration).toBeDefined();
        expect(template?.userMustProvide).toBeDefined();
        expect(Array.isArray(template?.userMustProvide)).toBe(true);
      });
    });

    it('should have proper user must provide structure', () => {
      const template = TaskTemplates.getTaskTemplate('post_json_request');

      expect(template?.userMustProvide).toHaveLength(2);
      expect(template?.userMustProvide[0]).toMatchObject({
        property: 'url',
        description: expect.any(String),
        example: 'https://api.example.com/users'
      });
    });

    it('should have optional enhancements where applicable', () => {
      const template = TaskTemplates.getTaskTemplate('get_api_data');

      expect(template?.optionalEnhancements).toBeDefined();
      expect(template?.optionalEnhancements?.length).toBeGreaterThan(0);
      expect(template?.optionalEnhancements?.[0]).toHaveProperty('property');
      expect(template?.optionalEnhancements?.[0]).toHaveProperty('description');
    });

    it('should have notes for complex templates', () => {
      const template = TaskTemplates.getTaskTemplate('post_json_request');

      expect(template?.notes).toBeDefined();
      expect(template?.notes?.length).toBeGreaterThan(0);
      expect(template?.notes?.[0]).toContain('JSON');
    });
  });

  describe('special templates', () => {
    it('should have process_webhook_data template with detailed code', () => {
      const template = TaskTemplates.getTaskTemplate('process_webhook_data');

      expect(template?.nodeType).toBe('nodes-base.code');
      expect(template?.configuration.jsCode).toContain('items[0].json.body');
      expect(template?.configuration.jsCode).toContain('❌ WRONG');
      expect(template?.configuration.jsCode).toContain('✅ CORRECT');
      expect(template?.notes?.[0]).toContain('WEBHOOK DATA IS AT items[0].json.body');
    });

    it('should have AI agent workflow template', () => {
      const template = TaskTemplates.getTaskTemplate('ai_agent_workflow');

      expect(template?.nodeType).toBe('nodes-langchain.agent');
      expect(template?.configuration).toHaveProperty('systemMessage');
    });

    it('should have error handling pattern templates', () => {
      const template = TaskTemplates.getTaskTemplate('modern_error_handling_patterns');

      expect(template).toBeDefined();
      expect(template?.configuration).toHaveProperty('onError', 'continueRegularOutput');
      expect(template?.configuration).toHaveProperty('retryOnFail', true);
      expect(template?.notes).toBeDefined();
    });

    it('should have AI tool templates', () => {
      const template = TaskTemplates.getTaskTemplate('custom_ai_tool');

      expect(template?.nodeType).toBe('nodes-base.code');
      expect(template?.configuration.mode).toBe('runOnceForEachItem');
      expect(template?.configuration.jsCode).toContain('$json');
    });
  });

  describe('getAllTasks', () => {
    it('should return all task names', () => {
      const tasks = TaskTemplates.getAllTasks();

      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(20);
      expect(tasks).toContain('get_api_data');
      expect(tasks).toContain('receive_webhook');
      expect(tasks).toContain('query_postgres');
    });
  });

  describe('getTasksForNode', () => {
    it('should return tasks for HTTP Request node', () => {
      const tasks = TaskTemplates.getTasksForNode('nodes-base.httpRequest');

      expect(tasks).toContain('get_api_data');
      expect(tasks).toContain('post_json_request');
      expect(tasks).toContain('call_api_with_auth');
      expect(tasks).toContain('api_call_with_retry');
    });

    it('should return tasks for Code node', () => {
      const tasks = TaskTemplates.getTasksForNode('nodes-base.code');

      expect(tasks).toContain('transform_data');
      expect(tasks).toContain('process_webhook_data');
      expect(tasks).toContain('custom_ai_tool');
      expect(tasks).toContain('aggregate_data');
    });

    it('should return tasks for Webhook node', () => {
      const tasks = TaskTemplates.getTasksForNode('nodes-base.webhook');

      expect(tasks).toContain('receive_webhook');
      expect(tasks).toContain('webhook_with_response');
      expect(tasks).toContain('webhook_with_error_handling');
    });

    it('should return empty array for unknown node', () => {
      const tasks = TaskTemplates.getTasksForNode('nodes-base.unknownNode');

      expect(tasks).toEqual([]);
    });
  });

  describe('searchTasks', () => {
    it('should find tasks by name', () => {
      const tasks = TaskTemplates.searchTasks('webhook');

      expect(tasks).toContain('receive_webhook');
      expect(tasks).toContain('webhook_with_response');
      expect(tasks).toContain('process_webhook_data');
    });

    it('should find tasks by description', () => {
      const tasks = TaskTemplates.searchTasks('resilient');

      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks.some(t => {
        const template = TaskTemplates.getTaskTemplate(t);
        return template?.description.toLowerCase().includes('resilient');
      })).toBe(true);
    });

    it('should find tasks by node type', () => {
      const tasks = TaskTemplates.searchTasks('postgres');

      expect(tasks).toContain('query_postgres');
      expect(tasks).toContain('insert_postgres_data');
    });

    it('should be case insensitive', () => {
      const tasks1 = TaskTemplates.searchTasks('WEBHOOK');
      const tasks2 = TaskTemplates.searchTasks('webhook');

      expect(tasks1).toEqual(tasks2);
    });

    it('should return empty array for no matches', () => {
      const tasks = TaskTemplates.searchTasks('xyz123nonexistent');

      expect(tasks).toEqual([]);
    });
  });

  describe('getTaskCategories', () => {
    it('should return all task categories', () => {
      const categories = TaskTemplates.getTaskCategories();

      expect(Object.keys(categories)).toContain('HTTP/API');
      expect(Object.keys(categories)).toContain('Webhooks');
      expect(Object.keys(categories)).toContain('Database');
      expect(Object.keys(categories)).toContain('AI/LangChain');
      expect(Object.keys(categories)).toContain('Data Processing');
      expect(Object.keys(categories)).toContain('Communication');
      expect(Object.keys(categories)).toContain('Error Handling');
    });

    it('should have tasks assigned to categories', () => {
      const categories = TaskTemplates.getTaskCategories();

      expect(categories['HTTP/API']).toContain('get_api_data');
      expect(categories['Webhooks']).toContain('receive_webhook');
      expect(categories['Database']).toContain('query_postgres');
      expect(categories['AI/LangChain']).toContain('chat_with_ai');
    });

    it('should have tasks in multiple categories where appropriate', () => {
      const categories = TaskTemplates.getTaskCategories();

      // process_webhook_data should be in both Webhooks and Data Processing
      expect(categories['Webhooks']).toContain('process_webhook_data');
      expect(categories['Data Processing']).toContain('process_webhook_data');
    });
  });

  describe('error handling templates', () => {
    it('should have proper retry configuration', () => {
      const template = TaskTemplates.getTaskTemplate('api_call_with_retry');

      expect(template?.configuration).toMatchObject({
        retryOnFail: true,
        maxTries: 5,
        waitBetweenTries: 2000,
        alwaysOutputData: true
      });
    });

    it('should have database transaction safety template', () => {
      const template = TaskTemplates.getTaskTemplate('database_transaction_safety');

      expect(template?.configuration).toMatchObject({
        onError: 'continueErrorOutput',
        retryOnFail: false, // Transactions should not be retried
        alwaysOutputData: true
      });
    });

    it('should have AI rate limit handling', () => {
      const template = TaskTemplates.getTaskTemplate('ai_rate_limit_handling');

      expect(template?.configuration).toMatchObject({
        retryOnFail: true,
        maxTries: 5,
        waitBetweenTries: 5000 // Longer wait for rate limits
      });
    });
  });

  describe('code node templates', () => {
    it('should have aggregate data template', () => {
      const template = TaskTemplates.getTaskTemplate('aggregate_data');

      expect(template?.configuration.jsCode).toContain('stats');
      expect(template?.configuration.jsCode).toContain('average');
      expect(template?.configuration.jsCode).toContain('median');
    });

    it('should have batch processing template', () => {
      const template = TaskTemplates.getTaskTemplate('batch_process_with_api');

      expect(template?.configuration.jsCode).toContain('BATCH_SIZE');
      expect(template?.configuration.jsCode).toContain('$helpers.httpRequest');
    });

    it('should have error safe transform template', () => {
      const template = TaskTemplates.getTaskTemplate('error_safe_transform');

      expect(template?.configuration.jsCode).toContain('required fields');
      expect(template?.configuration.jsCode).toContain('validation');
      expect(template?.configuration.jsCode).toContain('summary');
    });

    it('should have async processing template', () => {
      const template = TaskTemplates.getTaskTemplate('async_data_processing');

      expect(template?.configuration.jsCode).toContain('CONCURRENT_LIMIT');
      expect(template?.configuration.jsCode).toContain('Promise.all');
    });

    it('should have Python data analysis template', () => {
      const template = TaskTemplates.getTaskTemplate('python_data_analysis');

      expect(template?.configuration.language).toBe('python');
      expect(template?.configuration.pythonCode).toContain('_input.all()');
      expect(template?.configuration.pythonCode).toContain('statistics');
    });
  });

  describe('template configurations', () => {
    it('should have proper error handling defaults', () => {
      const apiTemplate = TaskTemplates.getTaskTemplate('get_api_data');
      const webhookTemplate = TaskTemplates.getTaskTemplate('receive_webhook');
      const dbWriteTemplate = TaskTemplates.getTaskTemplate('insert_postgres_data');

      // API calls should continue on error
      expect(apiTemplate?.configuration.onError).toBe('continueRegularOutput');
      
      // Webhooks should always respond
      expect(webhookTemplate?.configuration.onError).toBe('continueRegularOutput');
      expect(webhookTemplate?.configuration.alwaysOutputData).toBe(true);
      
      // Database writes should stop on error
      expect(dbWriteTemplate?.configuration.onError).toBe('stopWorkflow');
    });

    it('should have appropriate retry configurations', () => {
      const apiTemplate = TaskTemplates.getTaskTemplate('get_api_data');
      const dbTemplate = TaskTemplates.getTaskTemplate('query_postgres');
      const aiTemplate = TaskTemplates.getTaskTemplate('chat_with_ai');

      // API calls: moderate retries
      expect(apiTemplate?.configuration.maxTries).toBe(3);
      expect(apiTemplate?.configuration.waitBetweenTries).toBe(1000);

      // Database reads: can retry
      expect(dbTemplate?.configuration.retryOnFail).toBe(true);

      // AI calls: longer waits for rate limits
      expect(aiTemplate?.configuration.waitBetweenTries).toBe(5000);
    });
  });
});