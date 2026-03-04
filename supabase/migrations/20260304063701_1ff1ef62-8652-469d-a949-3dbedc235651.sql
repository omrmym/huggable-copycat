
CREATE TABLE public.sms_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_phone text NOT NULL,
  recipient_name text,
  message text NOT NULL,
  sms_type text NOT NULL DEFAULT 'custom',
  status text NOT NULL DEFAULT 'pending',
  api_response jsonb,
  radius_user_id uuid REFERENCES public.radius_users(id) ON DELETE SET NULL,
  sent_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access sms_history"
  ON public.sms_history
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated');
