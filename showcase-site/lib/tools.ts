export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  stars: number;
  forks: number;
  price: number;
  currency: string;
  period: string;
  tier: 'free' | 'premium' | 'enterprise';
  source: string;
  keywords: string[];
}

export const tools: Tool[] = [
  {
    id: 'OBS_CTRL',
    name: 'OBS Studio Control',
    description: 'Interactive OBS Studio control menu with real-time status monitoring and automation. Complete scene management, stream health monitoring, and chat integration.',
    category: 'Media Automation',
    stars: 1247,
    forks: 342,
    price: 49.99,
    currency: 'USD',
    period: 'one-time',
    tier: 'premium',
    source: 'https://github.com/aegntic/cldcde/tree/main/plugins/obs-studio-control',
    keywords: ['obs', 'streaming', 'recording', 'media', 'control', 'automation']
  },
  {
    id: 'YT_FREE',
    name: 'YouTube Creator',
    description: 'Free YouTube Creator toolkit with basic channel management and analytics. Includes video upload automation, metadata optimization, and analytics dashboard.',
    category: 'Media Automation',
    stars: 892,
    forks: 234,
    price: 0,
    currency: 'USD',
    period: 'forever',
    tier: 'free',
    source: 'https://github.com/aegntic/cldcde/tree/main/plugins/youtube-creator',
    keywords: ['youtube', 'creator', 'video', 'content', 'automation', 'api', 'free']
  },
  {
    id: 'SOTA_TMP',
    name: 'SOTA Template Suite',
    description: 'Performance-First Solid Design Templates - professional template system with GPU acceleration, lazy loading, and code splitting for optimal performance.',
    category: 'Design Tools',
    stars: 634,
    forks: 178,
    price: 29,
    currency: 'USD',
    period: 'monthly',
    tier: 'premium',
    source: 'https://github.com/aegntic/cldcde/tree/main/plugins/sota-template-suite',
    keywords: ['templates', 'design', 'performance', 'solid-design', 'web']
  },
  {
    id: 'EMERG_AI',
    name: 'Emergent Capability Suite',
    description: 'Advanced AI capability development and synthesis tools. Build emergent AI behaviors with automated testing and capability synthesis.',
    category: 'AI Tools',
    stars: 521,
    forks: 156,
    price: 39,
    currency: 'USD',
    period: 'monthly',
    tier: 'premium',
    source: 'https://github.com/aegntic/cldcde/tree/main/plugins/emergent-capability-suite',
    keywords: ['ai', 'capabilities', 'emergence', 'development', 'synthesis']
  },
  {
    id: 'FARTNODE',
    name: 'Fartnode Orchestrator',
    description: 'Viral automation ecosystem with coordinated multi-agent workflows. Orchestrate complex automation across multiple platforms.',
    category: 'Automation',
    stars: 743,
    forks: 201,
    price: 49,
    currency: 'USD',
    period: 'monthly',
    tier: 'premium',
    source: 'https://github.com/aegntic/cldcde/tree/main/plugins/fartnode-orchestrator-suite',
    keywords: ['automation', 'viral', 'orchestration', 'multi-agent', 'workflows']
  },
  {
    id: 'HYPER_LIQ',
    name: 'Hyperliquid Risk Monitor',
    description: 'Real-time risk monitoring system for live trading with automated alerts. Monitor positions, track PnL, and get instant risk notifications.',
    category: 'Finance',
    stars: 412,
    forks: 98,
    price: 79,
    currency: 'USD',
    period: 'monthly',
    tier: 'premium',
    source: 'https://github.com/aegntic/cldcde/tree/main/plugins/hyperliquid-risk-monitor',
    keywords: ['trading', 'risk', 'monitoring', 'hyperliquid', 'finance', 'alerts']
  },
  {
    id: 'RMT_DBG',
    name: 'Remote Visual Debugger',
    description: 'Comprehensive remote debugging toolkit for browser applications and React development. Visual debugging with real-time state inspection.',
    category: 'Development Tools',
    stars: 589,
    forks: 167,
    price: 35,
    currency: 'USD',
    period: 'monthly',
    tier: 'premium',
    source: 'https://github.com/aegntic/cldcde/tree/main/plugins/remote-visual-debugger',
    keywords: ['debugging', 'remote', 'visual', 'browser', 'react', 'development']
  },
  {
    id: 'D3MO_VID',
    name: 'D3MO Video Generator',
    description: 'Professional video generation with Remotion and advanced animation techniques. Create demos, presentations, and promotional videos.',
    category: 'Media Creation',
    stars: 678,
    forks: 189,
    price: 59,
    currency: 'USD',
    period: 'monthly',
    tier: 'premium',
    source: 'https://github.com/aegntic/cldcde/tree/main/plugins/d3mo-video-generator',
    keywords: ['video', 'generation', 'remotion', 'animation', 'demos']
  },
  {
    id: 'VIRAL_AUTO',
    name: 'Viral Automation Suite',
    description: 'Build cross-platform social media automation workflows for viral growth. Schedule content, analyze performance, and automate engagement.',
    category: 'Marketing',
    stars: 834,
    forks: 245,
    price: 45,
    currency: 'USD',
    period: 'monthly',
    tier: 'premium',
    source: 'https://github.com/aegntic/cldcde/tree/main/plugins/viral-automation-suite',
    keywords: ['viral', 'social-media', 'automation', 'marketing', 'growth']
  },
  {
    id: 'WEB_GEN',
    name: 'Website Gen Automation',
    description: 'Intelligent website generation and distribution workflow with animation studio. SEO optimization, Cloudflare deployment, and performance monitoring.',
    category: 'Web Development',
    stars: 921,
    forks: 276,
    price: 69,
    currency: 'USD',
    period: 'monthly',
    tier: 'premium',
    source: 'https://github.com/aegntic/cldcde/tree/main/plugins/website-gen-automation',
    keywords: ['website', 'generation', 'automation', 'seo', 'deployment', 'cloudflare']
  },
  {
    id: 'YT_PRO',
    name: 'YouTube Creator Pro',
    description: 'Professional YouTube Creator toolkit with AI-powered content optimization, intelligent thumbnail generation, and automated workflow orchestration.',
    category: 'AI Media Automation',
    stars: 1567,
    forks: 423,
    price: 199.99,
    currency: 'USD',
    period: 'one-time',
    tier: 'enterprise',
    source: 'https://github.com/aegntic/cldcde/tree/main/plugins/youtube-creator-pro',
    keywords: ['youtube', 'creator-pro', 'video', 'ai', 'automation', 'thumbnail', 'enterprise']
  }
];

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  category: string;
  stars: number;
  forks: number;
  language: string;
  source: string;
}

