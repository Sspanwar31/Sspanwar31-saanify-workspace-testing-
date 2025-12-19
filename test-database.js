const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test if User table exists
    const userCount = await prisma.user.count();
    console.log(`✅ User table exists, count: ${userCount}`);
    
    // Test if we can find a user
    const users = await prisma.user.findMany();
    console.log('✅ Users found:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));
    
    // Test creating a user
    const testUser = await prisma.user.findUnique({
      where: { email: 'ADMIN@saanify.com' }
    });
    console.log('✅ Found admin user:', testUser ? { id: testUser.id, email: testUser.email, role: testUser.role } : 'Not found');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();