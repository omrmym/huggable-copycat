
-- Fix security definer view warning by recreating with security_invoker
DROP VIEW IF EXISTS public.radius_users_safe;

CREATE VIEW public.radius_users_safe
WITH (security_invoker=on) AS
SELECT
  id, username, full_name, father_name, phone, email, gender,
  nid_number, address_details, customer_type, device, mac_serial,
  mac_address, mac_locked, ip_address, connectivity_type,
  service_type, status, plan_id, monthly_bill, billing_cycle,
  billing_type, connection_fee, connection_date, expires_at,
  auto_renew, grace_days_used, data_used_mb, last_login_at,
  area_id, district_id, police_station_id, mikrotik_router_id,
  mikrotik_synced, reseller_id, reseller_office, created_by,
  created_at, updated_at
FROM public.radius_users;

GRANT SELECT ON public.radius_users_safe TO authenticated;
REVOKE ALL ON public.radius_users_safe FROM anon;
