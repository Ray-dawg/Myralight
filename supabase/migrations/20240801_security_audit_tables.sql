-- Create security_audits table to track security audit runs
CREATE TABLE IF NOT EXISTS security_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  audit_type TEXT NOT NULL CHECK (audit_type IN ('scheduled', 'manual', 'automated')),
  findings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create security_events table to store security-related events
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create vulnerability_reports table to store vulnerability findings
CREATE TABLE IF NOT EXISTS vulnerability_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES security_audits(id),
  vulnerability_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  affected_component TEXT NOT NULL,
  description TEXT NOT NULL,
  remediation_steps TEXT,
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'wont_fix')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create security_scan_results table to store results from automated scans
CREATE TABLE IF NOT EXISTS security_scan_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_type TEXT NOT NULL CHECK (scan_type IN ('dependency', 'static_analysis', 'dynamic_analysis', 'penetration_test')),
  scan_tool TEXT NOT NULL,
  scan_date TIMESTAMP WITH TIME ZONE NOT NULL,
  findings_count INTEGER NOT NULL,
  critical_count INTEGER NOT NULL,
  high_count INTEGER NOT NULL,
  medium_count INTEGER NOT NULL,
  low_count INTEGER NOT NULL,
  report_url TEXT,
  raw_results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE security_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vulnerability_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_scan_results ENABLE ROW LEVEL SECURITY;

-- Create policies for security_audits
DROP POLICY IF EXISTS "Admins can see all security audits" ON security_audits;
CREATE POLICY "Admins can see all security audits" 
  ON security_audits FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Admins can insert security audits" ON security_audits;
CREATE POLICY "Admins can insert security audits" 
  ON security_audits FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Admins can update security audits" ON security_audits;
CREATE POLICY "Admins can update security audits" 
  ON security_audits FOR UPDATE 
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for security_events
DROP POLICY IF EXISTS "Admins can see all security events" ON security_events;
CREATE POLICY "Admins can see all security events" 
  ON security_events FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Security events can be inserted by any authenticated user" ON security_events;
CREATE POLICY "Security events can be inserted by any authenticated user" 
  ON security_events FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Create policies for vulnerability_reports
DROP POLICY IF EXISTS "Admins can see all vulnerability reports" ON vulnerability_reports;
CREATE POLICY "Admins can see all vulnerability reports" 
  ON vulnerability_reports FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Admins can insert vulnerability reports" ON vulnerability_reports;
CREATE POLICY "Admins can insert vulnerability reports" 
  ON vulnerability_reports FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Admins can update vulnerability reports" ON vulnerability_reports;
CREATE POLICY "Admins can update vulnerability reports" 
  ON vulnerability_reports FOR UPDATE 
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for security_scan_results
DROP POLICY IF EXISTS "Admins can see all security scan results" ON security_scan_results;
CREATE POLICY "Admins can see all security scan results" 
  ON security_scan_results FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Admins can insert security scan results" ON security_scan_results;
CREATE POLICY "Admins can insert security scan results" 
  ON security_scan_results FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS security_audits_status_idx ON security_audits(status);
CREATE INDEX IF NOT EXISTS security_audits_audit_type_idx ON security_audits(audit_type);
CREATE INDEX IF NOT EXISTS security_events_event_type_idx ON security_events(event_type);
CREATE INDEX IF NOT EXISTS security_events_severity_idx ON security_events(severity);
CREATE INDEX IF NOT EXISTS vulnerability_reports_status_idx ON vulnerability_reports(status);
CREATE INDEX IF NOT EXISTS vulnerability_reports_severity_idx ON vulnerability_reports(severity);
CREATE INDEX IF NOT EXISTS security_scan_results_scan_type_idx ON security_scan_results(scan_type);

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE security_audits;
ALTER PUBLICATION supabase_realtime ADD TABLE security_events;
ALTER PUBLICATION supabase_realtime ADD TABLE vulnerability_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE security_scan_results;
