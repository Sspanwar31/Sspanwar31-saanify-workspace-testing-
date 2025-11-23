-- Insert default super admin user
-- This will be created when the super admin signs up for the first time
-- or you can create them manually in the Supabase dashboard

-- Default demo users (passwords should be hashed in production)
-- These are for demonstration purposes only

-- Client user
INSERT INTO public.profiles (id, email, name, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'client@saanify.com',
  'Demo Client',
  'CLIENT',
  true
) ON CONFLICT (id) DO NOTHING;

-- Super admin user
INSERT INTO public.profiles (id, email, name, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'superadmin@saanify.com',
  'Super Admin',
  'SUPER_ADMIN',
  true
) ON CONFLICT (id) DO NOTHING;

-- Create a demo society account
INSERT INTO public.society_accounts (id, name, admin_name, email, subscription_plan, status, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Demo Society',
  'Demo Admin',
  'demo@saanify.com',
  'TRIAL',
  'TRIAL',
  true
) ON CONFLICT (id) DO NOTHING;

-- Link client to demo society account
UPDATE public.profiles 
SET society_account_id = '00000000-0000-0000-0000-000000000003'
WHERE id = '00000000-0000-0000-0000-000000000001';