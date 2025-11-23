import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = 'https://oyxfyovoqtcmpgazckcl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95eGZ5b3ZvcXRjbXBnYXpja2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyOTU5MzMsImV4cCI6MjA3Njg3MTkzM30.jFLmOmJpuwpCi4wswlX94SBxtF6Je_btv0Y65nK15s0'

const createConfirmedUsers = async () => {
  console.log('Creating demo users with email confirmation...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Create users with different approach - using sign up with email confirmation disabled
    const users = [
      {
        email: 'client@saanify.app',
        password: 'client123',
        name: 'Demo Client',
        role: 'CLIENT'
      },
      {
        email: 'admin@saanify.app',
        password: 'admin123',
        name: 'Super Admin',
        role: 'SUPER_ADMIN'
      }
    ]
    
    for (const user of users) {
      console.log(`\nCreating user: ${user.email}`)
      
      // Try to sign up first
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
          console.log('User already exists, trying to sign in...')
          
          // Try to sign in
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: user.password
          })
          
          if (signInError) {
            console.log(`❌ Sign in failed: ${signInError.message}`)
          } else {
            console.log(`✅ Sign in successful for ${user.email}`)
            
            // Create profile
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
              console.log(`Profile creation failed: ${profileError.message}`)
            } else {
              console.log(`✅ Profile created for ${user.email}`)
            }
          }
        } else {
          console.log(`❌ Sign up failed: ${signUpError.message}`)
        }
      } else {
        console.log(`✅ Sign up successful for ${user.email}`)
        console.log('Please check email for confirmation (or disable email confirmation in Supabase settings)')
      }
    }
    
    console.log('\n📋 MANUAL STEPS NEEDED:')
    console.log('1. Go to Supabase project: https://oyxfyovoqtcmpgazckcl.supabase.co')
    console.log('2. Go to Authentication > Settings')
    console.log('3. Disable "Enable email confirmations" temporarily')
    console.log('4. Or manually confirm the emails in Authentication > Users')
    console.log('5. Run the SQL script from supabase-setup.sql in SQL Editor')
    
    console.log('\n📧 Updated Login Credentials:')
    console.log('Client: client@saanify.app / client123')
    console.log('Admin: admin@saanify.app / admin123')
    
  } catch (error) {
    console.error('Setup error:', error.message)
  }
}

createConfirmedUsers()