export const mcpServers: MCPServer[] = [
  {
    id: 'N8N_PRO',
    name: 'n8n-pro MCP',
    description: 'Advanced workflow automation with n8n integration. Build complex automation pipelines with visual workflow designer.',
    category: 'Automation',
    stars: 2341,
    forks: 567,
    language: 'TypeScript',
    source: 'mcp-servers/aegntic-mcp/n8n-pro'
  },
  {
    id: 'OBS_RAG',
    name: 'Obsidian Elite RAG',
    description: 'Elite Retrieval-Augmented Generation for Obsidian notes. Advanced semantic search and knowledge synthesis.',
    category: 'Knowledge Management',
    stars: 1876,
    forks: 423,
    language: 'Python',
    source: 'mcp-servers/aegntic-mcp/obsidian-elite-rag'
  },
  {
    id: 'RUVECTOR',
    name: 'RuVector DB',
    description: 'High-performance vector database for semantic search and AI applications. 150x faster search with HNSW indexing.',
    category: 'Database',
    stars: 3245,
    forks: 789,
    language: 'JavaScript',
    source: 'mcp-servers/aegntic-mcp/shared/ruvector'
  },
  {
    id: 'GRAPHITI',
    name: 'Graphiti MCP',
    description: 'Graph-based knowledge management with temporal reasoning. Track relationships and their evolution over time.',
    category: 'Knowledge Graph',
    stars: 1432,
    forks: 345,
    language: 'Python',
    source: 'mcp-servers/aegntic-mcp/graphiti-mcp'
  },
  {
    id: 'CLAUDE_EXP',
    name: 'Claude Export MCP',
    description: 'Export and archive Claude conversations with metadata preservation. Search, tag, and organize your AI interactions.',
    category: 'Utilities',
    stars: 987,
    forks: 234,
    language: 'TypeScript',
    source: 'mcp-servers/aegntic-mcp/claude-export-mcp'
  },
  {
    id: 'AEGNT_27',
    name: 'Aegnt-27 Core',
    description: 'Core MCP server with advanced AI agent orchestration. Multi-agent coordination with consensus mechanisms.',
    category: 'Core',
    stars: 4521,
    forks: 1023,
    language: 'TypeScript',
    source: 'mcp-servers/aegntic-mcp/aegnt-27'
  }
];
