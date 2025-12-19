const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking database users...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
    
    console.log('Found users:', users.length);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Active: ${user.isActive}`);
    });
    
    const societies = await prisma.societyAccount.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        status: true
      }
    });
    
    console.log('\nFound societies:', societies.length);
    societies.forEach(society => {
      console.log(`- ${society.name} (${society.email}) - Status: ${society.status}`);
    });
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();