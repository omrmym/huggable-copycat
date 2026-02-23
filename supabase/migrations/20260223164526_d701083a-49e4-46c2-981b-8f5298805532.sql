-- Clean up the manually inserted auth user that doesn't work
DELETE FROM public.software_users WHERE email = 'admin@example.com';
DELETE FROM public.admin_users WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@example.com');
DELETE FROM auth.users WHERE email = 'admin@example.com';
