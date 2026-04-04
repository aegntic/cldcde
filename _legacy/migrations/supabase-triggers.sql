-- Supabase Realtime Triggers for cldcde.cc
-- These triggers enable realtime activity feeds and notifications

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE extensions;
ALTER PUBLICATION supabase_realtime ADD TABLE mcp_servers;
ALTER PUBLICATION supabase_realtime ADD TABLE ratings;
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE downloads;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Create activity_events table for storing activity feed
CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id),
  username VARCHAR(255),
  target_id VARCHAR(255),
  target_name VARCHAR(255),
  target_type VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX idx_activity_events_timestamp ON activity_events(timestamp DESC);
CREATE INDEX idx_activity_events_type ON activity_events(type);
CREATE INDEX idx_activity_events_user_id ON activity_events(user_id);

-- Function to broadcast activity event
CREATE OR REPLACE FUNCTION broadcast_activity_event()
RETURNS TRIGGER AS $$
DECLARE
  activity_type TEXT;
  activity_data JSONB;
BEGIN
  -- Determine activity type based on table
  CASE TG_TABLE_NAME
    WHEN 'extensions' THEN
      IF TG_OP = 'INSERT' THEN
        activity_type := 'extension_added';
      END IF;
    WHEN 'mcp_servers' THEN
      IF TG_OP = 'INSERT' THEN
        activity_type := 'mcp_added';
      END IF;
    WHEN 'ratings' THEN
      activity_type := 'rating_added';
    WHEN 'reviews' THEN
      activity_type := 'review_added';
    WHEN 'downloads' THEN
      activity_type := 'download';
    WHEN 'users' THEN
      IF TG_OP = 'INSERT' THEN
        activity_type := 'user_joined';
      END IF;
  END CASE;

  -- Build activity data
  activity_data := jsonb_build_object(
    'id', gen_random_uuid(),
    'type', activity_type,
    'timestamp', NOW(),
    'userId', COALESCE(NEW.user_id, NULL),
    'username', COALESCE(NEW.username, NULL),
    'targetId', COALESCE(NEW.id::TEXT, NEW.extension_id::TEXT, NEW.mcp_server_id::TEXT, NULL),
    'targetName', COALESCE(NEW.name, NULL),
    'targetType', CASE 
      WHEN TG_TABLE_NAME IN ('extensions', 'ratings', 'reviews', 'downloads') AND NEW.extension_id IS NOT NULL THEN 'extension'
      WHEN TG_TABLE_NAME IN ('mcp_servers', 'ratings', 'reviews', 'downloads') AND NEW.mcp_server_id IS NOT NULL THEN 'mcp'
      ELSE NULL
    END,
    'metadata', CASE
      WHEN TG_TABLE_NAME = 'ratings' THEN jsonb_build_object('rating', NEW.rating)
      WHEN TG_TABLE_NAME = 'reviews' THEN jsonb_build_object('reviewText', LEFT(NEW.review_text, 100))
      WHEN TG_TABLE_NAME = 'downloads' THEN jsonb_build_object('downloadCount', NEW.count)
      ELSE '{}'::JSONB
    END
  );

  -- Insert into activity_events table
  INSERT INTO activity_events (
    type, user_id, username, target_id, target_name, target_type, metadata
  ) VALUES (
    activity_type,
    activity_data->>'userId',
    activity_data->>'username',
    activity_data->>'targetId',
    activity_data->>'targetName',
    activity_data->>'targetType',
    activity_data->'metadata'
  );

  -- Broadcast to Supabase Realtime
  PERFORM pg_notify('activity_feed', activity_data::TEXT);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for each table
CREATE TRIGGER trigger_extension_activity
AFTER INSERT ON extensions
FOR EACH ROW EXECUTE FUNCTION broadcast_activity_event();

CREATE TRIGGER trigger_mcp_activity
AFTER INSERT ON mcp_servers
FOR EACH ROW EXECUTE FUNCTION broadcast_activity_event();

CREATE TRIGGER trigger_rating_activity
AFTER INSERT ON ratings
FOR EACH ROW EXECUTE FUNCTION broadcast_activity_event();

CREATE TRIGGER trigger_review_activity
AFTER INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION broadcast_activity_event();

CREATE TRIGGER trigger_download_activity
AFTER INSERT ON downloads
FOR EACH ROW EXECUTE FUNCTION broadcast_activity_event();

CREATE TRIGGER trigger_user_activity
AFTER INSERT ON users
FOR EACH ROW EXECUTE FUNCTION broadcast_activity_event();

