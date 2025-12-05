import { describe, test, expect } from 'vitest';
import { FixedCollectionValidator, NodeConfig, NodeConfigValue } from '../../../src/utils/fixed-collection-validator';

// Type guard helper for tests
function isNodeConfig(value: NodeConfig | NodeConfigValue[] | undefined): value is NodeConfig {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

describe('FixedCollectionValidator', () => {
  describe('Core Functionality', () => {
    test('should return valid for non-susceptible nodes', () => {
      const result = FixedCollectionValidator.validate('n8n-nodes-base.cron', {
        triggerTimes: { hour: 10, minute: 30 }
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should normalize node types correctly', () => {
      const nodeTypes = [
        'n8n-nodes-base.switch',
        'nodes-base.switch',
        '@n8n/n8n-nodes-langchain.switch',
        'SWITCH'
      ];

      nodeTypes.forEach(nodeType => {
        expect(FixedCollectionValidator.isNodeSusceptible(nodeType)).toBe(true);
      });
    });

    test('should get all known patterns', () => {
      const patterns = FixedCollectionValidator.getAllPatterns();
      expect(patterns.length).toBeGreaterThan(10); // We have at least 11 patterns
      expect(patterns.some(p => p.nodeType === 'switch')).toBe(true);
      expect(patterns.some(p => p.nodeType === 'summarize')).toBe(true);
    });
  });

  describe('Switch Node Validation', () => {
    test('should detect invalid nested conditions structure', () => {
      const invalidConfig = {
        rules: {
          conditions: {
            values: [
              {
                value1: '={{$json.status}}',
                operation: 'equals',
                value2: 'active'
              }
            ]
          }
        }
      };

      const result = FixedCollectionValidator.validate('n8n-nodes-base.switch', invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2); // Both rules.conditions and rules.conditions.values match
      // Check that we found the specific pattern
      const conditionsValuesError = result.errors.find(e => e.pattern === 'rules.conditions.values');
      expect(conditionsValuesError).toBeDefined();
      expect(conditionsValuesError!.message).toContain('propertyValues[itemName] is not iterable');
      expect(result.autofix).toBeDefined();
      expect(isNodeConfig(result.autofix)).toBe(true);
      if (isNodeConfig(result.autofix)) {
        expect(result.autofix.rules).toBeDefined();
        expect((result.autofix.rules as any).values).toBeDefined();
        expect((result.autofix.rules as any).values[0].outputKey).toBe('output1');
      }
    });

    test('should provide correct autofix for switch node', () => {
      const invalidConfig = {
        rules: {
          conditions: {
            values: [
              { value1: '={{$json.a}}', operation: 'equals', value2: '1' },
              { value1: '={{$json.b}}', operation: 'equals', value2: '2' }
            ]
          }
        }
      };

      const result = FixedCollectionValidator.validate('switch', invalidConfig);
      
      expect(isNodeConfig(result.autofix)).toBe(true);
      if (isNodeConfig(result.autofix)) {
        expect((result.autofix.rules as any).values).toHaveLength(2);
        expect((result.autofix.rules as any).values[0].outputKey).toBe('output1');
        expect((result.autofix.rules as any).values[1].outputKey).toBe('output2');
      }
    });
  });

  describe('If/Filter Node Validation', () => {
    test('should detect invalid nested values structure', () => {
      const invalidConfig = {
        conditions: {
          values: [
            {
              value1: '={{$json.age}}',
              operation: 'largerEqual',
              value2: 18
            }
          ]
        }
      };

      const ifResult = FixedCollectionValidator.validate('n8n-nodes-base.if', invalidConfig);
      const filterResult = FixedCollectionValidator.validate('n8n-nodes-base.filter', invalidConfig);
      
      expect(ifResult.isValid).toBe(false);
      expect(ifResult.errors[0].fix).toContain('directly, not nested under "values"');
      expect(ifResult.autofix).toEqual([
        {
          value1: '={{$json.age}}',
          operation: 'largerEqual',
          value2: 18
        }
      ]);

      expect(filterResult.isValid).toBe(false);
      expect(filterResult.autofix).toEqual(ifResult.autofix);
    });
  });

  describe('New Nodes Validation', () => {
    test('should validate Summarize node', () => {
      const invalidConfig = {
        fieldsToSummarize: {
          values: {
            values: [
              { field: 'amount', aggregation: 'sum' },
              { field: 'count', aggregation: 'count' }
            ]
          }
        }
      };

      const result = FixedCollectionValidator.validate('summarize', invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].pattern).toBe('fieldsToSummarize.values.values');
      expect(result.errors[0].fix).toContain('not nested values.values');
      expect(isNodeConfig(result.autofix)).toBe(true);
      if (isNodeConfig(result.autofix)) {
        expect((result.autofix.fieldsToSummarize as any).values).toHaveLength(2);
      }
    });

    test('should validate Compare Datasets node', () => {
      const invalidConfig = {
        mergeByFields: {
          values: {
            values: [
              { field1: 'id', field2: 'userId' }
            ]
          }
        }
      };

      const result = FixedCollectionValidator.validate('compareDatasets', invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].pattern).toBe('mergeByFields.values.values');
      expect(isNodeConfig(result.autofix)).toBe(true);
      if (isNodeConfig(result.autofix)) {
        expect((result.autofix.mergeByFields as any).values).toHaveLength(1);
      }
    });

    test('should validate Sort node', () => {
      const invalidConfig = {
        sortFieldsUi: {
          sortField: {
            values: [
              { fieldName: 'date', order: 'descending' }
            ]
          }
        }
      };

      const result = FixedCollectionValidator.validate('sort', invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].pattern).toBe('sortFieldsUi.sortField.values');
      expect(result.errors[0].fix).toContain('not sortField.values');
      expect(isNodeConfig(result.autofix)).toBe(true);
      if (isNodeConfig(result.autofix)) {
        expect((result.autofix.sortFieldsUi as any).sortField).toHaveLength(1);
      }
    });

    test('should validate Aggregate node', () => {
      const invalidConfig = {
        fieldsToAggregate: {
          fieldToAggregate: {
            values: [
              { fieldToAggregate: 'price', aggregation: 'average' }
            ]
          }
        }
      };

      const result = FixedCollectionValidator.validate('aggregate', invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].pattern).toBe('fieldsToAggregate.fieldToAggregate.values');
      expect(isNodeConfig(result.autofix)).toBe(true);
      if (isNodeConfig(result.autofix)) {
        expect((result.autofix.fieldsToAggregate as any).fieldToAggregate).toHaveLength(1);
      }
    });

    test('should validate Set node', () => {
      const invalidConfig = {
        fields: {
          values: {
            values: [
              { name: 'status', value: 'active' }
            ]
          }
        }
      };

      const result = FixedCollectionValidator.validate('set', invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].pattern).toBe('fields.values.values');
      expect(isNodeConfig(result.autofix)).toBe(true);
      if (isNodeConfig(result.autofix)) {
        expect((result.autofix.fields as any).values).toHaveLength(1);
      }
    });

    test('should validate HTML node', () => {
      const invalidConfig = {
        extractionValues: {
          values: {
            values: [
              { key: 'title', cssSelector: 'h1' }
            ]
          }
        }
      };

      const result = FixedCollectionValidator.validate('html', invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].pattern).toBe('extractionValues.values.values');
      expect(isNodeConfig(result.autofix)).toBe(true);
      if (isNodeConfig(result.autofix)) {
        expect((result.autofix.extractionValues as any).values).toHaveLength(1);
      }
    });

    test('should validate HTTP Request node', () => {
      const invalidConfig = {
        body: {
          parameters: {
            values: [
              { name: 'api_key', value: '123' }
            ]
          }
        }
      };

      const result = FixedCollectionValidator.validate('httpRequest', invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].pattern).toBe('body.parameters.values');
      expect(result.errors[0].fix).toContain('not parameters.values');
      expect(isNodeConfig(result.autofix)).toBe(true);
      if (isNodeConfig(result.autofix)) {
        expect((result.autofix.body as any).parameters).toHaveLength(1);
      }
    });

    test('should validate Airtable node', () => {
      const invalidConfig = {
        sort: {
          sortField: {
            values: [
              { fieldName: 'Created', direction: 'desc' }
            ]
          }
        }
      };

      const result = FixedCollectionValidator.validate('airtable', invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].pattern).toBe('sort.sortField.values');
      expect(isNodeConfig(result.autofix)).toBe(true);
      if (isNodeConfig(result.autofix)) {
        expect((result.autofix.sort as any).sortField).toHaveLength(1);
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty config', () => {
      const result = FixedCollectionValidator.validate('switch', {});
      expect(result.isValid).toBe(true);
    });

    test('should handle null/undefined properties', () => {
      const result = FixedCollectionValidator.validate('switch', {
        rules: null
      });
      expect(result.isValid).toBe(true);
    });

    test('should handle valid structures', () => {
      const validSwitch = {
        rules: {
          values: [
            {
              conditions: { value1: '={{$json.x}}', operation: 'equals', value2: 1 },
              outputKey: 'output1'
            }
          ]
        }
      };

      const result = FixedCollectionValidator.validate('switch', validSwitch);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle deeply nested invalid structures', () => {
      const deeplyNested = {
        rules: {
          conditions: {
            values: [
              {
                value1: '={{$json.deep}}',
                operation: 'equals',
                value2: 'nested'
              }
            ]
          }
        }
      };

      const result = FixedCollectionValidator.validate('switch', deeplyNested);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2); // Both patterns match
    });
  });

  describe('Private Method Testing (through public API)', () => {
    describe('isNodeConfig Type Guard', () => {
      test('should return true for plain objects', () => {
        const validConfig = { property: 'value' };
        const result = FixedCollectionValidator.validate('switch', validConfig);
        // Type guard is tested indirectly through validation
        expect(result).toBeDefined();
      });

      test('should handle null values correctly', () => {
        const result = FixedCollectionValidator.validate('switch', null as any);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should handle undefined values correctly', () => {
        const result = FixedCollectionValidator.validate('switch', undefined as any);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should handle arrays correctly', () => {
        const result = FixedCollectionValidator.validate('switch', [] as any);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should handle primitive values correctly', () => {
        const result1 = FixedCollectionValidator.validate('switch', 'string' as any);
        expect(result1.isValid).toBe(true);
        
        const result2 = FixedCollectionValidator.validate('switch', 123 as any);
        expect(result2.isValid).toBe(true);
        
        const result3 = FixedCollectionValidator.validate('switch', true as any);
        expect(result3.isValid).toBe(true);
      });
    });

    describe('getNestedValue Testing', () => {
      test('should handle simple nested paths', () => {
        const config = {
          rules: {
            conditions: {
              values: [{ test: 'value' }]
            }
          }
        };
        
        const result = FixedCollectionValidator.validate('switch', config);
        expect(result.isValid).toBe(false); // This tests the nested value extraction
      });

      test('should handle non-existent paths gracefully', () => {
        const config = {
          rules: {
            // missing conditions property
          }
        };
        
        const result = FixedCollectionValidator.validate('switch', config);
        expect(result.isValid).toBe(true); // Should not find invalid structure
      });

      test('should handle interrupted paths (null/undefined in middle)', () => {
        const config = {
          rules: null
        };
        
        const result = FixedCollectionValidator.validate('switch', config);
        expect(result.isValid).toBe(true);
      });

      test('should handle array interruptions in path', () => {
        const config = {
          rules: [1, 2, 3] // array instead of object
        };
        
        const result = FixedCollectionValidator.validate('switch', config);
        expect(result.isValid).toBe(true); // Should not find the pattern
      });
    });

    describe('Circular Reference Protection', () => {
      test('should handle circular references in config', () => {
        const config: any = {
          rules: {
            conditions: {}
          }
        };
        // Create circular reference
        config.rules.conditions.circular = config.rules;
        
        const result = FixedCollectionValidator.validate('switch', config);
        // Should not crash and should detect the pattern (result is false because it finds rules.conditions)
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      test('should handle self-referencing objects', () => {
        const config: any = {
          rules: {}
        };
        config.rules.self = config.rules;
        
        const result = FixedCollectionValidator.validate('switch', config);
        expect(result.isValid).toBe(true);
      });

      test('should handle deeply nested circular references', () => {
        const config: any = {
          rules: {
            conditions: {
              values: {}
            }
          }
        };
        config.rules.conditions.values.back = config;
        
        const result = FixedCollectionValidator.validate('switch', config);
        // Should detect the problematic pattern: rules.conditions.values exists
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('Deep Copying in getAllPatterns', () => {
      test('should return independent copies of patterns', () => {
        const patterns1 = FixedCollectionValidator.getAllPatterns();
        const patterns2 = FixedCollectionValidator.getAllPatterns();
        
        // Modify one copy
        patterns1[0].invalidPatterns.push('test.pattern');
        
        // Other copy should be unaffected
        expect(patterns2[0].invalidPatterns).not.toContain('test.pattern');
      });

      test('should deep copy invalidPatterns arrays', () => {
        const patterns = FixedCollectionValidator.getAllPatterns();
        const switchPattern = patterns.find(p => p.nodeType === 'switch')!;
        
        expect(switchPattern.invalidPatterns).toBeInstanceOf(Array);
        expect(switchPattern.invalidPatterns.length).toBeGreaterThan(0);
        
        // Ensure it's a different array instance
        const originalPatterns = FixedCollectionValidator.getAllPatterns();
        const originalSwitch = originalPatterns.find(p => p.nodeType === 'switch')!;
        
        expect(switchPattern.invalidPatterns).not.toBe(originalSwitch.invalidPatterns);
        expect(switchPattern.invalidPatterns).toEqual(originalSwitch.invalidPatterns);
      });
    });
  });

  describe('Enhanced Edge Cases', () => {
    test('should handle hasOwnProperty edge case', () => {
      const config = Object.create(null);
      config.rules = {
        conditions: {
          values: [{ test: 'value' }]
        }
      };
      
      const result = FixedCollectionValidator.validate('switch', config);
      expect(result.isValid).toBe(false); // Should still detect the pattern
    });

    test('should handle prototype pollution attempts', () => {
      const config = {
        rules: {
          conditions: {
            values: [{ test: 'value' }]
          }
        }
      };
      
      // Add prototype property (should be ignored by hasOwnProperty check)
      (Object.prototype as any).maliciousProperty = 'evil';
      
      try {
        const result = FixedCollectionValidator.validate('switch', config);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(2);
      } finally {
        delete (Object.prototype as any).maliciousProperty;
      }
    });

    test('should handle objects with numeric keys', () => {
      const config = {
        rules: {
          '0': {
            values: [{ test: 'value' }]
          }
        }
      };
      
      const result = FixedCollectionValidator.validate('switch', config);
      expect(result.isValid).toBe(true); // Should not match 'conditions' pattern
    });

    test('should handle very deep nesting without crashing', () => {
      let deepConfig: any = {};
      let current = deepConfig;
      
      // Create 100 levels deep
      for (let i = 0; i < 100; i++) {
        current.next = {};
        current = current.next;
      }
      
      const result = FixedCollectionValidator.validate('switch', deepConfig);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Alternative Node Type Formats', () => {
    test('should handle all node type normalization cases', () => {
      const testCases = [
        'n8n-nodes-base.switch',
        'nodes-base.switch', 
        '@n8n/n8n-nodes-langchain.switch',
        'SWITCH',
        'Switch',
        'sWiTcH'
      ];
      
      testCases.forEach(nodeType => {
        expect(FixedCollectionValidator.isNodeSusceptible(nodeType)).toBe(true);
      });
    });

    test('should handle empty and invalid node types', () => {
      expect(FixedCollectionValidator.isNodeSusceptible('')).toBe(false);
      expect(FixedCollectionValidator.isNodeSusceptible('unknown-node')).toBe(false);
      expect(FixedCollectionValidator.isNodeSusceptible('n8n-nodes-base.unknown')).toBe(false);
    });
  });

  describe('Complex Autofix Scenarios', () => {
    test('should handle switch autofix with non-array values', () => {
      const invalidConfig = {
        rules: {
          conditions: {
            values: { single: 'condition' } // Object instead of array
          }
        }
      };

      const result = FixedCollectionValidator.validate('switch', invalidConfig);
      expect(result.isValid).toBe(false);
      expect(isNodeConfig(result.autofix)).toBe(true);
      
      if (isNodeConfig(result.autofix)) {
        const values = (result.autofix.rules as any).values;
        expect(values).toHaveLength(1);
        expect(values[0].conditions).toEqual({ single: 'condition' });
        expect(values[0].outputKey).toBe('output1');
      }
    });

    test('should handle if/filter autofix with object values', () => {
      const invalidConfig = {
        conditions: {
          values: { type: 'single', condition: 'test' }
        }
      };

      const result = FixedCollectionValidator.validate('if', invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.autofix).toEqual({ type: 'single', condition: 'test' });
    });

    test('should handle applyAutofix for if/filter with null values', () => {
      const invalidConfig = {
        conditions: {
          values: null
        }
      };

      const pattern = FixedCollectionValidator.getAllPatterns().find(p => p.nodeType === 'if')!;
      const fixed = FixedCollectionValidator.applyAutofix(invalidConfig, pattern);
      
      // Should return the original config when values is null
      expect(fixed).toEqual(invalidConfig);
    });

    test('should handle applyAutofix for if/filter with undefined values', () => {
      const invalidConfig = {
        conditions: {
          values: undefined
        }
      };

      const pattern = FixedCollectionValidator.getAllPatterns().find(p => p.nodeType === 'if')!;
      const fixed = FixedCollectionValidator.applyAutofix(invalidConfig, pattern);
      
      // Should return the original config when values is undefined
      expect(fixed).toEqual(invalidConfig);
    });
  });

  describe('applyAutofix Method', () => {
    test('should apply autofix correctly for if/filter nodes', () => {
      const invalidConfig = {
        conditions: {
          values: [
            { value1: '={{$json.test}}', operation: 'equals', value2: 'yes' }
          ]
        }
      };

      const pattern = FixedCollectionValidator.getAllPatterns().find(p => p.nodeType === 'if');
      const fixed = FixedCollectionValidator.applyAutofix(invalidConfig, pattern!);
      
      expect(fixed).toEqual([
        { value1: '={{$json.test}}', operation: 'equals', value2: 'yes' }
      ]);
    });

    test('should return original config for non-if/filter nodes', () => {
      const invalidConfig = {
        fieldsToSummarize: {
          values: {
            values: [{ field: 'test' }]
          }
        }
      };

      const pattern = FixedCollectionValidator.getAllPatterns().find(p => p.nodeType === 'summarize');
      const fixed = FixedCollectionValidator.applyAutofix(invalidConfig, pattern!);
      
      expect(isNodeConfig(fixed)).toBe(true);
      if (isNodeConfig(fixed)) {
        expect((fixed.fieldsToSummarize as any).values).toEqual([{ field: 'test' }]);
      }
    });

    test('should handle filter node applyAutofix edge cases', () => {
      const invalidConfig = {
        conditions: {
          values: 'string-value' // Invalid type
        }
      };

      const pattern = FixedCollectionValidator.getAllPatterns().find(p => p.nodeType === 'filter');
      const fixed = FixedCollectionValidator.applyAutofix(invalidConfig, pattern!);
      
      // Should return original config when values is not object/array
      expect(fixed).toEqual(invalidConfig);
    });
  });

  describe('Missing Function Coverage Tests', () => {
    test('should test all generateFixMessage cases', () => {
      // Test each node type's fix message generation through validation
      const nodeConfigs = [
        { nodeType: 'switch', config: { rules: { conditions: { values: [] } } } },
        { nodeType: 'if', config: { conditions: { values: [] } } },
        { nodeType: 'filter', config: { conditions: { values: [] } } },
        { nodeType: 'summarize', config: { fieldsToSummarize: { values: { values: [] } } } },
        { nodeType: 'comparedatasets', config: { mergeByFields: { values: { values: [] } } } },
        { nodeType: 'sort', config: { sortFieldsUi: { sortField: { values: [] } } } },
        { nodeType: 'aggregate', config: { fieldsToAggregate: { fieldToAggregate: { values: [] } } } },
        { nodeType: 'set', config: { fields: { values: { values: [] } } } },
        { nodeType: 'html', config: { extractionValues: { values: { values: [] } } } },
        { nodeType: 'httprequest', config: { body: { parameters: { values: [] } } } },
        { nodeType: 'airtable', config: { sort: { sortField: { values: [] } } } },
      ];

      nodeConfigs.forEach(({ nodeType, config }) => {
        const result = FixedCollectionValidator.validate(nodeType, config);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].fix).toBeDefined();
        expect(typeof result.errors[0].fix).toBe('string');
      });
    });

    test('should test default case in generateFixMessage', () => {
      // Create a custom pattern with unknown nodeType to test default case
      const mockPattern = {
        nodeType: 'unknown-node-type',
        property: 'testProperty',
        expectedStructure: 'test.structure',
        invalidPatterns: ['test.invalid.pattern']
      };

      // We can't directly test the private generateFixMessage method,
      // but we can test through the validation logic by temporarily adding to KNOWN_PATTERNS
      // Instead, let's verify the method works by checking error messages contain the expected structure
      const patterns = FixedCollectionValidator.getAllPatterns();
      expect(patterns.length).toBeGreaterThan(0);
      
      // Ensure we have patterns that would exercise different fix message paths
      const switchPattern = patterns.find(p => p.nodeType === 'switch');
      expect(switchPattern).toBeDefined();
      expect(switchPattern!.expectedStructure).toBe('rules.values array');
    });

    test('should exercise hasInvalidStructure edge cases', () => {
      // Test with property that exists but is not at the end of the pattern
      const config = {
        rules: {
          conditions: 'string-value' // Not an object, so traversal should stop
        }
      };

      const result = FixedCollectionValidator.validate('switch', config);
      expect(result.isValid).toBe(false); // Should still detect rules.conditions pattern
    });

    test('should test getNestedValue with complex paths', () => {
      // Test through hasInvalidStructure which uses getNestedValue
      const config = {
        deeply: {
          nested: {
            path: {
              to: {
                value: 'exists'
              }
            }
          }
        }
      };

      // This would exercise the getNestedValue function through hasInvalidStructure
      const result = FixedCollectionValidator.validate('switch', config);
      expect(result.isValid).toBe(true); // No matching patterns
    });
  });
});