/**
 * Debug TransactionService Directly
 */

async function debugTransactionService() {
  try {
    console.log('🔍 Debugging TransactionService directly...');
    
    // Test the method that's failing
    const { TransactionService } = await import('/home/z/my-project/src/lib/services/transaction.service.js');
    
    console.log('📤 Calling getTransactionHistory...');
    const transactions = await TransactionService.getTransactionHistory('c1ed2236-5ed7-45b6-a9ca-1371e629b1cb', 10);
    
    console.log(`📊 Results: Found ${transactions.length} transactions`);
    
    if (transactions.length > 0) {
      transactions.slice(0, 3).forEach((tx, index) => {
        console.log(`${index + 1}. ${tx.transactionDate?.toISOString().split('T')[0]} - ${tx.depositAmount ? 'DEPOSIT' : tx.loanInstallment ? 'INSTALLMENT' : 'OTHER'}`);
        console.log(`   Amount: ${tx.depositAmount || tx.loanInstallment}`);
        console.log(`   Member: ${tx.member?.name || 'No member data'}`);
        console.log(`   Loan: ${tx.loan?.id || 'No loan'}`);
      });
    } else {
      console.log('❌ No transactions found!');
    }

  } catch (error) {
    console.error('🚨 Debug failed:', error);
  }
}

debugTransactionService();