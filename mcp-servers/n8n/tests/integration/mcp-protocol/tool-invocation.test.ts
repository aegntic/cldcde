import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { TestableN8NMCPServer } from './test-helpers';

describe('MCP Tool Invocation', () => {
  let mcpServer: TestableN8NMCPServer;
  let client: Client;

  beforeEach(async () => {
    mcpServer = new TestableN8NMCPServer();
    await mcpServer.initialize();
    
    const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
    await mcpServer.connectToTransport(serverTransport);
    
    client = new Client({
      name: 'test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });
    
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await client.close();
    await mcpServer.close();
  });

  describe('Node Discovery Tools', () => {
    describe('list_nodes', () => {
      it('should list nodes with default parameters', async () => {
        const response = await client.callTool({ name: 'list_nodes', arguments: {} });
        
        expect((response as any).content).toHaveLength(1);
        expect((response as any).content[0].type).toBe('text');
        
        const result = JSON.parse(((response as any).content[0]).text);
        // The result is an object with nodes array and totalCount
        expect(result).toHaveProperty('nodes');
        expect(result).toHaveProperty('totalCount');
        
        const nodes = result.nodes;
        expect(Array.isArray(nodes)).toBe(true);
        expect(nodes.length).toBeGreaterThan(0);
        
        // Check node structure
        const firstNode = nodes[0];
        expect(firstNode).toHaveProperty('nodeType');
        expect(firstNode).toHaveProperty('displayName');
        expect(firstNode).toHaveProperty('category');
      });

      it('should filter nodes by category', async () => {
        const response = await client.callTool({ name: 'list_nodes', arguments: {
          category: 'trigger'
        }});

        const result = JSON.parse(((response as any).content[0]).text);
        const nodes = result.nodes;
        expect(nodes.length).toBeGreaterThan(0);
        nodes.forEach((node: any) => {
          expect(node.category).toBe('trigger');
        });
      });

      it('should limit results', async () => {
        const response = await client.callTool({ name: 'list_nodes', arguments: {
          limit: 5
        }});

        const result = JSON.parse(((response as any).content[0]).text);
        const nodes = result.nodes;
        expect(nodes).toHaveLength(5);
      });

      it('should filter by package', async () => {
        const response = await client.callTool({ name: 'list_nodes', arguments: {
          package: 'n8n-nodes-base'
        }});

        const result = JSON.parse(((response as any).content[0]).text);
        const nodes = result.nodes;
        expect(nodes.length).toBeGreaterThan(0);
        nodes.forEach((node: any) => {
          expect(node.package).toBe('n8n-nodes-base');
        });
      });
    });

    describe('search_nodes', () => {
      it('should search nodes by keyword', async () => {
        const response = await client.callTool({ name: 'search_nodes', arguments: {
          query: 'webhook'
        }});

        const result = JSON.parse(((response as any).content[0]).text);
        const nodes = result.results;
        expect(nodes.length).toBeGreaterThan(0);
        
        // Should find webhook node
        const webhookNode = nodes.find((n: any) => n.displayName.toLowerCase().includes('webhook'));
        expect(webhookNode).toBeDefined();
      });

      it('should support different search modes', async () => {
        // OR mode
        const orResponse = await client.callTool({ name: 'search_nodes', arguments: {
          query: 'http request',
          mode: 'OR'
        }});
        const orResult = JSON.parse(((orResponse as any).content[0]).text);
        const orNodes = orResult.results;
        expect(orNodes.length).toBeGreaterThan(0);

        // AND mode
        const andResponse = await client.callTool({ name: 'search_nodes', arguments: {
          query: 'http request',
          mode: 'AND'
        }});
        const andResult = JSON.parse(((andResponse as any).content[0]).text);
        const andNodes = andResult.results;
        expect(andNodes.length).toBeLessThanOrEqual(orNodes.length);

        // FUZZY mode - use less typo-heavy search
        const fuzzyResponse = await client.callTool({ name: 'search_nodes', arguments: {
          query: 'http req', // Partial match should work
          mode: 'FUZZY'
        }});
        const fuzzyResult = JSON.parse(((fuzzyResponse as any).content[0]).text);
        const fuzzyNodes = fuzzyResult.results;
        expect(fuzzyNodes.length).toBeGreaterThan(0);
      });

      it('should respect result limit', async () => {
        const response = await client.callTool({ name: 'search_nodes', arguments: {
          query: 'node',
          limit: 3
        }});

        const result = JSON.parse(((response as any).content[0]).text);
        const nodes = result.results;
        expect(nodes).toHaveLength(3);
      });
    });

    describe('get_node_info', () => {
      it('should get complete node information', async () => {
        const response = await client.callTool({ name: 'get_node_info', arguments: {
          nodeType: 'nodes-base.httpRequest'
        }});

        expect(((response as any).content[0]).type).toBe('text');
        const nodeInfo = JSON.parse(((response as any).content[0]).text);
        
        expect(nodeInfo).toHaveProperty('nodeType', 'nodes-base.httpRequest');
        expect(nodeInfo).toHaveProperty('displayName');
        expect(nodeInfo).toHaveProperty('properties');
        expect(Array.isArray(nodeInfo.properties)).toBe(true);
      });

      it('should handle non-existent nodes', async () => {
        try {
          await client.callTool({ name: 'get_node_info', arguments: {
            nodeType: 'nodes-base.nonExistent'
          }});
          expect.fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.message).toContain('not found');
        }
      });

      it('should handle invalid node type format', async () => {
        try {
          await client.callTool({ name: 'get_node_info', arguments: {
            nodeType: 'invalidFormat'
          }});
          expect.fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.message).toContain('not found');
        }
      });
    });

    describe('get_node_essentials', () => {
      it('should return condensed node information', async () => {
        const response = await client.callTool({ name: 'get_node_essentials', arguments: {
          nodeType: 'nodes-base.httpRequest'
        }});

        const essentials = JSON.parse(((response as any).content[0]).text);
        
        expect(essentials).toHaveProperty('nodeType');
        expect(essentials).toHaveProperty('displayName');
        expect(essentials).toHaveProperty('commonProperties');
        expect(essentials).toHaveProperty('requiredProperties');
        
        // Should be smaller than full info
        const fullResponse = await client.callTool({ name: 'get_node_info', arguments: {
          nodeType: 'nodes-base.httpRequest'
        }});
        
        expect(((response as any).content[0]).text.length).toBeLessThan(((fullResponse as any).content[0]).text.length);
      });
    });
  });

  describe('Validation Tools', () => {
    describe('validate_node_operation', () => {
      it('should validate valid node configuration', async () => {
        const response = await client.callTool({ name: 'validate_node_operation', arguments: {
          nodeType: 'nodes-base.httpRequest',
          config: {
            method: 'GET',
            url: 'https://api.example.com/data'
          }
        }});

        const validation = JSON.parse(((response as any).content[0]).text);
        expect(validation).toHaveProperty('valid');
        expect(validation).toHaveProperty('errors');
        expect(validation).toHaveProperty('warnings');
      });

      it('should detect missing required fields', async () => {
        const response = await client.callTool({ name: 'validate_node_operation', arguments: {
          nodeType: 'nodes-base.httpRequest',
          config: {
            method: 'GET'
            // Missing required 'url' field
          }
        }});

        const validation = JSON.parse(((response as any).content[0]).text);
        expect(validation.valid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
        expect(validation.errors[0].message.toLowerCase()).toContain('url');
      });

      it('should support different validation profiles', async () => {
        const profiles = ['minimal', 'runtime', 'ai-friendly', 'strict'];
        
        for (const profile of profiles) {
          const response = await client.callTool({ name: 'validate_node_operation', arguments: {
            nodeType: 'nodes-base.httpRequest',
            config: { method: 'GET', url: 'https://api.example.com' },
            profile
          }});

          const validation = JSON.parse(((response as any).content[0]).text);
          expect(validation).toHaveProperty('profile', profile);
        }
      });
    });

    describe('validate_workflow', () => {
      it('should validate complete workflow', async () => {
        const workflow = {
          nodes: [
            {
              id: '1',
              name: 'Start',
              type: 'nodes-base.manualTrigger',
              typeVersion: 1,
              position: [0, 0],
              parameters: {}
            },
            {
              id: '2',
              name: 'HTTP Request',
              type: 'nodes-base.httpRequest',
              typeVersion: 3,
              position: [250, 0],
              parameters: {
                method: 'GET',
                url: 'https://api.example.com/data'
              }
            }
          ],
          connections: {
            'Start': {
              'main': [[{ node: 'HTTP Request', type: 'main', index: 0 }]]
            }
          }
        };

        const response = await client.callTool({ name: 'validate_workflow', arguments: {
          workflow
        }});

        const validation = JSON.parse(((response as any).content[0]).text);
        expect(validation).toHaveProperty('valid');
        expect(validation).toHaveProperty('errors');
        expect(validation).toHaveProperty('warnings');
      });

      it('should detect connection errors', async () => {
        const workflow = {
          nodes: [
            {
              id: '1',
              name: 'Start',
              type: 'nodes-base.manualTrigger',
              typeVersion: 1,
              position: [0, 0],
              parameters: {}
            }
          ],
          connections: {
            'Start': {
              'main': [[{ node: 'NonExistent', type: 'main', index: 0 }]]
            }
          }
        };

        const response = await client.callTool({ name: 'validate_workflow', arguments: {
          workflow
        }});

        const validation = JSON.parse(((response as any).content[0]).text);
        expect(validation.valid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
      });

      it('should validate expressions', async () => {
        const workflow = {
          nodes: [
            {
              id: '1',
              name: 'Start',
              type: 'n8n-nodes-base.manualTrigger',
              typeVersion: 1,
              position: [0, 0],
              parameters: {}
            },
            {
              id: '2',
              name: 'Set',
              type: 'n8n-nodes-base.set',
              typeVersion: 3.4,
              position: [250, 0],
              parameters: {
                mode: 'manual',
                duplicateItem: false,
                values: {
                  string: [
                    {
                      name: 'test',
                      value: '={{ $json.invalidExpression }}'
                    }
                  ]
                }
              }
            }
          ],
          connections: {
            'Start': {
              'main': [[{ node: 'Set', type: 'main', index: 0 }]]
            }
          }
        };

        const response = await client.callTool({ name: 'validate_workflow', arguments: {
          workflow,
          options: {
            validateExpressions: true
          }
        }});

        const validation = JSON.parse(((response as any).content[0]).text);
        expect(validation).toHaveProperty('valid');
        
        // The workflow should have either errors or warnings about the expression
        if (validation.errors && validation.errors.length > 0) {
          expect(validation.errors.some((e: any) => 
            e.message.includes('expression') || e.message.includes('$json')
          )).toBe(true);
        } else if (validation.warnings) {
          expect(validation.warnings.length).toBeGreaterThan(0);
          expect(validation.warnings.some((w: any) => 
            w.message.includes('expression') || w.message.includes('$json')
          )).toBe(true);
        }
      });
    });
  });

  describe('Documentation Tools', () => {
    describe('tools_documentation', () => {
      it('should get quick start guide', async () => {
        const response = await client.callTool({ name: 'tools_documentation', arguments: {} });

        expect(((response as any).content[0]).type).toBe('text');
        expect(((response as any).content[0]).text).toContain('n8n MCP Tools');
      });

      it('should get specific tool documentation', async () => {
        const response = await client.callTool({ name: 'tools_documentation', arguments: {
          topic: 'search_nodes'
        }});

        expect(((response as any).content[0]).text).toContain('search_nodes');
        expect(((response as any).content[0]).text).toContain('Text search');
      });

      it('should get comprehensive documentation', async () => {
        const response = await client.callTool({ name: 'tools_documentation', arguments: {
          depth: 'full'
        }});

        expect(((response as any).content[0]).text.length).toBeGreaterThan(5000);
        expect(((response as any).content[0]).text).toBeDefined();
      });

      it('should handle invalid topics gracefully', async () => {
        const response = await client.callTool({ name: 'tools_documentation', arguments: {
          topic: 'nonexistent_tool'
        }});

        expect(((response as any).content[0]).text).toContain('not found');
      });
    });
  });

  describe('AI Tools', () => {
    describe('list_ai_tools', () => {
      it('should list AI-capable nodes', async () => {
        const response = await client.callTool({ name: 'list_ai_tools', arguments: {} });

        const result = JSON.parse(((response as any).content[0]).text);
        expect(result).toHaveProperty('tools');
        const aiTools = result.tools;
        expect(Array.isArray(aiTools)).toBe(true);
        expect(aiTools.length).toBeGreaterThan(0);
        
        // All should have nodeType and displayName
        aiTools.forEach((tool: any) => {
          expect(tool).toHaveProperty('nodeType');
          expect(tool).toHaveProperty('displayName');
        });
      });
    });

    describe('get_node_as_tool_info', () => {
      it('should provide AI tool usage information', async () => {
        const response = await client.callTool({ name: 'get_node_as_tool_info', arguments: {
          nodeType: 'nodes-base.slack'
        }});

        const info = JSON.parse(((response as any).content[0]).text);
        expect(info).toHaveProperty('nodeType');
        expect(info).toHaveProperty('isMarkedAsAITool');
        expect(info).toHaveProperty('aiToolCapabilities');
        expect(info.aiToolCapabilities).toHaveProperty('commonUseCases');
      });
    });
  });

  describe('Task Templates', () => {
    describe('get_node_for_task', () => {
      it('should return pre-configured node for task', async () => {
        const response = await client.callTool({ name: 'get_node_for_task', arguments: {
          task: 'post_json_request'
        }});

        const config = JSON.parse(((response as any).content[0]).text);
        expect(config).toHaveProperty('task');
        expect(config).toHaveProperty('nodeType');
        expect(config).toHaveProperty('configuration');
        expect(config.configuration.method).toBe('POST');
      });

      it('should handle unknown tasks', async () => {
        try {
          await client.callTool({ name: 'get_node_for_task', arguments: {
            task: 'unknown_task'
          }});
          expect.fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.message).toContain('Unknown task');
        }
      });
    });

    describe('list_tasks', () => {
      it('should list all available tasks', async () => {
        const response = await client.callTool({ name: 'list_tasks', arguments: {} });

        const result = JSON.parse(((response as any).content[0]).text);
        expect(result).toHaveProperty('totalTasks');
        expect(result).toHaveProperty('categories');
        expect(result.totalTasks).toBeGreaterThan(0);
        
        // Check categories structure
        const categories = result.categories;
        expect(typeof categories).toBe('object');
        
        // Check at least one category has tasks
        const hasTasksInCategories = Object.values(categories).some((tasks: any) => 
          Array.isArray(tasks) && tasks.length > 0
        );
        expect(hasTasksInCategories).toBe(true);
      });

      it('should filter by category', async () => {
        const response = await client.callTool({ name: 'list_tasks', arguments: {
          category: 'HTTP/API'
        }});

        const result = JSON.parse(((response as any).content[0]).text);
        expect(result).toHaveProperty('category', 'HTTP/API');
        expect(result).toHaveProperty('tasks');
        
        const httpTasks = result.tasks;
        expect(Array.isArray(httpTasks)).toBe(true);
        expect(httpTasks.length).toBeGreaterThan(0);
        
        httpTasks.forEach((task: any) => {
          expect(task).toHaveProperty('task');
          expect(task).toHaveProperty('description');
          expect(task).toHaveProperty('nodeType');
        });
      });
    });
  });

  describe('Complex Tool Interactions', () => {
    it('should handle tool chaining', async () => {
      // Search for nodes
      const searchResponse = await client.callTool({ name: 'search_nodes', arguments: {
        query: 'slack'
      }});
      const searchResult = JSON.parse(((searchResponse as any).content[0]).text);
      const nodes = searchResult.results;
      
      // Get info for first result
      const firstNode = nodes[0];
      const infoResponse = await client.callTool({ name: 'get_node_info', arguments: {
        nodeType: firstNode.nodeType
      }});
      
      expect(((infoResponse as any).content[0]).text).toContain(firstNode.displayName);
    });

    it('should handle parallel tool calls', async () => {
      const tools = [
        'list_nodes',
        'get_database_statistics',
        'list_ai_tools',
        'list_tasks'
      ];

      const promises = tools.map(tool => 
        client.callTool({ name: tool as any, arguments: {} })
      );

      const responses = await Promise.all(promises);
      
      expect(responses).toHaveLength(tools.length);
      responses.forEach(response => {
        expect(response.content).toHaveLength(1);
        expect(((response as any).content[0]).type).toBe('text');
      });
    });

    it('should maintain consistency across related tools', async () => {
      // Get node via different methods
      const nodeType = 'nodes-base.httpRequest';
      
      const [fullInfo, essentials, searchResult] = await Promise.all([
        client.callTool({ name: 'get_node_info', arguments: { nodeType } }),
        client.callTool({ name: 'get_node_essentials', arguments: { nodeType } }),
        client.callTool({ name: 'search_nodes', arguments: { query: 'httpRequest' } })
      ]);

      const full = JSON.parse(((fullInfo as any).content[0]).text);
      const essential = JSON.parse(((essentials as any).content[0]).text);
      const searchData = JSON.parse(((searchResult as any).content[0]).text);
      const search = searchData.results;

      // Should all reference the same node
      expect(full.nodeType).toBe('nodes-base.httpRequest');
      expect(essential.displayName).toBe(full.displayName);
      expect(search.find((n: any) => n.nodeType === 'nodes-base.httpRequest')).toBeDefined();
    });
  });
});
