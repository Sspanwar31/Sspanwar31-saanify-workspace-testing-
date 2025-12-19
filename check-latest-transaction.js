/**
 * Check Latest Transaction
 */

async function checkLatestTransaction() {
  try {
    console.log('🔍 Checking latest transaction...');
    
    const response = await fetch('http://localhost:3000/api/client/passbook?memberId=c1ed2236-5ed7-45b6-a9ca-1371e629b1cb');
    const result = await response.json();
    
    console.log('📊 Latest 3 entries:');
    result.entries.slice(0, 3).forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.date} ${entry.createdAt}`);
      console.log(`   ID: ${entry.id}`);
      console.log(`   Type: ${entry.deposit > 0 ? 'DEPOSIT' : entry.installment > 0 ? 'INSTALLMENT' : 'OTHER'}`);
      console.log(`   Deposit: ₹${entry.deposit}, Installment: ₹${entry.installment}, Interest: ₹${entry.interest}`);
      console.log(`   Created: ${entry.createdAt}`);
      console.log('');
    });

  } catch (error) {
    console.error('🚨 Check failed:', error);
  }
}

checkLatestTransaction();