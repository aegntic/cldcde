/**
 * Agent Orchestrator - Central coordinator for agent lifecycle and system coordination
 * Connects SharedContext, AgentMessaging, and Graphiti knowledge graph
 */

import { randomUUID } from 'crypto';
import { SharedContext } from './shared-context';
import { AgentMessaging } from './agent-messaging';
import { GraphitiBridge } from './graphiti-bridge';
import type {
    AgentDescriptor,
    AgentRegistration,
    AgentStatus,
    AgentPersona,
    AgentMessage,
    Task,
    TaskStatus,
    OrchestratorEvent,
    EventHandler,
    OrchestratorConfig,
    KnowledgeEpisode,
} from './types';
import { DEFAULT_CONFIG } from './types';

export class AgentOrchestrator {
    private instanceId: string;
    private agents: Map<string, AgentDescriptor> = new Map();
    private tasks: Map<string, Task> = new Map();
    private eventHandlers: Set<EventHandler> = new Set();
    private heartbeatInterval?: ReturnType<typeof setInterval>;

    // Core subsystems
    public readonly context: SharedContext;
    public readonly messaging: AgentMessaging;
    public readonly knowledge: GraphitiBridge;

    private config: OrchestratorConfig;

    constructor(config: Partial<OrchestratorConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.instanceId = config.instanceId ?? randomUUID();

        // Initialize subsystems
        this.context = new SharedContext(this.config);
        this.messaging = new AgentMessaging(this.config);
        this.knowledge = new GraphitiBridge(this.config);
    }

    // ===========================================================================
    // Lifecycle Management
    // ===========================================================================

    /**
     * Start the orchestrator
     */
    async start(): Promise<void> {
        console.log(`[Orchestrator] Starting instance: ${this.instanceId}`);

        // Connect to Graphiti
        await this.knowledge.connect();

        // Start heartbeat monitoring
        this.startHeartbeatMonitor();

        // Store orchestrator start event
        await this.knowledge.addEpisode({
            name: 'Orchestrator Started',
            content: `Orchestrator instance ${this.instanceId} started`,
            source: 'system',
            groupId: this.config.graphiti?.groupId ?? 'default',
            metadata: {
                instanceId: this.instanceId,
                startTime: new Date().toISOString(),
            },
        });

        console.log('[Orchestrator] Started successfully');
    }

    /**
     * Stop the orchestrator
     */
    async shutdown(): Promise<void> {
        console.log('[Orchestrator] Shutting down...');

        // Stop heartbeat monitoring
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        // Shutdown subsystems
        this.context.shutdown();
        this.messaging.shutdown();
        await this.knowledge.shutdown();

        // Clear state
        this.agents.clear();
        this.tasks.clear();
        this.eventHandlers.clear();

        console.log('[Orchestrator] Shutdown complete');
    }

    // ===========================================================================
    // Agent Registration
    // ===========================================================================

    /**
     * Register a new agent
     */
    registerAgent(registration: AgentRegistration): AgentDescriptor {
        const id = randomUUID();
        const now = new Date();

        const agent: AgentDescriptor = {
            id,
            name: registration.name,
            persona: registration.persona,
            capabilities: registration.capabilities,
            status: 'idle',
            registeredAt: now,
            lastHeartbeat: now,
            metadata: registration.metadata,
        };

        this.agents.set(id, agent);
        this.messaging.registerAgent(id);

        // Store registration in context
        this.context.set(`agent:${id}`, agent, {
            scope: 'global',
            owner: 'orchestrator',
        });

        this.emit({ type: 'agent:registered', agent });

        console.log(`[Orchestrator] Agent registered: ${agent.name} (${id})`);
        return agent;
    }

    /**
     * Unregister an agent
     */
    unregisterAgent(agentId: string): boolean {
        const agent = this.agents.get(agentId);
        if (!agent) return false;

        this.agents.delete(agentId);
        this.messaging.unregisterAgent(agentId);
        this.context.delete(`agent:${agentId}`);

        this.emit({ type: 'agent:unregistered', agentId });

        console.log(`[Orchestrator] Agent unregistered: ${agent.name} (${agentId})`);
        return true;
    }

