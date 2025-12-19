// Test script for maturity system
async function testMaturitySystem() {
  console.log('🧪 Testing Maturity Management System...\n');

  try {
    // Test 1: Generate maturity records
    console.log('1️⃣ Testing auto-generation of maturity records...');
    const generateResponse = await fetch('http://localhost:3000/api/maturity', {
      method: 'POST'
    });
    
    if (generateResponse.ok) {
      const generateResult = await generateResponse.json();
      console.log('✅ Generation successful:', generateResult);
    } else {
      console.log('❌ Generation failed:', await generateResponse.text());
    }

    // Test 2: Fetch all records
    console.log('\n2️⃣ Testing fetch all maturity records...');
    const fetchResponse = await fetch('http://localhost:3000/api/maturity');
    
    if (fetchResponse.ok) {
      const records = await fetchResponse.json();
      console.log(`✅ Found ${records.length} maturity records`);
      
      if (records.length > 0) {
        console.log('📊 Sample record:', {
          memberName: records[0].memberName,
          totalDeposit: records[0].totalDeposit,
          monthsCompleted: records[0].monthsCompleted,
          status: records[0].status,
          currentInterest: records[0].currentInterest,
          fullInterest: records[0].fullInterest
        });
      }
    } else {
      console.log('❌ Fetch failed:', await fetchResponse.text());
    }

    // Test 3: Test manual override (if records exist)
    console.log('\n3️⃣ Testing manual override functionality...');
    const testRecords = await (await fetch('http://localhost:3000/api/maturity')).json();
    
    if (testRecords.length > 0) {
      const testRecord = testRecords[0];
      console.log(`🔧 Testing manual override for ${testRecord.memberName}...`);
      
      const adjustResponse = await fetch('http://localhost:3000/api/maturity/manual-adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: testRecord.id,
          manualOverride: true,
          adjustedInterest: 15000
        })
      });
      
      if (adjustResponse.ok) {
        console.log('✅ Manual override successful');
      } else {
        console.log('❌ Manual override failed:', await adjustResponse.text());
      }
    } else {
      console.log('⚠️ No records available to test manual override');
    }

    console.log('\n🎉 Maturity system test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testMaturitySystem();
}

export { testMaturitySystem };