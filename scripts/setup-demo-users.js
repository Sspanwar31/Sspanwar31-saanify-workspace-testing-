// Script to create demo users in Supabase
// Run this in your browser console when logged into your Supabase dashboard

async function createDemoUsers() {
  try {
    const response = await fetch('/api/auth/create-demo-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'client@saanify.com',
        password: 'client123',
        name: 'Demo Client',
        userType: 'client'
      }),
    })

    const result = await response.json()
    console.log('Client user creation result:', result)

    // Create admin user
    const adminResponse = await fetch('/api/auth/create-demo-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'superadmin@saanify.com',
        password: 'admin123',
        name: 'Super Admin',
        userType: 'admin'
      }),
    })

    const adminResult = await adminResponse.json()
    console.log('Admin user creation result:', adminResult)

  } catch (error) {
    console.error('Error creating demo users:', error)
  }
}

// Instructions:
// 1. First, configure your Supabase connection using the SupabaseToggle (floating button in bottom-right)
// 2. Run this script in your browser console: createDemoUsers()
// 3. Wait for the users to be created
// 4. Try logging in with the demo credentials

console.log('Demo user creation script loaded. Run createDemoUsers() to create demo accounts.')