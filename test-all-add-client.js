// Test all Add Client functionality
const baseUrl = 'http://localhost:3000';

async function testAllAddClientOptions() {
  console.log('🧪 Testing All Add Client Options\n');

  try {
    // 1. Test overview Add New Client button
    console.log('1. Testing overview Add New Client button...');
    const overviewButtonTest = await fetch(`${baseUrl}/api/admin/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Overview Test Society',
        adminName: 'Overview Test Admin',
        email: `overview-${Date.now()}@example.com`,
        phone: '+91 9876543210',
        address: '123 Overview Street',
        plan: 'BASIC'
      })
    });

    if (overviewButtonTest.ok) {
      const result = await overviewButtonTest.json();
      console.log('✅ Overview Add Client works:', result.message);
      console.log('New client ID:', result.client?.id);
    } else {
      console.log('❌ Overview Add Client failed:', overviewButtonTest.status);
      const error = await overviewButtonTest.json();
      console.log('Error:', error);
    }

    // 2. Test client management Add New Client button (if different)
    console.log('\n2. Testing client management Add New Client...');
    const clientMgmtButtonTest = await fetch(`${baseUrl}/api/admin/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Client Mgmt Test Society',
        adminName: 'Client Mgmt Test Admin',
        email: `clientmgmt-${Date.now()}@example.com`,
        phone: '+91 9876543210',
        address: '123 Client Mgmt Street',
        plan: 'PRO'
      })
    });

    if (clientMgmtButtonTest.ok) {
      const result = await clientMgmtButtonTest.json();
      console.log('✅ Client Management Add Client works:', result.message);
      console.log('New client ID:', result.client?.id);
    } else {
      console.log('❌ Client Management Add Client failed:', clientMgmtButtonTest.status);
      const error = await clientMgmtButtonTest.json();
      console.log('Error:', error);
    }

    // 3. Check if both clients appear in list
    console.log('\n3. Checking if both clients appear in list...');
    const listResponse = await fetch(`${baseUrl}/api/admin/clients`);
    
    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log(`✅ Found ${listData.clients?.length || 0} clients in list`);
      
      const overviewClient = listData.clients?.find(c => c.name?.includes('Overview Test'));
      const clientMgmtClient = listData.clients?.find(c => c.name?.includes('Client Mgmt Test'));
      
      if (overviewClient) {
        console.log('✅ Overview test client found in list');
      } else {
        console.log('❌ Overview test client NOT found in list');
      }
      
      if (clientMgmtClient) {
        console.log('✅ Client management test client found in list');
      } else {
        console.log('❌ Client management test client NOT found in list');
      }
    } else {
      console.log('❌ Failed to fetch client list');
    }

    console.log('\n🎉 All Add Client tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAllAddClientOptions();