
-- Add kind (link/file) and url to documents
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'file',
  ADD COLUMN IF NOT EXISTS url text;

-- Create public storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "documents_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

CREATE POLICY "documents_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "documents_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "documents_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
