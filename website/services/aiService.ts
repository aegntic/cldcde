// Universal AI Provider Service
// Supports: OpenAI, Anthropic, OpenRouter, Groq, z.ai, and custom OpenAI-compatible endpoints
// Updated: December 2025

export type AIProvider = 'openai' | 'anthropic' | 'openrouter' | 'groq' | 'zai' | 'zai_coding' | 'zai_china' | 'custom';

export interface OpenRouterModel {
    id: string;
    name: string;
    context_length: number;
    pricing: {
        prompt: string;
        completion: string;
    };
}

export interface ProviderConfig {
    id: AIProvider;
    name: string;
    baseUrl: string;
    keyPrefix?: string;
    models: string[];
    defaultModel: string;
    headerFormat: 'bearer' | 'x-api-key';
    dynamicModels?: boolean; // If true, models can be fetched from API
}

export const PROVIDERS: Record<AIProvider, ProviderConfig> = {
    openai: {
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        keyPrefix: 'sk-',
        // December 2025: GPT-5 series + o4/o3 reasoning models
        models: [
            'gpt-5-nano',            // cheapest, fastest
            'gpt-5-mini',            // balanced cost/performance
            'o4-mini',               // reasoning, cost-effective
            'o3-mini',               // reasoning mini
            'gpt-5',                 // flagship
            'gpt-5-chat',            // optimized for chat
            'o3',                    // reasoning full
            'o3-pro'                 // premium reasoning
        ],
        defaultModel: 'gpt-5-nano',
        headerFormat: 'bearer'
    },
    anthropic: {
        id: 'anthropic',
        name: 'Anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        keyPrefix: 'sk-ant-',
        // December 2025: Claude 4.5 series (latest as of Dec 1, 2025)
        models: [
            'claude-haiku-4.5',          // fast & cheapest
            'claude-sonnet-4.5',         // balanced - best for coding
            'claude-opus-4.5',           // flagship (Dec 1, 2025)
            'claude-sonnet-4',           // previous gen
            'claude-opus-4',             // previous gen
            'claude-3-5-haiku-20241022'  // legacy
        ],
        defaultModel: 'claude-haiku-4.5',
        headerFormat: 'x-api-key'
    },
    openrouter: {
        id: 'openrouter',
        name: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        keyPrefix: 'sk-or-',
        dynamicModels: true, // Models fetched from API
        // Default popular models (will be replaced by fetched models)
        models: [
            'openai/gpt-4o',
            'anthropic/claude-3.5-sonnet',
            'google/gemini-pro-1.5',
            'meta-llama/llama-3.1-70b-instruct'
        ],
        defaultModel: 'openai/gpt-4o',
        headerFormat: 'bearer'
    },
    groq: {
        id: 'groq',
        name: 'Groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        keyPrefix: 'gsk_',
        // December 2025: Llama 4 + Llama 3.3, ultra-fast inference, FREE TIER
        models: [
            'llama-3.3-70b-versatile',      // fast & capable
            'llama-3.1-8b-instant',         // ultra fast
            'llama-4-scout-17b-16e-instruct', // Llama 4
            'llama-4-maverick-17b-128e-instruct',
            'mixtral-8x7b-32768'            // Mixtral
        ],
        defaultModel: 'llama-3.3-70b-versatile',
        headerFormat: 'bearer'
    },
    zai: {
        id: 'zai',
        name: 'Zhipu AI (z.ai)',
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        // GLM-4 series models (December 2025)
        // Docs: https://open.bigmodel.cn/dev/api
        models: [
            'glm-4-flash',      // Fast & cheap
            'glm-4-air',        // Balanced
            'glm-4-airx',       // Fast balanced
            'glm-4-plus',       // High capability
            'glm-4-long',       // 1M context window
            'glm-4-0520',       // Stable version
            'glm-4'             // Base model
        ],
        defaultModel: 'glm-4-flash',
        headerFormat: 'bearer'
    },
    zai_coding: {
        id: 'zai_coding' as AIProvider,
        name: 'Zhipu CodeGeeX',
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        // CodeGeeX models - optimized for code completion & debugging
        models: [
            'codegeex-4',       // Latest code model
            'glm-4-flash',      // Fast general
            'glm-4-plus'        // High capability
        ],
        defaultModel: 'codegeex-4',
        headerFormat: 'bearer'
    },
    zai_china: {
        id: 'zai_china' as AIProvider,
        name: 'Zhipu AI (China Direct)',
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        // Same as main endpoint - China direct access
        models: [
            'glm-4-flash',
            'glm-4-air',
            'glm-4-airx',
            'glm-4-plus',
            'glm-4-long',
            'glm-4'
        ],
        defaultModel: 'glm-4-flash',
        headerFormat: 'bearer'
    },
    custom: {
        id: 'custom',
        name: 'Custom Endpoint',
        baseUrl: '',
        models: ['default'],
        defaultModel: 'default',
        headerFormat: 'bearer'
    }
};

