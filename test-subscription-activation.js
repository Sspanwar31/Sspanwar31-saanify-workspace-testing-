// Test script to verify subscription activation functionality
async function testSubscriptionActivation() {
  console.log('🧪 Testing Subscription Activation...');
  
  try {
    // Test 1: Fetch subscription plans
    console.log('\n1️⃣ Testing subscription plans API...');
    const plansResponse = await fetch('http://localhost:3000/api/admin/subscription-plans');
    const plansData = await plansResponse.json();
    console.log('✅ Subscription Plans:', plansData.success ? 'SUCCESS' : 'FAILED');
    if (plansData.success) {
      console.log('   Available plans:', plansData.data.map(p => `${p.name} (${p.id})`).join(', '));
    }

    // Test 2: Fetch clients
    console.log('\n2️⃣ Testing clients API...');
    const clientsResponse = await fetch('http://localhost:3000/api/admin/clients');
    const clientsData = await clientsResponse.json();
    console.log('✅ Clients:', clientsData.success ? 'SUCCESS' : 'FAILED');
    if (clientsData.success) {
      console.log('   Available clients:', clientsData.clients.map(c => `${c.name} (${c.id})`).join(', '));
    }

    // Test 3: Test subscription activation (if we have clients and plans)
    if (plansData.success && clientsData.success && plansData.data.length > 0 && clientsData.clients.length > 0) {
      console.log('\n3️⃣ Testing subscription activation...');
      
      const testClient = clientsData.clients[0];
      const testPlan = plansData.data[0];
      
      console.log(`   Using client: ${testClient.name} (${testClient.id})`);
      console.log(`   Using plan: ${testPlan.name} (${testPlan.id})`);
      
      const activationResponse = await fetch('http://localhost:3000/api/admin/client-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: testClient.id,
          planId: testPlan.id,
          startDate: new Date().toISOString().split('T')[0],
          societyName: testClient.name,
          customAmount: ""
        }),
      });

      const activationData = await activationResponse.json();
      console.log('✅ Subscription Activation:', activationData.success ? 'SUCCESS' : 'FAILED');
      if (activationData.success) {
        console.log('   Created subscription:', {
          client: activationData.data.clientName,
          plan: activationData.data.planName,
          startDate: activationData.data.startDate,
          endDate: activationData.data.endDate,
          status: activationData.data.status
        });
      } else {
        console.log('   Error:', activationData.error);
      }
    } else {
      console.log('\n3️⃣ ⚠️  Skipping subscription activation test - no clients or plans available');
    }

    // Test 4: Fetch client subscriptions
    console.log('\n4️⃣ Testing client subscriptions API...');
    const subscriptionsResponse = await fetch('http://localhost:3000/api/admin/client-subscriptions');
    const subscriptionsData = await subscriptionsResponse.json();
    console.log('✅ Client Subscriptions:', subscriptionsData.success ? 'SUCCESS' : 'FAILED');
    if (subscriptionsData.success) {
      console.log('   Total subscriptions:', subscriptionsData.data.length);
      subscriptionsData.data.forEach((sub, index) => {
        console.log(`   ${index + 1}. ${sub.clientName} - ${sub.planName} (${sub.status})`);
      });
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSubscriptionActivation();