-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_type TEXT,
  p_related_entity_id UUID DEFAULT NULL,
  p_related_entity_type TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  new_notification_id UUID;
  result JSONB;
BEGIN
  -- Generate a new UUID for the notification
  new_notification_id := gen_random_uuid();
  
  -- Insert the new notification
  INSERT INTO notifications (
    id, 
    user_id, 
    title, 
    content, 
    type, 
    is_read, 
    related_entity_id, 
    related_entity_type
  )
  VALUES (
    new_notification_id, 
    p_user_id, 
    p_title, 
    p_content, 
    p_type, 
    FALSE, 
    p_related_entity_id, 
    p_related_entity_type
  );
  
  -- Return the created notification
  SELECT jsonb_build_object(
    'id', id,
    'user_id', user_id,
    'title', title,
    'content', content,
    'type', type,
    'is_read', is_read,
    'created_at', created_at,
    'related_entity_id', related_entity_id,
    'related_entity_type', related_entity_type
  ) INTO result
  FROM notifications
  WHERE id = new_notification_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(
  p_user_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Update all unread notifications for the user
  UPDATE notifications
  SET is_read = TRUE, updated_at = NOW()
  WHERE 
    user_id = p_user_id AND 
    is_read = FALSE;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count for a user
CREATE OR REPLACE FUNCTION get_unread_notification_count(
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM notifications
  WHERE 
    user_id = p_user_id AND
    is_read = FALSE;
    
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a chat message notification
CREATE OR REPLACE FUNCTION create_chat_message_notification(
  p_user_id UUID,
  p_sender_name TEXT,
  p_chat_id UUID,
  p_message_content TEXT
) RETURNS JSONB AS $$
DECLARE
  title TEXT;
  content TEXT;
  result JSONB;
BEGIN
  -- Format the notification title and content
  title := 'New message from ' || p_sender_name;
  
  -- Truncate long messages
  IF length(p_message_content) > 50 THEN
    content := substring(p_message_content from 1 for 47) || '...';
  ELSE
    content := p_message_content;
  END IF;
  
  -- Create the notification
  SELECT create_notification(
    p_user_id,
    title,
    content,
    'new_message',
    p_chat_id,
    'chat'
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a load status notification
CREATE OR REPLACE FUNCTION create_load_status_notification(
  p_user_id UUID,
  p_load_id UUID,
  p_status TEXT,
  p_load_reference TEXT
) RETURNS JSONB AS $$
DECLARE
  title TEXT;
  content TEXT;
  result JSONB;
BEGIN
  -- Format the notification title and content based on status
  CASE p_status
    WHEN 'assigned' THEN
      title := 'Load Assigned';
      content := 'Load ' || p_load_reference || ' has been assigned to you.';
    WHEN 'in_transit' THEN
      title := 'Load In Transit';
      content := 'Load ' || p_load_reference || ' is now in transit.';
    WHEN 'delivered' THEN
      title := 'Load Delivered';
      content := 'Load ' || p_load_reference || ' has been delivered.';
    WHEN 'completed' THEN
      title := 'Load Completed';
      content := 'Load ' || p_load_reference || ' has been completed.';
    ELSE
      title := 'Load Status Update';
      content := 'Load ' || p_load_reference || ' status changed to ' || p_status || '.';
  END CASE;
  
  -- Create the notification
  SELECT create_notification(
    p_user_id,
    title,
    content,
    'load_status',
    p_load_id,
    'load'
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a document notification
CREATE OR REPLACE FUNCTION create_document_notification(
  p_user_id UUID,
  p_document_id UUID,
  p_document_type TEXT,
  p_entity_id UUID,
  p_entity_type TEXT
) RETURNS JSONB AS $$
DECLARE
  title TEXT;
  content TEXT;
  result JSONB;
BEGIN
  -- Format the notification title and content based on document type
  title := 'New ' || p_document_type || ' Document';
  content := 'A new ' || p_document_type || ' document has been uploaded.';
  
  -- Create the notification
  SELECT create_notification(
    p_user_id,
    title,
    content,
    'document_uploaded',
    p_document_id,
    'document'
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
