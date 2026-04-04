/**
 * Agent Orchestration Layer
 * Unified agent coordination with shared context, messaging, and Graphiti knowledge graph
 */

// Core orchestrator
export { AgentOrchestrator, createOrchestrator } from './orchestrator';

// Subsystems
export { SharedContext, NamespacedContext } from './shared-context';
export { AgentMessaging } from './agent-messaging';
export { GraphitiBridge } from './graphiti-bridge';
export { UltraSwarmBridge, createSwarmHooks } from './ultra-swarm-bridge';
export type { SwarmSynthesis, SwarmAgent } from './ultra-swarm-bridge';

// Types
export type {
    // Agent types
    AgentPersona,
    AgentStatus,
    AgentDescriptor,
    AgentRegistration,

    // Messaging types
    MessageType,
    AgentMessage,
    MessageHandler,
    MessageQueue,

    // Context types
    ContextScope,
    ContextEntry,
    ContextSubscription,
    ContextQuery,

    // Knowledge types
    EpisodeSource,
    KnowledgeEpisode,
    KnowledgeEntity,
    KnowledgeFact,
    KnowledgeSearchResult,

    // Task types
    TaskStatus,
    Task,
    TaskQueue,

    // Event types
    OrchestratorEvent,
    EventHandler,

    // Config types
    OrchestratorConfig,
} from './types';

export { DEFAULT_CONFIG } from './types';
