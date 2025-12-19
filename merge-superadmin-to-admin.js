const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function mergeSuperadminToAdmin() {
  try {
    console.log('🚀 Starting superadmin to admin merge operation...\n');

    // Step 1: Find all superadmin variants
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
        }
      });
      
      // Add only unique users
      users.forEach(user => {
        if (!allSuperadmins.find(u => u.id === user.id)) {
          allSuperadmins.push(user);
        }
      });
    }

    console.log(`📋 Found ${allSuperadmins.length} unique superadmin users to process:`);
    allSuperadmins.forEach(user => {
      console.log(`  - ID: ${user.id}`);
      console.log(`    Name: ${user.name || 'N/A'}`);
      console.log(`    Email: ${user.email || 'N/A'}`);
      console.log(`    Current Role: "${user.role}"`);
      console.log('');
    });

    if (allSuperadmins.length === 0) {
      console.log('✅ No superadmin users found. Nothing to merge.');
      return;
    }

    // Step 2: Create admin users from superadmin data
    console.log('🔄 Step 1: Converting superadmin users to admin role...');
    
    for (const superadmin of allSuperadmins) {
      console.log(`\n👤 Processing user: ${superadmin.name || superadmin.email || superadmin.id}`);
      
      // Update the user's role to ADMIN
      const updatedUser = await prisma.user.update({
        where: {
          id: superadmin.id
        },
        data: {
          role: 'ADMIN'
        }
      });

      console.log(`✅ Successfully converted to ADMIN:`);
      console.log(`  - ID: ${updatedUser.id}`);
      console.log(`  - Name: ${updatedUser.name || 'N/A'}`);
      console.log(`  - Email: ${updatedUser.email || 'N/A'}`);
      console.log(`  - New Role: "${updatedUser.role}"`);
    }

    // Step 3: Verify no superadmin variants remain
    console.log('\n🔍 Step 2: Verifying no superadmin variants remain...');
    
    let remainingSuperadmins = [];
    
    for (const variant of superadminVariants) {
      const users = await prisma.user.findMany({
        where: {
          role: {
            contains: variant
          }
        }
      });
      
      remainingSuperadmins = [...remainingSuperadmins, ...users];
    }

    // Remove duplicates
    const uniqueRemaining = remainingSuperadmins.filter((user, index, self) =>
      index === self.findIndex((u) => u.id === user.id)
    );

    if (uniqueRemaining.length > 0) {
      console.log(`⚠️  Found ${uniqueRemaining.length} remaining users with superadmin variants:`);
      uniqueRemaining.forEach(user => {
        console.log(`  - ID: ${user.id}, Role: "${user.role}"`);
      });
      
      // Force delete any remaining superadmin variants
      console.log('\n🗑️  Step 3: Force deleting remaining superadmin variants...');
      
      for (const user of uniqueRemaining) {
        await prisma.user.delete({
          where: {
            id: user.id
          }
        });
        console.log(`🗑️  Deleted user: ${user.id} with role: "${user.role}"`);
      }
    } else {
      console.log('✅ No superadmin variants remaining!');
    }

    // Step 4: Final verification
    console.log('\n🎯 Step 4: Final verification...');
    
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
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

    console.log(`\n📊 FINAL RESULTS:`);
    console.log(`✅ Total ADMIN users: ${adminUsers.length}`);
    
    adminUsers.forEach(user => {
      console.log(`  - ID: ${user.id}`);
      console.log(`    Name: ${user.name || 'N/A'}`);
      console.log(`    Email: ${user.email || 'N/A'}`);
      console.log(`    Role: "${user.role}"`);
      console.log(`    Active: ${user.isActive}`);
      console.log('');
    });

    // Double check for any remaining superadmin variants
    let finalCheck = [];
    for (const variant of superadminVariants) {
      const users = await prisma.user.findMany({
        where: {
          role: {
            contains: variant
          }
        }
      });
      finalCheck = [...finalCheck, ...users];
    }

    const uniqueFinalCheck = finalCheck.filter((user, index, self) =>
      index === self.findIndex((u) => u.id === user.id)
    );

    if (uniqueFinalCheck.length === 0) {
      console.log('🎉 SUCCESS: All superadmin variants have been merged into ADMIN and permanently deleted!');
    } else {
      console.log(`❌ WARNING: ${uniqueFinalCheck.length} superadmin variants still remain:`);
      uniqueFinalCheck.forEach(user => {
        console.log(`  - ID: ${user.id}, Role: "${user.role}"`);
      });
    }

  } catch (error) {
    console.error('❌ Error during merge operation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

mergeSuperadminToAdmin();