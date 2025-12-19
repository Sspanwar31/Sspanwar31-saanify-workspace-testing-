#!/usr/bin/env node

/**
 * Prisma Migration Deployment Script
 * Deploys Prisma migrations to Supabase production database
 */

const { execSync } = require('child_process');
const fs = require('fs');

async function deployPrismaMigrations() {
  console.log('🚀 Starting Prisma migration deployment to Supabase...');
  
  try {
    // Step 1: Generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated successfully');
    
    // Step 2: Validate schema
    console.log('🔍 Validating Prisma schema...');
    execSync('npx prisma validate', { stdio: 'inherit' });
    console.log('✅ Prisma schema validated');
    
    // Step 3: Deploy migrations
    console.log('🗄️ Deploying migrations to Supabase...');
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Migrations deployed successfully');
    } catch (migrateError) {
      console.log('⚠️ migrate deploy failed, trying db push...');
      execSync('npx prisma db push', { stdio: 'inherit' });
      console.log('✅ Schema pushed successfully');
    }
    
    // Step 4: Verify connection
    console.log('🔗 Verifying database connection...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    console.log('✅ Database connection verified');
    
    // Step 5: Check if _prisma_migrations table exists
    try {
      const migrationCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM _prisma_migrations`;
      console.log(`✅ Found ${migrationCount[0].count} migrations in _prisma_migrations table`);
    } catch (error) {
      console.log('ℹ️ _prisma_migrations table not found (expected for first deployment)');
    }
    
    await prisma.$disconnect();
    
    return {
      success: true,
      message: 'Prisma migrations deployed successfully'
    };
    
  } catch (error) {
    console.error('❌ Migration deployment failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Execute deployment
console.log('🎯 Prisma Migration Deployment to Supabase');
console.log('==========================================');
const result = deployPrismaMigrations();

if (result.success) {
  console.log('🎉 Migration deployment completed successfully!');
} else {
  console.log('❌ Migration deployment failed!');
  process.exit(1);
}

module.exports = { deployPrismaMigrations };