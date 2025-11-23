// Test script to verify Supabase authentication setup
// Run this in browser console to test the complete flow

async function testSupabaseSetup() {
  console.log('🔍 Testing Supabase Authentication Setup...')
  
  try {
    // Test 1: Check Supabase Status
    console.log('\n📊 Step 1: Checking Supabase Status...')
    const statusResponse = await fetch('/api/integrations/supabase/status')
    const status = await statusResponse.json()
    console.log('Status Response:', status)
    
    if (!status.connected) {
      console.log('❌ Supabase not connected. Please configure Supabase first.')
      console.log('💡 Steps to fix:')
      console.log('   1. Click the floating Database button (bottom-right corner)')
      console.log('   2. Enter your Supabase Project URL and API keys')
      console.log   3. Click "Validate Connection"')
      console.log('   4. Click "Save & Setup"')
      return false
    }
    
    console.log('✅ Supabase is connected!')
    
    // Test 2: Test Login with Demo User
    console.log('\n🔐 Step 2: Testing Login with Demo User...')
    const loginResponse = await fetch('/api/auth/supabase-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'client@saanify.com',
        password: 'client123',
        userType: 'client'
      })
    })
    
    const loginResult = await loginResponse.json()
    console.log('Login Response:', loginResult)
    
    if (loginResult.success) {
      console.log('✅ Login successful!')
      console.log('User:', loginResult.user)
      console.log('Session:', loginResult.session ? 'Available' : 'Not available')
    } else {
      console.log('❌ Login failed:', loginResult.error)
      
      if (loginResult.error.includes('User profile not found')) {
        console.log('💡 This is expected if demo users are not created yet.')
        console.log('   Run setupDatabase() to create demo users.')
      }
    }
    
    // Test 3: Check if Demo Users Need to be Created
    console.log('\n👥 Step 3: Checking Demo Users...')
    const setupResponse = await fetch('/api/integrations/supabase/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    const setupResult = await setupResponse.json()
    console.log('Setup Response:', setupResult)
    
    if (setupResult.success) {
      console.log('✅ Database setup completed!')
      console.log('Users Created:', setupResult.usersCreated)
      console.log('Demo Users:', setupResult.users)
    } else {
      console.log('❌ Setup failed:', setupResult.error)
    }
    
    // Test 4: Test Login Again After Setup
    if (setupResult.success) {
      console.log('\n🔄 Step 4: Testing Login After Setup...')
      const loginResponse2 = await fetch('/api/auth/supabase-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'client@saanify.com',
          password: 'client123',
          userType: 'client'
        })
      })
      
      const loginResult2 = await loginResponse2.json()
      console.log('Login Response After Setup:', loginResult2)
      
      if (loginResult2.success) {
        console.log('🎉 Complete Authentication Test Passed!')
        console.log('✅ User:', loginResult2.user)
        console.log('✅ Session:', loginResult2.session ? 'Available' : 'Not available')
        console.log('✅ Role:', loginResult2.user.role)
        console.log('✅ Ready for production!')
      } else {
        console.log('❌ Login still failed:', loginResult2.error)
      }
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return false
  }
}

// Function to setup database if needed
async function setupDatabase() {
  console.log('🔧 Setting up Supabase Database...')
  
  try {
    const response = await fetch('/api/integrations/supabase/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    const result = await response.json()
    console.log('Setup Result:', result)
    
    if (result.success) {
      console.log('✅ Database setup completed!')
      console.log('Users Created:', result.usersCreated)
      console.log('Demo Users:', result.users)
      return true
    } else {
      console.log('❌ Setup failed:', result.error)
      return false
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    return false
  }
}

// Function to check current status
async function checkStatus() {
  try {
    const response = await fetch('/api/integrations/supabase/status')
    const status = await response.json()
    console.log('Current Status:', status)
    return status
  } catch (error) {
    console.error('Status check failed:', error)
    return null
  }
}

// Usage instructions
console.log('🚀 Supabase Authentication Test Script Loaded!')
console.log('')
console.log('Available Functions:')
console.log('  checkStatus() - Check current Supabase status')
console.log('  setupDatabase() - Setup database schema and create demo users')
console.log('  testSupabaseSetup() - Run complete authentication test')
console.log('')
console.log('📋 Quick Test: checkStatus()')
console.log('🔧 Setup: setupDatabase()')
console.log('🧪 Full Test: testSupabaseSetup()')

// Auto-run status check
checkStatus()