-- Fix the role_permissions table by ensuring it has the correct columns
DROP TABLE IF EXISTS role_permissions;

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_name VARCHAR(255) NOT NULL REFERENCES roles(name) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_name, permission_id)
);

-- Re-insert the role permissions
INSERT INTO role_permissions (role_name, permission_id)
SELECT 'admin', id FROM permissions;

INSERT INTO role_permissions (role_name, permission_id)
SELECT 'driver', id FROM permissions WHERE name IN (
  'view_own_profile',
  'edit_own_profile',
  'view_own_loads',
  'view_available_loads',
  'accept_loads',
  'update_load_status',
  'view_own_documents',
  'upload_documents',
  'view_own_earnings',
  'view_own_messages',
  'send_messages'
);

INSERT INTO role_permissions (role_name, permission_id)
SELECT 'carrier', id FROM permissions WHERE name IN (
  'view_own_profile',
  'edit_own_profile',
  'view_carrier_loads',
  'view_carrier_drivers',
  'manage_carrier_drivers',
  'view_carrier_documents',
  'upload_documents',
  'view_carrier_earnings',
  'view_carrier_messages',
  'send_messages'
);

INSERT INTO role_permissions (role_name, permission_id)
SELECT 'shipper', id FROM permissions WHERE name IN (
  'view_own_profile',
  'edit_own_profile',
  'create_loads',
  'view_own_loads',
  'edit_own_loads',
  'view_load_tracking',
  'view_own_documents',
  'upload_documents',
  'view_own_messages',
  'send_messages'
);
