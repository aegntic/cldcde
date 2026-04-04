/**
 * Agent Messaging - AI-to-AI communication protocol
 * Provides structured message passing between agents with queuing and delivery guarantees
 */

import { randomUUID } from 'crypto';
import type {
    AgentMessage,
    MessageType,
    MessageHandler,
    MessageQueue,
    OrchestratorConfig,
} from './types';

export class AgentMessaging {
    private queues: Map<string, MessageQueue> = new Map();
    private handlers: Map<string, Map<string, MessageHandler>> = new Map();
    private pendingResponses: Map<string, {
        resolve: (response: AgentMessage) => void;
        reject: (error: Error) => void;
        timeout: ReturnType<typeof setTimeout>;
    }> = new Map();
    private config: OrchestratorConfig;

    constructor(config: OrchestratorConfig) {
        this.config = config;
    }

    // ===========================================================================
    // Queue Management
    // ===========================================================================

    /**
     * Register an agent for message receiving
     */
    registerAgent(agentId: string): void {
        if (!this.queues.has(agentId)) {
            this.queues.set(agentId, {
                agentId,
                messages: [],
                maxSize: this.config.messaging?.maxQueueSize ?? 100,
            });
            this.handlers.set(agentId, new Map());
        }
    }

    /**
     * Unregister an agent
     */
    unregisterAgent(agentId: string): void {
        this.queues.delete(agentId);
        this.handlers.delete(agentId);
    }

    // ===========================================================================
    // Message Sending
    // ===========================================================================

    /**
     * Send a message to an agent or broadcast
     */
    send(
        from: string,
        to: string | 'broadcast',
        topic: string,
        payload: unknown,
        options: {
            type?: MessageType;
            replyTo?: string;
            priority?: 'low' | 'normal' | 'high' | 'critical';
            ttl?: number;
        } = {}
    ): AgentMessage {
        const message: AgentMessage = {
            id: randomUUID(),
            from,
            to,
            type: options.type ?? 'notification',
            topic,
            payload,
            timestamp: new Date(),
            replyTo: options.replyTo,
            ttl: options.ttl ?? this.config.messaging?.messageTtl,
            priority: options.priority ?? 'normal',
        };

        if (to === 'broadcast') {
            this.broadcast(message);
        } else {
            this.deliver(message, to);
        }

        return message;
    }

