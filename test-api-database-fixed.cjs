#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

// Use the same configuration as the API
const globalForPrisma = globalThis || {};
const db = globalForPrisma.prisma || new PrismaClient({
  log: ['query'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

async function testAPIDatabase() {
  try {
    console.log('🔍 Testing API database connection...');
    
    // Test basic connection
    await db.$connect();
    console.log('✅ Database connected successfully');
    
    // Check user count
    const userCount = await db.user.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    // Try to find the admin user
    console.log('\n🔍 Looking for admin user...');
    const adminUser = await db.user.findUnique({
      where: { email: 'ADMIN@saanify.com' }
    });
    
    if (adminUser) {
      console.log(`✅ Found admin user: ${adminUser.email}`);
      console.log(`   ID: ${adminUser.id}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Active: ${adminUser.isActive}`);
    } else {
      console.log('❌ Admin user not found');
      
      // List all users
      console.log('\n📋 All users in database:');
      const allUsers = await db.user.findMany({
        select: {
          email: true,
          name: true,
          role: true,
          isActive: true
        }
      });
      
      allUsers.forEach(user => {
        console.log(`  "${user.email}" - ${user.name} (${user.role})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await db.$disconnect();
  }
}

testAPIDatabase();