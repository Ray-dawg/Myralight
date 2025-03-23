-- Messaging System Schema for Myra Light MVP

-- Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  load_id UUID REFERENCES loads(id) ON DELETE SET NULL,
  title VARCHAR(255),
  is_group BOOLEAN DEFAULT FALSE,
  last_message_text TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed'))
);

-- Chat Participants Table
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('driver', 'carrier', 'shipper', 'admin')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(chat_id, user_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_system_message BOOLEAN DEFAULT FALSE,
  attachment_url TEXT,
  attachment_type VARCHAR(100),
  attachment_size INTEGER,
  attachment_name VARCHAR(255),
  metadata JSONB,
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL
);

-- Message Status Table (for tracking read/delivery status)
CREATE TABLE IF NOT EXISTS message_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_delivered BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(message_id, user_id)
);

-- Message Reactions Table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction)
);

-- Indexes for Performance Optimization

-- Chat Sessions Indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_load_id ON chat_sessions(load_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message_at ON chat_sessions(last_message_at DESC);

-- Chat Participants Indexes
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_is_active ON chat_participants(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_type ON chat_participants(user_type);

-- Messages Indexes
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_system ON messages(is_system_message) WHERE is_system_message = TRUE;
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- Message Status Indexes
CREATE INDEX IF NOT EXISTS idx_message_status_message_id ON message_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_status_user_id ON message_status(user_id);
CREATE INDEX IF NOT EXISTS idx_message_status_is_read ON message_status(is_read) WHERE is_read = FALSE;

-- Message Reactions Indexes
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

-- Functions and Triggers

-- Function to update chat_sessions.last_message_at and last_message_text when a new message is inserted
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions
  SET 
    last_message_at = NEW.created_at,
    last_message_text = CASE 
      WHEN NEW.is_system_message THEN 'System: ' || NEW.content
      ELSE NEW.content
    END,
    updated_at = NOW()
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_last_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_last_message();

-- Function to automatically create message_status records for all participants when a new message is inserted
CREATE OR REPLACE FUNCTION create_message_status_for_participants()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO message_status (message_id, user_id, is_delivered, is_read)
  SELECT 
    NEW.id,
    cp.user_id,
    CASE WHEN cp.user_id = NEW.sender_id THEN TRUE ELSE FALSE END,
    CASE WHEN cp.user_id = NEW.sender_id THEN TRUE ELSE FALSE END
  FROM chat_participants cp
  WHERE cp.chat_id = NEW.chat_id AND cp.is_active = TRUE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_message_status
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION create_message_status_for_participants();

-- Function to update chat_participants.last_read_at when a message is marked as read
CREATE OR REPLACE FUNCTION update_participant_last_read()
RETURNS TRIGGER AS $$
DECLARE
  v_chat_id UUID;
BEGIN
  -- Get the chat_id for this message
  SELECT chat_id INTO v_chat_id FROM messages WHERE id = NEW.message_id;
  
  -- Update the participant's last_read_at timestamp
  UPDATE chat_participants
  SET last_read_at = NEW.read_at
  WHERE chat_id = v_chat_id AND user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_participant_last_read
AFTER UPDATE OF is_read, read_at ON message_status
FOR EACH ROW
WHEN (NEW.is_read = TRUE AND OLD.is_read = FALSE)
EXECUTE FUNCTION update_participant_last_read();

-- Helper function to mark all messages in a chat as read for a user
CREATE OR REPLACE FUNCTION mark_chat_messages_as_read(
  p_chat_id UUID,
  p_user_id UUID
) RETURNS VOID AS $$
DECLARE
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Update message_status for all unread messages in this chat
  UPDATE message_status
  SET 
    is_read = TRUE,
    read_at = v_now
  FROM messages
  WHERE 
    message_status.message_id = messages.id AND
    messages.chat_id = p_chat_id AND
    message_status.user_id = p_user_id AND
    message_status.is_read = FALSE;
    
  -- Update the participant's last_read_at timestamp
  UPDATE chat_participants
  SET last_read_at = v_now
  WHERE chat_id = p_chat_id AND user_id = p_user_id;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new chat with participants
CREATE OR REPLACE FUNCTION create_chat(
  participant_ids UUID[],
  chat_title TEXT DEFAULT NULL,
  is_group_chat BOOLEAN DEFAULT FALSE,
  load_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_chat_id UUID;
  v_participant_id UUID;
  v_user_type TEXT;
  v_first_participant BOOLEAN := TRUE;
BEGIN
  -- Create the chat session
  INSERT INTO chat_sessions (title, is_group, load_id)
  VALUES (chat_title, is_group_chat, load_id)
  RETURNING id INTO v_chat_id;
  
  -- Add participants
  FOREACH v_participant_id IN ARRAY participant_ids
  LOOP
    -- Get user type from profiles
    SELECT role INTO v_user_type FROM profiles WHERE id = v_participant_id;
    
    -- Add participant (first participant is admin)
    INSERT INTO chat_participants (
      chat_id, 
      user_id, 
      user_type, 
      role
    )
    VALUES (
      v_chat_id, 
      v_participant_id, 
      v_user_type, 
      CASE WHEN v_first_participant THEN 'admin' ELSE 'member' END
    );
    
    v_first_participant := FALSE;
  END LOOP;
  
  RETURN v_chat_id;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Chat Sessions Policies

-- Users can view chat sessions they participate in
CREATE POLICY "Users can view their chat sessions"
  ON chat_sessions
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM chat_participants 
      WHERE chat_id = id AND is_active = TRUE
    )
  );

-- Only admins can create chat sessions (through the create_chat function)
CREATE POLICY "Only admins can create chat sessions"
  ON chat_sessions
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role = 'admin'
    ) OR 
    -- Allow service role to create chats
    (SELECT current_setting('role') = 'service_role')
  );