export interface ConnectionState {
    provider: AIProvider;
    isConnected: boolean;
    apiKey?: string;
    model: string;
    customBaseUrl?: string;
    error?: string;
}

const STORAGE_KEY = 'cldcde_ai_connection';

class UniversalAIService {
    private state: ConnectionState = {
        provider: 'openrouter',
        isConnected: false,
        model: 'openai/gpt-4o'
    };
    private listeners: Set<(state: ConnectionState) => void> = new Set();

    constructor() {
        this.tryRestoreConnection();
    }

    private tryRestoreConnection() {
        if (typeof window === 'undefined') return;

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const saved = JSON.parse(stored);
                this.connect(saved.provider, saved.apiKey, saved.model, saved.customBaseUrl, false);
                return;
            } catch (e) {
                console.error('Failed to restore AI connection:', e);
            }
        }

        // Auto-connect to demo mode by default (no API key needed)
        this.enableDemoMode();
    }

    /**
     * Enable demo mode (mock responses, no API key required)
     */
    enableDemoMode() {
        this.updateState({
            provider: 'openrouter',
            isConnected: true,
            model: 'demo'
        });
    }

    /**
     * Connect to an AI provider
     */
    async connect(
        provider: AIProvider,
        apiKey: string,
        model?: string,
        customBaseUrl?: string,
        save: boolean = true
    ): Promise<boolean> {
        const config = PROVIDERS[provider];
        const selectedModel = model || config.defaultModel;

        try {
            // Validate key format if prefix is defined
            if (config.keyPrefix && !apiKey.startsWith(config.keyPrefix)) {
                this.updateState({
                    provider,
                    isConnected: false,
                    model: selectedModel,
                    error: `Invalid API key format. Expected to start with ${config.keyPrefix}`
                });
                return false;
            }

            // Determine base URL
            const baseUrl = provider === 'custom' ? customBaseUrl : config.baseUrl;
            if (!baseUrl) {
                this.updateState({
                    provider,
                    isConnected: false,
                    model: selectedModel,
                    error: 'Base URL required for custom provider'
                });
                return false;
            }

            // Test connection with appropriate API format
            const testResult = await this.testConnection(provider, apiKey, selectedModel, baseUrl!);

            if (!testResult.success) {
                this.updateState({
                    provider,
                    isConnected: false,
                    model: selectedModel,
                    error: testResult.error
                });
                return false;
            }

            // Save connection
            if (save && typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    provider,
                    apiKey,
                    model: selectedModel,
                    customBaseUrl
                }));
            }

            this.updateState({
                provider,
                isConnected: true,
                apiKey,
                model: selectedModel,
                customBaseUrl
            });

            return true;
        } catch (error: any) {
            this.updateState({
                provider,
                isConnected: false,
                model: selectedModel,
                error: error.message || 'Connection failed'
            });
            return false;
        }
    }

    /**
     * Test connection to provider
     */
    private async testConnection(
        provider: AIProvider,
        apiKey: string,
        model: string,
        baseUrl: string
    ): Promise<{ success: boolean; error?: string }> {
        const config = PROVIDERS[provider];

        try {
            if (provider === 'anthropic') {
                // Anthropic uses different API format
                const response = await fetch(`${baseUrl}/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01',
                        'anthropic-dangerous-direct-browser-access': 'true'
                    },
                    body: JSON.stringify({
                        model,
                        max_tokens: 10,
                        messages: [{ role: 'user', content: 'ping' }]
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    return { success: false, error: error.error?.message || 'Anthropic API error' };
                }
                return { success: true };
            }

            // OpenAI-compatible API format (OpenAI, OpenRouter, z.ai, custom)
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model,
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'ping' }]
                })
            });

            if (!response.ok) {
                const error = await response.json();
                return { success: false, error: error.error?.message || 'API error' };
            }
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message || 'Network error' };
        }
    }

    /**
     * Disconnect and clear stored credentials
     */
    disconnect(clearStored: boolean = true) {
        if (clearStored && typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
        }

        this.updateState({
            provider: 'openai',
            isConnected: false,
            model: 'gpt-4o-mini'
        });
    }

    /**
     * Send a message to the connected AI
     */
    async sendMessage(message: string, systemPrompt?: string): Promise<string> {
        // Demo mode - works without API key
        if (this.state.model === 'demo') {
            return this.getDemoResponse(message);
        }

        // Real provider requires connection and API key
        if (!this.state.isConnected) {
            throw new Error('Not connected. Click the model name to connect.');
        }

        if (!this.state.apiKey) {
            throw new Error('API key required. Click the model name to add your key.');
        }

        const config = PROVIDERS[this.state.provider];
        const baseUrl = this.state.provider === 'custom' ? this.state.customBaseUrl : config.baseUrl;
        const defaultSystem = 'You are a helpful AI coding assistant. Respond concisely in terminal-style format.';

        try {
            if (this.state.provider === 'anthropic') {
                // Anthropic API
                const response = await fetch(`${baseUrl}/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.state.apiKey,
                        'anthropic-version': '2023-06-01',
                        'anthropic-dangerous-direct-browser-access': 'true'
                    },
                    body: JSON.stringify({
                        model: this.state.model,
                        max_tokens: 2048,
                        system: systemPrompt || defaultSystem,
                        messages: [{ role: 'user', content: message }]
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || 'Anthropic API error');
                }

                const data = await response.json();
                return data.content[0]?.text || 'No response';
            }

            // OpenAI-compatible API
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.state.apiKey}`
                },
                body: JSON.stringify({
                    model: this.state.model,
                    max_tokens: 2048,
                    messages: [
                        { role: 'system', content: systemPrompt || defaultSystem },
                        { role: 'user', content: message }
                    ]
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API error');
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || 'No response';
        } catch (error: any) {
            throw new Error(error.message || 'Failed to send message');
        }
    }

    /**
     * Get current connection state
     */
    getState(): ConnectionState {
        return { ...this.state };
    }

    /**
     * Get provider config
     */
    getProviderConfig(provider: AIProvider): ProviderConfig {
        return PROVIDERS[provider];
    }

    /**
     * Fetch available models from OpenRouter API
     * Returns array of model objects with id, name, context_length, and pricing
     */
    async fetchOpenRouterModels(apiKey: string): Promise<OpenRouterModel[]> {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error('Failed to fetch OpenRouter models:', response.status);
                return [];
            }

            const data = await response.json();

            // Map and sort models: free first, then by name
            const models: OpenRouterModel[] = (data.data || [])
                .map((m: any) => ({
                    id: m.id,
                    name: m.name || m.id,
                    context_length: m.context_length || 0,
                    pricing: {
                        prompt: m.pricing?.prompt || '0',
                        completion: m.pricing?.completion || '0'
                    }
                }))
                .sort((a: OpenRouterModel, b: OpenRouterModel) => {
                    // Free models first (price = 0)
                    const aFree = a.pricing.prompt === '0';
                    const bFree = b.pricing.prompt === '0';
                    if (aFree && !bFree) return -1;
                    if (!aFree && bFree) return 1;
                    // Then alphabetically by name
                    return a.name.localeCompare(b.name);
                });

            return models;
        } catch (error) {
            console.error('Error fetching OpenRouter models:', error);
            return [];
        }
    }

    /**
     * Validate API key with OpenRouter (without needing a model)
     */
    async validateOpenRouterKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                return { valid: true };
            }

            const error = await response.json();
            return { valid: false, error: error.error?.message || 'Invalid API key' };
        } catch (error: any) {
            return { valid: false, error: error.message || 'Network error' };
        }
    }

    /**
     * Subscribe to state changes
     */
    subscribe(listener: (state: ConnectionState) => void): () => void {
        this.listeners.add(listener);
        listener(this.state);
        return () => this.listeners.delete(listener);
    }

    private updateState(newState: ConnectionState) {
        this.state = newState;
        this.listeners.forEach(listener => listener(newState));
    }

    private getDemoResponse(message: string): string {
        const lower = message.toLowerCase();

        if (lower.includes('help')) {
            return `Available commands:
  debug <issue>  - Analyze and debug issues
  plan <project> - Generate project plan
  explain <code> - Explain code snippet
  refactor <code> - Suggest refactoring`;
        }

        if (lower.includes('debug') || lower.includes('fix')) {
            return `[DEMO] Analyzing issue...
✓ Root cause identified: Missing null check
✓ Suggested fix: Add optional chaining
→ Replace: obj.prop with obj?.prop`;
        }

        if (lower.includes('plan')) {
            return `[DEMO] Project Plan:
1. Setup & Configuration (2h)
2. Core Implementation (4h)
3. Testing & Validation (2h)
4. Documentation (1h)`;
        }

        return `[DEMO MODE] Connect with your API key for real AI responses.
Your input: "${message.substring(0, 50)}..."`;
    }
}

// Singleton instance
export const aiService = new UniversalAIService();
