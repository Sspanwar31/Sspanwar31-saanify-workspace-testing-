import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = 'https://oyxfyovoqtcmpgazckcl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95eGZ5b3ZvcXRjbXBnYXpja2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyOTU5MzMsImV4cCI6MjA3Njg3MTkzM30.jFLmOmJpuwpCi4wswlX94SBxtF6Je_btv0Y65nK15s0'

const finalSetup = async () => {
  console.log('🚀 FINAL SUPABASE SETUP GUIDE')
  console.log('=====================================')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Test the existing users
    console.log('\n1. Testing existing Gmail users...')
    
    const testUsers = [
      { email: 'demo.client.saanify@gmail.com', password: 'client123', role: 'CLIENT' },
      { email: 'demo.admin.saanify@gmail.com', password: 'admin123', role: 'SUPER_ADMIN' }
    ]
    
    for (const user of testUsers) {
      console.log(`\nTesting ${user.email}...`)
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      })
      
      if (signInError) {
        console.log(`❌ Login failed: ${signInError.message}`)
        if (signInError.message.includes('Email not confirmed')) {
          console.log('   → Email needs confirmation in Supabase dashboard')
        }
      } else {
        console.log(`✅ Login successful!`)
        console.log(`   User ID: ${signInData.user.id}`)
        
        // Try to create profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: signInData.user.id,
            email: signInData.user.email,
            name: user.role === 'CLIENT' ? 'Demo Client' : 'Super Admin',
            role: user.role,
            is_active: true
          })
          .select()
        
        if (profileError) {
          console.log(`   Profile creation failed: ${profileError.message}`)
          console.log('   → Tables need to be created first')
        } else {
          console.log(`   ✅ Profile created successfully`)
        }
      }
    }
    
    console.log('\n📋 COMPLETE SETUP INSTRUCTIONS:')
    console.log('==================================')
    console.log('\n🔧 STEP 1: Configure Supabase Authentication')
    console.log('1. Go to: https://oyxfyovoqtcmpgazckcl.supabase.co')
    console.log('2. Navigate to Authentication > Settings')
    console.log('3. TEMPORARILY disable "Enable email confirmations"')
    console.log('4. Save settings')
    
    console.log('\n🗄️ STEP 2: Create Database Tables')
    console.log('1. Go to SQL Editor')
    console.log('2. Copy the entire content from: supabase-setup.sql')
    console.log('3. Paste and run the SQL script')
    console.log('4. This will create: profiles, society_accounts, societies tables')
    
    console.log('\n👥 STEP 3: Confirm Demo Users')
    console.log('1. Go to Authentication > Users')
    console.log('2. Find these users and confirm them:')
    console.log('   - demo.client.saanify@gmail.com')
    console.log('   - demo.admin.saanify@gmail.com')
    console.log('3. Or recreate them with email confirmation disabled')
    
    console.log('\n🔧 STEP 4: Update Environment Variables')
    console.log('Add service role key to .env.local:')
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
    
    console.log('\n🧪 STEP 5: Test Login')
    console.log('Use these credentials:')
    console.log('Client: demo.client.saanify@gmail.com / client123')
    console.log('Admin: demo.admin.saanify@gmail.com / admin123')
    
    console.log('\n🔄 STEP 6: Re-enable Email Confirmation')
    console.log('After testing, re-enable email confirmation in settings')
    
    console.log('\n🌐 Alternative: Use Local Database')
    console.log('If Supabase setup is too complex, you can:')
    console.log('1. Rename .env.local to .env.local.backup')
    console.log('2. Use the local SQLite database (already working)')
    console.log('3. Local credentials: client@saanify.com / client123')
    
  } catch (error) {
    console.error('Setup error:', error.message)
  }
}

finalSetup()