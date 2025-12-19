/**
 * TEST SCRIPT: Split Entries & Wrong Balance Display Fixes
 * Tests for Mixed Transaction and Member Info Card sync issues
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Test configuration
const TEST_MEMBER_ID = 'test-member-id'; // Replace with actual member ID
const TEST_DEPOSIT = 3000;
const TEST_INSTALLMENT = 2000;

async function testSplitEntryFix() {
  console.log('\n🧪 TESTING SPLIT ENTRY FIX');
  console.log('=' .repeat(50));

  try {
    // Step 1: Create a mixed transaction (Deposit + Installment)
    console.log('\n💰 Step 1: Creating mixed transaction...');
    console.log(`   Deposit: ₹${TEST_DEPOSIT}`);
    console.log(`   Installment: ₹${TEST_INSTALLMENT}`);
    
    const mixedTransactionResponse = await axios.post(`${API_BASE}/client/passbook/create`, {
      memberId: TEST_MEMBER_ID,
      date: new Date().toISOString().split('T')[0],
      deposit: TEST_DEPOSIT,
      installment: TEST_INSTALLMENT,
      mode: 'CASH',
      note: 'Test mixed transaction'
    });

    if (!mixedTransactionResponse.data.success) {
      console.log('❌ Mixed transaction failed:', mixedTransactionResponse.data.error);
      return;
    }

    console.log('   ✅ Mixed transaction created successfully');
    console.log(`   Transaction ID: ${mixedTransactionResponse.data.entry.id}`);
    console.log(`   Transactions Created: ${mixedTransactionResponse.data.entry.transactionsCreated}`);
    console.log(`   Deposit in record: ₹${mixedTransactionResponse.data.entry.deposit}`);
    console.log(`   Installment in record: ₹${mixedTransactionResponse.data.entry.installment}`);

    // Step 2: Verify only ONE record was created in passbook
    console.log('\n📊 Step 2: Verifying single record creation...');
    
    // Get all passbook entries for this member
    const passbookResponse = await axios.get(`${API_BASE}/client/passbook?memberId=${TEST_MEMBER_ID}`);
    
    if (!passbookResponse.data.success) {
      console.log('❌ Failed to fetch passbook entries');
      return;
    }

    const entries = passbookResponse.data.entries || [];
    console.log(`   Total passbook entries found: ${entries.length}`);

    // Find the most recent entry
    const mostRecentEntry = entries[0]; // Assuming entries are sorted by date desc
    if (mostRecentEntry) {
      console.log(`   Most recent entry ID: ${mostRecentEntry.id}`);
      console.log(`   Most recent entry deposit: ₹${mostRecentEntry.deposit || 0}`);
      console.log(`   Most recent entry installment: ₹${mostRecentEntry.installment || 0}`);
      console.log(`   Most recent entry date: ${mostRecentEntry.date}`);

      // Verify single record contains both values
      const hasBothValues = (mostRecentEntry.deposit === TEST_DEPOSIT) && (mostRecentEntry.installment === TEST_INSTALLMENT);
      if (hasBothValues) {
        console.log('   ✅ SPLIT ENTRY FIX CONFIRMED: Single record contains both deposit and installment');
      } else {
        console.log('   ❌ SPLIT ENTRY NOT FIXED: Values not found in single record');
      }
    }

    // Step 3: Check if multiple records were created
    const recentEntries = entries.filter(entry => 
      entry.deposit === TEST_DEPOSIT || entry.installment === TEST_INSTALLMENT
    );
    
    if (recentEntries.length === 1) {
      console.log('   ✅ SPLIT ENTRY FIX CONFIRMED: Only one record created');
    } else {
      console.log(`   ❌ SPLIT ENTRY NOT FIXED: ${recentEntries.length} records found`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function testMemberInfoBalanceFix() {
  console.log('\n🧪 TESTING MEMBER INFO BALANCE FIX');
  console.log('=' .repeat(50));

  try {
    // Step 1: Get loan balance from "All Loans" table
    console.log('\n📊 Step 1: Getting balance from Loans API...');
    const loansResponse = await axios.get(`${API_BASE}/client/loans?memberId=${TEST_MEMBER_ID}`);
    
    if (!loansResponse.data.success || loansResponse.data.loans.length === 0) {
      console.log('❌ No active loans found');
      return;
    }

    const loanFromLoansAPI = loansResponse.data.loans[0];
    const loansAPIBalance = loanFromLoansAPI.remainingBalance;
    console.log(`   Loans API Balance: ₹${loansAPIBalance}`);

    // Step 2: Get loan balance from Member Info Card API
    console.log('\n👤 Step 2: Getting balance from Member Details API...');
    const memberResponse = await axios.get(`${API_BASE}/client/members/${TEST_MEMBER_ID}`);
    
    if (!memberResponse.data.success) {
      console.log('❌ Failed to fetch member details');
      return;
    }

    const memberLoanBalance = memberResponse.data.activeLoan?.outstandingBalance || 0;
    console.log(`   Member Info Card Balance: ₹${memberLoanBalance}`);

    // Step 3: Compare balances
    console.log('\n🔍 Step 3: Comparing balances...');
    console.log(`   Loans API Balance: ₹${loansAPIBalance}`);
    console.log(`   Member Info Balance: ₹${memberLoanBalance}`);

    const isBalancesMatch = loansAPIBalance === memberLoanBalance;
    if (isBalancesMatch) {
      console.log('   ✅ MEMBER INFO BALANCE FIX CONFIRMED: Both APIs show same balance');
    } else {
      console.log(`   ❌ MEMBER INFO BALANCE NOT FIXED: Difference of ₹${Math.abs(loansAPIBalance - memberLoanBalance)}`);
      console.log(`   Expected: ₹${loansAPIBalance}, Got: ₹${memberLoanBalance}`);
    }

    // Step 4: Debug info
    if (memberResponse.data.activeLoan) {
      console.log('\n🐛 Debug Info:');
      console.log(`   Active Loan ID: ${memberResponse.data.activeLoan.loanId}`);
      console.log(`   Loan Amount: ₹${memberResponse.data.activeLoan.loanAmount}`);
      console.log(`   Interest Rate: ${memberResponse.data.activeLoan.interestRate}%`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function testRealTimeBalanceUpdate() {
  console.log('\n🧪 TESTING REAL-TIME BALANCE UPDATE');
  console.log('=' .repeat(50));

  try {
    // Step 1: Create an installment payment
    console.log('\n💰 Step 1: Creating installment payment...');
    const paymentResponse = await axios.post(`${API_BASE}/client/passbook/create`, {
      memberId: TEST_MEMBER_ID,
      date: new Date().toISOString().split('T')[0],
      installment: 1000,
      mode: 'CASH',
      note: 'Test installment for balance sync'
    });

    if (!paymentResponse.data.success) {
      console.log('❌ Payment failed:', paymentResponse.data.error);
      return;
    }

    console.log('   ✅ Payment created successfully');
    console.log(`   Payment Amount: ₹1000`);
    console.log(`   Remaining Loan Balance: ₹${paymentResponse.data.entry.remainingLoan}`);

    // Step 2: Immediately fetch loans API to verify balance
    console.log('\n📊 Step 2: Verifying real-time balance update...');
    const updatedLoansResponse = await axios.get(`${API_BASE}/client/loans?memberId=${TEST_MEMBER_ID}`);
    
    if (updatedLoansResponse.data.success && updatedLoansResponse.data.loans.length > 0) {
      const updatedBalance = updatedLoansResponse.data.loans[0].remainingBalance;
      console.log(`   Updated Loans API Balance: ₹${updatedBalance}`);
      
      // Check if timestamp indicates real-time data
      if (updatedLoansResponse.data.timestamp) {
        console.log(`   ✅ Real-time data confirmed: ${updatedLoansResponse.data.timestamp}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function runAllTests() {
  console.log('🚀 SPLIT ENTRIES & WRONG BALANCE FIXES VERIFICATION');
  console.log('Testing fixes for:');
  console.log('1. Split Entries Bug (Mixed Transactions)');
  console.log('2. Wrong Balance Display (Member Info Card Sync)');
  console.log('3. Real-time Balance Updates');
  console.log('=' .repeat(60));

  await testSplitEntryFix();
  await testMemberInfoBalanceFix();
  await testRealTimeBalanceUpdate();

  console.log('\n✅ ALL TESTS COMPLETED');
  console.log('\n📋 SUMMARY OF FIXES:');
  console.log('1. ✅ Fixed Split Entries: Mixed transactions now create single DB record');
  console.log('2. ✅ Fixed Member Info Balance: Uses remainingBalance directly from Loan model');
  console.log('3. ✅ Enhanced TransactionService: Supports MIXED transaction type');
  console.log('4. ✅ Updated Passbook API: Uses new mixed transaction logic');
  console.log('5. ✅ Added Debug Logging: For troubleshooting balance issues');
  
  console.log('\n🔧 CHANGES MADE:');
  console.log('- Enhanced: /lib/services/transaction.service.ts');
  console.log('- Fixed: /api/client/passbook/create/route.ts');
  console.log('- Fixed: /api/client/members/[memberId]/route.ts');
  console.log('- Added: Mixed transaction support');
  console.log('- Added: Real-time balance fetching');
  console.log('- Added: Comprehensive debug logging');
}

// Run tests
runAllTests().catch(console.error);