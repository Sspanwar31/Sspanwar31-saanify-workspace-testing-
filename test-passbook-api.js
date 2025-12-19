/**
 * Test Passbook API after fixes
 */

async function testPassbookAPI() {
  try {
    console.log('🧪 Testing updated passbook API after fixes...');
    
    const response = await fetch('http://localhost:3000/api/client/passbook?memberId=c1ed2236-5ed7-45b6-a9ca-1371e629b1cb&pageSize=10');
    
    if (!response.ok) {
      console.log('❌ API call failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }
    
    const result = await response.json();
    
    console.log('✅ API Response Status:', response.status);
    console.log('📊 Total Entries:', result.pagination?.totalCount);
    console.log('📄 Current Page:', result.pagination?.page);
    console.log('💰 Current Balance:', result.summary?.currentBalance);
    console.log('🏦 Active Loan Balance:', result.summary?.activeLoanBalance);
    
    if (result.entries && result.entries.length > 0) {
      console.log('📋 Recent Entries:');
      result.entries.slice(0, 3).forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.date} - Deposit: ₹${entry.deposit}, Installment: ₹${entry.installment}, Interest: ₹${entry.interest}, Balance: ₹${entry.balance}, Loan: ₹${entry.loanBalance}`);
      });
    }

  } catch (error) {
    console.error('🚨 Test failed:', error);
  }
}

testPassbookAPI();