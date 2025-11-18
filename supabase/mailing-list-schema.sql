-- Add mailing list preferences to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mailing_list_opt_in BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mailing_preferences JSONB DEFAULT '{
  "newsletter": true,
  "product_updates": true,
  "community_digest": true,
  "promotional": false
}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

-- Create mailing list audit table for compliance
CREATE TABLE IF NOT EXISTS mailing_list_consent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('opt_in', 'opt_out', 'update_preferences')),
  consent_text TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_mailing_consent_user ON mailing_list_consent(user_id, created_at DESC);

-- Function to record consent changes
CREATE OR REPLACE FUNCTION record_mailing_consent(
  p_user_id UUID,
  p_action TEXT,
  p_consent_text TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO mailing_list_consent (user_id, action, consent_text, ip_address, user_agent)
  VALUES (p_user_id, p_action, p_consent_text, p_ip_address, p_user_agent);
END;
$$ LANGUAGE plpgsql;

-- RLS policy for mailing preferences (users can only see their own)
CREATE POLICY "Users can view own mailing preferences" ON mailing_list_consent
  FOR SELECT USING (auth.uid() = user_id);

-- Add memory episode for this feature addition
INSERT INTO memory_episodes (episode_type, content, metadata, importance) 
VALUES (
  'feature_addition',
  'Added mailing list opt-in with privacy-focused fine print to signup flow',
  '{
    "feature": "mailing_list_consent",
    "privacy_features": [
      "Explicit opt-in required",
      "Fine print disclosure",
      "No spam promise",
      "No third-party data sales",
      "Easy unsubscribe in settings",
      "Consent audit trail"
    ]
  }'::jsonb,
  3
);