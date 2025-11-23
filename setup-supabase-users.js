import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = 'https://oyxfyovoqtcmpgazckcl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95eGZ5b3ZvcXRjbXBnYXpja2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyOTU5MzMsImV4cCI6MjA3Njg3MTkzM30.jFLmOmJpuwpCi4wswlX94SBxtF6Je_btv0Y65nK15s0'

// Create admin client with service role key (we'll need to get this)
const setupSupabase = async () => {
  console.log('Setting up Supabase database...')
  
  try {
    // First, let's try with anon key to see if we can create users
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Read the SQL setup script
    const sqlScript = readFileSync(`${__dirname}/supabase-setup.sql`, 'utf8')
    
    console.log('SQL Script loaded. You need to run this manually in Supabase SQL Editor.')
    console.log('Here are the demo users that will be created:')
    console.log('1. client@saanify.com (password: client123)')
    console.log('2. superadmin@saanify.com (password: admin123)')
    console.log('\nPlease follow these steps:')
    console.log('1. Go to your Supabase project: https://oyxfyovoqtcmpgazckcl.supabase.co')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the SQL script from supabase-setup.sql')
    console.log('4. Run the script to create tables and demo users')
    
    // Try to create users using auth API
    console.log('\nAttempting to create demo users...')
    
    // Create demo client user
    const { data: clientData, error: clientError } = await supabase.auth.signUp({
      email: 'demo.client.saanify@gmail.com',
      password: 'client123',
      options: {
        data: {
          name: 'Demo Client',
          role: 'CLIENT'
        }
      }
    })
    
    if (clientError) {
      console.log('Client user creation:', clientError.message)
      // Try to sign in instead (user might already exist)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'demo.client.saanify@gmail.com',
        password: 'client123'
      })
      if (signInError) {
        console.log('Client sign in also failed:', signInError.message)
      } else {
        console.log('✅ Client user already exists and can sign in')
      }
    } else {
      console.log('✅ Client user created successfully')
    }
    
    // Create demo admin user
    const { data: adminData, error: adminError } = await supabase.auth.signUp({
      email: 'demo.admin.saanify@gmail.com',
      password: 'admin123',
      options: {
        data: {
          name: 'Super Admin',
          role: 'SUPER_ADMIN'
        }
      }
    })
    
    if (adminError) {
      console.log('Admin user creation:', adminError.message)
      // Try to sign in instead (user might already exist)
      const { data: adminSignInData, error: adminSignInError } = await supabase.auth.signInWithPassword({
        email: 'demo.admin.saanify@gmail.com',
        password: 'admin123'
      })
      if (adminSignInError) {
        console.log('Admin sign in also failed:', adminSignInError.message)
      } else {
        console.log('✅ Admin user already exists and can sign in')
      }
    } else {
      console.log('✅ Admin user created successfully')
    }
    
  } catch (error) {
    console.error('Setup error:', error.message)
  }
}

setupSupabase()