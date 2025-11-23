#!/usr/bin/env node

/**
 * Database Table Verification Script
 */

const { PrismaClient } = require('@prisma/client');

async function verifyTables() {
  console.log('🔍 Verifying Database Tables...');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check each table
    const tables = [
      { name: 'users', model: 'user' },
      { name: 'society_accounts', model: 'societyAccount' },
      { name: 'societies', model: 'society' },
      { name: 'posts', model: 'post' }
    ];
    
    const results = {};
    
    for (const table of tables) {
      try {
        const count = await prisma[table.model].count();
        results[table.name] = {
          exists: true,
          count: count,
          status: '✅ Verified'
        };
        console.log(`✅ ${table.name}: ${count} records`);
      } catch (error) {
        results[table.name] = {
          exists: false,
          error: error.message,
          status: '❌ Error'
        };
        console.log(`❌ ${table.name}: ${error.message}`);
      }
    }
    
    // Check for specific users
    try {
      const superAdmin = await prisma.user.findUnique({
        where: { email: 'superadmin@saanify.com' }
      });
      
      if (superAdmin) {
        console.log('✅ Super Admin found: superadmin@saanify.com');
        results.superAdmin = { status: '✅ Found', id: superAdmin.id };
      } else {
        console.log('❌ Super Admin not found');
        results.superAdmin = { status: '❌ Missing' };
      }
    } catch (error) {
      console.log(`❌ Super Admin check failed: ${error.message}`);
      results.superAdmin = { status: '❌ Error', error: error.message };
    }
    
    // Check for Demo Client
    try {
      const demoClient = await prisma.user.findUnique({
        where: { email: 'client@saanify.com' }
      });
      
      if (demoClient) {
        console.log('✅ Demo Client found: client@saanify.com');
        results.demoClient = { status: '✅ Found', id: demoClient.id };
      } else {
        console.log('❌ Demo Client not found');
        results.demoClient = { status: '❌ Missing' };
      }
    } catch (error) {
      console.log(`❌ Demo Client check failed: ${error.message}`);
      results.demoClient = { status: '❌ Error', error: error.message };
    }
    
    await prisma.$disconnect();
    
    // Save results
    const fs = require('fs');
    fs.writeFileSync('table-verification-results.json', JSON.stringify(results, null, 2));
    console.log('📊 Verification results saved to table-verification-results.json');
    
    return results;
    
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    await prisma.$disconnect();
    return { error: error.message };
  }
}

// Run verification
verifyTables().then(results => {
  console.log('\n📊 Verification Summary:');
  console.log('========================');
  
  if (results.error) {
    console.log('❌ Verification failed:', results.error);
  } else {
    Object.entries(results).forEach(([name, result]) => {
      if (typeof result === 'object' && result.status) {
        console.log(`${result.status} ${name}`);
      }
    });
    
    const totalTables = Object.keys(results).filter(key => 
      !['superAdmin', 'demoClient'].includes(key)
    ).length;
    
    const workingTables = Object.entries(results).filter(([name, result]) => 
      !['superAdmin', 'demoClient'].includes(name) && result.exists
    ).length;
    
    console.log(`\n📈 Tables: ${workingTables}/${totalTables} working`);
    
    if (workingTables === totalTables && results.superAdmin?.status === '✅ Found') {
      console.log('🎉 All tables verified successfully!');
    } else {
      console.log('⚠️ Some tables may need attention');
    }
  }
}).catch(error => {
  console.error('💥 Verification script failed:', error.message);
});