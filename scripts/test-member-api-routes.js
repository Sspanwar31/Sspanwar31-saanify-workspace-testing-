// Comprehensive API route testing script for member management endpoints
// Usage: node scripts/test-member-api-routes.js

const testMemberApiRoutes = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  console.log('🧪 [TEST] Starting comprehensive API route tests...\n');
  console.log(`🌐 [TEST] Base URL: ${baseUrl}\n`);

  // Test configuration
  const testConfig = {
    timeout: 10000,
    retryAttempts: 2,
    testMember: {
      name: 'Test User',
      phone: `+1234567890${Date.now().toString().slice(-4)}`,
      address: '123 Test Street',
      joinDate: new Date().toISOString().split('T')[0]
    }
  };

  let createdMemberId = null;
  let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
  };

  // Helper function to make HTTP requests with timeout
  const makeRequest = async (url, options = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), testConfig.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { rawResponse: await response.text() };
      }
      
      return { response, data };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  // Helper function to run a test
  const runTest = async (testName, testFunction) => {
    testResults.total++;
    console.log(`📝 [TEST] Running: ${testName}`);
    
    try {
      const result = await testFunction();
      testResults.passed++;
      testResults.details.push({
        name: testName,
        status: 'PASSED',
        ...result
      });
      console.log(`✅ [TEST] ${testName} - PASSED\n`);
      return result;
    } catch (error) {
      testResults.failed++;
      testResults.details.push({
        name: testName,
        status: 'FAILED',
        error: error.message,
        stack: error.stack
      });
      console.log(`❌ [TEST] ${testName} - FAILED: ${error.message}\n`);
      throw error;
    }
  };

  // Test 1: Health Check
  await runTest('Health Check', async () => {
    const { response, data } = await makeRequest(`${baseUrl}/api/health`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!data.status || !data.timestamp) {
      throw new Error('Health check response missing required fields');
    }
    
    return {
      statusCode: response.status,
      responseTime: response.headers.get('x-response-time'),
      data: {
        status: data.status,
        database: data.database?.connected,
        uptime: data.uptime
      }
    };
  });

  // Test 2: Create Member (POST)
  await runTest('Create Member', async () => {
    const { response, data } = await makeRequest(`${baseUrl}/api/client/members`, {
      method: 'POST',
      body: JSON.stringify(testConfig.testMember)
    });
    
    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}. Response: ${JSON.stringify(data)}`);
    }
    
    if (!data.success || !data.member) {
      throw new Error('Create member response missing success flag or member data');
    }
    
    createdMemberId = data.member.id;
    
    return {
      statusCode: response.status,
      memberId: data.member.id,
      memberName: data.member.name,
      memberPhone: data.member.phone
    };
  });

  // Test 3: Get All Members (GET)
  await runTest('Get All Members', async () => {
    const { response, data } = await makeRequest(`${baseUrl}/api/client/members?page=1&limit=10`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!data.success || !Array.isArray(data.members)) {
      throw new Error('Get members response missing success flag or members array');
    }
    
    return {
      statusCode: response.status,
      memberCount: data.members.length,
      pagination: data.pagination
    };
  });

  // Test 4: Get Member by ID (GET)
  if (createdMemberId) {
    await runTest('Get Member by ID', async () => {
      const { response, data } = await makeRequest(`${baseUrl}/api/client/members/${createdMemberId}`);
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      if (!data.success || !data.member) {
        throw new Error('Get member by ID response missing success flag or member data');
      }
      
      return {
        statusCode: response.status,
        memberId: data.member.id,
        memberName: data.member.name
      };
    });
  }

  // Test 5: Update Member (PUT)
  if (createdMemberId) {
    await runTest('Update Member', async () => {
      const updateData = {
        name: 'Updated Test User',
        address: '456 Updated Street',
        joinDate: new Date().toISOString().split('T')[0]
      };
      
      const { response, data } = await makeRequest(`${baseUrl}/api/client/members/${createdMemberId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}. Response: ${JSON.stringify(data)}`);
      }
      
      if (!data.success || !data.member) {
        throw new Error('Update member response missing success flag or member data');
      }
      
      return {
        statusCode: response.status,
        updatedName: data.member.name,
        updatedAddress: data.member.address
      };
    });
  }

  // Test 6: Create Duplicate Member (Should Fail)
  await runTest('Create Duplicate Member (Should Fail)', async () => {
    const { response, data } = await makeRequest(`${baseUrl}/api/client/members`, {
      method: 'POST',
      body: JSON.stringify(testConfig.testMember)
    });
    
    if (response.status !== 409) {
      throw new Error(`Expected status 409, got ${response.status}`);
    }
    
    return {
      statusCode: response.status,
      error: data.error,
      expectedConflict: true
    };
  });

  // Test 7: Invalid Member Data (Should Fail)
  await runTest('Create Member with Invalid Data (Should Fail)', async () => {
    const invalidData = {
      phone: '1234567890'
      // Missing required 'name' field
    };
    
    const { response, data } = await makeRequest(`${baseUrl}/api/client/members`, {
      method: 'POST',
      body: JSON.stringify(invalidData)
    });
    
    if (response.status !== 400) {
      throw new Error(`Expected status 400, got ${response.status}`);
    }
    
    return {
      statusCode: response.status,
      error: data.error,
      expectedValidationError: true
    };
  });

  // Test 8: Get Non-existent Member (Should Fail)
  await runTest('Get Non-existent Member (Should Fail)', async () => {
    const nonExistentId = 'non-existent-member-id';
    
    const { response, data } = await makeRequest(`${baseUrl}/api/client/members/${nonExistentId}`);
    
    if (response.status !== 404) {
      throw new Error(`Expected status 404, got ${response.status}`);
    }
    
    return {
      statusCode: response.status,
      error: data.error,
      expectedNotFound: true
    };
  });

  // Test 9: Search Members
  await runTest('Search Members', async () => {
    const searchTerm = 'Test';
    const { response, data } = await makeRequest(`${baseUrl}/api/client/members?search=${searchTerm}&page=1&limit=5`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    return {
      statusCode: response.status,
      searchTerm,
      resultCount: data.members?.length || 0,
      pagination: data.pagination
    };
  });

  // Test 10: Pagination
  await runTest('Pagination Test', async () => {
    const { response, data } = await makeRequest(`${baseUrl}/api/client/members?page=1&limit=2`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!data.pagination) {
      throw new Error('Pagination data missing from response');
    }
    
    return {
      statusCode: response.status,
      currentPage: data.pagination.page,
      limit: data.pagination.limit,
      totalPages: data.pagination.pages,
      memberCount: data.members?.length || 0
    };
  });

  // Cleanup: Delete the created member
  if (createdMemberId) {
    await runTest('Cleanup: Delete Created Member', async () => {
      const { response, data } = await makeRequest(`${baseUrl}/api/client/members/${createdMemberId}`, {
        method: 'DELETE'
      });
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      return {
        statusCode: response.status,
        message: data.message,
        deletedMemberId: createdMemberId
      };
    });
  }

  // Print final results
  console.log('📊 [TEST] Test Results Summary:');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%\n`);

  console.log('📋 [TEST] Detailed Results:');
  testResults.details.forEach((test, index) => {
    const status = test.status === 'PASSED' ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${test.name}`);
    if (test.status === 'FAILED') {
      console.log(`   Error: ${test.error}`);
    }
    if (test.statusCode) {
      console.log(`   Status Code: ${test.statusCode}`);
    }
  });

  console.log('\n🎯 [TEST] Testing completed!');

  // Exit with appropriate code
  if (testResults.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

// Performance testing function
const performanceTest = async () => {
  console.log('⚡ [PERF] Starting performance tests...\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const concurrentRequests = 10;
  const totalRequests = 50;
  
  const results = [];
  
  for (let i = 0; i < totalRequests; i++) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${baseUrl}/api/client/members?page=1&limit=5`);
      const endTime = Date.now();
      
      results.push({
        request: i + 1,
        status: response.status,
        responseTime: endTime - startTime,
        success: response.status === 200
      });
    } catch (error) {
      const endTime = Date.now();
      results.push({
        request: i + 1,
        status: 'ERROR',
        responseTime: endTime - startTime,
        success: false,
        error: error.message
      });
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Calculate statistics
  const successfulRequests = results.filter(r => r.success);
  const avgResponseTime = successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length;
  const minResponseTime = Math.min(...successfulRequests.map(r => r.responseTime));
  const maxResponseTime = Math.max(...successfulRequests.map(r => r.responseTime));
  
  console.log('📊 [PERF] Performance Results:');
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful: ${successfulRequests.length}`);
  console.log(`Failed: ${totalRequests - successfulRequests.length}`);
  console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`Min Response Time: ${minResponseTime}ms`);
  console.log(`Max Response Time: ${maxResponseTime}ms`);
  console.log(`Success Rate: ${((successfulRequests.length / totalRequests) * 100).toFixed(1)}%`);
};

// Error handling test
const errorHandlingTest = async () => {
  console.log('🚨 [ERROR] Starting error handling tests...\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  const errorTests = [
    {
      name: 'Invalid JSON',
      url: `${baseUrl}/api/client/members`,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{'
      },
      expectedStatus: 400
    },
    {
      name: 'Missing Required Field',
      url: `${baseUrl}/api/client/members`,
      options: {
        method: 'POST',
        body: JSON.stringify({ phone: '1234567890' }) // Missing name
      },
      expectedStatus: 400
    },
    {
      name: 'Invalid Member ID',
      url: `${baseUrl}/api/client/members/invalid-id`,
      options: { method: 'GET' },
      expectedStatus: 404
    }
  ];
  
  for (const test of errorTests) {
    console.log(`🧪 [ERROR] Testing: ${test.name}`);
    
    try {
      const response = await fetch(test.url, test.options);
      const data = await response.json();
      
      if (response.status === test.expectedStatus) {
        console.log(`✅ [ERROR] ${test.name} - Correctly returned ${response.status}`);
        console.log(`   Error: ${data.error || data.message}`);
      } else {
        console.log(`❌ [ERROR] ${test.name} - Expected ${test.expectedStatus}, got ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ [ERROR] ${test.name} - Request failed: ${error.message}`);
    }
  }
};

// Main execution
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.includes('--performance')) {
    await performanceTest();
  } else if (args.includes('--errors')) {
    await errorHandlingTest();
  } else {
    await testMemberApiRoutes();
  }
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 [TEST] Test execution failed:', error);
    process.exit(1);
  });
};

module.exports = {
  testMemberApiRoutes,
  performanceTest,
  errorHandlingTest
};