-- Function to check and broadcast milestone events
CREATE OR REPLACE FUNCTION check_milestones()
RETURNS TRIGGER AS $$
DECLARE
  milestone_text TEXT;
BEGIN
  -- Check download milestones
  IF TG_TABLE_NAME = 'extensions' OR TG_TABLE_NAME = 'mcp_servers' THEN
    IF NEW.downloads = 100 THEN
      milestone_text := NEW.name || ' reached 100 downloads!';
    ELSIF NEW.downloads = 1000 THEN
      milestone_text := NEW.name || ' reached 1,000 downloads!';
    ELSIF NEW.downloads = 10000 THEN
      milestone_text := NEW.name || ' reached 10,000 downloads!';
    END IF;

    IF milestone_text IS NOT NULL THEN
      INSERT INTO activity_events (
        type, target_id, target_name, target_type, metadata
      ) VALUES (
        'milestone_reached',
        NEW.id::TEXT,
        NEW.name,
        CASE WHEN TG_TABLE_NAME = 'extensions' THEN 'extension' ELSE 'mcp' END,
        jsonb_build_object('milestone', milestone_text, 'downloadCount', NEW.downloads)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create milestone triggers
CREATE TRIGGER trigger_extension_milestones
AFTER UPDATE OF downloads ON extensions
FOR EACH ROW EXECUTE FUNCTION check_milestones();

CREATE TRIGGER trigger_mcp_milestones
AFTER UPDATE OF downloads ON mcp_servers
FOR EACH ROW EXECUTE FUNCTION check_milestones();

-- Notifications table (if not exists)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for review on user's extension/mcp
  IF TG_TABLE_NAME = 'reviews' THEN
    INSERT INTO notifications (user_id, type, title, message, metadata)
    SELECT 
      CASE 
        WHEN NEW.extension_id IS NOT NULL THEN e.author_id
        WHEN NEW.mcp_server_id IS NOT NULL THEN m.author_id
      END,
      'activity',
      'New Review',
      'Someone reviewed your ' || 
      CASE 
        WHEN NEW.extension_id IS NOT NULL THEN 'extension'
        WHEN NEW.mcp_server_id IS NOT NULL THEN 'MCP server'
      END,
      jsonb_build_object(
        'activityType', 'review_added',
        'targetId', COALESCE(NEW.extension_id::TEXT, NEW.mcp_server_id::TEXT),
        'targetType', CASE 
          WHEN NEW.extension_id IS NOT NULL THEN 'extension'
          WHEN NEW.mcp_server_id IS NOT NULL THEN 'mcp'
        END,
        'reviewId', NEW.id
      )
    FROM extensions e, mcp_servers m
    WHERE (NEW.extension_id IS NOT NULL AND e.id = NEW.extension_id)
       OR (NEW.mcp_server_id IS NOT NULL AND m.id = NEW.mcp_server_id);
  END IF;

  -- Create notification for rating on user's extension/mcp
  IF TG_TABLE_NAME = 'ratings' THEN
    INSERT INTO notifications (user_id, type, title, message, metadata)
    SELECT 
      CASE 
        WHEN NEW.extension_id IS NOT NULL THEN e.author_id
        WHEN NEW.mcp_server_id IS NOT NULL THEN m.author_id
      END,
      'activity',
      'New Rating',
      'Someone rated your ' || 
      CASE 
        WHEN NEW.extension_id IS NOT NULL THEN 'extension'
        WHEN NEW.mcp_server_id IS NOT NULL THEN 'MCP server'
      END || ' ' || NEW.rating || ' stars',
      jsonb_build_object(
        'activityType', 'rating_added',
        'targetId', COALESCE(NEW.extension_id::TEXT, NEW.mcp_server_id::TEXT),
        'targetType', CASE 
          WHEN NEW.extension_id IS NOT NULL THEN 'extension'
          WHEN NEW.mcp_server_id IS NOT NULL THEN 'mcp'
        END,
        'rating', NEW.rating
      )
    FROM extensions e, mcp_servers m
    WHERE (NEW.extension_id IS NOT NULL AND e.id = NEW.extension_id)
       OR (NEW.mcp_server_id IS NOT NULL AND m.id = NEW.mcp_server_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create notification triggers
CREATE TRIGGER trigger_review_notification
AFTER INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION create_notification();

CREATE TRIGGER trigger_rating_notification
AFTER INSERT ON ratings
FOR EACH ROW EXECUTE FUNCTION create_notification();

-- Clean up old activity events (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_activities()
RETURNS void AS $$
BEGIN
  DELETE FROM activity_events
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-activities', '0 0 * * *', 'SELECT cleanup_old_activities();');