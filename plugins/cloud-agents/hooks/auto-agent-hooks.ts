/**
 * Claude Code Hooks for Auto-Agent System
 *
 * These hooks integrate the autonomous agent and demo recording
 * capabilities into Claude Code's lifecycle events.
 *
 * Installation: Add to your .claude/settings.json hooks configuration
 */

import { AutoDemoSystem } from '../index';

// Global demo recorder instance
let autoDemo: AutoDemoSystem | null = null;
let recordingEnabled = false;

/**
 * Pre-Task Hook: Initialize recording before task execution
 *
 * Add to settings.json:
 * "hooks": {
 *   "PreTask": "node /path/to/hooks/auto-agent-hooks.js pre-task"
 * }
 */
export async function preTaskHook(context: {
  task: string;
  platform: string;
  config?: Record<string, unknown>;
}): Promise<void> {
  // Check if auto-demo is enabled
  if (context.config?.['autoDemo'] === true) {
    autoDemo = new AutoDemoSystem('claude-code');
    autoDemo.startRecording({
      name: context.task.slice(0, 50),
      format: 'walkthrough',
      style: 'tutorial',
      captureTerminal: true
    });
    recordingEnabled = true;
    console.log('[Auto-Agent] Recording started for task:', context.task);
  }
}

/**
 * Post-Task Hook: Finalize recording and export demo
 *
 * Add to settings.json:
 * "hooks": {
 *   "PostTask": "node /path/to/hooks/auto-agent-hooks.js post-task"
 * }
 */
export async function postTaskHook(context: {
  task: string;
  success: boolean;
  duration: number;
  config?: Record<string, unknown>;
}): Promise<void> {
  if (autoDemo && recordingEnabled) {
    const demo = autoDemo.stopRecording();

    if (demo && context.config?.['autoExport']) {
      const format = context.config['exportFormat'] || 'html';
      await autoDemo.export(demo, {
        format: format as 'html' | 'reveal' | 'pdf',
        outputPath: context.config['outputPath'] as string || './demos'
      });
      console.log('[Auto-Agent] Demo exported:', demo.config.name);
    }
  }

  autoDemo = null;
  recordingEnabled = false;
}

/**
 * Pre-Edit Hook: Record file changes before they happen
 *
 * Add to settings.json:
 * "hooks": {
 *   "PreEdit": "node /path/to/hooks/auto-agent-hooks.js pre-edit"
 * }
 */
export async function preEditHook(context: {
  file: string;
  operation: 'create' | 'edit' | 'delete';
  content?: string;
}): Promise<string | null> {
  if (autoDemo && recordingEnabled) {
    // Read current file content for comparison
    // This will be passed to post-edit hook
    return context.content || null;
  }
  return null;
}

/**
 * Post-Edit Hook: Record file changes after they happen
 *
 * Add to settings.json:
 * "hooks": {
 *   "PostEdit": "node /path/to/hooks/auto-agent-hooks.js post-edit"
 * }
 */
export async function postEditHook(context: {
  file: string;
  operation: 'create' | 'edit' | 'delete';
  beforeContent?: string;
  afterContent?: string;
}): Promise<void> {
  if (autoDemo && recordingEnabled) {
    autoDemo.recordAction(
      context.operation === 'create' ? 'file_create' :
      context.operation === 'delete' ? 'file_delete' : 'file_edit',
      context.file,
      {
        before: context.beforeContent,
        after: context.afterContent
      }
    );
  }
}

/**
 * Command Execution Hook: Record terminal commands
 *
 * Usage: Call this from custom command wrappers
 */
export async function recordCommand(command: string, output: string): Promise<void> {
  if (autoDemo && recordingEnabled) {
    autoDemo.recordAction('command', 'terminal', { command, output });
  }
}

/**
 * Test Result Hook: Record test outcomes
 */
export async function recordTest(testName: string, passed: boolean, output: string): Promise<void> {
  if (autoDemo && recordingEnabled) {
    autoDemo.recordAction('test', testName, {
      command: passed ? 'PASS' : 'FAIL',
      output
    });
  }
}

/**
 * Git Hook: Record git operations
 */
export async function recordGit(command: string, output: string): Promise<void> {
  if (autoDemo && recordingEnabled) {
    autoDemo.recordAction('git', 'git', { command, output });
  }
}

/**
 * Add Explanation: Add context to the current action
 */
export async function addExplanation(explanation: string): Promise<void> {
  if (autoDemo && recordingEnabled) {
    autoDemo.explain(explanation);
  }
}

// CLI entry point for hooks
if (typeof process !== 'undefined' && process.argv.length > 2) {
  const hookType = process.argv[2];
  const context = JSON.parse(process.argv[3] || '{}');

  switch (hookType) {
    case 'pre-task':
      preTaskHook(context).catch(console.error);
      break;
    case 'post-task':
      postTaskHook(context).catch(console.error);
      break;
    case 'pre-edit':
      preEditHook(context).catch(console.error);
      break;
    case 'post-edit':
      postEditHook(context).catch(console.error);
      break;
  }
}

export default {
  preTaskHook,
  postTaskHook,
  preEditHook,
  postEditHook,
  recordCommand,
  recordTest,
  recordGit,
  addExplanation
};
