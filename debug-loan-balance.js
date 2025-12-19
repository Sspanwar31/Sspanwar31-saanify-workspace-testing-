/**
 * Debug Loan Balance Issue
 */

async function debugLoanBalance() {
  try {
    console.log('🔍 Debugging loan balance issue...');
    
    // 1. Check current loan status
    const loanResponse = await fetch('http://localhost:3000/api/client/loans');
    const loanData = await loanResponse.json();
    
    console.log('📊 Current Loans:');
    if (loanData.loans && loanData.loans.length > 0) {
      loanData.loans.forEach((loan, index) => {
        console.log(`${index + 1}. Loan ID: ${loan.id}`);
        console.log(`   Amount: ₹${loan.amount}`);
        console.log(`   Status: ${loan.status}`);
        console.log(`   Remaining Balance: ₹${loan.remainingBalance}`);
        console.log(`   Next Due Date: ${loan.nextDueDate}`);
        console.log('');
      });
    } else {
      console.log('No active loans found');
    }

    // 2. Check passbook entries
    const passbookResponse = await fetch('http://localhost:3000/api/client/passbook?memberId=c1ed2236-5ed7-45b6-a9ca-1371e629b1cb');
    const passbookData = await passbookResponse.json();
    
    console.log('📋 Passbook Summary:');
    console.log(`Current Balance: ₹${passbookData.summary?.currentBalance || 0}`);
    console.log(`Active Loan Balance: ₹${passbookData.summary?.activeLoanBalance || 0}`);
    console.log(`Total Deposits: ₹${passbookData.summary?.totalDeposits || 0}`);
    console.log(`Total Installments: ₹${passbookData.summary?.totalInstallments || 0}`);
    
    // 3. Check if there's a calculation issue
    const expectedLoanBalance = passbookData.summary?.totalDeposits - passbookData.summary?.currentBalance;
    console.log(`🧮 Expected Loan Balance: ₹${expectedLoanBalance || 0}`);

    // 4. Check specific loan details
    const memberLoansResponse = await fetch('http://localhost:3000/api/client/members/c1ed2236-5ed7-45b6-a9ca-1371e629b1cb');
    const memberData = await memberLoansResponse.json();
    
    if (memberData.loans && memberData.loans.length > 0) {
      console.log('🏦 Member Loan Details:');
      memberData.loans.forEach((loan, index) => {
        console.log(`${index + 1}. Status: ${loan.status}`);
        console.log(`   Loan Amount: ₹${loan.amount}`);
        console.log(`   Remaining Balance: ₹${loan.remainingBalance}`);
        console.log(`   Installments: ${loan.paidInstallments || 0}`);
        console.log(`   Total Interest Earned: ₹${loan.totalInterestEarned || 0}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('🚨 Debug failed:', error);
  }
}

debugLoanBalance();