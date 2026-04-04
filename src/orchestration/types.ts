/**
 * Agent Orchestration Layer - Type Definitions
 * Shared types for agent coordination, messaging, and knowledge graph integration
 */

// ============================================================================
// Agent Types
// ============================================================================

export type AgentPersona =
    | 'architect'
    | 'frontend'
    | 'backend'
    | 'security'
    | 'performance'
    | 'analyzer'
    | 'qa'
    | 'refactorer'
    | 'devops'
    | 'mentor'
    | 'scribe'
    | 'general';

export type AgentStatus = 'idle' | 'busy' | 'offline';

export interface AgentDescriptor {
    id: string;
    name: string;
    persona: AgentPersona;
    capabilities: string[];
    status: AgentStatus;
    registeredAt: Date;
    lastHeartbeat: Date;
    metadata?: Record<string, unknown>;
}

export interface AgentRegistration {
    name: string;
    persona: AgentPersona;
    capabilities: string[];
    metadata?: Record<string, unknown>;
}

// ============================================================================
// Messaging Types
// ============================================================================

export type MessageType = 'request' | 'response' | 'notification' | 'broadcast';

export interface AgentMessage {
    id: string;
    from: string;
    to: string | 'broadcast';
    type: MessageType;
    topic: string;
    payload: unknown;
    timestamp: Date;
    replyTo?: string;
    ttl?: number;
    priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface MessageHandler {
    topic: string;
    handler: (message: AgentMessage) => Promise<void>;
}

export interface MessageQueue {
    agentId: string;
    messages: AgentMessage[];
    maxSize: number;
}

// ============================================================================
// Shared Context Types
// ============================================================================

export type ContextScope = 'global' | 'task' | 'agent' | 'session';

export interface ContextEntry {
    key: string;
    value: unknown;
    scope: ContextScope;
    owner: string;
    createdAt: Date;
    updatedAt: Date;
    ttl?: number;
    metadata?: Record<string, unknown>;
}

export interface ContextSubscription {
    id: string;
    pattern: string;
    scope: ContextScope;
    callback: (entry: ContextEntry, event: 'set' | 'delete') => void;
}

export interface ContextQuery {
    pattern?: string;
    scope?: ContextScope;
    owner?: string;
    limit?: number;
}

// ============================================================================
// Knowledge Graph Types (Graphiti Integration)
// ============================================================================

export type EpisodeSource = 'agent' | 'user' | 'system' | 'swarm';

export interface KnowledgeEpisode {
    name: string;
    content: string;
    source: EpisodeSource;
    groupId: string;
    sourceDescription?: string;
    metadata?: Record<string, unknown>;
}

export interface KnowledgeEntity {
    uuid: string;
    name: string;
    summary: string;
    labels: string[];
    groupId: string;
    createdAt: Date;
    attributes?: Record<string, unknown>;
}

export interface KnowledgeFact {
    uuid: string;
    name: string;
    fact: string;
    sourceUuid: string;
    targetUuid: string;
    validAt?: Date;
    invalidAt?: Date;
    confidence?: number;
}

export interface KnowledgeSearchResult {
    entities: KnowledgeEntity[];
    facts: KnowledgeFact[];
    episodes?: Array<{
        uuid: string;
        name: string;
        content: string;
        source: string;
        createdAt: Date;
    }>;
}

// ============================================================================
// Task Types
// ============================================================================

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface Task {
    id: string;
    name: string;
    description: string;
    assignedTo?: string;
    status: TaskStatus;
    priority: number;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    result?: unknown;
    error?: string;
    metadata?: Record<string, unknown>;
}

export interface TaskQueue {
    pending: Task[];
    inProgress: Task[];
    completed: Task[];
}

// ============================================================================
// Orchestrator Events
// ============================================================================

export type OrchestratorEvent =
    | { type: 'agent:registered'; agent: AgentDescriptor }
    | { type: 'agent:unregistered'; agentId: string }
    | { type: 'agent:status'; agentId: string; status: AgentStatus }
    | { type: 'message:sent'; message: AgentMessage }
    | { type: 'message:delivered'; messageId: string; to: string }
    | { type: 'context:updated'; entry: ContextEntry; event: 'set' | 'delete' }
    | { type: 'task:created'; task: Task }
    | { type: 'task:status'; taskId: string; status: TaskStatus }
    | { type: 'knowledge:added'; episode: KnowledgeEpisode };

export type EventHandler = (event: OrchestratorEvent) => void;

// ============================================================================
// Configuration
// ============================================================================

export interface OrchestratorConfig {
    /** Unique identifier for this orchestrator instance */
    instanceId?: string;

    /** Graphiti MCP server configuration */
    graphiti?: {
        enabled: boolean;
        groupId: string;
        neo4jUri?: string;
        neo4jUser?: string;
        neo4jPassword?: string;
    };

    /** Context persistence settings */
    context?: {
        persistToGraphiti: boolean;
        defaultTtl?: number;
        maxEntriesPerScope?: number;
    };

    /** Messaging settings */
    messaging?: {
        maxQueueSize: number;
        messageTtl: number;
        deliveryRetries: number;
    };

    /** Agent management settings */
    agents?: {
        heartbeatInterval: number;
        offlineThreshold: number;
    };
}

export const DEFAULT_CONFIG: OrchestratorConfig = {
    graphiti: {
        enabled: true,
        groupId: 'aegntic-orchestration',
    },
    context: {
        persistToGraphiti: true,
        defaultTtl: 3600000, // 1 hour
        maxEntriesPerScope: 1000,
    },
    messaging: {
        maxQueueSize: 100,
        messageTtl: 300000, // 5 minutes
        deliveryRetries: 3,
    },
    agents: {
        heartbeatInterval: 30000, // 30 seconds
        offlineThreshold: 90000, // 90 seconds
    },
};
