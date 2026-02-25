CREATE POLICY "Anyone can read request_success_note"
ON public.app_settings
FOR SELECT
USING (key = 'request_success_note');