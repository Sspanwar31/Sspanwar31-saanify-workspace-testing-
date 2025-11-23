import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = 'https://oyxfyovoqtcmpgazckcl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95eGZ5b3ZvcXRjbXBnYXpja2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyOTU5MzMsImV4cCI6MjA3Njg3MTkzM30.jFLmOmJpuwpCi4wswlX94SBxtF6Je_btv0Y65nK15s0'

const setupSupabaseData = async () => {
  console.log('Setting up Supabase data and testing login...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Test login with the demo users we created
    console.log('\nTesting client login...')
    const { data: clientData, error: clientError } = await supabase.auth.signInWithPassword({
      email: 'demo.client.saanify@gmail.com',
      password: 'client123'
    })
    
    if (clientError) {
      console.log('❌ Client login failed:', clientError.message)
    } else {
      console.log('✅ Client login successful!')
      console.log('User ID:', clientData.user.id)
      console.log('Email:', clientData.user.email)
      
      // Create/update profile for this user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: clientData.user.id,
          email: clientData.user.email,
          name: 'Demo Client',
          role: 'CLIENT',
          is_active: true
        })
        .select()
      
      if (profileError) {
        console.log('Profile creation failed (table might not exist):', profileError.message)
      } else {
        console.log('✅ Client profile created:', profileData)
      }
    }
    
    console.log('\nTesting admin login...')
    const { data: adminData, error: adminError } = await supabase.auth.signInWithPassword({
      email: 'demo.admin.saanify@gmail.com',
      password: 'admin123'
    })
    
    if (adminError) {
      console.log('❌ Admin login failed:', adminError.message)
    } else {
      console.log('✅ Admin login successful!')
      console.log('User ID:', adminData.user.id)
      console.log('Email:', adminData.user.email)
      
      // Create/update profile for this user
      const { data: adminProfileData, error: adminProfileError } = await supabase
        .from('profiles')
        .upsert({
          id: adminData.user.id,
          email: adminData.user.email,
          name: 'Super Admin',
          role: 'SUPER_ADMIN',
          is_active: true
        })
        .select()
      
      if (adminProfileError) {
        console.log('Admin profile creation failed (table might not exist):', adminProfileError.message)
      } else {
        console.log('✅ Admin profile created:', adminProfileData)
      }
    }
    
    console.log('\n📋 NEXT STEPS:')
    console.log('1. Go to your Supabase project: https://oyxfyovoqtcmpgazckcl.supabase.co')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the SQL script from supabase-setup.sql')
    console.log('4. Run the script to create tables and triggers')
    console.log('5. After running the SQL, the profiles will be automatically linked')
    
    console.log('\n📧 Demo Login Credentials:')
    console.log('Client: demo.client.saanify@gmail.com / client123')
    console.log('Admin: demo.admin.saanify@gmail.com / admin123')
    
    // Test our API endpoints
    console.log('\n🔗 Testing API endpoints...')
    
    // Test Supabase status
    try {
      const statusResponse = await fetch('http://localhost:3000/api/integrations/supabase/status')
      const statusData = await statusResponse.json()
      console.log('Supabase Status:', statusData.message)
    } catch (err) {
      console.log('Could not test Supabase status API')
    }
    
  } catch (error) {
    console.error('Setup error:', error.message)
  }
}

setupSupabaseData()