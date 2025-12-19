#!/usr/bin/env node

/**
 * Comprehensive Subscription System QA Test
 * Tests all aspects of the subscription workflow with proper authentication
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
    PRO: { price: 7000, expectedPrice: 7000 },
    ENTERPRISE: { price: 10000, expectedPrice: 10000 }
  }
};

// Test results storage
const testResults = {
  auth_status: { status: 'FAIL', reason: '', details: {} },
  trial_workflow: { status: 'FAIL', reason: '', details: {} },
  payment_flow: { status: 'FAIL', reason: '', details: {} },
  admin_approval_result: { status: 'FAIL', reason: '', details: {} },
  notification_system: { status: 'FAIL', reason: '', details: {} },
  trial_expiry_simulated: { status: 'FAIL', reason: '', details: {} },
  upgrade_flow_after_trial: { status: 'FAIL', reason: '', details: {} },
  bugs_found: [],
  critical_blockers: [],
  production_readiness_percent: 0
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
        password: TEST_CONFIG.testClient.password
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

async function checkTrialStatus(userData) {
  log('Checking trial status for new client...');
  
  try {
    // The signup response should contain trial information
    if (userData.user && userData.user.trialEndsAt) {
      const trialEndsAt = new Date(userData.user.trialEndsAt);
      const createdAt = new Date(userData.user.createdAt);
      const trialDays = Math.ceil((trialEndsAt - createdAt) / (1000 * 60 * 60 * 24));
      
      log(`✅ Trial period found: ${trialDays} days`);
      
      if (trialDays >= 15) {
        testResults.trial_workflow.status = 'PASS';
        testResults.trial_workflow.reason = `Client correctly assigned ${trialDays}-day trial`;
        testResults.trial_workflow.details = {
          trialEndsAt: userData.user.trialEndsAt,
          createdAt: userData.user.createdAt,
          trialDays
        };
        return true;
      } else {
        testResults.trial_workflow.reason = `Expected 15-day trial, got ${trialDays} days`;
        return false;
      }
    } else {
      testResults.trial_workflow.reason = 'No trial dates found in user record';
      return false;
    }
  } catch (error) {
    log(`❌ Trial status check failed: ${error.message}`, 'ERROR');
    testResults.trial_workflow.reason = `Error checking trial status: ${error.message}`;
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
        'Cookie': `auth-token=${userToken}`
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

async function checkPaymentProofs(adminToken) {
  log('Checking payment proofs for admin approval...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseURL}/api/admin/subscriptions/payment-proofs`, {
      headers: {
        'Cookie': `auth-token=${adminToken}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      log(`✅ Found ${data.proofs?.length || 0} payment proofs`);
      return data.proofs || [];
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
    const response = await fetch(`${TEST_CONFIG.baseURL}/api/admin/subscriptions/approve-payment`, {
      method: 'POST',
      headers: {
        'Cookie': `auth-token=${adminToken}`,
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
    throw error;
  }
}

async function rejectPayment(adminToken, proofId) {
  log(`Rejecting payment proof: ${proofId}`);
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseURL}/api/admin/subscriptions/reject-payment`, {
      method: 'POST',
      headers: {
        'Cookie': `auth-token=${adminToken}`,
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
    throw error;
  }
}

async function checkNotifications(userToken) {
  log('Checking notification system...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseURL}/api/notifications`, {
      headers: {
        'Cookie': `auth-token=${userToken}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      log(`✅ Notification system accessible, found ${data.notifications?.length || 0} notifications`);
      testResults.notification_system.status = 'PASS';
      testResults.notification_system.reason = 'Notification system is functional';
      return true;
    } else {
      testResults.notification_system.reason = 'Notification system returned error';
      return false;
    }
  } catch (error) {
    log(`❌ Notification check failed: ${error.message}`, 'ERROR');
    testResults.notification_system.reason = `Error checking notifications: ${error.message}`;
    return false;
  }
}

async function simulateTrialExpiry(clientData) {
  log('Simulating trial expiry by updating database...');
  
  try {
    // This would typically require direct database access or a special API endpoint
    // For now, we'll check if the system can handle expired trials
    if (clientData.user && clientData.user.trialEndsAt) {
      const trialEndDate = new Date(clientData.user.trialEndsAt);
      const now = new Date();
      
      // Simulate expired trial
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      log(`Trial end date: ${trialEndDate.toISOString()}`);
      log(`Current date: ${now.toISOString()}`);
      log(`Simulated expiry: ${yesterday.toISOString()}`);
      
      testResults.trial_expiry_simulated.status = 'PARTIAL';
      testResults.trial_expiry_simulated.reason = 'Trial expiry simulation requires database access';
      testResults.trial_expiry_simulated.details = {
        trialEndsAt: clientData.user.trialEndsAt,
        simulatedExpiryDate: yesterday.toISOString()
      };
      
      return true;
    } else {
      testResults.trial_expiry_simulated.reason = 'No trial period found to expire';
      return false;
    }
  } catch (error) {
    log(`❌ Trial expiry simulation failed: ${error.message}`, 'ERROR');
    testResults.trial_expiry_simulated.reason = `Error simulating trial expiry: ${error.message}`;
    return false;
  }
}

// Main test execution
async function runTests() {
  log('🚀 Starting Comprehensive Subscription System QA Test');
  
  try {
    // Test 1: Authentication Test
    log('\n=== TEST 1: AUTHENTICATION SYSTEM ===');
    const clientData = await createTestClient();
    const loginData = await clientLogin(TEST_CONFIG.testClient.email, TEST_CONFIG.testClient.password);
    const adminData = await adminLogin();
    
    if (clientData.user && loginData.token && adminData.token) {
      testResults.auth_status.status = 'PASS';
      testResults.auth_status.reason = 'Authentication system working for both client and admin';
      testResults.auth_status.details = {
        clientCreated: true,
        clientLogin: true,
        adminLogin: true,
        clientToken: !!loginData.token,
        adminToken: !!adminData.token
      };
    } else {
      testResults.auth_status.reason = 'Authentication system has issues';
    }
    
    // Test 2: Trial Workflow
    log('\n=== TEST 2: TRIAL WORKFLOW ===');
    await checkTrialStatus(clientData);
    
    // Test 3: Payment Flow
    log('\n=== TEST 3: PAYMENT FLOW ===');
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
      testResults.payment_flow.status = 'PASS';
      testResults.payment_flow.reason = `Successfully submitted payment request for ${testPlan} plan`;
      testResults.payment_flow.details = {
        plan: testPlan,
        amount: testAmount,
        transactionId: testTransactionId,
        paymentProofId: paymentData.paymentProof?.id
      };
    } catch (error) {
      testResults.payment_flow.reason = `Payment submission failed: ${error.message}`;
      testResults.bugs_found.push(`Payment submission error: ${error.message}`);
    }
    
    // Test 4: Admin Approval
    log('\n=== TEST 4: ADMIN APPROVAL SYSTEM ===');
    try {
      const paymentProofs = await checkPaymentProofs(adminData.token);
      
      if (paymentProofs.length > 0) {
        log(`✅ Admin can see ${paymentProofs.length} payment requests`);
        
        // Test approval process
        const pendingProof = paymentProofs.find(p => p.status === 'pending');
        if (pendingProof) {
          const approvalResult = await approvePayment(adminData.token, pendingProof.id);
          if (approvalResult) {
            testResults.admin_approval_result.status = 'PASS';
            testResults.admin_approval_result.reason = 'Successfully approved payment request';
            testResults.admin_approval_result.details = {
              approvedProofId: pendingProof.id,
              plan: pendingProof.plan
            };
          }
        } else {
          testResults.admin_approval_result.reason = 'No pending payment proofs found to approve';
        }
        
        // Test rejection process if there are multiple proofs
        const anotherPendingProof = paymentProofs.find(p => p.status === 'pending' && p.id !== pendingProof?.id);
        if (anotherPendingProof) {
          await rejectPayment(adminData.token, anotherPendingProof.id);
          log('✅ Payment rejection test completed');
        }
      } else {
        testResults.admin_approval_result.reason = 'No payment proofs found in admin panel';
        testResults.critical_blockers.push('Admin cannot see submitted payment proofs');
      }
    } catch (error) {
      testResults.admin_approval_result.reason = `Admin approval system failed: ${error.message}`;
      testResults.critical_blockers.push(`Admin approval error: ${error.message}`);
    }
    
    // Test 5: Notification System
    log('\n=== TEST 5: NOTIFICATION SYSTEM ===');
    await checkNotifications(loginData.token);
    
    // Test 6: Trial Expiry Simulation
    log('\n=== TEST 6: TRIAL EXPIRY SIMULATION ===');
    await simulateTrialExpiry(clientData);
    
    // Test 7: Upgrade Flow After Trial
    log('\n=== TEST 7: UPGRADE FLOW AFTER TRIAL ===');
    // This would typically involve waiting for trial to expire and then testing upgrade
    testResults.upgrade_flow_after_trial.status = 'PARTIAL';
    testResults.upgrade_flow_after_trial.reason = 'Upgrade flow requires actual trial expiry';
    
    // Calculate production readiness
    const passedTests = [
      testResults.auth_status.status,
      testResults.trial_workflow.status,
      testResults.payment_flow.status,
      testResults.admin_approval_result.status,
      testResults.notification_system.status
    ].filter(status => status === 'PASS').length;
    
    const totalTests = 5;
    testResults.production_readiness_percent = Math.round((passedTests / totalTests) * 100);
    
  } catch (error) {
    log(`❌ Test execution failed: ${error.message}`, 'ERROR');
    testResults.bugs_found.push(`Test execution error: ${error.message}`);
  }
  
  // Output results
  outputResults();
}

function outputResults() {
  log('\n' + '='.repeat(80));
  log('🏁 SUBSCRIPTION SYSTEM QA TEST RESULTS');
  log('='.repeat(80));
  
  const finalResults = {
    auth_status: `${testResults.auth_status.status} - ${testResults.auth_status.reason}`,
    trial_workflow: `${testResults.trial_workflow.status} - ${testResults.trial_workflow.reason}`,
    payment_flow: `${testResults.payment_flow.status} - ${testResults.payment_flow.reason}`,
    admin_approval_result: `${testResults.admin_approval_result.status} - ${testResults.admin_approval_result.reason}`,
    notification_system: `${testResults.notification_system.status} - ${testResults.notification_system.reason}`,
    trial_expiry_simulated: `${testResults.trial_expiry_simulated.status} - ${testResults.trial_expiry_simulated.reason}`,
    upgrade_flow_after_trial: `${testResults.upgrade_flow_after_trial.status} - ${testResults.upgrade_flow_after_trial.reason}`,
    bugs_found: testResults.bugs_found,
    critical_blockers: testResults.critical_blockers,
    production_readiness_percent: `${testResults.production_readiness_percent}%`
  };
  
  console.log(JSON.stringify(finalResults, null, 2));
  
  log('\n📋 SUMMARY:');
  log(`Authentication: ${testResults.auth_status.status}`);
  log(`Trial Workflow: ${testResults.trial_workflow.status}`);
  log(`Payment Flow: ${testResults.payment_flow.status}`);
  log(`Admin Approval: ${testResults.admin_approval_result.status}`);
  log(`Notification System: ${testResults.notification_system.status}`);
  log(`Trial Expiry: ${testResults.trial_expiry_simulated.status}`);
  log(`Upgrade Flow: ${testResults.upgrade_flow_after_trial.status}`);
  log(`Production Readiness: ${testResults.production_readiness_percent}%`);
  
  if (testResults.critical_blockers.length > 0) {
    log('\n🚨 CRITICAL BLOCKERS:');
    testResults.critical_blockers.forEach((blocker, index) => {
      log(`${index + 1}. ${blocker}`);
    });
  }
  
  if (testResults.bugs_found.length > 0) {
    log('\n🐛 BUGS FOUND:');
    testResults.bugs_found.forEach((bug, index) => {
      log(`${index + 1}. ${bug}`);
    });
  }
  
  log('\n' + '='.repeat(80));
}

// Run the tests
runTests().catch(error => {
  log(`❌ QA test failed to run: ${error.message}`, 'ERROR');
  process.exit(1);
});