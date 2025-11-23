import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = 'https://oyxfyovoqtcmpgazckcl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95eGZ5b3ZvcXRjbXBnYXpja2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyOTU5MzMsImV4cCI6MjA3Njg3MTkzM30.jFLmOmJpuwpCi4wswlX94SBxtF6Je_btv0Y65nK15s0'

const createWorkingUsers = async () => {
  console.log('🔧 Creating working demo users...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Create users with simple, valid emails
    const users = [
      {
        email: 'testclient1@gmail.com',
        password: 'client123',
        name: 'Demo Client',
        role: 'CLIENT'
      },
      {
        email: 'testadmin1@gmail.com', 
        password: 'admin123',
        name: 'Super Admin',
        role: 'SUPER_ADMIN'
      }
    ]
    
    for (const user of users) {
      console.log(`\nCreating/Testing user: ${user.email}`)
      
      // Try to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            name: user.name,
            role: user.role
          }
        }
      })
      
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          console.log('User already exists, testing login...')
          
          // Test login
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: user.password
          })
          
          if (signInError) {
            console.log(`❌ Login failed: ${signInError.message}`)
            
            // If email not confirmed, we'll need to confirm it manually
            if (signInError.message.includes('Email not confirmed')) {
              console.log('   → User exists but email not confirmed')
              console.log('   → Please confirm in Supabase dashboard or disable email confirmation')
            }
          } else {
            console.log(`✅ Login successful!`)
            console.log(`   User ID: ${signInData.user.id}`)
            
            // Try to create profile (might fail if tables don't exist)
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .upsert({
                  id: signInData.user.id,
                  email: signInData.user.email,
                  name: user.name,
                  role: user.role,
                  is_active: true
                })
                .select()
              
              if (profileError) {
                console.log(`   Profile creation failed: ${profileError.message}`)
                console.log('   → Run SQL script first to create tables')
              } else {
                console.log(`   ✅ Profile created successfully`)
              }
            } catch (profileErr) {
              console.log(`   Profile creation error: ${profileErr.message}`)
            }
          }
        } else {
          console.log(`❌ Sign up failed: ${signUpError.message}`)
        }
      } else {
        console.log(`✅ Sign up successful for ${user.email}`)
        console.log('   → Please confirm email or disable email confirmation')
      }
    }
    
    console.log('\n🎯 WORKING SOLUTION:')
    console.log('==================')
    console.log('\nOption 1: Quick Fix (Recommended)')
    console.log('1. Go to Supabase: https://oyxfyovoqtcmpgazckcl.supabase.co')
    console.log('2. Authentication > Settings > Disable "Enable email confirmations"')
    console.log('3. Create new users with these emails:')
    console.log('   - testclient1@gmail.com / client123')
    console.log('   - testadmin1@gmail.com / admin123')
    console.log('4. Run SQL script in SQL Editor')
    console.log('5. Test login - should work immediately!')
    
    console.log('\nOption 2: Use Local Database (Already Working)')
    console.log('1. Rename .env.local to .env.local.backup')
    console.log('2. Restart server')
    console.log('3. Use: client@saanify.com / client123')
    
    console.log('\n📋 SQL Script Location: supabase-setup.sql')
    console.log('🌐 Supabase URL: https://oyxfyovoqtcmpgazckcl.supabase.co')
    
  } catch (error) {
    console.error('Setup error:', error.message)
  }
}

createWorkingUsers()