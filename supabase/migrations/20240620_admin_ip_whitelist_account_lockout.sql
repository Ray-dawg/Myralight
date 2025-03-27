-- Create admin_ip_whitelist table for IP restriction
CREATE TABLE IF NOT EXISTS admin_ip_whitelist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(ip_address)
);

-- Add account_locked column to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'account_locked') THEN
    ALTER TABLE profiles ADD COLUMN account_locked BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add account_locked_until column to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'account_locked_until') THEN
    ALTER TABLE profiles ADD COLUMN account_locked_until TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add failed_login_attempts column to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'failed_login_attempts') THEN
    ALTER TABLE profiles ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
  END IF;
END $$;

-- Insert some example IPs for testing (replace with your actual IPs)
INSERT INTO admin_ip_whitelist (ip_address, description)
VALUES 
  ('127.0.0.1', 'Localhost'),
  ('::1', 'Localhost IPv6')
ON CONFLICT (ip_address) DO NOTHING;

-- Enable realtime for admin_ip_whitelist
alter publication supabase_realtime add table admin_ip_whitelist;
