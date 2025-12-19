/**
 * Test Updated Loan Balance Calculation
 */

async function testLoanBalanceUpdate() {
  try {
    console.log('🧪 Testing updated loan balance calculation...');
    
    const response = await fetch('http://localhost:3000/api/client/passbook?memberId=fd1c61df-0b83-449c-97f6-04059e1dc9d2');
    
    const result = await response.json();
    
    console.log('📋 Rakesh Sharma Passbook Entries:');
    result.entries?.slice(0, 5).forEach((entry, i) => {
      console.log(`${i+1}. ${entry.date}:`);
      console.log(`   Deposit: ₹${entry.deposit}`);
      console.log(`   Installment: ₹${entry.installment}`);
      console.log(`   Interest: ₹${entry.interest}`);
      console.log(`   Balance: ₹${entry.balance}`);
      console.log(`   Loan Balance: ₹${entry.loanBalance}`);
      console.log(`   Remaining Loan: ₹${entry.remainingLoan}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLoanBalanceUpdate();