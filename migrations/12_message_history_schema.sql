-- Message History and Audit Schema

-- Message History Table
CREATE TABLE IF NOT EXISTS message_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL,
  chat_id UUID NOT NULL,
  sender_id UUID,
  sender_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(50) NOT NULL DEFAULT 'user_message',
  related_entity_id UUID,
  related_entity_type VARCHAR(50),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE
);

-- Message Status History Table
CREATE TABLE IF NOT EXISTS message_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL,
  actor_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Message Attachments History
CREATE TABLE IF NOT EXISTS message_attachment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL,
  attachment_url TEXT NOT NULL,
  attachment_type VARCHAR(50),
  file_name VARCHAR(255),
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Message Archive Table (for older messages)
CREATE TABLE IF NOT EXISTS message_history_archive (
  id UUID PRIMARY KEY,
  message_id UUID NOT NULL,
  chat_id UUID NOT NULL,
  sender_id UUID,
  sender_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(50) NOT NULL,
  related_entity_id UUID,
  related_entity_type VARCHAR(50),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- System Audit Log
CREATE TABLE IF NOT EXISTS system_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  entity_type VARCHAR(50),
  actor_id UUID,
  actor_type VARCHAR(50),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_history_chat_id ON message_history(chat_id);
CREATE INDEX IF NOT EXISTS idx_message_history_message_id ON message_history(message_id);
CREATE INDEX IF NOT EXISTS idx_message_history_sender_id ON message_history(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_history_related_entity ON message_history(related_entity_id, related_entity_type);
CREATE INDEX IF NOT EXISTS idx_message_history_created_at ON message_history(created_at);
CREATE INDEX IF NOT EXISTS idx_message_history_message_type ON message_history(message_type);
CREATE INDEX IF NOT EXISTS idx_message_history_content_trgm ON message_history USING gin (content gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_message_status_message_id ON message_status_history(message_id);
CREATE INDEX IF NOT EXISTS idx_message_status_created_at ON message_status_history(created_at);

CREATE INDEX IF NOT EXISTS idx_message_attachment_message_id ON message_attachment_history(message_id);

CREATE INDEX IF NOT EXISTS idx_message_archive_chat_id ON message_history_archive(chat_id);
CREATE INDEX IF NOT EXISTS idx_message_archive_message_id ON message_history_archive(message_id);
CREATE INDEX IF NOT EXISTS idx_message_archive_related_entity ON message_history_archive(related_entity_id, related_entity_type);
CREATE INDEX IF NOT EXISTS idx_message_archive_created_at ON message_history_archive(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON system_audit_log(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON system_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON system_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON system_audit_log(created_at);

-- Add extension for text search if not exists
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create view for message history with status
CREATE OR REPLACE VIEW message_history_with_status AS
SELECT 
  mh.*,
  COALESCE(
    (SELECT status FROM message_status_history 
     WHERE message_id = mh.message_id 
     ORDER BY created_at DESC LIMIT 1),
    'sent'
  ) as current_status
FROM 
  message_history mh;

-- Create function to archive old messages
CREATE OR REPLACE FUNCTION archive_old_messages(older_than_days INTEGER)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  WITH moved_rows AS (
    INSERT INTO message_history_archive
    SELECT 
      id, message_id, chat_id, sender_id, sender_type, 
      content, message_type, related_entity_id, related_entity_type, 
      metadata, created_at
    FROM message_history
    WHERE 
      created_at < NOW() - (older_than_days * INTERVAL '1 day')
      AND is_archived = FALSE
    RETURNING id
  )
  UPDATE message_history
  SET is_archived = TRUE
  WHERE id IN (SELECT id FROM moved_rows);
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;
