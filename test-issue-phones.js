#!/usr/bin/env node

// Test script to create members with the exact phone numbers from the issue
async function testIssuePhones() {
  console.log('🔍 [TEST] Testing phone numbers from the issue...\n');

  try {
    const issuePhones = [
      { phone: '9782210804', name: 'Test Anjali Duplicate' },
      { phone: '9782556644', name: 'Test Ram Duplicate' }
    ];

    for (const { phone, name } of issuePhones) {
      console.log(`\n📱 [TEST] Testing phone: ${phone}`);
      
      // Try to create member with this phone
      const createResponse = await fetch('http://localhost:3000/api/client/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          phone: phone,
          address: 'Test Address',
          joinDate: new Date().toISOString().split('T')[0]
        })
      });

      const createData = await createResponse.json();
      
      if (createResponse.status === 409) {
        console.log('✅ [TEST] Duplicate prevention working!');
        console.log('   Error:', createData.error);
        console.log('   Existing Member ID:', createData.existingMemberId);
      } else if (createResponse.ok) {
        console.log('✅ [TEST] Member created successfully (no existing duplicate)');
        console.log('   New Member ID:', createData.member.id);
        
        // Now try to create another one with same phone to test prevention
        console.log('🔄 [TEST] Testing duplicate prevention with same phone...');
        
        const duplicateResponse = await fetch('http://localhost:3000/api/client/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name + ' DUPLICATE',
            phone: phone,
            address: 'Test Address 2',
            joinDate: new Date().toISOString().split('T')[0]
          })
        });

        const duplicateData = await duplicateResponse.json();
        
        if (duplicateResponse.status === 409) {
          console.log('✅ [TEST] Duplicate prevention working for second attempt!');
          console.log('   Error:', duplicateData.error);
          console.log('   Existing Member ID:', duplicateData.existingMemberId);
        } else {
          console.error('❌ [TEST] Duplicate prevention failed for second attempt!');
          console.error('   Status:', duplicateResponse.status);
          console.error('   Response:', duplicateData);
        }
        
        // Clean up - delete the test member
        if (createData.member) {
          console.log('🧹 [TEST] Cleaning up test member...');
          const deleteResponse = await fetch(`http://localhost:3000/api/client/members/${createData.member.id}`, {
            method: 'DELETE'
          });
          
          if (deleteResponse.ok) {
            console.log('✅ [TEST] Test member cleaned up successfully');
          } else {
            console.error('❌ [TEST] Failed to clean up test member');
          }
        }
      } else {
        console.error('❌ [TEST] Unexpected response creating member');
        console.error('   Status:', createResponse.status);
        console.error('   Response:', createData);
      }
    }

    console.log('\n🎯 [TEST] Issue phone number testing completed!');

  } catch (error) {
    console.error('💥 [TEST] Test failed with error:', error);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🚀 [TEST] Issue Phone Numbers Test\n');

  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('❌ [TEST] Server is not running on http://localhost:3000');
    console.log('💡 [TEST] Please start the server with: npm run dev');
    process.exit(1);
  }

  console.log('✅ [TEST] Server is running\n');
  await testIssuePhones();
}

main().catch(console.error);