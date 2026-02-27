/**
 * Cloud Agent with Computer Use Example
 *
 * This example demonstrates Cursor's Cloud Agents feature:
 * - Running agents in isolated sandboxes
 * - Automatic video recording of agent interactions
 * - Computer Use: browser and desktop automation
 * - Artifact generation (videos, screenshots, logs)
 * - Creating merge-ready PRs with demo artifacts
 *
 * Run with: npx ts-node examples/cloud-agent-demo.ts
 */

import {
  CloudAgent,
  CloudAgentOrchestrator,
  runCloudAgent,
  type CloudAgentConfig,
  type SandboxConfig
} from '../index';

// ============================================================================
// EXAMPLE 1: Quick Start - Run a Cloud Agent
// ============================================================================

async function quickStartCloudAgent() {
  console.log('☁️ Quick Start: Cloud Agent with Video Recording\n');

  // The simplest way to run a cloud agent
  const result = await runCloudAgent(
    'Build a simple HTTP server and test it with curl',
    {
      repo: 'https://github.com/example/my-project',
      branch: 'main',
      createPR: true
    }
  );

  console.log('✅ Agent completed!');
  console.log(`   Video: ${result.videoUrl}`);
  console.log(`   Screenshots: ${result.screenshots.length}`);
  console.log(`   Log entries: ${result.logs.length}`);

  // Print some logs
  console.log('\n📝 Agent logs:');
  result.logs.slice(-5).forEach(log => {
    console.log(`   [${log.level}] ${log.message}`);
  });
}

// ============================================================================
// EXAMPLE 2: Full Cloud Agent Configuration
// ============================================================================

async function fullCloudAgentExample() {
  console.log('☁️ Full Cloud Agent Configuration\n');

  const orchestrator = new CloudAgentOrchestrator();

  // Configure the sandbox
  const sandboxConfig: SandboxConfig = {
    type: 'docker',
    resources: {
      cpu: 2,
      memory: '4g',
      disk: '10g'
    },
    environment: {
      NODE_ENV: 'development',
      DEBUG: 'true'
    },
    gitRepo: 'https://github.com/example/my-project',
    gitBranch: 'feature-branch'
  };

  // Create the agent
  const agent = orchestrator.createAgent({
    name: 'Feature Builder Agent',
    task: 'Add user authentication',
    sandbox: sandboxConfig,
    recording: {
      enabled: true,
      captureDesktop: true,
      captureBrowser: true,
      captureTerminal: true,
      fps: 30,
      quality: 'high',
      includeAudio: false
    },
    platforms: [
      { type: 'web', enabled: true },
      { type: 'github', enabled: true }
    ],
    notifications: {
      slack: 'https://hooks.slack.com/services/xxx',
      github: 'owner/repo'
    }
  });

  try {
    // Initialize the agent (starts sandbox and recording)
    console.log('Initializing agent...');
    await agent.initialize();

    // The agent can use the computer
    console.log('Agent using browser...');
    await agent.browse('http://localhost:3000');
    await agent.click('#login-button');
    await agent.type('test@example.com', '#email-input');
    await agent.screenshot('Login page filled');

    // Execute terminal commands
    console.log('Running terminal commands...');
    const result = await agent.exec('npm test');
    console.log(`Tests: ${result.exitCode === 0 ? 'PASSED' : 'FAILED'}`);

    // Execute the main task
    console.log('Executing main task...');
    const state = await agent.execute('Add user authentication');

    console.log(`\n✅ Task ${state.status}`);
    console.log(`   Progress: ${state.progress}%`);
    console.log(`   Artifacts: ${state.artifacts.length}`);

    // Stop and collect artifacts
    const artifacts = await agent.stop();

    console.log('\n📦 Artifacts generated:');
    artifacts.forEach(artifact => {
      console.log(`   - ${artifact.type}: ${artifact.url}`);
    });

    // Create a PR with artifacts
    const prUrl = await agent.createPR(
      'Add user authentication',
      'Implemented JWT-based authentication with login/logout flows'
    );
    console.log(`\n🔗 PR created: ${prUrl}`);

  } catch (error) {
    console.error('Agent failed:', (error as Error).message);
    await agent.stop();
  }
}

// ============================================================================
// EXAMPLE 3: Multi-Agent Parallel Execution
// ============================================================================

