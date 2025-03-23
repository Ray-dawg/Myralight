-- Myra Light MVP Database Schema Migration Script
-- For Supabase PostgreSQL Implementation

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ===============================
-- ENUM Types
-- ===============================

-- Load status enum
CREATE TYPE load_status AS ENUM (
  'draft',
  'posted',
  'assigned',
  'in_transit',
  'at_pickup',
  'picked_up',
  'at_delivery',
  'delivered',
  'completed',
  'cancelled'
);

-- Load type enum
CREATE TYPE load_type AS ENUM (
  'ftl',  -- Full Truckload
  'ltl',  -- Less Than Truckload
  'partial',
  'expedited'
);

-- Equipment type enum
CREATE TYPE equipment_type AS ENUM (
  'dry_van',
  'reefer',
  'flatbed',
  'step_deck',
  'lowboy',
  'tanker',
  'container',
  'power_only',
  'hotshot',
  'box_truck',
  'other'
);

-- Location type enum
CREATE TYPE location_type AS ENUM (
  'warehouse',
  'distribution_center',
  'port',
  'terminal',
  'customer_location',
  'other'
);

-- User role enum
CREATE TYPE user_role AS ENUM (
  'admin',
  'shipper',
  'carrier',
  'driver'
);

-- Document type enum
CREATE TYPE document_type AS ENUM (
  'bill_of_lading',
  'proof_of_delivery',
  'rate_confirmation',
  'invoice',
  'weight_ticket',
  'lumper_receipt',
  'other'
);

-- Document verification status enum
CREATE TYPE verification_status AS ENUM (
  'pending',
  'verified',
  'rejected'
);

-- Vehicle type enum
CREATE TYPE vehicle_type AS ENUM (
  'truck',
  'trailer'
);

-- Vehicle status enum
CREATE TYPE vehicle_status AS ENUM (
  'active',
  'maintenance',
  'out_of_service'
);

-- Event type enum
CREATE TYPE event_type AS ENUM (
  'status_change',
  'location_update',
  'document_upload',
  'note_added',
  'driver_assigned',
  'carrier_assigned',
  'bid_submitted',
  'bid_accepted',
  'bid_rejected',
  'eta_updated',
  'delay_reported',
  'system_event'
);

-- Bid status enum
CREATE TYPE bid_status AS ENUM (
  'pending',
  'accepted',
  'rejected',
  'expired',
  'withdrawn'
);

-- Invoice status enum
CREATE TYPE invoice_status AS ENUM (
  'not_invoiced',
  'invoiced',
  'paid',
  'disputed',
  'cancelled'
);

-- Rate type enum
CREATE TYPE rate_type AS ENUM (
  'flat',
  'per_mile',
  'hourly'
);

-- ===============================
-- Tables
-- ===============================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL,
  company_name TEXT,
  company_address TEXT,
  company_city TEXT,
  company_state TEXT,
  company_zip TEXT,
  company_country TEXT DEFAULT 'USA',
  profile_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Carriers table
CREATE TABLE carriers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  dot_number TEXT UNIQUE NOT NULL,
  mc_number TEXT UNIQUE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'USA',
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  fleet_size INTEGER NOT NULL DEFAULT 1,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  insurance_expiry_date TIMESTAMPTZ,
  insurance_coverage_amount INTEGER, -- in cents
  rating DECIMAL(3,2),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Carrier users relationship table
CREATE TABLE carrier_users (
  carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (carrier_id, user_id)
);

-- Shippers table
CREATE TABLE shippers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'USA',
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  credit_score INTEGER,
  payment_terms INTEGER, -- in days
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Shipper users relationship table
CREATE TABLE shipper_users (
  shipper_id UUID NOT NULL REFERENCES shippers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (shipper_id, user_id)
);

-- Drivers table
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  license_number TEXT NOT NULL,
  license_state TEXT NOT NULL,
  license_expiry_date TIMESTAMPTZ NOT NULL,
  hazmat_endorsed BOOLEAN NOT NULL DEFAULT FALSE,
  tanker_endorsed BOOLEAN NOT NULL DEFAULT FALSE,
  double_triple_endorsed BOOLEAN NOT NULL DEFAULT FALSE,
  current_latitude FLOAT,
  current_longitude FLOAT,
  last_location_update TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Vehicles table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  type vehicle_type NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  vin TEXT UNIQUE NOT NULL,
  license_plate TEXT NOT NULL,
  license_state TEXT NOT NULL,
  equipment_type equipment_type NOT NULL,
  capacity INTEGER, -- in pounds
  length FLOAT, -- in feet
  width FLOAT, -- in feet
  height FLOAT, -- in feet
  current_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  status vehicle_status NOT NULL DEFAULT 'active',
  last_maintenance_date TIMESTAMPTZ,
  next_maintenance_date TIMESTAMPTZ,
  current_latitude FLOAT,
  current_longitude FLOAT,
  last_location_update TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Locations table
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'USA',
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  geom GEOGRAPHY(POINT) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  location_type location_type NOT NULL,
  special_instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Loads table
