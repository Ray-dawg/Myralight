-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  load_id UUID NOT NULL REFERENCES loads(id),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_role TEXT NOT NULL CHECK (sender_role IN ('driver', 'carrier', 'shipper', 'admin')),
  content TEXT,
  attachment_url TEXT,
  attachment_type TEXT,
  timestamp BIGINT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  load_id UUID NOT NULL REFERENCES loads(id) UNIQUE,
  participants UUID[] NOT NULL,
  last_message_timestamp BIGINT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for message attachments
CREATE POLICY "Authenticated users can upload attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Attachments are publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'message-attachments');

CREATE POLICY "Users can update their own attachments"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'message-attachments' AND owner = auth.uid());

CREATE POLICY "Users can delete their own attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'message-attachments' AND owner = auth.uid());

-- Create function to update chat room on message insert
CREATE OR REPLACE FUNCTION update_chat_room_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update existing chat room
  UPDATE chat_rooms
  SET 
    last_message_timestamp = NEW.timestamp,
    updated_at = NOW()
  WHERE load_id = NEW.load_id;
  
  -- If no chat room exists, create one
  IF NOT FOUND THEN
    -- Get participants (this is simplified, in reality you'd need to query for all relevant users)
    INSERT INTO chat_rooms (load_id, participants, last_message_timestamp)
    SELECT 
      NEW.load_id,
      ARRAY(
        SELECT DISTINCT u.id 
        FROM auth.users u 
        JOIN loads l ON (l.id = NEW.load_id AND 
                        (u.id = l.shipper_id OR 
                         u.id = l.carrier_id OR 
                         u.id = l.driver_id OR
                         u.id = NEW.sender_id))
      ),
      NEW.timestamp;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message insert
CREATE TRIGGER update_chat_room_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_room_on_message();

-- Create indexes for performance
CREATE INDEX idx_messages_load_id ON messages(load_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_chat_rooms_load_id ON chat_rooms(load_id);
CREATE INDEX idx_chat_rooms_participants ON chat_rooms USING GIN(participants);
