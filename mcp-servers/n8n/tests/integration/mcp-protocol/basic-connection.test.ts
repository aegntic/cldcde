import { describe, it, expect } from 'vitest';
import { N8NDocumentationMCPServer } from '../../../src/mcp/server';

describe('Basic MCP Connection', () => {
  it('should initialize MCP server', async () => {
    const server = new N8NDocumentationMCPServer();
    
    // Test executeTool directly - it returns raw data
    const result = await server.executeTool('get_database_statistics', {});
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result.totalNodes).toBeDefined();
    expect(result.statistics).toBeDefined();
    
    await server.shutdown();
  });
  
  it('should execute list_nodes tool', async () => {
    const server = new N8NDocumentationMCPServer();
    
    // First check if we have any nodes in the database
    const stats = await server.executeTool('get_database_statistics', {});
    const hasNodes = stats.totalNodes > 0;
    
    const result = await server.executeTool('list_nodes', { limit: 5 });
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result.nodes).toBeDefined();
    expect(Array.isArray(result.nodes)).toBe(true);
    
    if (hasNodes) {
      // If database has nodes, we should get up to 5
      expect(result.nodes.length).toBeLessThanOrEqual(5);
      expect(result.nodes.length).toBeGreaterThan(0);
      expect(result.nodes[0]).toHaveProperty('nodeType');
      expect(result.nodes[0]).toHaveProperty('displayName');
    } else {
      // In test environment with empty database, we expect empty results
      expect(result.nodes).toHaveLength(0);
    }
    
    await server.shutdown();
  });
  
  it('should search nodes', async () => {
    const server = new N8NDocumentationMCPServer();
    
    // First check if we have any nodes in the database
    const stats = await server.executeTool('get_database_statistics', {});
    const hasNodes = stats.totalNodes > 0;
    
    const result = await server.executeTool('search_nodes', { query: 'webhook' });
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result.results).toBeDefined();
    expect(Array.isArray(result.results)).toBe(true);
    
    // Only expect results if the database has nodes
    if (hasNodes) {
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.totalCount).toBeGreaterThan(0);
      
      // Should find webhook node
      const webhookNode = result.results.find((n: any) => n.nodeType === 'nodes-base.webhook');
      expect(webhookNode).toBeDefined();
      expect(webhookNode.displayName).toContain('Webhook');
    } else {
      // In test environment with empty database, we expect empty results
      expect(result.results).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    }
    
    await server.shutdown();
  });
});