/**
 * Configuration Validator Service
 * 
 * Validates node configurations to catch errors before execution.
 * Provides helpful suggestions and identifies missing or misconfigured properties.
 */

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
  visibleProperties: string[];
  hiddenProperties: string[];
  autofix?: Record<string, any>;
}

export interface ValidationError {
  type: 'missing_required' | 'invalid_type' | 'invalid_value' | 'incompatible' | 'invalid_configuration' | 'syntax_error';
  property: string;
  message: string;
  fix?: string;}

export interface ValidationWarning {
  type: 'missing_common' | 'deprecated' | 'inefficient' | 'security' | 'best_practice' | 'invalid_value';
  property?: string;
  message: string;
  suggestion?: string;
}

export class ConfigValidator {
  /**
   * Validate a node configuration
   */
  static validate(
    nodeType: string, 
    config: Record<string, any>, 
    properties: any[]
  ): ValidationResult {
    // Input validation
    if (!config || typeof config !== 'object') {
      throw new TypeError('Config must be a non-null object');
    }
    if (!properties || !Array.isArray(properties)) {
      throw new TypeError('Properties must be a non-null array');
    }
    
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];
    const visibleProperties: string[] = [];
    const hiddenProperties: string[] = [];
    const autofix: Record<string, any> = {};
    
    // Check required properties
    this.checkRequiredProperties(properties, config, errors);
    
    // Check property visibility
    const { visible, hidden } = this.getPropertyVisibility(properties, config);
    visibleProperties.push(...visible);
    hiddenProperties.push(...hidden);
    
    // Validate property types and values
    this.validatePropertyTypes(properties, config, errors);
    
    // Node-specific validations
    this.performNodeSpecificValidation(nodeType, config, errors, warnings, suggestions, autofix);
    
    // Check for common issues
    this.checkCommonIssues(nodeType, config, properties, warnings, suggestions);
    
