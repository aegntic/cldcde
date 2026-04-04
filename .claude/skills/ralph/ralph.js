/**
 * Ralph - Autonomous AI Development Loops
 *
 * Official Anthropic prompt loop skill for continuous autonomous development.
 * Enables AI agents to work through complex tasks autonomously through
 * iterative loops with intelligent exit detection.
 *
 * @name Ralph
 * @description Official Anthropic prompt loop skill for autonomous development
 * @category Development
 * @author Anthropic
 * @version 1.0.0
 */

module.exports = {
  name: 'ralph',
  displayName: 'Ralph - Autonomous AI Development Loops',
  description: 'Official Anthropic prompt loop skill for continuous autonomous development cycles with intelligent exit detection',
  version: '1.0.0',
  category: 'Development',
  author: 'Anthropic',

  // Skill metadata
  metadata: {
    tags: ['automation', 'ai-loops', 'development', 'iterative', 'autonomous'],
    platforms: ['claude-code', 'factory-droid'],
    type: 'command-skill',
  },

  // Commands provided by this skill
  commands: [
    {
      name: 'ralph-loop',
      description: 'Start autonomous iteration loop for continuous development',
      usage: '/ralph-loop "<prompt>" [options]',
      examples: [
        '/ralph-loop "Build a hello world API" --completion-promise "DONE" --max-iterations 10',
        '/ralph-loop "Implement feature X" --max-iterations 30 --verbose',
        '/ralph-loop "Fix bug Y" --completion-promise "FIXED" --max-iterations 20',
      ],
      options: [
        {
          flag: '--max-iterations <n>',
          description: 'Stop after N iterations (recommended safety net)',
          default: 'unlimited',
        },
        {
          flag: '--completion-promise "<text>"',
          description: 'Phrase signaling completion (exact match)',
          examples: ['DONE', 'COMPLETE', 'FIXED'],
        },
        {
          flag: '--calls <n>',
          description: 'Limit API calls per hour',
          default: '100',
        },
        {
          flag: '--timeout <min>',
          description: 'Set Claude Code execution timeout (1-120 minutes)',
          default: '15',
        },
        {
          flag: '--verbose',
          description: 'Show detailed progress updates',
          type: 'boolean',
        },
        {
          flag: '--monitor',
          description: 'Start with tmux session and live monitoring',
          type: 'boolean',
        },
      ],
    },
    {
      name: 'cancel-ralph',
      description: 'Cancel the active Ralph loop',
      usage: '/cancel-ralph',
    },
  ],

  // Templates provided by this skill
  templates: [
    {
      name: 'Feature Implementation',
      description: 'Build a complete feature with tests',
      prompt: `Implement [FEATURE_NAME].

Requirements:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

Success criteria:
- All requirements implemented
- Tests passing with >80% coverage
- No linter errors
- Documentation updated

Output <promise>COMPLETE</promise> when done.`,
      options: '--max-iterations 30 --completion-promise "COMPLETE"',
    },
    {
      name: 'TDD Development',
      description: 'Test-driven development loop',
      prompt: `Implement [FEATURE] using TDD.

Process:
1. Write failing test for next requirement
2. Implement minimal code to pass
3. Run tests
4. If failing, fix and retry
5. Refactor if needed
6. Repeat for all requirements

Requirements: [LIST]

Output <promise>DONE</promise> when all tests green.`,
      options: '--max-iterations 50 --completion-promise "DONE"',
    },
    {
      name: 'Bug Fixing',
      description: 'Iterative bug resolution',
      prompt: `Fix bug: [DESCRIPTION]

Steps:
1. Reproduce the bug
2. Identify root cause
3. Implement fix
4. Write regression test
5. Verify fix works
6. Check no new issues introduced

After 15 iterations if not fixed:
- Document blocking issues
- List attempted approaches
- Suggest alternatives

Output <promise>FIXED</promise> when resolved.`,
      options: '--max-iterations 20 --completion-promise "FIXED"',
    },
    {
      name: 'Safe Refactoring',
      description: 'Safe code refactoring loop',
      prompt: `Refactor [COMPONENT] for [GOAL].

Constraints:
- All existing tests must pass
- No behavior changes
- Incremental commits

Checklist:
- [ ] Tests passing before start
- [ ] Apply refactoring step
- [ ] Tests still passing
- [ ] Repeat until done

Output <promise>REFACTORED</promise> when complete.`,
      options: '--max-iterations 25 --completion-promise "REFACTORED"',
    },
  ],

  // Best practices
  bestPractices: [
    {
      title: 'Clear Completion Criteria',
      description: 'Always define what "done" looks like with specific, measurable criteria',
      bad: 'Build a todo API and make it good.',
      good: `Build a REST API for todos.

When complete:
- All CRUD endpoints working
- Input validation in place
- Tests passing (coverage > 80%)
- README with API docs

Output: <promise>DONE</promise>`,
    },
    {
      title: 'Incremental Goals',
      description: 'Break large tasks into smaller, achievable phases',
      bad: 'Create a complete e-commerce platform.',
      good: `Phase 1: User authentication (JWT, tests)
Phase 2: Product catalog (list/search, tests)
Phase 3: Shopping cart (add/remove, tests)

Output <promise>COMPLETE</promise> when all phases done.`,
    },
    {
      title: 'Self-Correction Patterns',
      description: 'Build in automatic error detection and correction',
      bad: 'Write code for feature X.',
      good: `Implement feature X following TDD:
1. Write failing tests
2. Implement feature
3. Run tests
4. If any fail, debug and fix
5. Refactor if needed
6. Repeat until all green
7. Output: <promise>COMPLETE</promise>`,
    },
  ],

  // When to use Ralph
  whenToUse: {
    goodFor: [
      'Well-defined tasks with clear success criteria',
      'Tasks requiring iteration and refinement',
      'Greenfield projects where you can walk away',
      'Tasks with automatic verification (tests, linters)',
      'Overnight/weekend automated development',
    ],
    notGoodFor: [
      'Tasks requiring human judgment or design decisions',
      'One-shot operations needing immediate results',
      'Tasks with unclear or subjective success criteria',
      'Production debugging (use targeted debugging instead)',
      'Tasks requiring external approvals',
    ],
  },

  // Real-world results
  results: [
    {
      title: '6 Repositories Overnight',
      description: 'Y Combinator hackathon testing',
      metric: 'Successfully generated 6 complete repositories',
    },
    {
      title: '$50k Contract for $297',
      description: 'Cost efficiency demonstration',
      metric: '99% cost reduction versus human development',
    },
    {
      title: 'CURSED Programming Language',
      description: 'Entire language created over 3 months',
      metric: 'Proof of concept for ambitious projects',
    },
  ],

  // Advanced patterns
  advancedPatterns: [
    {
      name: 'Multi-Phase Development',
      description: 'Chain multiple Ralph loops for complex projects',
      example: `# Phase 1: Core implementation
/ralph-loop "Phase 1: Build core data models and database schema.
Output <promise>PHASE1_DONE</promise>" --max-iterations 20

# Phase 2: API layer
/ralph-loop "Phase 2: Build API endpoints for existing models.
Output <promise>PHASE2_DONE</promise>" --max-iterations 25

# Phase 3: Frontend
/ralph-loop "Phase 3: Build UI components.
Output <promise>PHASE3_DONE</promise>" --max-iterations 30`,
    },
    {
      name: 'Git Worktrees for Parallel Development',
      description: 'Run multiple Ralph loops simultaneously',
      example: `# Create isolated worktrees
git worktree add ../project-feature1 -b feature/auth
git worktree add ../project-feature2 -b feature/api

# Terminal 1: Auth feature
cd ../project-feature1
/ralph-loop "Implement authentication..." --max-iterations 30

# Terminal 2: API feature (simultaneously)
cd ../project-feature2
/ralph-loop "Build REST API..." --max-iterations 30`,
    },
    {
      name: 'Overnight Batch Processing',
      description: 'Queue up work to run while you sleep',
      example: `# Create batch script
cat << 'EOF' > overnight-work.sh
#!/bin/bash
cd /path/to/project1
claude -p "/ralph-loop 'Task 1...' --max-iterations 50"

cd /path/to/project2
claude -p "/ralph-loop 'Task 2...' --max-iterations 50"
EOF

# Run before bed
chmod +x overnight-work.sh
./overnight-work.sh`,
    },
  ],

  // Safety features
  safety: {
    rateLimiting: {
      default: '100 calls per hour',
      configurable: true,
      description: 'Prevents API abuse and manages costs',
    },
    fiveHourLimit: {
      description: 'Claude API 5-hour usage limit handling',
      behavior: 'Automatically detects limit and prompts user action',
    },
    maxIterations: {
      recommended: 'Always use as primary safety net',
      prevents: 'Infinite loops on impossible tasks',
    },
    circuitBreaker: {
      description: 'Detects API errors and rate limits',
      behavior: 'Opens circuit after 5 consecutive failures',
    },
  },

  // Integration with other skills
  integratesWith: [
    'TDD/Testing Skills',
    'Code Review Skills',
    'Documentation Skills',
    'Debugging Skills',
    'Refactoring Skills',
  ],

  // Resources
  resources: {
    official: [
      {
        title: 'Awesome Claude Ralph Guide',
        url: 'https://awesomeclaude.ai/ralph-wiggum',
        description: 'Complete reference and documentation',
      },
      {
        title: 'Anthropic Claude Code Plugins',
        url: 'https://github.com/anthropics/claude-code/blob/main/plugins/README.md',
        description: 'Official plugin documentation',
      },
      {
        title: 'frankbria/ralph-claude-code',
        url: 'https://github.com/frankbria/ralph-claude-code',
        description: 'Enhanced implementation with monitoring',
      },
    ],
    community: [
      'Reddit: r/ClaudeAI - Ralph discussions and tutorials',
      'GitHub: Multiple implementations and examples',
      'Podcasts: "Ralph Wiggum under the hood" (2025-10-28)',
    ],
  },

  // Footer attribution
  footer: {
    powered: 'aegntic ecosystems',
    developed: 'ae.ltd',
    official: 'Anthropic Claude Code Skill',
  },
};
