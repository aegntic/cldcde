/**
 * Mock execution data for MSW handlers
 */

export interface MockExecution {
  id: string;
  workflowId: string;
  status: 'success' | 'error' | 'waiting' | 'running';
  mode: 'manual' | 'trigger' | 'webhook' | 'internal';
  startedAt: string;
  stoppedAt?: string;
  data?: any;
  error?: any;
}

export const mockExecutions: MockExecution[] = [
  {
    id: 'exec_1',
    workflowId: 'workflow_1',
    status: 'success',
    mode: 'manual',
    startedAt: '2024-01-01T10:00:00.000Z',
    stoppedAt: '2024-01-01T10:00:05.000Z',
    data: {
      resultData: {
        runData: {
          'node_2': [
            {
              startTime: 1704106800000,
              executionTime: 234,
              data: {
                main: [[{
                  json: {
                    status: 200,
                    data: { message: 'Success' }
                  }
                }]]
              }
            }
          ]
        }
      }
    }
  },
  {
    id: 'exec_2',
    workflowId: 'workflow_2',
    status: 'error',
    mode: 'webhook',
    startedAt: '2024-01-01T11:00:00.000Z',
    stoppedAt: '2024-01-01T11:00:02.000Z',
    error: {
      message: 'Could not send message to Slack',
      stack: 'Error: Could not send message to Slack\n    at SlackNode.execute',
      node: 'slack_1'
    },
    data: {
      resultData: {
        runData: {
          'webhook_1': [
            {
              startTime: 1704110400000,
              executionTime: 10,
              data: {
                main: [[{
                  json: {
                    headers: { 'content-type': 'application/json' },
                    body: { message: 'Test webhook' }
                  }
                }]]
              }
            }
          ]
        }
      }
    }
  },
  {
    id: 'exec_3',
    workflowId: 'workflow_3',
    status: 'waiting',
    mode: 'trigger',
    startedAt: '2024-01-01T12:00:00.000Z',
    data: {
      resultData: {
        runData: {}
      },
      waitingExecutions: {
        'agent_1': {
          reason: 'Waiting for user input'
        }
      }
    }
  }
];

/**
 * Factory functions for creating mock executions
 */
export const executionFactory = {
  /**
   * Create a successful execution
   */
  success: (workflowId: string, data?: any): MockExecution => ({
    id: `exec_${Date.now()}`,
    workflowId,
    status: 'success',
    mode: 'manual',
    startedAt: new Date().toISOString(),
    stoppedAt: new Date(Date.now() + 5000).toISOString(),
    data: data || {
      resultData: {
        runData: {
          'node_1': [{
            startTime: Date.now(),
            executionTime: 100,
            data: {
              main: [[{ json: { success: true } }]]
            }
          }]
        }
      }
    }
  }),

  /**
   * Create a failed execution
   */
  error: (workflowId: string, error: { message: string; node?: string }): MockExecution => ({
    id: `exec_${Date.now()}`,
    workflowId,
    status: 'error',
    mode: 'manual',
    startedAt: new Date().toISOString(),
    stoppedAt: new Date(Date.now() + 2000).toISOString(),
    error: {
      message: error.message,
      stack: `Error: ${error.message}\n    at Node.execute`,
      node: error.node
    },
    data: {
      resultData: {
        runData: {}
      }
    }
  }),

  /**
   * Create a custom execution
   */
  custom: (config: Partial<MockExecution>): MockExecution => ({
    id: `exec_${Date.now()}`,
    workflowId: 'workflow_1',
    status: 'success',
    mode: 'manual',
    startedAt: new Date().toISOString(),
    ...config
  })
};