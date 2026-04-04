import Anthropic from '@anthropic-ai/sdk';

export type ConnectionMode = 'api_key' | 'local_cli' | 'demo' | 'disconnected';

interface ConnectionState {
    mode: ConnectionMode;
    isConnected: boolean;
    apiKey?: string;
    error?: string;
}

const STORAGE_KEY = 'cldcde_anthropic_key';

class ClaudeCodeService {
    private client: Anthropic | null = null;
    private state: ConnectionState = {
        mode: 'disconnected',
        isConnected: false
    };
    private listeners: Set<(state: ConnectionState) => void> = new Set();

    constructor() {
        // Try to restore from localStorage on init
        this.tryRestoreConnection();
    }

    private tryRestoreConnection() {
        if (typeof window === 'undefined') return;

        const storedKey = localStorage.getItem(STORAGE_KEY);
        if (storedKey) {
            this.connectWithApiKey(storedKey, false);
        }
    }

    /**
     * Connect using Anthropic API key
     */
    async connectWithApiKey(apiKey: string, save: boolean = true): Promise<boolean> {
        try {
            // Validate key format
            if (!apiKey.startsWith('sk-ant-')) {
                this.updateState({
                    mode: 'disconnected',
                    isConnected: false,
                    error: 'Invalid API key format. Should start with sk-ant-'
                });
                return false;
            }

            // Create client
            this.client = new Anthropic({
                apiKey,
                dangerouslyAllowBrowser: true // Required for browser usage
            });

            // Test connection with a simple request
            await this.client.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 10,
                messages: [{ role: 'user', content: 'ping' }]
            });

            // Save key if requested
            if (save && typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, apiKey);
            }

            this.updateState({
                mode: 'api_key',
                isConnected: true,
                apiKey
            });

            return true;
        } catch (error: any) {
            console.error('Claude connection failed:', error);
            this.client = null;

            this.updateState({
                mode: 'disconnected',
                isConnected: false,
                error: error.message || 'Connection failed'
            });

            return false;
        }
    }

    /**
     * Enable demo mode (mock responses)
     */
    enableDemoMode() {
        this.client = null;
        this.updateState({
            mode: 'demo',
            isConnected: true
        });
    }

    /**
     * Disconnect and clear stored key
     */
    disconnect(clearStored: boolean = true) {
        this.client = null;

        if (clearStored && typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
        }

        this.updateState({
            mode: 'disconnected',
            isConnected: false
        });
    }

    /**
     * Send a message to Claude
     */
    async sendMessage(
        message: string,
        systemPrompt?: string
    ): Promise<string> {
        // Demo mode - return mock response
        if (this.state.mode === 'demo') {
            return this.getDemoResponse(message);
        }

        // Check connection
        if (!this.client || !this.state.isConnected) {
            throw new Error('Not connected to Claude. Please connect first.');
        }

        try {
            const response = await this.client.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2048,
                system: systemPrompt || 'You are Claude Code, a helpful AI coding assistant. Respond concisely in terminal-style format.',
                messages: [{ role: 'user', content: message }]
            });

            // Extract text from response
            const textContent = response.content.find(block => block.type === 'text');
            return textContent?.text || 'No response';
        } catch (error: any) {
            console.error('Claude API error:', error);
            throw new Error(error.message || 'Failed to send message');
        }
    }

    /**
     * Stream a message response
     */
    async *streamMessage(
        message: string,
        systemPrompt?: string
    ): AsyncGenerator<string> {
        // Demo mode - stream mock response
        if (this.state.mode === 'demo') {
            const response = this.getDemoResponse(message);
            for (const char of response) {
                yield char;
                await new Promise(r => setTimeout(r, 20));
            }
            return;
        }

        // Check connection
        if (!this.client || !this.state.isConnected) {
            throw new Error('Not connected to Claude. Please connect first.');
        }

        try {
            const stream = await this.client.messages.stream({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2048,
                system: systemPrompt || 'You are Claude Code, a helpful AI coding assistant. Respond concisely in terminal-style format.',
                messages: [{ role: 'user', content: message }]
            });

            for await (const event of stream) {
                if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                    yield event.delta.text;
                }
            }
        } catch (error: any) {
            console.error('Claude streaming error:', error);
            throw new Error(error.message || 'Streaming failed');
        }
    }

    /**
     * Get current connection state
     */
    getState(): ConnectionState {
        return { ...this.state };
    }

    /**
     * Subscribe to state changes
     */
    subscribe(listener: (state: ConnectionState) => void): () => void {
        this.listeners.add(listener);
        listener(this.state); // Initial call

        return () => {
            this.listeners.delete(listener);
        };
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
            return `[DEMO] Project Plan Generated:
1. Setup & Configuration (2h)
2. Core Implementation (4h)
3. Testing & Validation (2h)
4. Documentation (1h)`;
        }

        return `[DEMO MODE] Connect with your API key for real Claude responses.
Your message: "${message.substring(0, 50)}..."`;
    }
}

// Singleton instance
export const claudeCodeService = new ClaudeCodeService();
