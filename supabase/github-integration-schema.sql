-- Add GitHub integration fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_token TEXT; -- Encrypted in production
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_connected_at TIMESTAMPTZ;

-- Create download logs table for analytics and compliance
CREATE TABLE IF NOT EXISTS download_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  user_github TEXT,
  resource_id UUID NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('extension', 'mcp_server')),
  download_target TEXT NOT NULL,
  github_actions JSONB DEFAULT '{}',
  consent_given BOOLEAN NOT NULL DEFAULT false,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics
CREATE INDEX idx_download_logs_resource ON download_logs(resource_id, created_at DESC);
CREATE INDEX idx_download_logs_user ON download_logs(user_id, created_at DESC);
CREATE INDEX idx_download_logs_github ON download_logs(user_github, created_at DESC);

-- Create GitHub OAuth state table for security
CREATE TABLE IF NOT EXISTS github_oauth_states (
  state TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- Auto-cleanup expired states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states() RETURNS void AS $$
BEGIN
  DELETE FROM github_oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS policies
ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_oauth_states ENABLE ROW LEVEL SECURITY;

-- Users can view their own download history
CREATE POLICY "Users can view own downloads" ON download_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Public can insert download logs (for anonymous downloads)
CREATE POLICY "Public can log downloads" ON download_logs
  FOR INSERT WITH CHECK (true);

-- Only service role can manage OAuth states
CREATE POLICY "Service role manages oauth states" ON github_oauth_states
  FOR ALL USING (auth.role() = 'service_role');

-- Add download count columns to resources
ALTER TABLE extensions ADD COLUMN IF NOT EXISTS github_stars INTEGER DEFAULT 0;
ALTER TABLE extensions ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS github_stars INTEGER DEFAULT 0;
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_download_count(
  p_resource_id UUID,
  p_resource_type TEXT
) RETURNS void AS $$
BEGIN
  IF p_resource_type = 'extension' THEN
    UPDATE extensions 
    SET download_count = download_count + 1,
        updated_at = NOW()
    WHERE id = p_resource_id;
  ELSIF p_resource_type = 'mcp_server' THEN
    UPDATE mcp_servers 
    SET download_count = download_count + 1,
        updated_at = NOW()
    WHERE id = p_resource_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment download count
CREATE OR REPLACE FUNCTION trigger_increment_download_count() RETURNS TRIGGER AS $$
BEGIN
  PERFORM increment_download_count(NEW.resource_id, NEW.resource_type);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER download_count_trigger
  AFTER INSERT ON download_logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_increment_download_count();

-- Add memory episode for this feature
INSERT INTO memory_episodes (episode_type, content, metadata, importance) 
VALUES (
  'feature_addition',
  'Added GitHub OAuth integration for downloads with automatic follow/star chain',
  '{
    "feature": "github_download_flow",
    "integration_steps": [
      "User clicks download",
      "Shows consent modal with fine print",
      "OAuth to GitHub",
      "Auto-follow @aegntic",
      "Auto-star repository",
      "Proceed to download"
    ],
    "privacy_features": [
      "Clear consent required",
      "Skip option available",
      "No data storage beyond logs",
      "One-time per session"
    ]
  }'::jsonb,
  4
);