    /**
     * Send a request and wait for response
     */
    async request(
        from: string,
        to: string,
        topic: string,
        payload: unknown,
        timeoutMs: number = 30000
    ): Promise<AgentMessage> {
        const message = this.send(from, to, topic, payload, { type: 'request' });

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingResponses.delete(message.id);
                reject(new Error(`Request timeout: ${message.id}`));
            }, timeoutMs);

            this.pendingResponses.set(message.id, { resolve, reject, timeout });
        });
    }

    /**
     * Send a response to a request
     */
    respond(originalMessage: AgentMessage, payload: unknown): AgentMessage {
        return this.send(
            originalMessage.to as string,
            originalMessage.from,
            originalMessage.topic,
            payload,
            {
                type: 'response',
                replyTo: originalMessage.id,
            }
        );
    }

    /**
     * Broadcast a message to all agents
     */
    private broadcast(message: AgentMessage): void {
        for (const agentId of Array.from(this.queues.keys())) {
            if (agentId !== message.from) {
                this.deliver({ ...message, to: agentId }, agentId);
            }
        }
    }

    /**
     * Deliver a message to a specific agent
     */
    private deliver(message: AgentMessage, agentId: string): boolean {
        const queue = this.queues.get(agentId);
        if (!queue) {
            console.warn(`Agent not registered: ${agentId}`);
            return false;
        }

        // Check queue size
        if (queue.messages.length >= queue.maxSize) {
            // Remove oldest low-priority messages
            const lowPriorityIdx = queue.messages.findIndex(m => m.priority === 'low');
            if (lowPriorityIdx >= 0) {
                queue.messages.splice(lowPriorityIdx, 1);
            } else {
                console.warn(`Message queue full for agent: ${agentId}`);
                return false;
            }
        }

        // Insert by priority
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
        const insertIdx = queue.messages.findIndex(
            m => priorityOrder[m.priority ?? 'normal'] > priorityOrder[message.priority ?? 'normal']
        );

        if (insertIdx >= 0) {
            queue.messages.splice(insertIdx, 0, message);
        } else {
            queue.messages.push(message);
        }

        // Handle response messages
        if (message.type === 'response' && message.replyTo) {
            const pending = this.pendingResponses.get(message.replyTo);
            if (pending) {
                clearTimeout(pending.timeout);
                this.pendingResponses.delete(message.replyTo);
                pending.resolve(message);
            }
        }

        // Process handlers
        this.processHandlers(agentId, message);

        return true;
    }

    // ===========================================================================
    // Message Receiving
    // ===========================================================================

    /**
     * Get pending messages for an agent
     */
    receive(agentId: string, limit?: number): AgentMessage[] {
        const queue = this.queues.get(agentId);
        if (!queue) return [];

        // Filter expired messages
        const now = Date.now();
        queue.messages = queue.messages.filter(m => {
            if (!m.ttl) return true;
            return now - m.timestamp.getTime() < m.ttl;
        });

        const count = limit ?? queue.messages.length;
        return queue.messages.splice(0, count);
    }

    /**
     * Peek at messages without removing
     */
    peek(agentId: string, limit?: number): AgentMessage[] {
        const queue = this.queues.get(agentId);
        if (!queue) return [];

        const count = limit ?? queue.messages.length;
        return queue.messages.slice(0, count);
    }

    /**
     * Get message count for an agent
     */
    count(agentId: string): number {
        return this.queues.get(agentId)?.messages.length ?? 0;
    }

    // ===========================================================================
    // Handler Registration
    // ===========================================================================

    /**
     * Register a message handler for a topic
     */
    on(agentId: string, topic: string, handler: (message: AgentMessage) => Promise<void>): void {
        const agentHandlers = this.handlers.get(agentId);
        if (!agentHandlers) {
            console.warn(`Agent not registered: ${agentId}`);
            return;
        }

        agentHandlers.set(topic, { topic, handler });
    }

    /**
     * Remove a message handler
     */
    off(agentId: string, topic: string): void {
        this.handlers.get(agentId)?.delete(topic);
    }

    /**
     * Process handlers for a message
     */
    private async processHandlers(agentId: string, message: AgentMessage): Promise<void> {
        const agentHandlers = this.handlers.get(agentId);
        if (!agentHandlers) return;

        // Check for exact topic match
        const exactHandler = agentHandlers.get(message.topic);
        if (exactHandler) {
            try {
                await exactHandler.handler(message);
            } catch (error) {
                console.error(`Handler error for ${agentId}:${message.topic}:`, error);
            }
        }

        // Check for wildcard handler
        const wildcardHandler = agentHandlers.get('*');
        if (wildcardHandler) {
            try {
                await wildcardHandler.handler(message);
            } catch (error) {
                console.error(`Wildcard handler error for ${agentId}:`, error);
            }
        }
    }

    // ===========================================================================
    // Utility Methods
    // ===========================================================================

    /**
     * Get messaging statistics
     */
    stats(): {
        registeredAgents: number;
        totalQueuedMessages: number;
        pendingResponses: number;
        queuesByAgent: Record<string, number>;
    } {
        const queuesByAgent: Record<string, number> = {};
        let totalQueuedMessages = 0;

        for (const [agentId, queue] of Array.from(this.queues)) {
            queuesByAgent[agentId] = queue.messages.length;
            totalQueuedMessages += queue.messages.length;
        }

        return {
            registeredAgents: this.queues.size,
            totalQueuedMessages,
            pendingResponses: this.pendingResponses.size,
            queuesByAgent,
        };
    }

    /**
     * Clear all messages for an agent
     */
    clear(agentId: string): void {
        const queue = this.queues.get(agentId);
        if (queue) {
            queue.messages = [];
        }
    }

    /**
     * Shutdown messaging system
     */
    shutdown(): void {
        // Clear all pending response timeouts
        for (const pending of Array.from(this.pendingResponses.values())) {
            clearTimeout(pending.timeout);
            pending.reject(new Error('Messaging shutdown'));
        }
        this.pendingResponses.clear();
        this.queues.clear();
        this.handlers.clear();
    }
}
