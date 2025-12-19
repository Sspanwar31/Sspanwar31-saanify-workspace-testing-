/**
 * Test Installment Only Transaction
 */

async function testInstallmentOnly() {
  try {
    console.log('🧪 Testing installment-only transaction...');
    
    // First, let's check current loan balance
    const currentLoanResponse = await fetch('http://localhost:3000/api/client/passbook?memberId=c1ed2236-5ed7-45b6-a9ca-1371e629b1cb');
    const currentData = await currentLoanResponse.json();
    
    if (currentData.entries && currentData.entries.length > 0) {
      const currentEntry = currentData.entries.find(e => e.loanId);
      if (currentEntry) {
        console.log(`🏦 Current Loan Balance: ₹${currentEntry.remainingLoan}`);
      }
    }

    // Now create an installment-only transaction
    const testData = {
      memberId: 'c1ed2236-5ed7-45b6-a9ca-1371e629b1cb',
      date: '2025-12-07',
      deposit: 0,
      installment: 1000,
      interest: 0,
      fine: 0,
      mode: 'CASH',
      note: 'Installment only test - should deduct 1000 from loan'
    };

    console.log('📤 Sending installment-only data:', testData);

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
      console.log(`💰 Installment Amount: ₹${result.entry.installment}`);
      console.log(`📈 Interest Calculated: ₹${result.entry.interest}`);
      console.log(`📉 New Loan Balance: ₹${result.entry.remainingLoan}`);
      console.log(`🎯 Total Balance: ₹${result.entry.balance}`);
    } else {
      console.log('❌ Error:', result);
    }

  } catch (error) {
    console.error('🚨 Test failed:', error);
  }
}

testInstallmentOnly();