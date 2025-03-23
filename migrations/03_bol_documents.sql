-- Create documents table for storing BOL and other document metadata
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  document_type VARCHAR(50) NOT NULL, -- BOL, POD, INVOICE, etc.
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL, -- MIME type
  file_size INTEGER NOT NULL,
  public_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'UPLOADED', -- UPLOADED, VERIFIED, REJECTED
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_load_id ON documents(load_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);

-- Add bol_status column to loads table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='loads' AND column_name='bol_status') THEN
    ALTER TABLE loads ADD COLUMN bol_status VARCHAR(50) DEFAULT 'PENDING';
  END IF;
END $$;

-- Create RLS policies for documents table
CREATE POLICY "Documents are viewable by users who have access to the load"
  ON documents FOR SELECT
  USING (
    -- Allow admins to view all documents
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    OR
    -- Allow users to view documents for loads they're associated with
    EXISTS (
      SELECT 1 FROM loads 
      WHERE loads.id = documents.load_id
      AND (
        -- User is from the shipper company
        loads.shipper_id = (SELECT company_id FROM users WHERE id = auth.uid())
        OR
        -- User is from the carrier company
        loads.carrier_id = (SELECT company_id FROM users WHERE id = auth.uid())
        OR
        -- User is the driver assigned to the load
        EXISTS (SELECT 1 FROM load_assignments WHERE load_id = loads.id AND driver_id = auth.uid())
      )
    )
  );

CREATE POLICY "Documents can be inserted by authorized users"
  ON documents FOR INSERT
  WITH CHECK (
    -- Allow admins to insert documents
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    OR
    -- Allow users to insert documents for loads they're associated with
    EXISTS (
      SELECT 1 FROM loads 
      WHERE loads.id = documents.load_id
      AND (
        -- User is from the carrier company
        loads.carrier_id = (SELECT company_id FROM users WHERE id = auth.uid())
        OR
        -- User is the driver assigned to the load
        EXISTS (SELECT 1 FROM load_assignments WHERE load_id = loads.id AND driver_id = auth.uid())
      )
    )
  );

CREATE POLICY "Documents can be updated by authorized users"
  ON documents FOR UPDATE
  USING (
    -- Allow admins to update documents
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    OR
    -- Allow original uploader to update their documents
    documents.user_id = auth.uid()
  );

CREATE POLICY "Documents can be deleted by authorized users"
  ON documents FOR DELETE
  USING (
    -- Allow admins to delete documents
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    OR
    -- Allow original uploader to delete their documents
    documents.user_id = auth.uid()
  );
