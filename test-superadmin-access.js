const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testSuperadminAccess() {
  try {
    console.log('🔍 Testing Superadmin Access...\n');
    
    // 1. Check if superadmin exists
    const superadmin = await prisma.user.findUnique({
      where: { email: 'superadmin@saanify.com' }
    });
    
    if (!superadmin) {
      console.log('❌ Superadmin user not found');
      return;
    }
    
    console.log('✅ Superadmin user found:');
    console.log('   Email:', superadmin.email);
    console.log('   Role:', superadmin.role);
    console.log('   Active:', superadmin.isActive);
    console.log('   Last Login:', superadmin.lastLoginAt);
    
    // 2. Test password verification
    const testPassword = 'admin123';
    const isPasswordValid = await bcrypt.compare(testPassword, superadmin.password);
    
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
    
    console.log('\n🎯 Superadmin Panel URL: http://localhost:3000/superadmin');
    console.log('🔑 Login Credentials:');
    console.log('   Email: superadmin@saanify.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSuperadminAccess();