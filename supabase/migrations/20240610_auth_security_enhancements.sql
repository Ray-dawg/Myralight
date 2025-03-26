-- Create auth_attempts table for rate limiting
CREATE TABLE IF NOT EXISTS auth_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  action TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_auth_attempts_email_action_success ON auth_attempts(email, action, success, created_at);

-- Add avatar_url column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Add preferences column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferences') THEN
    ALTER TABLE profiles ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create role_permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, permission)
);

-- Insert default permissions for each role
INSERT INTO role_permissions (role, permission)
VALUES 
  -- Admin permissions
  ('admin', 'users:read'),
  ('admin', 'users:write'),
  ('admin', 'users:delete'),
  ('admin', 'loads:read'),
  ('admin', 'loads:write'),
  ('admin', 'loads:delete'),
  ('admin', 'settings:read'),
  ('admin', 'settings:write'),
  
  -- Driver permissions
  ('driver', 'loads:read'),
  ('driver', 'loads:update'),
  ('driver', 'profile:read'),
  ('driver', 'profile:write'),
  ('driver', 'documents:read'),
  ('driver', 'documents:write'),
  
  -- Carrier permissions
  ('carrier', 'drivers:read'),
  ('carrier', 'drivers:write'),
  ('carrier', 'loads:read'),
  ('carrier', 'loads:write'),
  ('carrier', 'profile:read'),
  ('carrier', 'profile:write'),
  
  -- Shipper permissions
  ('shipper', 'loads:read'),
  ('shipper', 'loads:write'),
  ('shipper', 'loads:delete'),
  ('shipper', 'profile:read'),
  ('shipper', 'profile:write')
ON CONFLICT (role, permission) DO NOTHING;
