/**
 * Shared Context - Real-time memory accessible by all agents
 * Provides pub/sub context updates with automatic persistence to Graphiti
 */

import { randomUUID } from 'crypto';
import type {
    ContextEntry,
    ContextScope,
    ContextSubscription,
    ContextQuery,
    OrchestratorConfig,
} from './types';

export class SharedContext {
    private entries: Map<string, ContextEntry> = new Map();
    private subscriptions: Map<string, ContextSubscription> = new Map();
    private config: OrchestratorConfig;
    private cleanupInterval?: ReturnType<typeof setInterval>;

    constructor(config: OrchestratorConfig) {
        this.config = config;
        this.startCleanupLoop();
    }

    // ===========================================================================
    // Core Operations
    // ===========================================================================

    /**
     * Set a context entry
     */
    set(
        key: string,
        value: unknown,
        options: {
            scope?: ContextScope;
            owner?: string;
            ttl?: number;
            metadata?: Record<string, unknown>;
        } = {}
    ): ContextEntry {
        const now = new Date();
        const existing = this.entries.get(key);

        const entry: ContextEntry = {
            key,
            value,
            scope: options.scope ?? 'global',
            owner: options.owner ?? 'system',
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
            ttl: options.ttl ?? this.config.context?.defaultTtl,
            metadata: options.metadata,
        };

        this.entries.set(key, entry);
        this.notifySubscribers(entry, 'set');

        return entry;
    }

    /**
     * Get a context entry by key
     */
    get(key: string): ContextEntry | undefined {
        const entry = this.entries.get(key);
        if (entry && this.isExpired(entry)) {
            this.delete(key);
            return undefined;
        }
        return entry;
    }

    /**
     * Get the value of a context entry
     */
    getValue<T = unknown>(key: string): T | undefined {
        return this.get(key)?.value as T | undefined;
    }

    /**
     * Delete a context entry
     */
    delete(key: string): boolean {
        const entry = this.entries.get(key);
        if (entry) {
            this.entries.delete(key);
            this.notifySubscribers(entry, 'delete');
            return true;
        }
        return false;
    }

    /**
     * Check if a key exists
     */
    has(key: string): boolean {
        const entry = this.entries.get(key);
        if (entry && this.isExpired(entry)) {
            this.delete(key);
            return false;
        }
        return this.entries.has(key);
    }

    // ===========================================================================
    // Query Operations
    // ===========================================================================

    /**
     * Query entries matching criteria
     */
    query(query: ContextQuery): ContextEntry[] {
        const results: ContextEntry[] = [];
        const limit = query.limit ?? 100;

        for (const entry of Array.from(this.entries.values())) {
            if (this.isExpired(entry)) continue;

            // Match pattern (simple wildcard support)
            if (query.pattern && !this.matchPattern(entry.key, query.pattern)) {
                continue;
            }

            // Match scope
            if (query.scope && entry.scope !== query.scope) {
                continue;
            }

            // Match owner
            if (query.owner && entry.owner !== query.owner) {
                continue;
            }

            results.push(entry);

            if (results.length >= limit) break;
        }

        return results;
    }

    /**
     * Get all keys matching a pattern
     */
    keys(pattern?: string): string[] {
        const keys: string[] = [];
        for (const entry of Array.from(this.entries.values())) {
            if (this.isExpired(entry)) continue;
            if (!pattern || this.matchPattern(entry.key, pattern)) {
                keys.push(entry.key);
            }
        }
        return keys;
    }

    /**
     * Get entries by scope
     */
    byScope(scope: ContextScope): ContextEntry[] {
        return this.query({ scope });
    }

    /**
     * Get entries by owner
     */
    byOwner(owner: string): ContextEntry[] {
        return this.query({ owner });
    }

    // ===========================================================================
    // Subscription Operations
    // ===========================================================================

    /**
     * Subscribe to context changes
     */
    subscribe(
        pattern: string,
        callback: (entry: ContextEntry, event: 'set' | 'delete') => void,
        scope?: ContextScope
    ): string {
        const id = randomUUID();
        this.subscriptions.set(id, {
            id,
            pattern,
            scope: scope ?? 'global',
            callback,
        });
        return id;
    }

    /**
     * Unsubscribe from context changes
     */
    unsubscribe(subscriptionId: string): boolean {
        return this.subscriptions.delete(subscriptionId);
    }

