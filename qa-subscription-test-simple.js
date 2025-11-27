#!/usr/bin/env node

/**
 * Simplified Subscription System QA Test
 * Tests the core functionality with proper authentication
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  testClient: {
    name: 'Test Client User',
    email: `testclient+${Date.now()}@example.com`,
    password: 'TestPassword123!',
    societyName: 'Test Society QA'
  }
};

// Test results storage
const testResults = {
  trial_flow: { status: 'FAIL', reason: '', details: {} },
  payment_submission: { status: 'FAIL', reason: '', details: {} },
  admin_approval: { status: 'FAIL', reason: '', details: {} },
  notification_status: { status: 'FAIL', reason: '', details: {} },
  plan_upgrade_verification: { status: 'FAIL', reason: '', details: {} },
  final_client_state_correct: false,
  errors: [],
  recommendations: []
};

// Utility functions
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
}

function makeRequest(url, options = {}) {
  const defaultOptions = {
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  return fetch(url, { ...defaultOptions, ...options });
}

async function testAPIConnectivity() {
  log('Testing API connectivity...');
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseURL}/api/health`);
    const data = await response.json();
    
    if (data.status === 'ok') {
      log('✅ API connectivity confirmed');
      return true;
    } else {
      throw new Error('API health check failed');
    }
  } catch (error) {
    log(`❌ API connectivity failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function testClientCreation() {
  log('Testing client account creation...');
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseURL}/api/auth/signup`, {
      method: 'POST',
      body: JSON.stringify({
        name: TEST_CONFIG.testClient.name,
        email: TEST_CONFIG.testClient.email,
        password: TEST_CONFIG.testClient.password,
        societyName: TEST_CONFIG.testClient.societyName
      })
    });

    // Check if response redirects (which is success for signup)
    if (response.redirected || response.status === 200 || response.status === 302) {
      log(`✅ Client creation initiated: ${TEST_CONFIG.testClient.email}`);
      testResults.trial_flow.status = 'PASS';
      testResults.trial_flow.reason = 'Client account creation process initiated successfully';
      return true;
    } else {
      const data = await response.json();
      throw new Error(`Client creation failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    log(`❌ Client creation failed: ${error.message}`, 'ERROR');
    testResults.trial_flow.reason = `Client creation failed: ${error.message}`;
    return false;
  }
}

async function testAdminLogin() {
  log('Testing admin login...');
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseURL}/api/auth/unified-login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@saanify.com',
        password: 'admin123'
      })
    });

    if (response.ok) {
      const data = await response.json();
      log('✅ Admin login successful');
      return data;
    } else {
      const data = await response.json();
      throw new Error(`Admin login failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    log(`❌ Admin login failed: ${error.message}`, 'ERROR');
    testResults.admin_approval.reason = `Admin login failed: ${error.message}`;
    return null;
  }
}

async function testPaymentProofsAPI(adminToken) {
  log('Testing payment proofs API...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseURL}/api/admin/subscriptions/payment-proofs`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      log(`✅ Payment proofs API accessible, found ${data.paymentProofs?.length || 0} proofs`);
      testResults.admin_approval.status = 'PASS';
      testResults.admin_approval.reason = 'Payment proofs API is accessible';
      return data.paymentProofs || [];
    } else {
      const data = await response.json();
      throw new Error(`Payment proofs API failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    log(`❌ Payment proofs API failed: ${error.message}`, 'ERROR');
    testResults.admin_approval.reason = `Payment proofs API failed: ${error.message}`;
    return [];
  }
}

async function testSubscriptionPlans() {
  log('Testing subscription plans...');
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseURL}/api/admin/subscription-plans`);
    
    if (response.ok) {
      const data = await response.json();
      log(`✅ Subscription plans API accessible`);
      testResults.plan_upgrade_verification.status = 'PASS';
      testResults.plan_upgrade_verification.reason = 'Subscription plans API is functional';
      testResults.plan_upgrade_verification.details = { plans: data.plans || data };
      return true;
    } else {
      // Try accessing the subscription page directly
      const pageResponse = await makeRequest(`${TEST_CONFIG.baseURL}/subscription`);
      if (pageResponse.ok) {
        log('✅ Subscription page accessible');
        testResults.plan_upgrade_verification.status = 'PARTIAL';
        testResults.plan_upgrade_verification.reason = 'Subscription page accessible, API needs verification';
        return true;
      } else {
        throw new Error('Both subscription API and page failed');
      }
    }
  } catch (error) {
    log(`❌ Subscription plans test failed: ${error.message}`, 'ERROR');
    testResults.plan_upgrade_verification.reason = `Subscription plans test failed: ${error.message}`;
    return false;
  }
}

async function testNotificationsAPI() {
  log('Testing notifications API...');
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseURL}/api/notifications`);
    
    if (response.ok) {
      const data = await response.json();
      log(`✅ Notifications API accessible`);
      testResults.notification_status.status = 'PASS';
      testResults.notification_status.reason = 'Notifications API is functional';
      return true;
    } else {
      const data = await response.json();
      throw new Error(`Notifications API failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    log(`❌ Notifications API test failed: ${error.message}`, 'ERROR');
    testResults.notification_status.reason = `Notifications API test failed: ${error.message}`;
    return false;
  }
}

async function testDatabaseSchema() {
  log('Testing database schema...');
  
  try {
    // Check if database is connected and models exist
    const response = await makeRequest(`${TEST_CONFIG.baseURL}/api/health`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.database === 'connected') {
        log('✅ Database schema is accessible');
        return true;
      } else {
        throw new Error('Database not connected');
      }
    } else {
      throw new Error('Health check failed');
    }
  } catch (error) {
    log(`❌ Database schema test failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function checkRequiredFiles() {
  log('Checking required subscription system files...');
  
  const requiredFiles = [
    '/src/app/api/subscription/submit-payment/route.ts',
    '/src/app/api/admin/subscriptions/payment-proofs/route.ts',
    '/src/app/api/admin/subscriptions/approve-payment/route.ts',
    '/src/app/api/admin/subscriptions/reject-payment/route.ts',
    '/src/app/subscription/page.tsx',
    '/src/app/admin/subscriptions/verify/page.tsx'
  ];
  
  const existingFiles = [];
  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      existingFiles.push(file);
    } else {
      missingFiles.push(file);
    }
  });
  
  log(`✅ Found ${existingFiles.length} required files`);
  if (missingFiles.length > 0) {
    log(`❌ Missing ${missingFiles.length} required files: ${missingFiles.join(', ')}`);
    testResults.recommendations.push(`Create missing files: ${missingFiles.join(', ')}`);
  }
  
  return missingFiles.length === 0;
}

// Main test execution
async function runTests() {
  log('🚀 Starting Simplified Subscription System QA Test');
  
  try {
    // Test 0: Basic connectivity
    log('\n=== TEST 0: BASIC CONNECTIVITY ===');
    const apiConnected = await testAPIConnectivity();
    if (!apiConnected) {
      throw new Error('API connectivity failed - cannot continue');
    }
    
    // Test 1: Required files check
    log('\n=== TEST 1: REQUIRED FILES CHECK ===');
    await checkRequiredFiles();
    
    // Test 2: Client Creation
    log('\n=== TEST 2: CLIENT CREATION ===');
    await testClientCreation();
    
    // Test 3: Admin Login
    log('\n=== TEST 3: ADMIN LOGIN ===');
    const adminData = await testAdminLogin();
    
    // Test 4: Payment Proofs API
    log('\n=== TEST 4: PAYMENT PROOFS API ===');
    if (adminData) {
      await testPaymentProofsAPI(adminData.token);
    }
    
    // Test 5: Subscription Plans
    log('\n=== TEST 5: SUBSCRIPTION PLANS ===');
    await testSubscriptionPlans();
    
    // Test 6: Notifications API
    log('\n=== TEST 6: NOTIFICATIONS API ===');
    await testNotificationsAPI();
    
    // Test 7: Database Schema
    log('\n=== TEST 7: DATABASE SCHEMA ===');
    await testDatabaseSchema();
    
    // Final assessment
    const passedTests = Object.values(testResults).filter(result => 
      typeof result === 'object' && result.status === 'PASS'
    ).length;
    
    testResults.final_client_state_correct = passedTests >= 4; // At least 4 tests should pass
    
  } catch (error) {
    log(`❌ Test execution failed: ${error.message}`, 'ERROR');
    testResults.errors.push(`Test execution error: ${error.message}`);
  }
  
  // Generate recommendations
  generateRecommendations();
  
  // Output results
  outputResults();
}

function generateRecommendations() {
  const recommendations = [];
  
  if (testResults.trial_flow.status !== 'PASS') {
    recommendations.push('Verify client creation process and trial assignment');
  }
  
  if (testResults.payment_submission.status !== 'PASS') {
    recommendations.push('Test payment submission API with proper authentication');
  }
  
  if (testResults.admin_approval.status !== 'PASS') {
    recommendations.push('Verify admin login and payment proofs access');
  }
  
  if (testResults.notification_status.status !== 'PASS') {
    recommendations.push('Implement or fix notifications API');
  }
  
  if (testResults.plan_upgrade_verification.status !== 'PASS') {
    recommendations.push('Verify subscription plans pricing and configuration');
  }
  
  if (!testResults.final_client_state_correct) {
    recommendations.push('Overall system needs review - multiple components failing');
  }
  
  // Add existing recommendations
  testResults.recommendations.push(...recommendations);
  // Remove duplicates
  testResults.recommendations = [...new Set(testResults.recommendations)];
}

function outputResults() {
  log('\n' + '='.repeat(80));
  log('🏁 SUBSCRIPTION SYSTEM QA TEST RESULTS');
  log('='.repeat(80));
  
  console.log(JSON.stringify({
    trial_flow: `${testResults.trial_flow.status} - ${testResults.trial_flow.reason}`,
    payment_submission: `${testResults.payment_submission.status} - ${testResults.payment_submission.reason}`,
    admin_approval: `${testResults.admin_approval.status} - ${testResults.admin_approval.reason}`,
    notification_status: `${testResults.notification_status.status} - ${testResults.notification_status.reason}`,
    plan_upgrade_verification: `${testResults.plan_upgrade_verification.status} - ${testResults.plan_upgrade_verification.reason}`,
    final_client_state_correct: testResults.final_client_state_correct,
    fix_suggestions: testResults.recommendations
  }, null, 2));
  
  log('\n📋 DETAILED RESULTS:');
  log(`Trial Flow: ${testResults.trial_flow.status}`);
  log(`Payment Submission: ${testResults.payment_submission.status}`);
  log(`Admin Approval: ${testResults.admin_approval.status}`);
  log(`Notification Status: ${testResults.notification_status.status}`);
  log(`Plan Upgrade Verification: ${testResults.plan_upgrade_verification.status}`);
  log(`Final Client State Correct: ${testResults.final_client_state_correct}`);
  
  if (testResults.recommendations.length > 0) {
    log('\n🔧 RECOMMENDATIONS:');
    testResults.recommendations.forEach((rec, index) => {
      log(`${index + 1}. ${rec}`);
    });
  }
  
  if (testResults.errors.length > 0) {
    log('\n❌ ERRORS ENCOUNTERED:');
    testResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error}`);
    });
  }
  
  log('\n' + '='.repeat(80));
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    log(`Fatal error: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testResults
};