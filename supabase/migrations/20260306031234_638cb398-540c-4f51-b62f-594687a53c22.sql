
-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can check radius_users username" ON public.radius_users;
