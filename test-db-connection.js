#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if users table exists and has data
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true
        },
        take: 5
      });
      
      console.log('\n👥 First 5 users:');
      users.forEach(user => {
        console.log(`  ✅ ${user.email} - ${user.name} (${user.role})`);
      });
    } else {
      console.log('❌ No users found in database');
    }
    
    // Test specific user lookup
    console.log('\n🔍 Testing specific user lookup...');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'ADMIN@saanify.com' }
    });
    
    if (adminUser) {
      console.log(`✅ Found admin user: ${adminUser.email}`);
    } else {
      console.log('❌ Admin user not found');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();