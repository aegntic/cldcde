export const products = [
    {
        id: 'claude-elite-v2',
        name: 'CLAUDE-ELITE-V2',
        description: 'Advanced AI model with enhanced reasoning capabilities. Optimized for complex code generation, architectural decisions, and multi-step problem solving.',
        category: 'Featured Models',
        price: 49.99,
        image: '/images/product-elite.png',
        performance: {
            data: [20, 35, 45, 60, 75, 85, 95, 100],
            labels: ['Jan', '25k', '50k', '75k', '100k']
        },
        reviews: [
            { user: 'DevPro', rating: 5 },
            { user: 'CodeMaster', rating: 5 },
            { user: 'AIEnthusiast', rating: 4 },
            { user: 'StartupCTO', rating: 5 }
        ],
        features: [
            'Enhanced reasoning engine',
            'Multi-file context awareness',
            'Intelligent code refactoring',
            'Architecture pattern recognition'
        ],
        downloads: 12500
    },
    {
        id: 'ultraplan-pro',
        name: 'ULTRAPLAN-PRO',
        description: 'Premium strategic planning framework with AI-powered project decomposition, timeline estimation, and resource allocation. Enterprise-grade planning for complex initiatives.',
        category: 'Featured Models',
        price: 79.99,
        image: '/images/logo_ultraplan_pro.png',
        performance: {
            data: [15, 30, 50, 70, 85, 92, 97, 100],
            labels: ['Jan', '25k', '50k', '75k', '100k']
        },
        reviews: [
            { user: 'ProjectLead', rating: 5 },
            { user: 'CTO_Jane', rating: 5 },
            { user: 'AgileCoach', rating: 5 }
        ],
        features: [
            'AI-powered task breakdown',
            'Smart timeline estimation',
            'Resource optimization',
            'Risk assessment matrix'
        ],
        downloads: 8200
    },
    {
        id: 'ultraplan',
        name: 'ULTRAPLAN',
        description: 'Strategic planning tool for developers and teams. Automatically breaks down complex projects into actionable tasks with AI-powered estimation.',
        category: 'Popular Scripts',
        price: 39.99,
        image: '/images/logo_ultraplan_1765002300581.png',
        performance: {
            data: [25, 40, 55, 68, 78, 85, 90, 94],
            labels: ['Jan', '25k', '50k', '75k', '100k']
        },
        reviews: [
            { user: 'SoloFounder', rating: 5 },
            { user: 'DevTeamLead', rating: 4 }
        ],
        features: [
            'Task decomposition',
            'Timeline planning',
            'Milestone tracking',
            'Export to popular tools'
        ],
        downloads: 15600
    },
    {
        id: 'fpef',
        name: 'FPEF',
        description: 'First Principles Execution Framework - A systematic approach to problem-solving that breaks down complex challenges to their fundamental truths. Build solutions from the ground up.',
        category: 'Featured Models',
        price: 59.99,
        image: '/images/logo_fpef_1765002334864.png',
        performance: {
            data: [30, 45, 58, 72, 82, 90, 95, 98],
            labels: ['Jan', '25k', '50k', '75k', '100k']
        },
        reviews: [
            { user: 'SystemsThink', rating: 5 },
            { user: 'PhilosophDev', rating: 5 },
            { user: 'ArchitectX', rating: 4 }
        ],
        features: [
            'First principles analysis',
            'Assumption validation',
            'Root cause identification',
            'Evidence-driven decisions'
        ],
        downloads: 9800
    },
    {
        id: 'viral-27',
        name: 'VIRAL-27',
        description: 'Advanced viral content automation suite. AI-powered content generation, timing optimization, and cross-platform distribution for maximum reach and engagement.',
        category: 'Popular Scripts',
        price: 44.99,
        image: '/images/logo_viral27_1765002355285.png',
        performance: {
            data: [35, 50, 65, 78, 88, 94, 97, 99],
            labels: ['Jan', '25k', '50k', '75k', '100k']
        },
        reviews: [
            { user: 'ContentKing', rating: 5 },
            { user: 'SocialMedia_Pro', rating: 5 }
        ],
        features: [
            'AI content generation',
            'Optimal posting times',
            'Multi-platform sync',
            'Engagement analytics'
        ],
        downloads: 22400
    },
    {
        id: 'aegnt-27',
        name: 'AEGNT-27',
        description: 'Autonomous AI agent framework with advanced reasoning, tool use, and multi-step task execution. Deploy intelligent agents that work independently toward your goals.',
        category: 'Featured Models',
        price: 89.99,
        image: '/images/logo_aegnt27_1765002376575.png',
        performance: {
            data: [20, 38, 55, 70, 82, 91, 96, 99],
            labels: ['Jan', '25k', '50k', '75k', '100k']
        },
        reviews: [
            { user: 'AIResearcher', rating: 5 },
            { user: 'AutomationPro', rating: 5 },
            { user: 'StartupAI', rating: 4 }
        ],
        features: [
            'Multi-step reasoning',
            'Tool use orchestration',
            'Goal-oriented execution',
            'Self-correction capabilities'
        ],
        downloads: 6700
    },
    {
        id: 'prologue',
        name: 'PROLOGUE',
        description: 'Narrative-driven development framework. Write code as stories, document as you build, and create self-explanatory codebases that tell their own story.',
        category: 'Popular Scripts',
        price: 29.99,
        image: '/images/logo_prologue_1765002393629.png',
        performance: {
            data: [28, 42, 55, 67, 78, 86, 92, 95],
            labels: ['Jan', '25k', '50k', '75k', '100k']
        },
        reviews: [
            { user: 'TechWriter', rating: 5 },
            { user: 'DocMaster', rating: 4 }
        ],
        features: [
            'Story-driven development',
            'Auto-documentation',
            'Context-aware comments',
            'Narrative flow analysis'
        ],
        downloads: 11200
    },
    {
        id: 'fartnode',
        name: 'FARTNODE',
        description: 'Fast Async Runtime for Distributed Edge nodes. Lightweight, blazing-fast runtime for deploying serverless functions at the edge with minimal cold starts.',
        category: 'Popular Scripts',
        price: 24.99,
        image: '/images/logo_fartnode_1765002420136.png',
        performance: {
            data: [40, 55, 68, 80, 88, 94, 97, 99],
            labels: ['Jan', '25k', '50k', '75k', '100k']
        },
        reviews: [
            { user: 'EdgeDev', rating: 5 },
            { user: 'ServerlessPro', rating: 4 }
        ],
        features: [
            'Sub-millisecond cold starts',
            'Edge-native runtime',
            'Auto-scaling',
            'Global distribution'
        ],
        downloads: 18500
    },
    {
        id: 'd3mo',
        name: 'D3MO',
        description: 'Dynamic 3D demonstration platform. Create interactive product demos, walkthroughs, and presentations with stunning 3D visuals and smooth animations.',
        category: 'Community',
        price: 34.99,
        image: '/images/logo_d3mo_1765002436051.png',
        performance: {
            data: [32, 48, 60, 72, 82, 89, 94, 97],
            labels: ['Jan', '25k', '50k', '75k', '100k']
        },
        reviews: [
            { user: 'DemoExpert', rating: 5 },
            { user: 'SalesEngineer', rating: 4 }
        ],
        features: [
            'Interactive 3D scenes',
            'Smooth animations',
            'Export to video',
            'Embed anywhere'
        ],
        downloads: 7400
    },
    {
        id: 'obs-control',
        name: 'OBS-CONTROL',
        description: 'Advanced OBS Studio control plugin. Automate streaming workflows, scene switching, and content management with AI-powered production assistance.',
        category: 'Popular Scripts',
        price: 19.99,
        image: '/images/logo_obs_1765002454644.png',
        performance: {
            data: [38, 52, 65, 76, 85, 91, 95, 98],
            labels: ['Jan', '25k', '50k', '75k', '100k']
        },
        reviews: [
            { user: 'Streamer101', rating: 5 },
            { user: 'ContentCreator', rating: 5 },
            { user: 'LiveProducer', rating: 4 }
        ],
        features: [
            'Scene automation',
            'AI-powered switching',
            'Chat integration',
            'Analytics dashboard'
        ],
        downloads: 31200
    },
    {
        id: 'stoa-suite',
        name: 'STOA-SUITE',
        description: 'Philosophy meets technology. A suite of tools for maintaining codebase stability, enforcing stoic coding practices, and managing technical debt with calm precision.',
        category: 'Community',
        price: 45.99,
        image: '/images/logo_stoa_suite.png',
        performance: {
            data: [22, 35, 48, 62, 75, 85, 92, 96],
            labels: ['Jan', '25k', '50k', '75k', '100k']
        },
        reviews: [
            { user: 'StoicCoder', rating: 5 },
            { user: 'TechLead', rating: 5 },
            { user: 'MarcusA', rating: 5 }
        ],
        features: [
            'Debt management',
            'Stability enforcement',
            'Calm error handling',
            'Long-term architecture'
        ],
        downloads: 5400
    },
    {
        id: 'auto-debug-pro',
        name: 'AUTO-DEBUG-PRO',
        description: 'Automated debugging toolkit that identifies and fixes code issues in real-time. Features AI-powered error detection and smart fix suggestions.',
        category: 'Popular Scripts',
        price: 29.99,
        image: '/images/product-debug.png',
        performance: {
            data: [30, 45, 55, 70, 80, 88, 92, 95],
            labels: ['Jan', '25k', '50k', '75k', '100k']
        },
        reviews: [
            { user: 'BugHunter', rating: 5 },
            { user: 'QALead', rating: 4 },
            { user: 'FullStack', rating: 5 }
        ],
        features: [
            'Real-time error detection',
            'Automated fix suggestions',
            'Stack trace analysis',
            'Performance bottleneck identification'
        ],
        installation: [
            'Install via npm: npm install auto-debug-pro',
            'Add to your project configuration',
            'Run with: npx auto-debug'
        ],
        downloads: 8750
    }
]

export const categories = [
    {
        id: 'featured-models',
        name: 'Featured Models',
        description: 'Premium AI models and configurations',
        image: '/images/category-featured.png'
    },
    {
        id: 'popular-scripts',
        name: 'Popular Scripts',
        description: 'Top-rated automation scripts',
        image: '/images/category-scripts.png'
    },
    {
        id: 'community',
        name: 'Community',
        description: 'User-contributed tools and plugins',
        image: '/images/category-community.png'
    },
    {
        id: 'documentation',
        name: 'Documentation',
        description: 'Guides, tutorials, and references',
        image: '/images/category-docs.png'
    }
]