CREATE TABLE loads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_number TEXT UNIQUE NOT NULL,
  shipper_id UUID NOT NULL REFERENCES shippers(id) ON DELETE CASCADE,
  carrier_id UUID REFERENCES carriers(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  status load_status NOT NULL DEFAULT 'draft',
  load_type load_type NOT NULL,
  equipment_type equipment_type NOT NULL,
  equipment_requirements TEXT[],
  
  -- Pickup information
  pickup_location_id UUID NOT NULL REFERENCES locations(id),
  pickup_window_start TIMESTAMPTZ NOT NULL,
  pickup_window_end TIMESTAMPTZ NOT NULL,
  actual_pickup_time TIMESTAMPTZ,
  pickup_instructions TEXT,
  
  -- Delivery information
  delivery_location_id UUID NOT NULL REFERENCES locations(id),
  delivery_window_start TIMESTAMPTZ NOT NULL,
  delivery_window_end TIMESTAMPTZ NOT NULL,
  actual_delivery_time TIMESTAMPTZ,
  delivery_instructions TEXT,
  
  -- Cargo information
  commodity TEXT NOT NULL,
  weight INTEGER NOT NULL, -- in pounds
  length FLOAT, -- in feet
  width FLOAT, -- in feet
  height FLOAT, -- in feet
  pallet_count INTEGER,
  piece_count INTEGER,
  hazmat BOOLEAN NOT NULL DEFAULT FALSE,
  hazmat_details TEXT,
  temperature_min FLOAT, -- in Fahrenheit
  temperature_max FLOAT, -- in Fahrenheit
  
  -- Financial information
  rate INTEGER, -- in cents
  rate_type rate_type,
  estimated_distance FLOAT, -- in miles
  estimated_duration INTEGER, -- in minutes
  accessorials JSONB, -- array of {type, amount, notes}
  invoice_status invoice_status DEFAULT 'not_invoiced',
  invoice_date TIMESTAMPTZ,
  payment_date TIMESTAMPTZ,
  
  -- Tracking information
  tracking_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  current_latitude FLOAT,
  current_longitude FLOAT,
  last_location_update TIMESTAMPTZ,
  estimated_time_of_arrival TIMESTAMPTZ,
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Load stops table (for multi-stop loads)
CREATE TABLE load_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id),
  stop_number INTEGER NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  actual_arrival_time TIMESTAMPTZ,
  instructions TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(load_id, stop_number)
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type event_type NOT NULL,
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  previous_value TEXT,
  new_value TEXT,
  latitude FLOAT,
  longitude FLOAT,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL, -- in bytes
  mime_type TEXT NOT NULL,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_status verification_status NOT NULL DEFAULT 'pending',
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verification_date TIMESTAMPTZ,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bids table
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- in cents
  status bid_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documentation table (for help and documentation content)
CREATE TABLE documentation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[],
  file_url TEXT,
  role user_role NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- ===============================
-- Indexes
-- ===============================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Carriers indexes
CREATE INDEX idx_carriers_dot_number ON carriers(dot_number);
CREATE INDEX idx_carriers_mc_number ON carriers(mc_number);
CREATE INDEX idx_carriers_is_active ON carriers(is_active);

-- Drivers indexes
CREATE INDEX idx_drivers_carrier_id ON drivers(carrier_id);
CREATE INDEX idx_drivers_is_active ON drivers(is_active);
CREATE INDEX idx_drivers_location ON drivers USING GIST (ST_SetSRID(ST_MakePoint(current_longitude, current_latitude), 4326));

-- Vehicles indexes
CREATE INDEX idx_vehicles_carrier_id ON vehicles(carrier_id);
CREATE INDEX idx_vehicles_current_driver_id ON vehicles(current_driver_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);

-- Locations indexes
CREATE INDEX idx_locations_geom ON locations USING GIST(geom);
CREATE INDEX idx_locations_location_type ON locations(location_type);

