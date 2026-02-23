
-- Missing columns on billing_plans for speed chart
ALTER TABLE public.billing_plans ADD COLUMN IF NOT EXISTS download_speed_kbps INTEGER DEFAULT 0;
ALTER TABLE public.billing_plans ADD COLUMN IF NOT EXISTS upload_speed_kbps INTEGER DEFAULT 0;

-- Missing column on radius_users
ALTER TABLE public.radius_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
