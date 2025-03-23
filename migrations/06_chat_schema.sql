-- Create load chats table
CREATE TABLE IF NOT EXISTS load_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  load_id UUID REFERENCES loads(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create load chat messages table
CREATE TABLE IF NOT EXISTS load_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  load_id UUID REFERENCES loads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT CHECK (sender_type IN ('shipper', 'carrier', 'driver')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable real-time for chat messages
ALTER TABLE load_chat_messages REPLICA IDENTITY FULL;

-- Set up RLS policies
ALTER TABLE load_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow read access to chat participants
CREATE POLICY "Allow read access to chat participants" ON load_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM loads l
      WHERE l.id = load_id
      AND (l.shipper_id = auth.uid() OR l.carrier_id = auth.uid() OR l.driver_id = auth.uid())
    )
  );

-- Allow insert access to chat participants
CREATE POLICY "Allow insert access to chat participants" ON load_chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM loads l
      WHERE l.id = load_id
      AND (l.shipper_id = auth.uid() OR l.carrier_id = auth.uid() OR l.driver_id = auth.uid())
    )
  );
