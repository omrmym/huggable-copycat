
-- Restrict branding storage to super_admin role only
DROP POLICY IF EXISTS "Authenticated upload for branding" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update for branding" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete for branding" ON storage.objects;

CREATE POLICY "Super admin upload for branding" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'branding' AND 
  auth.role() = 'authenticated' AND
  EXISTS (SELECT 1 FROM public.software_users WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true)
);

CREATE POLICY "Super admin update for branding" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'branding' AND 
  auth.role() = 'authenticated' AND
  EXISTS (SELECT 1 FROM public.software_users WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true)
);

CREATE POLICY "Super admin delete for branding" ON storage.objects
FOR DELETE USING (
  bucket_id = 'branding' AND 
  auth.role() = 'authenticated' AND
  EXISTS (SELECT 1 FROM public.software_users WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true)
);
