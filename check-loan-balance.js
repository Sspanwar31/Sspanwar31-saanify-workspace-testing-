/**
 * Test Current Loan Balance for Rakesh Sharma
 */

async function checkLoanBalance() {
  try {
    console.log('🔍 Checking loan balance for Rakesh Sharma...');
    
    // Get member info
    const memberResponse = await fetch('http://localhost:3000/api/client/members');
    const memberData = await memberResponse.json();
    
    const rakeshSharma = memberData.members?.find(m => m.name?.toLowerCase().includes('rakesh'));
    
    if (!rakeshSharma) {
      console.log('❌ Rakesh Sharma not found');
      return;
    }
    
    console.log('👤 Member Info:', {
      id: rakeshSharma.id,
      name: rakeshSharma.name,
      previousBalance: rakeshSharma.previousBalance
    });
    
    // Get current loans
    const loansResponse = await fetch('http://localhost:3000/api/client/loans');
    const loansData = await loansResponse.json();
    
    console.log('💰 Current Loans:', JSON.stringify(loansData.loans?.filter(l => l.memberId === rakeshSharma.id), null, 2));
    
    // Get passbook entries
    const passbookResponse = await fetch(`http://localhost:3000/api/client/passbook?memberId=${rakeshSharma.id}`);
    const passbookData = await passbookResponse.json();
    
    console.log('📋 Passbook Entries (last 5):');
    passbookData.entries?.slice(0, 5).forEach((entry, i) => {
      console.log(`${i+1}. ${entry.date}: Deposit ₹${entry.deposit}, Installment ₹${entry.installment}, Interest ₹${entry.interest}, Balance ₹${entry.balance}, Remaining Loan ₹${entry.remainingLoan}`);
    });
    
    console.log('📊 Summary:', passbookData.summary);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkLoanBalance();