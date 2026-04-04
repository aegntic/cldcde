import { Product } from './types';

// Fallback placeholder image
export const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzFhMWEyZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q0xEQ0RFPC90ZXh0Pjwvc3ZnPg==';

// Unsplash image URLs for products - reliable, high-quality photos
const UNSPLASH_IMAGES = {
  // Code/Debugging - laptop with code
  debugging: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=400&fit=crop',
  // AI/Technology - futuristic tech
  ai: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=400&fit=crop',
  // Planning/Strategy - notebook planning
  planning: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=400&fit=crop',
  // Finance/Data - data visualization
  finance: 'https://images.unsplash.com/photo-1551288049-685ab0b6e8c0?w=400&h=400&fit=crop',
  // Social/Media - social network
  social: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop',
  // Robot/AI agent
  robot: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=400&fit=crop',
  // Writing/Documentation
  writing: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=400&fit=crop',
  // Demo/Presentation
  demo: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=400&fit=crop',
  // Streaming/Broadcast
  streaming: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=400&h=400&fit=crop',
  // Memory/Brain
  memory: 'https://images.unsplash.com/photo-1559757175-9e351c9a1301?w=400&h=400&fit=crop',
  // Lightning/Speed
  speed: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=400&h=400&fit=crop',
  // Enterprise/Dashboard
  enterprise: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop',
  // Architecture/Stability
  architecture: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
  // Default placeholder for test products
  placeholder: 'https://images.unsplash.com/photo-1618761714954-0b8cd0026356?w=400&h=400&fit=crop',
};

// ============ LAUNCH PRICING SYSTEM ============
// Phase 1: $1 Early Bird (first 36.9 hours from launch)
// Phase 2: $2 (after early bird ends, for 1 week)
// Phase 3: $5 (until Jan 1st 2025)
// Phase 4: Full prices (after Jan 1st 2025)

// Set launch time to now (this would be set to your actual launch date in production)
const LAUNCH_DATE = new Date('2025-12-08T18:48:00+11:00'); // Current time as launch
const EARLY_BIRD_HOURS = 36.9;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const JAN_1_2025 = new Date('2025-01-01T00:00:00+11:00');

export interface PricingPhase {
  phase: 'early_bird' | 'phase_2' | 'phase_3' | 'full_price';
  currentPrice: number;
  label: string;
  countdown: { hours: number; minutes: number; seconds: number } | null;
  nextPhaseLabel: string | null;
}

export const getPricingPhase = (): PricingPhase => {
  const now = new Date();
  const earlyBirdEnd = new Date(LAUNCH_DATE.getTime() + EARLY_BIRD_HOURS * 60 * 60 * 1000);
  const phase2End = new Date(earlyBirdEnd.getTime() + WEEK_MS);

  // Phase 1: Early Bird $1
  if (now < earlyBirdEnd) {
    const diff = earlyBirdEnd.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      phase: 'early_bird',
      currentPrice: 1,
      label: '🚀 EARLY BIRD LAUNCH SPECIAL',
      countdown: { hours, minutes, seconds },
      nextPhaseLabel: 'Price goes to $2'
    };
  }

  // Phase 2: $2 for one week
  if (now < phase2End) {
    const diff = phase2End.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      phase: 'phase_2',
      currentPrice: 2,
      label: '⚡ LAUNCH WEEK SPECIAL',
      countdown: { hours, minutes, seconds },
      nextPhaseLabel: 'Price goes to $5'
    };
  }

  // Phase 3: $5 until Jan 1st
  if (now < JAN_1_2025) {
    const diff = JAN_1_2025.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return {
      phase: 'phase_3',
      currentPrice: 5,
      label: '🎄 HOLIDAY PRICING',
      countdown: { hours: days * 24 + hours, minutes: 0, seconds: 0 },
      nextPhaseLabel: 'Full prices Jan 1st'
    };
  }

  // Phase 4: Full prices
  return {
    phase: 'full_price',
    currentPrice: -1, // Use original price
    label: null,
    countdown: null,
    nextPhaseLabel: null
  };
};

// Bundle discount calculation (still applies on top of launch pricing)
export const calculateBundleDiscount = (itemCount: number): number => {
  if (itemCount >= 3) return 0.5; // 50% off for 3+ items
  if (itemCount >= 2) return 0.25; // 25% off for 2 items
  return 0;
};

export const getFlashSaleProductId = (): string | null => {
  // Return a random product ID for flash sale, or specific one
  return '1'; // FPEF
};

