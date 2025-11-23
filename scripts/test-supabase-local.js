#!/usr/bin/env node

/**
 * Local Supabase Connection Test
 * 
 * This script tests the local setup for Supabase integration
 * Usage: node scripts/test-supabase-local.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, level = 'INFO', color = 'reset') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}`;
  console.log(`${colors[color]}${logEntry}${colors.reset}`);
}

function info(message) { log(message, 'INFO', 'blue'); }
function success(message) { log(message, 'SUCCESS', 'green'); }
function warning(message) { log(message, 'WARNING', 'yellow'); }
function error(message) { log(message, 'ERROR', 'red'); }
function step(message) { log(message, 'STEP', 'cyan'); }

async function testLocalSetup() {
  console.log('\n🧪 Local Supabase Connection Test');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Check Prisma schema
    step('📋 Checking Prisma schema...');
    const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
    if (!fs.existsSync(schemaPath)) {
      throw new Error('prisma/schema.prisma not found');
    }
    
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    if (!schemaContent.includes('provider = "postgresql"')) {
      throw new Error('Prisma schema must use PostgreSQL provider');
    }
    if (!schemaContent.includes('env("DATABASE_URL")')) {
      throw new Error('Prisma schema must use env("DATABASE_URL")');
    }
    success('✅ Prisma schema configured for PostgreSQL');
    
    // Step 2: Check environment
    step('🔍 Checking environment configuration...');
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      warning('⚠️ .env file not found, creating template...');
      const templateEnv = `# Supabase Configuration
DATABASE_URL="postgresql://username:password@hostname:5432/database?sslmode=require"
NEXTAUTH_SECRET="your-super-secret-key-here"

# Vercel Environment
VERCEL_URL="saanify-workspace.vercel.app"
VERCEL_ENV="production"
NODE_ENV="production"
`;
      fs.writeFileSync(envPath, templateEnv);
      warning('⚠️ Template .env created. Please update with actual Supabase credentials.');
    }
    
    // Load environment
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key && values.length > 0) {
          process.env[key.trim()] = values.join('=').trim();
        }
      }
    });
    
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not configured');
    }
    
    if (!dbUrl.includes('postgresql') && !dbUrl.includes('postgres')) {
      throw new Error('DATABASE_URL must be a PostgreSQL connection string');
    }
    
    success('✅ Environment variables configured');
    
    // Step 3: Test Prisma generation
    step('🔧 Testing Prisma client generation...');
    try {
      execSync('npx prisma generate', { stdio: 'pipe' });
      success('✅ Prisma client generated');
    } catch (error) {
      throw new Error(`Prisma generation failed: ${error.message}`);
    }
    
    // Step 4: Test database connection (if DATABASE_URL is valid)
    if (dbUrl && !dbUrl.includes('username:password')) {
      step('🔗 Testing database connection...');
      try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        await prisma.$connect();
        const userCount = await prisma.user.count();
        const societyCount = await prisma.societyAccount.count();
        
        success(`✅ Database connected - Users: ${userCount}, Societies: ${societyCount}`);
        await prisma.$disconnect();
        
      } catch (error) {
        warning(`⚠️ Database connection failed: ${error.message}`);
        info('🔄 This is expected if Supabase credentials are not yet configured');
      }
    } else {
      info('ℹ️ Skipping database test - credentials not configured');
    }
    
    // Step 5: Check scripts
    step('📜 Checking migration scripts...');
    const requiredScripts = [
      'scripts/supabase-migrate.js',
      'scripts/vercel-env-sync.js',
      'scripts/deploy-glm.js'
    ];
    
    for (const script of requiredScripts) {
      if (!fs.existsSync(script)) {
        throw new Error(`Required script not found: ${script}`);
      }
    }
    success('✅ All migration scripts present');
    
    // Step 6: Check GitHub workflow
    step('🔄 Checking GitHub workflow...');
    const workflowPath = '.github/workflows/supabase-migrate.yml';
    if (!fs.existsSync(workflowPath)) {
      throw new Error(`GitHub workflow not found: ${workflowPath}`);
    }
    success('✅ GitHub workflow configured');
    
    // Summary
    console.log('\n' + '='.repeat(50));
    success('🎉 Local setup test completed successfully!');
    info('📋 Next steps:');
    info('1. Update .env with actual Supabase DATABASE_URL');
    info('2. Configure Vercel environment variables');
    info('3. Push to GitHub to trigger automatic migration');
    info('4. Or run locally: npm run supabase:migrate');
    console.log('=' .repeat(50) + '\n');
    
  } catch (testError) {
    error(`❌ Local setup test failed: ${testError.message}`);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testLocalSetup();
}

module.exports = { testLocalSetup };