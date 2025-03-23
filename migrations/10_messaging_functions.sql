-- Function to create a new chat session
CREATE OR REPLACE FUNCTION create_chat(
  participant_ids UUID[],
  chat_name TEXT DEFAULT NULL,
  is_group_chat BOOLEAN DEFAULT FALSE,
  load_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  new_chat_id UUID;
  participant_id UUID;
  first_participant UUID;
  second_participant UUID;
  auto_name TEXT;
  result JSONB;
BEGIN
  -- Generate a new UUID for the chat
  new_chat_id := gen_random_uuid();
  
  -- For non-group chats with 2 participants, auto-generate a name if not provided
  IF NOT is_group_chat AND array_length(participant_ids, 1) = 2 AND chat_name IS NULL THEN
    first_participant := participant_ids[1];
    second_participant := participant_ids[2];
    
    -- Get names of both participants
    SELECT 
      COALESCE(first_name || ' ' || last_name, email) INTO auto_name
    FROM 
      auth.users
    WHERE 
      id = second_participant;
      
    chat_name := auto_name;
  END IF;
  
  -- Insert the new chat
  INSERT INTO chats (id, name, is_group, load_id)
  VALUES (new_chat_id, chat_name, is_group_chat, load_id);
  
  -- Add all participants to the chat
  FOREACH participant_id IN ARRAY participant_ids
  LOOP
    -- First participant is the admin for group chats
    IF is_group_chat AND participant_id = participant_ids[1] THEN
      INSERT INTO chat_participants (chat_id, user_id, role)
      VALUES (new_chat_id, participant_id, 'admin');
    ELSE
      INSERT INTO chat_participants (chat_id, user_id, role)
      VALUES (new_chat_id, participant_id, 'member');
    END IF;
  END LOOP;
  
  -- Return the created chat
  SELECT jsonb_build_object(
    'id', id,
    'name', name,
    'is_group', is_group,
    'load_id', load_id,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO result
  FROM chats
  WHERE id = new_chat_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all messages in a chat as read for a user
CREATE OR REPLACE FUNCTION mark_chat_messages_as_read(
  p_chat_id UUID,
  p_user_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Check if user is a participant in the chat
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_id = p_chat_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this chat';
  END IF;
  
  -- Update all unread messages sent by others
  UPDATE messages
  SET status = 'read', updated_at = NOW()
  WHERE 
    chat_id = p_chat_id AND 
    sender_id != p_user_id AND
    status != 'read';
    
  -- Insert or update read receipts
  INSERT INTO message_read_receipts (message_id, user_id, read_at)
  SELECT id, p_user_id, NOW()
  FROM messages
  WHERE 
    chat_id = p_chat_id AND 
    sender_id != p_user_id
  ON CONFLICT (message_id, user_id)
  DO UPDATE SET read_at = NOW();
  
  -- Update the user's last_read_at in chat_participants
  UPDATE chat_participants
  SET last_read_at = NOW()
  WHERE chat_id = p_chat_id AND user_id = p_user_id;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM messages m
  JOIN chat_participants cp ON m.chat_id = cp.chat_id
  WHERE 
    cp.user_id = p_user_id AND
    m.sender_id != p_user_id AND
    m.status != 'read' AND
    (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at);
    
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent chats with unread messages
CREATE OR REPLACE FUNCTION get_recent_chats_with_unread(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 5
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(chat_data) INTO result
  FROM (
    SELECT 
      c.id,
      c.name,
      c.is_group,
      c.load_id,
      c.last_message,
      c.last_message_at,
      COUNT(m.id) FILTER (WHERE m.sender_id != p_user_id AND m.status != 'read') AS unread_count
    FROM chats c
    JOIN chat_participants cp ON c.id = cp.chat_id
    LEFT JOIN messages m ON c.id = m.chat_id AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
    WHERE cp.user_id = p_user_id
    GROUP BY c.id
    HAVING COUNT(m.id) FILTER (WHERE m.sender_id != p_user_id AND m.status != 'read') > 0
    ORDER BY c.last_message_at DESC NULLS LAST
    LIMIT p_limit
  ) AS chat_data;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to update message status when read
CREATE OR REPLACE FUNCTION update_message_status_on_read()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the message status to 'read' if all participants have read it
  UPDATE messages
  SET status = 'read', updated_at = NOW()
  WHERE id = NEW.message_id AND (
    SELECT COUNT(*) = COUNT(CASE WHEN mrr.read_at IS NOT NULL THEN 1 ELSE NULL END)
    FROM chat_participants cp
    LEFT JOIN message_read_receipts mrr ON mrr.message_id = NEW.message_id AND mrr.user_id = cp.user_id
    WHERE cp.chat_id = (SELECT chat_id FROM messages WHERE id = NEW.message_id)
      AND cp.user_id != (SELECT sender_id FROM messages WHERE id = NEW.message_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message read receipts
CREATE TRIGGER trigger_update_message_status_on_read
AFTER INSERT OR UPDATE ON message_read_receipts
FOR EACH ROW
EXECUTE FUNCTION update_message_status_on_read();

-- Function to get chat participants with user details
CREATE OR REPLACE FUNCTION get_chat_participants_with_details(
  p_chat_id UUID
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(participant_data) INTO result
  FROM (
    SELECT 
      cp.id,
      cp.chat_id,
      cp.user_id,
      cp.role,
      cp.joined_at,
      jsonb_build_object(
        'id', u.id,
        'email', u.email,
        'first_name', up.first_name,
        'last_name', up.last_name,
        'avatar_url', up.avatar_url,
        'is_online', up.is_online,
        'last_seen_at', up.last_seen_at
      ) AS user_details
    FROM chat_participants cp
    JOIN auth.users u ON cp.user_id = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE cp.chat_id = p_chat_id
    ORDER BY cp.role = 'admin' DESC, cp.joined_at ASC
  ) AS participant_data;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
