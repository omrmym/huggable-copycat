
-- Create storage bucket for branding assets
INSERT INTO storage.buckets (id, name, public) VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to branding bucket
CREATE POLICY "Public read access for branding" ON storage.objects
FOR SELECT USING (bucket_id = 'branding');

-- Allow authenticated users to upload/update branding assets
CREATE POLICY "Authenticated upload for branding" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'branding' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated update for branding" ON storage.objects
FOR UPDATE USING (bucket_id = 'branding' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete for branding" ON storage.objects
FOR DELETE USING (bucket_id = 'branding' AND auth.role() = 'authenticated');
