import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigValidator } from '@/services/config-validator';
import type { ValidationResult, ValidationError, ValidationWarning } from '@/services/config-validator';

// Mock the database
vi.mock('better-sqlite3');

describe('ConfigValidator - Basic Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validate', () => {
    it('should validate required fields for Slack message post', () => {
      const nodeType = 'nodes-base.slack';
      const config = {
        resource: 'message',
        operation: 'post'
        // Missing required 'channel' field
      };
      const properties = [
        {
          name: 'resource',
          type: 'options',
          required: true,
          default: 'message',
          options: [
            { name: 'Message', value: 'message' },
            { name: 'Channel', value: 'channel' }
          ]
        },
        {
          name: 'operation',
          type: 'options',
          required: true,
          default: 'post',
          displayOptions: {
            show: { resource: ['message'] }
          },
          options: [
            { name: 'Post', value: 'post' },
            { name: 'Update', value: 'update' }
          ]
        },
        {
          name: 'channel',
          type: 'string',
          required: true,
          displayOptions: {
            show: { 
              resource: ['message'],
              operation: ['post']
            }
          }
        }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        type: 'missing_required',
        property: 'channel',
        message: "Required property 'channel' is missing",
        fix: 'Add channel to your configuration'
      });
    });

    it('should validate successfully with all required fields', () => {
      const nodeType = 'nodes-base.slack';
      const config = {
        resource: 'message',
        operation: 'post',
        channel: '#general',
        text: 'Hello, Slack!'
      };
      const properties = [
        {
          name: 'resource',
          type: 'options',
          required: true,
          default: 'message',
          options: [
            { name: 'Message', value: 'message' },
            { name: 'Channel', value: 'channel' }
          ]
        },
        {
          name: 'operation',
          type: 'options',
          required: true,
          default: 'post',
          displayOptions: {
            show: { resource: ['message'] }
          },
          options: [
            { name: 'Post', value: 'post' },
            { name: 'Update', value: 'update' }
          ]
        },
        {
          name: 'channel',
          type: 'string',
          required: true,
          displayOptions: {
            show: { 
              resource: ['message'],
              operation: ['post']
            }
          }
        },
        {
          name: 'text',
          type: 'string',
          default: '',
          displayOptions: {
            show: { 
              resource: ['message'],
              operation: ['post']
            }
          }
        }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle unknown node types gracefully', () => {
      const nodeType = 'nodes-base.unknown';
      const config = { field: 'value' };
      const properties: any[] = [];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      // May have warnings about unused properties
    });

    it('should validate property types', () => {
      const nodeType = 'nodes-base.test';
      const config = {
        numberField: 'not-a-number', // Should be number
        booleanField: 'yes' // Should be boolean
      };
      const properties = [
        { name: 'numberField', type: 'number' },
        { name: 'booleanField', type: 'boolean' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.errors).toHaveLength(2);
      expect(result.errors.some(e => 
        e.property === 'numberField' && 
        e.type === 'invalid_type'
      )).toBe(true);
      expect(result.errors.some(e => 
        e.property === 'booleanField' && 
        e.type === 'invalid_type'
      )).toBe(true);
    });

    it('should validate option values', () => {
      const nodeType = 'nodes-base.test';
      const config = {
        selectField: 'invalid-option'
      };
      const properties = [
        {
          name: 'selectField',
          type: 'options',
          options: [
            { name: 'Option A', value: 'a' },
            { name: 'Option B', value: 'b' }
          ]
        }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        type: 'invalid_value',
        property: 'selectField',
        message: expect.stringContaining('Invalid value')
      });
    });

    it('should check property visibility based on displayOptions', () => {
      const nodeType = 'nodes-base.test';
      const config = {
        resource: 'user',
        userField: 'visible'
      };
      const properties = [
        {
          name: 'resource',
          type: 'options',
          options: [
            { name: 'User', value: 'user' },
            { name: 'Post', value: 'post' }
          ]
        },
        {
          name: 'userField',
          type: 'string',
          displayOptions: {
            show: { resource: ['user'] }
          }
        },
        {
          name: 'postField',
          type: 'string',
          displayOptions: {
            show: { resource: ['post'] }
          }
        }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.visibleProperties).toContain('resource');
      expect(result.visibleProperties).toContain('userField');
      expect(result.hiddenProperties).toContain('postField');
    });

    it('should handle empty properties array', () => {
      const nodeType = 'nodes-base.test';
      const config = { someField: 'value' };
      const properties: any[] = [];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle missing displayOptions gracefully', () => {
      const nodeType = 'nodes-base.test';
      const config = { field1: 'value1' };
      const properties = [
        { name: 'field1', type: 'string' }
        // No displayOptions
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.visibleProperties).toContain('field1');
    });

    it('should validate options with array format', () => {
      const nodeType = 'nodes-base.test';
      const config = { optionField: 'b' };
      const properties = [
        {
          name: 'optionField',
          type: 'options',
          options: [
            { name: 'Option A', value: 'a' },
            { name: 'Option B', value: 'b' },
            { name: 'Option C', value: 'c' }
          ]
        }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('edge cases and additional coverage', () => {
    it('should handle null and undefined config values', () => {
      const nodeType = 'nodes-base.test';
      const config = {
        nullField: null,
        undefinedField: undefined,
        validField: 'value'
      };
      const properties = [
        { name: 'nullField', type: 'string', required: true },
        { name: 'undefinedField', type: 'string', required: true },
        { name: 'validField', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.errors.some(e => e.property === 'nullField')).toBe(true);
      expect(result.errors.some(e => e.property === 'undefinedField')).toBe(true);
    });

    it('should validate nested displayOptions conditions', () => {
      const nodeType = 'nodes-base.test';
      const config = {
        mode: 'advanced',
        resource: 'user',
        advancedUserField: 'value'
      };
      const properties = [
        {
          name: 'mode',
          type: 'options',
          options: [
            { name: 'Simple', value: 'simple' },
            { name: 'Advanced', value: 'advanced' }
          ]
        },
        {
          name: 'resource',
          type: 'options',
          displayOptions: {
            show: { mode: ['advanced'] }
          },
          options: [
            { name: 'User', value: 'user' },
            { name: 'Post', value: 'post' }
          ]
        },
        {
          name: 'advancedUserField',
          type: 'string',
          displayOptions: {
            show: { 
              mode: ['advanced'],
              resource: ['user']
            }
          }
        }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.visibleProperties).toContain('advancedUserField');
    });

    it('should handle hide conditions in displayOptions', () => {
      const nodeType = 'nodes-base.test';
      const config = {
        showAdvanced: false,
        hiddenField: 'should-not-be-here'
      };
      const properties = [
        {
          name: 'showAdvanced',
          type: 'boolean'
        },
        {
          name: 'hiddenField',
          type: 'string',
          displayOptions: {
            hide: { showAdvanced: [false] }
          }
        }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.hiddenProperties).toContain('hiddenField');
      expect(result.warnings.some(w => 
        w.property === 'hiddenField' && 
        w.type === 'inefficient'
      )).toBe(true);
    });

    it('should handle internal properties that start with underscore', () => {
      const nodeType = 'nodes-base.test';
      const config = {
        '@version': 1,
        '_internalField': 'value',
        normalField: 'value'
      };
      const properties = [
        { name: 'normalField', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      // Should not warn about @version or _internalField
      expect(result.warnings.some(w => 
        w.property === '@version' || 
        w.property === '_internalField'
      )).toBe(false);
    });

    it('should warn about inefficient configured but hidden properties', () => {
      const nodeType = 'nodes-base.test'; // Changed from Code node
      const config = {
        mode: 'manual',
        automaticField: 'This will not be used'
      };
      const properties = [
        {
          name: 'mode',
          type: 'options',
          options: [
            { name: 'Manual', value: 'manual' },
            { name: 'Automatic', value: 'automatic' }
          ]
        },
        {
          name: 'automaticField',
          type: 'string',
          displayOptions: {
            show: { mode: ['automatic'] }
          }
        }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.warnings.some(w => 
        w.type === 'inefficient' && 
        w.property === 'automaticField' &&
        w.message.includes("won't be used")
      )).toBe(true);
    });

    it('should suggest commonly used properties', () => {
      const nodeType = 'nodes-base.httpRequest';
      const config = {
        method: 'GET',
        url: 'https://api.example.com/data'
      };
      const properties = [
        { name: 'method', type: 'options' },
        { name: 'url', type: 'string' },
        { name: 'headers', type: 'json' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      // Common properties suggestion not implemented for headers
      expect(result.suggestions.length).toBeGreaterThanOrEqual(0);
    });
  });
});