-- Only admins or chat admins can update chat sessions
CREATE POLICY "Admins or chat admins can update chat sessions"
  ON chat_sessions
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role = 'admin'
    ) OR
    auth.uid() IN (
      SELECT user_id 
      FROM chat_participants 
      WHERE chat_id = id AND role = 'admin' AND is_active = TRUE
    )
  );

-- Chat Participants Policies

-- Users can view participants in chats they participate in
CREATE POLICY "Users can view participants in their chats"
  ON chat_participants
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM chat_participants 
      WHERE chat_id = chat_id AND is_active = TRUE
    )
  );

-- Only admins or chat admins can add participants
CREATE POLICY "Admins or chat admins can add participants"
  ON chat_participants
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role = 'admin'
    ) OR
    auth.uid() IN (
      SELECT user_id 
      FROM chat_participants 
      WHERE chat_id = chat_id AND role = 'admin' AND is_active = TRUE
    ) OR
    -- Allow service role to add participants
    (SELECT current_setting('role') = 'service_role')
  );

-- Only admins, chat admins, or the participant themselves can update participant status
CREATE POLICY "Admins, chat admins, or self can update participant status"
  ON chat_participants
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role = 'admin'
    ) OR
    auth.uid() IN (
      SELECT user_id 
      FROM chat_participants 
      WHERE chat_id = chat_id AND role = 'admin' AND is_active = TRUE
    ) OR
    auth.uid() = user_id
  );

-- Messages Policies

-- Users can view messages in chats they participate in
CREATE POLICY "Users can view messages in their chats"
  ON messages
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM chat_participants 
      WHERE chat_id = chat_id AND is_active = TRUE
    )
  );

-- Users can insert messages in chats they actively participate in
CREATE POLICY "Users can send messages to their active chats"
  ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id 
      FROM chat_participants 
      WHERE chat_id = chat_id AND is_active = TRUE
    ) AND
    auth.uid() = sender_id
  );

-- Users can only update their own messages
CREATE POLICY "Users can update their own messages"
  ON messages
  FOR UPDATE
  USING (
    auth.uid() = sender_id
  );

