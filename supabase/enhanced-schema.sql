-- CLDCDE+ Enhanced Database Schema
-- Comprehensive schema for all 4 remaining tasks

-- =====================================================
-- TASK 2: Enhanced Resource Gallery System
-- =====================================================

-- Enhanced Extensions table with more fields
CREATE TABLE IF NOT EXISTS enhanced_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  platform TEXT[] NOT NULL, -- ['macos', 'linux', 'windows']
  version VARCHAR(50) NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  install_script TEXT,
  repository_url VARCHAR(500),
  documentation_url VARCHAR(500),
  demo_url VARCHAR(500),
  license VARCHAR(100),
  tags TEXT[],
  screenshots TEXT[],
  file_size INTEGER,
  requirements JSONB,
  changelog JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP WITH TIME ZONE,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderator_id UUID REFERENCES profiles(id)
);

-- Enhanced MCP Servers table
CREATE TABLE IF NOT EXISTS enhanced_mcp_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  platform TEXT[] NOT NULL,
  version VARCHAR(50) NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pending',
  install_script TEXT,
  repository_url VARCHAR(500),
  documentation_url VARCHAR(500),
  config_example JSONB,
  capabilities TEXT[],
  port_range VARCHAR(50),
  dependencies TEXT[],
  screenshots TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP WITH TIME ZONE,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderator_id UUID REFERENCES profiles(id)
);

-- Resource Categories
CREATE TABLE IF NOT EXISTS resource_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  color VARCHAR(7), -- hex color
  parent_id UUID REFERENCES resource_categories(id),
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reviews System
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  extension_id UUID REFERENCES enhanced_extensions(id) ON DELETE CASCADE,
  mcp_server_id UUID REFERENCES enhanced_mcp_servers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT,
  helpful_count INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'active', -- active, hidden, flagged
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT reviews_resource_check CHECK (
    (extension_id IS NOT NULL AND mcp_server_id IS NULL) OR
    (extension_id IS NULL AND mcp_server_id IS NOT NULL)
  )
);

-- =====================================================
-- TASK 3: Advanced News Management
-- =====================================================

-- Enhanced News table
CREATE TABLE IF NOT EXISTS enhanced_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  category VARCHAR(100) NOT NULL, -- official, community, updates, tutorials
  tags TEXT[],
  featured BOOLEAN DEFAULT FALSE,
  pinned BOOLEAN DEFAULT FALSE,
  external_url VARCHAR(1000),
  source VARCHAR(255), -- anthropic, community, reddit, etc.
  source_data JSONB, -- metadata from RSS/API
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, archived
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  seo_title VARCHAR(255),
  seo_description TEXT,
  og_image VARCHAR(1000)
);

-- RSS Feed Sources
CREATE TABLE IF NOT EXISTS rss_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(1000) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  fetch_frequency INTEGER DEFAULT 3600, -- seconds
  last_fetched TIMESTAMP WITH TIME ZONE,
  last_successful_fetch TIMESTAMP WITH TIME ZONE,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- News Comments
CREATE TABLE IF NOT EXISTS news_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES enhanced_news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES news_comments(id) ON DELETE CASCADE,
  like_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TASK 4: Content Management Features
-- =====================================================

-- Admin Roles and Permissions
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL, -- detailed permissions object
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Roles Assignment
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, role_id)
);

-- Moderation Queue
CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type VARCHAR(50) NOT NULL, -- extension, mcp_server, news, comment, user
  item_id UUID NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason VARCHAR(100), -- spam, inappropriate, copyright, etc.
  description TEXT,
  priority INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high, 4=urgent
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, escalated
  assigned_to UUID REFERENCES profiles(id),
  moderator_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System Analytics
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  resource_type VARCHAR(50), -- extension, mcp_server, news
  resource_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TASK 5: Community Features
-- =====================================================

-- Enhanced User Profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website VARCHAR(500);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_username VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter_handle VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reputation INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badges TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;

-- Voting System
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL, -- extension, mcp_server, news, comment
  resource_id UUID NOT NULL,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, resource_type, resource_id)
);

-- User Activity Feed
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL, -- uploaded, reviewed, commented, voted
  resource_type VARCHAR(50),
  resource_id UUID,
  metadata JSONB,
  visibility VARCHAR(50) DEFAULT 'public', -- public, followers, private
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Followers/Following
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Achievements and Badges
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(255),
  color VARCHAR(7),
  criteria JSONB, -- conditions to earn the achievement
  points INTEGER DEFAULT 0,
  rarity VARCHAR(50) DEFAULT 'common', -- common, uncommon, rare, epic, legendary
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  progress JSONB, -- progress towards achievement
  UNIQUE(user_id, achievement_id)
);

-- Resource Collections (User-created lists)
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  visibility VARCHAR(50) DEFAULT 'public', -- public, unlisted, private
  featured BOOLEAN DEFAULT FALSE,
  item_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Collection Items
