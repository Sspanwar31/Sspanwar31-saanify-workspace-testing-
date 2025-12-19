#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEmailLookup() {
  try {
    console.log('🔍 Testing email lookups with different cases...');
    
    // Test exact match
    let user = await prisma.user.findUnique({
      where: { email: 'ADMIN@saanify.com' }
    });
    console.log(`'ADMIN@saanify.com': ${user ? '✅ Found' : '❌ Not found'}`);
    
    // Test lowercase
    user = await prisma.user.findUnique({
      where: { email: 'admin@saanify.com' }
    });
    console.log(`'admin@saanify.com': ${user ? '✅ Found' : '❌ Not found'}`);
    
    // Test mixed case
    user = await prisma.user.findUnique({
      where: { email: 'Admin@saanify.com' }
    });
    console.log(`'Admin@saanify.com': ${user ? '✅ Found' : '❌ Not found'}`);
    
    // Get all users to see exact emails
    console.log('\n📋 All emails in database:');
    const users = await prisma.user.findMany({
      select: { email: true }
    });
    users.forEach(u => {
      console.log(`  "${u.email}"`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEmailLookup();