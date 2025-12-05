import { describe, it, expect, beforeEach } from 'vitest';
import { SimpleParser } from '@/parsers/simple-parser';
import {
  programmaticNodeFactory,
  declarativeNodeFactory,
  triggerNodeFactory,
  webhookNodeFactory,
  aiToolNodeFactory,
  versionedNodeClassFactory,
  versionedNodeTypeClassFactory,
  malformedNodeFactory,
  nodeClassFactory,
  propertyFactory,
  stringPropertyFactory,
  resourcePropertyFactory,
  operationPropertyFactory
} from '@tests/fixtures/factories/parser-node.factory';

describe('SimpleParser', () => {
  let parser: SimpleParser;

  beforeEach(() => {
    parser = new SimpleParser();
  });

  describe('parse method', () => {
    it('should parse a basic programmatic node', () => {
      const nodeDefinition = programmaticNodeFactory.build();
      const NodeClass = nodeClassFactory.build({ description: nodeDefinition });
      
      const result = parser.parse(NodeClass);
      
      expect(result).toMatchObject({
        style: 'programmatic',
        nodeType: nodeDefinition.name,
        displayName: nodeDefinition.displayName,
        description: nodeDefinition.description,
        category: nodeDefinition.group?.[0],
        properties: nodeDefinition.properties,
        credentials: nodeDefinition.credentials || [],
        isAITool: false,
        isWebhook: false,
        version: nodeDefinition.version?.toString() || '1',
        isVersioned: false,
        isTrigger: false,
        operations: expect.any(Array)
      });
    });

    it('should parse a declarative node', () => {
      const nodeDefinition = declarativeNodeFactory.build();
      // Fix the routing structure for simple parser - it expects operation.options to be an array
      nodeDefinition.routing.request!.operation = {
        options: [
          { name: 'Create User', value: 'createUser' },
          { name: 'Get User', value: 'getUser' }
        ]
      } as any;
      const NodeClass = nodeClassFactory.build({ description: nodeDefinition });
      
      const result = parser.parse(NodeClass);
      
      expect(result.style).toBe('declarative');
      expect(result.operations.length).toBeGreaterThan(0);
    });

    it('should detect trigger nodes', () => {
      const nodeDefinition = triggerNodeFactory.build();
      const NodeClass = nodeClassFactory.build({ description: nodeDefinition });
      
      const result = parser.parse(NodeClass);
      
      expect(result.isTrigger).toBe(true);
    });

    it('should detect webhook nodes', () => {
      const nodeDefinition = webhookNodeFactory.build();
      const NodeClass = nodeClassFactory.build({ description: nodeDefinition });
      
      const result = parser.parse(NodeClass);
      
      expect(result.isWebhook).toBe(true);
    });

    it('should detect AI tool nodes', () => {
      const nodeDefinition = aiToolNodeFactory.build();
      // Fix the routing structure for simple parser
      nodeDefinition.routing.request!.operation = {
        options: [
          { name: 'Create', value: 'create' }
        ]
      } as any;
      const NodeClass = nodeClassFactory.build({ description: nodeDefinition });
      
      const result = parser.parse(NodeClass);
      
      expect(result.isAITool).toBe(true);
    });

    it('should parse VersionedNodeType class', () => {
      const versionedDef = versionedNodeClassFactory.build();
      const VersionedNodeClass = class VersionedNodeType {
        baseDescription = versionedDef.baseDescription;
        nodeVersions = versionedDef.nodeVersions;
        currentVersion = versionedDef.baseDescription!.defaultVersion;
        
        constructor() {
          Object.defineProperty(this.constructor, 'name', {
            value: 'VersionedNodeType',
            configurable: true
          });
        }
      };
      
      const result = parser.parse(VersionedNodeClass);
      
      expect(result.isVersioned).toBe(true);
      expect(result.nodeType).toBe(versionedDef.baseDescription!.name);
      expect(result.displayName).toBe(versionedDef.baseDescription!.displayName);
      expect(result.version).toBe(versionedDef.baseDescription!.defaultVersion.toString());
    });

    it('should merge baseDescription with version-specific description', () => {
      const VersionedNodeClass = class VersionedNodeType {
        baseDescription = {
          name: 'mergedNode',
          displayName: 'Base Display Name',
          description: 'Base description'
        };
        
        nodeVersions = {
          1: {
            description: {
              displayName: 'Version 1 Display Name',
              properties: [propertyFactory.build()]
            }
          }
        };
        
        currentVersion = 1;
        
        constructor() {
          Object.defineProperty(this.constructor, 'name', {
            value: 'VersionedNodeType',
            configurable: true
          });
        }
      };
      
      const result = parser.parse(VersionedNodeClass);
      
      // Should merge baseDescription with version description
      expect(result.nodeType).toBe('mergedNode'); // From base
      expect(result.displayName).toBe('Version 1 Display Name'); // From version (overrides base)
      expect(result.description).toBe('Base description'); // From base
    });

    it('should throw error for nodes without name', () => {
      const nodeDefinition = malformedNodeFactory.build();
      const NodeClass = nodeClassFactory.build({ description: nodeDefinition });
      
      expect(() => parser.parse(NodeClass)).toThrow('Node is missing name property');
    });

    it('should handle nodes that fail to instantiate', () => {
      const NodeClass = class {
        constructor() {
          throw new Error('Cannot instantiate');
        }
      };
      
      expect(() => parser.parse(NodeClass)).toThrow('Node is missing name property');
    });

    it('should handle static description property', () => {
      const nodeDefinition = programmaticNodeFactory.build();
      const NodeClass = class {
        static description = nodeDefinition;
      };
      
      // Since it can't instantiate and has no static description accessible,
      // it should throw for missing name
      expect(() => parser.parse(NodeClass)).toThrow();
    });

    it('should handle instance-based nodes', () => {
      const nodeDefinition = programmaticNodeFactory.build();
      const nodeInstance = {
        description: nodeDefinition
      };
      
      const result = parser.parse(nodeInstance);
      
      expect(result.displayName).toBe(nodeDefinition.displayName);
    });

    it('should use displayName fallback to name if not provided', () => {
      const nodeDefinition = programmaticNodeFactory.build();
      delete (nodeDefinition as any).displayName;
      const NodeClass = nodeClassFactory.build({ description: nodeDefinition });
      
      const result = parser.parse(NodeClass);
      
      expect(result.displayName).toBe(nodeDefinition.name);
    });

    it('should handle category extraction from different fields', () => {
      const testCases = [
        { 
          description: { group: ['transform'], categories: ['output'] },
          expected: 'transform' // group takes precedence
        },
        {
          description: { categories: ['output'] },
          expected: 'output'
        },
        {
          description: {},
          expected: undefined
        }
      ];
      
      testCases.forEach(({ description, expected }) => {
        const baseDefinition = programmaticNodeFactory.build();
        // Remove any existing group/categories from base definition to avoid conflicts
        delete baseDefinition.group;
        delete baseDefinition.categories;
        
        const nodeDefinition = { 
          ...baseDefinition,
          ...description,
          name: baseDefinition.name // Ensure name is preserved
        };
        const NodeClass = nodeClassFactory.build({ description: nodeDefinition });
        
        const result = parser.parse(NodeClass);
        
        expect(result.category).toBe(expected);
      });
    });
  });

  describe('trigger detection', () => {
    it('should detect triggers by group', () => {
      const nodeDefinition = programmaticNodeFactory.build({
        group: ['trigger']
      });
      const NodeClass = nodeClassFactory.build({ description: nodeDefinition });
      
      const result = parser.parse(NodeClass);
      
      expect(result.isTrigger).toBe(true);
    });

    it('should detect polling triggers', () => {
      const nodeDefinition = programmaticNodeFactory.build({
        polling: true
      });
      const NodeClass = nodeClassFactory.build({ description: nodeDefinition });
      
      const result = parser.parse(NodeClass);
      
      expect(result.isTrigger).toBe(true);
    });

    it('should detect trigger property', () => {
      const nodeDefinition = programmaticNodeFactory.build({
        trigger: true
      });
      const NodeClass = nodeClassFactory.build({ description: nodeDefinition });
      
      const result = parser.parse(NodeClass);
      
      expect(result.isTrigger).toBe(true);
    });

    it('should detect event triggers', () => {
      const nodeDefinition = programmaticNodeFactory.build({
        eventTrigger: true
      });
      const NodeClass = nodeClassFactory.build({ description: nodeDefinition });
      
      const result = parser.parse(NodeClass);
      
      expect(result.isTrigger).toBe(true);
    });

    it('should detect triggers by name', () => {
      const nodeDefinition = programmaticNodeFactory.build({
        name: 'customTrigger'
      });
      const NodeClass = nodeClassFactory.build({ description: nodeDefinition });
      
      const result = parser.parse(NodeClass);
      
      expect(result.isTrigger).toBe(true);
    });
  });

  describe('operations extraction', () => {
    it('should extract declarative operations from routing.request', () => {
      const nodeDefinition = declarativeNodeFactory.build();
      // Fix the routing structure for simple parser
      nodeDefinition.routing.request!.operation = {
        options: [
          { name: 'Create', value: 'create' },
          { name: 'Get', value: 'get' }
        ] as any
      };
      const NodeClass = nodeClassFactory.build({ description: nodeDefinition });
      
      const result = parser.parse(NodeClass);
      
      // Should have resource operations
      const resourceOps = result.operations.filter(op => op.resource);
      expect(resourceOps.length).toBeGreaterThan(0);
      
      // Should have operation entries
      const operationOps = result.operations.filter(op => op.operation && !op.resource);
      expect(operationOps.length).toBeGreaterThan(0);
    });

    it('should extract declarative operations from routing.operations', () => {
      const NodeClass = nodeClassFactory.build({
        description: {
          name: 'test',
          routing: {
            operations: {
              create: { displayName: 'Create Item' },
              read: { displayName: 'Read Item' },
              update: { displayName: 'Update Item' },
              delete: { displayName: 'Delete Item' }
            }
          }
        }
      });
      
      const result = parser.parse(NodeClass);
      
      expect(result.operations).toHaveLength(4);
      expect(result.operations).toEqual(expect.arrayContaining([
        { operation: 'create', name: 'Create Item' },
        { operation: 'read', name: 'Read Item' },
        { operation: 'update', name: 'Update Item' },
        { operation: 'delete', name: 'Delete Item' }
      ]));
    });

    it('should extract programmatic operations from resource property', () => {
      const resourceProp = resourcePropertyFactory.build();
      const NodeClass = nodeClassFactory.build({
        description: {
          name: 'test',
          properties: [resourceProp]
        }
      });
      
      const result = parser.parse(NodeClass);
      
      const resourceOps = result.operations.filter(op => op.type === 'resource');
      expect(resourceOps).toHaveLength(resourceProp.options!.length);
      resourceOps.forEach((op, idx) => {
        expect(op).toMatchObject({
          type: 'resource',
          resource: resourceProp.options![idx].value,
          name: resourceProp.options![idx].name
        });
      });
    });

    it('should extract programmatic operations with resource context', () => {
      const operationProp = operationPropertyFactory.build();
      const NodeClass = nodeClassFactory.build({
        description: {
          name: 'test',
          properties: [operationProp]
        }
      });
      
      const result = parser.parse(NodeClass);
      
      const operationOps = result.operations.filter(op => op.type === 'operation');
      expect(operationOps).toHaveLength(operationProp.options!.length);
      
      // Should extract resource context from displayOptions
      expect(operationOps[0].resources).toEqual(['user']);
    });

    it('should handle operations with multiple resource conditions', () => {
      const operationProp = {
        name: 'operation',
        type: 'options',
        displayOptions: {
          show: {
            resource: ['user', 'post', 'comment']
          }
        },
        options: [
          { name: 'Create', value: 'create', action: 'Create item' }
        ]
      };
      
      const NodeClass = nodeClassFactory.build({
        description: {
          name: 'test',
          properties: [operationProp]
        }
      });
      
      const result = parser.parse(NodeClass);
      
      const operationOps = result.operations.filter(op => op.type === 'operation');
      expect(operationOps[0].resources).toEqual(['user', 'post', 'comment']);
    });

    it('should handle single resource condition as array', () => {
      const operationProp = {
        name: 'operation',
        type: 'options',
        displayOptions: {
          show: {
            resource: 'user' // Single value, not array
          }
        },
        options: [
          { name: 'Get', value: 'get' }
        ]
      };
      
      const NodeClass = nodeClassFactory.build({
        description: {
          name: 'test',
          properties: [operationProp]
        }
      });
      
      const result = parser.parse(NodeClass);
      
      const operationOps = result.operations.filter(op => op.type === 'operation');
      expect(operationOps[0].resources).toEqual(['user']);
    });
  });

  describe('version extraction', () => {
    it('should extract version from baseDescription.defaultVersion', () => {
      // Simple parser needs a proper versioned node structure
      const NodeClass = class {
        baseDescription = {
          name: 'test',
          displayName: 'Test',
          defaultVersion: 3
        };
        // Constructor name trick to detect as VersionedNodeType
        constructor() {
          Object.defineProperty(this.constructor, 'name', {
            value: 'VersionedNodeType',
            configurable: true
          });
        }
      };
      
      const result = parser.parse(NodeClass);
      
      expect(result.version).toBe('3');
    });

    it('should extract version from description.version', () => {
      // For this test, the version needs to be in the instantiated description
      const NodeClass = class {
        description = {
          name: 'test',
          version: 2
        };
      };
      
      const result = parser.parse(NodeClass);
      
      expect(result.version).toBe('2');
    });

    it('should default to version 1', () => {
      const NodeClass = nodeClassFactory.build({
        description: {
          name: 'test'
        }
      });
      
      const result = parser.parse(NodeClass);
      
      expect(result.version).toBe('1');
    });
  });

  describe('versioned node detection', () => {
    it('should detect nodes with baseDescription and nodeVersions', () => {
      // For simple parser, need to create a proper class structure
      const NodeClass = class {
        baseDescription = { 
          name: 'test',
          displayName: 'Test' 
        };
        nodeVersions = { 1: {}, 2: {} };
        
        constructor() {
          Object.defineProperty(this.constructor, 'name', {
            value: 'VersionedNodeType',
            configurable: true
          });
        }
      };
      
      const result = parser.parse(NodeClass);
      
      expect(result.isVersioned).toBe(true);
    });

    it('should detect nodes with version array', () => {
      const NodeClass = nodeClassFactory.build({
        description: {
          name: 'test',
          version: [1, 1.1, 2]
        }
      });
      
      const result = parser.parse(NodeClass);
      
      expect(result.isVersioned).toBe(true);
    });

    it('should detect nodes with defaultVersion', () => {
      const NodeClass = nodeClassFactory.build({
        description: {
          name: 'test',
          defaultVersion: 2
        }
      });
      
      const result = parser.parse(NodeClass);
      
      expect(result.isVersioned).toBe(true);
    });

    it('should handle instance-level version detection', () => {
      const NodeClass = class {
        description = {
          name: 'test',
          version: [1, 2, 3]
        };
      };
      
      const result = parser.parse(NodeClass);
      
      expect(result.isVersioned).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty routing object', () => {
      const NodeClass = nodeClassFactory.build({
        description: {
          name: 'test',
          routing: {}
        }
      });
      
      const result = parser.parse(NodeClass);
      
      expect(result.style).toBe('declarative');
      expect(result.operations).toEqual([]);
    });

    it('should handle missing properties array', () => {
      const NodeClass = nodeClassFactory.build({
        description: {
          name: 'test'
        }
      });
      
      const result = parser.parse(NodeClass);
      
      expect(result.properties).toEqual([]);
    });

    it('should handle missing credentials', () => {
      const nodeDefinition = programmaticNodeFactory.build();
      delete (nodeDefinition as any).credentials;
      const NodeClass = nodeClassFactory.build({ description: nodeDefinition });
      
      const result = parser.parse(NodeClass);
      
      expect(result.credentials).toEqual([]);
    });

    it('should handle nodes with baseDescription but no name in main description', () => {
      const NodeClass = class {
        description = {};
        baseDescription = {
          name: 'baseNode',
          displayName: 'Base Node'
        };
      };
      
      const result = parser.parse(NodeClass);
      
      expect(result.nodeType).toBe('baseNode');
      expect(result.displayName).toBe('Base Node');
    });

    it('should handle complex nested routing structures', () => {
      const NodeClass = nodeClassFactory.build({
        description: {
          name: 'test',
          routing: {
            request: {
              resource: {
                options: []
              },
              operation: {
                options: [] // Should be array, not object
              }
            },
            operations: {}
          }
        }
      });
      
      const result = parser.parse(NodeClass);
      
      expect(result.operations).toEqual([]);
    });

    it('should handle operations without displayName', () => {
      const NodeClass = nodeClassFactory.build({
        description: {
          name: 'test',
          properties: [
            {
              name: 'operation',
              type: 'options',
              displayOptions: {
                show: {}
              },
              options: [
                { value: 'create' }, // No name field
                { value: 'update', name: 'Update' }
              ]
            }
          ]
        }
      });
      
      const result = parser.parse(NodeClass);
      
      // Should handle missing names gracefully
      expect(result.operations).toHaveLength(2);
    });
  });
});