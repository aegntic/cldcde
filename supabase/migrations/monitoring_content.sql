-- Create monitoring_content table for tracking Anthropic announcements
CREATE TABLE IF NOT EXISTS monitoring_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL CHECK (source IN ('blog', 'github', 'twitter')),
  source_id TEXT NOT NULL, -- Unique ID from the source (URL, tweet ID, etc)
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  url TEXT NOT NULL,
  author TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  tags TEXT[] DEFAULT '{}',
  relevance_score NUMERIC(3,2) NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 1),
  metadata JSONB DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  queued_for_blog BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_source_id UNIQUE(source, source_id)
);

-- Create indexes for efficient querying
CREATE INDEX idx_monitoring_source ON monitoring_content(source);
CREATE INDEX idx_monitoring_relevance ON monitoring_content(relevance_score DESC);
CREATE INDEX idx_monitoring_published ON monitoring_content(published_at DESC);
CREATE INDEX idx_monitoring_processed ON monitoring_content(processed, queued_for_blog);
CREATE INDEX idx_monitoring_tags ON monitoring_content USING GIN(tags);

-- Add FTS column for searching
ALTER TABLE monitoring_content ADD COLUMN IF NOT EXISTS fts tsvector;

-- Create FTS update function
CREATE OR REPLACE FUNCTION update_monitoring_content_fts() RETURNS trigger AS $$
BEGIN
  NEW.fts := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create FTS trigger
CREATE TRIGGER update_monitoring_content_fts_trigger
  BEFORE INSERT OR UPDATE ON monitoring_content
  FOR EACH ROW EXECUTE FUNCTION update_monitoring_content_fts();

-- Create FTS index
CREATE INDEX IF NOT EXISTS idx_monitoring_content_fts ON monitoring_content USING GIN(fts);

-- Add updated_at trigger
CREATE TRIGGER update_monitoring_content_updated_at BEFORE UPDATE ON monitoring_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE monitoring_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Monitoring content viewable by authenticated users" ON monitoring_content
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only service role can insert monitoring content" ON monitoring_content
  FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Only service role can update monitoring content" ON monitoring_content
  FOR UPDATE USING (auth.jwt()->>'role' = 'service_role');

-- Create view for recent high-relevance content
CREATE OR REPLACE VIEW recent_anthropic_updates AS
SELECT 
  mc.*,
  CASE 
    WHEN mc.relevance_score >= 0.8 THEN 'high'
    WHEN mc.relevance_score >= 0.6 THEN 'medium'
    ELSE 'low'
  END as relevance_category
FROM monitoring_content mc
WHERE mc.published_at > NOW() - INTERVAL '30 days'
  AND mc.relevance_score >= 0.5
ORDER BY mc.relevance_score DESC, mc.published_at DESC;

-- Create auto-blog queue table
CREATE TABLE IF NOT EXISTS blog_generation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monitoring_content_id UUID REFERENCES monitoring_content(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  blog_post_id UUID REFERENCES news(id) ON DELETE SET NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  CONSTRAINT unique_monitoring_content UNIQUE(monitoring_content_id)
);

-- Create index for queue processing
CREATE INDEX idx_blog_queue_status ON blog_generation_queue(status, created_at);

-- Enable RLS for blog queue
ALTER TABLE blog_generation_queue ENABLE ROW LEVEL SECURITY;

-- Blog queue policies
CREATE POLICY "Blog queue viewable by authenticated users" ON blog_generation_queue
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only service role can manage blog queue" ON blog_generation_queue
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');