/**
 * Test Fixed Passbook API
 */

async function testFixedPassbookAPI() {
  try {
    console.log('🧪 Testing FIXED passbook API...');
    
    const response = await fetch('http://localhost:3000/api/client/passbook?memberId=c1ed2236-5ed7-45b6-a9ca-1371e629b1cb');
    const result = await response.json();
    
    console.log('📊 Summary:');
    console.log(`Current Balance: ₹${result.summary?.currentBalance || 0}`);
    console.log(`Active Loan Balance: ₹${result.summary?.activeLoanBalance || 0}`);
    console.log(`Total Deposits: ₹${result.summary?.totalDeposits || 0}`);
    console.log(`Total Installments: ₹${result.summary?.totalInstallments || 0}`);
    console.log(`Active Loan Amount: ₹${result.summary?.activeLoanAmount || 0}`);
    console.log(`Active Loan ID: ${result.summary?.activeLoanId || 'None'}`);
    
    console.log('📋 Latest 5 entries:');
    result.entries.slice(0, 5).forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.date} - ${entry.mode}`);
      console.log(`   Deposit: ₹${entry.deposit}, Installment: ₹${entry.installment}, Interest: ₹${entry.interest}`);
      console.log(`   Loan Balance: ₹${entry.loanBalance}, Remaining: ₹${entry.remainingLoan}`);
      console.log(`   Entry Balance: ₹${entry.balance}`);
      console.log('');
    });

  } catch (error) {
    console.error('🚨 Test failed:', error);
  }
}

testFixedPassbookAPI();