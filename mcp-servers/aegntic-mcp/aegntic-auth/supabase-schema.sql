-- aegntic Authentication System Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS aegntic_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    tier VARCHAR(50) DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
    api_key VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS aegntic_usage (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES aegntic_users(id) ON DELETE CASCADE,
    feature VARCHAR(255) NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS aegntic_subscriptions (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID REFERENCES aegntic_users(id) ON DELETE CASCADE,
    tier VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    stripe_subscription_id VARCHAR(255),
    stripe_price_id VARCHAR(255),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email log table (for tracking sent emails)
CREATE TABLE IF NOT EXISTS aegntic_email_log (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES aegntic_users(id) ON DELETE CASCADE,
    email_type VARCHAR(100) NOT NULL,
    subject VARCHAR(255),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'sent',
    metadata JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX idx_usage_user_id ON aegntic_usage(user_id);
CREATE INDEX idx_usage_feature ON aegntic_usage(feature);
CREATE INDEX idx_usage_timestamp ON aegntic_usage(timestamp);
CREATE INDEX idx_subscriptions_user_id ON aegntic_subscriptions(user_id);
CREATE INDEX idx_email_log_user_id ON aegntic_email_log(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_aegntic_users_updated_at BEFORE UPDATE
    ON aegntic_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aegntic_subscriptions_updated_at BEFORE UPDATE
    ON aegntic_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get usage summary for a user
CREATE OR REPLACE FUNCTION get_user_usage_summary(user_email VARCHAR)
RETURNS TABLE (
    feature VARCHAR,
    total_usage BIGINT,
    first_used TIMESTAMP WITH TIME ZONE,
    last_used TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.feature,
        SUM(u.count)::BIGINT as total_usage,
        MIN(u.timestamp) as first_used,
        MAX(u.timestamp) as last_used
    FROM aegntic_usage u
    JOIN aegntic_users usr ON u.user_id = usr.id
    WHERE usr.email = user_email
    GROUP BY u.feature
    ORDER BY total_usage DESC;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS)
ALTER TABLE aegntic_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE aegntic_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE aegntic_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aegntic_email_log ENABLE ROW LEVEL SECURITY;

-- Policies (adjust based on your auth strategy)
-- For now, we'll create service-level access
CREATE POLICY "Service level access for users" ON aegntic_users
    FOR ALL USING (true); -- Adjust this based on your auth needs

CREATE POLICY "Service level access for usage" ON aegntic_usage
    FOR ALL USING (true);

CREATE POLICY "Service level access for subscriptions" ON aegntic_subscriptions
    FOR ALL USING (true);

CREATE POLICY "Service level access for email log" ON aegntic_email_log
    FOR ALL USING (true);