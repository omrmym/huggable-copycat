
-- Missing tables
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  manager_id UUID REFERENCES public.employees(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  department_id UUID REFERENCES public.departments(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Missing columns on mikrotik_sync_log
ALTER TABLE public.mikrotik_sync_log ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT true;
ALTER TABLE public.mikrotik_sync_log ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Missing columns on reseller_credits
ALTER TABLE public.reseller_credits ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.reseller_credits ADD COLUMN IF NOT EXISTS balance_after NUMERIC DEFAULT 0;

-- Missing columns on radius_users
ALTER TABLE public.radius_users ADD COLUMN IF NOT EXISTS mac_address TEXT;
ALTER TABLE public.radius_users ADD COLUMN IF NOT EXISTS mac_locked BOOLEAN DEFAULT false;
ALTER TABLE public.radius_users ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Missing columns on bandwidth_history
ALTER TABLE public.bandwidth_history ADD COLUMN IF NOT EXISTS bytes_in BIGINT DEFAULT 0;
ALTER TABLE public.bandwidth_history ADD COLUMN IF NOT EXISTS bytes_out BIGINT DEFAULT 0;
ALTER TABLE public.bandwidth_history ADD COLUMN IF NOT EXISTS download_rate_bps BIGINT DEFAULT 0;
ALTER TABLE public.bandwidth_history ADD COLUMN IF NOT EXISTS upload_rate_bps BIGINT DEFAULT 0;
ALTER TABLE public.bandwidth_history ADD COLUMN IF NOT EXISTS session_uptime TEXT;

-- Missing columns on device_change_requests
ALTER TABLE public.device_change_requests ADD COLUMN IF NOT EXISTS old_device TEXT;
ALTER TABLE public.device_change_requests ADD COLUMN IF NOT EXISTS new_device TEXT;
ALTER TABLE public.device_change_requests ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.device_change_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Missing columns on mikrotik_sync_log for UserActivityLog
ALTER TABLE public.mikrotik_sync_log ADD COLUMN IF NOT EXISTS request_data JSONB;
ALTER TABLE public.mikrotik_sync_log ADD COLUMN IF NOT EXISTS response_data JSONB;

-- Missing column on billing_plans for data usage chart
ALTER TABLE public.billing_plans ADD COLUMN IF NOT EXISTS data_limit_mb NUMERIC DEFAULT 0;

-- RLS for new tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access departments" ON public.departments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access positions" ON public.positions FOR ALL USING (auth.role() = 'authenticated');

-- Fix is_admin function search path
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = _user_id
  );
END;
$$;
