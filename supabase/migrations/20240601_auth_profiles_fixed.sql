-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID REFERENCES public.roles(id),
  permission_id UUID REFERENCES public.permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

-- Insert permissions
INSERT INTO public.permissions (id, name, description)
VALUES 
  ('670e33ef-8c11-48f0-81c0-249a7ded6aa9', 'create:loads', 'Create new loads'),
  ('f8d1b530-53c8-4b5e-a503-f7bbc7c7c691', 'read:loads', 'View load details'),
  ('c0a80121-8b52-4c70-92f4-9a9d4f67c29c', 'update:loads', 'Update load information')
ON CONFLICT (id) DO NOTHING;

-- Insert roles
INSERT INTO public.roles (id, name, description)
VALUES 
  ('9d40f6e6-2f72-4b74-a4cd-9c9e64854687', 'admin', 'Administrator'),
  ('c2c455ee-e99d-4aa1-8c91-4e6a44b7cc2b', 'driver', 'Truck Driver'),
  ('b83f25d7-bf6d-4ff0-8a8d-84a8f838d0cb', 'shipper', 'Shipping Company')
ON CONFLICT (id) DO NOTHING;

-- Insert role permissions
INSERT INTO public.role_permissions (role_id, permission_id)
VALUES 
  ('9d40f6e6-2f72-4b74-a4cd-9c9e64854687', '670e33ef-8c11-48f0-81c0-249a7ded6aa9'),
  ('9d40f6e6-2f72-4b74-a4cd-9c9e64854687', 'f8d1b530-53c8-4b5e-a503-f7bbc7c7c691'),
  ('9d40f6e6-2f72-4b74-a4cd-9c9e64854687', 'c0a80121-8b52-4c70-92f4-9a9d4f67c29c')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Enable row level security
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Enable realtime
ALTER publication supabase_realtime ADD TABLE permissions;
ALTER publication supabase_realtime ADD TABLE roles;
ALTER publication supabase_realtime ADD TABLE role_permissions;