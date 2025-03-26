-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for avatars
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Public avatars are viewable by everyone" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view their own avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
  
  -- Create new policies
  CREATE POLICY "Public avatars are viewable by everyone"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars' AND public = true);

  CREATE POLICY "Users can view their own avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars' AND auth.uid() = SPLIT_PART(name, '-', 1)::uuid);

  CREATE POLICY "Users can upload their own avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.uid() = SPLIT_PART(name, '-', 1)::uuid);

  CREATE POLICY "Users can update their own avatars"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'avatars' AND auth.uid() = SPLIT_PART(name, '-', 1)::uuid);

  CREATE POLICY "Users can delete their own avatars"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'avatars' AND auth.uid() = SPLIT_PART(name, '-', 1)::uuid);
END $$;

-- Set up storage policies for documents
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;
  
  -- Create new policies
  CREATE POLICY "Users can view their own documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'documents' AND auth.uid() = SPLIT_PART(name, '-', 1)::uuid);

  CREATE POLICY "Users can upload their own documents"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'documents' AND auth.uid() = SPLIT_PART(name, '-', 1)::uuid);

  CREATE POLICY "Users can update their own documents"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'documents' AND auth.uid() = SPLIT_PART(name, '-', 1)::uuid);

  CREATE POLICY "Users can delete their own documents"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'documents' AND auth.uid() = SPLIT_PART(name, '-', 1)::uuid);

  CREATE POLICY "Admins can view all documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'documents' AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    ));
END $$;
