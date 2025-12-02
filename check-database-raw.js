const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    console.log('🔍 Checking database with detailed logging...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Get raw database info
    const result = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
    console.log('📋 Tables in database:', result);
    
    // Test User table with raw query
    try {
      const userResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM users`;
      console.log('✅ Raw query on users table successful:', userResult);
    } catch (error) {
      console.error('❌ Raw query on users table failed:', error.message);
    }
    
    // Test Prisma User model
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Prisma User model count: ${userCount}`);
    } catch (error) {
      console.error('❌ Prisma User model failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();