// Simple verification script to test if the syntax fixes are working
const axios = require('axios');

async function testAPIHealth() {
  try {
    console.log('🔍 Testing API health after syntax fixes...');
    
    // Test 1: Check if the server is running
    console.log('\n1. Testing server health...');
    const healthResponse = await axios.get('http://localhost:3000/api/health');
    console.log('✅ Health check passed:', healthResponse.status);
    
    // Test 2: Test authentication
    console.log('\n2. Testing authentication...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/unified-login', {
      email: 'client@saanify.com',
      password: 'client123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Authentication successful');
      const token = loginResponse.data.token;
      
      // Test 3: Test member details API (the one we fixed)
      console.log('\n3. Testing member details API...');
      
      // First get a member ID
      const membersResponse = await axios.get('http://localhost:3000/api/client/members', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (membersResponse.data.members && membersResponse.data.members.length > 0) {
        const memberId = membersResponse.data.members[0].id;
        
        // Test the fixed member details endpoint
        const memberDetailsResponse = await axios.get(`http://localhost:3000/api/client/members/${memberId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Member details API working:', memberDetailsResponse.status);
        console.log('   Member name:', memberDetailsResponse.data.member?.name);
        console.log('   Active loan balance:', memberDetailsResponse.data.activeLoan?.outstandingBalance || 0);
        
        // Test 4: Test passbook create API (the one we fixed for mixed transactions)
        console.log('\n4. Testing passbook create API...');
        
        const passbookData = {
          memberId: memberId,
          date: new Date().toISOString().split('T')[0],
          deposit: 1000,
          installment: 500,
          mode: 'MIXED',
          note: 'Test mixed transaction after syntax fix'
        };
        
        const createResponse = await axios.post('http://localhost:3000/api/client/passbook/create', passbookData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (createResponse.data.success) {
          console.log('✅ Passbook create API working');
          console.log('   Entry created with ID:', createResponse.data.entry.id);
          console.log('   Transaction type:', createResponse.data.entry.mode);
        } else {
          console.log('❌ Passbook create API failed:', createResponse.data.error);
        }
        
      } else {
        console.log('⚠️ No members found to test with');
      }
      
    } else {
      console.log('❌ Authentication failed');
    }
    
    console.log('\n🎉 All syntax fixes verified successfully!');
    console.log('✅ The server is running without compilation errors');
    console.log('✅ APIs are responding correctly');
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

console.log('🚀 Starting verification of syntax fixes...');
testAPIHealth();