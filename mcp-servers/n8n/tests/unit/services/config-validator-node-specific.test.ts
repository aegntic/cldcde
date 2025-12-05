import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigValidator } from '@/services/config-validator';
import type { ValidationResult, ValidationError, ValidationWarning } from '@/services/config-validator';

// Mock the database
vi.mock('better-sqlite3');

describe('ConfigValidator - Node-Specific Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HTTP Request node validation', () => {
    it('should perform HTTP Request specific validation', () => {
      const nodeType = 'nodes-base.httpRequest';
      const config = {
        method: 'POST',
        url: 'invalid-url', // Missing protocol
        sendBody: false
      };
      const properties = [
        { name: 'method', type: 'options' },
        { name: 'url', type: 'string' },
        { name: 'sendBody', type: 'boolean' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        type: 'invalid_value',
        property: 'url',
        message: 'URL must start with http:// or https://'
      });
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toMatchObject({
        type: 'missing_common',
        property: 'sendBody',
        message: 'POST requests typically send a body'
      });
      expect(result.autofix).toMatchObject({
        sendBody: true,
        contentType: 'json'
      });
    });

    it('should validate HTTP Request with authentication in API URLs', () => {
      const nodeType = 'nodes-base.httpRequest';
      const config = {
        method: 'GET',
        url: 'https://api.github.com/user/repos',
        authentication: 'none'
      };
      const properties = [
        { name: 'method', type: 'options' },
        { name: 'url', type: 'string' },
        { name: 'authentication', type: 'options' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.warnings.some(w => 
        w.type === 'security' && 
        w.message.includes('API endpoints typically require authentication')
      )).toBe(true);
    });

    it('should validate JSON in HTTP Request body', () => {
      const nodeType = 'nodes-base.httpRequest';
      const config = {
        method: 'POST',
        url: 'https://api.example.com',
        contentType: 'json',
        body: '{"invalid": json}' // Invalid JSON
      };
      const properties = [
        { name: 'method', type: 'options' },
        { name: 'url', type: 'string' },
        { name: 'contentType', type: 'options' },
        { name: 'body', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.errors.some(e => 
        e.property === 'body' && 
        e.message.includes('Invalid JSON')
      ));
    });

    it('should handle webhook-specific validation', () => {
      const nodeType = 'nodes-base.webhook';
      const config = {
        httpMethod: 'GET',
        path: 'webhook-endpoint' // Missing leading slash
      };
      const properties = [
        { name: 'httpMethod', type: 'options' },
        { name: 'path', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.warnings.some(w => 
        w.property === 'path' && 
        w.message.includes('should start with /')
      ));
    });
  });

  describe('Code node validation', () => {
    it('should validate Code node configurations', () => {
      const nodeType = 'nodes-base.code';
      const config = {
        language: 'javascript',
        jsCode: '' // Empty code
      };
      const properties = [
        { name: 'language', type: 'options' },
        { name: 'jsCode', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        type: 'missing_required',
        property: 'jsCode',
        message: 'Code cannot be empty'
      });
    });

    it('should validate JavaScript syntax in Code node', () => {
      const nodeType = 'nodes-base.code';
      const config = {
        language: 'javascript',
        jsCode: `
          const data = { foo: "bar" };
          if (data.foo {  // Missing closing parenthesis
            return [{json: data}];
          }
        `
      };
      const properties = [
        { name: 'language', type: 'options' },
        { name: 'jsCode', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.errors.some(e => e.message.includes('Unbalanced')));
      expect(result.warnings).toHaveLength(1);
    });

    it('should validate n8n-specific patterns in Code node', () => {
      const nodeType = 'nodes-base.code';
      const config = {
        language: 'javascript',
        jsCode: `
          // Process data without returning
          const processedData = items.map(item => ({
            ...item.json,
            processed: true
          }));
          // No output provided
        `
      };
      const properties = [
        { name: 'language', type: 'options' },
        { name: 'jsCode', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      // The warning should be about missing return statement
      expect(result.warnings.some(w => w.type === 'missing_common' && w.message.includes('No return statement found'))).toBe(true);
    });

    it('should handle empty code in Code node', () => {
      const nodeType = 'nodes-base.code';
      const config = {
        language: 'javascript',
        jsCode: '   \n  \t  \n   ' // Just whitespace
      };
      const properties = [
        { name: 'language', type: 'options' },
        { name: 'jsCode', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => 
        e.type === 'missing_required' && 
        e.message.includes('Code cannot be empty')
      )).toBe(true);
    });

    it('should validate complex return patterns in Code node', () => {
      const nodeType = 'nodes-base.code';
      const config = {
        language: 'javascript',
        jsCode: `
          return ["string1", "string2", "string3"];
        `
      };
      const properties = [
        { name: 'language', type: 'options' },
        { name: 'jsCode', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.warnings.some(w => 
        w.type === 'invalid_value' && 
        w.message.includes('Items must be objects with json property')
      )).toBe(true);
    });

    it('should validate Code node with $helpers usage', () => {
      const nodeType = 'nodes-base.code';
      const config = {
        language: 'javascript',
        jsCode: `
          const workflow = $helpers.getWorkflowStaticData();
          workflow.counter = (workflow.counter || 0) + 1;
          return [{json: {count: workflow.counter}}];
        `
      };
      const properties = [
        { name: 'language', type: 'options' },
        { name: 'jsCode', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.warnings.some(w => 
        w.type === 'best_practice' && 
        w.message.includes('$helpers is only available in Code nodes')
      )).toBe(true);
    });

    it('should detect incorrect $helpers.getWorkflowStaticData usage', () => {
      const nodeType = 'nodes-base.code';
      const config = {
        language: 'javascript',
        jsCode: `
          const data = $helpers.getWorkflowStaticData;  // Missing parentheses
          return [{json: {data}}];
        `
      };
      const properties = [
        { name: 'language', type: 'options' },
        { name: 'jsCode', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.errors.some(e => 
        e.type === 'invalid_value' && 
        e.message.includes('getWorkflowStaticData requires parentheses')
      )).toBe(true);
    });

    it('should validate console.log usage', () => {
      const nodeType = 'nodes-base.code';
      const config = {
        language: 'javascript',
        jsCode: `
          console.log('Debug info:', items);
          return items;
        `
      };
      const properties = [
        { name: 'language', type: 'options' },
        { name: 'jsCode', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.warnings.some(w => 
        w.type === 'best_practice' && 
        w.message.includes('console.log output appears in n8n execution logs')
      )).toBe(true);
    });

    it('should validate $json usage warning', () => {
      const nodeType = 'nodes-base.code';
      const config = {
        language: 'javascript',
        jsCode: `
          const data = $json.myField;
          return [{json: {processed: data}}];
        `
      };
      const properties = [
        { name: 'language', type: 'options' },
        { name: 'jsCode', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.warnings.some(w => 
        w.type === 'best_practice' && 
        w.message.includes('$json only works in "Run Once for Each Item" mode')
      )).toBe(true);
    });

    it('should not warn about properties for Code nodes', () => {
      const nodeType = 'nodes-base.code';
      const config = {
        language: 'javascript',
        jsCode: 'return items;',
        unusedProperty: 'this should not generate a warning for Code nodes'
      };
      const properties = [
        { name: 'language', type: 'options' },
        { name: 'jsCode', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      // Code nodes should skip the common issues check that warns about unused properties
      expect(result.warnings.some(w => 
        w.type === 'inefficient' && 
        w.property === 'unusedProperty'
      )).toBe(false);
    });

    it('should validate crypto module usage', () => {
      const nodeType = 'nodes-base.code';
      const config = {
        language: 'javascript',
        jsCode: `
          const uuid = crypto.randomUUID();
          return [{json: {id: uuid}}];
        `
      };
      const properties = [
        { name: 'language', type: 'options' },
        { name: 'jsCode', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.warnings.some(w => 
        w.type === 'invalid_value' && 
        w.message.includes('Using crypto without require')
      )).toBe(true);
    });

    it('should suggest error handling for complex code', () => {
      const nodeType = 'nodes-base.code';
      const config = {
        language: 'javascript',
        jsCode: `
          const apiUrl = items[0].json.url;
          const response = await fetch(apiUrl);
          const data = await response.json();
          return [{json: data}];
        `
      };
      const properties = [
        { name: 'language', type: 'options' },
        { name: 'jsCode', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.suggestions.some(s => 
        s.includes('Consider adding error handling')
      ));
    });

    it('should suggest error handling for non-trivial code', () => {
      const nodeType = 'nodes-base.code';
      const config = {
        language: 'javascript',
        jsCode: Array(10).fill('const x = 1;').join('\n') + '\nreturn items;'
      };
      const properties = [
        { name: 'language', type: 'options' },
        { name: 'jsCode', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.suggestions.some(s => s.includes('error handling')));
    });

    it('should validate async operations without await', () => {
      const nodeType = 'nodes-base.code';
      const config = {
        language: 'javascript',
        jsCode: `
          const promise = fetch('https://api.example.com');
          return [{json: {data: promise}}];
        `
      };
      const properties = [
        { name: 'language', type: 'options' },
        { name: 'jsCode', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.warnings.some(w => 
        w.type === 'best_practice' && 
        w.message.includes('Async operation without await')
      )).toBe(true);
    });
  });

  describe('Python Code node validation', () => {
    it('should validate Python code syntax', () => {
      const nodeType = 'nodes-base.code';
      const config = {
        language: 'python',
        pythonCode: `
def process_data():
  return [{"json": {"test": True}]  # Missing closing bracket
        `
      };
      const properties = [
        { name: 'language', type: 'options' },
        { name: 'pythonCode', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.errors.some(e => 
        e.type === 'syntax_error' && 
        e.message.includes('Unmatched bracket')
      )).toBe(true);
    });

    it('should detect mixed indentation in Python code', () => {
      const nodeType = 'nodes-base.code';
      const config = {
        language: 'python',
        pythonCode: `
def process():
    x = 1
	y = 2  # This line uses tabs
    return [{"json": {"x": x, "y": y}}]
        `
      };
      const properties = [
        { name: 'language', type: 'options' },
        { name: 'pythonCode', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.errors.some(e => 
        e.type === 'syntax_error' && 
        e.message.includes('Mixed indentation')
      )).toBe(true);
    });

    it('should warn about incorrect n8n return patterns', () => {
      const nodeType = 'nodes-base.code';
      const config = {
        language: 'python',
        pythonCode: `
result = {"data": "value"}
return result  # Should return array of objects with json key
        `
      };
      const properties = [
        { name: 'language', type: 'options' },
        { name: 'pythonCode', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.warnings.some(w => 
        w.type === 'invalid_value' && 
        w.message.includes('Must return array of objects with json key')
      )).toBe(true);
    });

    it('should warn about using external libraries in Python code', () => {
      const nodeType = 'nodes-base.code';
      const config = {
        language: 'python',
        pythonCode: `
          import pandas as pd
          import requests
          
          df = pd.DataFrame(items)
          response = requests.get('https://api.example.com')
          return [{"json": {"data": response.json()}}]
        `
      };
      const properties = [
        { name: 'language', type: 'options' },
        { name: 'pythonCode', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.warnings.some(w => 
        w.type === 'invalid_value' && 
        w.message.includes('External libraries not available')
      )).toBe(true);
    });

    it('should validate Python code with print statements', () => {
      const nodeType = 'nodes-base.code';
      const config = {
        language: 'python',
        pythonCode: `
print("Debug:", items)
processed = []
for item in items:
    print(f"Processing: {item}")
    processed.append({"json": item["json"]})
return processed
        `
      };
      const properties = [
        { name: 'language', type: 'options' },
        { name: 'pythonCode', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.warnings.some(w => 
        w.type === 'best_practice' && 
        w.message.includes('print() output appears in n8n execution logs')
      )).toBe(true);
    });
  });

  describe('Database node validation', () => {
    it('should validate database query security', () => {
      const nodeType = 'nodes-base.postgres';
      const config = {
        query: 'DELETE FROM users;' // Missing WHERE clause
      };
      const properties = [
        { name: 'query', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.warnings.some(w => 
        w.type === 'security' && 
        w.message.includes('DELETE query without WHERE clause')
      )).toBe(true);
    });

    it('should check for SQL injection vulnerabilities', () => {
      const nodeType = 'nodes-base.mysql';
      const config = {
        query: 'SELECT * FROM users WHERE id = ${userId}'
      };
      const properties = [
        { name: 'query', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.warnings.some(w => 
        w.type === 'security' && 
        w.message.includes('SQL injection')
      )).toBe(true);
    });

    it('should validate SQL SELECT * performance warning', () => {
      const nodeType = 'nodes-base.postgres';
      const config = {
        query: 'SELECT * FROM large_table WHERE status = "active"'
      };
      const properties = [
        { name: 'query', type: 'string' }
      ];

      const result = ConfigValidator.validate(nodeType, config, properties);

      expect(result.suggestions.some(s => 
        s.includes('Consider selecting specific columns')
      )).toBe(true);
    });
  });
});