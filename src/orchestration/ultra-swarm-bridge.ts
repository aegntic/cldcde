/**
 * Ultra Swarm Integration Bridge
 * Connects Ultra Swarm orchestrator with the unified orchestration layer
 */

import type { AgentOrchestrator } from './orchestrator';
import type { KnowledgeEpisode } from './types';

export interface SwarmSynthesis {
    swarmId: string;
    workflowId: string;
    totalAgents: number;
    successfulAgents: number;
    failedAgents: number;
    successRate: number;
    insights: string[];
    recommendations: string[];
    riskAssessment: {
        overall: string;
        technical: string;
        operational: string;
        strategic: string;
        mitigation: string[];
    };
    nextSteps: string[];
    framework: string;
    timestamp: string;
}

export interface SwarmAgent {
    agentId: string;
    type: string;
    task: string;
    status: 'running' | 'completed' | 'failed';
    insights: string[];
    confidence: number;
    framework: string;
    timestamp: string;
}

export class UltraSwarmBridge {
    private orchestrator: AgentOrchestrator;
    private activeSwarms: Map<string, {
        swarmId: string;
        startTime: Date;
        agents: SwarmAgent[];
    }> = new Map();

    constructor(orchestrator: AgentOrchestrator) {
        this.orchestrator = orchestrator;
    }

    // ===========================================================================
    // Swarm Lifecycle
    // ===========================================================================

    /**
     * Called when a new swarm starts
     */
    async onSwarmStart(swarmId: string, config: {
        agentCount: number;
        task: string;
        framework: string;
        parallel: boolean;
    }): Promise<void> {
        this.activeSwarms.set(swarmId, {
            swarmId,
            startTime: new Date(),
            agents: [],
        });

        // Store swarm start in shared context
        this.orchestrator.context.set(`swarm:${swarmId}`, {
            status: 'running',
            config,
            startTime: new Date().toISOString(),
        }, {
            scope: 'global',
            owner: 'ultra-swarm',
        });

        // Add to knowledge graph
        await this.orchestrator.knowledge.addEpisode({
            name: `Swarm Started: ${swarmId}`,
            content: `Ultra Swarm initiated with ${config.agentCount} agents for task: ${config.task}`,
            source: 'swarm',
            groupId: this.orchestrator.knowledge['config'].groupId,
            metadata: {
                swarmId,
                agentCount: config.agentCount,
                framework: config.framework,
                parallel: config.parallel,
            },
        });

        // Broadcast to any listening agents
        this.orchestrator.messaging.send(
            'ultra-swarm',
            'broadcast',
            'swarm:started',
            { swarmId, config },
            { priority: 'high' }
        );
    }

    /**
     * Called when an agent in the swarm completes
     */
    async onAgentComplete(swarmId: string, agent: SwarmAgent): Promise<void> {
        const swarm = this.activeSwarms.get(swarmId);
        if (!swarm) return;

        swarm.agents.push(agent);

        // Store individual agent insights
        for (const insight of agent.insights) {
            await this.orchestrator.storeInsight(
                `swarm:${swarmId}:${agent.agentId}`,
                insight,
                agent.type
            );
        }

        // Update swarm context with progress
        const existing = this.orchestrator.context.getValue<Record<string, unknown>>(`swarm:${swarmId}`) || {};
        this.orchestrator.context.set(`swarm:${swarmId}`, {
            ...existing,
            completedAgents: swarm.agents.length,
            lastAgentType: agent.type,
        }, {
            scope: 'global',
            owner: 'ultra-swarm',
        });
    }

    /**
     * Called when the swarm synthesis is complete
     */
    async onSwarmComplete(synthesis: SwarmSynthesis): Promise<void> {
        const swarm = this.activeSwarms.get(synthesis.swarmId);

        // Store synthesis in knowledge graph
        await this.orchestrator.knowledge.storeSwarmSynthesis(synthesis.swarmId, {
            insights: synthesis.insights,
            recommendations: synthesis.recommendations,
            riskAssessment: synthesis.riskAssessment,
        });

        // Update shared context
        this.orchestrator.context.set(`swarm:${synthesis.swarmId}`, {
            status: 'completed',
            synthesis,
            completedAt: new Date().toISOString(),
            duration: swarm ? Date.now() - swarm.startTime.getTime() : 0,
        }, {
            scope: 'global',
            owner: 'ultra-swarm',
        });

        // Store in knowledge graph as episode
        await this.orchestrator.knowledge.addEpisode({
            name: `Swarm Complete: ${synthesis.swarmId}`,
            content: JSON.stringify({
                successRate: synthesis.successRate,
                insights: synthesis.insights,
                recommendations: synthesis.recommendations,
                nextSteps: synthesis.nextSteps,
            }, null, 2),
            source: 'swarm',
            groupId: this.orchestrator.knowledge['config'].groupId,
            metadata: {
                swarmId: synthesis.swarmId,
                workflowId: synthesis.workflowId,
                successRate: synthesis.successRate,
                framework: synthesis.framework,
            },
        });

        // Broadcast completion
        this.orchestrator.messaging.send(
            'ultra-swarm',
            'broadcast',
            'swarm:completed',
            { synthesis },
            { priority: 'high' }
        );

        // Cleanup
        this.activeSwarms.delete(synthesis.swarmId);
    }

    // ===========================================================================
    // Query Methods
    // ===========================================================================

    /**
     * Get active swarms
     */
    getActiveSwarms(): string[] {
        return Array.from(this.activeSwarms.keys());
    }

    /**
     * Get swarm status from context
     */
    getSwarmStatus(swarmId: string): unknown {
        return this.orchestrator.context.getValue(`swarm:${swarmId}`);
    }

    /**
     * Search for swarm insights in knowledge graph
     */
    async searchSwarmInsights(query: string): Promise<unknown> {
        return this.orchestrator.knowledge.search(query);
    }
}

/**
 * Hook to integrate with existing Ultra Swarm orchestrator
 * Add this to the Ultra Swarm's synthesizeResults method
 */
export function createSwarmHooks(bridge: UltraSwarmBridge) {
    return {
        onSwarmStart: (swarmId: string, config: Parameters<typeof bridge.onSwarmStart>[1]) =>
            bridge.onSwarmStart(swarmId, config),

        onAgentComplete: (swarmId: string, agent: SwarmAgent) =>
            bridge.onAgentComplete(swarmId, agent),

        onSwarmComplete: (synthesis: SwarmSynthesis) =>
            bridge.onSwarmComplete(synthesis),
    };
}
