/**
 * Secure Configuration Manager
 * Handles loading and decryption of proprietary content while keeping it out of public repos
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';

export interface SecureConfig {
  aiPrompts: {
    fpefSystemPrompt?: string;
    agentInstructions?: Record<string, string>;
    proprietaryResponses?: Record<string, string>;
  };
  apiKeys: {
    [key: string]: string;
  };
  secrets: {
    [key: string]: string;
  };
}

export class SecureConfigManager {
  private static instance: SecureConfigManager;
  private config: SecureConfig | null = null;
  private encryptionKey: string;

  private constructor() {
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  public static getInstance(): SecureConfigManager {
    if (!SecureConfigManager.instance) {
      SecureConfigManager.instance = new SecureConfigManager();
    }
    return SecureConfigManager.instance;
  }

  /**
   * Load secure configuration from encrypted file or environment
   */
  public async loadConfig(): Promise<SecureConfig> {
    if (this.config) {
      return this.config;
    }

    this.config = {
      aiPrompts: {
        fpefSystemPrompt: process.env.FPEF_SYSTEM_PROMPT || this.loadEncryptedValue('fpef_prompt'),
        agentInstructions: this.loadAgentInstructions(),
        proprietaryResponses: this.loadProprietaryResponses()
      },
      apiKeys: this.loadApiKeys(),
      secrets: this.loadSecrets()
    };

    return this.config;
  }

  /**
   * Get AI system prompts securely
   */
  public async getAIPrompt(agentName: string): Promise<string> {
    const config = await this.loadConfig();

    // Load proprietary prompts from encrypted storage or environment
    const prompt = process.env[`${agentName.toUpperCase()}_PROMPT`] ||
                 config.aiPrompts.agentInstructions?.[agentName] ||
                 config.aiPrompts.fpefSystemPrompt ||
                 this.getDefaultPrompt(agentName);

    return prompt;
  }

  /**
   * Load API keys securely
   */
  public getApiKey(service: string): string | null {
    // Priority: Environment variables > encrypted storage > error
    return process.env[`${service.toUpperCase()}_API_KEY`] ||
           this.loadEncryptedValue(`${service}_api_key`) ||
           null;
  }

  /**
   * Store sensitive data securely
   */
  public async storeSecureValue(key: string, value: string): Promise<void> {
    const encrypted = this.encrypt(value);
    const securePath = this.getSecureConfigPath();

    await fs.ensureDir(path.dirname(securePath));

    let secureData: Record<string, string> = {};
    if (await fs.pathExists(securePath)) {
      try {
        secureData = await fs.readJson(securePath);
      } catch (error) {
        console.warn('[CONFIG] Failed to read secure config, creating new');
      }
    }

    secureData[key] = encrypted;
    await fs.writeJson(securePath, secureData, { spaces: 2 });
  }

  /**
   * Validate that required secure configurations are available
   */
  public async validateSecureConfig(): Promise<{ valid: boolean; missing: string[] }> {
    const config = await this.loadConfig();
    const missing: string[] = [];

    // Check for required AI prompts
    if (!config.aiPrompts.fpefSystemPrompt && !process.env.FPEF_SYSTEM_PROMPT) {
      missing.push('FPEF system prompt');
    }

    // Check for required API keys
    const requiredKeys = ['anthropic', 'resend'];
    for (const key of requiredKeys) {
      if (!this.getApiKey(key)) {
        missing.push(`${key} API key`);
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  private getOrCreateEncryptionKey(): string {
    // Try to get key from environment first
    if (process.env.PROLOGUE_ENCRYPTION_KEY) {
      return process.env.PROLOGUE_ENCRYPTION_KEY;
    }

    // Try to load from secure file
    const keyFile = path.join(process.cwd(), '.prologue-key');
    if (fs.existsSync(keyFile)) {
      return fs.readFileSync(keyFile, 'utf8');
    }

    // Generate new key and save
    const key = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(keyFile, key, { mode: 0o600 });
    console.warn('[CONFIG] Generated new encryption key. Save it securely:');
    console.warn(`PROLOGUE_ENCRYPTION_KEY=${key}`);

    return key;
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
    cipher.setAAD(Buffer.from('prologue-secure', 'utf8'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
    decipher.setAAD(Buffer.from('prologue-secure', 'utf8'));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  private loadEncryptedValue(key: string): string | undefined {
    try {
      const securePath = this.getSecureConfigPath();
      if (!fs.existsSync(securePath)) {
        return undefined;
      }

      const secureData = fs.readJsonSync(securePath);
      if (secureData[key]) {
        return this.decrypt(secureData[key]);
      }

      return undefined;
    } catch (error) {
      console.warn(`[CONFIG] Failed to load encrypted value for ${key}:`, error);
      return undefined;
    }
  }

  private getSecureConfigPath(): string {
    return path.join(process.cwd(), 'config', 'secure.json');
  }

  private loadAgentInstructions(): Record<string, string> {
    // Load from environment variables or secure storage
    const instructions: Record<string, string> = {};

    // Check environment variables first
    const envPrefix = 'PROLOGUE_AGENT_';
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(envPrefix) && key.endsWith('_PROMPT')) {
        const agentName = key.slice(envPrefix.length, -7).toLowerCase();
        instructions[agentName] = value || '';
      }
    }

    return instructions;
  }

  private loadProprietaryResponses(): Record<string, string> {
    // Load proprietary response templates
    const responses: Record<string, string> = {};

    // Check for proprietary response environment variables
    const envPrefix = 'PROLOGUE_RESPONSE_';
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(envPrefix)) {
        const responseName = key.slice(envPrefix.length).toLowerCase();
        responses[responseName] = value || '';
      }
    }

    return responses;
  }

  private loadApiKeys(): Record<string, string> {
    // API keys should only be loaded from environment variables for security
    const apiKeys: Record<string, string> = {};

    const apiKeyVars = [
      'ANTHROPIC_API_KEY',
      'OPENAI_API_KEY',
      'RESEND_API_KEY',
      'PORKBUN_API_KEY',
      'PORKBUN_SECRET_KEY'
    ];

    for (const varName of apiKeyVars) {
      const value = process.env[varName];
      if (value) {
        const serviceName = varName.toLowerCase().replace('_api_key', '').replace('_secret_key', '');
        apiKeys[serviceName] = value;
      }
    }

    return apiKeys;
  }

  private loadSecrets(): Record<string, string> {
    // Load other sensitive configuration
    const secrets: Record<string, string> = {};

    const secretVars = [
      'PROLOGUE_ENCRYPTION_KEY',
      'JWT_SECRET',
      'DATABASE_URL'
    ];

    for (const varName of secretVars) {
      const value = process.env[varName];
      if (value) {
        const secretName = varName.toLowerCase();
        secrets[secretName] = value;
      }
    }

    return secrets;
  }

  private getDefaultPrompt(agentName: string): string {
    // Default public-safe prompts
    const defaultPrompts: Record<string, string> = {
      visionary: `You are a creative director specializing in innovative digital experiences.`,
      builder: `You are a rapid development expert focused on efficient implementation.`,
      designer: `You are a design expert specializing in user experience and visual aesthetics.`,
      data: `You are a data integration and visualization specialist.`,
      security: `You are a security expert focused on best practices and protection.`,
      deployment: `You are a deployment specialist focused on reliability and scalability.`
    };

    return defaultPrompts[agentName] || `You are a helpful AI assistant specialized in ${agentName}.`;
  }

  /**
   * Initialize secure configuration with sample encrypted values
   */
  public async initializeSecureConfig(): Promise<void> {
    console.log('[CONFIG] Initializing secure configuration...');

    // Store example values (these would be set with actual proprietary content)
    await this.storeSecureValue('example_fpef_prompt', 'Example FPEF prompt placeholder');
    await this.storeSecureValue('example_agent_prompt', 'Example agent prompt placeholder');

    console.log('[CONFIG] Secure configuration initialized');
    console.log('[CONFIG] Set environment variables for production use:');
    console.log('   export FPEF_SYSTEM_PROMPT="your_proprietary_prompt"');
    console.log('   export PROLOGUE_ENCRYPTION_KEY="your_encryption_key"');
  }
}

// Export singleton instance
export const secureConfig = SecureConfigManager.getInstance();