import { expect } from 'vitest';
import { WorkflowNode, Workflow } from '@/types/n8n-api';

// Use any type for INodeDefinition since it's from n8n-workflow package
type INodeDefinition = any;

/**
 * Custom assertions for n8n-mcp tests
 */

/**
 * Assert that a value is a valid node definition
 */
export function expectValidNodeDefinition(node: any) {
  expect(node).toBeDefined();
  expect(node).toHaveProperty('name');
  expect(node).toHaveProperty('displayName');
  expect(node).toHaveProperty('version');
  expect(node).toHaveProperty('properties');
  expect(node.properties).toBeInstanceOf(Array);
  
  // Check version is a positive number
  expect(node.version).toBeGreaterThan(0);
  
  // Check required string fields
  expect(typeof node.name).toBe('string');
  expect(typeof node.displayName).toBe('string');
  expect(node.name).not.toBe('');
  expect(node.displayName).not.toBe('');
}

/**
 * Assert that a value is a valid workflow
 */
export function expectValidWorkflow(workflow: any): asserts workflow is Workflow {
  expect(workflow).toBeDefined();
  expect(workflow).toHaveProperty('nodes');
  expect(workflow).toHaveProperty('connections');
  expect(workflow.nodes).toBeInstanceOf(Array);
  expect(workflow.connections).toBeTypeOf('object');
  
  // Check each node is valid
  workflow.nodes.forEach((node: any) => {
    expectValidWorkflowNode(node);
  });
  
  // Check connections reference valid nodes
  const nodeIds = new Set(workflow.nodes.map((n: WorkflowNode) => n.id));
  Object.keys(workflow.connections).forEach(sourceId => {
    expect(nodeIds.has(sourceId)).toBe(true);
    
    const connections = workflow.connections[sourceId];
    Object.values(connections).forEach((outputConnections: any) => {
      outputConnections.forEach((connectionSet: any) => {
        connectionSet.forEach((connection: any) => {
          expect(nodeIds.has(connection.node)).toBe(true);
        });
      });
    });
  });
}

/**
 * Assert that a value is a valid workflow node
 */
export function expectValidWorkflowNode(node: any): asserts node is WorkflowNode {
  expect(node).toBeDefined();
  expect(node).toHaveProperty('id');
  expect(node).toHaveProperty('name');
  expect(node).toHaveProperty('type');
  expect(node).toHaveProperty('typeVersion');
  expect(node).toHaveProperty('position');
  expect(node).toHaveProperty('parameters');
  
  // Check types
  expect(typeof node.id).toBe('string');
  expect(typeof node.name).toBe('string');
  expect(typeof node.type).toBe('string');
  expect(typeof node.typeVersion).toBe('number');
  expect(node.position).toBeInstanceOf(Array);
  expect(node.position).toHaveLength(2);
  expect(typeof node.position[0]).toBe('number');
  expect(typeof node.position[1]).toBe('number');
  expect(node.parameters).toBeTypeOf('object');
}

/**
 * Assert that validation errors contain expected messages
 */
export function expectValidationErrors(errors: any[], expectedMessages: string[]) {
  expect(errors).toHaveLength(expectedMessages.length);
  
  const errorMessages = errors.map(e => 
    typeof e === 'string' ? e : e.message || e.error || String(e)
  );
  
  expectedMessages.forEach(expected => {
    const found = errorMessages.some(msg => 
      msg.toLowerCase().includes(expected.toLowerCase())
    );
    expect(found).toBe(true);
  });
}

/**
 * Assert that a property definition is valid
 */
export function expectValidPropertyDefinition(property: any) {
  expect(property).toBeDefined();
  expect(property).toHaveProperty('name');
  expect(property).toHaveProperty('displayName');
  expect(property).toHaveProperty('type');
  
  // Check required fields
  expect(typeof property.name).toBe('string');
  expect(typeof property.displayName).toBe('string');
  expect(typeof property.type).toBe('string');
  
  // Check common property types
  const validTypes = [
    'string', 'number', 'boolean', 'options', 'multiOptions',
    'collection', 'fixedCollection', 'json', 'color', 'dateTime'
  ];
  expect(validTypes).toContain(property.type);
  
  // Check options if present
  if (property.type === 'options' || property.type === 'multiOptions') {
    expect(property.options).toBeInstanceOf(Array);
    expect(property.options.length).toBeGreaterThan(0);
    
    property.options.forEach((option: any) => {
      expect(option).toHaveProperty('name');
      expect(option).toHaveProperty('value');
    });
  }
  
  // Check displayOptions if present
  if (property.displayOptions) {
    expect(property.displayOptions).toBeTypeOf('object');
    if (property.displayOptions.show) {
      expect(property.displayOptions.show).toBeTypeOf('object');
    }
    if (property.displayOptions.hide) {
      expect(property.displayOptions.hide).toBeTypeOf('object');
    }
  }
}

