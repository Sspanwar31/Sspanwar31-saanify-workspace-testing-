/**
 * Debug Transaction History
 */

async function debugTransactionHistory() {
  try {
    console.log('🔍 Debugging transaction history...');
    
    const response = await fetch('http://localhost:3000/api/client/passbook?memberId=c1ed2236-5ed7-45b6-a9ca-1371e629b1cb');
    const result = await response.json();
    
    console.log('📊 All entries:');
    result.entries.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.date} - ID: ${entry.id}`);
      console.log(`   Type: ${entry.deposit > 0 ? 'DEPOSIT' : entry.installment > 0 ? 'INSTALLMENT' : 'OTHER'}`);
      console.log(`   Deposit: ₹${entry.deposit}, Installment: ₹${entry.installment}, Interest: ₹${entry.interest}`);
      console.log(`   Loan ID: ${entry.loanId}, Remaining Loan: ₹${entry.remainingLoan}`);
      console.log('');
    });

  } catch (error) {
    console.error('🚨 Debug failed:', error);
  }
}

debugTransactionHistory();