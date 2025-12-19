#!/usr/bin/env node

// Test script to check existing members with duplicate phone numbers
async function testExistingDuplicates() {
  console.log('🔍 [TEST] Checking existing members for duplicate phone numbers...\n');

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

    // Group members by phone number
    const phoneGroups = {};
    members.forEach(member => {
      const phone = member.phone || 'NO_PHONE';
      if (!phoneGroups[phone]) {
        phoneGroups[phone] = [];
      }
      phoneGroups[phone].push(member);
    });

    // Find duplicates
    const duplicates = Object.entries(phoneGroups).filter(([phone, memberList]) => {
      return phone !== 'NO_PHONE' && memberList.length > 1;
    });

    console.log(`\n📊 [TEST] Found ${duplicates.length} phone numbers with duplicates:`);

    duplicates.forEach(([phone, memberList]) => {
      console.log(`\n📱 Phone: ${phone}`);
      memberList.forEach(member => {
        console.log(`   - ${member.name} (ID: ${member.id})`);
      });
    });

    if (duplicates.length > 0) {
      console.log(`\n⚠️ [TEST] WARNING: Found ${duplicates.length} duplicate phone numbers!`);
      console.log('   These duplicates were created before the fix was implemented.');
      console.log('   New members with these phone numbers cannot be created now.');
      
      // Test trying to create a member with one of the duplicate phones
      const duplicatePhone = duplicates[0][0];
      console.log(`\n🧪 [TEST] Testing creation with existing duplicate phone: ${duplicatePhone}`);
      
      const createResponse = await fetch('http://localhost:3000/api/client/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Duplicate Prevention',
          phone: duplicatePhone,
          address: 'Test Address',
          joinDate: new Date().toISOString().split('T')[0]
        })
      });

      const createData = await createResponse.json();
      
      if (createResponse.status === 409) {
        console.log('✅ [TEST] Duplicate prevention working for existing duplicates!');
        console.log('   Error:', createData.error);
      } else {
        console.error('❌ [TEST] Duplicate prevention failed for existing duplicates!');
        console.error('   Status:', createResponse.status);
        console.error('   Response:', createData);
      }
    } else {
      console.log('\n✅ [TEST] No duplicate phone numbers found in existing members.');
    }

    // Check specifically for the phone numbers mentioned in the issue
    const issuePhones = ['9782210804', '9782556644'];
    console.log('\n🎯 [TEST] Checking phone numbers mentioned in the issue:');
    
    issuePhones.forEach(phone => {
      const membersWithPhone = phoneGroups[phone] || [];
      if (membersWithPhone.length > 0) {
        console.log(`\n📱 Phone ${phone}: Found ${membersWithPhone.length} member(s)`);
        membersWithPhone.forEach(member => {
          console.log(`   - ${member.name} (ID: ${member.id}, Status: ${member.status})`);
        });
      } else {
        console.log(`\n📱 Phone ${phone}: No members found`);
      }
    });

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
  console.log('🚀 [TEST] Existing Members Duplicate Phone Check\n');

  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('❌ [TEST] Server is not running on http://localhost:3000');
    console.log('💡 [TEST] Please start the server with: npm run dev');
    process.exit(1);
  }

  console.log('✅ [TEST] Server is running\n');
  await testExistingDuplicates();
}

main().catch(console.error);