-- Loads indexes
CREATE INDEX idx_loads_reference_number ON loads(reference_number);
CREATE INDEX idx_loads_shipper_id ON loads(shipper_id);
CREATE INDEX idx_loads_carrier_id ON loads(carrier_id);
CREATE INDEX idx_loads_driver_id ON loads(driver_id);
CREATE INDEX idx_loads_status ON loads(status);
CREATE INDEX idx_loads_pickup_window ON loads(pickup_window_start, pickup_window_end);
CREATE INDEX idx_loads_delivery_window ON loads(delivery_window_start, delivery_window_end);
CREATE INDEX idx_loads_pickup_location_id ON loads(pickup_location_id);
CREATE INDEX idx_loads_delivery_location_id ON loads(delivery_location_id);
CREATE INDEX idx_loads_current_location ON loads USING GIST (ST_SetSRID(ST_MakePoint(current_longitude, current_latitude), 4326));
CREATE INDEX idx_loads_equipment_type ON loads(equipment_type);

-- Events indexes
CREATE INDEX idx_events_load_id ON events(load_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_event_time ON events(event_time);

-- Documents indexes
CREATE INDEX idx_documents_load_id ON documents(load_id);
CREATE INDEX idx_documents_document_type ON documents(document_type);
CREATE INDEX idx_documents_verification_status ON documents(verification_status);

-- Bids indexes
CREATE INDEX idx_bids_load_id ON bids(load_id);
CREATE INDEX idx_bids_carrier_id ON bids(carrier_id);
CREATE INDEX idx_bids_status ON bids(status);
CREATE INDEX idx_bids_expires_at ON bids(expires_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Documentation indexes
CREATE INDEX idx_documentation_category ON documentation(category);
CREATE INDEX idx_documentation_role ON documentation(role);

-- ===============================
-- Views
-- ===============================

-- Active loads view
CREATE VIEW active_loads AS
SELECT l.*, 
  pl.name AS pickup_name, pl.address AS pickup_address, pl.city AS pickup_city, pl.state AS pickup_state, pl.zip_code AS pickup_zip, pl.latitude AS pickup_lat, pl.longitude AS pickup_lng,
  dl.name AS delivery_name, dl.address AS delivery_address, dl.city AS delivery_city, dl.state AS delivery_state, dl.zip_code AS delivery_zip, dl.latitude AS delivery_lat, dl.longitude AS delivery_lng,
  s.company_name AS shipper_name,
  c.name AS carrier_name,
  CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
  d.phone AS driver_phone
FROM loads l
JOIN locations pl ON l.pickup_location_id = pl.id
JOIN locations dl ON l.delivery_location_id = dl.id
JOIN shippers s ON l.shipper_id = s.id
LEFT JOIN carriers c ON l.carrier_id = c.id
LEFT JOIN drivers d ON l.driver_id = d.id
WHERE l.status NOT IN ('completed', 'cancelled');

-- Available loads view (for carriers to bid on)
CREATE VIEW available_loads AS
SELECT l.*, 
  pl.name AS pickup_name, pl.address AS pickup_address, pl.city AS pickup_city, pl.state AS pickup_state, pl.zip_code AS pickup_zip, pl.latitude AS pickup_lat, pl.longitude AS pickup_lng,
  dl.name AS delivery_name, dl.address AS delivery_address, dl.city AS delivery_city, dl.state AS delivery_state, dl.zip_code AS delivery_zip, dl.latitude AS delivery_lat, dl.longitude AS delivery_lng,
  s.company_name AS shipper_name
FROM loads l
JOIN locations pl ON l.pickup_location_id = pl.id
JOIN locations dl ON l.delivery_location_id = dl.id
JOIN shippers s ON l.shipper_id = s.id
WHERE l.status = 'posted';

-- Driver assignments view
CREATE VIEW driver_assignments AS
SELECT 
  d.id AS driver_id,
  d.first_name,
  d.last_name,
  d.phone,
  d.current_latitude,
  d.current_longitude,
  d.last_location_update,
  l.id AS load_id,
  l.reference_number,
  l.status,
  l.pickup_window_start,
  l.pickup_window_end,
  l.delivery_window_start,
  l.delivery_window_end,
  pl.name AS pickup_name,
  pl.address AS pickup_address,
  pl.city AS pickup_city,
  pl.state AS pickup_state,
  pl.latitude AS pickup_lat,
  pl.longitude AS pickup_lng,
  dl.name AS delivery_name,
  dl.address AS delivery_address,
  dl.city AS delivery_city,
  dl.state AS delivery_state,
  dl.latitude AS delivery_lat,
  dl.longitude AS delivery_lng
FROM drivers d
JOIN loads l ON d.id = l.driver_id
JOIN locations pl ON l.pickup_location_id = pl.id
JOIN locations dl ON l.delivery_location_id = dl.id
WHERE l.status IN ('assigned', 'in_transit', 'at_pickup', 'picked_up', 'at_delivery');

-- Carrier performance view
CREATE VIEW carrier_performance AS
SELECT
  c.id AS carrier_id,
  c.name AS carrier_name,
  COUNT(l.id) AS total_loads,
  SUM(CASE WHEN l.status = 'completed' THEN 1 ELSE 0 END) AS completed_loads,
  SUM(CASE WHEN l.status = 'cancelled' AND l.carrier_id IS NOT NULL THEN 1 ELSE 0 END) AS cancelled_loads,
  AVG(CASE 
    WHEN l.status = 'completed' AND l.actual_delivery_time IS NOT NULL AND l.delivery_window_end IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (l.actual_delivery_time - l.delivery_window_end))/3600 
    ELSE NULL 
  END) AS avg_delivery_delay_hours,
  COUNT(DISTINCT d.id) AS active_drivers,
  COUNT(DISTINCT v.id) AS active_vehicles
FROM carriers c
LEFT JOIN loads l ON c.id = l.carrier_id
LEFT JOIN drivers d ON c.id = d.carrier_id AND d.is_active = TRUE
LEFT JOIN vehicles v ON c.id = v.carrier_id AND v.is_active = TRUE
GROUP BY c.id, c.name;

-- ===============================
-- Functions and Triggers
-- ===============================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate load reference number
CREATE OR REPLACE FUNCTION generate_load_reference()
RETURNS TRIGGER AS $$
BEGIN
  -- Format: ML-YYYYMMDD-XXXX (ML = Myra Light, YYYYMMDD = date, XXXX = random alphanumeric)
  NEW.reference_number = 'ML-' || 
                         TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                         UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log load status changes
CREATE OR REPLACE FUNCTION log_load_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO events (load_id, user_id, event_type, previous_value, new_value, notes)
    VALUES (NEW.id, NEW.updated_by, 'status_change', OLD.status::TEXT, NEW.status::TEXT, 
            'Load status changed from ' || OLD.status || ' to ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log driver assignment
CREATE OR REPLACE FUNCTION log_driver_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.driver_id IS DISTINCT FROM NEW.driver_id AND NEW.driver_id IS NOT NULL THEN
    INSERT INTO events (load_id, user_id, event_type, previous_value, new_value, notes)
    VALUES (NEW.id, NEW.updated_by, 'driver_assigned', 
            CASE WHEN OLD.driver_id IS NULL THEN 'none' ELSE OLD.driver_id::TEXT END, 
            NEW.driver_id::TEXT, 
            'Driver assigned to load');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log carrier assignment
CREATE OR REPLACE FUNCTION log_carrier_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.carrier_id IS DISTINCT FROM NEW.carrier_id AND NEW.carrier_id IS NOT NULL THEN
    INSERT INTO events (load_id, user_id, event_type, previous_value, new_value, notes)
    VALUES (NEW.id, NEW.updated_by, 'carrier_assigned', 
            CASE WHEN OLD.carrier_id IS NULL THEN 'none' ELSE OLD.carrier_id::TEXT END, 
            NEW.carrier_id::TEXT, 
            'Carrier assigned to load');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification for driver assignment
CREATE OR REPLACE FUNCTION notify_driver_assignment()
RETURNS TRIGGER AS $$
DECLARE
  driver_user_id UUID;
  load_ref TEXT;
BEGIN
  IF OLD.driver_id IS DISTINCT FROM NEW.driver_id AND NEW.driver_id IS NOT NULL THEN
    -- Get the user_id for the driver
    SELECT user_id INTO driver_user_id FROM drivers WHERE id = NEW.driver_id;
    
    -- Get the load reference number
    load_ref := NEW.reference_number;
    
    -- Create notification if driver has a user account
    IF driver_user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, link, data)
      VALUES (driver_user_id, 
              'New Load Assignment', 
              'You have been assigned to load ' || load_ref, 
              '/driver/loads/' || NEW.id, 
              jsonb_build_object('load_id', NEW.id, 'type', 'assignment'));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification for carrier assignment
CREATE OR REPLACE FUNCTION notify_carrier_assignment()
RETURNS TRIGGER AS $$
DECLARE
  carrier_admin_users CURSOR FOR 
    SELECT user_id FROM carrier_users 
    WHERE carrier_id = NEW.carrier_id AND is_admin = TRUE;
  load_ref TEXT;
  user_id UUID;
BEGIN
  IF OLD.carrier_id IS DISTINCT FROM NEW.carrier_id AND NEW.carrier_id IS NOT NULL THEN
    -- Get the load reference number
    load_ref := NEW.reference_number;
    
    -- Create notification for all carrier admins
    FOR user_id IN carrier_admin_users LOOP
      INSERT INTO notifications (user_id, title, message, link, data)
      VALUES (user_id, 
              'New Load Assignment', 
              'Your company has been assigned to load ' || load_ref, 
              '/carrier/loads/' || NEW.id, 
              jsonb_build_object('load_id', NEW.id, 'type', 'carrier_assignment'));
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update load location from driver location
CREATE OR REPLACE FUNCTION update_load_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Update any active loads assigned to this driver with the new location
  UPDATE loads
  SET 
    current_latitude = NEW.current_latitude,
    current_longitude = NEW.current_longitude,
    last_location_update = NEW.last_location_update,
    updated_at = NOW()
  WHERE 
    driver_id = NEW.id AND 
    status IN ('assigned', 'in_transit', 'at_pickup', 'picked_up', 'at_delivery');
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check if driver is near pickup or delivery
CREATE OR REPLACE FUNCTION check_driver_proximity()
RETURNS TRIGGER AS $$
DECLARE
  pickup_location RECORD;
  delivery_location RECORD;
  proximity_threshold FLOAT := 0.5; -- miles
  distance_to_pickup FLOAT;
  distance_to_delivery FLOAT;
BEGIN
  -- Only proceed if we have location data and the load is in an active state
  IF NEW.current_latitude IS NOT NULL AND 
     NEW.current_longitude IS NOT NULL AND
     NEW.status IN ('assigned', 'in_transit', 'picked_up') THEN
     
    -- Get pickup and delivery locations
    SELECT latitude, longitude INTO pickup_location 
    FROM locations WHERE id = NEW.pickup_location_id;
    
    SELECT latitude, longitude INTO delivery_location 
    FROM locations WHERE id = NEW.delivery_location_id;
    
    -- Calculate distances (using PostgreSQL's earthdistance would be better but using simple calculation here)
    -- This is a simplified calculation and should be replaced with proper geospatial distance calculation
    distance_to_pickup := SQRT(POWER(69.1 * (pickup_location.latitude - NEW.current_latitude), 2) + 
                              POWER(69.1 * (pickup_location.longitude - NEW.current_longitude) * COS(NEW.current_latitude / 57.3), 2));
                              
    distance_to_delivery := SQRT(POWER(69.1 * (delivery_location.latitude - NEW.current_latitude), 2) + 
                                POWER(69.1 * (delivery_location.longitude - NEW.current_longitude) * COS(NEW.current_latitude / 57.3), 2));
    
    -- Check if driver is at pickup location and update status if needed
    IF distance_to_pickup <= proximity_threshold AND NEW.status = 'in_transit' AND NEW.actual_pickup_time IS NULL THEN
      UPDATE loads SET 
        status = 'at_pickup',
        updated_at = NOW(),
        updated_by = NEW.updated_by
      WHERE id = NEW.id;
      
      INSERT INTO events (load_id, user_id, event_type, previous_value, new_value, latitude, longitude, notes)
      VALUES (NEW.id, NEW.updated_by, 'status_change', 'in_transit', 'at_pickup', 
              NEW.current_latitude, NEW.current_longitude, 'Driver arrived at pickup location');
    END IF;
    
    -- Check if driver is at delivery location and update status if needed
    IF distance_to_delivery <= proximity_threshold AND NEW.status = 'picked_up' THEN
      UPDATE loads SET 
        status = 'at_delivery',
        updated_at = NOW(),
        updated_by = NEW.updated_by
      WHERE id = NEW.id;
      
      INSERT INTO events (load_id, user_id, event_type, previous_value, new_value, latitude, longitude, notes)
      VALUES (NEW.id, NEW.updated_by, 'status_change', 'picked_up', 'at_delivery', 
              NEW.current_latitude, NEW.current_longitude, 'Driver arrived at delivery location');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update ETA based on current location
CREATE OR REPLACE FUNCTION update_load_eta()
RETURNS TRIGGER AS $$
DECLARE
  destination_lat FLOAT;
  destination_lng FLOAT;
  avg_speed FLOAT := 55.0; -- mph, this is a simplification
  distance_miles FLOAT;
  estimated_hours FLOAT;
  new_eta TIMESTAMPTZ;
BEGIN
  -- Only proceed if we have location data and the load is in an active state
  IF NEW.current_latitude IS NOT NULL AND 
     NEW.current_longitude IS NOT NULL AND
     NEW.status IN ('in_transit', 'picked_up') THEN
     
    -- Determine destination based on status
    IF NEW.status = 'in_transit' THEN
      -- Destination is pickup location
      SELECT latitude, longitude INTO destination_lat, destination_lng
      FROM locations WHERE id = NEW.pickup_location_id;
    ELSE -- 'picked_up'
      -- Destination is delivery location
      SELECT latitude, longitude INTO destination_lat, destination_lng
      FROM locations WHERE id = NEW.delivery_location_id;
    END IF;
    
    -- Calculate distance (simplified)
    distance_miles := SQRT(POWER(69.1 * (destination_lat - NEW.current_latitude), 2) + 
                          POWER(69.1 * (destination_lng - NEW.current_longitude) * COS(NEW.current_latitude / 57.3), 2));
    
    -- Calculate estimated time (hours)
    estimated_hours := distance_miles / avg_speed;
    
    -- Calculate new ETA
    new_eta := NOW() + (estimated_hours * INTERVAL '1 hour');
    
    -- Update the ETA
    UPDATE loads SET 
      estimated_time_of_arrival = new_eta,
      updated_at = NOW()
    WHERE id = NEW.id;
    
    -- Log the ETA update if it changed significantly (more than 15 minutes)
    IF OLD.estimated_time_of_arrival IS NULL OR 
       ABS(EXTRACT(EPOCH FROM (new_eta - OLD.estimated_time_of_arrival))) > 900 THEN
      INSERT INTO events (load_id, event_type, previous_value, new_value, latitude, longitude, notes)
      VALUES (NEW.id, 'eta_updated', 
              COALESCE(TO_CHAR(OLD.estimated_time_of_arrival, 'YYYY-MM-DD HH24:MI:SS'), 'unknown'),
              TO_CHAR(new_eta, 'YYYY-MM-DD HH24:MI:SS'),
              NEW.current_latitude, NEW.current_longitude, 
              'Estimated time of arrival updated');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle bid acceptance
CREATE OR REPLACE FUNCTION handle_bid_acceptance()
RETURNS TRIGGER AS $$
DECLARE
  load_record RECORD;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Get the load information
    SELECT * INTO load_record FROM loads WHERE id = NEW.load_id;
    
    -- Update the load with the carrier information
    UPDATE loads SET
      carrier_id = NEW.carrier_id,
      rate = NEW.amount,
      rate_type = 'flat', -- Assuming flat rate for bids
      status = 'assigned',
      updated_at = NOW(),
      updated_by = NEW.updated_by
    WHERE id = NEW.load_id;
    
    -- Reject all other pending bids for this load
    UPDATE bids SET
      status = 'rejected',
      updated_at = NOW(),
      updated_by = NEW.updated_by
    WHERE 
      load_id = NEW.load_id AND 
      id != NEW.id AND 
      status = 'pending';
      
    -- Create event for bid acceptance
    INSERT INTO events (load_id, user_id, event_type, notes, metadata)
    VALUES (NEW.load_id, NEW.updated_by, 'bid_accepted', 
            'Bid from carrier ' || NEW.carrier_id || ' accepted', 
            jsonb_build_object('bid_id', NEW.id, 'amount', NEW.amount));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating timestamps
CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_carriers_timestamp
BEFORE UPDATE ON carriers
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_shippers_timestamp
BEFORE UPDATE ON shippers
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_drivers_timestamp
BEFORE UPDATE ON drivers
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_vehicles_timestamp
BEFORE UPDATE ON vehicles
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_locations_timestamp
BEFORE UPDATE ON locations
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_loads_timestamp
BEFORE UPDATE ON loads
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_load_stops_timestamp
BEFORE UPDATE ON load_stops
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_documents_timestamp
BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_bids_timestamp
BEFORE UPDATE ON bids
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Trigger for generating load reference numbers
CREATE TRIGGER generate_load_reference_trigger
BEFORE INSERT ON loads
FOR EACH ROW EXECUTE FUNCTION generate_load_reference();

-- Trigger for logging load status changes
CREATE TRIGGER log_load_status_change_trigger
AFTER UPDATE OF status ON loads
FOR EACH ROW EXECUTE FUNCTION log_load_status_change();

-- Trigger for logging driver assignment
CREATE TRIGGER log_driver_assignment_trigger
AFTER UPDATE OF driver_id ON loads
FOR EACH ROW EXECUTE FUNCTION log_driver_assignment();

-- Trigger for logging carrier assignment
CREATE TRIGGER log_carrier_assignment_trigger
AFTER UPDATE OF carrier_id ON loads
FOR EACH ROW EXECUTE FUNCTION log_carrier_assignment();

-- Trigger for notifying driver of assignment
CREATE TRIGGER notify_driver_assignment_trigger
AFTER UPDATE OF driver_id ON loads
FOR EACH ROW EXECUTE FUNCTION notify_driver_assignment();

-- Trigger for notifying carrier of assignment
CREATE TRIGGER notify_carrier_assignment_trigger
AFTER UPDATE OF carrier_id ON loads
FOR EACH ROW EXECUTE FUNCTION notify_carrier_assignment();

-- Trigger for updating load location from driver location
CREATE TRIGGER update_load_location_trigger
AFTER UPDATE OF current_latitude, current_longitude, last_location_update ON drivers
FOR EACH ROW EXECUTE FUNCTION update_load_location();

-- Trigger for checking driver proximity to pickup/delivery
CREATE TRIGGER check_driver_proximity_trigger
AFTER UPDATE OF current_latitude, current_longitude ON loads
FOR EACH ROW EXECUTE FUNCTION check_driver_proximity();

-- Trigger for updating load ETA
CREATE TRIGGER update_load_eta_trigger
AFTER UPDATE OF current_latitude, current_longitude ON loads
FOR EACH ROW EXECUTE FUNCTION update_load_eta();

-- Trigger for handling bid acceptance
CREATE TRIGGER handle_bid_acceptance_trigger
AFTER UPDATE OF status ON bids
FOR EACH ROW EXECUTE FUNCTION handle_bid_acceptance();

-- ===============================
-- Row Level Security Policies
-- ===============================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrier_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shippers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipper_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY users_admin_all ON users
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY users_self_select ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY users_self_update ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Create policies for carriers table
CREATE POLICY carriers_admin_all ON carriers
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY carriers_carrier_select ON carriers
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM carrier_users WHERE carrier_id = id));

