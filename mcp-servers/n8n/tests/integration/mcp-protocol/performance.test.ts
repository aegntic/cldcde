import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { TestableN8NMCPServer } from './test-helpers';

describe('MCP Performance Tests', () => {
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
    
    // Verify database is populated by checking statistics
    const statsResponse = await client.callTool({ name: 'get_database_statistics', arguments: {} });
    if ((statsResponse as any).content && (statsResponse as any).content[0]) {
      const stats = JSON.parse((statsResponse as any).content[0].text);
      // Ensure database has nodes for testing
      if (!stats.totalNodes || stats.totalNodes === 0) {
        console.error('Database stats:', stats);
        throw new Error('Test database not properly populated');
      }
    }
  });

  afterEach(async () => {
    await client.close();
    await mcpServer.close();
  });

  describe('Response Time Benchmarks', () => {
    it('should respond to simple queries quickly', async () => {
      const iterations = 100;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        await client.callTool({ name: 'get_database_statistics', arguments: {} });
      }

      const duration = performance.now() - start;
      const avgTime = duration / iterations;

      console.log(`Average response time for get_database_statistics: ${avgTime.toFixed(2)}ms`);
      console.log(`Environment: ${process.env.CI ? 'CI' : 'Local'}`);
      
      // Environment-aware threshold
      const threshold = process.env.CI ? 20 : 10;
      expect(avgTime).toBeLessThan(threshold);
    });

    it('should handle list operations efficiently', async () => {
      const iterations = 50;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        await client.callTool({ name: 'list_nodes', arguments: { limit: 10 } });
      }

      const duration = performance.now() - start;
      const avgTime = duration / iterations;

      console.log(`Average response time for list_nodes: ${avgTime.toFixed(2)}ms`);
      console.log(`Environment: ${process.env.CI ? 'CI' : 'Local'}`);
      
      // Environment-aware threshold
      const threshold = process.env.CI ? 40 : 20;
      expect(avgTime).toBeLessThan(threshold);
    });

    it('should perform searches efficiently', async () => {
      const searches = ['http', 'webhook', 'slack', 'database', 'api'];
      const iterations = 20;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        for (const query of searches) {
          await client.callTool({ name: 'search_nodes', arguments: { query } });
        }
      }

      const totalRequests = iterations * searches.length;
      const duration = performance.now() - start;
      const avgTime = duration / totalRequests;

      console.log(`Average response time for search_nodes: ${avgTime.toFixed(2)}ms`);
      console.log(`Environment: ${process.env.CI ? 'CI' : 'Local'}`);
      
      // Environment-aware threshold
      const threshold = process.env.CI ? 60 : 30;
      expect(avgTime).toBeLessThan(threshold);
    });

    it('should retrieve node info quickly', async () => {
      const nodeTypes = [
        'nodes-base.httpRequest',
        'nodes-base.webhook',
        'nodes-base.set',
        'nodes-base.if',
        'nodes-base.switch'
      ];

      const start = performance.now();

      for (const nodeType of nodeTypes) {
        await client.callTool({ name: 'get_node_info', arguments: { nodeType } });
      }

      const duration = performance.now() - start;
      const avgTime = duration / nodeTypes.length;

      console.log(`Average response time for get_node_info: ${avgTime.toFixed(2)}ms`);
      console.log(`Environment: ${process.env.CI ? 'CI' : 'Local'}`);
      
      // Environment-aware threshold (these are large responses)
      const threshold = process.env.CI ? 100 : 50;
      expect(avgTime).toBeLessThan(threshold);
    });
  });

  describe('Concurrent Request Performance', () => {
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 50;
      const start = performance.now();

      const promises = [];
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          client.callTool({ name: 'list_nodes', arguments: { limit: 5 } })
        );
      }

      await Promise.all(promises);

      const duration = performance.now() - start;
      const avgTime = duration / concurrentRequests;

      console.log(`Average time for ${concurrentRequests} concurrent requests: ${avgTime.toFixed(2)}ms`);
      console.log(`Environment: ${process.env.CI ? 'CI' : 'Local'}`);
      
      // Concurrent requests should be more efficient than sequential
      const threshold = process.env.CI ? 25 : 10;
      expect(avgTime).toBeLessThan(threshold);
    });

    it('should handle mixed concurrent operations', async () => {
      const operations = [
        { tool: 'list_nodes', params: { limit: 10 } },
        { tool: 'search_nodes', params: { query: 'http' } },
        { tool: 'get_database_statistics', params: {} },
        { tool: 'list_ai_tools', params: {} },
        { tool: 'list_tasks', params: {} }
      ];

      const rounds = 10;
      const start = performance.now();

      for (let round = 0; round < rounds; round++) {
        const promises = operations.map(op => 
          client.callTool({ name: op.tool, arguments: op.params })
        );
        await Promise.all(promises);
      }

      const duration = performance.now() - start;
      const totalRequests = rounds * operations.length;
      const avgTime = duration / totalRequests;

      console.log(`Average time for mixed operations: ${avgTime.toFixed(2)}ms`);
      console.log(`Environment: ${process.env.CI ? 'CI' : 'Local'}`);
      
      const threshold = process.env.CI ? 40 : 20;
      expect(avgTime).toBeLessThan(threshold);
    });
  });

  describe('Large Data Performance', () => {
    it('should handle large node lists efficiently', async () => {
      const start = performance.now();

      const response = await client.callTool({ name: 'list_nodes', arguments: {
        limit: 200 // Get many nodes
      } });

      const duration = performance.now() - start;

      console.log(`Time to list 200 nodes: ${duration.toFixed(2)}ms`);
      
      // Environment-aware threshold
      const threshold = process.env.CI ? 200 : 100;
      expect(duration).toBeLessThan(threshold);

      // Check the response content
      expect(response).toBeDefined();
      
      let nodes;
      if (response.content && Array.isArray(response.content) && response.content[0]) {
        // MCP standard response format
        expect(response.content[0].type).toBe('text');
        expect(response.content[0].text).toBeDefined();
        
        try {
          const parsed = JSON.parse(response.content[0].text);
          // list_nodes returns an object with nodes property
          nodes = parsed.nodes || parsed;
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          console.error('Response text was:', response.content[0].text);
          throw e;
        }
      } else if (Array.isArray(response)) {
        // Direct array response
        nodes = response;
      } else if (response.nodes) {
        // Object with nodes property
        nodes = response.nodes;
      } else {
        console.error('Unexpected response format:', response);
        throw new Error('Unexpected response format');
      }
      
      expect(nodes).toBeDefined();
      expect(Array.isArray(nodes)).toBe(true);
      expect(nodes.length).toBeGreaterThan(100);
    });

    it('should handle large workflow validation efficiently', async () => {
      // Create a large workflow
      const nodeCount = 100;
      const nodes = [];
      const connections: any = {};

      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          id: String(i),
          name: `Node${i}`,
          type: i % 3 === 0 ? 'nodes-base.httpRequest' : 'nodes-base.set',
          typeVersion: 1,
          position: [i * 100, 0],
          parameters: i % 3 === 0 ? 
            { method: 'GET', url: 'https://api.example.com' } :
            { values: { string: [{ name: 'test', value: 'value' }] } }
        });

        if (i > 0) {
          connections[`Node${i-1}`] = {
            'main': [[{ node: `Node${i}`, type: 'main', index: 0 }]]
          };
        }
      }

      const start = performance.now();

      const response = await client.callTool({ name: 'validate_workflow', arguments: {
        workflow: { nodes, connections }
      } });

      const duration = performance.now() - start;

      console.log(`Time to validate ${nodeCount} node workflow: ${duration.toFixed(2)}ms`);
      
      // Environment-aware threshold
      const threshold = process.env.CI ? 1000 : 500;
      expect(duration).toBeLessThan(threshold);

      // Check the response content - MCP callTool returns content array with text
      expect(response).toBeDefined();
      expect((response as any).content).toBeDefined();
      expect(Array.isArray((response as any).content)).toBe(true);
      expect((response as any).content.length).toBeGreaterThan(0);
      expect((response as any).content[0]).toBeDefined();
      expect((response as any).content[0].type).toBe('text');
      expect((response as any).content[0].text).toBeDefined();
      
      // Parse the JSON response
      const validation = JSON.parse((response as any).content[0].text);
      
      expect(validation).toBeDefined();
      expect(validation).toHaveProperty('valid');
    });
  });

  describe('Memory Efficiency', () => {
    it('should handle repeated operations without memory leaks', async () => {
      const iterations = 1000;
      const batchSize = 100;

      // Measure initial memory if available
      const initialMemory = process.memoryUsage();

      for (let i = 0; i < iterations; i += batchSize) {
        const promises = [];
        
        for (let j = 0; j < batchSize; j++) {
          promises.push(
            client.callTool({ name: 'get_database_statistics', arguments: {} })
          );
        }

        await Promise.all(promises);

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(`Memory increase after ${iterations} operations: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should release memory after large operations', async () => {
      const initialMemory = process.memoryUsage();

      // Perform large operations
      for (let i = 0; i < 10; i++) {
        await client.callTool({ name: 'list_nodes', arguments: { limit: 200 } });
        await client.callTool({ name: 'get_node_info', arguments: { 
          nodeType: 'nodes-base.httpRequest' 
        } });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(`Memory increase after large operations: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

      // Should not retain excessive memory
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024);
    });
  });

  describe('Scalability Tests', () => {
    it('should maintain performance with increasing load', async () => {
      const loadLevels = [10, 50, 100, 200];
      const results: any[] = [];

      for (const load of loadLevels) {
        const start = performance.now();
        
        const promises = [];
        for (let i = 0; i < load; i++) {
          promises.push(
            client.callTool({ name: 'list_nodes', arguments: { limit: 1 } })
          );
        }

        await Promise.all(promises);
        
        const duration = performance.now() - start;
        const avgTime = duration / load;

        results.push({
          load,
          totalTime: duration,
          avgTime
        });

        console.log(`Load ${load}: Total ${duration.toFixed(2)}ms, Avg ${avgTime.toFixed(2)}ms`);
      }

      // Average time should not increase dramatically with load
      const firstAvg = results[0].avgTime;
      const lastAvg = results[results.length - 1].avgTime;
      
      console.log(`Environment: ${process.env.CI ? 'CI' : 'Local'}`);
      console.log(`Performance scaling - First avg: ${firstAvg.toFixed(2)}ms, Last avg: ${lastAvg.toFixed(2)}ms`);
      
      // Environment-aware scaling factor
      const scalingFactor = process.env.CI ? 3 : 2;
      expect(lastAvg).toBeLessThan(firstAvg * scalingFactor);
    });

    it('should handle burst traffic', async () => {
      const burstSize = 100;
      const start = performance.now();

      // Simulate burst of requests
      const promises = [];
      for (let i = 0; i < burstSize; i++) {
        const operation = i % 4;
        switch (operation) {
          case 0:
            promises.push(client.callTool({ name: 'list_nodes', arguments: { limit: 5 } }));
            break;
          case 1:
            promises.push(client.callTool({ name: 'search_nodes', arguments: { query: 'test' } }));
            break;
          case 2:
            promises.push(client.callTool({ name: 'get_database_statistics', arguments: {} }));
            break;
          case 3:
            promises.push(client.callTool({ name: 'list_ai_tools', arguments: {} }));
            break;
        }
      }

      await Promise.all(promises);

      const duration = performance.now() - start;

      console.log(`Burst of ${burstSize} requests completed in ${duration.toFixed(2)}ms`);
      console.log(`Environment: ${process.env.CI ? 'CI' : 'Local'}`);

      // Should handle burst within reasonable time
      const threshold = process.env.CI ? 2000 : 1000;
      expect(duration).toBeLessThan(threshold);
    });
  });

  describe('Critical Path Optimization', () => {
    it('should optimize tool listing performance', async () => {
      // Warm up with multiple calls to ensure everything is initialized
      for (let i = 0; i < 5; i++) {
        await client.callTool({ name: 'list_nodes', arguments: { limit: 1 } });
      }

      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await client.callTool({ name: 'list_nodes', arguments: { limit: 20 } });
        times.push(performance.now() - start);
      }

      // Remove outliers (first few runs might be slower)
      times.sort((a, b) => a - b);
      const trimmedTimes = times.slice(10, -10); // Remove top and bottom 10%
      
      const avgTime = trimmedTimes.reduce((a, b) => a + b, 0) / trimmedTimes.length;
      const minTime = Math.min(...trimmedTimes);
      const maxTime = Math.max(...trimmedTimes);

      console.log(`list_nodes performance - Avg: ${avgTime.toFixed(2)}ms, Min: ${minTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);
      console.log(`Environment: ${process.env.CI ? 'CI' : 'Local'}`);

      // Environment-aware thresholds
      const threshold = process.env.CI ? 25 : 10;
      expect(avgTime).toBeLessThan(threshold);
      
      // Max should not be too much higher than average (no outliers)
      // More lenient in CI due to resource contention
      const maxMultiplier = process.env.CI ? 5 : 3;
      expect(maxTime).toBeLessThan(avgTime * maxMultiplier);
    });

    it('should optimize search performance', async () => {
      // Warm up with multiple calls
      for (let i = 0; i < 3; i++) {
        await client.callTool({ name: 'search_nodes', arguments: { query: 'test' } });
      }

      const queries = ['http', 'webhook', 'database', 'api', 'slack'];
      const times: number[] = [];

      for (const query of queries) {
        for (let i = 0; i < 20; i++) {
          const start = performance.now();
          await client.callTool({ name: 'search_nodes', arguments: { query } });
          times.push(performance.now() - start);
        }
      }

      // Remove outliers
      times.sort((a, b) => a - b);
      const trimmedTimes = times.slice(10, -10); // Remove top and bottom 10%
      
      const avgTime = trimmedTimes.reduce((a, b) => a + b, 0) / trimmedTimes.length;

      console.log(`search_nodes average performance: ${avgTime.toFixed(2)}ms`);
      console.log(`Environment: ${process.env.CI ? 'CI' : 'Local'}`);

      // Environment-aware threshold
      const threshold = process.env.CI ? 35 : 15;
      expect(avgTime).toBeLessThan(threshold);
    });

    it('should cache effectively for repeated queries', async () => {
      const nodeType = 'nodes-base.httpRequest';

      // First call (cold)
      const coldStart = performance.now();
      await client.callTool({ name: 'get_node_info', arguments: { nodeType } });
      const coldTime = performance.now() - coldStart;

      // Give cache time to settle
      await new Promise(resolve => setTimeout(resolve, 10));

      // Subsequent calls (potentially cached)
      const warmTimes: number[] = [];
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        await client.callTool({ name: 'get_node_info', arguments: { nodeType } });
        warmTimes.push(performance.now() - start);
      }

      // Remove outliers from warm times
      warmTimes.sort((a, b) => a - b);
      const trimmedWarmTimes = warmTimes.slice(1, -1); // Remove highest and lowest
      const avgWarmTime = trimmedWarmTimes.reduce((a, b) => a + b, 0) / trimmedWarmTimes.length;

      console.log(`Cold time: ${coldTime.toFixed(2)}ms, Avg warm time: ${avgWarmTime.toFixed(2)}ms`);
      console.log(`Environment: ${process.env.CI ? 'CI' : 'Local'}`);

      // In CI, caching might not be as effective due to resource constraints
      const cacheMultiplier = process.env.CI ? 1.5 : 1.1;
      
      // Warm calls should be faster or at least not significantly slower
      expect(avgWarmTime).toBeLessThanOrEqual(coldTime * cacheMultiplier);
    });
  });

  describe('Stress Tests', () => {
    it('should handle sustained high load', async () => {
      const duration = 5000; // 5 seconds
      const start = performance.now();
      let requestCount = 0;
      let errorCount = 0;

      while (performance.now() - start < duration) {
        try {
          await client.callTool({ name: 'get_database_statistics', arguments: {} });
          requestCount++;
        } catch (error) {
          errorCount++;
        }
      }

      const actualDuration = performance.now() - start;
      const requestsPerSecond = requestCount / (actualDuration / 1000);

      console.log(`Sustained load test - Requests: ${requestCount}, RPS: ${requestsPerSecond.toFixed(2)}, Errors: ${errorCount}`);
      console.log(`Environment: ${process.env.CI ? 'CI' : 'Local'}`);

      // Environment-aware RPS threshold
      const rpsThreshold = process.env.CI ? 50 : 100;
      expect(requestsPerSecond).toBeGreaterThan(rpsThreshold);
      
      // Error rate should be very low
      expect(errorCount).toBe(0);
    });

    it('should recover from performance degradation', async () => {
      // Create heavy load
      const heavyPromises = [];
      for (let i = 0; i < 200; i++) {
        heavyPromises.push(
          client.callTool({ name: 'validate_workflow', arguments: {
            workflow: {
              nodes: Array(20).fill(null).map((_, idx) => ({
                id: String(idx),
                name: `Node${idx}`,
                type: 'nodes-base.set',
                typeVersion: 1,
                position: [idx * 100, 0],
                parameters: {}
              })),
              connections: {}
            }
          } })
        );
      }

      await Promise.all(heavyPromises);

      // Measure performance after heavy load
      const recoveryTimes: number[] = [];
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        await client.callTool({ name: 'get_database_statistics', arguments: {} });
        recoveryTimes.push(performance.now() - start);
      }

      const avgRecoveryTime = recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length;

      console.log(`Average response time after heavy load: ${avgRecoveryTime.toFixed(2)}ms`);
      console.log(`Environment: ${process.env.CI ? 'CI' : 'Local'}`);

      // Should recover to normal performance
      const threshold = process.env.CI ? 25 : 10;
      expect(avgRecoveryTime).toBeLessThan(threshold);
    });
  });
});