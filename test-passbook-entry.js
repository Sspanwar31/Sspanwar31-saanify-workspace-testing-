/**
 * Test Passbook Entry Creation
 * This will help us debug the issue
 */

async function testPassbookEntry() {
  try {
    console.log('🧪 Testing passbook entry creation...');
    
    const testData = {
      memberId: 'c1ed2236-5ed7-45b6-a9ca-1371e629b1cb', // Rahul Sharma's ID from logs
      date: '2025-12-07',
      deposit: 5000,
      installment: 2000,
      interest: 90,
      fine: 0,
      mode: 'UPI',
      note: 'Test transaction - deposit + installment'
    };

    console.log('📤 Sending data:', testData);

    const response = await fetch('http://localhost:3000/api/client/passbook/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('📥 Response:', result);

    if (response.ok) {
      console.log('✅ Success! Entry created');
    } else {
      console.log('❌ Error:', result);
    }

  } catch (error) {
    console.error('🚨 Test failed:', error);
  }
}

// Run the test
testPassbookEntry();