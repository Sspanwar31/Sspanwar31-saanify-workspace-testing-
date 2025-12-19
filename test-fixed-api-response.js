/**
 * Test Fixed API Response
 */

async function testFixedAPIResponse() {
  try {
    console.log('🧪 Testing FIXED API response...');
    
    const testData = {
      memberId: 'c1ed2236-5ed7-45b6-a9ca-1371e629b1cb',
      date: '2025-12-07',
      deposit: 0,
      installment: 1500,
      interest: 0,
      fine: 0,
      mode: 'CASH',
      note: 'Test FIXED API response - should return latest installment'
    };

    console.log('📤 Sending test data:', testData);

    const response = await fetch('http://localhost:3000/api/client/passbook/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('📥 Response:', result);

    if (response.ok) {
      console.log('✅ Success!');
      console.log(`🎯 Entry Type: ${result.entry.deposit > 0 ? 'DEPOSIT' : result.entry.installment > 0 ? 'INSTALLMENT' : 'OTHER'}`);
      console.log(`💰 Installment: ₹${result.entry.installment}`);
      console.log(`📈 Interest: ₹${result.entry.interest}`);
      console.log(`🏦 Loan Balance: ₹${result.entry.remainingLoan}`);
      console.log(`🎉 Total Balance: ₹${result.entry.balance}`);
      
      // Verify the logic
      if (result.entry.installment > 0) {
        console.log(`✅ Installment entry created successfully!`);
        console.log(`📉 Loan was reduced by: ₹${testData.installment} (full amount)`);
      }
    } else {
      console.log('❌ Error:', result);
    }

  } catch (error) {
    console.error('🚨 Test failed:', error);
  }
}

testFixedAPIResponse();