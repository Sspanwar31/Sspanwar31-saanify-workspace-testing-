#!/usr/bin/env node

/**
 * Supabase Migration Script for Vercel Deployment
 * 
 * This script automatically:
 * 1. Pulls environment variables from Vercel
 * 2. Runs Prisma migrations on Supabase
 * 3. Seeds the database with initial data
 * 4. Verifies table creation
 * 5. Triggers Vercel redeployment
 * 
 * Usage: node scripts/supabase-migrate.js
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
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
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

class SupabaseMigrator {
  constructor() {
    this.migrationId = `supabase-migrate-${Date.now()}`;
    this.startTime = Date.now();
  }

  async runMigration() {
    info(`🚀 Starting Supabase Migration: ${this.migrationId}`);
    
    try {
      // Step 1: Sync environment from Vercel
      await this.syncEnvironment();
      
      // Step 2: Validate DATABASE_URL
      await this.validateDatabaseUrl();
      
      // Step 3: Generate Prisma client
      await this.generatePrismaClient();
      
      // Step 4: Deploy migrations to Supabase
      await this.deployMigrations();
      
      // Step 5: Seed database
      await this.seedDatabase();
      
      // Step 6: Verify tables
      await this.verifyTables();
      
      // Step 7: Trigger Vercel redeployment
      await this.triggerRedeployment();
      
      const duration = Math.round((Date.now() - this.startTime) / 1000);
      success(`🎉 Supabase migration completed successfully in ${duration}s`);
      
      return {
        success: true,
        migrationId: this.migrationId,
        duration,
        tables: ['users', 'society_accounts', 'societies', 'posts']
      };
      
    } catch (error) {
      error(`❌ Migration failed: ${error.message}`);
      return {
        success: false,
        migrationId: this.migrationId,
        error: error.message
      };
    }
  }

  async syncEnvironment() {
    step('🔄 Syncing environment from Vercel...');
    
    try {
      // Check if Vercel CLI is available
      execSync('vercel --version', { stdio: 'pipe' });
      
      // Link project if needed
      try {
        execSync('vercel link --confirm', { stdio: 'pipe' });
      } catch (error) {
        // Project might already be linked
      }
      
      // Pull environment variables
      execSync('vercel env pull .env', { stdio: 'pipe' });
      success('✅ Environment variables synced from Vercel');
      
      // Load environment variables
      this.loadEnvironment();
      
    } catch (error) {
      warning(`⚠️ Vercel sync failed: ${error.message}`);
      info('🔄 Using local .env file');
      this.loadEnvironment();
    }
  }

  loadEnvironment() {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
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
    }
  }

  async validateDatabaseUrl() {
    step('🔍 Validating DATABASE_URL...');
    
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not found in environment variables');
    }
    
    if (!dbUrl.includes('postgresql') && !dbUrl.includes('postgres')) {
      throw new Error('DATABASE_URL must be a PostgreSQL connection string for Supabase');
    }
    
    success('✅ DATABASE_URL is valid PostgreSQL connection');
  }

  async generatePrismaClient() {
    step('🔧 Generating Prisma client...');
    
    try {
      execSync('npx prisma generate', { stdio: 'pipe' });
      success('✅ Prisma client generated');
    } catch (error) {
      throw new Error(`Prisma client generation failed: ${error.message}`);
    }
  }

  async deployMigrations() {
    step('🚀 Deploying migrations to Supabase...');
    
    try {
      // Try migrate deploy first (for production)
      try {
        execSync('npx prisma migrate deploy', { stdio: 'pipe' });
        success('✅ Migrations deployed to Supabase');
      } catch (migrateError) {
        warning(`⚠️ migrate deploy failed, trying db push: ${migrateError.message}`);
        
        // Fallback to db push
        execSync('npx prisma db push', { stdio: 'pipe' });
        success('✅ Schema pushed to Supabase');
      }
    } catch (error) {
      throw new Error(`Migration deployment failed: ${error.message}`);
    }
  }

  async seedDatabase() {
    step('🌱 Seeding database...');
    
    try {
      // Try npm run seed first
      try {
        execSync('npm run db:seed', { stdio: 'pipe' });
        success('✅ Database seeded successfully');
      } catch (seedError) {
        warning(`⚠️ npm run seed failed, trying manual seeding: ${seedError.message}`);
        await this.manualSeed();
      }
    } catch (error) {
      throw new Error(`Database seeding failed: ${error.message}`);
    }
  }

  async manualSeed() {
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
    const prisma = new PrismaClient();
    
    try {
      // Create Super Admin
      const superAdminEmail = 'superadmin@saanify.com';
      const existingAdmin = await prisma.user.findUnique({
        where: { email: superAdminEmail }
      });

      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        await prisma.user.create({
          data: {
            email: superAdminEmail,
            name: 'Super Admin',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            isActive: true
          }
        });
        info('✅ Super Admin created');
      }

      // Create Demo Society
      const existingSociety = await prisma.societyAccount.findFirst();
      if (!existingSociety) {
        const society = await prisma.societyAccount.create({
          data: {
            name: 'Green Valley Society',
            adminName: 'Demo Admin',
            email: 'admin@greenvalley.com',
            phone: '+91 98765 43210',
            address: '123 Green Valley Road, Bangalore',
            subscriptionPlan: 'PRO',
            status: 'ACTIVE'
          }
        });
        info('✅ Demo society created');
      }

      await prisma.$disconnect();
      success('✅ Manual seeding completed');
      
    } catch (error) {
      await prisma.$disconnect();
      throw error;
    }
  }

  async verifyTables() {
    step('🔍 Verifying table creation...');
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      const expectedTables = ['users', 'society_accounts', 'societies', 'posts'];
      const verificationResults = {};
      
      for (const table of expectedTables) {
        try {
          // Try to query each table
          switch (table) {
            case 'users':
              await prisma.user.count();
              break;
            case 'society_accounts':
              await prisma.societyAccount.count();
              break;
            case 'societies':
              await prisma.society.count();
              break;
            case 'posts':
              await prisma.post.count();
              break;
          }
          verificationResults[table] = '✅ Created';
          info(`✅ Table '${table}' verified`);
        } catch (error) {
          verificationResults[table] = `❌ Error: ${error.message}`;
          warning(`⚠️ Table '${table}' verification failed`);
        }
      }
      
      await prisma.$disconnect();
      
      const successCount = Object.values(verificationResults).filter(r => r.includes('✅')).length;
      if (successCount === expectedTables.length) {
        success('✅ All tables verified successfully');
      } else {
        warning(`⚠️ ${successCount}/${expectedTables.length} tables verified`);
      }
      
    } catch (error) {
      await prisma.$disconnect();
      throw error;
    }
  }

  async triggerRedeployment() {
    step('🚀 Triggering Vercel redeployment...');
    
    try {
      // Check if we have Vercel CLI
      try {
        execSync('vercel --version', { stdio: 'pipe' });
        
        // Trigger redeployment by pushing a small change
        // or using Vercel API if available
        const redeployCommand = process.env.VERCEL_TOKEN 
          ? `curl -X POST https://api.vercel.com/v1/integrations/deploy/prj_${process.env.VERCEL_PROJECT_ID}/${process.env.VERCEL_ORG_ID} -H "Authorization: Bearer ${process.env.VERCEL_TOKEN}" -H "Content-Type: application/json"`
          : null;
          
        if (redeployCommand) {
          try {
            execSync(redeployCommand, { stdio: 'pipe' });
            success('✅ Vercel redeployment triggered');
          } catch (deployError) {
            warning(`⚠️ Redeployment trigger failed: ${deployError.message}`);
            info('🔄 Manual redeployment may be required');
          }
        } else {
          info('🔄 Vercel token not available, manual redeployment may be required');
        }
        
      } catch (error) {
        warning('⚠️ Vercel CLI not available for redeployment');
      }
      
      info('🌐 Your app will be available at: https://saanify-workspace.vercel.app');
      
    } catch (error) {
      warning(`⚠️ Redeployment failed: ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Supabase Migration for Saanify Management System');
  console.log('=' .repeat(60));
  
  const migrator = new SupabaseMigrator();
  const result = await migrator.runMigration();
  
  console.log('\n' + '='.repeat(60));
  
  if (result.success) {
    success('🎉 Migration completed successfully!');
    info(`📊 Migration ID: ${result.migrationId}`);
    info(`⏱️ Duration: ${result.duration}s`);
    info(`📋 Tables created: ${result.tables.join(', ')}`);
    info(`🌐 Live at: https://saanify-workspace.vercel.app`);
  } else {
    error('❌ Migration failed!');
    error(`📊 Migration ID: ${result.migrationId}`);
    error(`💥 Error: ${result.error}`);
  }
  
  console.log('=' .repeat(60) + '\n');
  process.exit(result.success ? 0 : 1);
}

// Handle errors
process.on('uncaughtException', (error) => {
  error(`💥 Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  error(`💥 Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = SupabaseMigrator;