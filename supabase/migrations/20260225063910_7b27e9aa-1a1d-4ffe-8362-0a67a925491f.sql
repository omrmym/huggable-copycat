
CREATE TABLE public.user_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  father_name TEXT,
  nid_number TEXT,
  phone TEXT NOT NULL,
  gender TEXT DEFAULT 'male',
  customer_type TEXT DEFAULT 'student',
  district_id UUID REFERENCES public.districts(id),
  police_station_id UUID REFERENCES public.police_stations(id),
  area_id UUID REFERENCES public.areas(id),
  address_details TEXT,
  plan_id UUID REFERENCES public.billing_plans(id),
  mikrotik_router_id UUID REFERENCES public.mikrotik_routers(id),
  monthly_bill NUMERIC DEFAULT 0,
  connection_fee NUMERIC DEFAULT 0,
  mikrotik_username TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert requests (public form)
CREATE POLICY "Anyone can submit user requests" ON public.user_requests
  FOR INSERT WITH CHECK (true);

-- Allow anonymous users to read reference data for the form
CREATE POLICY "Anyone can read districts" ON public.districts
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read police_stations" ON public.police_stations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read areas" ON public.areas
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read billing_plans" ON public.billing_plans
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read mikrotik_routers" ON public.mikrotik_routers
  FOR SELECT USING (true);

-- Authenticated users can manage requests
CREATE POLICY "Authenticated users can manage user_requests" ON public.user_requests
  FOR ALL USING (auth.role() = 'authenticated');
