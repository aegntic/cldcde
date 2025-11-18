-- OpenRouter Deep Dive Review Seed Data
-- This creates the first "Top Tier" and "Dev Approved" feature review

-- First, ensure we have the necessary tables and types
-- Note: This assumes your schema includes reviews/posts table

-- Insert the OpenRouter deep dive review
INSERT INTO posts (
    id,
    title,
    slug,
    content_path,
    excerpt,
    author,
    status,
    tags,
    badges,
    rating,
    published_at,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'OpenRouter Deep Dive: The Switzerland of AI Model Access',
    'openrouter-deep-dive',
    '/content/openrouter-deep-dive.md',
    'OpenRouter has emerged as a critical infrastructure layer in the AI development ecosystem, offering unified access to over 200+ language models through a single API. This deep dive examines why OpenRouter has become an essential tool for developers building AI-powered applications.',
    'Platform Team',
    'published',
    ARRAY['ai-infrastructure', 'api', 'model-access', 'developer-tools', 'deep-dive'],
    ARRAY['top-tier', 'dev-approved'],
    9.2,
    NOW(),
    NOW(),
    NOW()
);

-- Add review metadata
INSERT INTO review_metadata (
    post_id,
    review_type,
    pros,
    cons,
    best_for,
    avoid_if,
    verdict
) VALUES (
    (SELECT id FROM posts WHERE slug = 'openrouter-deep-dive'),
    'platform-service',
    ARRAY[
        'Unmatched model selection (200+ models)',
        'Developer-first approach with excellent DX',
        'Transparent, fair pricing model',
        'Excellent reliability (99.9%+ uptime)',
        'Strong community trust and support'
    ],
    ARRAY[
        'Latency overhead (10-50ms added)',
        'Feature parity lag with new model features',
        'Additional dependency in critical path',
        'Cost markup (10-20%) can add up at scale'
    ],
    ARRAY[
        'Startups and indie developers',
        'Multi-model applications',
        'Rapid prototyping',
        'Cost-conscious teams',
        'Teams valuing flexibility'
    ],
    ARRAY[
        'You need absolute minimum latency',
        'Using provider-specific features extensively',
        'Have massive scale with direct relationships',
        'Require on-premise deployment'
    ],
    'Essential infrastructure for AI development. Like AWS for cloud or Stripe for payments, OpenRouter simplifies AI model access in a way that accelerates innovation.'
);

-- Add feature highlights
INSERT INTO feature_highlights (
    post_id,
    feature,
    description,
    code_example
) VALUES 
(
    (SELECT id FROM posts WHERE slug = 'openrouter-deep-dive'),
    'Unified API',
    'Single integration for all models',
    'const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  headers: { "Authorization": `Bearer ${KEY}` },
  body: JSON.stringify({
    "model": "anthropic/claude-3-opus", // or any model
    "messages": [{"role": "user", "content": "Hello!"}]
  })
});'
),
(
    (SELECT id FROM posts WHERE slug = 'openrouter-deep-dive'),
    'Automatic Fallbacks',
    'Seamlessly switch between models if one fails',
    NULL
),
(
    (SELECT id FROM posts WHERE slug = 'openrouter-deep-dive'),
    'Smart Routing',
    'Automatically selects the best available model endpoint',
    NULL
);

-- Add related links
INSERT INTO related_links (
    post_id,
    title,
    url,
    link_type
) VALUES 
(
    (SELECT id FROM posts WHERE slug = 'openrouter-deep-dive'),
    'OpenRouter Documentation',
    'https://openrouter.ai/docs',
    'documentation'
),
(
    (SELECT id FROM posts WHERE slug = 'openrouter-deep-dive'),
    'OpenRouter API Reference',
    'https://openrouter.ai/api/v1',
    'api-reference'
),
(
    (SELECT id FROM posts WHERE slug = 'openrouter-deep-dive'),
    'OpenRouter Pricing',
    'https://openrouter.ai/pricing',
    'pricing'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_badges ON posts USING GIN(badges);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);