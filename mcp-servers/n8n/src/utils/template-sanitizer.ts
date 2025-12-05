import { logger } from './logger';

/**
 * Configuration for template sanitization
 */
export interface SanitizerConfig {
  problematicTokens: string[];
  tokenPatterns: RegExp[];
  replacements: Map<string, string>;
}

/**
 * Default sanitizer configuration
 */
export const defaultSanitizerConfig: SanitizerConfig = {
  problematicTokens: [
    // Specific tokens can be added here if needed
  ],
  tokenPatterns: [
    /apify_api_[A-Za-z0-9]+/g,
    /sk-[A-Za-z0-9]+/g, // OpenAI tokens
    /Bearer\s+[A-Za-z0-9\-._~+\/]+=*/g // Generic bearer tokens
  ],
  replacements: new Map([
    ['apify_api_', 'apify_api_YOUR_TOKEN_HERE'],
    ['sk-', 'sk-YOUR_OPENAI_KEY_HERE'],
    ['Bearer ', 'Bearer YOUR_TOKEN_HERE']
  ])
};

/**
 * Template sanitizer for removing API tokens from workflow templates
 */
export class TemplateSanitizer {
  constructor(private config: SanitizerConfig = defaultSanitizerConfig) {}
  
  /**
   * Add a new problematic token to sanitize
   */
  addProblematicToken(token: string): void {
    if (!this.config.problematicTokens.includes(token)) {
      this.config.problematicTokens.push(token);
      logger.info(`Added problematic token to sanitizer: ${token.substring(0, 10)}...`);
    }
  }
  
  /**
   * Add a new token pattern to detect
   */
  addTokenPattern(pattern: RegExp, replacement: string): void {
    this.config.tokenPatterns.push(pattern);
    const prefix = pattern.source.match(/^([^[]+)/)?.[1] || '';
    if (prefix) {
      this.config.replacements.set(prefix, replacement);
    }
  }
  
  /**
   * Sanitize a workflow object
   */
  sanitizeWorkflow(workflow: any): { sanitized: any; wasModified: boolean } {
    const original = JSON.stringify(workflow);
    let sanitized = this.sanitizeObject(workflow);
    
    // Remove sensitive workflow data
    if (sanitized.pinData) {
      delete sanitized.pinData;
    }
    if (sanitized.executionId) {
      delete sanitized.executionId;
    }
    if (sanitized.staticData) {
      delete sanitized.staticData;
    }
    
    const wasModified = JSON.stringify(sanitized) !== original;
    
    return { sanitized, wasModified };
  }
  
  /**
   * Check if a workflow needs sanitization
   */
  needsSanitization(workflow: any): boolean {
    const workflowStr = JSON.stringify(workflow);
    
    // Check for known problematic tokens
    for (const token of this.config.problematicTokens) {
      if (workflowStr.includes(token)) {
        return true;
      }
    }
    
    // Check for token patterns
    for (const pattern of this.config.tokenPatterns) {
      pattern.lastIndex = 0; // Reset regex state
      if (pattern.test(workflowStr)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get list of detected tokens in a workflow
   */
  detectTokens(workflow: any): string[] {
    const workflowStr = JSON.stringify(workflow);
    const detectedTokens: string[] = [];
    
    // Check for known problematic tokens
    for (const token of this.config.problematicTokens) {
      if (workflowStr.includes(token)) {
        detectedTokens.push(token);
      }
    }
    
    // Check for token patterns
    for (const pattern of this.config.tokenPatterns) {
      pattern.lastIndex = 0; // Reset regex state
      const matches = workflowStr.match(pattern);
      if (matches) {
        detectedTokens.push(...matches);
      }
    }
    
    return [...new Set(detectedTokens)]; // Remove duplicates
  }
  
  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.replaceTokens(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    } else if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        result[key] = this.sanitizeObject(obj[key]);
      }
      return result;
    }
    return obj;
  }
  
  private replaceTokens(str: string): string {
    let result = str;
    
    // Replace known problematic tokens
    this.config.problematicTokens.forEach(token => {
      result = result.replace(new RegExp(token, 'g'), 'YOUR_API_TOKEN_HERE');
    });
    
    // Replace pattern-matched tokens
    this.config.tokenPatterns.forEach(pattern => {
      result = result.replace(pattern, (match) => {
        // Find the best replacement based on prefix
        for (const [prefix, replacement] of this.config.replacements) {
          if (match.startsWith(prefix)) {
            return replacement;
          }
        }
        return 'YOUR_TOKEN_HERE';
      });
    });
    
    return result;
  }
}