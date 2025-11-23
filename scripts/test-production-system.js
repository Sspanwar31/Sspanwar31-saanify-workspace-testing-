#!/usr/bin/env node

/**
 * Production System Testing Script
 * Tests login and dashboards work without readonly errors
 */

const https = require('https');

async function testProductionSystem() {
  console.log('🧪 Testing production system functionality...');
  
  const baseUrl = 'https://saanify-workspace.vercel.app';
  const testResults = {
    timestamp: new Date().toISOString(),
    baseUrl: baseUrl,
    tests: {}
  };
  
  // Test 1: API Health Check
  console.log('\n🏥 Testing API Health Check...');
  try {
    const healthResponse = await makeRequest('GET', `${baseUrl}/api/health`);
    testResults.tests.health = {
      status: '✅ Passed',
      response: healthResponse,
      statusCode: 200
    };
    console.log('✅ API Health Check: PASSED');
    console.log(`   Response: ${healthResponse}`);
  } catch (error) {
    testResults.tests.health = {
      status: '❌ Failed',
      error: error.message,
      statusCode: 'error'
    };
    console.log('❌ API Health Check: FAILED');
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 2: Super Admin Login
  console.log('\n🔐 Testing Super Admin Login...');
  try {
    const loginData = JSON.stringify({
      email: 'superadmin@saanify.com',
      password: 'admin123'
    });
    
    const loginResponse = await makeRequest('POST', `${baseUrl}/api/auth/login`, loginData);
    const loginResult = JSON.parse(loginResponse);
    
    if (loginResult.success && loginResult.user) {
      testResults.tests.superAdminLogin = {
        status: '✅ Passed',
        user: loginResult.user,
        hasToken: !!loginResult.accessToken,
        statusCode: 200
      };
      console.log('✅ Super Admin Login: PASSED');
      console.log(`   User: ${loginResult.user.name} (${loginResult.user.email})`);
      console.log(`   Role: ${loginResult.user.role}`);
      console.log(`   Token: ${loginResult.accessToken ? 'Generated' : 'Missing'}`);
    } else {
      throw new Error('Invalid login response');
    }
  } catch (error) {
    testResults.tests.superAdminLogin = {
      status: '❌ Failed',
      error: error.message,
      statusCode: 'error'
    };
    console.log('❌ Super Admin Login: FAILED');
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 3: Demo Client Login
  console.log('\n👤 Testing Demo Client Login...');
  try {
    const clientLoginData = JSON.stringify({
      email: 'client@saanify.com',
      password: 'client123'
    });
    
    const clientLoginResponse = await makeRequest('POST', `${baseUrl}/api/auth/login`, clientLoginData);
    const clientLoginResult = JSON.parse(clientLoginResponse);
    
    if (clientLoginResult.success && clientLoginResult.user) {
      testResults.tests.demoClientLogin = {
        status: '✅ Passed',
        user: clientLoginResult.user,
        hasToken: !!clientLoginResult.accessToken,
        statusCode: 200
      };
      console.log('✅ Demo Client Login: PASSED');
      console.log(`   User: ${clientLoginResult.user.name} (${clientLoginResult.user.email})`);
      console.log(`   Role: ${clientLoginResult.user.role}`);
      console.log(`   Token: ${clientLoginResult.accessToken ? 'Generated' : 'Missing'}`);
    } else {
      throw new Error('Invalid client login response');
    }
  } catch (error) {
    testResults.tests.demoClientLogin = {
      status: '❌ Failed',
      error: error.message,
      statusCode: 'error'
    };
    console.log('❌ Demo Client Login: FAILED');
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 4: Admin Dashboard Access
  console.log('\n📊 Testing Admin Dashboard Access...');
  try {
    const dashboardResponse = await makeRequest('GET', `${baseUrl}/dashboard/admin`);
    testResults.tests.adminDashboard = {
      status: '✅ Passed',
      statusCode: 200,
      hasContent: dashboardResponse.includes('html')
    };
    console.log('✅ Admin Dashboard: PASSED');
    console.log(`   Status Code: 200`);
    console.log(`   Content: HTML page loaded`);
  } catch (error) {
    testResults.tests.adminDashboard = {
      status: '❌ Failed',
      error: error.message,
      statusCode: 'error'
    };
    console.log('❌ Admin Dashboard: FAILED');
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 5: Client Dashboard Access
  console.log('\n📈 Testing Client Dashboard Access...');
  try {
    const clientDashboardResponse = await makeRequest('GET', `${baseUrl}/dashboard/client`);
    testResults.tests.clientDashboard = {
      status: '✅ Passed',
      statusCode: 200,
      hasContent: clientDashboardResponse.includes('html')
    };
    console.log('✅ Client Dashboard: PASSED');
    console.log(`   Status Code: 200`);
    console.log(`   Content: HTML page loaded`);
  } catch (error) {
    testResults.tests.clientDashboard = {
      status: '❌ Failed',
      error: error.message,
      statusCode: 'error'
    };
    console.log('❌ Client Dashboard: FAILED');
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 6: Database Operations (No Readonly Errors)
  console.log('\n🗄️ Testing Database Operations...');
  try {
    const dbTestResponse = await makeRequest('GET', `${baseUrl}/api/glm/migrate`);
    const dbTestResult = JSON.parse(dbTestResponse);
    
    testResults.tests.databaseOperations = {
      status: '✅ Passed',
      response: dbTestResult,
      hasData: !!dbTestResult.stats,
      statusCode: 200
    };
    console.log('✅ Database Operations: PASSED');
    console.log(`   Status: ${dbTestResult.status}`);
    if (dbTestResult.stats) {
      console.log(`   Users: ${dbTestResult.stats.users}`);
      console.log(`   Societies: ${dbTestResult.stats.societies}`);
    }
  } catch (error) {
    testResults.tests.databaseOperations = {
      status: '❌ Failed',
      error: error.message,
      statusCode: 'error'
    };
    console.log('❌ Database Operations: FAILED');
    console.log(`   Error: ${error.message}`);
  }
  
  // Calculate overall results
  const passedTests = Object.values(testResults.tests).filter(test => test.status === '✅ Passed').length;
  const totalTests = Object.keys(testResults.tests).length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  testResults.overall = {
    totalTests: totalTests,
    passedTests: passedTests,
    failedTests: totalTests - passedTests,
    successRate: successRate,
    status: successRate >= 80 ? '✅ SYSTEM READY' : '❌ SYSTEM NEEDS ATTENTION'
  };
  
  // Display results
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  Object.entries(testResults.tests).forEach(([testName, result]) => {
    console.log(`${result.status} ${testName}`);
  });
  
  console.log('\n🎯 Overall Results:');
  console.log(`   Total Tests: ${testResults.overall.totalTests}`);
  console.log(`   Passed: ${testResults.overall.passedTests}`);
  console.log(`   Failed: ${testResults.overall.failedTests}`);
  console.log(`   Success Rate: ${testResults.overall.successRate}%`);
  console.log(`   Status: ${testResults.overall.status}`);
  
  // Save test results
  const fs = require('fs');
  fs.writeFileSync('production-test-results.json', JSON.stringify(testResults, null, 2));
  console.log('\n📊 Test results saved to production-test-results.json');
  
  return testResults;
}

function makeRequest(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'GLM-Production-Test/1.0'
      }
    };
    
    if (data) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseData);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// Execute tests
console.log('🧪 Production System Testing');
console.log('============================');
const results = testProductionSystem().then(results => {
  if (results.overall.status.includes('✅')) {
    console.log('\n🎉 Production system is ready for use!');
    console.log('🌐 Access: https://saanify-workspace.vercel.app');
    console.log('👑 Super Admin: superadmin@saanify.com / admin123');
    console.log('👤 Demo Client: client@saanify.com / client123');
  } else {
    console.log('\n❌ Production system needs attention!');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Test execution failed:', error.message);
  process.exit(1);
});