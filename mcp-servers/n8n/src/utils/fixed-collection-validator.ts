/**
 * Generic utility for validating and fixing fixedCollection structures in n8n nodes
 * Prevents the "propertyValues[itemName] is not iterable" error
 */

// Type definitions for node configurations
export type NodeConfigValue = string | number | boolean | null | undefined | NodeConfig | NodeConfigValue[];

export interface NodeConfig {
  [key: string]: NodeConfigValue;
}

export interface FixedCollectionPattern {
  nodeType: string;
  property: string;
  subProperty?: string;
  expectedStructure: string;
  invalidPatterns: string[];
}

export interface FixedCollectionValidationResult {
  isValid: boolean;
  errors: Array<{
    pattern: string;
    message: string;
    fix: string;
  }>;
  autofix?: NodeConfig | NodeConfigValue[];
}

export class FixedCollectionValidator {
  /**
   * Type guard to check if value is a NodeConfig
   */
  private static isNodeConfig(value: NodeConfigValue): value is NodeConfig {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  /**
   * Safely get nested property value
   */
  private static getNestedValue(obj: NodeConfig, path: string): NodeConfigValue | undefined {
    const parts = path.split('.');
    let current: NodeConfigValue = obj;

    for (const part of parts) {
      if (!this.isNodeConfig(current)) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }
  /**
   * Known problematic patterns for various n8n nodes
   */
  private static readonly KNOWN_PATTERNS: FixedCollectionPattern[] = [
    // Conditional nodes (already fixed)
    {
      nodeType: 'switch',
      property: 'rules',
      expectedStructure: 'rules.values array',
      invalidPatterns: ['rules.conditions', 'rules.conditions.values']
    },
    {
      nodeType: 'if',
      property: 'conditions',
      expectedStructure: 'conditions array/object',
      invalidPatterns: ['conditions.values']
    },
    {
      nodeType: 'filter',
      property: 'conditions',
      expectedStructure: 'conditions array/object',
      invalidPatterns: ['conditions.values']
    },
    // New nodes identified by research
    {
      nodeType: 'summarize',
      property: 'fieldsToSummarize',
      subProperty: 'values',
      expectedStructure: 'fieldsToSummarize.values array',
      invalidPatterns: ['fieldsToSummarize.values.values']
    },
    {
      nodeType: 'comparedatasets',
      property: 'mergeByFields',
      subProperty: 'values',
      expectedStructure: 'mergeByFields.values array',
      invalidPatterns: ['mergeByFields.values.values']
    },
    {
      nodeType: 'sort',
      property: 'sortFieldsUi',
      subProperty: 'sortField',
      expectedStructure: 'sortFieldsUi.sortField array',
      invalidPatterns: ['sortFieldsUi.sortField.values']
    },
    {
      nodeType: 'aggregate',
      property: 'fieldsToAggregate',
      subProperty: 'fieldToAggregate',
      expectedStructure: 'fieldsToAggregate.fieldToAggregate array',
      invalidPatterns: ['fieldsToAggregate.fieldToAggregate.values']
    },
    {
      nodeType: 'set',
      property: 'fields',
      subProperty: 'values',
      expectedStructure: 'fields.values array',
      invalidPatterns: ['fields.values.values']
    },
    {
      nodeType: 'html',
      property: 'extractionValues',
      subProperty: 'values',
      expectedStructure: 'extractionValues.values array',
      invalidPatterns: ['extractionValues.values.values']
    },
    {
      nodeType: 'httprequest',
      property: 'body',
      subProperty: 'parameters',
      expectedStructure: 'body.parameters array',
      invalidPatterns: ['body.parameters.values']
    },
    {
      nodeType: 'airtable',
      property: 'sort',
      subProperty: 'sortField',
      expectedStructure: 'sort.sortField array',
      invalidPatterns: ['sort.sortField.values']
    }
  ];

  /**
   * Validate a node configuration for fixedCollection issues
   * Includes protection against circular references
   */
  static validate(
    nodeType: string,
    config: NodeConfig
  ): FixedCollectionValidationResult {
    // Early return for non-object configs
    if (typeof config !== 'object' || config === null || Array.isArray(config)) {
      return { isValid: true, errors: [] };
    }
    
    const normalizedNodeType = this.normalizeNodeType(nodeType);
    const pattern = this.getPatternForNode(normalizedNodeType);
    
    if (!pattern) {
      return { isValid: true, errors: [] };
    }

    const result: FixedCollectionValidationResult = {
      isValid: true,
      errors: []
    };

    // Check for invalid patterns
    for (const invalidPattern of pattern.invalidPatterns) {
      if (this.hasInvalidStructure(config, invalidPattern)) {
        result.isValid = false;
        result.errors.push({
          pattern: invalidPattern,
          message: `Invalid structure for nodes-base.${pattern.nodeType} node: found nested "${invalidPattern}" but expected "${pattern.expectedStructure}". This causes "propertyValues[itemName] is not iterable" error in n8n.`,
          fix: this.generateFixMessage(pattern)
        });

        // Generate autofix
        if (!result.autofix) {
          result.autofix = this.generateAutofix(config, pattern);
        }
      }
    }

    return result;
  }

  /**
   * Apply autofix to a configuration
   */
  static applyAutofix(
    config: NodeConfig,
    pattern: FixedCollectionPattern
  ): NodeConfig | NodeConfigValue[] {
    const fixedConfig = this.generateAutofix(config, pattern);
    // For If/Filter nodes, the autofix might return just the values array
    if (pattern.nodeType === 'if' || pattern.nodeType === 'filter') {
      const conditions = config.conditions;
      if (conditions && typeof conditions === 'object' && !Array.isArray(conditions) && 'values' in conditions) {
        const values = conditions.values;
        if (values !== undefined && values !== null && 
            (Array.isArray(values) || typeof values === 'object')) {
          return values as NodeConfig | NodeConfigValue[];
        }
      }
    }
    return fixedConfig;
  }

  /**
   * Normalize node type to handle various formats
   */
  private static normalizeNodeType(nodeType: string): string {
    return nodeType
      .replace('n8n-nodes-base.', '')
      .replace('nodes-base.', '')
      .replace('@n8n/n8n-nodes-langchain.', '')
      .toLowerCase();
  }

  /**
   * Get pattern configuration for a specific node type
   */
  private static getPatternForNode(nodeType: string): FixedCollectionPattern | undefined {
    return this.KNOWN_PATTERNS.find(p => p.nodeType === nodeType);
  }

  /**
   * Check if configuration has an invalid structure
   * Includes circular reference protection
   */
  private static hasInvalidStructure(
    config: NodeConfig,
    pattern: string
  ): boolean {
    const parts = pattern.split('.');
    let current: NodeConfigValue = config;
    const visited = new WeakSet<object>();

    for (const part of parts) {
      // Check for null/undefined
      if (current === null || current === undefined) {
        return false;
      }
      
      // Check if it's an object (but not an array for property access)
      if (typeof current !== 'object' || Array.isArray(current)) {
        return false;
      }
      
      // Check for circular reference
      if (visited.has(current)) {
        return false; // Circular reference detected, invalid structure
      }
      visited.add(current);
      
      // Check if property exists (using hasOwnProperty to avoid prototype pollution)
      if (!Object.prototype.hasOwnProperty.call(current, part)) {
        return false;
      }
      
      const nextValue = (current as NodeConfig)[part];
      if (typeof nextValue !== 'object' || nextValue === null) {
        // If we have more parts to traverse but current value is not an object, invalid structure
        if (parts.indexOf(part) < parts.length - 1) {
          return false;
        }
      }
      current = nextValue as NodeConfig;
    }

    return true;
  }

  /**
   * Generate a fix message for the specific pattern
   */
  private static generateFixMessage(pattern: FixedCollectionPattern): string {
    switch (pattern.nodeType) {
      case 'switch':
        return 'Use: { "rules": { "values": [{ "conditions": {...}, "outputKey": "output1" }] } }';
      case 'if':
      case 'filter':
        return 'Use: { "conditions": {...} } or { "conditions": [...] } directly, not nested under "values"';
      case 'summarize':
        return 'Use: { "fieldsToSummarize": { "values": [...] } } not nested values.values';
      case 'comparedatasets':
        return 'Use: { "mergeByFields": { "values": [...] } } not nested values.values';
      case 'sort':
        return 'Use: { "sortFieldsUi": { "sortField": [...] } } not sortField.values';
      case 'aggregate':
        return 'Use: { "fieldsToAggregate": { "fieldToAggregate": [...] } } not fieldToAggregate.values';
      case 'set':
        return 'Use: { "fields": { "values": [...] } } not nested values.values';
      case 'html':
        return 'Use: { "extractionValues": { "values": [...] } } not nested values.values';
      case 'httprequest':
        return 'Use: { "body": { "parameters": [...] } } not parameters.values';
      case 'airtable':
        return 'Use: { "sort": { "sortField": [...] } } not sortField.values';
      default:
        return `Use ${pattern.expectedStructure} structure`;
    }
  }

  /**
   * Generate autofix for invalid structures
   */
  private static generateAutofix(
    config: NodeConfig,
    pattern: FixedCollectionPattern
  ): NodeConfig | NodeConfigValue[] {
    const fixedConfig = { ...config };

    switch (pattern.nodeType) {
      case 'switch': {
        const rules = config.rules;
        if (this.isNodeConfig(rules)) {
          const conditions = rules.conditions;
          if (this.isNodeConfig(conditions) && 'values' in conditions) {
            const values = conditions.values;
            fixedConfig.rules = {
              values: Array.isArray(values)
                ? values.map((condition, index) => ({
                    conditions: condition,
                    outputKey: `output${index + 1}`
                  }))
                : [{
                    conditions: values,
                    outputKey: 'output1'
                  }]
            };
          } else if (conditions) {
            fixedConfig.rules = {
              values: [{
                conditions: conditions,
                outputKey: 'output1'
              }]
            };
          }
        }
        break;
      }

      case 'if':
      case 'filter': {
        const conditions = config.conditions;
        if (this.isNodeConfig(conditions) && 'values' in conditions) {
          const values = conditions.values;
          if (values !== undefined && values !== null && 
              (Array.isArray(values) || typeof values === 'object')) {
            return values as NodeConfig | NodeConfigValue[];
          }
        }
        break;
      }

      case 'summarize': {
        const fieldsToSummarize = config.fieldsToSummarize;
        if (this.isNodeConfig(fieldsToSummarize)) {
          const values = fieldsToSummarize.values;
          if (this.isNodeConfig(values) && 'values' in values) {
            fixedConfig.fieldsToSummarize = {
              values: values.values
            };
          }
        }
        break;
      }

      case 'comparedatasets': {
        const mergeByFields = config.mergeByFields;
        if (this.isNodeConfig(mergeByFields)) {
          const values = mergeByFields.values;
          if (this.isNodeConfig(values) && 'values' in values) {
            fixedConfig.mergeByFields = {
              values: values.values
            };
          }
        }
        break;
      }

      case 'sort': {
        const sortFieldsUi = config.sortFieldsUi;
        if (this.isNodeConfig(sortFieldsUi)) {
          const sortField = sortFieldsUi.sortField;
          if (this.isNodeConfig(sortField) && 'values' in sortField) {
            fixedConfig.sortFieldsUi = {
              sortField: sortField.values
            };
          }
        }
        break;
      }

      case 'aggregate': {
        const fieldsToAggregate = config.fieldsToAggregate;
        if (this.isNodeConfig(fieldsToAggregate)) {
          const fieldToAggregate = fieldsToAggregate.fieldToAggregate;
          if (this.isNodeConfig(fieldToAggregate) && 'values' in fieldToAggregate) {
            fixedConfig.fieldsToAggregate = {
              fieldToAggregate: fieldToAggregate.values
            };
          }
        }
        break;
      }

      case 'set': {
        const fields = config.fields;
        if (this.isNodeConfig(fields)) {
          const values = fields.values;
          if (this.isNodeConfig(values) && 'values' in values) {
            fixedConfig.fields = {
              values: values.values
            };
          }
        }
        break;
      }

      case 'html': {
        const extractionValues = config.extractionValues;
        if (this.isNodeConfig(extractionValues)) {
          const values = extractionValues.values;
          if (this.isNodeConfig(values) && 'values' in values) {
            fixedConfig.extractionValues = {
              values: values.values
            };
          }
        }
        break;
      }

      case 'httprequest': {
        const body = config.body;
        if (this.isNodeConfig(body)) {
          const parameters = body.parameters;
          if (this.isNodeConfig(parameters) && 'values' in parameters) {
            fixedConfig.body = {
              ...body,
              parameters: parameters.values
            };
          }
        }
        break;
      }

      case 'airtable': {
        const sort = config.sort;
        if (this.isNodeConfig(sort)) {
          const sortField = sort.sortField;
          if (this.isNodeConfig(sortField) && 'values' in sortField) {
            fixedConfig.sort = {
              sortField: sortField.values
            };
          }
        }
        break;
      }
    }

    return fixedConfig;
  }

  /**
   * Get all known patterns (for testing and documentation)
   * Returns a deep copy to prevent external modifications
   */
  static getAllPatterns(): FixedCollectionPattern[] {
    return this.KNOWN_PATTERNS.map(pattern => ({
      ...pattern,
      invalidPatterns: [...pattern.invalidPatterns]
    }));
  }

  /**
   * Check if a node type is susceptible to fixedCollection issues
   */
  static isNodeSusceptible(nodeType: string): boolean {
    const normalizedType = this.normalizeNodeType(nodeType);
    return this.KNOWN_PATTERNS.some(p => p.nodeType === normalizedType);
  }
}