-- Create buckets for attachments and GPX tracks
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true),
       ('gpx_tracks', 'gpx_tracks', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for attachments bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'attachments' );

CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'attachments' );

CREATE POLICY "Users can update their own attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'attachments' AND owner = auth.uid() );

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'attachments' AND owner = auth.uid() );

-- Set up RLS policies for gpx_tracks bucket
CREATE POLICY "Public Access GPX"
ON storage.objects FOR SELECT
USING ( bucket_id = 'gpx_tracks' );

CREATE POLICY "Authenticated users can upload GPX"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'gpx_tracks' );

CREATE POLICY "Users can update their own GPX"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'gpx_tracks' AND owner = auth.uid() );

CREATE POLICY "Users can delete their own GPX"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'gpx_tracks' AND owner = auth.uid() );
