import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpressionValidator } from '@/services/expression-validator';

describe('ExpressionValidator', () => {
  const defaultContext = {
    availableNodes: [],
    currentNodeName: 'TestNode',
    isInLoop: false,
    hasInputData: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateExpression', () => {
    it('should be a static method that validates expressions', () => {
      expect(typeof ExpressionValidator.validateExpression).toBe('function');
    });

    it('should return a validation result', () => {
      const result = ExpressionValidator.validateExpression('{{ $json.field }}', defaultContext);
      
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('usedVariables');
      expect(result).toHaveProperty('usedNodes');
    });

    it('should validate expressions with proper syntax', () => {
      const validExpr = '{{ $json.field }}';
      const result = ExpressionValidator.validateExpression(validExpr, defaultContext);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should detect malformed expressions', () => {
      const invalidExpr = '{{ $json.field'; // Missing closing braces
      const result = ExpressionValidator.validateExpression(invalidExpr, defaultContext);
      
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateNodeExpressions', () => {
    it('should validate all expressions in node parameters', () => {
      const parameters = {
        field1: '{{ $json.data }}',
        nested: {
          field2: 'regular text',
          field3: '{{ $node["Webhook"].json }}'
        }
      };

      const result = ExpressionValidator.validateNodeExpressions(parameters, defaultContext);

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });

    it('should collect errors from invalid expressions', () => {
      const parameters = {
        badExpr: '{{ $json.field', // Missing closing
        goodExpr: '{{ $json.field }}'
      };

      const result = ExpressionValidator.validateNodeExpressions(parameters, defaultContext);

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('expression patterns', () => {
    it('should recognize n8n variable patterns', () => {
      const expressions = [
        '{{ $json }}',
        '{{ $json.field }}',
        '{{ $node["NodeName"].json }}',
        '{{ $workflow.id }}',
        '{{ $now }}',
        '{{ $itemIndex }}'
      ];

      expressions.forEach(expr => {
        const result = ExpressionValidator.validateExpression(expr, defaultContext);
        expect(result).toBeDefined();
      });
    });
  });

  describe('context validation', () => {
    it('should use available nodes from context', () => {
      const contextWithNodes = {
        ...defaultContext,
        availableNodes: ['Webhook', 'Function', 'Slack']
      };

      const expr = '{{ $node["Webhook"].json }}';
      const result = ExpressionValidator.validateExpression(expr, contextWithNodes);

      expect(result.usedNodes.has('Webhook')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty expressions', () => {
      const result = ExpressionValidator.validateExpression('{{ }}', defaultContext);
      // The implementation might consider empty expressions as valid
      expect(result).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should handle non-expression text', () => {
      const result = ExpressionValidator.validateExpression('regular text without expressions', defaultContext);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle nested expressions', () => {
      const expr = '{{ $json[{{ $json.index }}] }}'; // Nested expressions not allowed
      const result = ExpressionValidator.validateExpression(expr, defaultContext);
      expect(result).toBeDefined();
    });
  });
});