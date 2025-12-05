import { ToolDefinition } from '../types';

/**
 * n8n Management Tools
 * 
 * These tools enable AI agents to manage n8n workflows through the n8n API.
 * They require N8N_API_URL and N8N_API_KEY to be configured.
 */
export const n8nManagementTools: ToolDefinition[] = [
  // Workflow Management Tools
  {
    name: 'n8n_create_workflow',
    description: `Create workflow. Requires: name, nodes[], connections{}. Created inactive. Returns workflow with ID.`,
    inputSchema: {
      type: 'object',
      properties: {
        name: { 
          type: 'string', 
          description: 'Workflow name (required)' 
        },
        nodes: { 
          type: 'array', 
          description: 'Array of workflow nodes. Each node must have: id, name, type, typeVersion, position, and parameters',
          items: {
            type: 'object',
            required: ['id', 'name', 'type', 'typeVersion', 'position', 'parameters'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              typeVersion: { type: 'number' },
              position: { 
                type: 'array',
                items: { type: 'number' },
                minItems: 2,
                maxItems: 2
              },
              parameters: { type: 'object' },
              credentials: { type: 'object' },
              disabled: { type: 'boolean' },
              notes: { type: 'string' },
              continueOnFail: { type: 'boolean' },
              retryOnFail: { type: 'boolean' },
              maxTries: { type: 'number' },
              waitBetweenTries: { type: 'number' }
            }
          }
        },
        connections: { 
          type: 'object', 
          description: 'Workflow connections object. Keys are source node IDs, values define output connections' 
        },
        settings: {
          type: 'object',
          description: 'Optional workflow settings (execution order, timezone, error handling)',
          properties: {
            executionOrder: { type: 'string', enum: ['v0', 'v1'] },
            timezone: { type: 'string' },
            saveDataErrorExecution: { type: 'string', enum: ['all', 'none'] },
            saveDataSuccessExecution: { type: 'string', enum: ['all', 'none'] },
            saveManualExecutions: { type: 'boolean' },
            saveExecutionProgress: { type: 'boolean' },
            executionTimeout: { type: 'number' },
            errorWorkflow: { type: 'string' }
          }
        }
      },
      required: ['name', 'nodes', 'connections']
    }
  },
  {
    name: 'n8n_get_workflow',
    description: `Get a workflow by ID. Returns the complete workflow including nodes, connections, and settings.`,
    inputSchema: {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'Workflow ID' 
        }
      },
      required: ['id']
    }
  },
  {
    name: 'n8n_get_workflow_details',
    description: `Get workflow details with metadata, version, execution stats. More info than get_workflow.`,
    inputSchema: {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'Workflow ID' 
        }
      },
      required: ['id']
    }
  },
  {
    name: 'n8n_get_workflow_structure',
    description: `Get workflow structure: nodes and connections only. No parameter details.`,
    inputSchema: {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'Workflow ID' 
        }
      },
      required: ['id']
    }
  },
  {
    name: 'n8n_get_workflow_minimal',
    description: `Get minimal info: ID, name, active status, tags. Fast for listings.`,
    inputSchema: {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'Workflow ID' 
        }
      },
      required: ['id']
    }
  },
  {
    name: 'n8n_update_full_workflow',
    description: `Full workflow update. Requires complete nodes[] and connections{}. For incremental use n8n_update_partial_workflow.`,
    inputSchema: {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'Workflow ID to update' 
        },
        name: { 
          type: 'string', 
          description: 'New workflow name' 
        },
        nodes: { 
          type: 'array', 
          description: 'Complete array of workflow nodes (required if modifying workflow structure)',
          items: {
            type: 'object',
            additionalProperties: true
          }
        },
        connections: { 
          type: 'object', 
          description: 'Complete connections object (required if modifying workflow structure)' 
        },
        settings: { 
          type: 'object', 
          description: 'Workflow settings to update' 
        }
      },
      required: ['id']
    }
  },
  {
    name: 'n8n_update_partial_workflow',
    description: `Update workflow incrementally with diff operations. Max 5 ops. Types: addNode, removeNode, updateNode, moveNode, enable/disableNode, addConnection, removeConnection, updateSettings, updateName, add/removeTag. See tools_documentation("n8n_update_partial_workflow", "full") for details.`,
    inputSchema: {
      type: 'object',
      additionalProperties: true,  // Allow any extra properties Claude Desktop might add
      properties: {
        id: { 
          type: 'string', 
          description: 'Workflow ID to update' 
        },
        operations: {
          type: 'array',
          description: 'Array of diff operations to apply. Each operation must have a "type" field and relevant properties for that operation type.',
          items: {
            type: 'object',
            additionalProperties: true
          }
        },
        validateOnly: {
          type: 'boolean',
          description: 'If true, only validate operations without applying them'
        }
      },
      required: ['id', 'operations']
    }
  },
  {
    name: 'n8n_delete_workflow',
    description: `Permanently delete a workflow. This action cannot be undone.`,
    inputSchema: {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'Workflow ID to delete' 
        }
      },
      required: ['id']
    }
  },
  {
    name: 'n8n_list_workflows',
    description: `List workflows (minimal metadata only). Returns id/name/active/dates/tags. Check hasMore/nextCursor for pagination.`,
    inputSchema: {
      type: 'object',
      properties: {
        limit: { 
          type: 'number', 
          description: 'Number of workflows to return (1-100, default: 100)' 
        },
        cursor: { 
          type: 'string', 
          description: 'Pagination cursor from previous response' 
        },
        active: { 
          type: 'boolean', 
          description: 'Filter by active status' 
        },
        tags: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Filter by tags (exact match)' 
        },
        projectId: { 
          type: 'string', 
          description: 'Filter by project ID (enterprise feature)' 
        },
        excludePinnedData: { 
          type: 'boolean', 
          description: 'Exclude pinned data from response (default: true)' 
        }
      }
    }
  },
  {
    name: 'n8n_validate_workflow',
    description: `Validate workflow by ID. Checks nodes, connections, expressions. Returns errors/warnings/suggestions.`,
    inputSchema: {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'Workflow ID to validate' 
        },
        options: {
          type: 'object',
          description: 'Validation options',
          properties: {
            validateNodes: { 
              type: 'boolean', 
              description: 'Validate node configurations (default: true)' 
            },
            validateConnections: { 
              type: 'boolean', 
              description: 'Validate workflow connections (default: true)' 
            },
            validateExpressions: { 
              type: 'boolean', 
              description: 'Validate n8n expressions (default: true)' 
            },
            profile: { 
              type: 'string', 
              enum: ['minimal', 'runtime', 'ai-friendly', 'strict'],
              description: 'Validation profile to use (default: runtime)' 
            }
          }
        }
      },
      required: ['id']
    }
  },

  // Execution Management Tools
  {
    name: 'n8n_trigger_webhook_workflow',
    description: `Trigger workflow via webhook. Must be ACTIVE with Webhook node. Method must match config.`,
    inputSchema: {
      type: 'object',
      properties: {
        webhookUrl: { 
          type: 'string', 
          description: 'Full webhook URL from n8n workflow (e.g., https://n8n.example.com/webhook/abc-def-ghi)' 
        },
        httpMethod: { 
          type: 'string', 
          enum: ['GET', 'POST', 'PUT', 'DELETE'],
          description: 'HTTP method (must match webhook configuration, often GET)' 
        },
        data: { 
          type: 'object', 
          description: 'Data to send with the webhook request' 
        },
        headers: { 
          type: 'object', 
          description: 'Additional HTTP headers' 
        },
        waitForResponse: { 
          type: 'boolean', 
          description: 'Wait for workflow completion (default: true)' 
        }
      },
      required: ['webhookUrl']
    }
  },
  {
    name: 'n8n_get_execution',
    description: `Get details of a specific execution by ID.`,
    inputSchema: {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'Execution ID' 
        },
        includeData: { 
          type: 'boolean', 
          description: 'Include full execution data (default: false)' 
        }
      },
      required: ['id']
    }
  },
  {
    name: 'n8n_list_executions',
    description: `List workflow executions (returns up to limit). Check hasMore/nextCursor for pagination.`,
    inputSchema: {
      type: 'object',
      properties: {
        limit: { 
          type: 'number', 
          description: 'Number of executions to return (1-100, default: 100)' 
        },
        cursor: { 
          type: 'string', 
          description: 'Pagination cursor from previous response' 
        },
        workflowId: { 
          type: 'string', 
          description: 'Filter by workflow ID' 
        },
        projectId: { 
          type: 'string', 
          description: 'Filter by project ID (enterprise feature)' 
        },
        status: { 
          type: 'string', 
          enum: ['success', 'error', 'waiting'],
          description: 'Filter by execution status' 
        },
        includeData: { 
          type: 'boolean', 
          description: 'Include execution data (default: false)' 
        }
      }
    }
  },
  {
    name: 'n8n_delete_execution',
    description: `Delete an execution record. This only removes the execution history, not any data processed.`,
    inputSchema: {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          description: 'Execution ID to delete' 
        }
      },
      required: ['id']
    }
  },

  // System Tools
  {
    name: 'n8n_health_check',
    description: `Check n8n instance health and API connectivity. Returns status and available features.`,
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'n8n_list_available_tools',
    description: `List available n8n tools and capabilities.`,
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'n8n_diagnostic',
    description: `Diagnose n8n API config. Shows tool status, API connectivity, env vars. Helps troubleshoot missing tools.`,
    inputSchema: {
      type: 'object',
      properties: {
        verbose: {
          type: 'boolean',
          description: 'Include detailed debug information (default: false)'
        }
      }
    }
  }
];