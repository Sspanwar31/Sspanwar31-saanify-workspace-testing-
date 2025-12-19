/**
 * Comprehensive Loan Balance Test
 */

async function testLoanBalance() {
  try {
    console.log('🔍 Comprehensive Loan Balance Test...');
    
    // Get all passbook entries for Rahul
    const passbookResponse = await fetch('http://localhost:3000/api/client/passbook?memberId=c1ed2236-5ed7-45b6-a9ca-1371e629b1cb');
    const passbookData = await passbookResponse.json();
    
    console.log('\n📋 All Passbook Entries:');
    passbookData.entries.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.date} - Deposit: ₹${entry.deposit}, Installment: ₹${entry.installment}, Interest: ₹${entry.interest}, Fine: ₹${entry.fine}, Description: "${entry.description}"`);
    });
    
    // Get all loans
    const loanResponse = await fetch('http://localhost:3000/api/client/loans?memberId=c1ed2236-5ed7-45b6-a9ca-1371e629b1cb');
    const loanData = await loanResponse.json();
    
    console.log('\n💰 All Loans:');
    loanData.loans.forEach(loan => {
      console.log(`- Loan: ₹${loan.amount}, Remaining: ₹${loan.remainingBalance}, Status: ${loan.status}`);
      console.log(`  Total Paid: ₹${loan.totalInterestEarned + (loan.amount - loan.remainingBalance)}`);
      console.log(`  Total Interest: ₹${loan.totalInterestEarned}`);
    });
    
    // Calculate totals manually
    const totalDeposits = passbookData.entries.reduce((sum, entry) => sum + entry.deposit, 0);
    const totalInstallments = passbookData.entries.reduce((sum, entry) => sum + entry.installment, 0);
    const totalInterest = passbookData.entries.reduce((sum, entry) => sum + entry.interest, 0);
    
    console.log('\n📊 Manual Calculations:');
    console.log(`Total Deposits: ₹${totalDeposits}`);
    console.log(`Total Installments: ₹${totalInstallments}`);
    console.log(`Total Interest: ₹${totalInterest}`);
    console.log(`Net Balance: ₹${totalDeposits - totalInstallments}`);
    
    // Check specific loan calculations
    console.log('\n🎯 Loan Balance Analysis:');
    const activeLoan = loanData.loans.find(loan => loan.status === 'active');
    if (activeLoan) {
      console.log(`Active Loan Amount: ₹${activeLoan.amount}`);
      console.log(`Active Loan Remaining: ₹${activeLoan.remainingBalance}`);
      
      const expectedRemaining = activeLoan.amount - (totalInstallments - totalInterest);
      console.log(`Expected Remaining (₹${activeLoan.amount} - ₹${totalInstallments - totalInterest}): ₹${expectedRemaining}`);
      
      if (Math.abs(activeLoan.remainingBalance - expectedRemaining) > 10) {
        console.log('⚠️  Mismatch detected! Loan balance calculation may be incorrect.');
      } else {
        console.log('✅ Loan balance calculation appears correct.');
      }
    }

  } catch (error) {
    console.error('🚨 Test failed:', error);
  }
}

testLoanBalance();