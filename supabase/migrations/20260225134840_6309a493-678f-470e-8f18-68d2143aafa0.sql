CREATE POLICY "Anyone can read user_requests by phone"
ON public.user_requests
FOR SELECT
USING (true);