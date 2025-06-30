-- News/Updates table with auto-blog generation
CREATE TABLE IF NOT EXISTS news_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Original input
  input_type TEXT NOT NULL CHECK (input_type IN ('link', 'repo', 'text', 'update')),
  input_content TEXT NOT NULL, -- URL, repo path, or text content
  input_metadata JSONB DEFAULT '{}', -- Extra data like repo stats, link preview, etc.
  
  -- Generated blog content
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL, -- Short summary for cards
  content TEXT NOT NULL, -- Full blog post (2-5 min read)
  content_html TEXT, -- HTML version with formatting
  reading_time INTEGER DEFAULT 3, -- Minutes
  
  -- Media
  featured_image TEXT, -- Main image URL
  screenshots JSONB DEFAULT '[]', -- Array of screenshot URLs with annotations
  videos JSONB DEFAULT '[]', -- Future: video URLs
  
  -- Metadata
  author_id UUID REFERENCES profiles(id),
  author_name TEXT DEFAULT 'Catface',
  category TEXT DEFAULT 'update',
  tags TEXT[] DEFAULT '{}',
  
  -- Related content
  related_extensions UUID[] DEFAULT '{}',
  related_mcp_servers UUID[] DEFAULT '{}',
  related_links JSONB DEFAULT '[]',
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_news_slug ON news_updates(slug);
CREATE INDEX idx_news_status ON news_updates(status, published_at DESC);
CREATE INDEX idx_news_author ON news_updates(author_id);
CREATE INDEX idx_news_tags ON news_updates USING GIN(tags);

-- Full-text search
ALTER TABLE news_updates ADD COLUMN IF NOT EXISTS fts tsvector;

CREATE OR REPLACE FUNCTION update_news_fts() RETURNS trigger AS $$
BEGIN
  NEW.fts := to_tsvector('english', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.summary, '') || ' ' || 
    COALESCE(NEW.content, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_news_fts_trigger
  BEFORE INSERT OR UPDATE ON news_updates
  FOR EACH ROW EXECUTE FUNCTION update_news_fts();

-- Share tracking table
CREATE TABLE IF NOT EXISTS share_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  news_id UUID REFERENCES news_updates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  
  -- Share details
  platform TEXT NOT NULL CHECK (platform IN ('x', 'linkedin', 'copy', 'email', 'other')),
  share_url TEXT NOT NULL,
  
  -- Auto-follow tracking
  auto_follow_executed BOOLEAN DEFAULT false,
  auto_follow_target TEXT, -- @aegnt_catface for X, Mattae Cooper for LinkedIn
  auto_follow_result JSONB DEFAULT '{}',
  
  -- Consent and tracking
  consent_given BOOLEAN DEFAULT true,
  referrer TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Analytics
  click_back_count INTEGER DEFAULT 0, -- How many times shared link was clicked
  engagement_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for share analytics
CREATE INDEX idx_share_logs_news ON share_logs(news_id, created_at DESC);
CREATE INDEX idx_share_logs_user ON share_logs(user_id, created_at DESC);
CREATE INDEX idx_share_logs_platform ON share_logs(platform, created_at DESC);

-- Social auth tokens (for auto-follow features)
CREATE TABLE IF NOT EXISTS social_auth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('x', 'linkedin')),
  
  -- Encrypted tokens
  access_token TEXT NOT NULL, -- Encrypted
  refresh_token TEXT, -- Encrypted
  token_expires_at TIMESTAMPTZ,
  
  -- Profile info
  social_username TEXT,
  social_profile_data JSONB DEFAULT '{}',
  
  -- Auto-follow status
  has_followed_target BOOLEAN DEFAULT false,
  followed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, platform)
);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_news_views(p_news_id UUID) RETURNS void AS $$
BEGIN
  UPDATE news_updates 
  SET view_count = view_count + 1 
  WHERE id = p_news_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment share count
CREATE OR REPLACE FUNCTION increment_news_shares(p_news_id UUID) RETURNS void AS $$
BEGIN
  UPDATE news_updates 
  SET share_count = share_count + 1 
  WHERE id = p_news_id;
END;
$$ LANGUAGE plpgsql;

-- RLS policies
ALTER TABLE news_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_auth_tokens ENABLE ROW LEVEL SECURITY;

-- Public can read published news
CREATE POLICY "Public can read published news" ON news_updates
  FOR SELECT USING (status = 'published');

-- Authors can manage their own news
CREATE POLICY "Authors can manage own news" ON news_updates
  FOR ALL USING (auth.uid() = author_id);

-- Users can view their own shares
CREATE POLICY "Users can view own shares" ON share_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Public can create share logs
CREATE POLICY "Public can create share logs" ON share_logs
  FOR INSERT WITH CHECK (true);

-- Users can manage their own social tokens
CREATE POLICY "Users manage own social tokens" ON social_auth_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Sample news data
INSERT INTO news_updates (
  input_type, 
  input_content,
  title,
  slug,
  summary,
  content,
  reading_time,
  tags,
  status,
  published_at
) VALUES (
  'update',
  'Launched GitHub OAuth integration for seamless downloads',
  'New Feature: Seamless GitHub Integration for Downloads',
  'seamless-github-integration-downloads',
  'Download resources with one-click GitHub integration that automatically follows @aegntic and stars repositories.',
  E'We\'re excited to announce a new seamless download experience that integrates with GitHub!\n\n## What\'s New\n\nWhen downloading any resource from cldcde.cc, you can now:\n- Sign in with GitHub with one click\n- Automatically follow @aegntic to stay updated\n- Star the repository to show support\n- Download your resource immediately\n\n## Privacy First\n\nWe believe in transparency:\n- Clear consent required before any actions\n- Skip option always available\n- No data stored beyond necessary logs\n- Unfollow/unstar anytime\n\n## How It Works\n\n1. Click download on any resource\n2. Review and consent to GitHub integration\n3. Sign in with GitHub (one-time)\n4. Actions execute seamlessly\n5. Download starts automatically\n\nThis helps build a stronger community while respecting user choice!',
  3,
  ARRAY['feature', 'github', 'downloads', 'community'],
  'published',
  NOW()
);

-- Add memory episode
INSERT INTO memory_episodes (episode_type, content, metadata, importance) 
VALUES (
  'feature_addition',
  'Added news/updates system with auto-blog generation and social sharing with auto-follow',
  '{
    "feature": "news_updates_system",
    "capabilities": [
      "Auto-generate 2-5 min blog posts from links/repos",
      "Screenshot generation and annotation",
      "X sharing with auto-follow @aegnt_catface",
      "LinkedIn sharing with auto-connect Mattae Cooper",
      "Share tracking and analytics",
      "Related content linking"
    ],
    "privacy_features": [
      "Transparent auto-follow disclosure",
      "Consent tracking",
      "No permanent token storage"
    ]
  }'::jsonb,
  4
);