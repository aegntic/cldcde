-- Monitoring Agent Schema for News Discovery System
-- This schema handles automated content discovery, quality scoring, and processing pipeline

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Enum types for monitoring sources and statuses
CREATE TYPE monitoring_source_type AS ENUM ('anthropic', 'github', 'youtube', 'x_twitter');
CREATE TYPE content_status AS ENUM ('discovered', 'quality_check', 'approved', 'rejected', 'processing', 'generated', 'published', 'failed');
CREATE TYPE pipeline_stage AS ENUM ('discovery', 'quality_assessment', 'content_generation', 'review', 'publication');
CREATE TYPE filter_type AS ENUM ('keyword', 'regex', 'score_threshold', 'source_specific');

-- Monitoring sources configuration table
CREATE TABLE monitoring_sources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    source_type monitoring_source_type NOT NULL,
    source_name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    url_patterns JSONB DEFAULT '[]', -- Array of URL patterns to monitor
    api_endpoint TEXT,
    api_key_ref TEXT, -- Reference to secure vault for API keys
    check_frequency_minutes INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    last_checked_at TIMESTAMP WITH TIME ZONE,
    next_check_at TIMESTAMP WITH TIME ZONE,
    rate_limit_config JSONB DEFAULT '{}', -- Rate limiting configuration
    source_config JSONB DEFAULT '{}', -- Source-specific configuration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_type, source_name)
);

-- Content discovery queue
CREATE TABLE content_discovery (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    source_id UUID NOT NULL REFERENCES monitoring_sources(id) ON DELETE CASCADE,
    source_type monitoring_source_type NOT NULL,
    external_id TEXT NOT NULL, -- ID from the source system
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content_preview TEXT, -- First 500 chars of content
    author TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Quality scoring
    quality_score DECIMAL(3,2) DEFAULT 0, -- 0.00 to 1.00
    relevance_score DECIMAL(3,2) DEFAULT 0,
    engagement_score DECIMAL(3,2) DEFAULT 0,
    freshness_score DECIMAL(3,2) DEFAULT 0,
    quality_factors JSONB DEFAULT '{}', -- Breakdown of quality score components
    
    -- Processing status
    status content_status DEFAULT 'discovered',
    status_reason TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    source_metadata JSONB DEFAULT '{}', -- Source-specific metadata
    tags TEXT[] DEFAULT '{}',
    categories TEXT[] DEFAULT '{}',
    
    -- Deduplication
    content_hash TEXT, -- Hash of content for deduplication
    is_duplicate BOOLEAN DEFAULT false,
    duplicate_of UUID REFERENCES content_discovery(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(source_type, external_id),
    INDEX idx_content_discovery_status (status),
    INDEX idx_content_discovery_quality_score (quality_score DESC),
    INDEX idx_content_discovery_discovered_at (discovered_at DESC),
    INDEX idx_content_discovery_source_id (source_id),
    INDEX idx_content_discovery_content_hash (content_hash)
);

-- Processing pipeline tracking
CREATE TABLE processing_pipeline (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_discovery(id) ON DELETE CASCADE,
    current_stage pipeline_stage NOT NULL,
    stage_status content_status NOT NULL,
    
    -- Stage timestamps
    discovered_at TIMESTAMP WITH TIME ZONE,
    quality_assessed_at TIMESTAMP WITH TIME ZONE,
    generation_started_at TIMESTAMP WITH TIME ZONE,
    generation_completed_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Processing metadata
    processing_attempts INTEGER DEFAULT 0,
    last_error TEXT,
    last_error_at TIMESTAMP WITH TIME ZONE,
    
    -- Generated content reference
    generated_content_id UUID, -- Reference to generated articles/content
    generation_prompt TEXT,
    generation_model TEXT,
    generation_tokens_used INTEGER,
    
    -- Review metadata
    reviewer_notes TEXT,
    manual_review_required BOOLEAN DEFAULT false,
    auto_approved BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_pipeline_stage (current_stage),
    INDEX idx_pipeline_status (stage_status),
    INDEX idx_pipeline_content_id (content_id)
);

-- Quality filters configuration
CREATE TABLE quality_filters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    filter_name TEXT NOT NULL UNIQUE,
    filter_type filter_type NOT NULL,
    source_type monitoring_source_type, -- NULL means applies to all sources
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- Higher priority filters run first
    
    -- Filter criteria
    filter_config JSONB NOT NULL, -- Filter-specific configuration
    min_score DECIMAL(3,2), -- Minimum score to pass filter
    
    -- Filter logic
    filter_expression TEXT, -- SQL/regex expression for complex filters
    keywords TEXT[] DEFAULT '{}', -- Keywords for keyword filters
    exclude_keywords TEXT[] DEFAULT '{}',
    
    -- Metrics
    total_evaluated INTEGER DEFAULT 0,
    total_passed INTEGER DEFAULT 0,
    last_applied_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_filters_type (filter_type),
    INDEX idx_filters_source_type (source_type),
    INDEX idx_filters_active (is_active)
);

