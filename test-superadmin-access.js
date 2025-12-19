const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testSuperadminAccess() {
  try {
    console.log('🔍 Testing ADMIN Access...\n');
    
    // 1. Check if ADMIN exists
    const ADMIN = await prisma.user.findUnique({
      where: { email: 'ADMIN@saanify.com' }
    });
    
    if (!ADMIN) {
      console.log('❌ ADMIN user not found');
      return;
    }
    
    console.log('✅ ADMIN user found:');
    console.log('   Email:', ADMIN.email);
    console.log('   Role:', ADMIN.role);
    console.log('   Active:', ADMIN.isActive);
    console.log('   Last Login:', ADMIN.lastLoginAt);
    
    // 2. Test password verification
    const testPassword = 'admin123';
    const isPasswordValid = await bcrypt.compare(testPassword, ADMIN.password);
    
    console.log('\n🔐 Password Test:');
    console.log('   Test Password:', testPassword);
    console.log('   Password Valid:', isPasswordValid ? '✅' : '❌');
    
    // 3. Check all users in database
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true
      }
    });
    
    console.log('\n👥 All Users in Database:');
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${user.isActive ? 'Active' : 'Inactive'}`);
    });
    
    console.log('\n🎯 ADMIN Panel URL: http://localhost:3000/ADMIN');
    console.log('🔑 Login Credentials:');
    console.log('   Email: ADMIN@saanify.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSuperadminAccess();