/**
 * Test API calls with updated URLs
 */

async function testAPIs() {
  console.log('🧪 Testing API calls with updated URLs...');
  
  try {
    // Test passbook entries API
    console.log('📋 Testing passbook entries API...');
    const passbookResponse = await fetch(`${window.location.origin}/api/client/passbook?memberId=c1ed2236-5ed7-45b6-a9ca-1371e629b1cb`);
    
    if (passbookResponse.ok) {
      const data = await passbookResponse.json();
      console.log('✅ Passbook API working! Entries:', data.entries?.length || 0);
    } else {
      console.log('❌ Passbook API failed:', passbookResponse.status);
    }

    // Test members API
    console.log('👥 Testing members API...');
    const membersResponse = await fetch(`${window.location.origin}/api/client/members`);
    
    if (membersResponse.ok) {
      const data = await membersResponse.json();
      console.log('✅ Members API working! Members:', data.members?.length || 0);
    } else {
      console.log('❌ Members API failed:', membersResponse.status);
    }

    // Test passbook create API
    console.log('📝 Testing passbook create API...');
    const createResponse = await fetch(`${window.location.origin}/api/client/passbook/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberId: 'c1ed2236-5ed7-45b6-a9ca-1371e629b1cb',
        date: '2025-12-07',
        deposit: 1000,
        installment: 0,
        interest: 0,
        fine: 0,
        mode: 'TEST',
        note: 'Test API call with correct URL'
      })
    });

    if (createResponse.ok) {
      const data = await createResponse.json();
      console.log('✅ Create API working!', data.message);
    } else {
      console.log('❌ Create API failed:', createResponse.status);
      const error = await createResponse.json();
      console.log('Error details:', error);
    }

  } catch (error) {
    console.error('🚨 API test failed:', error);
  }
}

// Run the test
testAPIs();