    /**
     * Update agent status
     */
    updateAgentStatus(agentId: string, status: AgentStatus): boolean {
        const agent = this.agents.get(agentId);
        if (!agent) return false;

        agent.status = status;
        agent.lastHeartbeat = new Date();

        this.context.set(`agent:${agentId}`, agent, {
            scope: 'global',
            owner: 'orchestrator',
        });

        this.emit({ type: 'agent:status', agentId, status });
        return true;
    }

    /**
     * Get agent by ID
     */
    getAgent(agentId: string): AgentDescriptor | undefined {
        return this.agents.get(agentId);
    }

    /**
     * Get all agents
     */
    getAgents(): AgentDescriptor[] {
        return Array.from(this.agents.values());
    }

    /**
     * Get agents by persona
     */
    getAgentsByPersona(persona: AgentPersona): AgentDescriptor[] {
        return this.getAgents().filter(a => a.persona === persona);
    }

    /**
     * Get agents by status
     */
    getAgentsByStatus(status: AgentStatus): AgentDescriptor[] {
        return this.getAgents().filter(a => a.status === status);
    }

    /**
     * Find agents with a specific capability
     */
    findAgentsByCapability(capability: string): AgentDescriptor[] {
        return this.getAgents().filter(a => a.capabilities.includes(capability));
    }

    // ===========================================================================
    // Task Management
    // ===========================================================================

    /**
     * Create a new task
     */
    createTask(
        name: string,
        description: string,
        options: {
            priority?: number;
            assignTo?: string;
            metadata?: Record<string, unknown>;
        } = {}
    ): Task {
        const task: Task = {
            id: randomUUID(),
            name,
            description,
            status: 'pending',
            priority: options.priority ?? 5,
            createdAt: new Date(),
            assignedTo: options.assignTo,
            metadata: options.metadata,
        };

        this.tasks.set(task.id, task);

        // Store in context
        this.context.set(`task:${task.id}`, task, {
            scope: 'task',
            owner: 'orchestrator',
        });

        this.emit({ type: 'task:created', task });

        // If assigned, notify the agent
        if (task.assignedTo) {
            this.messaging.send(
                'orchestrator',
                task.assignedTo,
                'task:assigned',
                { task },
                { priority: 'high' }
            );
        }

        return task;
    }

    /**
     * Update task status
     */
    updateTaskStatus(
        taskId: string,
        status: TaskStatus,
        result?: unknown,
        error?: string
    ): boolean {
        const task = this.tasks.get(taskId);
        if (!task) return false;

        task.status = status;

        if (status === 'in_progress' && !task.startedAt) {
            task.startedAt = new Date();
        }

        if (status === 'completed' || status === 'failed') {
            task.completedAt = new Date();
            task.result = result;
            task.error = error;

            // Store completion in knowledge graph
            if (status === 'completed' && task.assignedTo) {
                this.knowledge.storeTaskCompletion(
                    task.id,
                    task.name,
                    result,
                    task.assignedTo
                );
            }
        }

        this.context.set(`task:${taskId}`, task, {
            scope: 'task',
            owner: 'orchestrator',
        });

        this.emit({ type: 'task:status', taskId, status });
        return true;
    }

    /**
     * Get task by ID
     */
    getTask(taskId: string): Task | undefined {
        return this.tasks.get(taskId);
    }

    /**
     * Get all tasks
     */
    getTasks(): Task[] {
        return Array.from(this.tasks.values());
    }

    /**
     * Assign task to best available agent
     */
    async assignTask(taskId: string, preferredPersona?: AgentPersona): Promise<string | null> {
        const task = this.tasks.get(taskId);
        if (!task) return null;

        // Find idle agents, preferring the specified persona
        let candidates = this.getAgentsByStatus('idle');

        if (preferredPersona) {
            const personaMatch = candidates.filter(a => a.persona === preferredPersona);
            if (personaMatch.length > 0) {
                candidates = personaMatch;
            }
        }

        if (candidates.length === 0) return null;

        // Pick the first available agent
        const agent = candidates[0];
        task.assignedTo = agent.id;
        this.updateAgentStatus(agent.id, 'busy');

        // Notify agent
        this.messaging.send(
            'orchestrator',
            agent.id,
            'task:assigned',
            { task },
            { priority: 'high' }
        );

        return agent.id;
    }

