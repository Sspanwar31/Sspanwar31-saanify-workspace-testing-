const axios = require('axios');

async function testDashboardAccess() {
  try {
    console.log('🔍 Testing Dashboard Access...\n');

    // First login to get token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'client@saanify.com',
      password: 'client123',
      userType: 'client'
    });

    const token = loginResponse.data.accessToken;
    console.log('✅ Logged in successfully');

    // Test dashboard access with token
    console.log('\n1️⃣ Testing Client Dashboard Access:');
    try {
      const dashboardResponse = await axios.get('http://localhost:3000/client/dashboard', {
        headers: {
          'Cookie': `auth-token=${token}`
        }
      });
      console.log('✅ Client Dashboard accessible');
    } catch (error) {
      console.log('❌ Client Dashboard access failed:', error.message);
    }

    // Test admin dashboard with client token (should fail)
    console.log('\n2️⃣ Testing Admin Dashboard with Client Token:');
    try {
      const adminDashboardResponse = await axios.get('http://localhost:3000/admin/dashboard', {
        headers: {
          'Cookie': `auth-token=${token}`
        }
      });
      console.log('❌ Admin Dashboard should not be accessible to client!');
    } catch (error) {
      console.log('✅ Admin Dashboard correctly blocked for client');
    }

    console.log('\n🎉 Dashboard access tests completed!');

  } catch (error) {
    console.error('❌ Dashboard test failed:', error.message);
  }
}

testDashboardAccess();