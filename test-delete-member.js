#!/usr/bin/env node

// Test script to verify member deletion functionality
const fs = require('fs');

async function testMemberDelete() {
  console.log('🧪 [TEST] Starting member deletion test...\n');

  try {
    // 1. Get all members to find a test member
    console.log('📋 [TEST] Fetching all members...');
    const membersResponse = await fetch('http://localhost:3000/api/client/members');
    const membersData = await membersResponse.json();
    
    if (!membersResponse.ok) {
      console.error('❌ [TEST] Failed to fetch members:', membersData.error);
      return;
    }

    const members = membersData.members || [];
    console.log(`✅ [TEST] Found ${members.length} members`);

    if (members.length === 0) {
      console.log('⚠️ [TEST] No members found. Creating a test member first...');
      
      // Create a test member
      const createResponse = await fetch('http://localhost:3000/api/client/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Delete Member',
          phone: '1234567890',
          address: 'Test Address',
          joinDate: new Date().toISOString().split('T')[0]
        })
      });

      const createData = await createResponse.json();
      if (createResponse.ok) {
        console.log('✅ [TEST] Test member created:', createData.member.id);
        members.push(createData.member);
      } else {
        console.error('❌ [TEST] Failed to create test member:', createData.error);
        return;
      }
    }

    // 2. Test deleting the first member
    const testMember = members[0];
    console.log(`\n🎯 [TEST] Attempting to delete member: ${testMember.name} (${testMember.id})`);

    const deleteResponse = await fetch(`http://localhost:3000/api/client/members/${testMember.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    const deleteData = await deleteResponse.json();
    console.log(`📡 [TEST] Response status: ${deleteResponse.status}`);
    console.log(`📡 [TEST] Response data:`, deleteData);

    if (deleteResponse.ok) {
      console.log('✅ [TEST] Member deletion successful!');
      console.log(`   Deleted ID: ${deleteData.deletedId}`);
      console.log(`   Deleted Name: ${deleteData.deletedMember?.name}`);
    } else {
      console.error('❌ [TEST] Member deletion failed:', deleteData.error);
      if (deleteData.details) {
        console.error('   Details:', deleteData.details);
      }
    }

    // 3. Verify member is actually deleted
    console.log('\n🔍 [TEST] Verifying member is deleted...');
    const verifyResponse = await fetch('http://localhost:3000/api/client/members');
    const verifyData = await verifyResponse.json();
    const remainingMembers = verifyData.members || [];
    
    const deletedMemberExists = remainingMembers.some(m => m.id === testMember.id);
    if (deletedMemberExists) {
      console.error('❌ [TEST] Member still exists in database after deletion!');
    } else {
      console.log('✅ [TEST] Member successfully removed from database');
    }

    console.log(`\n📊 [TEST] Final member count: ${remainingMembers.length}`);

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
  console.log('🚀 [TEST] Next.js DELETE Member 404 Error Debug Test\n');

  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('❌ [TEST] Server is not running on http://localhost:3000');
    console.log('💡 [TEST] Please start the server with: npm run dev');
    process.exit(1);
  }

  console.log('✅ [TEST] Server is running\n');
  await testMemberDelete();
  
  console.log('\n🎯 [TEST] Test completed. Check browser console for detailed logs.');
  console.log('📝 [TEST] To test manually:');
  console.log('   1. Go to http://localhost:3000/login');
  console.log('   2. Login with client@saanify.com');
  console.log('   3. Navigate to Members section');
  console.log('   4. Try to delete a member');
  console.log('   5. Check browser console and server logs');
}

main().catch(console.error);