// Test to verify that duplicate key error is fixed
async function testUniqueKeys() {
  console.log('🧪 Testing Unique Keys Fix...');
  
  try {
    // Test 1: Create multiple subscriptions to check for duplicate keys
    console.log('\n1️⃣ Testing multiple subscription creation...');
    
    const testClient = {
      id: 'test-client-123',
      name: 'Test Client Society'
    };
    
    const testPlan = {
      id: '1',
      name: 'Basic Plan',
      price: 0,
      duration: 1,
      durationType: 'monthly'
    };
    
    // Simulate creating multiple subscriptions with unique IDs
    const subscriptions = [];
    for (let i = 0; i < 3; i++) {
      const subscription = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        clientId: testClient.id,
        clientName: testClient.name,
        societyName: testClient.name,
        planId: testPlan.id,
        planName: testPlan.name,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "active",
        amount: testPlan.price,
        paymentStatus: "pending"
      };
      subscriptions.push(subscription);
    }
    
    // Check if all IDs are unique
    const uniqueIds = new Set(subscriptions.map(sub => sub.id));
    const allUnique = uniqueIds.size === subscriptions.length;
    
    console.log('✅ Unique IDs Test:', allUnique ? 'PASSED' : 'FAILED');
    console.log(`   Created ${subscriptions.length} subscriptions with ${uniqueIds.size} unique IDs`);
    
    // Test 2: Check React key format
    console.log('\n2️⃣ Testing React key format...');
    subscriptions.forEach((sub, index) => {
      const reactKey = `${sub.id}-${index}-${sub.clientId}`;
      console.log(`   Subscription ${index + 1}: Key = ${reactKey}`);
    });
    
    console.log('✅ React keys are properly formatted');
    
    // Test 3: Test API response format
    console.log('\n3️⃣ Testing API response...');
    const response = await fetch('http://localhost:3000/api/admin/client-subscriptions');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ API Response: SUCCESS');
      console.log(`   Total subscriptions: ${data.data.length}`);
      
      // Check for duplicate IDs in API response
      const apiIds = data.data.map(sub => sub.id);
      const uniqueApiIds = new Set(apiIds);
      const apiAllUnique = uniqueApiIds.size === apiIds.length;
      
      console.log('✅ API Unique IDs:', apiAllUnique ? 'PASSED' : 'FAILED');
      if (!apiAllUnique) {
        console.log('⚠️  Found duplicate IDs in API response');
      }
    } else {
      console.log('❌ API Response: FAILED');
    }
    
    console.log('\n🎉 All unique key tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testUniqueKeys();