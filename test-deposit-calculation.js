// Test script to debug loan approval deposit calculation
const testDepositCalculation = async () => {
  console.log("🔍 Testing Deposit Calculation API...");
  
  try {
    // Test 1: Get all members to find a test member
    console.log("\n=== Test 1: Getting Members ===");
    const membersResponse = await fetch('http://localhost:3000/api/client/members');
    
    if (!membersResponse.ok) {
      console.error("❌ Failed to fetch members:", membersResponse.status);
      return;
    }
    
    const membersData = await membersResponse.json();
    console.log("✅ Members fetched:", membersData.members?.length || 0);
    
    if (!membersData.members || membersData.members.length === 0) {
      console.log("❌ No members found to test with");
      return;
    }
    
    // Test with first member
    const testMember = membersData.members[0];
    console.log(`\n=== Test 2: Testing with Member: ${testMember.name} (${testMember.id}) ===`);
    
    // Test 2: Check deposit-total API
    console.log("\n--- Testing deposit-total API ---");
    const depositResponse = await fetch(`http://localhost:3000/api/client/members/${testMember.id}/deposit-total`);
    
    if (!depositResponse.ok) {
      console.error("❌ Failed to fetch deposit total:", depositResponse.status);
      return;
    }
    
    const depositData = await depositResponse.json();
    console.log("✅ Deposit API Response:", depositData);
    
    // Test 3: Check main member API
    console.log("\n--- Testing main member API ---");
    const memberResponse = await fetch(`http://localhost:3000/api/client/members/${testMember.id}`);
    
    if (!memberResponse.ok) {
      console.error("❌ Failed to fetch member details:", memberResponse.status);
      return;
    }
    
    const memberData = await memberResponse.json();
    console.log("✅ Member API Response:", memberData);
    
    // Test 4: Manual calculation
    console.log("\n=== Test 3: Manual Calculation ===");
    console.log("Total Deposits from deposit-total API:", depositData.totalDeposit);
    console.log("Total Deposits from member API:", memberData.totalDeposits);
    
    const totalDeposits = depositData.totalDeposit || 0;
    const limitAmount = totalDeposits * 0.8;
    const testLoanAmount = 10000;
    const isLimitExceeded = testLoanAmount > limitAmount;
    
    console.log("\n📊 Calculation Results:");
    console.log("- Total Deposits:", totalDeposits);
    console.log("- 80% Limit:", limitAmount);
    console.log("- Test Loan Amount:", testLoanAmount);
    console.log("- Is Limit Exceeded:", isLimitExceeded);
    
    if (isLimitExceeded) {
      console.log("⚠️  Loan amount exceeds 80% limit!");
      console.log("💡 Solution: Enable override or reduce loan amount");
    } else {
      console.log("✅ Loan amount is within 80% limit");
    }
    
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
};

// Run the test
testDepositCalculation();