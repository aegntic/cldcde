-- Graphiti-inspired Memory System for cldcde.cc
-- Tracks platform evolution with zero new services

-- Memory Episodes (What happened)
CREATE TABLE IF NOT EXISTS memory_episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_type TEXT NOT NULL CHECK (episode_type IN ('architecture_change', 'feature_addition', 'resource_update', 'user_interaction')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  entities JSONB DEFAULT '[]',
  relationships JSONB DEFAULT '[]',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  importance INTEGER DEFAULT 1 CHECK (importance >= 1 AND importance <= 5)
);

-- Memory Entities (Things we track)
CREATE TABLE IF NOT EXISTS memory_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('service', 'feature', 'extension', 'user', 'concept')),
  name TEXT NOT NULL,
  description TEXT,
  properties JSONB DEFAULT '{}',
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(entity_type, name)
);

-- Memory Relationships (How things connect)
CREATE TABLE IF NOT EXISTS memory_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_entity_id UUID REFERENCES memory_entities(id) ON DELETE CASCADE,
  target_entity_id UUID REFERENCES memory_entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('replaced_by', 'depends_on', 'created_by', 'similar_to', 'evolved_from')),
  properties JSONB DEFAULT '{}',
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_from_episode UUID REFERENCES memory_episodes(id)
);

-- Memory Insights (Patterns and learnings)
CREATE TABLE IF NOT EXISTS memory_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insight_type TEXT NOT NULL CHECK (insight_type IN ('pattern', 'milestone', 'trend', 'achievement')),
  title TEXT NOT NULL,
  description TEXT,
  evidence JSONB DEFAULT '[]',
  confidence NUMERIC(3,2) DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_episodes_type_time ON memory_episodes(episode_type, occurred_at DESC);
CREATE INDEX idx_entities_type_active ON memory_entities(entity_type, is_active);
CREATE INDEX idx_relationships_temporal ON memory_relationships(valid_from, valid_until);
CREATE INDEX idx_insights_type ON memory_insights(insight_type);

-- Initial memory: Record the architecture simplification
INSERT INTO memory_episodes (episode_type, content, metadata, occurred_at, importance) VALUES
('architecture_change', 
 'Reduced platform architecture from 10+ services to just 2 (Supabase + Cloudflare)',
 '{
   "before": ["Neo4j", "Cloudflare D1", "Upstash Redis", "Meilisearch", "Supabase", "Sentry", "Grafana", "Workers", "Pages", "R2"],
   "after": ["Supabase", "Cloudflare"],
   "benefits": {
     "cost_reduction": "90%",
     "complexity_reduction": "85%",
     "deployment_time": "5 minutes vs 1 hour",
     "maintenance": "Near zero"
   }
 }'::jsonb,
 '2025-06-29T12:00:00Z',
 5);

-- Admin panel support
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Featured content management
CREATE TABLE IF NOT EXISTS featured_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL CHECK (content_type IN ('extension', 'mcp', 'announcement', 'resource')),
  content_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_featured_active_priority ON featured_content(is_active, priority DESC);

-- Grant admin to first user (you!)
UPDATE profiles SET is_admin = true WHERE id = (SELECT id FROM profiles ORDER BY created_at LIMIT 1);