-- Monitoring logs for agent activity
CREATE TABLE monitoring_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    source_id UUID REFERENCES monitoring_sources(id) ON DELETE SET NULL,
    log_type TEXT NOT NULL, -- 'check', 'discovery', 'error', 'rate_limit', etc.
    log_level TEXT NOT NULL, -- 'info', 'warning', 'error'
    
    -- Log details
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    
    -- Metrics
    items_discovered INTEGER DEFAULT 0,
    items_processed INTEGER DEFAULT 0,
    items_filtered INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    
    -- Error tracking
    error_code TEXT,
    error_details JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_logs_source_id (source_id),
    INDEX idx_logs_type (log_type),
    INDEX idx_logs_level (log_level),
    INDEX idx_logs_created_at (created_at DESC)
);

-- Source-specific metadata tables

-- GitHub-specific metadata
CREATE TABLE github_content_metadata (
    content_id UUID PRIMARY KEY REFERENCES content_discovery(id) ON DELETE CASCADE,
    repo_owner TEXT NOT NULL,
    repo_name TEXT NOT NULL,
    content_type TEXT NOT NULL, -- 'release', 'commit', 'issue', 'pr', 'discussion'
    stars INTEGER,
    forks INTEGER,
    watchers INTEGER,
    language TEXT,
    topics TEXT[] DEFAULT '{}',
    commit_sha TEXT,
    release_tag TEXT,
    is_prerelease BOOLEAN DEFAULT false,
    assets JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_github_repo (repo_owner, repo_name),
    INDEX idx_github_type (content_type)
);

