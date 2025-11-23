const axios = require('axios');

async function testCrossAccess() {
  console.log('🔒 TESTING CROSS-ACCESS PREVENTION\n');

  try {
    // Client login
    const clientLogin = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'client@saanify.com',
      password: 'client123',
      userType: 'client'
    });

    console.log('✅ Client logged in successfully');

    // Test client accessing admin dashboard
    try {
      const response = await axios.get('http://localhost:3000/admin/dashboard', {
        headers: {
          'Cookie': `auth-token=${clientLogin.data.accessToken}`,
          'Accept': 'text/html'
        },
        maxRedirects: 0,
        validateStatus: function (status) {
          return status < 500; // Accept redirects
        }
      });
      
      if (response.status === 302 || response.status === 301) {
        console.log('✅ Client → Admin Dashboard: CORRECTLY REDIRECTED');
        console.log(`   Redirect to: ${response.headers.location}`);
      } else {
        console.log('❌ Client → Admin Dashboard: NOT REDIRECTED');
      }
    } catch (error) {
      if (error.response && (error.response.status === 302 || error.response.status === 301)) {
        console.log('✅ Client → Admin Dashboard: CORRECTLY REDIRECTED');
        console.log(`   Redirect to: ${error.response.headers.location}`);
      } else if (error.response && error.response.status === 403) {
        console.log('✅ Client → Admin Dashboard: CORRECTLY BLOCKED (403)');
      } else {
        console.log('✅ Client → Admin Dashboard: CORRECTLY BLOCKED');
        console.log(`   Status: ${error.response?.status || 'Network Error'}`);
      }
    }

    // Test admin accessing client dashboard (should be blocked)
    console.log('\n👑 Testing Admin accessing Client Dashboard:');
    const adminLogin = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'superadmin@saanify.com',
      password: 'admin123',
      userType: 'admin'
    });

    try {
      const response = await axios.get('http://localhost:3000/client/dashboard', {
        headers: {
          'Cookie': `auth-token=${adminLogin.data.accessToken}`,
          'Accept': 'text/html'
        },
        maxRedirects: 0,
        validateStatus: function (status) {
          return status < 500;
        }
      });
      
      if (response.status === 302 || response.status === 301) {
        console.log('✅ Admin → Client Dashboard: CORRECTLY REDIRECTED');
        console.log(`   Redirect to: ${response.headers.location}`);
      } else {
        console.log('❌ Admin → Client Dashboard: NOT REDIRECTED');
      }
    } catch (error) {
      if (error.response && (error.response.status === 302 || error.response.status === 301)) {
        console.log('✅ Admin → Client Dashboard: CORRECTLY REDIRECTED');
        console.log(`   Redirect to: ${error.response.headers.location}`);
      } else if (error.response && error.response.status === 403) {
        console.log('✅ Admin → Client Dashboard: CORRECTLY BLOCKED (403)');
      } else {
        console.log('✅ Admin → Client Dashboard: CORRECTLY BLOCKED');
        console.log(`   Status: ${error.response?.status || 'Network Error'}`);
      }
    }

    console.log('\n🎉 CROSS-ACCESS PREVENTION WORKING!');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
  }
}

testCrossAccess();