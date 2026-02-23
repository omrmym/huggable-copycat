
-- Core lookup tables first
CREATE TABLE public.districts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.police_stations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  district_id UUID REFERENCES public.districts(id),
  address TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  police_station_id UUID REFERENCES public.police_stations(id),
  district_id UUID REFERENCES public.districts(id),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.connectivity_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.income_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MikroTik routers
CREATE TABLE public.mikrotik_routers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER NOT NULL DEFAULT 8728,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  connection_mode TEXT NOT NULL DEFAULT 'api',
  use_ssl BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Billing plans
CREATE TABLE public.billing_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  type TEXT,
  service_type TEXT NOT NULL DEFAULT 'pppoe',
  duration_days INTEGER DEFAULT 30,
  speed TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resellers
CREATE TABLE public.resellers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  commission_rate NUMERIC DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  login_user_id TEXT,
  login_password TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  role_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Radius users (main ISP subscribers)
CREATE TABLE public.radius_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  father_name TEXT,
  nid_number TEXT,
  phone TEXT,
  email TEXT,
  gender TEXT DEFAULT 'male',
  status TEXT NOT NULL DEFAULT 'active',
  service_type TEXT NOT NULL DEFAULT 'pppoe',
  plan_id UUID REFERENCES public.billing_plans(id),
  monthly_bill NUMERIC DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  connection_fee NUMERIC DEFAULT 0,
  billing_cycle TEXT DEFAULT 'monthly',
  billing_type TEXT,
  expires_at TIMESTAMPTZ,
  data_used_mb NUMERIC DEFAULT 0,
  mac_serial TEXT,
  connectivity_type TEXT,
  area_id UUID REFERENCES public.areas(id),
  district_id UUID REFERENCES public.districts(id),
  police_station_id UUID REFERENCES public.police_stations(id),
  address_details TEXT,
  customer_type TEXT DEFAULT 'home',
  mikrotik_router_id UUID REFERENCES public.mikrotik_routers(id),
  mikrotik_synced BOOLEAN NOT NULL DEFAULT false,
  reseller_id UUID REFERENCES public.resellers(id),
  reseller_office TEXT,
  created_by UUID,
  auto_renew BOOLEAN DEFAULT false,
  grace_days_used INTEGER DEFAULT 0,
  connection_date DATE,
  device TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  radius_user_id UUID REFERENCES public.radius_users(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'payment',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  collected_by TEXT,
  is_auto_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vouchers
CREATE TABLE public.vouchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  plan_id UUID REFERENCES public.billing_plans(id),
  status TEXT NOT NULL DEFAULT 'unused',
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  used_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin users
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Software users (staff accounts)
CREATE TABLE public.software_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  login_user_id TEXT,
  role TEXT NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Role definitions
CREATE TABLE public.role_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Branches
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  manager_name TEXT,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  reseller_id UUID REFERENCES public.resellers(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reseller users
CREATE TABLE public.reseller_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reseller_id UUID NOT NULL REFERENCES public.resellers(id),
  user_id UUID,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  login_user_id TEXT,
  login_password TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reseller credits
CREATE TABLE public.reseller_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reseller_id UUID NOT NULL REFERENCES public.resellers(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'credit',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reseller plan commissions
CREATE TABLE public.reseller_plan_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reseller_id UUID NOT NULL REFERENCES public.resellers(id),
  plan_id UUID NOT NULL REFERENCES public.billing_plans(id),
  commission_rate NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reseller user recharges
CREATE TABLE public.reseller_user_recharges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reseller_id UUID NOT NULL REFERENCES public.resellers(id),
  radius_user_id UUID NOT NULL REFERENCES public.radius_users(id),
  plan_id UUID REFERENCES public.billing_plans(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employees
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department TEXT,
  position TEXT,
  hire_date DATE,
  salary NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leave requests
CREATE TABLE public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES public.employees(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Salary payments
CREATE TABLE public.salary_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  payment_date DATE NOT NULL,
  base_salary NUMERIC NOT NULL DEFAULT 0,
  bonus NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  net_salary NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expenses
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  category TEXT,
  added_by TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Income
CREATE TABLE public.income (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  category TEXT,
  added_by TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- App settings (key-value store)
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- System activity log
CREATE TABLE public.system_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  entity_name TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Login activity log
CREATE TABLE public.login_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  login_method TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bandwidth history
CREATE TABLE public.bandwidth_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  radius_user_id UUID REFERENCES public.radius_users(id),
  download_bytes BIGINT DEFAULT 0,
  upload_bytes BIGINT DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Device change requests
CREATE TABLE public.device_change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  radius_user_id UUID NOT NULL REFERENCES public.radius_users(id),
  old_mac_serial TEXT,
  new_mac_serial TEXT,
  old_connectivity_type TEXT,
  new_connectivity_type TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by UUID,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MikroTik sync log
CREATE TABLE public.mikrotik_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  radius_user_id UUID REFERENCES public.radius_users(id),
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- is_admin function used by AuthContext
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = _user_id
  );
END;
$$;

-- Disable RLS on all tables for now (can be added later)
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.police_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connectivity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mikrotik_routers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radius_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_plan_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_user_recharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bandwidth_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mikrotik_sync_log ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
CREATE POLICY "Authenticated users can access districts" ON public.districts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access police_stations" ON public.police_stations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access areas" ON public.areas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access connectivity_types" ON public.connectivity_types FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access payment_methods" ON public.payment_methods FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access expense_categories" ON public.expense_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access income_categories" ON public.income_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access mikrotik_routers" ON public.mikrotik_routers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access billing_plans" ON public.billing_plans FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access resellers" ON public.resellers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access radius_users" ON public.radius_users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access transactions" ON public.transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access vouchers" ON public.vouchers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access admin_users" ON public.admin_users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access software_users" ON public.software_users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access role_definitions" ON public.role_definitions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access branches" ON public.branches FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access reseller_users" ON public.reseller_users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access reseller_credits" ON public.reseller_credits FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access reseller_plan_commissions" ON public.reseller_plan_commissions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access reseller_user_recharges" ON public.reseller_user_recharges FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access employees" ON public.employees FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access leave_requests" ON public.leave_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access salary_payments" ON public.salary_payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access expenses" ON public.expenses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access income" ON public.income FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access app_settings" ON public.app_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access system_activity" ON public.system_activity FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access login_activity" ON public.login_activity FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access bandwidth_history" ON public.bandwidth_history FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access device_change_requests" ON public.device_change_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access mikrotik_sync_log" ON public.mikrotik_sync_log FOR ALL USING (auth.role() = 'authenticated');

-- Allow anon access to login_activity for failed login logging
CREATE POLICY "Anon can insert login_activity" ON public.login_activity FOR INSERT WITH CHECK (true);
