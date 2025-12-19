/**
 * Check for multiple loans
 */

async function checkMultipleLoans() {
  try {
    console.log('🔍 Checking for multiple loans...');
    
    // Get ALL loans (including closed ones)
    const loanResponse = await fetch('http://localhost:3000/api/client/loans?memberId=c1ed2236-5ed7-45b6-a9ca-1371e629b1cb&includeClosed=true');
    const loanData = await loanResponse.json();
    
    console.log('\n💰 ALL Loans (including closed):');
    loanData.loans.forEach((loan, index) => {
      console.log(`${index + 1}. Loan: ₹${loan.amount}, Remaining: ₹${loan.remainingBalance}, Status: ${loan.status}`);
      console.log(`   Created: ${loan.startDate}`);
      console.log(`   Description: "${loan.description}"`);
    });
    
    // Get all passbook entries to see payment history
    const passbookResponse = await fetch('http://localhost:3000/api/client/passbook?memberId=c1ed2236-5ed7-45b6-a9ca-1371e629b1cb');
    const passbookData = await passbookResponse.json();
    
    console.log('\n📋 Installment History:');
    passbookData.entries
      .filter(entry => entry.installment > 0)
      .forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.date} - Installment: ₹${entry.installment}, Interest: ₹${entry.interest}, Total: ₹${entry.installment + entry.interest}`);
      });
    
    // Calculate total paid per loan
    console.log('\n🎯 Payment Analysis:');
    loanData.loans.forEach(loan => {
      const loanPayments = passbookData.entries.filter(entry => entry.loanId === loan.id);
      const totalPaid = loanPayments.reduce((sum, entry) => sum + entry.installment, 0);
      const totalInterest = loanPayments.reduce((sum, entry) => sum + entry.interest, 0);
      
      console.log(`Loan ₹${loan.amount}:`);
      console.log(`  Total Payments: ₹${totalPaid}`);
      console.log(`  Total Interest: ₹${totalInterest}`);
      console.log(`  Principal Paid: ₹${totalPaid - totalInterest}`);
      console.log(`  Expected Remaining: ₹${loan.amount - (totalPaid - totalInterest)}`);
      console.log(`  Actual Remaining: ₹${loan.remainingBalance}`);
      console.log(`  Status: ${loan.remainingBalance === loan.amount - (totalPaid - totalInterest) ? '✅ Correct' : '❌ Mismatch'}`);
    });

  } catch (error) {
    console.error('🚨 Check failed:', error);
  }
}

checkMultipleLoans();