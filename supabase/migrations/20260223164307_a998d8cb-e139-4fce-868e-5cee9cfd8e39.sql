-- Enable pgcrypto for password hashing if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert a default admin user into auth.users if not exists
-- We use a known UUID for consistency in seeding if needed
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@example.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@example.com',
      crypt('Admin123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"System Admin"}',
      now(),
      now(),
      'authenticated',
      '',
      '',
      '',
      ''
    );

    -- Also insert into public.admin_users
    INSERT INTO public.admin_users (user_id, full_name)
    VALUES (new_user_id, 'System Admin');
    
    -- Also insert into software_users to allow login via User ID "admin"
    INSERT INTO public.software_users (user_id, email, full_name, login_user_id, role, is_active)
    VALUES (new_user_id, 'admin@example.com', 'System Admin', 'admin', 'super_admin', true);
  END IF;
END $$;