    /**
     * Notify subscribers of a context change
     */
    private notifySubscribers(entry: ContextEntry, event: 'set' | 'delete'): void {
        for (const sub of Array.from(this.subscriptions.values())) {
            if (this.matchPattern(entry.key, sub.pattern)) {
                if (sub.scope === 'global' || sub.scope === entry.scope) {
                    try {
                        sub.callback(entry, event);
                    } catch (error) {
                        console.error(`Subscription callback error for ${sub.id}:`, error);
                    }
                }
            }
        }
    }

    // ===========================================================================
    // Namespaced Operations
    // ===========================================================================

    /**
     * Create a namespaced context (e.g., for a specific task or agent)
     */
    namespace(prefix: string, owner: string): NamespacedContext {
        return new NamespacedContext(this, prefix, owner);
    }

    // ===========================================================================
    // Utility Methods
    // ===========================================================================

    /**
     * Check if an entry is expired
     */
    private isExpired(entry: ContextEntry): boolean {
        if (!entry.ttl) return false;
        return Date.now() - entry.updatedAt.getTime() > entry.ttl;
    }

    /**
     * Match a key against a pattern (supports * wildcard)
     */
    private matchPattern(key: string, pattern: string): boolean {
        if (pattern === '*') return true;
        if (!pattern.includes('*')) return key === pattern;

        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(key);
    }

    /**
     * Start cleanup loop for expired entries
     */
    private startCleanupLoop(): void {
        this.cleanupInterval = setInterval(() => {
            for (const [key, entry] of Array.from(this.entries)) {
                if (this.isExpired(entry)) {
                    this.delete(key);
                }
            }
        }, 60000); // Run every minute
    }

    /**
     * Get statistics about the context
     */
    stats(): {
        totalEntries: number;
        byScope: Record<ContextScope, number>;
        subscriptionCount: number;
    } {
        const byScope: Record<ContextScope, number> = {
            global: 0,
            task: 0,
            agent: 0,
            session: 0,
        };

        for (const entry of Array.from(this.entries.values())) {
            if (!this.isExpired(entry)) {
                byScope[entry.scope]++;
            }
        }

        return {
            totalEntries: this.entries.size,
            byScope,
            subscriptionCount: this.subscriptions.size,
        };
    }

    /**
     * Export all entries (for persistence)
     */
    export(): ContextEntry[] {
        return Array.from(this.entries.values()).filter(e => !this.isExpired(e));
    }

    /**
     * Import entries (from persistence)
     */
    import(entries: ContextEntry[]): void {
        for (const entry of entries) {
            if (!this.isExpired(entry)) {
                this.entries.set(entry.key, entry);
            }
        }
    }

    /**
     * Clear all entries (optionally by scope)
     */
    clear(scope?: ContextScope): void {
        if (scope) {
            for (const [key, entry] of Array.from(this.entries)) {
                if (entry.scope === scope) {
                    this.delete(key);
                }
            }
        } else {
            this.entries.clear();
        }
    }

    /**
     * Shutdown and cleanup
     */
    shutdown(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.subscriptions.clear();
    }
}

/**
 * Namespaced context for scoped operations
 */
export class NamespacedContext {
    constructor(
        private context: SharedContext,
        private prefix: string,
        private owner: string
    ) { }

    private prefixKey(key: string): string {
        return `${this.prefix}:${key}`;
    }

    set(key: string, value: unknown, options: { ttl?: number; metadata?: Record<string, unknown> } = {}): ContextEntry {
        return this.context.set(this.prefixKey(key), value, {
            ...options,
            owner: this.owner,
            scope: 'task',
        });
    }

    get(key: string): ContextEntry | undefined {
        return this.context.get(this.prefixKey(key));
    }

    getValue<T = unknown>(key: string): T | undefined {
        return this.context.getValue<T>(this.prefixKey(key));
    }

    delete(key: string): boolean {
        return this.context.delete(this.prefixKey(key));
    }

    has(key: string): boolean {
        return this.context.has(this.prefixKey(key));
    }

    keys(): string[] {
        return this.context.keys(`${this.prefix}:*`).map(k => k.slice(this.prefix.length + 1));
    }

    clear(): void {
        for (const key of this.keys()) {
            this.delete(key);
        }
    }
}
