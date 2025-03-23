-- Create notification tables

-- User notification preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enable_push BOOLEAN NOT NULL DEFAULT TRUE,
  enable_sms BOOLEAN NOT NULL DEFAULT TRUE,
  enable_email BOOLEAN NOT NULL DEFAULT TRUE,
  quiet_hours_start VARCHAR(5),
  quiet_hours_end VARCHAR(5),
  notification_types JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User devices for push notifications
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
  token TEXT NOT NULL,
  device_name VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deactivation_reason VARCHAR(255),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- In-app notifications
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_notification_type CHECK (
    type IN ('new_message', 'load_assigned', 'load_status_change', 'document_uploaded', 'payment_status')
  )
);

-- Notification delivery tracking
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('push', 'sms', 'email', 'in_app')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'sending', 'delivered', 'failed', 'throttled', 'skipped')),
  data JSONB,
  delivery_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_delivery_notification_type CHECK (
    notification_type IN ('new_message', 'load_assigned', 'load_status_change', 'document_uploaded', 'payment_status')
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user_id ON notification_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON notification_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_created_at ON notification_deliveries(created_at);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_is_active ON user_devices(is_active);

-- Add phone_number column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'phone_number') THEN
    ALTER TABLE profiles ADD COLUMN phone_number VARCHAR(20);
  END IF;
END $$;

-- Enable row level security
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;

-- Create policies for user_notification_preferences
CREATE POLICY "Users can view their own notification preferences" 
ON user_notification_preferences FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notification preferences" 
ON user_notification_preferences FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- Create policies for user_devices
CREATE POLICY "Users can view their own devices" 
ON user_devices FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own devices" 
ON user_devices FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own devices" 
ON user_devices FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own devices" 
ON user_devices FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- Create policies for user_notifications
CREATE POLICY "Users can view their own notifications" 
ON user_notifications FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
ON user_notifications FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- Create policies for notification_deliveries
CREATE POLICY "Users can view their own notification deliveries" 
ON notification_deliveries FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$;

-- Create function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE user_notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE user_id = auth.uid() AND is_read = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
