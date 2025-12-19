#!/usr/bin/env node

// Test script to verify member deletion works properly with existing members
async function testExistingMemberDeletion() {
  console.log('🗑️ [TEST] Testing deletion of existing members...\n');

  try {
    // Get all members
    const membersResponse = await fetch('http://localhost:3000/api/client/members');
    const membersData = await membersResponse.json();
    
    if (!membersResponse.ok) {
      console.error('❌ [TEST] Failed to fetch members:', membersData.error);
      return;
    }

    const members = membersData.members || [];
    console.log(`✅ [TEST] Found ${members.length} members`);

    if (members.length === 0) {
      console.log('⚠️ [TEST] No members found to test deletion');
      return;
    }

    // Find a member without active loans for safe deletion test
    console.log('\n🔍 [TEST] Looking for members without active loans...');
    
    let testMember = null;
    for (const member of members) {
      const memberDetailsResponse = await fetch(`http://localhost:3000/api/client/members/${member.id}`);
      const memberDetailsData = await memberDetailsResponse.json();
      
      if (memberDetailsResponse.ok) {
        const hasActiveLoan = memberDetailsData.activeLoan && memberDetailsData.activeLoan.outstandingBalance > 0;
        if (!hasActiveLoan) {
          testMember = member;
          console.log(`✅ [TEST] Found safe test member: ${member.name} (no active loans)`);
          break;
        } else {
          console.log(`⚠️ [TEST] ${member.name} has active loan (₹${memberDetailsData.activeLoan.outstandingBalance}), skipping`);
        }
      }
    }

    if (!testMember) {
      console.log('⚠️ [TEST] No members without active loans found. Creating a test member...');
      
      // Create a test member
      const createResponse = await fetch('http://localhost:3000/api/client/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Deletion Member',
          phone: '1111111111',
          address: 'Test Address for Deletion',
          joinDate: new Date().toISOString().split('T')[0]
        })
      });

      const createData = await createResponse.json();
      
      if (createResponse.ok) {
        testMember = createData.member;
        console.log('✅ [TEST] Test member created for deletion test:', testMember.name);
      } else {
        console.error('❌ [TEST] Failed to create test member:', createData.error);
        return;
      }
    }

    // Test deletion
    console.log(`\n🎯 [TEST] Testing deletion of member: ${testMember.name} (${testMember.id})`);

    const deleteResponse = await fetch(`http://localhost:3000/api/client/members/${testMember.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    const deleteData = await deleteResponse.json();
    console.log(`📡 [TEST] Response status: ${deleteResponse.status}`);
    console.log(`📡 [TEST] Response data:`, deleteData);

    if (deleteResponse.ok) {
      console.log('✅ [TEST] Member deletion successful!');
      console.log(`   Deleted ID: ${deleteData.deletedMemberId}`);
      console.log(`   Deleted Name: ${deleteData.deletedMemberName}`);
      console.log(`   Deleted counts:`, deleteData.deletedCounts);

      // Verify deletion
      console.log('\n🔍 [TEST] Verifying member is actually deleted...');
      const verifyResponse = await fetch('http://localhost:3000/api/client/members');
      const verifyData = await verifyResponse.json();
      const remainingMembers = verifyData.members || [];
      
      const deletedMemberExists = remainingMembers.some(m => m.id === testMember.id);
      if (deletedMemberExists) {
        console.error('❌ [TEST] Member still exists in database after deletion!');
        console.error('   Member ID that should be deleted:', testMember.id);
        console.error('   Remaining members:', remainingMembers.map(m => ({ id: m.id, name: m.name })));
      } else {
        console.log('✅ [TEST] Member successfully removed from database');
        console.log(`📊 [TEST] Member count before: ${members.length}, after: ${remainingMembers.length}`);
      }
    } else {
      console.error('❌ [TEST] Member deletion failed:', deleteData.error);
      if (deleteData.details) {
        console.error('   Details:', deleteData.details);
      }
      if (deleteData.activeLoans) {
        console.error('   Active loans:', deleteData.activeLoans);
      }
    }

    console.log('\n🎯 [TEST] Deletion test completed!');

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
  console.log('🚀 [TEST] Existing Member Deletion Test\n');

  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('❌ [TEST] Server is not running on http://localhost:3000');
    console.log('💡 [TEST] Please start the server with: npm run dev');
    process.exit(1);
  }

  console.log('✅ [TEST] Server is running\n');
  await testExistingMemberDeletion();
}

main().catch(console.error);