export const getFlashSaleTimeRemaining = (): { hours: number; minutes: number; seconds: number } => {
  const now = new Date();
  const end = new Date();
  end.setHours(23, 59, 59, 999); // End of day
  const diff = end.getTime() - now.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'FPEF',
    description: 'First Principles Debugging - Find root causes fast with systematic problem-solving.',
    price: 24.99,
    category: 'Prompts',
    image: UNSPLASH_IMAGES.debugging,
    rating: 4.9,
    features: ['Root cause analysis', 'Hypothesis testing', 'Works with any AI', 'Step-by-step framework']
  },
  {
    id: '2',
    name: 'PROLOGUE',
    description: 'Auto-generate documentation as you code. Never explain your work twice.',
    price: 22.99,
    category: 'Prompts',
    image: UNSPLASH_IMAGES.writing,
    rating: 4.7,
    features: ['Auto-documentation', 'Story-driven dev', 'Context-aware comments', 'Markdown export']
  },
  {
    id: '3',
    name: 'CONTEXT-TRACKER',
    description: 'Never lose context in long sessions. Tracks decisions, syncs across tools.',
    price: 26.99,
    category: 'MCPs',
    image: UNSPLASH_IMAGES.memory,
    rating: 4.6,
    features: ['Session tracking', 'Decision logging', 'Cross-tool sync', 'Privacy-first']
  },
  {
    id: '4',
    name: 'ULTRAPLAN',
    description: 'Turn "I need to build X" into tasks you can actually do. AI project breakdown.',
    price: 29.99,
    category: 'Workflows',
    image: UNSPLASH_IMAGES.planning,
    rating: 4.8,
    features: ['Task decomposition', 'Time estimates', 'Milestone tracking', 'Export anywhere']
  },
  {
    id: '5',
    name: 'DEBUG-BUDDY',
    description: 'Paste an error, get a fix. AI that actually understands your stack traces.',
    price: 21.99,
    category: 'Skills',
    image: UNSPLASH_IMAGES.debugging,
    rating: 4.7,
    features: ['Stack trace analysis', 'Fix suggestions', 'Context-aware', 'Learns patterns']
  },
  {
    id: '6',
    name: 'OBS-CONTROL',
    description: 'Automate your streams. Scene switching and chat commands without complexity.',
    price: 27.99,
    category: 'Plugins',
    image: UNSPLASH_IMAGES.streaming,
    rating: 4.6,
    features: ['Scene automation', 'Chat integration', 'AI switching', 'Analytics']
  },
  {
    id: '7',
    name: 'VIRAL-27',
    description: 'Turn one video into 20 social posts. AI content multiplication.',
    price: 29.99,
    category: 'Skills',
    image: UNSPLASH_IMAGES.social,
    rating: 4.6,
    features: ['Content multiplication', 'Multi-platform', 'Optimal timing', 'Brand voice']
  },
  {
    id: '8',
    name: 'D3MO',
    description: 'Create stunning product demos in minutes. 3D visuals, embed anywhere.',
    price: 24.99,
    category: 'Plugins',
    image: UNSPLASH_IMAGES.demo,
    rating: 4.8,
    features: ['3D scenes', 'Animation engine', 'Video export', 'Embed anywhere']
  },
  {
    id: '9',
    name: 'AEGNT-27',
    description: 'Spawn AI agents that work for you. Multi-step automation with goals.',
    price: 27.99,
    category: 'MCPs',
    image: UNSPLASH_IMAGES.robot,
    rating: 4.9,
    features: ['Goal-oriented agents', 'Tool orchestration', 'Self-correction', 'Delegation']
  },
  {
    id: '10',
    name: 'STOA-SUITE',
    description: 'Technical debt management. Track, prioritize, and pay down debt calmly.',
    price: 26.99,
    category: 'MCPs',
    image: UNSPLASH_IMAGES.architecture,
    rating: 4.7,
    features: ['Debt tracking', 'Priority scoring', 'Refactor planning', 'Team dashboards']
  },
  {
    id: '11',
    name: 'FARTNODE',
    description: 'Blazing fast edge runtime. Sub-millisecond cold starts for serverless.',
    price: 23.99,
    category: 'Plugins',
    image: UNSPLASH_IMAGES.speed,
    rating: 4.5,
    features: ['Sub-ms cold starts', 'Edge-native', 'Auto-scaling', 'Easy deploy']
  },
  {
    id: '12',
    name: 'ULTRAPLAN-PRO',
    description: 'Enterprise planning. Risk assessment, resources, team coordination.',
    price: 29.99,
    category: 'Workflows',
    image: UNSPLASH_IMAGES.enterprise,
    rating: 4.8,
    features: ['Risk matrix', 'Resource planning', 'Team sync', 'Roadmap export']
  },
  {
    id: 'test-1',
    name: 'Extreme Hemorrhoid Cream',
    description: 'Instant relief for backend developers. Apply directly to the affected area.',
    price: 0.01,
    category: 'Plugins',
    image: UNSPLASH_IMAGES.placeholder,
    rating: 5.0,
    features: ['Instant relief', 'Cooling sensation', 'Backend optimized', 'Discrete shipping']
  },
  {
    id: 'test-2',
    name: 'How to Talk to Girls PDF',
    description: 'The missing manual for engineers. Includes flowcharts and conversation trees.',
    price: 0.02,
    category: 'Skills',
    image: UNSPLASH_IMAGES.placeholder,
    rating: 1.2,
    features: ['Conversation trees', 'Eye contact algo', 'Panic button', 'Friendzone avoidance']
  },
  {
    id: 'test-3',
    name: 'Used Bath Water (Jar)',
    description: 'Authentic gamer girl bath water. High viscosity. Do not drink.',
    price: 0.05,
    category: 'MCPs',
    image: UNSPLASH_IMAGES.placeholder,
    rating: 4.9,
    features: ['High viscosity', 'Authentic source', 'Collectible jar', 'DNA included']
  }
];

export const SYSTEM_INSTRUCTION = `You are CLD-9, an AI concierge for cldcde.cc - a marketplace for developer tools.
Be helpful and friendly. Mention the Early Bird $1 launch special! Keep responses short and actionable.`;

export const SDK_SYSTEM_INSTRUCTION = `You are the Claude Code SDK Terminal.
Show what these tools can do. Be concise. Output terminal-style responses.`;
