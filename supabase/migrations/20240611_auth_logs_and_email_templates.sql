-- Create auth_logs table for authentication event logging
CREATE TABLE IF NOT EXISTS auth_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  role TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  level TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);

-- Create index on event_type for faster queries
CREATE INDEX IF NOT EXISTS idx_auth_logs_event_type ON auth_logs(event_type);

-- Create index on level for faster queries
CREATE INDEX IF NOT EXISTS idx_auth_logs_level ON auth_logs(level);

-- Create index on created_at for faster time-based queries
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);

-- Create email_templates table for storing customizable email templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_type TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create RLS policies for auth_logs
-- Only allow authenticated users to view their own logs
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own logs" ON auth_logs;
CREATE POLICY "Users can view their own logs"
  ON auth_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Allow admins to view all logs
DROP POLICY IF EXISTS "Admins can view all logs" ON auth_logs;
CREATE POLICY "Admins can view all logs"
  ON auth_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only allow the system to insert logs
DROP POLICY IF EXISTS "System can insert logs" ON auth_logs;
CREATE POLICY "System can insert logs"
  ON auth_logs FOR INSERT
  WITH CHECK (true);

-- Create RLS policies for email_templates
-- Only allow admins to manage email templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active email templates" ON email_templates;
CREATE POLICY "Anyone can view active email templates"
  ON email_templates FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage email templates" ON email_templates;
CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default email templates
INSERT INTO email_templates (template_type, subject, html_content, text_content)
VALUES
  ('verification', 'Verify your email for Modern Trucking Platform', '<h1>Verify Your Email</h1><p>Please click the link below to verify your email address:</p><p>{{verification_url}}</p>', 'Verify Your Email\n\nPlease click the link below to verify your email address:\n\n{{verification_url}}'),
  ('reset_password', 'Reset your password for Modern Trucking Platform', '<h1>Reset Your Password</h1><p>Please click the link below to reset your password:</p><p>{{reset_url}}</p>', 'Reset Your Password\n\nPlease click the link below to reset your password:\n\n{{reset_url}}'),
  ('magic_link', 'Your login link for Modern Trucking Platform', '<h1>Your Login Link</h1><p>Please click the link below to log in:</p><p>{{magic_link_url}}</p>', 'Your Login Link\n\nPlease click the link below to log in:\n\n{{magic_link_url}}'),
  ('welcome', 'Welcome to Modern Trucking Platform', '<h1>Welcome to Modern Trucking Platform</h1><p>Thank you for joining our platform. We are excited to have you on board!</p>', 'Welcome to Modern Trucking Platform\n\nThank you for joining our platform. We are excited to have you on board!'),
  ('mfa_enabled', 'Multi-Factor Authentication Enabled', '<h1>MFA Enabled</h1><p>Multi-Factor Authentication has been enabled for your account.</p>', 'MFA Enabled\n\nMulti-Factor Authentication has been enabled for your account.')
ON CONFLICT (template_type) DO NOTHING;

-- Enable realtime for auth_logs
alter publication supabase_realtime add table auth_logs;
