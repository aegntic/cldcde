/**
 * Auto-Demo Video Generation Example
 *
 * This example demonstrates how to automatically create demo videos
 * from recorded coding sessions - similar to Cursor's autoDemo feature.
 *
 * Run with: npx ts-node examples/video-demo.ts
 */

import {
  AutoDemoSystem,
  VideoRenderer,
  renderDemoVideo,
  buildVideoConfig,
  createCodeStep,
  createTerminalStep,
  DemoVideoComposition
} from '../index';

// ============================================================================
// EXAMPLE 1: Record a coding session and generate a video
// ============================================================================

async function recordAndGenerateVideo() {
  console.log('🎬 Starting Auto-Demo Video Generation...\n');

  // 1. Initialize the demo system
  const demoSystem = new AutoDemoSystem('claude-code');

  // 2. Start recording
  const demoId = demoSystem.startRecording({
    name: 'Building a REST API',
    format: 'walkthrough',
    style: 'tutorial',
    captureTerminal: true
  });

  console.log(`📝 Recording started: ${demoId}`);

  // 3. Simulate coding actions (in real use, these happen automatically)
  demoSystem.recordAction('file_create', 'src/api.ts', {
    after: `import express from 'express';

const app = express();
const PORT = 3000;

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`
  });
  demoSystem.explain('Created the main API server file with Express');

  demoSystem.recordAction('command', 'terminal', {
    command: 'npm install express',
    output: 'added 1 package in 2.3s'
  });

  demoSystem.recordAction('test', 'api.test.ts', {
    command: 'PASS',
    output: '✓ API returns users array (15ms)'
  });

  // 4. Stop recording
  const demo = demoSystem.stopRecording();

  if (!demo) {
    console.error('Failed to create demo');
    return;
  }

  console.log(`\n✅ Recording complete!`);
  console.log(`   Files changed: ${demo.metadata.filesChanged.length}`);
  console.log(`   Commands run: ${demo.metadata.commandsRun}`);
  console.log(`   Steps recorded: ${demo.steps.length}`);

  // 5. Generate video from demo
  console.log('\n🎥 Generating video...');

  const videoPath = await renderDemoVideo(demo, {
    format: 'mp4',
    outputPath: './output/demo-video.mp4',
    width: 1920,
    height: 1080,
    fps: 30,
    quality: 'high',
    includeAudio: false
  });

  console.log(`\n✨ Video created: ${videoPath}`);
}

// ============================================================================
// EXAMPLE 2: Create video from code directly (without recording)
// ============================================================================

async function createVideoFromCode() {
  console.log('🎬 Creating video from code directly...\n');

  // Define the steps for your demo video
  const steps = [
    {
      id: 'intro',
      title: 'Building a REST API',
      description: 'Step-by-step tutorial',
      durationInFrames: 90, // 3 seconds at 30fps
      type: 'intro' as const
    },
    createCodeStep(
      'Create the API server',
      `import express from 'express';

const app = express();
const PORT = 3000;

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
      'typescript',
      8 // 8 seconds
    ),
    createTerminalStep(
      'npm install express',
      `added 1 package in 2.3s

2 packages are looking for funding
  run \`npm fund\` for details`,
      4
    ),
    createTerminalStep(
      'npm run dev',
      `> api-server@1.0.0 dev
> ts-node src/api.ts

Server running on port 3000`,
      4
    ),
    {
      id: 'outro',
      title: 'Done!',
      description: 'Your API is ready',
      durationInFrames: 90,
      type: 'outro' as const
    }
  ];

  // Build video configuration
  const config = buildVideoConfig(steps, {
    name: 'REST API Tutorial',
    style: 'modern',
    width: 1920,
    height: 1080,
    fps: 30
  });

  console.log('Video config:');
  console.log(`  Duration: ${config.durationInFrames / config.fps} seconds`);
  console.log(`  Resolution: ${config.width}x${config.height}`);
  console.log(`  Style: ${config.style}`);

  // The actual rendering would use Remotion or ffmpeg
  console.log('\n✨ Video configuration ready for rendering!');
  console.log('   To render, run: npx remotion render src/Root.tsx DemoVideo out/video.mp4');
}

// ============================================================================
// EXAMPLE 3: Screen capture recording
// ============================================================================

async function recordScreenToVideo() {
  console.log('🎬 Screen capture recording example...\n');

  const { ScreenCaptureRecorder } = await import('../core/video-renderer');
  const recorder = new ScreenCaptureRecorder();

  // Start recording a specific region
  await recorder.start({
    outputPath: './output/screen-capture.mp4',
    region: { x: 0, y: 0, width: 1920, height: 1080 },
    fps: 30,
    captureAudio: false
  });

  console.log('Recording... Press Ctrl+C to stop.');

  // In a real app, you'd have a proper stop mechanism
  // For demo purposes, we'll just show the API
  setTimeout(async () => {
    const videoPath = await recorder.stop();
    console.log(`\n✨ Screen recording saved: ${videoPath}`);
  }, 10000);
}

// ============================================================================
// RUN EXAMPLES
// ============================================================================

async function main() {
  const example = process.argv[2] || '1';

  switch (example) {
    case '1':
      await recordAndGenerateVideo();
      break;
    case '2':
      await createVideoFromCode();
      break;
    case '3':
      await recordScreenToVideo();
      break;
    default:
      console.log('Usage: npx ts-node examples/video-demo.ts [1|2|3]');
      console.log('  1 - Record and generate video');
      console.log('  2 - Create video from code');
      console.log('  3 - Screen capture recording');
  }
}

main().catch(console.error);
