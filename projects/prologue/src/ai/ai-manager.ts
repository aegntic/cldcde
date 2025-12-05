/**
 * AI Manager with Secure Prompt Handling
 * Manages AI interactions while keeping proprietary prompts secure
 */

import { secureConfig } from '../config/secure-config';

export interface AIResponse {
  content: string;
  confidence: number;
  source: string;
  metadata?: Record<string, any>;
}

export interface AIRequest {
  prompt: string;
  context?: any;
  agentName: string;
  userMessage: string;
}

export class AIManager {
  private static instance: AIManager;

  private constructor() {}

  public static getInstance(): AIManager {
    if (!AIManager.instance) {
      AIManager.instance = new AIManager();
    }
    return AIManager.instance;
  }

  /**
   * Process AI request with secure prompt injection
   */
  public async processRequest(request: AIRequest): Promise<AIResponse> {
    try {
      // Load secure system prompt for the agent
      const systemPrompt = await secureConfig.getAIPrompt(request.agentName);

      // Combine system prompt with user context
      const fullPrompt = this.combinePrompts(systemPrompt, request);

      // Process with appropriate AI service
      const response = await this.callAIService(fullPrompt, request.agentName);

      return {
        content: response.content,
        confidence: response.confidence || 0.8,
        source: request.agentName,
        metadata: {
          model: response.model,
          tokens: response.tokens,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error(`[AI] Error processing request for ${request.agentName}:`, error);
      return {
        content: 'I apologize, but I encountered an error while processing your request.',
        confidence: 0.0,
        source: request.agentName,
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get available AI agents (without revealing proprietary content)
   */
  public getAvailableAgents(): Array<{
    id: string;
    name: string;
    description: string;
    capabilities: string[];
  }> {
    return [
      {
        id: 'visionary',
        name: 'Visionary Director',
        description: 'Creative direction and concept development',
        capabilities: ['concept-creation', 'creative-strategy', 'project-planning']
      },
      {
        id: 'builder',
        name: 'Rapid Builder',
        description: 'Quick prototyping and development',
        capabilities: ['rapid-prototyping', 'code-generation', 'implementation']
      },
      {
        id: 'designer',
        name: 'Design Master',
        description: 'Visual design and user experience',
        capabilities: ['ui-design', 'ux-planning', 'visual-aesthetics']
      },
      {
        id: 'data',
        name: 'Data Weaver',
        description: 'Data integration and visualization',
        capabilities: ['data-integration', 'visualization', 'analytics']
      },
      {
        id: 'security',
        name: 'Security Guardian',
        description: 'Security best practices and protection',
        capabilities: ['security-review', 'best-practices', 'vulnerability-assessment']
      },
      {
        id: 'deployment',
        name: 'Deployment Expert',
        description: 'Deployment strategies and optimization',
        capabilities: ['deployment-planning', 'optimization', 'scaling']
      }
    ];
  }

  /**
   * Validate AI agent configuration
   */
  public async validateConfiguration(): Promise<{
    valid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const configValidation = await secureConfig.validateSecureConfig();
    const issues: string[] = [...configValidation.missing];
    const recommendations: string[] = [];

    // Check for required API keys
    const requiredServices = ['anthropic'];
    for (const service of requiredServices) {
      if (!secureConfig.getApiKey(service)) {
        issues.push(`${service} API key is required`);
      }
    }

    // Add recommendations
    if (issues.length > 0) {
      recommendations.push('Set missing API keys and prompts to enable full functionality');
    }

    if (!process.env.FPEF_SYSTEM_PROMPT) {
      recommendations.push('Consider setting FPEF_SYSTEM_PROMPT for enhanced AI capabilities');
    }

    recommendations.push('Use environment variables for sensitive configuration');
    recommendations.push('Keep .prologue-key file secure and backed up');

    return {
      valid: issues.length === 0,
      issues,
      recommendations
    };
  }

  private combinePrompts(systemPrompt: string, request: AIRequest): string {
    // Combine system prompt with user request in a secure way
    const combined = [
      `<SYSTEM>${systemPrompt}</SYSTEM>`,
      `<CONTEXT>${JSON.stringify(request.context || {})}</CONTEXT>`,
      `<USER>${request.userMessage}</USER>`,
      `<PROJECT>${JSON.stringify({
        agentName: request.agentName,
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId()
      })}</PROJECT>`
    ].join('\n\n');

    return combined;
  }

  private async callAIService(prompt: string, agentName: string): Promise<any> {
    // Get appropriate API key
    const apiKey = secureConfig.getApiKey('anthropic');
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    // Call AI service (simplified for this example)
    // In production, this would make actual API calls
    try {
      const response = await this.makeAnthropicCall(prompt, apiKey);
      return response;
    } catch (error) {
      console.error('[AI] API call failed:', error);
      throw error;
    }
  }

  private async makeAnthropicCall(prompt: string, apiKey: string): Promise<any> {
    // This would be the actual Anthropic API call
    // For now, return a mock response
    return {
      content: 'This is a mock AI response. In production, this would be replaced with actual AI processing.',
      confidence: 0.9,
      model: 'claude-3-sonnet-20240229',
      tokens: 150
    };
  }

  private generateRequestId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Initialize secure AI configuration
   */
  public async initialize(): Promise<void> {
    console.log('[AI] Initializing AI Manager...');

    const validation = await this.validateConfiguration();
    if (!validation.valid) {
      console.warn('[AI] Configuration issues found:', validation.issues);
      console.info('[AI] Recommendations:', validation.recommendations);
    } else {
      console.log('[AI] AI Manager initialized successfully');
    }
  }

  /**
   * Get configuration status without revealing sensitive data
   */
  public getConfigurationStatus(): {
    configured: boolean;
    agentsAvailable: number;
    hasSecureConfig: boolean;
    hasApiKeys: boolean;
  } {
    const hasSecureConfig = !!process.env.PROLOGUE_ENCRYPTION_KEY ||
                           require('fs').existsSync('.prologue-key');

    const hasApiKeys = !!(secureConfig.getApiKey('anthropic') ||
                          process.env.ANTHROPIC_API_KEY);

    return {
      configured: hasSecureConfig && hasApiKeys,
      agentsAvailable: this.getAvailableAgents().length,
      hasSecureConfig,
      hasApiKeys
    };
  }
}

// Export singleton instance
export const aiManager = AIManager.getInstance();