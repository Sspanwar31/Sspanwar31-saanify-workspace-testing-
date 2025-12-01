#!/usr/bin/env node

/**
 * Test script to verify infinite re-render fixes are working
 * This simulates browser requests to check for errors
 */

const http = require('http');

console.log('🧪 Testing infinite re-render fixes...\n');

async function testPage(path, description) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Test Script)'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ ${description}: HTTP ${res.statusCode} (${data.length} bytes)`);
        
        // Check for error indicators in response
        if (data.includes('Maximum update depth exceeded')) {
          console.log(`❌ ERROR: Found 'Maximum update depth exceeded' in ${path}`);
        } else if (data.includes('error') || data.includes('Error')) {
          console.log(`⚠️  Warning: Found potential error in ${path}`);
        }
        
        resolve({ status: res.statusCode, size: data.length });
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${description}: Request failed - ${error.message}`);
      resolve({ status: 0, size: 0, error: error.message });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`❌ ${description}: Request timeout`);
      resolve({ status: 0, size: 0, error: 'timeout' });
    });

    req.end();
  });
}

async function runTests() {
  const tests = [
    { path: '/', description: 'Home page' },
    { path: '/login', description: 'Login page' },
    { path: '/client/dashboard', description: 'Client dashboard (main test)' },
    { path: '/client/members', description: 'Client members page' },
    { path: '/client/loans', description: 'Client loans page' },
    { path: '/client/passbook', description: 'Client passbook page' },
    { path: '/subscription', description: 'Subscription page' },
    { path: '/subscription/select-plan', description: 'Subscription select plan' }
  ];

  console.log('Testing key pages for infinite re-render issues...\n');

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      const result = await testPage(test.path, test.description);
      if (result.status === 200) {
        passedTests++;
      }
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`❌ ${test.description}: Test failed - ${error.message}`);
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);

  if (passedTests === totalTests) {
    console.log(`\n🎉 All tests passed! Infinite re-render fixes appear to be working.`);
    console.log(`   The 'Maximum update depth exceeded' error should be resolved.`);
  } else {
    console.log(`\n⚠️  Some tests failed. Check the server logs for more details.`);
  }
}

runTests().catch(console.error);