import fetch from 'node-fetch';

async function testMaturityAPI() {
  console.log('🧪 Testing Maturity API endpoints...');

  try {
    // Test GET all maturity records
    console.log('\n📋 Testing GET /api/maturity/records');
    const response = await fetch('http://localhost:3000/api/maturity/records');
    
    if (response.ok) {
      const records = await response.json();
      console.log(`✅ Found ${records.length} maturity records`);
      
      if (records.length > 0) {
        console.log('\n📊 Sample record:');
        const record = records[0];
        console.log(`  Member: ${record.memberName}`);
        console.log(`  Total Deposit: ₹${record.totalDeposit}`);
        console.log(`  Status: ${record.status}`);
        console.log(`  Months Completed: ${record.monthsCompleted}`);
        console.log(`  Current Interest: ₹${record.currentInterest}`);
        console.log(`  Full Interest: ₹${record.fullInterest}`);
        console.log(`  Manual Override: ${record.manualOverride}`);
        console.log(`  Adjusted Interest: ₹${record.adjustedInterest}`);
      }
    } else {
      console.log('❌ Failed to fetch records');
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testMaturityAPI();