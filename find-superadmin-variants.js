const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findSuperadminVariants() {
  try {
    console.log('🔍 Searching for all superadmin variants in the database...\n');
    
    // Find all possible superadmin variants
    const superadminVariants = [
      'superadmin',
      'super_admin', 
      'super-admin',
      'SUPERADMIN',
      'SUPER_ADMIN',
      'SUPER-ADMIN',
      'SuperAdmin',
      'Super_Admin',
      'Super-Admin',
      'superAdmin',
      'superAdmin1',
      'admin1'
    ];

    let allSuperadmins = [];
    
    for (const variant of superadminVariants) {
      const users = await prisma.user.findMany({
        where: {
          role: {
            contains: variant
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      });
      
      if (users.length > 0) {
        console.log(`📋 Found ${users.length} users with role containing "${variant}":`);
        users.forEach(user => {
          console.log(`  - ID: ${user.id}`);
          console.log(`    Name: ${user.name || 'N/A'}`);
          console.log(`    Email: ${user.email || 'N/A'}`);
          console.log(`    Role: "${user.role}"`);
          console.log(`    Active: ${user.isActive}`);
          console.log(`    Created: ${user.createdAt}`);
          console.log('');
        });
        allSuperadmins = [...allSuperadmins, ...users];
      }
    }

    // Also check for exact matches
    console.log('\n🎯 Checking for exact matches:');
    for (const variant of superadminVariants) {
      const exactUsers = await prisma.user.findMany({
        where: {
          role: variant
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      });
      
      if (exactUsers.length > 0) {
        console.log(`✅ Exact match for "${variant}": ${exactUsers.length} users`);
      }
    }

    // Find all admin users to see where we'll merge the data
    console.log('\n👥 Current admin users:');
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          contains: 'admin'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    adminUsers.forEach(user => {
      console.log(`  - ID: ${user.id}`);
      console.log(`    Name: ${user.name || 'N/A'}`);
      console.log(`    Email: ${user.email || 'N/A'}`);
      console.log(`    Role: "${user.role}"`);
      console.log(`    Active: ${user.isActive}`);
      console.log('');
    });

    console.log(`\n📊 SUMMARY:`);
    console.log(`- Total superadmin variants found: ${allSuperadmins.length}`);
    console.log(`- Total admin users found: ${adminUsers.length}`);
    console.log(`- Unique roles found:`, [...new Set(allSuperadmins.map(u => u.role))]);

    return {
      superadminVariants: allSuperadmins,
      adminUsers: adminUsers
    };

  } catch (error) {
    console.error('❌ Error finding superadmin variants:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findSuperadminVariants();