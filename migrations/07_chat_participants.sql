-- Create load_chat_participants table
CREATE TABLE IF NOT EXISTS load_chat_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES load_chats(id) ON DELETE CASCADE,
  load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('shipper', 'carrier', 'driver', 'system')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(chat_id, user_id, user_type)
);

-- Add chat_id column to load_chat_messages table
ALTER TABLE load_chat_messages ADD COLUMN IF NOT EXISTS chat_id UUID REFERENCES load_chats(id) ON DELETE CASCADE;

-- Add sender_type column to load_chat_messages table if it doesn't exist
ALTER TABLE load_chat_messages ADD COLUMN IF NOT EXISTS sender_type VARCHAR(20) NOT NULL DEFAULT 'shipper' CHECK (sender_type IN ('shipper', 'carrier', 'driver', 'system'));

-- Add status column to load_chats table if it doesn't exist
ALTER TABLE load_chats ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed'));

-- Add metadata column to load_chats table if it doesn't exist
ALTER TABLE load_chats ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_load_chat_participants_chat_id ON load_chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_load_chat_participants_load_id ON load_chat_participants(load_id);
CREATE INDEX IF NOT EXISTS idx_load_chat_participants_user_id ON load_chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_load_chat_messages_chat_id ON load_chat_messages(chat_id);

-- Create function to notify on new messages
CREATE OR REPLACE FUNCTION notify_chat_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'load_chat_' || NEW.load_id,
    json_build_object(
      'id', NEW.id,
      'load_id', NEW.load_id,
      'chat_id', NEW.chat_id,
      'sender_id', NEW.sender_id,
      'sender_type', NEW.sender_type,
      'message', NEW.message,
      'created_at', NEW.created_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS notify_chat_message_trigger ON load_chat_messages;
CREATE TRIGGER notify_chat_message_trigger
AFTER INSERT ON load_chat_messages
FOR EACH ROW
EXECUTE FUNCTION notify_chat_message();
