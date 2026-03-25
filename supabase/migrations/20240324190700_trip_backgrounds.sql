-- Add background_url to trips table
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS background_url TEXT;

-- Create bucket for trip backgrounds
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip_backgrounds', 'trip_backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for trip_backgrounds bucket
CREATE POLICY "Public Access Backgrounds"
ON storage.objects FOR SELECT
USING ( bucket_id = 'trip_backgrounds' );

CREATE POLICY "Authenticated users can upload backgrounds"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'trip_backgrounds' );

CREATE POLICY "Users can update their own backgrounds"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'trip_backgrounds' AND owner = auth.uid() );

CREATE POLICY "Users can delete their own backgrounds"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'trip_backgrounds' AND owner = auth.uid() );
