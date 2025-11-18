-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (managed by Supabase Auth, but we extend it)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  github_username TEXT,
  twitter_username TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extensions table
CREATE TABLE IF NOT EXISTS extensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  platform TEXT[] NOT NULL DEFAULT '{}',
  version TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  downloads INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  repository TEXT,
  homepage TEXT,
  install_script TEXT,
  readme TEXT,
  metadata JSONB DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MCP Servers table
CREATE TABLE IF NOT EXISTS mcp_servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  version TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  downloads INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  repository TEXT,
  homepage TEXT,
  install_command TEXT,
  readme TEXT,
  metadata JSONB DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User installations
CREATE TABLE IF NOT EXISTS installations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  extension_id UUID REFERENCES extensions(id) ON DELETE CASCADE,
  mcp_server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_extension UNIQUE(user_id, extension_id),
  CONSTRAINT unique_user_mcp UNIQUE(user_id, mcp_server_id),
  CONSTRAINT check_single_type CHECK (
    (extension_id IS NOT NULL AND mcp_server_id IS NULL) OR
    (extension_id IS NULL AND mcp_server_id IS NOT NULL)
  )
);

-- Ratings and reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  extension_id UUID REFERENCES extensions(id) ON DELETE CASCADE,
  mcp_server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_extension_review UNIQUE(user_id, extension_id),
  CONSTRAINT unique_user_mcp_review UNIQUE(user_id, mcp_server_id),
  CONSTRAINT check_single_review_type CHECK (
    (extension_id IS NOT NULL AND mcp_server_id IS NULL) OR
    (extension_id IS NULL AND mcp_server_id IS NOT NULL)
  )
);

-- Forums
CREATE TABLE IF NOT EXISTS forums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  post_count INTEGER DEFAULT 0,
  last_post_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum posts
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forum_id UUID REFERENCES forums(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  last_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments (for posts)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- News/Blog posts
CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  featured_image TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_extensions_category ON extensions(category);
CREATE INDEX idx_extensions_author ON extensions(author_id);
CREATE INDEX idx_extensions_downloads ON extensions(downloads DESC);
CREATE INDEX idx_extensions_rating ON extensions(rating DESC);
CREATE INDEX idx_extensions_created ON extensions(created_at DESC);
CREATE INDEX idx_extensions_search ON extensions USING GIN(to_tsvector('english', name || ' ' || description));

CREATE INDEX idx_mcp_category ON mcp_servers(category);
CREATE INDEX idx_mcp_author ON mcp_servers(author_id);
CREATE INDEX idx_mcp_downloads ON mcp_servers(downloads DESC);
CREATE INDEX idx_mcp_rating ON mcp_servers(rating DESC);
CREATE INDEX idx_mcp_created ON mcp_servers(created_at DESC);
CREATE INDEX idx_mcp_search ON mcp_servers USING GIN(to_tsvector('english', name || ' ' || description));

CREATE INDEX idx_posts_forum ON posts(forum_id);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_author ON comments(author_id);

CREATE INDEX idx_news_published ON news(published_at DESC) WHERE is_published = true;
CREATE INDEX idx_news_search ON news USING GIN(to_tsvector('english', title || ' ' || content));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_extensions_updated_at BEFORE UPDATE ON extensions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_servers_updated_at BEFORE UPDATE ON mcp_servers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Extensions policies
CREATE POLICY "Extensions are viewable by everyone" ON extensions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create extensions" ON extensions
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own extensions" ON extensions
  FOR UPDATE USING (auth.uid() = author_id);

-- Similar policies for other tables...

-- Add full-text search columns (simplified for Supabase)
ALTER TABLE extensions ADD COLUMN IF NOT EXISTS fts tsvector;
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS fts tsvector;
ALTER TABLE news ADD COLUMN IF NOT EXISTS fts tsvector;

-- Create indexes for full-text search
CREATE INDEX IF NOT EXISTS idx_extensions_fts ON extensions USING GIN(fts);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_fts ON mcp_servers USING GIN(fts);
CREATE INDEX IF NOT EXISTS idx_news_fts ON news USING GIN(fts);

-- Create triggers to update FTS columns
CREATE OR REPLACE FUNCTION update_extensions_fts() RETURNS trigger AS $$
BEGIN
  NEW.fts := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_mcp_servers_fts() RETURNS trigger AS $$
BEGIN
  NEW.fts := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_news_fts() RETURNS trigger AS $$
BEGIN
  NEW.fts := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_extensions_fts_trigger
  BEFORE INSERT OR UPDATE ON extensions
  FOR EACH ROW EXECUTE FUNCTION update_extensions_fts();

CREATE TRIGGER update_mcp_servers_fts_trigger
  BEFORE INSERT OR UPDATE ON mcp_servers
  FOR EACH ROW EXECUTE FUNCTION update_mcp_servers_fts();

CREATE TRIGGER update_news_fts_trigger
  BEFORE INSERT OR UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION update_news_fts();

-- Create search ranking function
CREATE OR REPLACE FUNCTION fts_rank(fts_column tsvector, search_query tsquery)
RETURNS float AS $$
BEGIN
  RETURN ts_rank_cd(fts_column, search_query);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create views for common queries
CREATE OR REPLACE VIEW popular_extensions AS
SELECT 
  e.*,
  p.username as author_username,
  p.avatar_url as author_avatar
FROM extensions e
LEFT JOIN profiles p ON e.author_id = p.id
WHERE e.downloads > 100
ORDER BY e.downloads DESC
LIMIT 50;

CREATE OR REPLACE VIEW trending_extensions AS
SELECT 
  e.*,
  p.username as author_username,
  COUNT(DISTINCT i.user_id) as recent_installs
FROM extensions e
LEFT JOIN profiles p ON e.author_id = p.id
LEFT JOIN installations i ON e.id = i.extension_id 
  AND i.installed_at > NOW() - INTERVAL '7 days'
GROUP BY e.id, p.username, p.avatar_url
ORDER BY recent_installs DESC
LIMIT 20;