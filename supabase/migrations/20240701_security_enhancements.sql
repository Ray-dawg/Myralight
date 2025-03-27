-- Create table for revoked tokens
CREATE TABLE IF NOT EXISTS revoked_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  revoked_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on token_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_token_id ON revoked_tokens(token_id);

-- Create table for session security information
CREATE TABLE IF NOT EXISTS session_security (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on session_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_session_security_session_id ON session_security(session_id);

-- Create table for admin IP whitelist
CREATE TABLE IF NOT EXISTS admin_ip_whitelist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL UNIQUE,
  description TEXT,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE revoked_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_ip_whitelist ENABLE ROW LEVEL SECURITY;

-- Create policies for revoked_tokens
CREATE POLICY "Admins can view all revoked tokens" 
ON revoked_tokens FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can view their own revoked tokens" 
ON revoked_tokens FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Only admins can insert revoked tokens" 
ON revoked_tokens FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Create policies for session_security
CREATE POLICY "Admins can view all session security info" 
ON session_security FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can view their own session security info" 
ON session_security FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own session security info" 
ON session_security FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create policies for admin_ip_whitelist
CREATE POLICY "Anyone can view admin IP whitelist" 
ON admin_ip_whitelist FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage admin IP whitelist" 
ON admin_ip_whitelist FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Add realtime publication for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE revoked_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE session_security;
ALTER PUBLICATION supabase_realtime ADD TABLE admin_ip_whitelist;
