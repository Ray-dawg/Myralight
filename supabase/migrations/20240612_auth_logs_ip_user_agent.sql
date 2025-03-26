-- This migration ensures the auth_logs table has ip_address and user_agent columns
-- These columns were already defined in the interface but we're making sure they exist in the database

-- Check if the columns already exist and add them if they don't
DO $$ 
BEGIN
  -- Check for ip_address column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'auth_logs' AND column_name = 'ip_address') THEN
    ALTER TABLE auth_logs ADD COLUMN ip_address TEXT;
  END IF;
  
  -- Check for user_agent column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'auth_logs' AND column_name = 'user_agent') THEN
    ALTER TABLE auth_logs ADD COLUMN user_agent TEXT;
  END IF;
  
  -- Create index on ip_address for faster searches
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'auth_logs_ip_address_idx') THEN
    CREATE INDEX auth_logs_ip_address_idx ON auth_logs(ip_address);
  END IF;
  
  -- Create index on user_agent for faster searches
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'auth_logs_user_agent_idx') THEN
    CREATE INDEX auth_logs_user_agent_idx ON auth_logs(user_agent);
  END IF;
END $$;

-- Add role-based access control for email templates
DO $$ 
BEGIN
  -- Create RLS policy for email_templates if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_templates' AND policyname = 'admin_only_edit') THEN
    -- Enable RLS on email_templates table
    ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for read access (everyone can read)
    CREATE POLICY "read_access" ON email_templates
      FOR SELECT USING (true);
      
    -- Create policy for write access (only admins can modify)
    CREATE POLICY "admin_only_edit" ON email_templates
      FOR UPDATE USING (auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'admin'
      ));
      
    -- Create policy for insert access (only admins can create)
    CREATE POLICY "admin_only_insert" ON email_templates
      FOR INSERT WITH CHECK (auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'admin'
      ));
      
    -- Create policy for delete access (only admins can delete)
    CREATE POLICY "admin_only_delete" ON email_templates
      FOR DELETE USING (auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'admin'
      ));
  END IF;
END $$;
