/**
 * Fixed Collection Validation Tests
 * Tests for the fix of issue #90: "propertyValues[itemName] is not iterable" error
 * 
 * This ensures AI agents cannot create invalid fixedCollection structures that break n8n UI
 */

import { describe, test, expect } from 'vitest';
import { EnhancedConfigValidator } from '../../../src/services/enhanced-config-validator';

describe('FixedCollection Validation', () => {
  describe('Switch Node v2/v3 Validation', () => {
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

      const result = EnhancedConfigValidator.validateWithMode(
        'nodes-base.switch',
        invalidConfig,
        [],
        'operation',
        'ai-friendly'
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('invalid_value');
      expect(result.errors[0].property).toBe('rules');
      expect(result.errors[0].message).toContain('propertyValues[itemName] is not iterable');
      expect(result.errors[0].fix).toContain('{ "rules": { "values": [{ "conditions": {...}, "outputKey": "output1" }] } }');
    });

    test('should detect direct conditions in rules (another invalid pattern)', () => {
      const invalidConfig = {
        rules: {
          conditions: {
            value1: '={{$json.status}}',
            operation: 'equals',
            value2: 'active'
          }
        }
      };

      const result = EnhancedConfigValidator.validateWithMode(
        'nodes-base.switch',
        invalidConfig,
        [],
        'operation',
        'ai-friendly'
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Invalid structure for nodes-base.switch node');
    });

    test('should provide auto-fix for invalid switch structure', () => {
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

      const result = EnhancedConfigValidator.validateWithMode(
        'nodes-base.switch',
        invalidConfig,
        [],
        'operation',
        'ai-friendly'
      );

      expect(result.autofix).toBeDefined();
      expect(result.autofix!.rules).toBeDefined();
      expect(result.autofix!.rules.values).toBeInstanceOf(Array);
      expect(result.autofix!.rules.values).toHaveLength(1);
      expect(result.autofix!.rules.values[0]).toHaveProperty('conditions');
      expect(result.autofix!.rules.values[0]).toHaveProperty('outputKey');
    });

    test('should accept valid switch structure', () => {
      const validConfig = {
        rules: {
          values: [
            {
              conditions: {
                value1: '={{$json.status}}',
                operation: 'equals',
                value2: 'active'
              },
              outputKey: 'active'
            }
          ]
        }
      };

      const result = EnhancedConfigValidator.validateWithMode(
        'nodes-base.switch',
        validConfig,
        [],
        'operation',
        'ai-friendly'
      );

      // Should not have the specific fixedCollection error
      const hasFixedCollectionError = result.errors.some(e => 
        e.message.includes('propertyValues[itemName] is not iterable')
      );
      expect(hasFixedCollectionError).toBe(false);
    });

    test('should warn about missing outputKey in valid structure', () => {
      const configMissingOutputKey = {
        rules: {
          values: [
            {
              conditions: {
                value1: '={{$json.status}}',
                operation: 'equals',
                value2: 'active'
              }
              // Missing outputKey
            }
          ]
        }
      };

      const result = EnhancedConfigValidator.validateWithMode(
        'nodes-base.switch',
        configMissingOutputKey,
        [],
        'operation',
        'ai-friendly'
      );

      const hasOutputKeyWarning = result.warnings.some(w => 
        w.message.includes('missing "outputKey" property')
      );
      expect(hasOutputKeyWarning).toBe(true);
    });
  });

  describe('If Node Validation', () => {
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

      const result = EnhancedConfigValidator.validateWithMode(
        'nodes-base.if',
        invalidConfig,
        [],
        'operation',
        'ai-friendly'
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('invalid_value');
      expect(result.errors[0].property).toBe('conditions');
      expect(result.errors[0].message).toContain('Invalid structure for nodes-base.if node');
      expect(result.errors[0].fix).toBe('Use: { "conditions": {...} } or { "conditions": [...] } directly, not nested under "values"');
    });

    test('should provide auto-fix for invalid if structure', () => {
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

      const result = EnhancedConfigValidator.validateWithMode(
        'nodes-base.if',
        invalidConfig,
        [],
        'operation',
        'ai-friendly'
      );

      expect(result.autofix).toBeDefined();
      expect(result.autofix!.conditions).toEqual(invalidConfig.conditions.values);
    });

    test('should accept valid if structure', () => {
      const validConfig = {
        conditions: {
          value1: '={{$json.age}}',
          operation: 'largerEqual',
          value2: 18
        }
      };

      const result = EnhancedConfigValidator.validateWithMode(
        'nodes-base.if',
        validConfig,
        [],
        'operation',
        'ai-friendly'
      );

      // Should not have the specific structure error
      const hasStructureError = result.errors.some(e => 
        e.message.includes('should be a filter object/array directly')
      );
      expect(hasStructureError).toBe(false);
    });
  });

  describe('Filter Node Validation', () => {
    test('should detect invalid nested values structure', () => {
      const invalidConfig = {
        conditions: {
          values: [
            {
              value1: '={{$json.score}}',
              operation: 'larger',
              value2: 80
            }
          ]
        }
      };

      const result = EnhancedConfigValidator.validateWithMode(
        'nodes-base.filter',
        invalidConfig,
        [],
        'operation',
        'ai-friendly'
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('invalid_value');
      expect(result.errors[0].property).toBe('conditions');
      expect(result.errors[0].message).toContain('Invalid structure for nodes-base.filter node');
    });

    test('should accept valid filter structure', () => {
      const validConfig = {
        conditions: {
          value1: '={{$json.score}}',
          operation: 'larger',
          value2: 80
        }
      };

      const result = EnhancedConfigValidator.validateWithMode(
        'nodes-base.filter',
        validConfig,
        [],
        'operation',
        'ai-friendly'
      );

      // Should not have the specific structure error
      const hasStructureError = result.errors.some(e => 
        e.message.includes('should be a filter object/array directly')
      );
      expect(hasStructureError).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should not validate non-problematic nodes', () => {
      const config = {
        someProperty: {
          conditions: {
            values: ['should', 'not', 'trigger', 'validation']
          }
        }
      };

      const result = EnhancedConfigValidator.validateWithMode(
        'nodes-base.httpRequest',
        config,
        [],
        'operation',
        'ai-friendly'
      );

      // Should not have fixedCollection errors for non-problematic nodes
      const hasFixedCollectionError = result.errors.some(e => 
        e.message.includes('propertyValues[itemName] is not iterable')
      );
      expect(hasFixedCollectionError).toBe(false);
    });

    test('should handle empty config gracefully', () => {
      const result = EnhancedConfigValidator.validateWithMode(
        'nodes-base.switch',
        {},
        [],
        'operation',
        'ai-friendly'
      );

      // Should not crash or produce false positives
      expect(result).toBeDefined();
      expect(result.errors).toBeInstanceOf(Array);
    });

    test('should handle non-object property values', () => {
      const config = {
        rules: 'not an object'
      };

      const result = EnhancedConfigValidator.validateWithMode(
        'nodes-base.switch',
        config,
        [],
        'operation',
        'ai-friendly'
      );

      // Should not crash on non-object values
      expect(result).toBeDefined();
      expect(result.errors).toBeInstanceOf(Array);
    });
  });

  describe('Real-world AI Agent Patterns', () => {
    test('should catch common ChatGPT/Claude switch patterns', () => {
      // This is a pattern commonly generated by AI agents
      const aiGeneratedConfig = {
        rules: {
          conditions: {
            values: [
              {
                "value1": "={{$json.status}}",
                "operation": "equals", 
                "value2": "active"
              },
              {
                "value1": "={{$json.priority}}",
                "operation": "equals",
                "value2": "high"
              }
            ]
          }
        }
      };

      const result = EnhancedConfigValidator.validateWithMode(
        'nodes-base.switch',
        aiGeneratedConfig,
        [],
        'operation',
        'ai-friendly'
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('propertyValues[itemName] is not iterable');
      
      // Check auto-fix generates correct structure
      expect(result.autofix!.rules.values).toHaveLength(2);
      result.autofix!.rules.values.forEach((rule: any) => {
        expect(rule).toHaveProperty('conditions');
        expect(rule).toHaveProperty('outputKey');
      });
    });

    test('should catch common AI if/filter patterns', () => {
      const aiGeneratedIfConfig = {
        conditions: {
          values: {
            "value1": "={{$json.age}}",
            "operation": "largerEqual",
            "value2": 21
          }
        }
      };

      const result = EnhancedConfigValidator.validateWithMode(
        'nodes-base.if',
        aiGeneratedIfConfig,
        [],
        'operation',
        'ai-friendly'
      );

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Invalid structure for nodes-base.if node');
    });
  });

  describe('Version Compatibility', () => {
    test('should work across different validation profiles', () => {
      const invalidConfig = {
        rules: {
          conditions: {
            values: [{ value1: 'test', operation: 'equals', value2: 'test' }]
          }
        }
      };

      const profiles: Array<'strict' | 'runtime' | 'ai-friendly' | 'minimal'> = 
        ['strict', 'runtime', 'ai-friendly', 'minimal'];

      profiles.forEach(profile => {
        const result = EnhancedConfigValidator.validateWithMode(
          'nodes-base.switch',
          invalidConfig,
          [],
          'operation',
          profile
        );

        // All profiles should catch this critical error
        const hasCriticalError = result.errors.some(e => 
          e.message.includes('propertyValues[itemName] is not iterable')
        );
        
        expect(hasCriticalError, `Profile ${profile} should catch critical fixedCollection error`).toBe(true);
      });
    });
  });
});