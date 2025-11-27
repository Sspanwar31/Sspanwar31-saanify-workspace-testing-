#!/usr/bin/env node

/**
 * Comprehensive Subscription System QA Test
 * Tests all aspects of the subscription workflow
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
  },
  testPlans: {
    BASIC: { price: 4000, expectedPrice: 4000 },
    PRO: { price: 8000, expectedPrice: 7000 }, // Expected based on requirements
    ENTERPRISE: { price: 15000, expectedPrice: 10000 } // Expected based on requirements
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

async function createTestClient() {
  log('Creating test client account...');
  
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

    const data = await response.json();
    
    if (response.ok) {
      log(`✅ Test client created: ${TEST_CONFIG.testClient.email}`);
      return data;
    } else {
      throw new Error(`Failed to create client: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    log(`❌ Client creation failed: ${error.message}`, 'ERROR');
    throw error;
  }
}

async function clientLogin(email, password) {
  log('Attempting client login...');
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseURL}/api/auth/unified-login`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (response.ok) {
      log('✅ Client login successful');
      return data;
    } else {
      throw new Error(`Login failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    log(`❌ Client login failed: ${error.message}`, 'ERROR');
    throw error;
  }
}

async function checkTrialStatus(userId) {
  log('Checking trial status for new client...');
  
  try {
    // Check user database record for trial dates
    const response = await makeRequest(`${TEST_CONFIG.baseURL}/api/admin/users`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }
    
    const data = await response.json();
    const user = data.users?.find(u => u.id === userId);
    
    if (user) {
      const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
      const createdAt = user.createdAt ? new Date(user.createdAt) : null;
      
      if (trialEndsAt && createdAt) {
        const trialDays = Math.ceil((trialEndsAt - createdAt) / (1000 * 60 * 60 * 24));
        
        log(`✅ Trial period found: ${trialDays} days`);
        
        if (trialDays >= 15) {
          testResults.trial_flow.status = 'PASS';
          testResults.trial_flow.reason = `Client correctly assigned ${trialDays}-day trial`;
          testResults.trial_flow.details = {
            trialEndsAt: user.trialEndsAt,
            createdAt: user.createdAt,
            trialDays
          };
          return true;
        } else {
          testResults.trial_flow.reason = `Expected 15-day trial, got ${trialDays} days`;
          return false;
        }
      } else {
        testResults.trial_flow.reason = 'No trial dates found in user record';
        return false;
      }
    } else {
      testResults.trial_flow.reason = 'User not found in database';
      return false;
    }
  } catch (error) {
    log(`❌ Trial status check failed: ${error.message}`, 'ERROR');
    testResults.trial_flow.reason = `Error checking trial status: ${error.message}`;
    return false;
  }
}

async function submitPaymentRequest(userToken, plan, amount, transactionId) {
  log(`Submitting payment request for ${plan} plan...`);
  
  try {
    // Create a dummy image file for testing
    const dummyImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    formData.append('plan', plan);
    formData.append('amount', amount.toString());
    formData.append('transactionId', transactionId);
    formData.append('screenshot', new Blob([dummyImageBuffer], { type: 'image/png' }), 'test-screenshot.png');
    formData.append('additionalInfo', 'Automated test payment submission');
    formData.append('paymentMethod', 'upi');

    const response = await fetch(`${TEST_CONFIG.baseURL}/api/subscription/submit-payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`
      },
      body: formData
    });

    const data = await response.json();
    
    if (response.ok) {
      log(`✅ Payment request submitted successfully for ${plan} plan`);
      return data;
    } else {
      throw new Error(`Payment submission failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    log(`❌ Payment submission failed: ${error.message}`, 'ERROR');
    throw error;
  }
}

async function adminLogin() {
  log('Attempting admin login...');
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseURL}/api/auth/unified-login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@saanify.com',
        password: 'admin123'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      log('✅ Admin login successful');
      return data;
    } else {
      throw new Error(`Admin login failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    log(`❌ Admin login failed: ${error.message}`, 'ERROR');
    throw error;
  }
}

async function checkPaymentProofs(adminToken) {
  log('Checking payment proofs for admin approval...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseURL}/api/admin/subscriptions/payment-proofs`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      log(`✅ Found ${data.paymentProofs?.length || 0} payment proofs`);
      return data.paymentProofs || [];
    } else {
      throw new Error(`Failed to fetch payment proofs: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    log(`❌ Payment proofs check failed: ${error.message}`, 'ERROR');
    throw error;
  }
}

async function approvePayment(adminToken, proofId) {
  log(`Approving payment proof: ${proofId}`);
  
  try {
    // Check if approve API endpoint exists
    const response = await fetch(`${TEST_CONFIG.baseURL}/api/admin/subscriptions/approve-payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        proofId,
        adminNotes: 'Automated test approval'
      })
    });

    if (response.ok) {
      const data = await response.json();
      log('✅ Payment approved successfully');
      return data;
    } else {
      const data = await response.json();
      throw new Error(`Payment approval failed: ${data.error || 'API endpoint not found'}`);
    }
  } catch (error) {
    log(`❌ Payment approval failed: ${error.message}`, 'ERROR');
    testResults.admin_approval.reason = `Approval API missing or failed: ${error.message}`;
    return null;
  }
}

async function rejectPayment(adminToken, proofId) {
  log(`Rejecting payment proof: ${proofId}`);
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseURL}/api/admin/subscriptions/reject-payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        proofId,
        adminNotes: 'Automated test rejection'
      })
    });

    if (response.ok) {
      const data = await response.json();
      log('✅ Payment rejected successfully');
      return data;
    } else {
      const data = await response.json();
      throw new Error(`Payment rejection failed: ${data.error || 'API endpoint not found'}`);
    }
  } catch (error) {
    log(`❌ Payment rejection failed: ${error.message}`, 'ERROR');
    return null;
  }
}

async function verifyPlanPricing() {
  log('Verifying subscription plan pricing...');
  
  const expectedPrices = {
    BASIC: 4000,
    PRO: 7000,
    ENTERPRISE: 10000
  };

  try {
    const response = await makeRequest(`${TEST_CONFIG.baseURL}/subscription`);
    
    if (response.ok) {
      // Parse the HTML page to extract plan prices
      const html = await response.text();
      const prices = {};
      
      // Look for price patterns in the HTML
      const priceRegex = /₹[\d,]+/g;
      const foundPrices = html.match(priceRegex) || [];
      
      log(`Found prices in page: ${foundPrices.join(', ')}`);
      
      // This is a simplified check - in real implementation, we'd parse the page more carefully
      testResults.plan_upgrade_verification.status = 'PARTIAL';
      testResults.plan_upgrade_verification.reason = 'Pricing verification requires frontend analysis';
      testResults.plan_upgrade_verification.details = {
        foundPrices,
        expectedPrices
      };
      
      return true;
    } else {
      throw new Error('Failed to load subscription page');
    }
  } catch (error) {
    log(`❌ Plan pricing verification failed: ${error.message}`, 'ERROR');
    testResults.plan_upgrade_verification.reason = `Error verifying pricing: ${error.message}`;
    return false;
  }
}

async function checkNotifications() {
  log('Checking notification system...');
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseURL}/api/notifications`);
    
    if (response.ok) {
      const data = await response.json();
      log(`✅ Notification system accessible, found notifications`);
      testResults.notification_status.status = 'PASS';
      testResults.notification_status.reason = 'Notification system is functional';
      return true;
    } else {
      testResults.notification_status.reason = 'Notification system returned error';
      return false;
    }
  } catch (error) {
    log(`❌ Notification check failed: ${error.message}`, 'ERROR');
    testResults.notification_status.reason = `Error checking notifications: ${error.message}`;
    return false;
  }
}

// Main test execution
async function runTests() {
  log('🚀 Starting Comprehensive Subscription System QA Test');
  
  try {
    // Test 1: Client Trial Flow
    log('\n=== TEST 1: CLIENT TRIAL FLOW ===');
    const clientData = await createTestClient();
    const loginData = await clientLogin(TEST_CONFIG.testClient.email, TEST_CONFIG.testClient.password);
    await checkTrialStatus(clientData.user?.id || loginData.userId);
    
    // Test 2: Subscription Purchase Submission
    log('\n=== TEST 2: SUBSCRIPTION PURCHASE SUBMISSION ===');
    const testPlan = 'BASIC';
    const testAmount = TEST_CONFIG.testPlans.BASIC.price;
    const testTransactionId = `TEST_${Date.now()}`;
    
    try {
      const paymentData = await submitPaymentRequest(
        loginData.token, 
        testPlan, 
        testAmount, 
        testTransactionId
      );
      testResults.payment_submission.status = 'PASS';
      testResults.payment_submission.reason = `Successfully submitted payment request for ${testPlan} plan`;
      testResults.payment_submission.details = {
        plan: testPlan,
        amount: testAmount,
        transactionId: testTransactionId,
        paymentProofId: paymentData.paymentProof?.id
      };
    } catch (error) {
      testResults.payment_submission.reason = `Payment submission failed: ${error.message}`;
    }
    
    // Test 3: Admin Approval Panel
    log('\n=== TEST 3: ADMIN APPROVAL PANEL ===');
    const adminData = await adminLogin();
    const paymentProofs = await checkPaymentProofs(adminData.token);
    
    if (paymentProofs.length > 0) {
      log(`✅ Admin can see ${paymentProofs.length} payment requests`);
      
      // Test approval process
      const pendingProof = paymentProofs.find(p => p.status === 'pending');
      if (pendingProof) {
        const approvalResult = await approvePayment(adminData.token, pendingProof.id);
        if (approvalResult) {
          testResults.admin_approval.status = 'PASS';
          testResults.admin_approval.reason = 'Successfully approved payment request';
          testResults.admin_approval.details = {
            approvedProofId: pendingProof.id,
            plan: pendingProof.plan
          };
        }
      } else {
        testResults.admin_approval.reason = 'No pending payment proofs found to approve';
      }
    } else {
      testResults.admin_approval.reason = 'No payment proofs found in admin panel';
    }
    
    // Test 4: Notification System
    log('\n=== TEST 4: NOTIFICATION SYSTEM ===');
    await checkNotifications();
    
    // Test 5: Plan Pricing Verification
    log('\n=== TEST 5: PLAN PRICING VERIFICATION ===');
    await verifyPlanPricing();
    
    // Final assessment
    testResults.final_client_state_correct = 
      testResults.trial_flow.status === 'PASS' &&
      testResults.payment_submission.status === 'PASS' &&
      testResults.admin_approval.status === 'PASS';
    
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
    recommendations.push('Fix trial assignment system to ensure 15-day trial for new clients');
  }
  
  if (testResults.payment_submission.status !== 'PASS') {
    recommendations.push('Review payment submission API and form validation');
  }
  
  if (testResults.admin_approval.status !== 'PASS') {
    recommendations.push('Create missing approve/reject API endpoints for admin panel');
    recommendations.push('Implement proper payment approval workflow');
  }
  
  if (testResults.notification_status.status !== 'PASS') {
    recommendations.push('Implement notification system for admin and client alerts');
  }
  
  if (testResults.plan_upgrade_verification.status !== 'PASS') {
    recommendations.push('Update plan pricing to match requirements: BASIC=₹4000, PRO=₹7000, ENTERPRISE=₹10000');
  }
  
  testResults.recommendations = recommendations;
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