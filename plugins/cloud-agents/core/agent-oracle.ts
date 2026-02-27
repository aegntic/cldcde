/**
 * Auto-Agent Core: Multiplatform Autonomous Agent System
 * Inspired by Cursor's long-running agents and multi-agent parallelism
 *
 * Platforms: Claude Code, Agent-Zero, OpenCode, OpenClaw
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type Platform = 'claude-code' | 'agent-zero' | 'opencode' | 'openclaw';
export type AgentRole = 'architect' | 'frontend' | 'backend' | 'testing' | 'docs' | 'security' | 'devops' | 'general';
export type AgentStatus = 'idle' | 'planning' | 'executing' | 'waiting_approval' | 'error' | 'completed';
export type ApprovalMode = 'auto' | 'manual' | 'hybrid';
export type ExecutionStrategy = 'race' | 'consensus' | 'specialized' | 'sequential';

export interface AgentConfig {
  id: string;
  role: AgentRole;
  platform: Platform;
  maxRetries: number;
  timeoutMs: number;
  approvalMode: ApprovalMode;
  checkpointIntervalMs: number;
}

export interface Task {
  id: string;
  description: string;
  plan?: ExecutionPlan;
  status: 'pending' | 'planned' | 'executing' | 'completed' | 'failed';
  assignedAgents: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
}

export interface ExecutionPlan {
  id: string;
  taskId: string;
  steps: PlanStep[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  riskLevel: 'safe' | 'moderate' | 'risky';
  requiresApproval: boolean;
  approvalReason?: string;
}

export interface PlanStep {
  id: string;
  description: string;
  type: 'file_create' | 'file_edit' | 'file_delete' | 'command' | 'test' | 'git' | 'deploy';
  target?: string;
  command?: string;
  dependencies: string[];
  rollback?: () => Promise<void>;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'rolled_back';
}

export interface AgentState {
  id: string;
  config: AgentConfig;
  status: AgentStatus;
  currentTask?: string;
  currentStep?: string;
  errorCount: number;
  lastCheckpoint: Date;
  memory: AgentMemory;
}

export interface AgentMemory {
  shortTerm: Map<string, unknown>;
  longTerm: Map<string, unknown>;
  patterns: LearnedPattern[];
}

export interface LearnedPattern {
  id: string;
  type: 'error_fix' | 'optimization' | 'workflow';
  pattern: string;
  solution: string;
  successRate: number;
  usageCount: number;
}

export interface Checkpoint {
  id: string;
  agentId: string;
  taskId: string;
  timestamp: Date;
  state: AgentState;
  files: Map<string, string>;
  gitRef?: string;
}

// ============================================================================
// PLATFORM ADAPTERS
// ============================================================================

export interface PlatformAdapter {
  name: Platform;
  initialize(): Promise<void>;
  executeCommand(command: string, args: string[]): Promise<CommandResult>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  createCheckpoint(state: AgentState): Promise<Checkpoint>;
  restoreCheckpoint(checkpoint: Checkpoint): Promise<void>;
  getMemory(): Promise<AgentMemory>;
  setMemory(memory: AgentMemory): Promise<void>;
  notifyApproval(plan: ExecutionPlan): Promise<boolean>;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

// ============================================================================
// CORE AGENT CLASS
// ============================================================================

export class AutonomousAgent {
  private state: AgentState;
  private adapter: PlatformAdapter;
  private checkpoints: Checkpoint[] = [];
  private errorLoopDetector: ErrorLoopDetector;
  private planGenerator: PlanGenerator;

  constructor(config: AgentConfig, adapter: PlatformAdapter) {
    this.state = {
      id: config.id,
      config,
      status: 'idle',
      errorCount: 0,
      lastCheckpoint: new Date(),
      memory: {
        shortTerm: new Map(),
        longTerm: new Map(),
        patterns: []
      }
    };
    this.adapter = adapter;
    this.errorLoopDetector = new ErrorLoopDetector();
    this.planGenerator = new PlanGenerator();
  }

  /**
   * Main execution loop - Cursor's "plan-first" approach
   */
  async execute(task: Task): Promise<void> {
    this.state.status = 'planning';
    this.state.currentTask = task.id;

    // Phase 1: Generate execution plan
    const plan = await this.planGenerator.generate(task, this.state.memory);
    task.plan = plan;

    // Phase 2: Get approval if required
    if (plan.requiresApproval && this.state.config.approvalMode !== 'auto') {
      this.state.status = 'waiting_approval';
      const approved = await this.adapter.notifyApproval(plan);
      if (!approved) {
        this.state.status = 'idle';
        return;
      }
    }

    // Phase 3: Execute plan steps
    this.state.status = 'executing';
    for (const step of plan.steps) {
      await this.executeStep(step, task);
    }

    this.state.status = 'completed';
  }

  private async executeStep(step: PlanStep, task: Task): Promise<void> {
    this.state.currentStep = step.id;

    try {
      step.status = 'executing';

      switch (step.type) {
        case 'file_create':
        case 'file_edit':
          await this.adapter.writeFile(step.target!, step.command!);
          break;
        case 'file_delete':
          await this.adapter.deleteFile(step.target!);
          break;
        case 'command':
          const result = await this.adapter.executeCommand(step.command!, []);
          if (result.exitCode !== 0) {
            throw new Error(`Command failed: ${result.stderr}`);
          }
          break;
        case 'test':
          await this.runTest(step);
          break;
        case 'git':
          await this.executeGitOperation(step);
          break;
      }

      step.status = 'completed';
      this.state.errorCount = 0;

      // Create checkpoint periodically
      if (this.shouldCheckpoint()) {
        await this.createCheckpoint();
      }

    } catch (error) {
      step.status = 'failed';
      this.state.errorCount++;

      // Check for error loops
      const isLoop = this.errorLoopDetector.detect(error as Error, this.state);
      if (isLoop) {
        await this.handleLoop(step, error as Error);
      } else {
        await this.handleError(step, error as Error);
      }
    }
  }

  private shouldCheckpoint(): boolean {
    const elapsed = Date.now() - this.state.lastCheckpoint.getTime();
    return elapsed >= this.state.config.checkpointIntervalMs;
  }

  private async createCheckpoint(): Promise<void> {
    const checkpoint = await this.adapter.createCheckpoint(this.state);
    this.checkpoints.push(checkpoint);
    this.state.lastCheckpoint = new Date();
  }

  private async handleLoop(step: PlanStep, error: Error): Promise<void> {
    // Try to apply learned patterns
    const patterns = this.state.memory.patterns.filter(
      p => p.type === 'error_fix' && this.matchesPattern(error, p.pattern)
    );

    for (const pattern of patterns.sort((a, b) => b.successRate - a.successRate)) {
      try {
        await this.applyPattern(pattern);
        step.status = 'completed';
        return;
      } catch {
        pattern.successRate *= 0.9; // Reduce confidence
        continue;
      }
    }

    // Escalate to human if patterns don't work
    this.state.status = 'waiting_approval';
    const decision = await this.requestHumanIntervention(step, error);
    if (decision.action === 'rollback') {
      await this.rollbackToLastCheckpoint();
    }
  }

  private async handleError(step: PlanStep, error: Error): Promise<void> {
    if (this.state.errorCount >= this.state.config.maxRetries) {
      await this.handleLoop(step, error);
      return;
    }

    // Wait with exponential backoff
    const delay = Math.pow(2, this.state.errorCount) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Retry the step
    await this.executeStep(step, { id: this.state.currentTask!, description: '' } as Task);
  }

  private async rollbackToLastCheckpoint(): Promise<void> {
    const checkpoint = this.checkpoints[this.checkpoints.length - 1];
    if (checkpoint) {
      await this.adapter.restoreCheckpoint(checkpoint);
    }
  }

  private matchesPattern(error: Error, pattern: string): boolean {
    return error.message.includes(pattern) || error.name === pattern;
  }

  private async applyPattern(pattern: LearnedPattern): Promise<void> {
    // Execute the learned solution
    await this.adapter.executeCommand('sh', ['-c', pattern.solution]);
    pattern.usageCount++;
    pattern.successRate = Math.min(1, pattern.successRate + 0.05);
  }

  private async requestHumanIntervention(step: PlanStep, error: Error): Promise<{ action: 'continue' | 'rollback' | 'skip' }> {
    // This would integrate with the platform's notification system
    return { action: 'rollback' };
  }

  private async runTest(step: PlanStep): Promise<void> {
    const result = await this.adapter.executeCommand('npm', ['test', '--', step.target || '']);
    if (result.exitCode !== 0) {
      throw new Error(`Test failed: ${result.stdout}`);
    }
  }

  private async executeGitOperation(step: PlanStep): Promise<void> {
    const [cmd, ...args] = (step.command || '').split(' ');
    const result = await this.adapter.executeCommand('git', [cmd, ...args]);
    if (result.exitCode !== 0) {
      throw new Error(`Git operation failed: ${result.stderr}`);
    }
  }
}

// ============================================================================
// MULTI-AGENT ORCHESTRATOR
// ============================================================================

export class MultiAgentOrchestrator {
  private agents: Map<string, AutonomousAgent> = new Map();
  private maxAgents: number;
  private strategy: ExecutionStrategy;

  constructor(maxAgents: number = 8, strategy: ExecutionStrategy = 'specialized') {
    this.maxAgents = maxAgents;
    this.strategy = strategy;
  }

  /**
   * Execute task with multiple agents in parallel (Cursor's multi-agent approach)
   */
  async executeParallel(task: Task, roles: AgentRole[]): Promise<Map<string, unknown>> {
    const results = new Map<string, unknown>();
    const agentPromises: Promise<void>[] = [];

    // Spawn agents based on strategy
    const agentConfigs = this.assignRoles(roles);

    for (const config of agentConfigs) {
      const adapter = this.createAdapter(config.platform);
      const agent = new AutonomousAgent(config, adapter);
      this.agents.set(config.id, agent);

      agentPromises.push(agent.execute(task));
    }

    // Wait for all agents based on strategy
    switch (this.strategy) {
      case 'race':
        // First to complete wins
        return await this.raceExecution(agentPromises);

      case 'consensus':
        // All must agree on result
        return await this.consensusExecution(agentPromises);

      case 'specialized':
        // Each agent handles their specialty, results merged
        await Promise.all(agentPromises);
        return this.mergeSpecializedResults();

      default:
        await Promise.all(agentPromises);
        return results;
    }
  }

  private assignRoles(roles: AgentRole[]): AgentConfig[] {
    return roles.slice(0, this.maxAgents).map((role, index) => ({
      id: `agent-${role}-${index}`,
      role,
      platform: this.selectPlatformForRole(role),
      maxRetries: 3,
      timeoutMs: 3600000, // 1 hour
      approvalMode: 'hybrid' as ApprovalMode,
      checkpointIntervalMs: 900000 // 15 minutes
    }));
  }

  private selectPlatformForRole(role: AgentRole): Platform {
    const platformMap: Record<AgentRole, Platform> = {
      architect: 'claude-code',
      frontend: 'claude-code',
      backend: 'agent-zero',
      testing: 'opencode',
      docs: 'claude-code',
      security: 'openclaw',
      devops: 'agent-zero',
      general: 'claude-code'
    };
    return platformMap[role];
  }

  private createAdapter(platform: Platform): PlatformAdapter {
    // Factory method to create platform-specific adapters
    switch (platform) {
      case 'claude-code':
        return new ClaudeCodeAdapter();
      case 'agent-zero':
        return new AgentZeroAdapter();
      case 'opencode':
        return new OpenCodeAdapter();
      case 'openclaw':
        return new OpenClawAdapter();
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  }

  private async raceExecution(promises: Promise<void>[]): Promise<Map<string, unknown>> {
    return new Promise((resolve) => {
      let completed = false;
      for (const promise of promises) {
        promise.then(() => {
          if (!completed) {
            completed = true;
            resolve(this.mergeSpecializedResults());
          }
        });
      }
    });
  }

  private async consensusExecution(promises: Promise<void>[]): Promise<Map<string, unknown>> {
    await Promise.all(promises);
    // Implement consensus logic here
    return this.mergeSpecializedResults();
  }

  private mergeSpecializedResults(): Map<string, unknown> {
    const merged = new Map<string, unknown>();
    // Merge results from all specialized agents
    return merged;
  }
}

// ============================================================================
// ERROR LOOP DETECTOR
// ============================================================================

export class ErrorLoopDetector {
  private errorHistory: Array<{ error: Error; timestamp: Date }> = [];
  private readonly windowSize = 5;
  private readonly similarityThreshold = 0.8;

  detect(error: Error, state: AgentState): boolean {
    this.errorHistory.push({ error, timestamp: new Date() });

    // Keep only recent errors
    if (this.errorHistory.length > this.windowSize) {
      this.errorHistory.shift();
    }

    // Check for repeating patterns
    const similarCount = this.errorHistory.filter(e =>
      this.calculateSimilarity(e.error.message, error.message) > this.similarityThreshold
    ).length;

    return similarCount >= 3;
  }

  private calculateSimilarity(a: string, b: string): number {
    // Simple Jaccard similarity on words
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);
    return intersection.size / union.size;
  }
}

// ============================================================================
// PLAN GENERATOR
// ============================================================================

export class PlanGenerator {
  async generate(task: Task, memory: AgentMemory): Promise<ExecutionPlan> {
    const steps: PlanStep[] = [];

    // Analyze task and generate steps
    // This is a simplified version - real implementation would use AI
    const taskLower = task.description.toLowerCase();

    if (taskLower.includes('create') || taskLower.includes('add')) {
      steps.push(this.createFileStep(task));
    }

    if (taskLower.includes('test')) {
      steps.push(this.createTestStep(task));
    }

    if (taskLower.includes('deploy')) {
      steps.push(this.createDeployStep(task));
    }

    // Check memory for learned patterns
    const relevantPatterns = memory.patterns.filter(
      p => task.description.includes(p.pattern)
    );

    for (const pattern of relevantPatterns) {
      steps.push({
        id: `pattern-${pattern.id}`,
        description: `Apply learned pattern: ${pattern.type}`,
        type: 'command',
        command: pattern.solution,
        dependencies: [],
        status: 'pending'
      });
    }

    return {
      id: `plan-${task.id}`,
      taskId: task.id,
      steps,
      estimatedComplexity: this.estimateComplexity(steps),
      riskLevel: this.assessRisk(steps),
      requiresApproval: this.needsApproval(steps)
    };
  }

  private createFileStep(task: Task): PlanStep {
    return {
      id: `step-file-${Date.now()}`,
      description: 'Create/modify files',
      type: 'file_create',
      dependencies: [],
      status: 'pending'
    };
  }

  private createTestStep(task: Task): PlanStep {
    return {
      id: `step-test-${Date.now()}`,
      description: 'Run tests',
      type: 'test',
      dependencies: [],
      status: 'pending'
    };
  }

  private createDeployStep(task: Task): PlanStep {
    return {
      id: `step-deploy-${Date.now()}`,
      description: 'Deploy changes',
      type: 'deploy',
      dependencies: [],
      status: 'pending'
    };
  }

  private estimateComplexity(steps: PlanStep[]): 'low' | 'medium' | 'high' {
    if (steps.length <= 2) return 'low';
    if (steps.length <= 5) return 'medium';
    return 'high';
  }

  private assessRisk(steps: PlanStep[]): 'safe' | 'moderate' | 'risky' {
    const riskyTypes = ['deploy', 'git', 'file_delete'];
    const hasRisky = steps.some(s => riskyTypes.includes(s.type));
    return hasRisky ? 'risky' : 'safe';
  }

  private needsApproval(steps: PlanStep[]): boolean {
    return this.assessRisk(steps) === 'risky';
  }
}

// ============================================================================
// PLATFORM ADAPTER IMPLEMENTATIONS
// ============================================================================

class ClaudeCodeAdapter implements PlatformAdapter {
  name: Platform = 'claude-code';

  async initialize(): Promise<void> {
    // Initialize Claude Code integration
  }

  async executeCommand(command: string, args: string[]): Promise<CommandResult> {
    // Use Bash tool integration
    return { stdout: '', stderr: '', exitCode: 0, duration: 0 };
  }

  async readFile(path: string): Promise<string> {
    // Use Read tool
    return '';
  }

  async writeFile(path: string, content: string): Promise<void> {
    // Use Write tool
  }

  async deleteFile(path: string): Promise<void> {
    // Use Bash rm command
  }

  async createCheckpoint(state: AgentState): Promise<Checkpoint> {
    return {
      id: `checkpoint-${Date.now()}`,
      agentId: state.id,
      taskId: state.currentTask || '',
      timestamp: new Date(),
      state,
      files: new Map()
    };
  }

  async restoreCheckpoint(checkpoint: Checkpoint): Promise<void> {
    // Restore state from checkpoint
  }

  async getMemory(): Promise<AgentMemory> {
    return { shortTerm: new Map(), longTerm: new Map(), patterns: [] };
  }

  async setMemory(memory: AgentMemory): Promise<void> {
    // Persist memory
  }

  async notifyApproval(plan: ExecutionPlan): Promise<boolean> {
    // Request approval through Claude Code UI
    return true;
  }
}

class AgentZeroAdapter implements PlatformAdapter {
  name: Platform = 'agent-zero';

  async initialize(): Promise<void> {}
  async executeCommand(command: string, args: string[]): Promise<CommandResult> {
    return { stdout: '', stderr: '', exitCode: 0, duration: 0 };
  }
  async readFile(path: string): Promise<string> { return ''; }
  async writeFile(path: string, content: string): Promise<void> {}
  async deleteFile(path: string): Promise<void> {}
  async createCheckpoint(state: AgentState): Promise<Checkpoint> {
    return { id: '', agentId: '', taskId: '', timestamp: new Date(), state, files: new Map() };
  }
  async restoreCheckpoint(checkpoint: Checkpoint): Promise<void> {}
  async getMemory(): Promise<AgentMemory> { return { shortTerm: new Map(), longTerm: new Map(), patterns: [] }; }
  async setMemory(memory: AgentMemory): Promise<void> {}
  async notifyApproval(plan: ExecutionPlan): Promise<boolean> { return true; }
}

class OpenCodeAdapter implements PlatformAdapter {
  name: Platform = 'opencode';

  async initialize(): Promise<void> {}
  async executeCommand(command: string, args: string[]): Promise<CommandResult> {
    return { stdout: '', stderr: '', exitCode: 0, duration: 0 };
  }
  async readFile(path: string): Promise<string> { return ''; }
  async writeFile(path: string, content: string): Promise<void> {}
  async deleteFile(path: string): Promise<void> {}
  async createCheckpoint(state: AgentState): Promise<Checkpoint> {
    return { id: '', agentId: '', taskId: '', timestamp: new Date(), state, files: new Map() };
  }
  async restoreCheckpoint(checkpoint: Checkpoint): Promise<void> {}
  async getMemory(): Promise<AgentMemory> { return { shortTerm: new Map(), longTerm: new Map(), patterns: [] }; }
  async setMemory(memory: AgentMemory): Promise<void> {}
  async notifyApproval(plan: ExecutionPlan): Promise<boolean> { return true; }
}

class OpenClawAdapter implements PlatformAdapter {
  name: Platform = 'openclaw';

  async initialize(): Promise<void> {}
  async executeCommand(command: string, args: string[]): Promise<CommandResult> {
    return { stdout: '', stderr: '', exitCode: 0, duration: 0 };
  }
  async readFile(path: string): Promise<string> { return ''; }
  async writeFile(path: string, content: string): Promise<void> {}
  async deleteFile(path: string): Promise<void> {}
  async createCheckpoint(state: AgentState): Promise<Checkpoint> {
    return { id: '', agentId: '', taskId: '', timestamp: new Date(), state, files: new Map() };
  }
  async restoreCheckpoint(checkpoint: Checkpoint): Promise<void> {}
  async getMemory(): Promise<AgentMemory> { return { shortTerm: new Map(), longTerm: new Map(), patterns: [] }; }
  async setMemory(memory: AgentMemory): Promise<void> {}
  async notifyApproval(plan: ExecutionPlan): Promise<boolean> { return true; }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  AutonomousAgent,
  MultiAgentOrchestrator,
  ErrorLoopDetector,
  PlanGenerator
};