CREATE POLICY carriers_carrier_update ON carriers
  FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM carrier_users WHERE carrier_id = id AND is_admin = TRUE));

CREATE POLICY carriers_public_select ON carriers
  FOR SELECT TO authenticated
  USING (is_active = TRUE);

-- Create policies for carrier_users table
CREATE POLICY carrier_users_admin_all ON carrier_users
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY carrier_users_carrier_admin_all ON carrier_users
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM carrier_users WHERE carrier_id = carrier_id AND is_admin = TRUE));

CREATE POLICY carrier_users_self_select ON carrier_users
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for shippers table
CREATE POLICY shippers_admin_all ON shippers
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY shippers_shipper_select ON shippers
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM shipper_users WHERE shipper_id = id));

CREATE POLICY shippers_shipper_update ON shippers
  FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM shipper_users WHERE shipper_id = id AND is_admin = TRUE));

CREATE POLICY shippers_public_select ON shippers
  FOR SELECT TO authenticated
  USING (is_active = TRUE);

-- Create policies for shipper_users table
CREATE POLICY shipper_users_admin_all ON shipper_users
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY shipper_users_shipper_admin_all ON shipper_users
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM shipper_users WHERE shipper_id = shipper_id AND is_admin = TRUE));

CREATE POLICY shipper_users_self_select ON shipper_users
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for drivers table
CREATE POLICY drivers_admin_all ON drivers
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY drivers_carrier_all ON drivers
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM carrier_users WHERE carrier_id = carrier_id));

CREATE POLICY drivers_self_select ON drivers
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY drivers_self_update ON drivers
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY drivers_load_related_select ON drivers
  FOR SELECT TO authenticated
  USING (id IN (SELECT driver_id FROM loads WHERE shipper_id IN 
                (SELECT shipper_id FROM shipper_users WHERE user_id = auth.uid())));

-- Create policies for vehicles table
CREATE POLICY vehicles_admin_all ON vehicles
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY vehicles_carrier_all ON vehicles
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM carrier_users WHERE carrier_id = carrier_id));

CREATE POLICY vehicles_driver_select ON vehicles
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM drivers WHERE id = current_driver_id));

-- Create policies for locations table
CREATE POLICY locations_admin_all ON locations
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY locations_creator_all ON locations
  FOR ALL TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY locations_public_select ON locations
  FOR SELECT TO authenticated
  USING (is_active = TRUE);

-- Create policies for loads table
CREATE POLICY loads_admin_all ON loads
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY loads_shipper_all ON loads
  FOR ALL TO authenticated
  USING (shipper_id IN (SELECT shipper_id FROM shipper_users WHERE user_id = auth.uid()));

CREATE POLICY loads_carrier_select_update ON loads
  FOR SELECT TO authenticated
  USING (carrier_id IN (SELECT carrier_id FROM carrier_users WHERE user_id = auth.uid()));

