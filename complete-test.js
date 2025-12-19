/**
 * Complete End-to-End Test
 */

async function completeTest() {
  try {
    console.log('🧪 === COMPLETE END-TO-END TEST ===');
    
    // Step 1: Check current state
    console.log('\n📊 Step 1: Current state check...');
    const currentState = await fetch('http://localhost:3000/api/client/passbook?memberId=c1ed2236-5ed7-45b6-a9ca-1371e629b1cb');
    const current = await currentState.json();
    
    console.log(`Current entries: ${current.entries?.length || 0}`);
    console.log(`Current balance: ₹${current.summary?.currentBalance || 0}`);
    
    // Step 2: Create a new transaction
    console.log('\n➕ Step 2: Creating new transaction...');
    const newTransaction = {
      memberId: 'c1ed2236-5ed7-45b6-a9ca-1371e629b1cb',
      date: '2025-12-07',
      deposit: 1000,
      installment: 0,
      interest: 0,
      fine: 0,
      mode: 'CASH',
      note: 'Complete test transaction'
    };

    const createResponse = await fetch('http://localhost:3000/api/client/passbook/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTransaction)
    });

    const createResult = await createResponse.json();
    console.log('Create response:', createResult);
    
    if (createResponse.ok) {
      console.log('✅ Transaction created successfully');
      console.log(`💰 Amount: ₹${newTransaction.deposit}`);
      console.log(`📋 New Balance: ₹${createResult.entry.balance}`);
    } else {
      console.log('❌ Transaction creation failed:', createResult);
    }
    
    // Step 3: Verify state after transaction
    console.log('\n🔍 Step 3: Verifying state after transaction...');
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for transaction to commit
    
    const newState = await fetch('http://localhost:3000/api/client/passbook?memberId=c1ed2236-5ed7-45b6-a9ca-1371e629b1cb');
    const updated = await newState.json();
    
    console.log(`Updated entries: ${updated.entries?.length || 0}`);
    console.log(`Updated balance: ₹${updated.summary?.currentBalance || 0}`);
    
    // Step 4: Compare states
    console.log('\n📊 Step 4: Comparing states...');
    const entriesIncreased = (updated.entries?.length || 0) > (current.entries?.length || 0);
    const balanceChanged = (updated.summary?.currentBalance || 0) !== (current.summary?.currentBalance || 0);
    
    console.log(`✅ Entries increased: ${entriesIncreased}`);
    console.log(`✅ Balance changed: ${balanceChanged}`);
    
    if (entriesIncreased && balanceChanged) {
      console.log('🎉 SUCCESS: Backend is working correctly!');
      console.log('📝 Data is being stored and retrieved properly');
      console.log('🚨 Frontend issue: The problem is in the frontend code');
    } else {
      console.log('❌ FAILURE: Backend has issues');
      console.log('🔧 Need to investigate backend logic');
    }
    
    console.log('\n🏁 === TEST COMPLETE ===');
    
  } catch (error) {
    console.error('🚨 Test failed:', error);
  }
}

completeTest();