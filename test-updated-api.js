/**
 * Test Updated Passbook GET API
 */

async function testUpdatedPassbookAPI() {
  try {
    console.log('🧪 Testing updated passbook GET API...');
    
    const response = await fetch('http://localhost:3000/api/client/passbook?memberId=c1ed2236-5ed7-45b6-a9ca-1371e629b1cb');
    
    const result = await response.json();
    
    console.log('📊 Summary:', result.summary);
    console.log('📋 Recent Entries:');
    result.entries.slice(0, 3).forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.date} - Deposit: ₹${entry.deposit}, Installment: ₹${entry.installment}, Interest: ₹${entry.interest}, Balance: ₹${entry.balance}`);
    });

  } catch (error) {
    console.error('🚨 Test failed:', error);
  }
}

testUpdatedPassbookAPI();