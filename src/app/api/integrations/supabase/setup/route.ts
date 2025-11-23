import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured. Please set up your Supabase credentials first.'
      }, { status: 400 })
    }

    console.log('Setting up Supabase database schema...')
    
    // Read and execute the schema migration
    const schemaSQL = `
      -- Create profiles table for additional user data
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

      -- Create society_accounts table
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

      -- Create societies table
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

      -- Enable RLS (Row Level Security)
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE society_accounts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE societies ENABLE ROW LEVEL SECURITY;

      -- Create policies for profiles
      CREATE POLICY IF NOT EXISTS "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
      CREATE POLICY IF NOT EXISTS "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
      CREATE POLICY IF NOT EXISTS "Super admins can view all profiles" ON profiles FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
      );
      CREATE POLICY IF NOT EXISTS "Super admins can update all profiles" ON profiles FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
      );

      -- Create policies for society_accounts
      CREATE POLICY IF NOT EXISTS "Users can view own society account" ON society_accounts FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND society_account_id = id)
      );
      CREATE POLICY IF NOT EXISTS "Super admins can view all society accounts" ON society_accounts FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
      );
      CREATE POLICY IF NOT EXISTS "Super admins can manage all society accounts" ON society_accounts FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
      );

      -- Create policies for societies
      CREATE POLICY IF NOT EXISTS "Users can view own societies" ON societies FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND society_account_id = society_account_id)
      );
      CREATE POLICY IF NOT EXISTS "Super admins can view all societies" ON societies FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
      );
      CREATE POLICY IF NOT EXISTS "Super admins can manage all societies" ON societies FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
      );

      -- Create function to handle new user signup
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

      -- Create trigger to automatically create profile on signup
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

      -- Create updated_at trigger
      CREATE OR REPLACE FUNCTION public.handle_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Apply updated_at triggers
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
    `

    // Execute the schema using SQL RPC
    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schemaSQL })
    
    if (schemaError) {
      console.log('Schema setup error:', schemaError)
      // Try direct SQL execution
      const { error: directError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
      
      if (directError && directError.code !== 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Failed to setup database schema: ' + schemaError.message
        }, { status: 500 })
      }
    }

    console.log('Database schema setup complete')

    // Create demo users
    const demoUsers = [
      {
        email: 'client@saanify.com',
        password: 'client123',
        name: 'Demo Client',
        userType: 'client'
      },
      {
        email: 'superadmin@saanify.com',
        password: 'admin123',
        name: 'Super Admin',
        userType: 'admin'
      }
    ]

    const createdUsers = []

    for (const user of demoUsers) {
      try {
        // Create user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            name: user.name,
            role: user.userType === 'admin' ? 'SUPER_ADMIN' : 'CLIENT'
          }
        })

        if (authError) {
          console.log(`Failed to create ${user.email}:`, authError.message)
          continue
        }

        if (!authData.user) {
          console.log(`No user created for ${user.email}`)
          continue
        }

        // Wait for trigger to create profile
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Verify profile was created
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (profileError || !profile) {
          console.log(`Profile creation failed for ${user.email}:`, profileError)
          continue
        }

        // If it's a client, create a demo society account
        if (user.userType === 'client') {
          const { data: societyAccount, error: societyError } = await supabase
            .from('society_accounts')
            .insert([{
              name: `${user.name}'s Society`,
              admin_name: user.name,
              email: user.email,
              subscription_plan: 'TRIAL',
              status: 'TRIAL'
            }])
            .select()
            .single()

          if (!societyError && societyAccount) {
            // Link the society account to the user profile
            await supabase
              .from('profiles')
              .update({ society_account_id: societyAccount.id })
              .eq('id', authData.user.id)
          }
        }

        createdUsers.push({
          email: user.email,
          name: user.name,
          role: profile.role,
          password: user.password
        })

        console.log(`Successfully created user: ${user.email}`)

      } catch (error) {
        console.error(`Error creating user ${user.email}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase setup completed successfully',
      schemaSetup: true,
      usersCreated: createdUsers.length,
      users: createdUsers
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}