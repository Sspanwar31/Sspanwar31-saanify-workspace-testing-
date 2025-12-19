/**
 * Check transaction history for Rahul Sharma
 */

async function checkTransactionHistory() {
  try {
    console.log('🔍 Checking transaction history...');
    
    const response = await fetch('http://localhost:3000/api/client/passbook?memberId=c1ed2236-5ed7-45b6-a9ca-1371e629b1cb');
    
    const result = await response.json();
    console.log('📋 Transaction History:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('🚨 Check failed:', error);
  }
}

checkTransactionHistory();