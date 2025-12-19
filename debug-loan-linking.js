/**
 * Debug loan linking issue
 */

async function debugLoanLinking() {
  try {
    console.log('🔍 Debugging loan linking issue...');
    
    // Get all transactions for Rakesh Sharma
    const transactionsResponse = await fetch('http://localhost:3000/api/client/passbook?memberId=fd1c61df-0b83-449c-97f6-04059e1dc9d2');
    const transactionsData = await transactionsResponse.json();
    
    // Get all loans for Rakesh Sharma
    const loansResponse = await fetch('http://localhost:3000/api/client/loans');
    const loansData = await loansResponse.json();
    
    const rakeshLoans = loansData.loans?.filter(l => l.memberId === 'fd1c61df-0b83-449c-97f6-04059e1dc9d2');
    
    console.log('💰 Rakesh Sharma Loans:');
    rakeshLoans?.forEach(loan => {
      console.log(`  Loan ID: ${loan.id}`);
      console.log(`  Amount: ₹${loan.amount}`);
      console.log(`  Status: ${loan.status}`);
      console.log(`  Remaining Balance: ₹${loan.remainingBalance}`);
      console.log('');
    });
    
    console.log('📋 Transaction Details:');
    transactionsData.entries?.slice(0, 3).forEach((entry, i) => {
      console.log(`${i+1}. Transaction ID: ${entry.id}`);
      console.log(`   Date: ${entry.date}`);
      console.log(`   Deposit: ₹${entry.deposit}`);
      console.log(`   Installment: ₹${entry.installment}`);
      console.log(`   Interest: ₹${entry.interest}`);
      console.log(`   Loan ID: ${entry.loanId}`);
      console.log(`   Remaining Loan: ₹${entry.remainingLoan}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugLoanLinking();