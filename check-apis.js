/**
 * Check API responses directly
 */

async function checkAPIs() {
  try {
    console.log('🔍 Checking API responses...');
    
    // Check loans
    const loanResponse = await fetch('http://localhost:3000/api/client/loans');
    const loanData = await loanResponse.json();
    
    console.log('📊 Current Loans:');
    if (loanData.loans && loanData.loans.length > 0) {
      loanData.loans.forEach(loan => {
        console.log(`- Loan ID: ${loan.id}`);
        console.log(`  Amount: ₹${loan.amount}`);
        console.log(`  Remaining Balance: ₹${loan.remainingBalance}`);
        console.log(`  Status: ${loan.status}`);
        console.log(`  Loan Balance (display): ₹${loan.loanBalance}`);
      });
    } else {
      console.log('No loans found');
    }
    
    // Check passbook
    const passbookResponse = await fetch('http://localhost:3000/api/client/passbook?memberId=c1ed2236-5ed7-45b6-a9ca-1371e629b1cb');
    const passbookData = await passbookResponse.json();
    
    console.log('\n📋 Passbook Summary:');
    console.log(`  Total Entries: ${passbookData.entries?.length || 0}`);
    console.log(`  Current Balance: ₹${passbookData.summary?.currentBalance || 0}`);
    console.log(`  Active Loan Balance: ₹${passbookData.summary?.activeLoanBalance || 0}`);
    
    console.log('\n📋 Recent Passbook Entries:');
    if (passbookData.entries) {
      passbookData.entries.slice(0, 5).forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.date} - Deposit: ₹${entry.deposit}, Installment: ₹${entry.installment}, Interest: ₹${entry.interest}, Loan Balance: ₹${entry.remainingLoan}, Balance: ₹${entry.balance}`);
      });
    }

  } catch (error) {
    console.error('🚨 Check failed:', error);
  }
}

checkAPIs();