    // ===========================================================================
    // Knowledge Integration
    // ===========================================================================

    /**
     * Store an insight from an agent
     */
    async storeInsight(
        agentId: string,
        insight: string,
        category: string
    ): Promise<boolean> {
        const agent = this.agents.get(agentId);
        if (!agent) return false;

        const success = await this.knowledge.storeInsight(
            agentId,
            insight,
            category,
            {
                agentName: agent.name,
                agentPersona: agent.persona,
            }
        );

        if (success) {
            // Also store in shared context for immediate access
            this.context.set(`insight:${randomUUID()}`, {
                agentId,
                insight,
                category,
                timestamp: new Date().toISOString(),
            }, {
                scope: 'global',
                owner: agentId,
            });
        }

        return success;
    }

    /**
     * Search knowledge graph
     */
    async searchKnowledge(query: string) {
        return this.knowledge.search(query);
    }

    // ===========================================================================
    // Event System
    // ===========================================================================

    /**
     * Subscribe to orchestrator events
     */
    on(handler: EventHandler): () => void {
        this.eventHandlers.add(handler);
        return () => this.eventHandlers.delete(handler);
    }

    /**
     * Emit an event to all handlers
     */
    private emit(event: OrchestratorEvent): void {
        for (const handler of Array.from(this.eventHandlers)) {
            try {
                handler(event);
            } catch (error) {
                console.error('[Orchestrator] Event handler error:', error);
            }
        }
    }

    // ===========================================================================
    // Heartbeat Monitoring
    // ===========================================================================

    /**
     * Start heartbeat monitoring
     */
    private startHeartbeatMonitor(): void {
        const interval = this.config.agents?.heartbeatInterval ?? 30000;
        const threshold = this.config.agents?.offlineThreshold ?? 90000;

        this.heartbeatInterval = setInterval(() => {
            const now = Date.now();

            for (const agent of Array.from(this.agents.values())) {
                if (agent.status !== 'offline') {
                    const lastBeat = agent.lastHeartbeat.getTime();
                    if (now - lastBeat > threshold) {
                        this.updateAgentStatus(agent.id, 'offline');
                        console.log(`[Orchestrator] Agent offline: ${agent.name}`);
                    }
                }
            }
        }, interval);
    }

    /**
     * Record heartbeat from agent
     */
    heartbeat(agentId: string): boolean {
        const agent = this.agents.get(agentId);
        if (!agent) return false;

        agent.lastHeartbeat = new Date();

        // If was offline, mark as idle
        if (agent.status === 'offline') {
            this.updateAgentStatus(agentId, 'idle');
        }

        return true;
    }

    // ===========================================================================
    // Utility Methods
    // ===========================================================================

    /**
     * Get orchestrator instance ID
     */
    getInstanceId(): string {
        return this.instanceId;
    }

    /**
     * Get orchestrator statistics
     */
    stats(): {
        instanceId: string;
        agents: {
            total: number;
            idle: number;
            busy: number;
            offline: number;
        };
        tasks: {
            total: number;
            pending: number;
            inProgress: number;
            completed: number;
            failed: number;
        };
        context: ReturnType<SharedContext['stats']>;
        messaging: ReturnType<AgentMessaging['stats']>;
        knowledge: ReturnType<GraphitiBridge['stats']>;
    } {
        const agents = this.getAgents();
        const tasks = this.getTasks();

        return {
            instanceId: this.instanceId,
            agents: {
                total: agents.length,
                idle: agents.filter(a => a.status === 'idle').length,
                busy: agents.filter(a => a.status === 'busy').length,
                offline: agents.filter(a => a.status === 'offline').length,
            },
            tasks: {
                total: tasks.length,
                pending: tasks.filter(t => t.status === 'pending').length,
                inProgress: tasks.filter(t => t.status === 'in_progress').length,
                completed: tasks.filter(t => t.status === 'completed').length,
                failed: tasks.filter(t => t.status === 'failed').length,
            },
            context: this.context.stats(),
            messaging: this.messaging.stats(),
            knowledge: this.knowledge.stats(),
        };
    }
}

// Export a factory function for convenience
export function createOrchestrator(config?: Partial<OrchestratorConfig>): AgentOrchestrator {
    return new AgentOrchestrator(config);
}