async function parallelAgentsExample() {
  console.log('☁️ Multi-Agent Parallel Execution\n');
  console.log('Running 4 agents in parallel (like Cursor\'s approach)...\n');

  const orchestrator = new CloudAgentOrchestrator();

  // Run multiple agents in parallel
  const results = await orchestrator.runParallel([
    'Build the REST API endpoints',
    'Create the React frontend components',
    'Write unit tests for all modules',
    'Generate API documentation'
  ]);

  console.log('All agents completed!\n');

  // Display results
  for (const [task, result] of results) {
    const video = result.artifacts.find(a => a.type === 'video');
    console.log(`Task: ${task}`);
    console.log(`  Status: ${result.state.status}`);
    console.log(`  Video: ${video?.url || 'none'}`);
    console.log(`  Screenshots: ${result.artifacts.filter(a => a.type === 'screenshot').length}`);
    console.log('');
  }
}

// ============================================================================
// EXAMPLE 4: Security Vulnerability Reproduction
// ============================================================================

async function securityVulnerabilityExample() {
  console.log('☁️ Security Vulnerability Reproduction\n');
  console.log('Agent will record itself reproducing a vulnerability...\n');

  const orchestrator = new CloudAgentOrchestrator();

  const agent = orchestrator.createAgent({
    name: 'Security Research Agent',
    task: 'Reproduce XSS vulnerability in search field',
    sandbox: {
      type: 'e2b', // Use secure sandbox for security testing
      resources: { cpu: 2, memory: '4g', disk: '10g' },
      environment: {}
    },
    recording: {
      enabled: true,
      captureBrowser: true,
      captureTerminal: true,
      fps: 30,
      quality: 'high',
      includeAudio: false
    }
  });

  await agent.initialize();

  // Navigate to the vulnerable application
  await agent.browse('http://localhost:3000/search');

  // Attempt XSS payloads (agent records itself doing this)
  await agent.type('<script>alert("XSS")</script>', '#search-input');
  await agent.click('#search-button');
  await agent.screenshot('XSS test - script injection');

  // Try another payload
  await agent.type('<img src=x onerror=alert(1)>', '#search-input');
  await agent.click('#search-button');
  await agent.screenshot('XSS test - img onerror');

  // Collect evidence
  const artifacts = await agent.stop();

  console.log('Security research artifacts:');
  artifacts.forEach(a => {
    console.log(`  - ${a.type}: ${a.description}`);
  });
}

// ============================================================================
// EXAMPLE 5: UI Testing with Browser Automation
// ============================================================================

async function uiTestingExample() {
  console.log('☁️ UI Testing with Browser Automation\n');

  const orchestrator = new CloudAgentOrchestrator();

  const agent = orchestrator.createAgent({
    name: 'UI Test Agent',
    task: 'Test the checkout flow',
    sandbox: {
      type: 'docker',
      resources: { cpu: 2, memory: '4g', disk: '10g' },
      environment: { TEST_MODE: 'true' }
    },
    recording: {
      enabled: true,
      captureBrowser: true,
      fps: 30,
      quality: 'high',
      includeAudio: false
    }
  });

  await agent.initialize();

  // Navigate through the checkout flow
  await agent.browse('http://localhost:3000');
  await agent.screenshot('Homepage');

  await agent.click('#product-1');
  await agent.screenshot('Product page');

  await agent.click('#add-to-cart');
  await agent.screenshot('Added to cart');

  await agent.click('#checkout-button');
  await agent.screenshot('Checkout page');

  // Fill checkout form
  await agent.type('John Doe', '#name');
  await agent.type('john@example.com', '#email');
  await agent.type('123 Main St', '#address');
  await agent.screenshot('Checkout form filled');

  await agent.click('#place-order');
  await agent.screenshot('Order confirmation');

  const artifacts = await agent.stop();

  console.log(`UI Test completed with ${artifacts.length} artifacts`);
}

// ============================================================================
// RUN EXAMPLES
// ============================================================================

async function main() {
  const example = process.argv[2] || '1';

  switch (example) {
    case '1':
      await quickStartCloudAgent();
      break;
    case '2':
      await fullCloudAgentExample();
      break;
    case '3':
      await parallelAgentsExample();
      break;
    case '4':
      await securityVulnerabilityExample();
      break;
    case '5':
      await uiTestingExample();
      break;
    default:
      console.log('Usage: npx ts-node examples/cloud-agent-demo.ts [1|2|3|4|5]');
      console.log('  1 - Quick Start Cloud Agent');
      console.log('  2 - Full Cloud Agent Configuration');
      console.log('  3 - Multi-Agent Parallel Execution');
      console.log('  4 - Security Vulnerability Reproduction');
      console.log('  5 - UI Testing with Browser Automation');
  }
}

main().catch(console.error);
