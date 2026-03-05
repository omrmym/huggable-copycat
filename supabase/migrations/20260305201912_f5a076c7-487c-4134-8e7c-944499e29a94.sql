CREATE POLICY "Anyone can read portal_notice"
ON public.app_settings
FOR SELECT
USING (key = 'portal_notice');