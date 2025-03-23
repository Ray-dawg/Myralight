-- Payment Processing Integration Schema

-- Table for email configuration settings
CREATE TABLE IF NOT EXISTS email_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sender_email VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  smtp_host VARCHAR(255) NOT NULL,
  smtp_port INTEGER NOT NULL,
  smtp_username VARCHAR(255) NOT NULL,
  smtp_password VARCHAR(255) NOT NULL,
  smtp_secure BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Table for payment processor configurations
CREATE TABLE IF NOT EXISTS payment_processors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  processor_type VARCHAR(50) NOT NULL, -- 'EMAIL', 'API', etc.
  email_addresses TEXT[], -- Array of email addresses for email-based processors
  api_endpoint VARCHAR(255), -- For API-based processors
  api_key VARCHAR(255), -- Encrypted API key
  api_secret VARCHAR(255), -- Encrypted API secret
  additional_config JSONB, -- Flexible configuration options
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Table for scheduled tasks
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  task_type VARCHAR(50) NOT NULL, -- 'BOL_SUBMISSION', 'INVOICE_GENERATION', etc.
  schedule_type VARCHAR(50) NOT NULL, -- 'DAILY', 'HOURLY', 'CUSTOM'
  schedule_config JSONB NOT NULL, -- Flexible scheduling configuration
  processor_id UUID REFERENCES payment_processors(id),
  email_config_id UUID REFERENCES email_configurations(id),
  filter_criteria JSONB, -- Criteria for selecting documents to process
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Table for document submission tracking
CREATE TABLE IF NOT EXISTS document_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id),
  task_id UUID NOT NULL REFERENCES scheduled_tasks(id),
  processor_id UUID NOT NULL REFERENCES payment_processors(id),
  submission_status VARCHAR(50) NOT NULL, -- 'PENDING', 'SENT', 'FAILED', 'PROCESSED'
  submission_time TIMESTAMP WITH TIME ZONE,
  response_data JSONB, -- Response from the payment processor
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_document_submissions_document_id ON document_submissions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_submissions_task_id ON document_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_document_submissions_status ON document_submissions(submission_status);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_next_run ON scheduled_tasks(next_run_at) WHERE is_active = true;

-- Add RLS policies
-- Email configurations - only admins can view/edit
CREATE POLICY "Email configurations are viewable by admins"
  ON email_configurations FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "Email configurations are editable by admins"
  ON email_configurations FOR INSERT
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "Email configurations are updatable by admins"
  ON email_configurations FOR UPDATE
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "Email configurations are deletable by admins"
  ON email_configurations FOR DELETE
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin'));

-- Payment processors - only admins can view/edit
CREATE POLICY "Payment processors are viewable by admins"
  ON payment_processors FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "Payment processors are editable by admins"
  ON payment_processors FOR INSERT
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "Payment processors are updatable by admins"
  ON payment_processors FOR UPDATE
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "Payment processors are deletable by admins"
  ON payment_processors FOR DELETE
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin'));

-- Scheduled tasks - only admins can view/edit
CREATE POLICY "Scheduled tasks are viewable by admins"
  ON scheduled_tasks FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "Scheduled tasks are editable by admins"
  ON scheduled_tasks FOR INSERT
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "Scheduled tasks are updatable by admins"
  ON scheduled_tasks FOR UPDATE
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "Scheduled tasks are deletable by admins"
  ON scheduled_tasks FOR DELETE
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin'));

-- Document submissions - admins can view all, carriers/shippers can view their own
CREATE POLICY "Document submissions are viewable by admins"
  ON document_submissions FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "Document submissions are viewable by document owners"
  ON document_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN loads l ON d.load_id = l.id
      WHERE d.id = document_submissions.document_id
      AND (
        -- User is from the carrier company
        l.carrier_id = (SELECT company_id FROM users WHERE id = auth.uid())
        OR
        -- User is from the shipper company
        l.shipper_id = (SELECT company_id FROM users WHERE id = auth.uid())
      )
    )
  );

-- Create function to update next_run_at based on schedule
CREATE OR REPLACE FUNCTION calculate_next_run_time(task_id UUID)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  task scheduled_tasks;
  next_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the task
  SELECT * INTO task FROM scheduled_tasks WHERE id = task_id;
  
  -- Calculate next run time based on schedule type
  CASE task.schedule_type
    WHEN 'DAILY' THEN
      -- For daily tasks, use the time specified in config
      next_time := (CURRENT_DATE + (task.schedule_config->>'time')::TIME)::TIMESTAMP WITH TIME ZONE;
      -- If that time has already passed today, move to tomorrow
      IF next_time <= NOW() THEN
        next_time := next_time + INTERVAL '1 day';
      END IF;
    
    WHEN 'HOURLY' THEN
      -- For hourly tasks, add the specified number of hours
      next_time := NOW() + ((task.schedule_config->>'hours')::INTEGER || ' hours')::INTERVAL;
    
    WHEN 'CUSTOM' THEN
      -- For custom cron-like schedules, use the interval
      next_time := NOW() + ((task.schedule_config->>'interval')::TEXT)::INTERVAL;
    
    ELSE
      -- Default to daily at midnight
      next_time := (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE;
  END CASE;
  
  RETURN next_time;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update next_run_at when a task is created or updated
CREATE OR REPLACE FUNCTION update_next_run_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if the task is active
  IF NEW.is_active THEN
    NEW.next_run_at := calculate_next_run_time(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_next_run_time
  BEFORE INSERT OR UPDATE ON scheduled_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_next_run_time();
