ALTER TABLE public.radius_users ALTER COLUMN service_type SET DEFAULT 'hotspot';
ALTER TABLE public.billing_plans ALTER COLUMN service_type SET DEFAULT 'hotspot';
UPDATE public.radius_users SET service_type = 'hotspot' WHERE service_type = 'pppoe';
UPDATE public.billing_plans SET service_type = 'hotspot' WHERE service_type = 'pppoe';