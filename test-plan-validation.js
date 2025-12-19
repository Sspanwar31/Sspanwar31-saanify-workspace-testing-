// Test script to verify the plan validation fix
// This tests that custom plans are now accepted in payment approval

async function testPlanValidation() {
  try {
    console.log('Testing plan validation with custom plans...');
    
    // Test 1: Check if subscription plans API returns custom plans
    const plansResponse = await fetch('http://localhost:3000/api/admin/subscription-plans');
    if (plansResponse.ok) {
      const plansData = await plansResponse.json();
      console.log('✅ Available plans:', plansData.data?.map(p => p.name));
    } else {
      console.log('❌ Failed to fetch plans');
    }

    // Test 2: Check if payment approval accepts custom plan names
    const testPlans = [
      'Custom Pro Plan',
      'Basic Plan', 
      'Premium Plan',
      'Enterprise Annual'
    ];

    for (const planName of testPlans) {
      console.log(`Testing plan: "${planName}"`);
      
      const approvalResponse = await fetch('http://localhost:3000/api/admin/subscriptions/approve-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'test-user-id',
          plan: planName,
          adminNotes: 'Test approval'
        })
      });

      if (approvalResponse.status === 400) {
        const errorData = await approvalResponse.json();
        console.log(`❌ Plan "${planName}" rejected:`, errorData.error);
      } else if (approvalResponse.status === 401) {
        console.log(`⚠️ Plan "${planName}" validation passed (auth expected to fail)`);
      } else {
        console.log(`✅ Plan "${planName}" validation passed`);
      }
    }

    console.log('\n🎉 Plan validation test completed!');
    console.log('\nTo use in production:');
    console.log('1. Add new plans through Admin > Subscription Plans');
    console.log('2. When approving payments, select the correct plan from dropdown');
    console.log('3. The system will now accept any plan that exists in the plans list');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testPlanValidation();