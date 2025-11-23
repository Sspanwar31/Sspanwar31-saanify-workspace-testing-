-- Simple database setup script for Supabase
-- Run this in your Supabase SQL Editor

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'CLIENT' CHECK (role IN ('CLIENT', 'SUPER_ADMIN')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  society_account_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create society_accounts table
CREATE TABLE IF NOT EXISTS society_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  admin_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  subscription_plan TEXT DEFAULT 'TRIAL' CHECK (subscription_plan IN ('TRIAL', 'BASIC', 'PRO', 'ENTERPRISE')),
  status TEXT DEFAULT 'TRIAL' CHECK (status IN ('TRIAL', 'ACTIVE', 'EXPIRED', 'LOCKED')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create societies table
CREATE TABLE IF NOT EXISTS societies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  society_account_id UUID REFERENCES society_accounts(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE society_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE societies ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for profiles
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Super admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);
CREATE POLICY IF NOT EXISTS "Super admins can update all profiles" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);

-- 6. Create policies for society_accounts
CREATE POLICY IF NOT EXISTS "Users can view own society account" ON society_accounts FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND society_account_id = id)
);
CREATE POLICY IF NOT EXISTS "Super admins can view all society_accounts" ON society_accounts FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);
CREATE POLICY IF NOT EXISTS "Super admins can manage all society accounts" ON society_accounts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);

-- 7. Create policies for societies
CREATE POLICY IF NOT EXISTS "Users can view own societies" ON societies FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND society_account_id = society_account_id)
);
CREATE POLICY IF NOT EXISTS "Super admins can view all societies" ON societies FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);
CREATE POLICY IF NOT EXISTS "Super admins can manage all societies" ON societies FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);

-- 8. Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'CLIENT')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger to automatically create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Apply updated_at triggers
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON profiles;
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_society_accounts_updated_at ON society_accounts;
CREATE TRIGGER handle_society_accounts_updated_at
  BEFORE UPDATE ON society_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_societies_updated_at ON societies;
CREATE TRIGGER handle_societies_updated_at
  BEFORE UPDATE ON societies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 12. Insert demo users (if they don't exist)
INSERT INTO public.profiles (id, email, name, role, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'client@saanify.com', 'Demo Client', 'CLIENT', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, name, role, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'superadmin@saanify.com', 'Super Admin', 'SUPER_ADMIN', true)
ON CONFLICT (id) DO NOTHING;

-- 13. Create demo society account
INSERT INTO public.society_accounts (id, name, admin_name, email, subscription_plan, status, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000003', 'Demo Society', 'Demo Admin', 'demo@saanify.com', 'TRIAL', 'TRIAL', true)
ON CONFLICT (id) DO NOTHING;

-- 14. Link client to demo society account
UPDATE public.profiles 
SET society_account_id = '00000000-0000-0000-0000-000000000003'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 15. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TRIGGERS IN SCHEMA public TO authenticated;

-- 16. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_society_accounts_email ON society_accounts(email);
CREATE INDEX IF NOT EXISTS idx_society_accounts_status ON society_accounts(status);
CREATE INDEX IF NOT EXISTS idx_societies_society_account_id ON societies(society_account_id);
CREATE INDEX IF NOT EXISTS idx_societies_created_by_user_id ON societies(created_by_user_id);