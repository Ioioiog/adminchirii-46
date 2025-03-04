
-- Create a storage bucket for utility documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('utility-documents', 'utility-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up policies for the bucket
CREATE POLICY "Allow public read for utility documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'utility-documents');

CREATE POLICY "Allow authenticated users to upload utility documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'utility-documents');

CREATE POLICY "Allow users to update their own utility documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'utility-documents' AND auth.uid() = owner);

CREATE POLICY "Allow users to delete their own utility documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'utility-documents' AND auth.uid() = owner);
