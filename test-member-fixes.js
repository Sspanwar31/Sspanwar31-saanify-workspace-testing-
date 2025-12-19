#!/usr/bin/env node

// Test script to verify member creation and deletion fixes
const fs = require('fs');

async function testMemberFixes() {
  console.log('🧪 [TEST] Starting member creation and deletion fixes test...\n');

  try {
    // Test 1: Check duplicate phone prevention
    console.log('📋 [TEST 1] Testing duplicate phone number prevention...');
    
    const testPhone = '9999999999'; // Unique test phone number
    
    // Create first member
    const create1Response = await fetch('http://localhost:3000/api/client/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Member 1',
        phone: testPhone,
        address: 'Test Address 1',
        joinDate: new Date().toISOString().split('T')[0]
      })
    });

    const create1Data = await create1Response.json();
    
    if (create1Response.ok) {
      console.log('✅ [TEST 1] First member created successfully:', create1Data.member.id);
    } else {
      console.error('❌ [TEST 1] Failed to create first member:', create1Data.error);
      return;
    }

    // Try to create second member with same phone
    const create2Response = await fetch('http://localhost:3000/api/client/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Member 2',
        phone: testPhone, // Same phone number
        address: 'Test Address 2',
        joinDate: new Date().toISOString().split('T')[0]
      })
    });

    const create2Data = await create2Response.json();
    
    if (create2Response.status === 409) {
      console.log('✅ [TEST 1] Duplicate phone prevention working! Error:', create2Data.error);
      console.log('   Existing Member ID:', create2Data.existingMemberId);
    } else {
      console.error('❌ [TEST 1] Duplicate phone prevention failed! Status:', create2Response.status);
      console.error('   Response:', create2Data);
    }

    // Test 2: Member deletion
    console.log('\n🗑️ [TEST 2] Testing member deletion...');
    
    if (create1Data.member) {
      const memberId = create1Data.member.id;
      console.log(`🎯 [TEST 2] Attempting to delete member: ${create1Data.member.name} (${memberId})`);

      const deleteResponse = await fetch(`http://localhost:3000/api/client/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const deleteData = await deleteResponse.json();
      console.log(`📡 [TEST 2] Response status: ${deleteResponse.status}`);
      console.log(`📡 [TEST 2] Response data:`, deleteData);

      if (deleteResponse.ok) {
        console.log('✅ [TEST 2] Member deletion successful!');
        console.log(`   Deleted ID: ${deleteData.deletedMemberId}`);
        console.log(`   Deleted Name: ${deleteData.deletedMemberName}`);
        console.log(`   Deleted counts:`, deleteData.deletedCounts);
      } else {
        console.error('❌ [TEST 2] Member deletion failed:', deleteData.error);
        if (deleteData.details) {
          console.error('   Details:', deleteData.details);
        }
      }

      // Test 3: Verify member is actually deleted
      console.log('\n🔍 [TEST 3] Verifying member is actually deleted...');
      const verifyResponse = await fetch('http://localhost:3000/api/client/members');
      const verifyData = await verifyResponse.json();
      const remainingMembers = verifyData.members || [];
      
      const deletedMemberExists = remainingMembers.some(m => m.id === memberId);
      if (deletedMemberExists) {
        console.error('❌ [TEST 3] Member still exists in database after deletion!');
        console.error('   Member ID that should be deleted:', memberId);
      } else {
        console.log('✅ [TEST 3] Member successfully removed from database');
      }

      console.log(`\n📊 [TEST 3] Final member count: ${remainingMembers.length}`);

      // Test 4: Try to delete already deleted member
      console.log('\n🔄 [TEST 4] Testing deletion of already deleted member...');
      const deleteAgainResponse = await fetch(`http://localhost:3000/api/client/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const deleteAgainData = await deleteAgainResponse.json();
      
      if (deleteAgainResponse.status === 404) {
        console.log('✅ [TEST 4] Correctly handled deletion of non-existent member');
        console.log('   Error:', deleteAgainData.error);
      } else {
        console.error('❌ [TEST 4] Unexpected response for deleting non-existent member');
        console.error('   Status:', deleteAgainResponse.status);
        console.error('   Response:', deleteAgainData);
      }

    } else {
      console.error('❌ [TEST 2] No member created to test deletion');
    }

    console.log('\n🎯 [TEST] All tests completed!');

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
  console.log('🚀 [TEST] Member Creation & Deletion Fixes Test\n');

  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('❌ [TEST] Server is not running on http://localhost:3000');
    console.log('💡 [TEST] Please start the server with: npm run dev');
    process.exit(1);
  }

  console.log('✅ [TEST] Server is running\n');
  await testMemberFixes();
  
  console.log('\n📝 [TEST] Summary:');
  console.log('   ✅ Duplicate phone prevention: Tested');
  console.log('   ✅ Member deletion: Tested');
  console.log('   ✅ Deletion verification: Tested');
  console.log('   ✅ Edge cases: Tested');
  console.log('\n🎯 [TEST] To test manually:');
  console.log('   1. Go to http://localhost:3000/login');
  console.log('   2. Login with client credentials');
  console.log('   3. Navigate to Members section');
  console.log('   4. Try to add members with same phone number');
  console.log('   5. Try to delete members and verify they are removed');
}

main().catch(console.error);