CREATE POLICY loads_carrier_update ON loads
  FOR UPDATE TO authenticated
  USING (carrier_id IN (SELECT carrier_id FROM carrier_users WHERE user_id = auth.uid()));

CREATE POLICY loads_driver_select_update ON loads
  FOR SELECT TO authenticated
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

CREATE POLICY loads_driver_update ON loads
  FOR UPDATE TO authenticated
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

CREATE POLICY loads_available_select ON loads
  FOR SELECT TO authenticated
  USING (status = 'posted');

-- Create policies for load_stops table
CREATE POLICY load_stops_admin_all ON load_stops
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY load_stops_load_related ON load_stops
  FOR ALL TO authenticated
  USING (load_id IN (SELECT id FROM loads WHERE 
                     shipper_id IN (SELECT shipper_id FROM shipper_users WHERE user_id = auth.uid()) OR
                     carrier_id IN (SELECT carrier_id FROM carrier_users WHERE user_id = auth.uid()) OR
                     driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())));

-- Create policies for events table
CREATE POLICY events_admin_all ON events
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY events_load_related_select ON events
  FOR SELECT TO authenticated
  USING (load_id IN (SELECT id FROM loads WHERE 
                     shipper_id IN (SELECT shipper_id FROM shipper_users WHERE user_id = auth.uid()) OR
                     carrier_id IN (SELECT carrier_id FROM carrier_users WHERE user_id = auth.uid()) OR
                     driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())));

CREATE POLICY events_creator_insert ON events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for documents table
CREATE POLICY documents_admin_all ON documents
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY documents_load_related_select ON documents
  FOR SELECT TO authenticated
  USING (load_id IN (SELECT id FROM loads WHERE 
                     shipper_id IN (SELECT shipper_id FROM shipper_users WHERE user_id = auth.uid()) OR
                     carrier_id IN (SELECT carrier_id FROM carrier_users WHERE user_id = auth.uid()) OR
                     driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())));

CREATE POLICY documents_creator_insert_update ON documents
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for bids table
CREATE POLICY bids_admin_all ON bids
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY bids_shipper_select ON bids
  FOR SELECT TO authenticated
  USING (load_id IN (SELECT id FROM loads WHERE shipper_id IN 
                     (SELECT shipper_id FROM shipper_users WHERE user_id = auth.uid())));

CREATE POLICY bids_shipper_update ON bids
  FOR UPDATE TO authenticated
  USING (load_id IN (SELECT id FROM loads WHERE shipper_id IN 
                     (SELECT shipper_id FROM shipper_users WHERE user_id = auth.uid())));

CREATE POLICY bids_carrier_all ON bids
  FOR ALL TO authenticated
  USING (carrier_id IN (SELECT carrier_id FROM carrier_users WHERE user_id = auth.uid()));

-- Create policies for notifications table
CREATE POLICY notifications_admin_all ON notifications
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY notifications_self_all ON notifications
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for documentation table
CREATE POLICY documentation_admin_all ON documentation
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY documentation_role_select ON documentation
  FOR SELECT TO authenticated
  USING (role = (SELECT role FROM users WHERE id = auth.uid()) OR role = 'all');

-- ===============================
-- Initial Data
-- ===============================

-- Insert initial admin user (to be replaced with actual admin user)
INSERT INTO users (id, email, first_name, last_name, phone, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- This is a placeholder, will be replaced with actual admin user ID
  'admin@myralight.com',
  'System',
  'Admin',
  '555-123-4567',
  'admin',
  NOW(),
  NOW()
);

-- Insert documentation categories
INSERT INTO documentation (title, description, content, category, tags, role, author, created_at, updated_at, created_by)
VALUES 
('Welcome to Myra Light', 'Introduction to the Myra Light platform', '<h1>Welcome to Myra Light</h1><p>Myra Light is a real-time load matching and tracking system for logistics...</p>', 'general', ARRAY['welcome', 'introduction'], 'all', 'System Admin', NOW(), NOW(), '00000000-0000-0000-0000-000000000000');
