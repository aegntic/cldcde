import axios from 'axios';
import { GeminiConfig } from './types.js';

export class OpenRouterClient {
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    this.config = {
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'google/gemini-pro-1.5',
      maxTokens: 1000000,
      ...config
    };
  }

  async sendMessage(content: string, context?: string): Promise<string> {
    try {
      const payload = {
        model: this.config.model,
        messages: [
          ...(context ? [{ role: 'system', content: `Context: ${context}` }] : []),
          { role: 'user', content }
        ],
        max_tokens: this.config.maxTokens
      };

      const response = await axios.post(
        `${this.config.baseUrl}/chat/completions`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey || process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://ai-collaboration-hub.local',
            'X-Title': 'AI Collaboration Hub'
          }
        }
      );

      return response.data.choices[0]?.message?.content || 'No response received';
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      throw new Error(`Failed to communicate with Gemini: ${error}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.sendMessage('Hello, this is a connection test.');
      return true;
    } catch (error) {
      return false;
    }
  }
}