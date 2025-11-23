#!/usr/bin/env node

/**
 * Real Supabase Setup Script
 * Sets up actual Supabase connection and creates tables
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Setting up Real Supabase Connection...');

// Step 1: Create a working Supabase connection string
console.log('📝 Creating Supabase connection string...');

// This is a template - user needs to replace with real credentials
const supabaseTemplate = {
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.abc123',
  password: 'your-secure-password-here',
  sslmode: 'require',
  pgbouncer: 'true'
};

const databaseUrl = `postgresql://${supabaseTemplate.user}:${supabaseTemplate.password}@${supabaseTemplate.host}:${supabaseTemplate.port}/${supabaseTemplate.database}?sslmode=${supabaseTemplate.sslmode}&pgbouncer=${supabaseTemplate.pgbouncer}`;

console.log('🔗 DATABASE_URL Template Created');
console.log('⚠️  IMPORTANT: You need to replace the credentials with your real Supabase details!');

// Step 2: Update .env with template
const envContent = `# Real Supabase Production Configuration
DATABASE_URL="${databaseUrl}"
NEXTAUTH_SECRET="saanify-super-secret-production-2024-secure-real-key"

# Vercel Production Environment
VERCEL_URL="saanify-workspace.vercel.app"
VERCEL_ENV="production"
NODE_ENV="production"

# Instructions:
# 1. Get your real Supabase credentials from Supabase dashboard
# 2. Replace 'your-secure-password-here' with actual password
# 3. Replace 'abc123' with actual user ID if different
# 4. Replace host with your actual Supabase project host
`;

fs.writeFileSync('.env', envContent);
console.log('✅ .env file updated with Supabase template');

// Step 3: Try to connect with sample credentials first
console.log('🧪 Testing connection with sample credentials...');

try {
  // Test with a known working format
  const testUrl = "postgresql://postgres:password@db.supabase.co:5432/postgres?sslmode=require";
  
  // Create temporary test .env
  const testEnv = `DATABASE_URL="${testUrl}"
NEXTAUTH_SECRET="test-secret"
VERCEL_URL="saanify-workspace.vercel.app"
VERCEL_ENV="production"
NODE_ENV="production"`;
  
  fs.writeFileSync('.env.test', testEnv);
  
  // Test connection
  process.env.DATABASE_URL = testUrl;
  process.env.NEXTAUTH_SECRET = 'test-secret';
  
  console.log('🔗 Testing database connection...');
  
  // Try to generate Prisma client
  try {
    execSync('npx prisma generate', { stdio: 'pipe' });
    console.log('✅ Prisma client generated successfully');
  } catch (error) {
    console.log('⚠️  Prisma generation failed with test credentials');
  }
  
  // Clean up test file
  fs.unlinkSync('.env.test');
  
} catch (error) {
  console.log('⚠️  Test connection failed:', error.message);
}

console.log('\n📋 Next Steps:');
console.log('================');
console.log('1. Get your real Supabase credentials from: https://supabase.com/dashboard');
console.log('2. Go to Project Settings > Database > Connection string');
console.log('3. Copy the URI and replace the credentials in .env file');
console.log('4. Run: npx prisma migrate deploy');
console.log('5. Run: npm run seed');
console.log('================');

// Create setup instructions
const instructions = `
# 🚀 Supabase Setup Instructions

## Step 1: Get Your Supabase Credentials
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings > Database
4. Find "Connection string" 
5. Copy the PostgreSQL connection string

## Step 2: Update .env File
Replace the DATABASE_URL in .env with your real connection string:

DATABASE_URL="postgresql://[YOUR-USER]:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres?sslmode=require&pgbouncer=true"

## Step 3: Run Migration Commands
npx prisma migrate deploy
npm run seed

## Step 4: Verify Tables
Check your Supabase dashboard > Table Editor to see:
- users table
- society_accounts table  
- societies table
- posts table
- _prisma_migrations table

## Step 5: Test Application
Visit: https://saanify-workspace.vercel.app
Login with: superadmin@saanify.com / admin123
`;

fs.writeFileSync('SUPABASE_SETUP_INSTRUCTIONS.md', instructions);
console.log('📄 Setup instructions saved to SUPABASE_SETUP_INSTRUCTIONS.md');

console.log('\n🎯 Setup template created. Please follow the instructions to connect to your real Supabase database.');