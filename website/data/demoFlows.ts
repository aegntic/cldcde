export interface DemoStep {
    type: 'log' | 'visual';
    content: string; // Log message or Visual state ID
    delay: number;
    style?: 'info' | 'success' | 'warning' | 'error' | 'system';
}

export interface DemoPrompt {
    id: string;
    label: string;
    description: string;
    steps: DemoStep[];
}

export interface ProductDemo {
    id: string;
    name: string;
    description: string;
    icon: string; // Lucide icon name
    prompts: DemoPrompt[];
}

export const DEMO_PRODUCTS: ProductDemo[] = [
    {
        id: 'ultraplan',
        name: 'UltraPlan Pro',
        description: 'Autonomous Project Planning & Execution',
        icon: 'Brain',
        prompts: [
            {
                id: 'generate_saas',
                label: 'Generate SaaS Plan',
                description: 'Create a full execution plan for a $10k/mo SaaS',
                steps: [
                    { type: 'log', content: 'Initializing UltraPlan Neural Core...', delay: 200, style: 'system' },
                    { type: 'log', content: 'Analyzing market trends for "SaaS"...', delay: 600, style: 'info' },
                    { type: 'visual', content: 'analyzing', delay: 0 },
                    { type: 'log', content: 'Detected Opportunity: "Micro-SaaS for Creator Tools"', delay: 1200, style: 'success' },
                    { type: 'log', content: 'Generating Architecture...', delay: 800, style: 'info' },
                    { type: 'visual', content: 'architecture', delay: 0 },
                    { type: 'log', content: 'Drafting Marketing Strategy (Hormozi Method)...', delay: 1000, style: 'info' },
                    { type: 'log', content: 'Plan Generation Complete. 47 Tasks Created.', delay: 800, style: 'success' },
                    { type: 'visual', content: 'complete', delay: 0 },
                ]
            },
            {
                id: 'optimize_workflow',
                label: 'Optimize Workflow',
                description: 'Analyze and improve current team velocity',
                steps: [
                    { type: 'log', content: 'Connecting to GitHub Repository...', delay: 300, style: 'system' },
                    { type: 'log', content: 'Scanning last 50 PRs...', delay: 800, style: 'info' },
                    { type: 'visual', content: 'scanning', delay: 0 },
                    { type: 'log', content: 'Bottleneck Detected: "Code Review Latency"', delay: 1000, style: 'warning' },
                    { type: 'log', content: '↳ deploying "Auto-Reviewer" Agent...', delay: 1200, style: 'info' },
                    { type: 'visual', content: 'optimizing', delay: 0 },
                    { type: 'log', content: 'Optimization Complete. Estimated Velocity Increase: 40%', delay: 800, style: 'success' },
                ]
            },
            {
                id: 'risk_assessment',
                label: 'Risk Assessment',
                description: 'Identify and mitigate project risks',
                steps: [
                    { type: 'log', content: 'Loading project manifest...', delay: 300, style: 'system' },
                    { type: 'log', content: 'Analyzing dependency graph (12 modules)...', delay: 700, style: 'info' },
                    { type: 'visual', content: 'analyzing', delay: 0 },
                    { type: 'log', content: '⚠ HIGH RISK: External API dependency (Stripe)', delay: 900, style: 'warning' },
                    { type: 'log', content: '⚠ MEDIUM: No retry logic in payment flow', delay: 600, style: 'warning' },
                    { type: 'log', content: 'Generating mitigation strategies...', delay: 800, style: 'info' },
                    { type: 'log', content: '✓ Risk matrix exported to /docs/risks.md', delay: 500, style: 'success' },
                    { type: 'visual', content: 'complete', delay: 0 },
                ]
            }
        ]
    },
    {
        id: 'fpef',
        name: 'FPEF Framework',
        description: 'First Principles Debugging & Problem Solving',
        icon: 'Search',
        prompts: [
            {
                id: 'debug_issue',
                label: 'Debug Issue',
                description: 'Systematic root cause analysis',
                steps: [
                    { type: 'log', content: '╔══════════════════════════════════════╗', delay: 100, style: 'system' },
                    { type: 'log', content: '║  FPEF: Find-Prove-Evidence-Fix       ║', delay: 100, style: 'system' },
                    { type: 'log', content: '╚══════════════════════════════════════╝', delay: 100, style: 'system' },
                    { type: 'log', content: '', delay: 200 },
                    { type: 'log', content: '[FIND] Scanning error logs...', delay: 400, style: 'info' },
                    { type: 'visual', content: 'analyzing', delay: 0 },
                    { type: 'log', content: 'Located: TypeError at api/handler.ts:47', delay: 800, style: 'info' },
                    { type: 'log', content: '[PROVE] Forming hypothesis...', delay: 600, style: 'info' },
                    { type: 'log', content: '→ Hypothesis: Null check missing on response.data', delay: 700, style: 'info' },
                    { type: 'log', content: '[EVIDENCE] Running test case...', delay: 500, style: 'info' },
                    { type: 'visual', content: 'architecture', delay: 0 },
                    { type: 'log', content: '✓ Confirmed: Error reproduced with null response', delay: 900, style: 'success' },
                    { type: 'log', content: '[FIX] Generating patch...', delay: 600, style: 'info' },
                    { type: 'log', content: 'Applied: Optional chaining (?.) at line 47', delay: 700, style: 'success' },
                    { type: 'visual', content: 'complete', delay: 0 },
                    { type: 'log', content: '✓ FPEF cycle complete. Issue resolved.', delay: 400, style: 'success' },
                ]
            },
            {
                id: 'analyze_codebase',
                label: 'Analyze Codebase',
                description: 'First principles code review',
                steps: [
                    { type: 'log', content: 'Initializing first principles analysis...', delay: 300, style: 'system' },
                    { type: 'log', content: 'Mapping module boundaries...', delay: 600, style: 'info' },
                    { type: 'visual', content: 'scanning', delay: 0 },
                    { type: 'log', content: 'Identifying core assumptions (7 found)...', delay: 800, style: 'info' },
                    { type: 'log', content: '  1. Single database connection assumed', delay: 300, style: 'info' },
                    { type: 'log', content: '  2. Auth token always present', delay: 300, style: 'info' },
                    { type: 'log', content: '  3. Network requests will succeed', delay: 300, style: 'warning' },
                    { type: 'log', content: 'Validating assumptions against evidence...', delay: 700, style: 'info' },
                    { type: 'visual', content: 'analyzing', delay: 0 },
                    { type: 'log', content: '⚠ 2 invalid assumptions detected', delay: 600, style: 'warning' },
                    { type: 'log', content: '✓ Report generated: /analysis/assumptions.md', delay: 500, style: 'success' },
                    { type: 'visual', content: 'complete', delay: 0 },
                ]
            }
        ]
    },
    {
        id: 'aegnt',
        name: 'AEGNT-27',
        description: 'Autonomous Agent Framework',
        icon: 'Bot',
        prompts: [
            {
                id: 'spawn_agent',
                label: 'Spawn Agent',
                description: 'Deploy an autonomous goal-seeking agent',
                steps: [
                    { type: 'log', content: '┌─────────────────────────────────────┐', delay: 100, style: 'system' },
                    { type: 'log', content: '│  AEGNT-27 Autonomous Agent System   │', delay: 100, style: 'system' },
                    { type: 'log', content: '└─────────────────────────────────────┘', delay: 100, style: 'system' },
                    { type: 'log', content: '', delay: 200 },
                    { type: 'log', content: 'Configuring agent parameters...', delay: 400, style: 'system' },
                    { type: 'log', content: '  goal: "Refactor auth module"', delay: 300, style: 'info' },
                    { type: 'log', content: '  constraints: ["no breaking changes"]', delay: 300, style: 'info' },
                    { type: 'log', content: '  tools: ["edit_file", "run_tests", "git"]', delay: 300, style: 'info' },
                    { type: 'visual', content: 'analyzing', delay: 0 },
                    { type: 'log', content: 'Agent spawned. ID: aegnt-x7k2m', delay: 600, style: 'success' },
                    { type: 'log', content: '', delay: 200 },
                    { type: 'log', content: '[aegnt-x7k2m] Analyzing auth module structure...', delay: 800, style: 'info' },
                    { type: 'log', content: '[aegnt-x7k2m] Planning 3 refactoring steps...', delay: 700, style: 'info' },
                    { type: 'visual', content: 'architecture', delay: 0 },
                    { type: 'log', content: '[aegnt-x7k2m] Executing step 1/3: Extract interfaces', delay: 900, style: 'info' },
                    { type: 'log', content: '[aegnt-x7k2m] Executing step 2/3: Apply dependency injection', delay: 900, style: 'info' },
                    { type: 'log', content: '[aegnt-x7k2m] Executing step 3/3: Update imports', delay: 700, style: 'info' },
                    { type: 'log', content: '[aegnt-x7k2m] Running test suite...', delay: 600, style: 'info' },
                    { type: 'log', content: '[aegnt-x7k2m] ✓ All 24 tests passing', delay: 800, style: 'success' },
                    { type: 'visual', content: 'complete', delay: 0 },
                    { type: 'log', content: 'Agent task complete. PR ready for review.', delay: 400, style: 'success' },
                ]
            },
            {
                id: 'multi_agent',
                label: 'Multi-Agent Task',
                description: 'Coordinate multiple agents on complex task',
                steps: [
                    { type: 'log', content: 'Initializing agent swarm...', delay: 300, style: 'system' },
                    { type: 'log', content: 'Spawning agents: [researcher, coder, reviewer]', delay: 500, style: 'info' },
                    { type: 'visual', content: 'analyzing', delay: 0 },
                    { type: 'log', content: '[researcher] Gathering requirements...', delay: 700, style: 'info' },
                    { type: 'log', content: '[coder] Waiting for research output...', delay: 400, style: 'system' },
                    { type: 'log', content: '[researcher] → coder: Requirements ready', delay: 600, style: 'success' },
                    { type: 'log', content: '[coder] Implementing feature...', delay: 900, style: 'info' },
                    { type: 'visual', content: 'architecture', delay: 0 },
                    { type: 'log', content: '[coder] → reviewer: Code ready for review', delay: 700, style: 'success' },
                    { type: 'log', content: '[reviewer] Analyzing code quality...', delay: 800, style: 'info' },
                    { type: 'log', content: '[reviewer] ✓ LGTM - Merge approved', delay: 600, style: 'success' },
                    { type: 'visual', content: 'complete', delay: 0 },
                    { type: 'log', content: 'Swarm task complete. All agents terminated.', delay: 400, style: 'success' },
                ]
            }
        ]
    },
    {
        id: 'prologue',
        name: 'Prologue',
        description: 'Narrative-Driven Development',
        icon: 'FileText',
        prompts: [
            {
                id: 'generate_story',
                label: 'Generate Story',
                description: 'Create narrative documentation for your code',
                steps: [
                    { type: 'log', content: '📖 Prologue - Narrative Development Engine', delay: 200, style: 'system' },
                    { type: 'log', content: '', delay: 100 },
                    { type: 'log', content: 'Scanning codebase for structure...', delay: 500, style: 'info' },
                    { type: 'visual', content: 'analyzing', delay: 0 },
                    { type: 'log', content: 'Identified: 12 modules, 47 functions, 8 classes', delay: 700, style: 'info' },
                    { type: 'log', content: 'Generating narrative arc...', delay: 600, style: 'info' },
                    { type: 'log', content: '', delay: 200 },
                    { type: 'log', content: '  Chapter 1: "The Beginning" - App Initialization', delay: 400, style: 'info' },
                    { type: 'log', content: '  Chapter 2: "The Journey" - User Authentication', delay: 400, style: 'info' },
                    { type: 'log', content: '  Chapter 3: "The Challenge" - Data Processing', delay: 400, style: 'info' },
                    { type: 'log', content: '  Chapter 4: "The Resolution" - API Response', delay: 400, style: 'info' },
                    { type: 'visual', content: 'architecture', delay: 0 },
                    { type: 'log', content: '', delay: 200 },
                    { type: 'log', content: 'Writing documentation...', delay: 800, style: 'info' },
                    { type: 'log', content: '✓ Generated: /docs/STORY.md (2,400 words)', delay: 500, style: 'success' },
                    { type: 'visual', content: 'complete', delay: 0 },
                ]
            }
        ]
    },
    {
        id: 'obs_control',
        name: 'OBS Control',
        description: 'Stream Automation & Scene Management',
        icon: 'Video',
        prompts: [
            {
                id: 'setup_stream',
                label: 'Setup Stream',
                description: 'Configure scenes and automation',
                steps: [
                    { type: 'log', content: '🎬 OBS Control - Stream Automation', delay: 200, style: 'system' },
                    { type: 'log', content: '', delay: 100 },
                    { type: 'log', content: 'Connecting to OBS WebSocket...', delay: 400, style: 'info' },
                    { type: 'visual', content: 'analyzing', delay: 0 },
                    { type: 'log', content: '✓ Connected to OBS 30.0.0', delay: 600, style: 'success' },
                    { type: 'log', content: 'Scanning scenes...', delay: 400, style: 'info' },
                    { type: 'log', content: '  Found: [Intro, Main, BRB, Outro]', delay: 500, style: 'info' },
                    { type: 'log', content: 'Configuring automation rules...', delay: 600, style: 'info' },
                    { type: 'log', content: '  Rule: Switch to "BRB" after 5min idle', delay: 400, style: 'info' },
                    { type: 'log', content: '  Rule: Auto-switch to "Main" on game start', delay: 400, style: 'info' },
                    { type: 'visual', content: 'architecture', delay: 0 },
                    { type: 'log', content: 'Enabling chat integration...', delay: 500, style: 'info' },
                    { type: 'log', content: '✓ Chat commands registered (!scene, !brb)', delay: 600, style: 'success' },
                    { type: 'visual', content: 'complete', delay: 0 },
                    { type: 'log', content: 'Stream automation active. Ready to go live.', delay: 400, style: 'success' },
                ]
            },
            {
                id: 'scene_switch',
                label: 'Scene Switch',
                description: 'Change OBS scenes programmatically',
                steps: [
                    { type: 'log', content: 'Executing scene transition...', delay: 300, style: 'system' },
                    { type: 'log', content: 'Current: "Main" → Target: "BRB"', delay: 400, style: 'info' },
                    { type: 'visual', content: 'analyzing', delay: 0 },
                    { type: 'log', content: 'Applying transition: Fade (500ms)', delay: 500, style: 'info' },
                    { type: 'log', content: '✓ Scene switched successfully', delay: 600, style: 'success' },
                    { type: 'visual', content: 'complete', delay: 0 },
                ]
            }
        ]
    },
    {
        id: 'viral_engine',
        name: 'Viral Engine',
        description: 'Automated Content Multiplication',
        icon: 'Zap',
        prompts: [
            {
                id: 'repurpose_content',
                label: 'Repurpose Video',
                description: 'Turn 1 YouTube video into 20 social posts',
                steps: [
                    { type: 'log', content: 'Ingesting Video Source...', delay: 400, style: 'system' },
                    { type: 'log', content: 'Transcribing Audio (Whisper v3)...', delay: 1000, style: 'info' },
                    { type: 'visual', content: 'transcribing', delay: 0 },
                    { type: 'log', content: 'Extracting Key Insights...', delay: 800, style: 'info' },
                    { type: 'log', content: 'Generating Twitter Thread (1/12)...', delay: 600, style: 'info' },
                    { type: 'log', content: 'Generating LinkedIn Article...', delay: 600, style: 'info' },
                    { type: 'visual', content: 'generating', delay: 0 },
                    { type: 'log', content: 'Content Pack Ready. 24 Assets Created.', delay: 800, style: 'success' },
                    { type: 'visual', content: 'complete', delay: 0 },
                ]
            },
            {
                id: 'schedule_posts',
                label: 'Schedule Posts',
                description: 'Optimal timing for maximum reach',
                steps: [
                    { type: 'log', content: 'Analyzing audience activity patterns...', delay: 400, style: 'system' },
                    { type: 'visual', content: 'analyzing', delay: 0 },
                    { type: 'log', content: 'Peak engagement: Tue/Thu 9-11am, 7-9pm', delay: 700, style: 'info' },
                    { type: 'log', content: 'Scheduling 24 posts across next 7 days...', delay: 800, style: 'info' },
                    { type: 'log', content: '  Twitter: 12 posts scheduled', delay: 400, style: 'info' },
                    { type: 'log', content: '  LinkedIn: 4 posts scheduled', delay: 400, style: 'info' },
                    { type: 'log', content: '  Instagram: 8 posts scheduled', delay: 400, style: 'info' },
                    { type: 'visual', content: 'complete', delay: 0 },
                    { type: 'log', content: '✓ Content calendar created', delay: 500, style: 'success' },
                ]
            }
        ]
    }
];