-- Message Status Policies

-- Users can view message status for messages in their chats
CREATE POLICY "Users can view message status in their chats"
  ON message_status
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT cp.user_id 
      FROM chat_participants cp
      JOIN messages m ON cp.chat_id = m.chat_id
      WHERE m.id = message_id AND cp.is_active = TRUE
    )
  );

-- Users can only update their own message status
CREATE POLICY "Users can update their own message status"
  ON message_status
  FOR UPDATE
  USING (
    auth.uid() = user_id
  );

-- Message Reactions Policies

-- Users can view reactions in chats they participate in
CREATE POLICY "Users can view reactions in their chats"
  ON message_reactions
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT cp.user_id 
      FROM chat_participants cp
      JOIN messages m ON cp.chat_id = m.chat_id
      WHERE m.id = message_id AND cp.is_active = TRUE
    )
  );

-- Users can add reactions to messages in chats they participate in
CREATE POLICY "Users can add reactions to messages in their chats"
  ON message_reactions
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT cp.user_id 
      FROM chat_participants cp
      JOIN messages m ON cp.chat_id = m.chat_id
      WHERE m.id = message_id AND cp.is_active = TRUE
    ) AND
    auth.uid() = user_id
  );

-- Users can only delete their own reactions
CREATE POLICY "Users can delete their own reactions"
  ON message_reactions
  FOR DELETE
  USING (
    auth.uid() = user_id
  );

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(
  p_user_id UUID,
  p_chat_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_chat_id IS NULL THEN
    -- Get total unread messages across all chats
    SELECT COUNT(*) INTO v_count
    FROM message_status ms
    JOIN messages m ON ms.message_id = m.id
    JOIN chat_participants cp ON m.chat_id = cp.chat_id AND ms.user_id = cp.user_id
    WHERE 
      ms.user_id = p_user_id AND
      ms.is_read = FALSE AND
      m.sender_id != p_user_id AND
      cp.is_active = TRUE;
  ELSE
    -- Get unread messages for a specific chat
    SELECT COUNT(*) INTO v_count
    FROM message_status ms
    JOIN messages m ON ms.message_id = m.id
    WHERE 
      ms.user_id = p_user_id AND
      m.chat_id = p_chat_id AND
      ms.is_read = FALSE AND
      m.sender_id != p_user_id;
  END IF;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get recent chats for a user with unread counts
CREATE OR REPLACE FUNCTION get_recent_chats(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  chat_id UUID,
  title TEXT,
  is_group BOOLEAN,
  load_id UUID,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER,
  participants JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_chats AS (
    SELECT 
      cs.id,
      cs.title,
      cs.is_group,
      cs.load_id,
      cs.last_message_text,
      cs.last_message_at,
      get_unread_message_count(p_user_id, cs.id) AS unread_count
    FROM chat_sessions cs
    JOIN chat_participants cp ON cs.id = cp.chat_id
    WHERE 
      cp.user_id = p_user_id AND
      cp.is_active = TRUE
    ORDER BY cs.last_message_at DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT 
    uc.id,
    uc.title,
    uc.is_group,
    uc.load_id,
    uc.last_message_text,
    uc.last_message_at,
    uc.unread_count,
    COALESCE(
      (SELECT 
        jsonb_agg(
          jsonb_build_object(
            'user_id', cp.user_id,
            'user_type', cp.user_type,
            'role', cp.role,
            'is_active', cp.is_active,
            'profile', jsonb_build_object(
              'first_name', p.first_name,
              'last_name', p.last_name,
              'avatar_url', p.avatar_url
            )
          )
        )
      FROM chat_participants cp
      LEFT JOIN profiles p ON cp.user_id = p.id
      WHERE cp.chat_id = uc.id AND cp.is_active = TRUE
      ), '[]'::jsonb
    ) AS participants
  FROM user_chats uc;
END;
$$ LANGUAGE plpgsql;
