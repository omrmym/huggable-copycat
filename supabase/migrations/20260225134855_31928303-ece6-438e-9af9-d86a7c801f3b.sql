CREATE POLICY "Anyone can check radius_users username"
ON public.radius_users
FOR SELECT
USING (true);