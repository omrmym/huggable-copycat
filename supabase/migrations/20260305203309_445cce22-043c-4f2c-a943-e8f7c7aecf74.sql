CREATE POLICY "Anyone can read bandwidth_history"
ON public.bandwidth_history
FOR SELECT
USING (true);