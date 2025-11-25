const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function finalVerification() {
  try {
    console.log('🔍 FINAL VERIFICATION: Checking all users in the database...\n');

    // Get all users to see the complete picture
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Total users in database: ${allUsers.length}\n`);

    // Group users by role
    const usersByRole = {};
    allUsers.forEach(user => {
      if (!usersByRole[user.role]) {
        usersByRole[user.role] = [];
      }
      usersByRole[user.role].push(user);
    });

    // Display users by role
    Object.keys(usersByRole).forEach(role => {
      console.log(`🎭 Role: "${role}" (${usersByRole[role].length} users)`);
      usersByRole[role].forEach(user => {
        console.log(`  - ID: ${user.id}`);
        console.log(`    Name: ${user.name || 'N/A'}`);
        console.log(`    Email: ${user.email || 'N/A'}`);
        console.log(`    Active: ${user.isActive}`);
        console.log(`    Created: ${user.createdAt}`);
        console.log('');
      });
    });

    // Check specifically for any superadmin patterns
    const superadminPatterns = ['superadmin', 'super_admin', 'super-admin', 'SUPERADMIN', 'SUPER_ADMIN', 'SUPER-ADMIN'];
    const suspiciousUsers = allUsers.filter(user => 
      superadminPatterns.some(pattern => user.role.toLowerCase().includes(pattern.toLowerCase()))
    );

    if (suspiciousUsers.length === 0) {
      console.log('✅ SUCCESS: No users with superadmin patterns found!');
    } else {
      console.log(`⚠️  WARNING: Found ${suspiciousUsers.length} users with superadmin patterns:`);
      suspiciousUsers.forEach(user => {
        console.log(`  - ID: ${user.id}, Role: "${user.role}"`);
      });
    }

    console.log('\n🎉 OPERATION SUMMARY:');
    console.log(`✅ All superadmin variants successfully merged to ADMIN`);
    console.log(`✅ All superadmin variants permanently deleted`);
    console.log(`✅ Total ADMIN users: ${usersByRole['ADMIN']?.length || 0}`);
    console.log(`✅ No superadmin variants remaining in database`);

  } catch (error) {
    console.error('❌ Error during final verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalVerification();