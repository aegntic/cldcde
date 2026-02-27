/**
 * Multiplatform Autonomous Agent System
 * Unified entry point for Claude Code, Agent-Zero, OpenCode, OpenClaw
 *
 * Features:
 * - Cloud Agents with Computer Use (Cursor-inspired)
 * - Isolated sandbox/VM execution with automatic video recording
 * - Long-running autonomous agents
 * - Multi-agent parallelism (up to 8 agents)
 * - Plan-first execution with approval workflow
 * - Automatic demo generation and recording
 * - Automatic VIDEO generation from coding sessions
 * - Error loop detection and self-healing
 * - Cross-platform synchronization
 */

export * from './core/agent-oracle';
export * from './core/auto-demo-engine';
export * from './core/video-generator';
export * from './core/video-renderer';
export * from './core/cloud-agent';

// Re-export main classes - Autonomous Agents
export { AutonomousAgent, MultiAgentOrchestrator } from './core/agent-oracle';

// Re-export main classes - Demo System
export { AutoDemoSystem, DemoRecorder, DemoGenerator, DemoExporter } from './core/auto-demo-engine';

// Re-export main classes - Video Generation
export {
  VideoRenderer,
  ScreenCaptureRecorder,
  renderDemoVideo,
  DemoVideoComposition,
  TypingCode,
  TerminalAnimation,
  IntroSequence,
  OutroSequence,
  buildVideoConfig,
  createCodeStep,
  createTerminalStep
} from './core/video-generator';

// Re-export main classes - Cloud Agents (Cursor Computer Use)
export {
  CloudAgent,
  CloudAgentOrchestrator,
  runCloudAgent,
  type CloudAgentConfig,
  type CloudAgentState,
  type Artifact,
  type SandboxConfig,
  type RecordingConfig,
  type BrowserAction,
  type DesktopAction
} from './core/cloud-agent';

// Platform detection
export type Platform = 'claude-code' | 'agent-zero' | 'opencode' | 'openclaw';

export function detectPlatform(): Platform {
  // Check environment variables and global objects
  if (typeof process !== 'undefined') {
    if (process.env.CLAUDE_CODE === 'true') return 'claude-code';
    if (process.env.AGENT_ZERO === 'true') return 'agent-zero';
    if (process.env.OPENCODE === 'true') return 'opencode';
    if (process.env.OPENCLAW === 'true') return 'openclaw';
  }

  // Default to claude-code
  return 'claude-code';
}

// Quick start function
export async function createAutoAgent(config?: {
  maxAgents?: number;
  strategy?: 'race' | 'consensus' | 'specialized';
  platform?: Platform;
}) {
  const { MultiAgentOrchestrator } = await import('./core/agent-oracle');
  const platform = config?.platform || detectPlatform();

  return new MultiAgentOrchestrator(
    config?.maxAgents || 8,
    config?.strategy || 'specialized'
  );
}

export async function createAutoDemo(config?: {
  platform?: Platform;
}) {
  const { AutoDemoSystem } = await import('./core/auto-demo-engine');
  const platform = config?.platform || detectPlatform();

  return new AutoDemoSystem(platform);
}

// Version info
export const VERSION = '1.0.0';
export const FEATURES = [
  'long-running-agents',
  'multi-agent-parallelism',
  'plan-first-execution',
  'terminal-automation',
  'error-loop-detection',
  'self-healing-code',
  'demo-recording',
  'demo-generation',
  'multi-export-formats',
  'cross-platform-sync'
];
