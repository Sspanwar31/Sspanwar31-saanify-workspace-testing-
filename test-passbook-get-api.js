/**
 * Test Passbook GET API Directly
 */

async function testPassbookGetAPI() {
  try {
    console.log('🧪 Testing Passbook GET API directly...');
    
    const response = await fetch('http://localhost:3000/api/client/passbook?memberId=c1ed2236-5ed7-45b6-a9ca-1371e629b1cb');
    
    console.log('📊 Status:', response.status);
    console.log('📊 Headers:', response.headers);
    
    const result = await response.json();
    console.log('📥 Response:', result);

    if (response.ok && result.entries) {
      console.log(`✅ Found ${result.entries.length} entries`);
      result.entries.slice(0, 3).forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.date} - ${entry.deposit > 0 ? 'DEPOSIT' : entry.installment > 0 ? 'INSTALLMENT' : 'OTHER'}`);
        console.log(`   Amount: ${entry.deposit || entry.installment}`);
        console.log(`   Member: ${entry.memberName}`);
        console.log(`   Loan: ${entry.loanId}`);
      });
    } else {
      console.log('❌ API failed or no entries');
      console.log('Error:', result.error);
    }

  } catch (error) {
    console.error('🚨 Test failed:', error);
  }
}

testPassbookGetAPI();