/**
 * Assert that an MCP tool response is valid
 */
export function expectValidMCPResponse(response: any) {
  expect(response).toBeDefined();
  
  // Check for error response
  if (response.error) {
    expect(response.error).toHaveProperty('code');
    expect(response.error).toHaveProperty('message');
    expect(typeof response.error.code).toBe('number');
    expect(typeof response.error.message).toBe('string');
  } else {
    // Check for success response
    expect(response.result).toBeDefined();
  }
}

/**
 * Assert that a database row has required metadata
 */
export function expectDatabaseMetadata(row: any) {
  expect(row).toHaveProperty('created_at');
  expect(row).toHaveProperty('updated_at');
  
  // Check dates are valid
  const createdAt = new Date(row.created_at);
  const updatedAt = new Date(row.updated_at);
  
  expect(createdAt.toString()).not.toBe('Invalid Date');
  expect(updatedAt.toString()).not.toBe('Invalid Date');
  expect(updatedAt.getTime()).toBeGreaterThanOrEqual(createdAt.getTime());
}

/**
 * Assert that an expression is valid n8n expression syntax
 */
export function expectValidExpression(expression: string) {
  // Check for basic expression syntax
  const expressionPattern = /\{\{.*\}\}/;
  expect(expression).toMatch(expressionPattern);
  
  // Check for balanced braces
  let braceCount = 0;
  for (const char of expression) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    expect(braceCount).toBeGreaterThanOrEqual(0);
  }
  expect(braceCount).toBe(0);
}

/**
 * Assert that a template is valid
 */
export function expectValidTemplate(template: any) {
  expect(template).toBeDefined();
  expect(template).toHaveProperty('id');
  expect(template).toHaveProperty('name');
  expect(template).toHaveProperty('workflow');
  expect(template).toHaveProperty('categories');
  
  // Check workflow is valid
  expectValidWorkflow(template.workflow);
  
  // Check categories
  expect(template.categories).toBeInstanceOf(Array);
  expect(template.categories.length).toBeGreaterThan(0);
}

/**
 * Assert that search results are relevant
 */
export function expectRelevantSearchResults(
  results: any[],
  query: string,
  minRelevance = 0.5
) {
  expect(results).toBeInstanceOf(Array);
  
  if (results.length === 0) return;
  
  // Check each result contains query terms
  const queryTerms = query.toLowerCase().split(/\s+/);
  
  results.forEach(result => {
    const searchableText = JSON.stringify(result).toLowerCase();
    const matchCount = queryTerms.filter(term => 
      searchableText.includes(term)
    ).length;
    
    const relevance = matchCount / queryTerms.length;
    expect(relevance).toBeGreaterThanOrEqual(minRelevance);
  });
}

/**
 * Custom matchers for n8n-mcp
 */
export const customMatchers = {
  toBeValidNodeDefinition(received: any) {
    try {
      expectValidNodeDefinition(received);
      return { pass: true, message: () => 'Node definition is valid' };
    } catch (error: any) {
      return { pass: false, message: () => error.message };
    }
  },
  
  toBeValidWorkflow(received: any) {
    try {
      expectValidWorkflow(received);
      return { pass: true, message: () => 'Workflow is valid' };
    } catch (error: any) {
      return { pass: false, message: () => error.message };
    }
  },
  
  toContainValidationError(received: any[], expected: string) {
    const errorMessages = received.map(e => 
      typeof e === 'string' ? e : e.message || e.error || String(e)
    );
    
    const found = errorMessages.some(msg => 
      msg.toLowerCase().includes(expected.toLowerCase())
    );
    
    return {
      pass: found,
      message: () => found
        ? `Found validation error containing "${expected}"`
        : `No validation error found containing "${expected}". Errors: ${errorMessages.join(', ')}`
    };
  }
};