    // Security checks
    this.performSecurityChecks(nodeType, config, warnings);
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      visibleProperties,
      hiddenProperties,
      autofix: Object.keys(autofix).length > 0 ? autofix : undefined
    };
  }

  /**
   * Validate multiple node configurations in batch
   * Useful for validating entire workflows or multiple nodes at once
   * 
   * @param configs - Array of configurations to validate
   * @returns Array of validation results in the same order as input
   */
  static validateBatch(
    configs: Array<{
      nodeType: string;
      config: Record<string, any>;
      properties: any[];
    }>
  ): ValidationResult[] {
    return configs.map(({ nodeType, config, properties }) => 
      this.validate(nodeType, config, properties)
    );
  }
  
  /**
   * Check for missing required properties
   */
  private static checkRequiredProperties(
    properties: any[], 
    config: Record<string, any>, 
    errors: ValidationError[]
  ): void {
    for (const prop of properties) {
      if (!prop || !prop.name) continue; // Skip invalid properties
      
      if (prop.required) {
        const value = config[prop.name];
        
        // Check if property is missing or has null/undefined value
        if (!(prop.name in config)) {
          errors.push({
            type: 'missing_required',
            property: prop.name,
            message: `Required property '${prop.displayName || prop.name}' is missing`,
            fix: `Add ${prop.name} to your configuration`
          });
        } else if (value === null || value === undefined) {
          errors.push({
            type: 'invalid_type',
            property: prop.name,
            message: `Required property '${prop.displayName || prop.name}' cannot be null or undefined`,
            fix: `Provide a valid value for ${prop.name}`
          });
        }
      }
    }
  }
  
  /**
   * Get visible and hidden properties based on displayOptions
   */
  private static getPropertyVisibility(
    properties: any[], 
    config: Record<string, any>
  ): { visible: string[]; hidden: string[] } {
    const visible: string[] = [];
    const hidden: string[] = [];
    
    for (const prop of properties) {
      if (this.isPropertyVisible(prop, config)) {
        visible.push(prop.name);
      } else {
        hidden.push(prop.name);
      }
    }
    
    return { visible, hidden };
  }
  
  /**
   * Check if a property is visible given current config
   */
  protected static isPropertyVisible(prop: any, config: Record<string, any>): boolean {
    if (!prop.displayOptions) return true;
    
    // Check show conditions
    if (prop.displayOptions.show) {
      for (const [key, values] of Object.entries(prop.displayOptions.show)) {
        const configValue = config[key];
        const expectedValues = Array.isArray(values) ? values : [values];
        
        if (!expectedValues.includes(configValue)) {
          return false;
        }
      }
    }
    
    // Check hide conditions
    if (prop.displayOptions.hide) {
      for (const [key, values] of Object.entries(prop.displayOptions.hide)) {
        const configValue = config[key];
        const expectedValues = Array.isArray(values) ? values : [values];
        
        if (expectedValues.includes(configValue)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Validate property types and values
   */
  private static validatePropertyTypes(
    properties: any[], 
    config: Record<string, any>, 
    errors: ValidationError[]
  ): void {
    for (const [key, value] of Object.entries(config)) {
      const prop = properties.find(p => p.name === key);
      if (!prop) continue;
      
      // Type validation
      if (prop.type === 'string' && typeof value !== 'string') {
        errors.push({
          type: 'invalid_type',
          property: key,
          message: `Property '${key}' must be a string, got ${typeof value}`,
          fix: `Change ${key} to a string value`
        });
      } else if (prop.type === 'number' && typeof value !== 'number') {
        errors.push({
          type: 'invalid_type',
          property: key,
          message: `Property '${key}' must be a number, got ${typeof value}`,
          fix: `Change ${key} to a number`
        });
      } else if (prop.type === 'boolean' && typeof value !== 'boolean') {
        errors.push({
          type: 'invalid_type',
          property: key,
          message: `Property '${key}' must be a boolean, got ${typeof value}`,
          fix: `Change ${key} to true or false`
        });
      }
      
      // Options validation
      if (prop.type === 'options' && prop.options) {
        const validValues = prop.options.map((opt: any) => 
          typeof opt === 'string' ? opt : opt.value
        );
        
        if (!validValues.includes(value)) {
          errors.push({
            type: 'invalid_value',
            property: key,
            message: `Invalid value for '${key}'. Must be one of: ${validValues.join(', ')}`,
            fix: `Change ${key} to one of the valid options`
          });
        }
      }
    }
  }
  
  /**
   * Perform node-specific validation
   */
  private static performNodeSpecificValidation(
    nodeType: string,
    config: Record<string, any>,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    suggestions: string[],
    autofix: Record<string, any>
  ): void {
    switch (nodeType) {
      case 'nodes-base.httpRequest':
        this.validateHttpRequest(config, errors, warnings, suggestions, autofix);
        break;
      
      case 'nodes-base.webhook':
        this.validateWebhook(config, warnings, suggestions);
        break;
        
      case 'nodes-base.postgres':
      case 'nodes-base.mysql':
        this.validateDatabase(config, warnings, suggestions);
        break;
        
      case 'nodes-base.code':
        this.validateCode(config, errors, warnings);
        break;
    }
  }
  
  /**
   * Validate HTTP Request configuration
   */
  private static validateHttpRequest(
    config: Record<string, any>,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    suggestions: string[],
    autofix: Record<string, any>
  ): void {
    // URL validation
    if (config.url && typeof config.url === 'string') {
      if (!config.url.startsWith('http://') && !config.url.startsWith('https://')) {
        errors.push({
          type: 'invalid_value',
          property: 'url',
          message: 'URL must start with http:// or https://',
          fix: 'Add https:// to the beginning of your URL'
        });
      }
    }
    
    // POST/PUT/PATCH without body
    if (['POST', 'PUT', 'PATCH'].includes(config.method) && !config.sendBody) {
      warnings.push({
        type: 'missing_common',
        property: 'sendBody',
        message: `${config.method} requests typically send a body`,
        suggestion: 'Set sendBody=true and configure the body content'
      });
      
      autofix.sendBody = true;
      autofix.contentType = 'json';
    }
    
    // Authentication warnings
    if (!config.authentication || config.authentication === 'none') {
      if (config.url?.includes('api.') || config.url?.includes('/api/')) {
        warnings.push({
          type: 'security',
          message: 'API endpoints typically require authentication',
          suggestion: 'Consider setting authentication if the API requires it'
        });
      }
    }
    
    // JSON body validation
    if (config.sendBody && config.contentType === 'json' && config.jsonBody) {
      try {
        JSON.parse(config.jsonBody);
      } catch (e) {
        errors.push({
          type: 'invalid_value',
          property: 'jsonBody',
          message: 'jsonBody contains invalid JSON',
          fix: 'Ensure jsonBody contains valid JSON syntax'
        });
      }
    }
  }
  
  /**
   * Validate Webhook configuration
   */
  private static validateWebhook(
    config: Record<string, any>,
    warnings: ValidationWarning[],
    suggestions: string[]
  ): void {
    // Basic webhook validation - moved detailed validation to NodeSpecificValidators
    if (config.responseMode === 'responseNode' && !config.responseData) {
      suggestions.push('When using responseMode=responseNode, add a "Respond to Webhook" node to send custom responses');
    }
  }
  
  /**
   * Validate database queries
   */
  private static validateDatabase(
    config: Record<string, any>,
    warnings: ValidationWarning[],
    suggestions: string[]
  ): void {
    if (config.query) {
      const query = config.query.toLowerCase();
      
      // SQL injection warning
      if (query.includes('${') || query.includes('{{')) {
        warnings.push({
          type: 'security',
          message: 'Query contains template expressions that might be vulnerable to SQL injection',
          suggestion: 'Use parameterized queries with additionalFields.queryParams instead'
        });
      }
      
      // DELETE without WHERE
      if (query.includes('delete') && !query.includes('where')) {
        warnings.push({
          type: 'security',
          message: 'DELETE query without WHERE clause will delete all records',
          suggestion: 'Add a WHERE clause to limit the deletion'
        });
      }
      
      // SELECT * warning
      if (query.includes('select *')) {
        suggestions.push('Consider selecting specific columns instead of * for better performance');
      }
    }
  }
  
  /**
   * Validate Code node
   */
  private static validateCode(
    config: Record<string, any>,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const codeField = config.language === 'python' ? 'pythonCode' : 'jsCode';
    const code = config[codeField];
    
    if (!code || code.trim() === '') {
      errors.push({
        type: 'missing_required',
        property: codeField,
        message: 'Code cannot be empty',
        fix: 'Add your code logic'
      });
      return;
    }
    
    // Security checks
    if (code?.includes('eval(') || code?.includes('exec(')) {
      warnings.push({
        type: 'security',
        message: 'Code contains eval/exec which can be a security risk',
        suggestion: 'Avoid using eval/exec with untrusted input'
      });
    }
    
    // Basic syntax validation
    if (config.language === 'python') {
      this.validatePythonSyntax(code, errors, warnings);
    } else {
      this.validateJavaScriptSyntax(code, errors, warnings);
    }
    
    // n8n-specific patterns
    this.validateN8nCodePatterns(code, config.language || 'javascript', errors, warnings);
  }
  
  /**
   * Check for common configuration issues
   */
  private static checkCommonIssues(
    nodeType: string,
    config: Record<string, any>,
    properties: any[],
    warnings: ValidationWarning[],
    suggestions: string[]
  ): void {
    // Skip visibility checks for Code nodes as they have simple property structure
    if (nodeType === 'nodes-base.code') {
      // Code nodes don't have complex displayOptions, so skip visibility warnings
      return;
    }
    
    // Check for properties that won't be used
    const visibleProps = properties.filter(p => this.isPropertyVisible(p, config));
    const configuredKeys = Object.keys(config);
    
    for (const key of configuredKeys) {
      // Skip internal properties that are always present
      if (key === '@version' || key.startsWith('_')) {
        continue;
      }
      
      if (!visibleProps.find(p => p.name === key)) {
        warnings.push({
          type: 'inefficient',
          property: key,
          message: `Property '${key}' is configured but won't be used due to current settings`,
          suggestion: 'Remove this property or adjust other settings to make it visible'
        });
      }
    }
    
    // Suggest commonly used properties
    const commonProps = ['authentication', 'errorHandling', 'timeout'];
    for (const prop of commonProps) {
      const propDef = properties.find(p => p.name === prop);
      if (propDef && this.isPropertyVisible(propDef, config) && !(prop in config)) {
        suggestions.push(`Consider setting '${prop}' for better control`);
      }
    }
  }
  
  /**
   * Perform security checks
   */
  private static performSecurityChecks(
    nodeType: string,
    config: Record<string, any>,
    warnings: ValidationWarning[]
  ): void {
    // Check for hardcoded credentials
    const sensitivePatterns = [
      /api[_-]?key/i,
      /password/i,
      /secret/i,
      /token/i,
      /credential/i
    ];
    
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string') {
        for (const pattern of sensitivePatterns) {
          if (pattern.test(key) && value.length > 0 && !value.includes('{{')) {
            warnings.push({
              type: 'security',
              property: key,
              message: `Hardcoded ${key} detected`,
              suggestion: 'Use n8n credentials or expressions instead of hardcoding sensitive values'
            });
            break;
          }
        }
      }
    }
  }
  
  /**
   * Basic JavaScript syntax validation
   */
  private static validateJavaScriptSyntax(
    code: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check for common syntax errors
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push({
        type: 'invalid_value',
        property: 'jsCode',
        message: 'Unbalanced braces detected',
        fix: 'Check that all { have matching }'
      });
    }
    
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push({
        type: 'invalid_value',
        property: 'jsCode',
        message: 'Unbalanced parentheses detected',
        fix: 'Check that all ( have matching )'
      });
    }
    
    // Check for unterminated strings
    const stringMatches = code.match(/(["'`])(?:(?=(\\?))\2.)*?\1/g) || [];
    const quotesInStrings = stringMatches.join('').match(/["'`]/g)?.length || 0;
    const totalQuotes = (code.match(/["'`]/g) || []).length;
    if ((totalQuotes - quotesInStrings) % 2 !== 0) {
      warnings.push({
        type: 'inefficient',
        message: 'Possible unterminated string detected',
        suggestion: 'Check that all strings are properly closed'
      });
    }
  }
  
  /**
   * Basic Python syntax validation
   */
  private static validatePythonSyntax(
    code: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check indentation consistency
    const lines = code.split('\n');
    const indentTypes = new Set<string>();
    
    lines.forEach(line => {
      const indent = line.match(/^(\s+)/);
      if (indent) {
        if (indent[1].includes('\t')) indentTypes.add('tabs');
        if (indent[1].includes(' ')) indentTypes.add('spaces');
      }
    });
    
    if (indentTypes.size > 1) {
      errors.push({
        type: 'syntax_error',
        property: 'pythonCode',
        message: 'Mixed indentation (tabs and spaces)',
        fix: 'Use either tabs or spaces consistently, not both'
      });
    }
    
    // Check for unmatched brackets in Python
    const openSquare = (code.match(/\[/g) || []).length;
    const closeSquare = (code.match(/\]/g) || []).length;
    if (openSquare !== closeSquare) {
      errors.push({
        type: 'syntax_error',
        property: 'pythonCode',
        message: 'Unmatched bracket - missing ] or extra [',
        fix: 'Check that all [ have matching ]'
      });
    }
    
    // Check for unmatched curly braces
    const openCurly = (code.match(/\{/g) || []).length;
    const closeCurly = (code.match(/\}/g) || []).length;
    if (openCurly !== closeCurly) {
      errors.push({
        type: 'syntax_error',
        property: 'pythonCode',
        message: 'Unmatched bracket - missing } or extra {',
        fix: 'Check that all { have matching }'
      });
    }
    
    // Check for colons after control structures
    const controlStructures = /^\s*(if|elif|else|for|while|def|class|try|except|finally|with)\s+.*[^:]\s*$/gm;
    if (controlStructures.test(code)) {
      warnings.push({
        type: 'inefficient',
        message: 'Missing colon after control structure',
        suggestion: 'Add : at the end of if/for/def/class statements'
      });
    }
  }
  
  /**
   * Validate n8n-specific code patterns
   */
  private static validateN8nCodePatterns(
    code: string,
    language: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check for return statement
    const hasReturn = language === 'python' 
      ? /return\s+/.test(code)
      : /return\s+/.test(code);
    
    if (!hasReturn) {
      warnings.push({
        type: 'missing_common',
        message: 'No return statement found',
        suggestion: 'Code node must return data. Example: return [{json: {result: "success"}}]'
      });
    }
    
    // Check return format for JavaScript
    if (language === 'javascript' && hasReturn) {
      // Check for common incorrect return patterns
      if (/return\s+items\s*;/.test(code) && !code.includes('.map') && !code.includes('json:')) {
        warnings.push({
          type: 'best_practice',
          message: 'Returning items directly - ensure each item has {json: ...} structure',
          suggestion: 'If modifying items, use: return items.map(item => ({json: {...item.json, newField: "value"}}))'
        });
      }
      
      // Check for return without array
      if (/return\s+{[^}]+}\s*;/.test(code) && !code.includes('[') && !code.includes(']')) {
        warnings.push({
          type: 'invalid_value',
          message: 'Return value must be an array',
          suggestion: 'Wrap your return object in an array: return [{json: {your: "data"}}]'
        });
      }
      
      // Check for direct data return without json wrapper
      if (/return\s+\[['"`]/.test(code) || /return\s+\[\d/.test(code)) {
        warnings.push({
          type: 'invalid_value',
          message: 'Items must be objects with json property',
          suggestion: 'Use format: return [{json: {value: "data"}}] not return ["data"]'
        });
      }
    }
    
    // Check return format for Python
    if (language === 'python' && hasReturn) {
      // DEBUG: Log to see if we're entering this block
      if (code.includes('result = {"data": "value"}')) {
        console.log('DEBUG: Processing Python code with result variable');
        console.log('DEBUG: Language:', language);
        console.log('DEBUG: Has return:', hasReturn);
      }
      // Check for common incorrect patterns
      if (/return\s+items\s*$/.test(code) && !code.includes('json') && !code.includes('dict')) {
        warnings.push({
          type: 'best_practice',
          message: 'Returning items directly - ensure each item is a dict with "json" key',
          suggestion: 'Use: return [{"json": item.json} for item in items]'
        });
      }
      
      // Check for dict return without list
      if (/return\s+{['"]/.test(code) && !code.includes('[') && !code.includes(']')) {
        warnings.push({
          type: 'invalid_value',
          message: 'Return value must be a list',
          suggestion: 'Wrap your return dict in a list: return [{"json": {"your": "data"}}]'
        });
      }
      
      // Check for returning objects without json key
      if (/return\s+(?!.*\[).*{(?!.*["']json["'])/.test(code)) {
        warnings.push({
          type: 'invalid_value',
          message: 'Must return array of objects with json key',
          suggestion: 'Use format: return [{"json": {"data": "value"}}]'
        });
      }
      
      // Check for returning variable that might contain invalid format
      const returnMatch = code.match(/return\s+(\w+)\s*(?:#|$)/m);
      if (returnMatch) {
        const varName = returnMatch[1];
        // Check if this variable is assigned a dict without being in a list
        const assignmentRegex = new RegExp(`${varName}\\s*=\\s*{[^}]+}`, 'm');
        if (assignmentRegex.test(code) && !new RegExp(`${varName}\\s*=\\s*\\[`).test(code)) {
          warnings.push({
            type: 'invalid_value',
            message: 'Must return array of objects with json key',
            suggestion: `Wrap ${varName} in a list with json key: return [{"json": ${varName}}]`
          });
        }
      }
    }
    
    // Check for common n8n variables and patterns
    if (language === 'javascript') {
      // Check if accessing items/input
      if (!code.includes('items') && !code.includes('$input') && !code.includes('$json')) {
        warnings.push({
          type: 'missing_common',
          message: 'Code doesn\'t reference input data',
          suggestion: 'Access input with: items, $input.all(), or $json (in single-item mode)'
        });
      }
      
      // Check for common mistakes with $json
      if (code.includes('$json') && !code.includes('mode')) {
        warnings.push({
          type: 'best_practice',
          message: '$json only works in "Run Once for Each Item" mode',
          suggestion: 'For all items mode, use: items[0].json or loop through items'
        });
      }
      
      // Check for undefined variable usage
      const commonVars = ['$node', '$workflow', '$execution', '$prevNode', 'DateTime', 'jmespath'];
      const usedVars = commonVars.filter(v => code.includes(v));
      
      // Check for incorrect $helpers usage patterns
      if (code.includes('$helpers.getWorkflowStaticData')) {
        // Check if it's missing parentheses
        if (/\$helpers\.getWorkflowStaticData(?!\s*\()/.test(code)) {
          errors.push({
            type: 'invalid_value',
            property: 'jsCode',
            message: 'getWorkflowStaticData requires parentheses: $helpers.getWorkflowStaticData()',
            fix: 'Add parentheses: $helpers.getWorkflowStaticData()'
          });
        } else {
          warnings.push({
            type: 'invalid_value',
            message: '$helpers.getWorkflowStaticData() is incorrect - causes "$helpers is not defined" error',
            suggestion: 'Use $getWorkflowStaticData() as a standalone function (no $helpers prefix)'
          });
        }
      }
      
      // Check for $helpers usage without checking availability
      if (code.includes('$helpers') && !code.includes('typeof $helpers')) {
        warnings.push({
          type: 'best_practice',
          message: '$helpers is only available in Code nodes with mode="runOnceForEachItem"',
          suggestion: 'Check availability first: if (typeof $helpers !== "undefined" && $helpers.httpRequest) { ... }'
        });
      }
      
      // Check for async without await
      if ((code.includes('fetch(') || code.includes('Promise') || code.includes('.then(')) && !code.includes('await')) {
        warnings.push({
          type: 'best_practice',
          message: 'Async operation without await - will return a Promise instead of actual data',
          suggestion: 'Use await with async operations: const result = await fetch(...);'
        });
      }
      
      // Check for crypto usage without require
      if ((code.includes('crypto.') || code.includes('randomBytes') || code.includes('randomUUID')) && !code.includes('require')) {
        warnings.push({
          type: 'invalid_value',
          message: 'Using crypto without require statement',
          suggestion: 'Add: const crypto = require("crypto"); at the beginning (ignore editor warnings)'
        });
      }
      
      // Check for console.log (informational)
      if (code.includes('console.log')) {
        warnings.push({
          type: 'best_practice',
          message: 'console.log output appears in n8n execution logs',
          suggestion: 'Remove console.log statements in production or use them sparingly'
        });
      }
    } else if (language === 'python') {
      // Python-specific checks
      if (!code.includes('items') && !code.includes('_input')) {
        warnings.push({
          type: 'missing_common',
          message: 'Code doesn\'t reference input items',
          suggestion: 'Access input data with: items variable'
        });
      }
      
      // Check for print statements
      if (code.includes('print(')) {
        warnings.push({
          type: 'best_practice',
          message: 'print() output appears in n8n execution logs',
          suggestion: 'Remove print statements in production or use them sparingly'
        });
      }
      
      // Check for common Python mistakes
      if (code.includes('import requests') || code.includes('import pandas')) {
        warnings.push({
          type: 'invalid_value',
          message: 'External libraries not available in Code node',
          suggestion: 'Only Python standard library is available. For HTTP requests, use JavaScript with $helpers.httpRequest'
        });
      }
    }
    
    // Check for infinite loops
    if (/while\s*\(\s*true\s*\)|while\s+True:/.test(code)) {
      warnings.push({
        type: 'security',
        message: 'Infinite loop detected',
        suggestion: 'Add a break condition or use a for loop with limits'
      });
    }
    
    // Check for error handling
    if (!code.includes('try') && !code.includes('catch') && !code.includes('except')) {
      if (code.length > 200) { // Only suggest for non-trivial code
        warnings.push({
          type: 'best_practice',
          message: 'No error handling found',
          suggestion: 'Consider adding try/catch (JavaScript) or try/except (Python) for robust error handling'
        });
      }
    }
  }
}