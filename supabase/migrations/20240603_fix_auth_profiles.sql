-- Fix for profiles table in realtime publication
-- Check if profiles table exists before adding to publication
DO $$
BEGIN
  -- Check if the table is already part of the publication
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'profiles'
  ) THEN
    RAISE NOTICE 'Table profiles is already in publication supabase_realtime, skipping';
  ELSE
    -- Add the table to the publication if it's not already there
    EXECUTE 'ALTER publication supabase_realtime ADD TABLE profiles';
  END IF;
END
$$;