CREATE TABLE IF NOT EXISTS collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(collection_id, resource_type, resource_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Extensions indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_extensions_category ON enhanced_extensions(category);
CREATE INDEX IF NOT EXISTS idx_enhanced_extensions_author ON enhanced_extensions(author_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_extensions_status ON enhanced_extensions(status);
CREATE INDEX IF NOT EXISTS idx_enhanced_extensions_featured ON enhanced_extensions(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_enhanced_extensions_rating ON enhanced_extensions(rating DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_extensions_downloads ON enhanced_extensions(downloads DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_extensions_published ON enhanced_extensions(published_at DESC);

-- MCP Servers indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_mcp_category ON enhanced_mcp_servers(category);
CREATE INDEX IF NOT EXISTS idx_enhanced_mcp_author ON enhanced_mcp_servers(author_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_mcp_status ON enhanced_mcp_servers(status);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_extension ON reviews(extension_id);
CREATE INDEX IF NOT EXISTS idx_reviews_mcp ON reviews(mcp_server_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- News indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_news_category ON enhanced_news(category);
CREATE INDEX IF NOT EXISTS idx_enhanced_news_published ON enhanced_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_news_featured ON enhanced_news(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_enhanced_news_status ON enhanced_news(status);

-- Voting indexes
CREATE INDEX IF NOT EXISTS idx_votes_resource ON votes(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);

-- Activity feed indexes
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_feed(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_feed(activity_type);

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Update rating after review changes
CREATE OR REPLACE FUNCTION update_resource_rating()
RETURNS TRIGGER AS $$
DECLARE
  new_rating NUMERIC(3,2);
  new_count INTEGER;
BEGIN
  IF NEW.extension_id IS NOT NULL THEN
    SELECT AVG(rating)::NUMERIC(3,2), COUNT(*)::INTEGER
    INTO new_rating, new_count
    FROM reviews
    WHERE extension_id = NEW.extension_id AND status = 'active';
    
    UPDATE enhanced_extensions
    SET rating = new_rating, rating_count = new_count
    WHERE id = NEW.extension_id;
    
  ELSIF NEW.mcp_server_id IS NOT NULL THEN
    SELECT AVG(rating)::NUMERIC(3,2), COUNT(*)::INTEGER
    INTO new_rating, new_count
    FROM reviews
    WHERE mcp_server_id = NEW.mcp_server_id AND status = 'active';
    
    UPDATE enhanced_mcp_servers
    SET rating = new_rating, rating_count = new_count
    WHERE id = NEW.mcp_server_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rating updates
DROP TRIGGER IF EXISTS update_rating_after_review_change ON reviews;
CREATE TRIGGER update_rating_after_review_change
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_resource_rating();

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_download_count(resource_type VARCHAR, resource_id UUID)
RETURNS void AS $$
BEGIN
  IF resource_type = 'extension' THEN
    UPDATE enhanced_extensions 
    SET downloads = downloads + 1 
    WHERE id = resource_id;
  ELSIF resource_type = 'mcp_server' THEN
    UPDATE enhanced_mcp_servers 
    SET downloads = downloads + 1 
    WHERE id = resource_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update collection item count
CREATE OR REPLACE FUNCTION update_collection_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE collections 
    SET item_count = item_count + 1 
    WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE collections 
    SET item_count = item_count - 1 
    WHERE id = OLD.collection_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for collection count
DROP TRIGGER IF EXISTS update_collection_count_trigger ON collection_items;
CREATE TRIGGER update_collection_count_trigger
AFTER INSERT OR DELETE ON collection_items
FOR EACH ROW EXECUTE FUNCTION update_collection_count();

-- =====================================================
-- SAMPLE DATA SETUP
-- =====================================================

-- Insert default admin role
INSERT INTO admin_roles (name, description, permissions) VALUES 
('super_admin', 'Full system access', '{"all": true}'),
('moderator', 'Content moderation', '{"moderate": true, "view_reports": true}'),
('editor', 'Content editing', '{"edit_news": true, "manage_featured": true}')
ON CONFLICT (name) DO NOTHING;

-- Insert default categories
INSERT INTO resource_categories (name, slug, description, icon, color) VALUES 
('Productivity', 'productivity', 'Tools to enhance productivity', '⚡', '#3B82F6'),
('Development', 'development', 'Development and coding tools', '🛠️', '#10B981'),
('Content Creation', 'content', 'Content creation and media tools', '🎨', '#F59E0B'),
('System Tools', 'system', 'System utilities and maintenance', '⚙️', '#6B7280'),
('AI & Machine Learning', 'ai-ml', 'AI and ML related extensions', '🤖', '#8B5CF6'),
('Database', 'database', 'Database connectivity and tools', '🗄️', '#EF4444'),
('File Management', 'files', 'File and filesystem operations', '📁', '#059669'),
('API Integration', 'api', 'Third-party API integrations', '🔗', '#DC2626')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample achievements
INSERT INTO achievements (name, description, icon, color, criteria, points, rarity) VALUES 
('First Upload', 'Upload your first extension or MCP server', '🚀', '#3B82F6', '{"uploads": 1}', 100, 'common'),
('Popular Creator', 'Get 1000+ downloads on a resource', '⭐', '#F59E0B', '{"total_downloads": 1000}', 500, 'uncommon'),
('Community Helper', 'Leave 10 helpful reviews', '💬', '#10B981', '{"helpful_reviews": 10}', 200, 'common'),
('Trending', 'Have a resource featured on the homepage', '🔥', '#EF4444', '{"featured_count": 1}', 1000, 'rare'),
('Early Adopter', 'Join the platform in the first month', '🏆', '#8B5CF6', '{"join_date": "early"}', 2000, 'epic')
ON CONFLICT (name) DO NOTHING;

COMMIT;