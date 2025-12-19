const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function clearTestPayments() {
  try {
    console.log('Clearing test payment records...');
    
    // Clear all pending payments (for testing)
    const result = await db.pendingPayment.deleteMany({});
    console.log(`Deleted ${result.count} pending payment records`);
    
    // Also clear any payment proofs
    const proofResult = await db.paymentProof.deleteMany({});
    console.log(`Deleted ${proofResult.count} payment proof records`);
    
    console.log('Test payments cleared successfully');
  } catch (error) {
    console.error('Error clearing test payments:', error);
  } finally {
    await db.$disconnect();
  }
}

clearTestPayments();