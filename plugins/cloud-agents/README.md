# Multiplatform Autonomous Agent System

A Cursor-inspired autonomous agent system with **Cloud Agents with Computer Use** and **automatic demo VIDEO generation** capabilities, designed to work across **Claude Code**, **Agent-Zero**, **OpenCode**, and **OpenClaw**.

Based on [Cursor's Agent Computer Use](https://cursor.com/blog/agent-computer-use) feature.

## Features

### ☁️ Cloud Agents with Computer Use (Cursor-Inspired)
The flagship feature - agents that run in isolated VMs/sandboxes and can:
- **Isolated Execution**: Run in Docker, E2B, VM, or remote sandboxes
- **Computer Use**: Navigate browsers, click buttons, fill forms, use desktop apps
- **Automatic Video Recording**: Agents record themselves interacting with software they build
- **Artifact Generation**: Produce videos, screenshots, and logs as verification
- **Merge-Ready PRs**: Create PRs with demo artifacts attached
- **Use Cases**:
  - Build features and record testing them
  - Reproduce security vulnerabilities with video proof
  - Quick fixes with visual verification
  - UI testing and interaction demos

### 🎬 Automatic Video Generation
- **Record to Video**: Automatically capture coding sessions and generate MP4 videos
- **Code Typing Animations**: Beautiful typing animations with syntax highlighting
- **Terminal Recording**: Capture terminal commands with realistic output
- **Multiple Styles**: Dark, light, modern, gradient themes
- **Audio Narration**: Optional TTS narration for videos
- **Screen Capture**: Direct screen recording with ffmpeg

### 🤖 Autonomous Agents
- **Long-Running Agents**: Execute tasks autonomously for extended periods (hours to days)
- **Multi-Agent Parallelism**: Up to 8 agents working simultaneously in isolated contexts
- **Plan-First Execution**: Generate execution plans with approval workflow before running
- **Error Loop Detection**: Automatic detection and recovery from repetitive errors
- **Self-Healing Code**: Learn from fix patterns and apply them automatically

### 📼 Auto-Demo Generation
- **Session Recording**: Automatically capture coding sessions with smart filtering
- **Interactive Walkthroughs**: Generate step-by-step code explanations
- **Multiple Export Formats**: HTML, Reveal.js, Marp, Slidev, PDF, **Video (MP4)**, JSON
- **Cross-Platform Sync**: Unified interface across all supported platforms

## Installation

### Claude Code
```bash
# Add to your .claude/settings.json
{
  "skills": ["./autonomous-agents-multiplatform/skills/auto-demo-skill.yaml"],
  "hooks": {
    "PreTask": "node ./autonomous-agents-multiplatform/hooks/auto-agent-hooks.js pre-task",
    "PostTask": "node ./autonomous-agents-multiplatform/hooks/auto-agent-hooks.js post-task",
    "PreEdit": "node ./autonomous-agents-multiplatform/hooks/auto-agent-hooks.js pre-edit",
    "PostEdit": "node ./autonomous-agents-multiplatform/hooks/auto-agent-hooks.js post-edit"
  }
}
```

### Agent-Zero
```bash
pip install auto-agent-multiplatform
```

```python
from auto_agent import AutoDemoSystem

demo = AutoDemoSystem()
demo.start_recording({"name": "My Demo"})
```

### OpenCode
```bash
npm install auto-agent-multiplatform
```

```javascript
const { AutoDemoSystem } = require('auto-agent-multiplatform/opencode');
const demo = new AutoDemoSystem();
demo.startRecording({ name: 'My Demo' });
```

### OpenClaw
```toml
# Cargo.toml
[dependencies]
auto-agent-multiplatform = { version = "1.0.0", features = ["openclaw"] }
```

```rust
use auto_agent_multiplatform::{AutoDemoSystem, RecordingConfig};

let mut demo = AutoDemoSystem::new();
demo.start_recording(RecordingConfig::default());
```

## Quick Start

### Cloud Agents with Computer Use

Run agents in isolated sandboxes that record themselves:

```typescript
import { runCloudAgent, CloudAgentOrchestrator } from 'auto-agent-multiplatform';

// Quick start - run a cloud agent with video recording
const result = await runCloudAgent(
  'Build a login form and test it',
  {
    repo: 'https://github.com/owner/repo',
    branch: 'main',
    createPR: true
  }
);

console.log('Video:', result.videoUrl);
console.log('Screenshots:', result.screenshots);
console.log('Logs:', result.logs);
```

### Full Cloud Agent Example

```typescript
import { CloudAgent, CloudAgentOrchestrator } from 'auto-agent-multiplatform';

const orchestrator = new CloudAgentOrchestrator();

// Create an agent with sandbox and recording config
const agent = orchestrator.createAgent({
  name: 'UI Builder Agent',
  task: 'Build and test a contact form',
  sandbox: {
    type: 'docker',
    resources: { cpu: 2, memory: '4g', disk: '10g' },
    environment: { NODE_ENV: 'development' },
    gitRepo: 'https://github.com/owner/repo'
  },
  recording: {
    enabled: true,
    captureDesktop: true,
    captureBrowser: true,
    captureTerminal: true,
    fps: 30,
    quality: 'high'
  }
});

// Initialize and run
await agent.initialize();

// Agent can use computer - browse, click, type
await agent.browse('http://localhost:3000');
await agent.click('#contact-link');
await agent.type('John Doe', '#name-input');
await agent.screenshot('Filled contact form');

// Execute the main task
const state = await agent.execute('Build and test a contact form');

// Stop and collect artifacts (video, screenshots, logs)
const artifacts = await agent.stop();

// Create a PR with demo artifacts
const prUrl = await agent.createPR(
  'Add contact form',
  'Implemented contact form with validation'
);
```

### Run Multiple Cloud Agents in Parallel

```typescript
// Like Cursor's approach - run multiple agents simultaneously
const orchestrator = new CloudAgentOrchestrator();

const results = await orchestrator.runParallel([
  'Build the frontend login page',
  'Create the backend auth API',
  'Write integration tests',
  'Generate API documentation'
]);

for (const [task, result] of results) {
  console.log(`Task: ${task}`);
  console.log(`  Video: ${result.artifacts.find(a => a.type === 'video')?.url}`);
  console.log(`  Status: ${result.state.status}`);
}
```

### 1. Start Recording a Demo

```bash
# Claude Code
/auto-demo start --name="Building a REST API"

# Or via code
demo.startRecording({
  name: "Building a REST API",
  format: "walkthrough",
  style: "tutorial"
});
```

### 2. Perform Your Actions

The system automatically captures:
- File creates, edits, and deletes
- Terminal commands and their output
- Test runs and results
- Git operations

### 3. Stop and Export

```bash
# Claude Code
/auto-demo stop --export=html

# Or via code
const result = demo.stopRecording();
await demo.export(result, {
  format: 'html',
  outputPath: './demos'
});
```

## Commands Reference

### Cloud Agent Commands

| Command | Description |
|---------|-------------|
| `/cloud-agent start <task>` | Start a cloud agent in isolated sandbox |
| `/cloud-agent parallel <tasks...>` | Run multiple agents in parallel |
| `/cloud-agent status` | Check agent status and artifacts |
| `/cloud-agent stop` | Stop running agent and collect artifacts |
| `/cloud-agent pr` | Create PR with demo video and screenshots |

### Auto-Agent Commands

| Command | Description |
|---------|-------------|
| `/auto-agent init` | Initialize the autonomous agent system |
| `/auto-agent start <task>` | Start autonomous task execution |
| `/auto-agent plan <task>` | Generate execution plan without running |
| `/auto-agent parallel <task>` | Run with multiple agents in parallel |
| `/auto-agent status` | Check current agent status |
| `/auto-agent stop` | Stop running agents |
| `/auto-agent resume` | Resume stopped agents |

### Auto-Demo Commands

| Command | Description |
|---------|-------------|
| `/auto-demo start` | Start recording a demo |
| `/auto-demo stop` | Stop recording |
| `/auto-demo generate <path>` | Generate demo from existing code |
| `/auto-demo walkthrough <task>` | Create interactive walkthrough |
| `/auto-demo export <id>` | Export demo to specified format |

## Configuration

### Global Configuration

```yaml
# auto-agent-config.yaml
auto-agent:
  max_parallel_agents: 8
  default_timeout_hours: 24
  approval_mode: hybrid  # auto, manual, hybrid
  error_retry_limit: 3
  checkpoint_interval_minutes: 15

auto-demo:
  recording:
    auto_start: false
    capture_terminal: true
    capture_browser: true
    exclude_patterns:
      - "*.log"
      - "node_modules/**"
      - ".git/**"
  export:
    default_format: html
    video_codec: libx264
    video_fps: 30
```

### Platform-Specific Settings

```yaml
platforms:
  claude-code:
    enabled: true
    hooks: true
    memory: persistent
  agent-zero:
    enabled: true
    tools: full
    sandbox: true
  opencode:
    enabled: true
    api_mode: standard
  openclaw:
    enabled: true
    rust_backend: true
```

## Architecture

```
autonomous-agents-multiplatform/
├── core/
│   ├── cloud-agent.ts       # Cloud Agents with Computer Use (Cursor-inspired)
│   ├── agent-oracle.ts      # Core autonomous agent logic
│   ├── auto-demo-engine.ts  # Demo recording and generation
│   ├── video-generator.ts   # Remotion-based video components
│   └── video-renderer.ts    # ffmpeg-based video rendering
├── platforms/
│   ├── agent-zero-config.py # Python adapter for Agent-Zero
│   ├── opencode-config.js   # JavaScript adapter for OpenCode
│   └── openclaw-config.rs   # Rust adapter for OpenClaw
├── hooks/
│   └── auto-agent-hooks.ts  # Claude Code lifecycle hooks
├── skills/
│   ├── auto-agent-skill.yaml
│   └── auto-demo-skill.yaml
├── examples/
│   └── video-demo.ts        # Video generation examples
└── index.ts                 # Main entry point
```

## Multi-Agent Parallelism

Inspired by Cursor's approach, you can run multiple agents in parallel:

```typescript
import { MultiAgentOrchestrator } from 'auto-agent-multiplatform';

const orchestrator = new MultiAgentOrchestrator(8, 'specialized');

await orchestrator.executeParallel(task, [
  'frontend',  // Agent handles UI components
  'backend',   // Agent handles API endpoints
  'testing',   // Agent writes tests
  'docs'       // Agent generates documentation
]);
```

### Execution Strategies

| Strategy | Description |
|----------|-------------|
| `race` | First agent to complete wins |
| `consensus` | All agents must agree on result |
| `specialized` | Each agent handles their specialty, results merged |
| `sequential` | Agents run one after another |

## Plan-First Execution

Before executing tasks, the system generates an execution plan:

```typescript
const plan = await agent.planGenerator.generate(task, memory);

// Plans include:
// - Step-by-step breakdown
// - Risk assessment
// - Required approvals
// - Rollback strategies
```

Example plan output:
```json
{
  "id": "plan-123",
  "steps": [
    { "type": "file_create", "target": "src/api.ts", "description": "Create API module" },
    { "type": "command", "command": "npm install express", "description": "Install Express" },
    { "type": "test", "target": "api.test.ts", "description": "Run API tests" }
  ],
  "estimatedComplexity": "medium",
  "riskLevel": "safe",
  "requiresApproval": false
}
```

## 🎬 Automatic Video Generation

### Quick Video Generation

Generate a video directly from your demo recording:

```typescript
import { renderDemoVideo } from 'auto-agent-multiplatform';

// After recording a demo
const videoPath = await renderDemoVideo(demo, {
  format: 'mp4',
  outputPath: './demos/my-demo.mp4',
  width: 1920,
  height: 1080,
  fps: 30,
  quality: 'high'
});
```

### Create Video from Code

Define your video programmatically:

```typescript
import { createCodeStep, createTerminalStep, buildVideoConfig } from 'auto-agent-multiplatform';

const steps = [
  { id: 'intro', title: 'My Demo', type: 'intro', durationInFrames: 90 },
  createCodeStep('Create API', codeString, 'typescript', 8),
  createTerminalStep('npm install', outputString, 4),
  { id: 'outro', title: 'Done!', type: 'outro', durationInFrames: 90 }
];

const config = buildVideoConfig(steps, {
  name: 'API Tutorial',
  style: 'modern'
});
```

### Video Styles

| Style | Description |
|-------|-------------|
| `dark` | Dark theme with blue accents |
| `light` | Light theme for presentations |
| `modern` | GitHub-inspired dark theme |
| `gradient` | Purple gradient background |

### Video Components

- **TypingCode**: Animated code typing with syntax highlighting
- **TerminalAnimation**: Realistic terminal output
- **IntroSequence**: Animated title intro
- **OutroSequence**: Call-to-action outro

### Screen Capture Recording

Record your screen directly:

```typescript
import { ScreenCaptureRecorder } from 'auto-agent-multiplatform';

const recorder = new ScreenCaptureRecorder();

await recorder.start({
  outputPath: './recording.mp4',
  region: { x: 0, y: 0, width: 1920, height: 1080 },
  fps: 30
});

// ... perform actions ...

const videoPath = await recorder.stop();
```

## Error Loop Detection

The system automatically detects when it's stuck in an error loop:

```typescript
// After 3 similar errors, the system:
// 1. Checks learned patterns for solutions
// 2. Applies best-matching fix
// 3. If still stuck, escalates to human

const detector = new ErrorLoopDetector();
if (detector.detect(error, state)) {
  // Try learned patterns
  await agent.handleLoop(step, error);
}
```

## Export Formats

### HTML Walkthrough
Interactive web-based demo with navigation:
```bash
/auto-demo export demo-123 --format=html
```

### Reveal.js Presentation
```bash
/auto-demo export demo-123 --format=reveal
```

### PDF Document
```bash
/auto-demo export demo-123 --format=pdf
```

### Video (with ffmpeg)
```bash
/auto-demo export demo-123 --format=video --fps=30
```

## Comparison with Cursor

| Feature | Cursor | This System |
|---------|--------|-------------|
| Cloud Agents with Computer Use | ✅ | ✅ |
| Isolated Sandbox Execution | ✅ | ✅ |
| Agent Video Recording | ✅ | ✅ |
| Browser/Desktop Automation | ✅ | ✅ |
| Artifact Generation | ✅ | ✅ |
| Long-Running Agents | ✅ | ✅ |
| Multi-Agent Parallelism | ✅ (8 agents) | ✅ (8 agents) |
| Plan-First Execution | ✅ | ✅ |
| Error Loop Detection | ✅ | ✅ |
| Terminal Automation | ✅ | ✅ |
| Demo Recording | ❌ | ✅ |
| Multi-Platform | ❌ (Cursor only) | ✅ (4 platforms) |
| Export Formats | ❌ | ✅ (7 formats) |
| Open Source | ❌ | ✅ |

## Cloud Agent Sandbox Types

| Type | Description | Use Case |
|------|-------------|----------|
| `docker` | Local Docker container | Development, testing |
| `e2b` | E2B secure sandbox | Production, untrusted code |
| `vm` | Full virtual machine | Complex environments |
| `remote` | Remote server | Existing infrastructure |

## Contributing

Contributions are welcome! Please see the platform-specific guides:

- [Claude Code Integration](./docs/claude-code.md)
- [Agent-Zero Integration](./docs/agent-zero.md)
- [OpenCode Integration](./docs/opencode.md)
- [OpenClaw Integration](./docs/openclaw.md)

## License

MIT License - See [LICENSE](./LICENSE) for details.

## Acknowledgments

- Inspired by [Cursor](https://cursor.sh/) and their innovative autonomous agent features
- Built for the AI coding assistant community
- Designed for cross-platform compatibility