-- YouTube-specific metadata
CREATE TABLE youtube_content_metadata (
    content_id UUID PRIMARY KEY REFERENCES content_discovery(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL UNIQUE,
    channel_id TEXT NOT NULL,
    channel_name TEXT NOT NULL,
    duration_seconds INTEGER,
    view_count BIGINT,
    like_count INTEGER,
    comment_count INTEGER,
    thumbnail_url TEXT,
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    is_live BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_youtube_channel (channel_id),
    INDEX idx_youtube_video_id (video_id)
);

-- X/Twitter-specific metadata
CREATE TABLE x_content_metadata (
    content_id UUID PRIMARY KEY REFERENCES content_discovery(id) ON DELETE CASCADE,
    tweet_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    display_name TEXT,
    is_verified BOOLEAN DEFAULT false,
    retweet_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    quote_count INTEGER DEFAULT 0,
    impression_count INTEGER,
    is_thread BOOLEAN DEFAULT false,
    thread_id TEXT,
    media_urls TEXT[] DEFAULT '{}',
    hashtags TEXT[] DEFAULT '{}',
    mentions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_x_user (user_id),
    INDEX idx_x_tweet_id (tweet_id)
);

-- Anthropic-specific metadata
CREATE TABLE anthropic_content_metadata (
    content_id UUID PRIMARY KEY REFERENCES content_discovery(id) ON DELETE CASCADE,
    announcement_type TEXT NOT NULL, -- 'model_release', 'feature', 'research', 'blog'
    model_name TEXT,
    model_version TEXT,
    research_paper_url TEXT,
    key_features TEXT[] DEFAULT '{}',
    pricing_changes JSONB,
    availability_regions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_anthropic_type (announcement_type)
);

-- Create indexes for performance
CREATE INDEX idx_monitoring_sources_active ON monitoring_sources(is_active) WHERE is_active = true;
CREATE INDEX idx_monitoring_sources_next_check ON monitoring_sources(next_check_at) WHERE is_active = true;

-- Create RLS policies
ALTER TABLE monitoring_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_discovery ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_content_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_content_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE x_content_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE anthropic_content_metadata ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for monitoring configuration
CREATE POLICY "Admin users can manage monitoring sources"
    ON monitoring_sources
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'))
    WITH CHECK (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

CREATE POLICY "Admin users can manage quality filters"
    ON quality_filters
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'))
    WITH CHECK (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Read-only policies for content discovery
CREATE POLICY "All users can view approved content"
    ON content_discovery
    FOR SELECT
    TO authenticated
    USING (status IN ('approved', 'generated', 'published'));

CREATE POLICY "Admin users can manage all content"
    ON content_discovery
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'))
    WITH CHECK (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Pipeline and logs policies
CREATE POLICY "Admin users can view processing pipeline"
    ON processing_pipeline
    FOR SELECT
    TO authenticated
    USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

CREATE POLICY "Admin users can view monitoring logs"
    ON monitoring_logs
    FOR SELECT
    TO authenticated
    USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Metadata table policies
CREATE POLICY "Users can view metadata for approved content"
    ON github_content_metadata
    FOR SELECT
    TO authenticated
    USING (content_id IN (SELECT id FROM content_discovery WHERE status IN ('approved', 'generated', 'published')));

CREATE POLICY "Users can view metadata for approved content"
    ON youtube_content_metadata
    FOR SELECT
    TO authenticated
    USING (content_id IN (SELECT id FROM content_discovery WHERE status IN ('approved', 'generated', 'published')));

CREATE POLICY "Users can view metadata for approved content"
    ON x_content_metadata
    FOR SELECT
    TO authenticated
    USING (content_id IN (SELECT id FROM content_discovery WHERE status IN ('approved', 'generated', 'published')));

CREATE POLICY "Users can view metadata for approved content"
    ON anthropic_content_metadata
    FOR SELECT
    TO authenticated
    USING (content_id IN (SELECT id FROM content_discovery WHERE status IN ('approved', 'generated', 'published')));

-- Create functions for monitoring operations

-- Function to update monitoring source check times
CREATE OR REPLACE FUNCTION update_monitoring_check_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_checked_at = CURRENT_TIMESTAMP;
    NEW.next_check_at = CURRENT_TIMESTAMP + (NEW.check_frequency_minutes || ' minutes')::INTERVAL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate quality score
CREATE OR REPLACE FUNCTION calculate_quality_score(
    p_relevance DECIMAL,
    p_engagement DECIMAL,
    p_freshness DECIMAL,
    p_source_weight DECIMAL DEFAULT 1.0
) RETURNS DECIMAL AS $$
BEGIN
    RETURN ROUND((
        (p_relevance * 0.4) +
        (p_engagement * 0.3) +
        (p_freshness * 0.3)
    ) * p_source_weight, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to check content duplicates
CREATE OR REPLACE FUNCTION check_content_duplicate()
RETURNS TRIGGER AS $$
DECLARE
    v_duplicate_id UUID;
BEGIN
    -- Generate content hash if not provided
    IF NEW.content_hash IS NULL THEN
        NEW.content_hash = MD5(COALESCE(NEW.title, '') || COALESCE(NEW.description, '') || COALESCE(NEW.url, ''));
    END IF;
    
    -- Check for existing content with same hash
    SELECT id INTO v_duplicate_id
    FROM content_discovery
    WHERE content_hash = NEW.content_hash
    AND id != NEW.id
    AND created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
    LIMIT 1;
    
    IF v_duplicate_id IS NOT NULL THEN
        NEW.is_duplicate = true;
        NEW.duplicate_of = v_duplicate_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_monitoring_sources_updated_at
    BEFORE UPDATE ON monitoring_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_discovery_updated_at
    BEFORE UPDATE ON content_discovery
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_pipeline_updated_at
    BEFORE UPDATE ON processing_pipeline
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_filters_updated_at
    BEFORE UPDATE ON quality_filters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER check_content_duplicate_trigger
    BEFORE INSERT OR UPDATE ON content_discovery
    FOR EACH ROW
    EXECUTE FUNCTION check_content_duplicate();

-- Create views for monitoring dashboard

-- Active monitoring sources view
CREATE VIEW v_active_monitoring_sources AS
SELECT 
    ms.*,
    COUNT(DISTINCT cd.id) as total_discoveries_24h,
    COUNT(DISTINCT cd.id) FILTER (WHERE cd.status = 'approved') as approved_24h
FROM monitoring_sources ms
LEFT JOIN content_discovery cd ON cd.source_id = ms.id 
    AND cd.discovered_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
WHERE ms.is_active = true
GROUP BY ms.id;

-- Content pipeline status view
CREATE VIEW v_content_pipeline_status AS
SELECT 
    pp.current_stage,
    pp.stage_status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (pp.updated_at - pp.created_at))) as avg_processing_time_seconds
FROM processing_pipeline pp
WHERE pp.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY pp.current_stage, pp.stage_status;

-- Quality score distribution view
CREATE VIEW v_quality_score_distribution AS
SELECT 
    source_type,
    COUNT(*) as total_content,
    AVG(quality_score) as avg_quality_score,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY quality_score) as median_quality_score,
    COUNT(*) FILTER (WHERE quality_score >= 0.7) as high_quality_count,
    COUNT(*) FILTER (WHERE quality_score < 0.4) as low_quality_count
FROM content_discovery
WHERE discovered_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY source_type;

-- Insert default monitoring sources
INSERT INTO monitoring_sources (source_type, source_name, base_url, url_patterns, check_frequency_minutes, source_config) VALUES
('anthropic', 'Anthropic Blog', 'https://www.anthropic.com', '["https://www.anthropic.com/news/*", "https://www.anthropic.com/research/*"]', 30, '{"rss_feed": "https://www.anthropic.com/rss.xml"}'),
('anthropic', 'Anthropic Twitter', 'https://x.com/AnthropicAI', '["https://x.com/AnthropicAI/status/*"]', 15, '{"handle": "AnthropicAI"}'),
('github', 'Anthropic GitHub', 'https://github.com/anthropics', '["https://github.com/anthropics/*/releases", "https://github.com/anthropics/*/commits"]', 60, '{"org": "anthropics"}'),
('youtube', 'AI Explained', 'https://www.youtube.com/@aiexplained', '["https://www.youtube.com/watch?v=*"]', 120, '{"channel_id": "UCqaKX1Faq8eHziTVhqI4WvA"}'),
('x_twitter', 'AI Researchers', 'https://x.com', '["https://x.com/*/status/*"]', 30, '{"lists": ["ai_researchers", "ml_engineers"]}');

-- Insert default quality filters
INSERT INTO quality_filters (filter_name, filter_type, source_type, priority, filter_config, min_score, keywords) VALUES
('Claude Keywords', 'keyword', NULL, 100, '{"match_type": "any"}', 0.0, ARRAY['claude', 'anthropic', 'constitutional ai', 'claude 3', 'opus', 'sonnet', 'haiku']),
('GitHub Releases Only', 'source_specific', 'github', 90, '{"content_types": ["release"]}', 0.0, ARRAY[]::TEXT[]),
('High Engagement', 'score_threshold', 'x_twitter', 80, '{"min_engagement": 100}', 0.7, ARRAY[]::TEXT[]),
('Recent Content', 'score_threshold', NULL, 70, '{"max_age_hours": 168}', 0.0, ARRAY[]::TEXT[]),
('Spam Filter', 'keyword', NULL, 60, '{"match_type": "any"}', 0.0, ARRAY[]::TEXT[], ARRAY['spam', 'clickbait', 'promotional']);

-- Comments for documentation
COMMENT ON TABLE monitoring_sources IS 'Configuration for content monitoring sources';
COMMENT ON TABLE content_discovery IS 'Queue of discovered content pending processing';
COMMENT ON TABLE processing_pipeline IS 'Tracks content through the generation pipeline';
COMMENT ON TABLE quality_filters IS 'Configurable filters for content quality assessment';
COMMENT ON TABLE monitoring_logs IS 'Activity logs for the monitoring agent';
COMMENT ON COLUMN content_discovery.quality_score IS 'Overall quality score from 0.00 to 1.00';
COMMENT ON COLUMN processing_pipeline.current_stage IS 'Current stage in the content processing pipeline';
COMMENT ON COLUMN quality_filters.priority IS 'Higher priority filters are applied first';