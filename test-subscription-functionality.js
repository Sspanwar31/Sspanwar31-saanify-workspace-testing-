// Test script to verify subscription page functionality
// Run this in browser console or as part of your test suite

console.log('🧪 Testing Subscription Page Functionality')

// Test 1: Payment Mode Detection
console.log('\n📋 Test 1: Payment Mode Detection')
async function testPaymentMode() {
  try {
    const response = await fetch('/api/admin/payment-mode')
    const data = await response.json()
    console.log('✅ Payment mode API response:', data)
    
    const mode = data.mode
    if (['MANUAL', 'RAZORPAY'].includes(mode)) {
      console.log(`✅ Valid payment mode: ${mode}`)
    } else {
      console.log('⚠️ Invalid or missing payment mode')
    }
  } catch (error) {
    console.error('❌ Payment mode test failed:', error)
  }
}

// Test 2: Razorpay Order Creation
console.log('\n💳 Test 2: Razorpay Order Creation')
async function testRazorpayOrder() {
  try {
    const response = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId: 'basic',
        amount: 4000,
        currency: 'INR',
        receipt: 'test_receipt_123'
      }),
    })
    
    const data = await response.json()
    if (response.ok) {
      console.log('✅ Razorpay order created:', data.order.id)
      console.log('✅ Order details:', {
        amount: data.order.amount,
        currency: data.order.currency,
        status: data.order.status
      })
    } else {
      console.log('❌ Order creation failed:', data.error)
    }
  } catch (error) {
    console.error('❌ Razorpay test failed:', error)
  }
}

// Test 3: Environment Variable Access
console.log('\n🌍 Test 3: Environment Variable Access')
function testEnvironmentVariable() {
  // This should be available on both client and server
  const envMode = process.env.NEXT_PUBLIC_PAYMENT_MODE
  console.log('Environment payment mode:', envMode || 'Not set')
  
  // Test client-side fallback
  if (typeof window !== 'undefined') {
    const storedMode = localStorage.getItem('payment-mode')
    console.log('Stored payment mode:', storedMode || 'Not stored')
  }
}

// Test 4: Trial Status Calculation
console.log('\n📅 Test 4: Trial Status Calculation')
function testTrialStatus() {
  const testCases = [
    { trialEndsAt: '2025-12-13', now: new Date('2025-11-29') },
    { trialEndsAt: '2025-12-13', now: new Date('2025-12-14') },
    { trialEndsAt: '2025-11-01', now: new Date('2025-11-29') }
  ]
  
  testCases.forEach((testCase, index) => {
    const trialEnd = new Date(testCase.trialEndsAt)
    const diffTime = trialEnd.getTime() - testCase.now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    const status = {
      isValid: diffDays > 0,
      daysRemaining: diffDays > 0 ? diffDays : null,
      isExpired: diffDays <= 0
    }
    
    console.log(`Test case ${index + 1}:`, {
      trialEndsAt: testCase.trialEndsAt,
      now: testCase.now.toISOString().split('T')[0],
      daysRemaining: status.daysRemaining,
      isValid: status.isValid,
      isExpired: status.isExpired
    })
  })
}

// Test 5: UI State Management
console.log('\n🎨 Test 5: UI State Management')
function testUIStates() {
  console.log('Testing different payment mode states:')
  
  const states = [
    { mode: null, description: 'No payment mode configured' },
    { mode: 'MANUAL', description: 'Manual payment mode' },
    { mode: 'RAZORPAY', description: 'Razorpay payment mode' }
  ]
  
  states.forEach(state => {
    console.log(`- ${state.description}:`, {
      paymentMode: state.mode,
      buttonsEnabled: state.mode !== null,
      ctaText: state.mode === 'MANUAL' ? 'Upload Payment Proof' : 
              state.mode === 'RAZORPAY' ? 'Pay Now' : 
              'Payment Disabled'
    })
  })
}

// Run all tests
async function runAllTests() {
  await testPaymentMode()
  await testRazorpayOrder()
  testEnvironmentVariable()
  testTrialStatus()
  testUIStates()
  
  console.log('\n🎉 All tests completed!')
  console.log('\n📝️ Manual Testing Checklist:')
  console.log('□ Visit /subscription page')
  console.log('□ Verify payment mode alert displays correctly')
  console.log('□ Try selecting different plans')
  console.log('□ Test trial status alert (if logged in as client)')
  console.log('□ Toggle between monthly/yearly billing')
  console.log('□ Test admin payment mode toggle at /admin/dashboard')
  console.log('□ Verify disabled state when no payment mode configured')
  console.log('□ Test manual flow (redirect to payment-upload)')
  console.log('□ Test Razorpay flow (create order API call)')
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testPaymentMode,
    testRazorpayOrder,
    testEnvironmentVariable,
    testTrialStatus,
    testUIStates,
    runAllTests
  }
}

// Run tests if in browser
if (typeof window !== 'undefined') {
  // Add a small delay to ensure page is loaded
  setTimeout(runAllTests, 1000)
}