const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function approveLoan() {
  try {
    const loan = await prisma.loan.update({
      where: { id: '71a03457-9181-45b5-b32d-d7b563bb75f8' },
      data: { 
        status: 'active',
        loanAmount: 10000,
        remainingBalance: 10000
      }
    });
    
    console.log('Loan approved:', loan);
  } catch (error) {
    console.error('Error approving loan:', error);
  } finally {
    await prisma.$disconnect();
  }
}

approveLoan();