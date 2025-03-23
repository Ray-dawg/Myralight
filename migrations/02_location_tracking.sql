-- Create location_history table for storing driver location updates
CREATE TABLE IF NOT EXISTS location_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES users(id),
  load_id UUID NOT NULL REFERENCES loads(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT location_history_driver_load_timestamp_key UNIQUE (driver_id, load_id, timestamp)
);

-- Add index for querying location history by load
CREATE INDEX IF NOT EXISTS idx_location_history_load_id ON location_history(load_id);

-- Add index for querying location history by driver
CREATE INDEX IF NOT EXISTS idx_location_history_driver_id ON location_history(driver_id);

-- Add index for timestamp-based queries
CREATE INDEX IF NOT EXISTS idx_location_history_timestamp ON location_history(timestamp);

-- Create geofences table for storing geofence definitions
CREATE TABLE IF NOT EXISTS geofences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  load_id UUID NOT NULL REFERENCES loads(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius INTEGER NOT NULL, -- in meters
  type VARCHAR(50) NOT NULL, -- 'pickup' or 'delivery'
  external_id VARCHAR(255), -- ID from HERE Maps API
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for querying geofences by load
CREATE INDEX IF NOT EXISTS idx_geofences_load_id ON geofences(load_id);

-- Create tracking_sessions table for storing active tracking sessions
CREATE TABLE IF NOT EXISTS tracking_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES users(id),
  load_id UUID NOT NULL REFERENCES loads(id),
  pickup_geofence_id UUID REFERENCES geofences(id),
  delivery_geofence_id UUID REFERENCES geofences(id),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  update_interval INTEGER NOT NULL DEFAULT 30000, -- in milliseconds
  last_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tracking_sessions_driver_id_key UNIQUE (driver_id)
);

-- Add index for querying tracking sessions by load
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_load_id ON tracking_sessions(load_id);

-- Add geofence_events table for storing geofence entry/exit events
CREATE TABLE IF NOT EXISTS geofence_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES users(id),
  load_id UUID NOT NULL REFERENCES loads(id),
  geofence_id UUID NOT NULL REFERENCES geofences(id),
  event_type VARCHAR(50) NOT NULL, -- 'enter' or 'exit'
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for querying geofence events by load
CREATE INDEX IF NOT EXISTS idx_geofence_events_load_id ON geofence_events(load_id);

-- Add index for querying geofence events by driver
CREATE INDEX IF NOT EXISTS idx_geofence_events_driver_id ON geofence_events(driver_id);

-- Add RLS policies for location_history
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;

-- Admins can see all location history
CREATE POLICY admin_all_location_history ON location_history
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Carriers can see location history for their drivers
CREATE POLICY carrier_location_history ON location_history
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT c.id FROM carriers c
      JOIN users u ON u.carrier_id = c.id
      WHERE u.id = location_history.driver_id
    )
  );

-- Drivers can see their own location history
CREATE POLICY driver_own_location_history ON location_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = driver_id);

-- Shippers can see location history for their loads
CREATE POLICY shipper_load_location_history ON location_history
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT l.shipper_id FROM loads l
      WHERE l.id = location_history.load_id
    )
  );
