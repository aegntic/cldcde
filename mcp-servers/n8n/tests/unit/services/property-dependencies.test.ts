import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PropertyDependencies } from '@/services/property-dependencies';
import type { DependencyAnalysis, PropertyDependency } from '@/services/property-dependencies';

// Mock the database
vi.mock('better-sqlite3');

describe('PropertyDependencies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyze', () => {
    it('should analyze simple property dependencies', () => {
      const properties = [
        {
          name: 'method',
          displayName: 'HTTP Method',
          type: 'options'
        },
        {
          name: 'sendBody',
          displayName: 'Send Body',
          type: 'boolean',
          displayOptions: {
            show: {
              method: ['POST', 'PUT', 'PATCH']
            }
          }
        }
      ];

      const analysis = PropertyDependencies.analyze(properties);

      expect(analysis.totalProperties).toBe(2);
      expect(analysis.propertiesWithDependencies).toBe(1);
      expect(analysis.dependencies).toHaveLength(1);
      
      const sendBodyDep = analysis.dependencies[0];
      expect(sendBodyDep.property).toBe('sendBody');
      expect(sendBodyDep.dependsOn).toHaveLength(1);
      expect(sendBodyDep.dependsOn[0]).toMatchObject({
        property: 'method',
        values: ['POST', 'PUT', 'PATCH'],
        condition: 'equals'
      });
    });

    it('should handle hide conditions', () => {
      const properties = [
        {
          name: 'mode',
          type: 'options'
        },
        {
          name: 'manualField',
          type: 'string',
          displayOptions: {
            hide: {
              mode: ['automatic']
            }
          }
        }
      ];

      const analysis = PropertyDependencies.analyze(properties);

      const manualFieldDep = analysis.dependencies[0];
      expect(manualFieldDep.hideWhen).toEqual({ mode: ['automatic'] });
      expect(manualFieldDep.dependsOn[0].condition).toBe('not_equals');
    });

    it('should handle multiple dependencies', () => {
      const properties = [
        {
          name: 'resource',
          type: 'options'
        },
        {
          name: 'operation',
          type: 'options'
        },
        {
          name: 'channel',
          type: 'string',
          displayOptions: {
            show: {
              resource: ['message'],
              operation: ['post']
            }
          }
        }
      ];

      const analysis = PropertyDependencies.analyze(properties);

      const channelDep = analysis.dependencies[0];
      expect(channelDep.dependsOn).toHaveLength(2);
      expect(channelDep.notes).toContain('Multiple conditions must be met for this property to be visible');
    });

    it('should build dependency graph', () => {
      const properties = [
        {
          name: 'method',
          type: 'options'
        },
        {
          name: 'sendBody',
          type: 'boolean',
          displayOptions: {
            show: { method: ['POST'] }
          }
        },
        {
          name: 'contentType',
          type: 'options',
          displayOptions: {
            show: { method: ['POST'], sendBody: [true] }
          }
        }
      ];

      const analysis = PropertyDependencies.analyze(properties);

      expect(analysis.dependencyGraph).toMatchObject({
        method: ['sendBody', 'contentType'],
        sendBody: ['contentType']
      });
    });

    it('should identify properties that enable others', () => {
      const properties = [
        {
          name: 'sendHeaders',
          type: 'boolean'
        },
        {
          name: 'headerParameters',
          type: 'collection',
          displayOptions: {
            show: { sendHeaders: [true] }
          }
        },
        {
          name: 'headerCount',
          type: 'number',
          displayOptions: {
            show: { sendHeaders: [true] }
          }
        }
      ];

      const analysis = PropertyDependencies.analyze(properties);

      const sendHeadersDeps = analysis.dependencies.filter(d => 
        d.dependsOn.some(c => c.property === 'sendHeaders')
      );
      
      expect(sendHeadersDeps).toHaveLength(2);
      expect(analysis.dependencyGraph.sendHeaders).toContain('headerParameters');
      expect(analysis.dependencyGraph.sendHeaders).toContain('headerCount');
    });

    it('should add notes for collection types', () => {
      const properties = [
        {
          name: 'showCollection',
          type: 'boolean'
        },
        {
          name: 'items',
          type: 'collection',
          displayOptions: {
            show: { showCollection: [true] }
          }
        }
      ];

      const analysis = PropertyDependencies.analyze(properties);

      const itemsDep = analysis.dependencies[0];
      expect(itemsDep.notes).toContain('This property contains nested properties that may have their own dependencies');
    });

    it('should generate helpful descriptions', () => {
      const properties = [
        {
          name: 'method',
          displayName: 'HTTP Method',
          type: 'options'
        },
        {
          name: 'sendBody',
          type: 'boolean',
          displayOptions: {
            show: { method: ['POST', 'PUT'] }
          }
        }
      ];

      const analysis = PropertyDependencies.analyze(properties);

      const sendBodyDep = analysis.dependencies[0];
      expect(sendBodyDep.dependsOn[0].description).toBe(
        'Visible when HTTP Method is one of: "POST", "PUT"'
      );
    });

    it('should handle empty properties', () => {
      const analysis = PropertyDependencies.analyze([]);

      expect(analysis.totalProperties).toBe(0);
      expect(analysis.propertiesWithDependencies).toBe(0);
      expect(analysis.dependencies).toHaveLength(0);
      expect(analysis.dependencyGraph).toEqual({});
    });
  });

  describe('suggestions', () => {
    it('should suggest key properties to configure first', () => {
      const properties = [
        {
          name: 'resource',
          type: 'options'
        },
        {
          name: 'operation',
          type: 'options',
          displayOptions: {
            show: { resource: ['message'] }
          }
        },
        {
          name: 'channel',
          type: 'string',
          displayOptions: {
            show: { resource: ['message'], operation: ['post'] }
          }
        },
        {
          name: 'text',
          type: 'string',
          displayOptions: {
            show: { resource: ['message'], operation: ['post'] }
          }
        }
      ];

      const analysis = PropertyDependencies.analyze(properties);

      expect(analysis.suggestions[0]).toContain('Key properties to configure first');
      expect(analysis.suggestions[0]).toContain('resource');
    });

    it('should detect circular dependencies', () => {
      const properties = [
        {
          name: 'fieldA',
          type: 'string',
          displayOptions: {
            show: { fieldB: ['value'] }
          }
        },
        {
          name: 'fieldB',
          type: 'string',
          displayOptions: {
            show: { fieldA: ['value'] }
          }
        }
      ];

      const analysis = PropertyDependencies.analyze(properties);

      expect(analysis.suggestions.some(s => s.includes('Circular dependency'))).toBe(true);
    });

    it('should note complex dependencies', () => {
      const properties = [
        {
          name: 'a',
          type: 'string'
        },
        {
          name: 'b',
          type: 'string'
        },
        {
          name: 'c',
          type: 'string'
        },
        {
          name: 'complex',
          type: 'string',
          displayOptions: {
            show: { a: ['1'], b: ['2'], c: ['3'] }
          }
        }
      ];

      const analysis = PropertyDependencies.analyze(properties);

      expect(analysis.suggestions.some(s => s.includes('multiple dependencies'))).toBe(true);
    });
  });

  describe('getVisibilityImpact', () => {
    const properties = [
      {
        name: 'method',
        type: 'options'
      },
      {
        name: 'sendBody',
        type: 'boolean',
        displayOptions: {
          show: { method: ['POST', 'PUT'] }
        }
      },
      {
        name: 'contentType',
        type: 'options',
        displayOptions: {
          show: { 
            method: ['POST', 'PUT'],
            sendBody: [true]
          }
        }
      },
      {
        name: 'debugMode',
        type: 'boolean',
        displayOptions: {
          hide: { method: ['GET'] }
        }
      }
    ];

    it('should determine visible properties for POST method', () => {
      const config = { method: 'POST', sendBody: true };
      const impact = PropertyDependencies.getVisibilityImpact(properties, config);

      expect(impact.visible).toContain('method');
      expect(impact.visible).toContain('sendBody');
      expect(impact.visible).toContain('contentType');
      expect(impact.visible).toContain('debugMode');
      expect(impact.hidden).toHaveLength(0);
    });

    it('should determine hidden properties for GET method', () => {
      const config = { method: 'GET' };
      const impact = PropertyDependencies.getVisibilityImpact(properties, config);

      expect(impact.visible).toContain('method');
      expect(impact.hidden).toContain('sendBody');
      expect(impact.hidden).toContain('contentType');
      expect(impact.hidden).toContain('debugMode'); // Hidden by hide condition
    });

    it('should provide reasons for visibility', () => {
      const config = { method: 'GET' };
      const impact = PropertyDependencies.getVisibilityImpact(properties, config);

      expect(impact.reasons.sendBody).toContain('needs to be POST or PUT');
      expect(impact.reasons.debugMode).toContain('Hidden because method is "GET"');
    });

    it('should handle partial dependencies', () => {
      const config = { method: 'POST', sendBody: false };
      const impact = PropertyDependencies.getVisibilityImpact(properties, config);

      expect(impact.visible).toContain('sendBody');
      expect(impact.hidden).toContain('contentType');
      expect(impact.reasons.contentType).toContain('needs to be true');
    });

    it('should handle properties without display options', () => {
      const simpleProps = [
        { name: 'field1', type: 'string' },
        { name: 'field2', type: 'number' }
      ];

      const impact = PropertyDependencies.getVisibilityImpact(simpleProps, {});

      expect(impact.visible).toEqual(['field1', 'field2']);
      expect(impact.hidden).toHaveLength(0);
    });

    it('should handle empty configuration', () => {
      const impact = PropertyDependencies.getVisibilityImpact(properties, {});

      expect(impact.visible).toContain('method');
      expect(impact.hidden).toContain('sendBody'); // No method value provided
      expect(impact.hidden).toContain('contentType');
    });

    it('should handle array values in conditions', () => {
      const props = [
        {
          name: 'status',
          type: 'options'
        },
        {
          name: 'errorMessage',
          type: 'string',
          displayOptions: {
            show: { status: ['error', 'failed'] }
          }
        }
      ];

      const config1 = { status: 'error' };
      const impact1 = PropertyDependencies.getVisibilityImpact(props, config1);
      expect(impact1.visible).toContain('errorMessage');

      const config2 = { status: 'success' };
      const impact2 = PropertyDependencies.getVisibilityImpact(props, config2);
      expect(impact2.hidden).toContain('errorMessage');
    });
  });

  describe('edge cases', () => {
    it('should handle properties with both show and hide conditions', () => {
      const properties = [
        {
          name: 'mode',
          type: 'options'
        },
        {
          name: 'special',
          type: 'string',
          displayOptions: {
            show: { mode: ['custom'] },
            hide: { debug: [true] }
          }
        }
      ];

      const analysis = PropertyDependencies.analyze(properties);

      const specialDep = analysis.dependencies[0];
      expect(specialDep.showWhen).toEqual({ mode: ['custom'] });
      expect(specialDep.hideWhen).toEqual({ debug: [true] });
      expect(specialDep.dependsOn).toHaveLength(2);
    });

    it('should handle non-array values in display conditions', () => {
      const properties = [
        {
          name: 'enabled',
          type: 'boolean'
        },
        {
          name: 'config',
          type: 'string',
          displayOptions: {
            show: { enabled: true } // Not an array
          }
        }
      ];

      const analysis = PropertyDependencies.analyze(properties);

      const configDep = analysis.dependencies[0];
      expect(configDep.dependsOn[0].values).toEqual([true]);
    });

    it('should handle deeply nested property references', () => {
      const properties = [
        {
          name: 'level1',
          type: 'options'
        },
        {
          name: 'level2',
          type: 'options',
          displayOptions: {
            show: { level1: ['A'] }
          }
        },
        {
          name: 'level3',
          type: 'string',
          displayOptions: {
            show: { level1: ['A'], level2: ['B'] }
          }
        }
      ];

      const analysis = PropertyDependencies.analyze(properties);

      expect(analysis.dependencyGraph).toMatchObject({
        level1: ['level2', 'level3'],
        level2: ['level3']
      });
    });
  });
});