// Test Add Client with debugging enabled
const baseUrl = 'http://localhost:3000';

async function testWithDebugging() {
  console.log('🧪 Testing Add Client with Debugging\n');

  try {
    const testData = {
      name: 'Debug Test Society',
      adminName: 'Debug Test Admin',
      email: `debug-${Date.now()}@example.com`,
      phone: '+91 9876543210',
      address: '123 Debug Street',
      plan: 'BASIC'
    };

    console.log('1. Sending test data:', testData);

    const response = await fetch(`${baseUrl}/api/admin/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    console.log('2. Response status:', response.status);
    console.log('3. Response headers:', response.headers);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success response:', result);
    } else {
      const error = await response.json();
      console.log('❌ Error response:', error);
    }

    console.log('\n🎯 Debug test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWithDebugging();