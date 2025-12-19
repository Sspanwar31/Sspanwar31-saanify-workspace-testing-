#!/usr/bin/env node

/**
 * GLM Restore Script - Recovery & Rollback System
 * 
 * This script handles:
 * - Database restoration from backups
 * - Environment variable restoration
 * - Code rollback
 * - Complete system recovery
 * 
 * Usage: npm run restore:glm
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Configuration
const config = {
  logsDir: 'logs',
  backupsDir: 'backups',
  envFile: '.env',
  timestamp: new Date().toISOString().replace(/[:.]/g, '-'),
  restoreId: `restore-${Date.now()}`,
  maxRetries: 3,
  retryDelay: 2000
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Logger utility
class Logger {
  constructor(restoreId) {
    this.restoreId = restoreId;
    this.logFile = path.join(config.logsDir, `restore-${config.timestamp}.log`);
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(config.logsDir)) {
      fs.mkdirSync(config.logsDir, { recursive: true });
    }
  }

  log(message, level = 'INFO', color = 'reset') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    
    // Console output
    console.log(`${colors[color]}${logEntry}${colors.reset}`);
    
    // File output
    try {
      fs.appendFileSync(this.logFile, logEntry + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  info(message) { this.log(message, 'INFO', 'blue'); }
  success(message) { this.log(message, 'SUCCESS', 'green'); }
  warning(message) { this.log(message, 'WARNING', 'yellow'); }
  error(message) { this.log(message, 'ERROR', 'red'); }
  step(message) { this.log(message, 'STEP', 'cyan'); }
}

// Backup discovery utility
class BackupDiscovery {
  constructor(logger) {
    this.logger = logger;
  }

  listAvailableBackups() {
    this.logger.step('Discovering available backups...');
    
    try {
      if (!fs.existsSync(config.backupsDir)) {
        this.logger.warning('No backups directory found');
        return [];
      }

      const backupDirs = fs.readdirSync(config.backupsDir)
        .filter(dir => {
          const fullPath = path.join(config.backupsDir, dir);
          return fs.statSync(fullPath).isDirectory();
        })
        .map(dir => {
          const fullPath = path.join(config.backupsDir, dir);
          const stats = fs.statSync(fullPath);
          return {
            name: dir,
            path: fullPath,
            timestamp: stats.mtime,
            size: this.calculateDirSize(fullPath)
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp);

      this.logger.success(`Found ${backupDirs.length} backup(s)`);
      return backupDirs;
    } catch (error) {
      this.logger.error(`Backup discovery failed: ${error.message}`);
      return [];
    }
  }

  calculateDirSize(dirPath) {
    try {
      let totalSize = 0;
      const files = fs.readdirSync(dirPath);
      
      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          totalSize += this.calculateDirSize(filePath);
        } else {
          totalSize += stats.size;
        }
      });
      
      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  selectBestBackup(backupDirs) {
    if (backupDirs.length === 0) {
      throw new Error('No backups available for restoration');
    }

    // Select the most recent backup
    const bestBackup = backupDirs[0];
    this.logger.info(`Selected backup: ${bestBackup.name} (${new Date(bestBackup.timestamp).toISOString()})`);
    
    return bestBackup;
  }

  validateBackup(backupPath) {
    this.logger.step('Validating backup integrity...');
    
    try {
      const manifestFile = path.join(backupPath, 'manifest.json');
      
      if (!fs.existsSync(manifestFile)) {
        throw new Error('Backup manifest not found');
      }

      const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
      
      // Check if all files exist
      const missingFiles = manifest.files.filter(file => 
        !fs.existsSync(path.join(backupPath, file))
      );

      if (missingFiles.length > 0) {
        throw new Error(`Missing backup files: ${missingFiles.join(', ')}`);
      }

      // Verify checksum if available
      if (manifest.checksum) {
        const currentChecksum = this.calculateChecksum(backupPath);
        if (currentChecksum !== manifest.checksum) {
          throw new Error('Backup checksum mismatch - backup may be corrupted');
        }
      }

      this.logger.success('Backup validation completed');
      return manifest;
    } catch (error) {
      this.logger.error(`Backup validation failed: ${error.message}`);
      throw error;
    }
  }

  calculateChecksum(backupPath) {
    try {
      const files = fs.readdirSync(backupPath);
      const hash = crypto.createHash('sha256');
      
      files.forEach(file => {
        const filePath = path.join(backupPath, file);
        const content = fs.readFileSync(filePath);
        hash.update(content);
      });
      
      return hash.digest('hex');
    } catch (error) {
      return null;
    }
  }
}

// Environment restoration utility
class EnvironmentRestorer {
  constructor(logger) {
    this.logger = logger;
  }

  async restoreEnvironment(backupPath) {
    this.logger.step('Restoring environment variables...');
    
    try {
      const envBackupFile = path.join(backupPath, 'environment.json');
      
      if (!fs.existsSync(envBackupFile)) {
        this.logger.warning('Environment backup not found, skipping');
        return false;
      }

      const envBackup = JSON.parse(fs.readFileSync(envBackupFile, 'utf8'));
      
      // Create new .env file
      let envContent = '# Restored from backup on ' + new Date().toISOString() + '\n';
      envContent += '# Backup ID: ' + envBackup.deployId + '\n\n';
      
      Object.entries(envBackup.variables).forEach(([key, value]) => {
        envContent += `${key}=${value}\n`;
      });

      // Backup current .env if it exists
      if (fs.existsSync(config.envFile)) {
        const backupEnvFile = `${config.envFile}.backup.${Date.now()}`;
        fs.copyFileSync(config.envFile, backupEnvFile);
        this.logger.info(`Current .env backed up to: ${backupEnvFile}`);
      }

      // Write restored environment
      fs.writeFileSync(config.envFile, envContent);
      
      this.logger.success('Environment variables restored');
      return true;
    } catch (error) {
      this.logger.error(`Environment restoration failed: ${error.message}`);
      return false;
    }
  }
}

// Database restoration utility
class DatabaseRestorer {
  constructor(logger) {
    this.logger = logger;
  }

  async restoreDatabase(backupPath) {
    this.logger.step('Restoring database...');
    
    try {
      const dbBackupFile = path.join(backupPath, 'database.json');
      const schemaFile = path.join(backupPath, 'schema.prisma');
      
      if (!fs.existsSync(dbBackupFile)) {
        this.logger.warning('Database backup not found, skipping');
        return false;
      }

      // Restore schema if available
      if (fs.existsSync(schemaFile)) {
        if (fs.existsSync('prisma/schema.prisma')) {
          const backupSchema = `prisma/schema.prisma.backup.${Date.now()}`;
          fs.copyFileSync('prisma/schema.prisma', backupSchema);
          this.logger.info(`Current schema backed up to: ${backupSchema}`);
        }
        
        fs.copyFileSync(schemaFile, 'prisma/schema.prisma');
        this.logger.info('Database schema restored');
      }

      // Restore data
      const dbBackup = JSON.parse(fs.readFileSync(dbBackupFile, 'utf8'));
      
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      try {
        // Clear existing data (be careful with foreign key constraints)
        this.logger.info('Clearing existing database data...');
        
        await prisma.user.deleteMany({});
        await prisma.societyAccount.deleteMany({});

        // Restore societies
        if (dbBackup.tables?.societies) {
          for (const society of dbBackup.tables.societies) {
            await prisma.societyAccount.create({
              data: {
                id: society.id,
                name: society.name,
                adminName: society.adminName,
                email: society.email,
                phone: society.phone,
                address: society.address,
                subscriptionPlan: society.subscriptionPlan,
                status: society.status,
                trialEndsAt: society.trialEndsAt ? new Date(society.trialEndsAt) : null,
                subscriptionEndsAt: society.subscriptionEndsAt ? new Date(society.subscriptionEndsAt) : null,
                isActive: society.isActive,
                createdAt: new Date(society.createdAt),
                updatedAt: new Date(society.updatedAt)
              }
            });
          }
          this.logger.info(`Restored ${dbBackup.tables.societies.length} societies`);
        }

        // Restore users
        if (dbBackup.tables?.users) {
          for (const user of dbBackup.tables.users) {
            await prisma.user.create({
              data: {
                id: user.id,
                email: user.email,
                name: user.name,
                password: user.password,
                role: user.role,
                isActive: user.isActive,
                lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
                societyAccountId: user.societyAccountId,
                createdAt: new Date(user.createdAt),
                updatedAt: new Date(user.updatedAt)
              }
            });
          }
          this.logger.info(`Restored ${dbBackup.tables.users.length} users`);
        }

        await prisma.$disconnect();
        this.logger.success('Database restoration completed');
        return true;
      } catch (dbError) {
        await prisma.$disconnect();
        throw dbError;
      }
    } catch (error) {
      this.logger.error(`Database restoration failed: ${error.message}`);
      return false;
    }
  }

  async regeneratePrismaClient() {
    this.logger.step('Regenerating Prisma client...');
    
    try {
      execSync('npx prisma generate', { stdio: 'pipe' });
      execSync('npx prisma db push', { stdio: 'pipe' });
      
      this.logger.success('Prisma client regenerated');
      return true;
    } catch (error) {
      this.logger.error(`Prisma client regeneration failed: ${error.message}`);
      return false;
    }
  }
}

// Code restoration utility
class CodeRestorer {
  constructor(logger) {
    this.logger = logger;
  }

  async restoreCode(backupPath) {
    this.logger.step('Restoring code files...');
    
    try {
      const codeBackupFile = path.join(backupPath, 'code.json');
      
      if (!fs.existsSync(codeBackupFile)) {
        this.logger.warning('Code backup not found, skipping');
        return false;
      }

      const codeBackup = JSON.parse(fs.readFileSync(codeBackupFile, 'utf8'));
      
      // Restore each file
      Object.entries(codeBackup.files).forEach(([fileName, content]) => {
        if (fs.existsSync(fileName)) {
          const backupFile = `${fileName}.backup.${Date.now()}`;
          fs.copyFileSync(fileName, backupFile);
          this.logger.info(`Current ${fileName} backed up to: ${backupFile}`);
        }
        
        fs.writeFileSync(fileName, content);
        this.logger.info(`Restored ${fileName}`);
      });

      this.logger.success('Code files restored');
      return true;
    } catch (error) {
      this.logger.error(`Code restoration failed: ${error.message}`);
      return false;
    }
  }
}

// Main restoration class
class GLMRestorer {
  constructor() {
    this.logger = new Logger(config.restoreId);
    this.backupDiscovery = new BackupDiscovery(this.logger);
    this.envRestorer = new EnvironmentRestorer(this.logger);
    this.dbRestorer = new DatabaseRestorer(this.logger);
    this.codeRestorer = new CodeRestorer(this.logger);
  }

  async restore(backupPath = null) {
    const startTime = Date.now();
    
    this.logger.info(`🔄 Starting GLM Restoration: ${config.restoreId}`);
    this.logger.info(`Timestamp: ${config.timestamp}`);

    try {
      // Step 1: Discover and select backup
      const selectedBackup = await this.selectBackup(backupPath);

      // Step 2: Validate backup
      const manifest = await this.validateBackup(selectedBackup.path);

      // Step 3: Restore environment
      await this.restoreEnvironment(selectedBackup.path);

      // Step 4: Restore database
      await this.restoreDatabase(selectedBackup.path);

      // Step 5: Restore code (optional)
      await this.restoreCode(selectedBackup.path);

      // Step 6: Final verification
      await this.finalVerification();

      const duration = Math.round((Date.now() - startTime) / 1000);
      this.logger.success(`🎉 Restoration completed successfully in ${duration}s`);
      
      return {
        success: true,
        restoreId: config.restoreId,
        duration,
        backupPath: selectedBackup.path,
        backupTimestamp: manifest.timestamp
      };

    } catch (error) {
      this.logger.error(`❌ Restoration failed: ${error.message}`);
      
      return {
        success: false,
        restoreId: config.restoreId,
        error: error.message
      };
    }
  }

  async selectBackup(backupPath) {
    if (backupPath) {
      // Use provided backup path
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Specified backup path does not exist: ${backupPath}`);
      }
      
      this.logger.info(`Using specified backup: ${backupPath}`);
      return { path: backupPath, name: path.basename(backupPath) };
    } else {
      // Auto-select best backup
      const availableBackups = this.backupDiscovery.listAvailableBackups();
      return this.backupDiscovery.selectBestBackup(availableBackups);
    }
  }

  async validateBackup(backupPath) {
    return this.backupDiscovery.validateBackup(backupPath);
  }

  async restoreEnvironment(backupPath) {
    if (!await this.envRestorer.restoreEnvironment(backupPath)) {
      this.logger.warning('Environment restoration failed, but continuing...');
    }
  }

  async restoreDatabase(backupPath) {
    if (!await this.dbRestorer.restoreDatabase(backupPath)) {
      throw new Error('Database restoration failed');
    }
    
    if (!await this.dbRestorer.regeneratePrismaClient()) {
      throw new Error('Prisma client regeneration failed');
    }
  }

  async restoreCode(backupPath) {
    if (!await this.codeRestorer.restoreCode(backupPath)) {
      this.logger.warning('Code restoration failed, but continuing...');
    }
  }

  async finalVerification() {
    this.logger.step('Running final verification...');
    
    try {
      // Test database connection
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const userCount = await prisma.user.count();
      const societyCount = await prisma.societyAccount.count();
      
      await prisma.$disconnect();
      
      this.logger.info(`Database verification: ${userCount} users, ${societyCount} societies`);
      
      // Test API health (if server is running)
      try {
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : 'http://localhost:3000';
        
        const response = await fetch(`${baseUrl}/api/health`);
        if (response.ok) {
          this.logger.success('API health check passed');
        } else {
          this.logger.warning('API health check failed');
        }
      } catch (error) {
        this.logger.info('API health check skipped (server not running)');
      }

      this.logger.success('Final verification completed');
    } catch (error) {
      this.logger.warning(`Final verification failed: ${error.message}`);
    }
  }
}

// Interactive backup selection
async function selectBackupInteractively() {
  const discovery = new BackupDiscovery({ info: () => {}, warning: () => {}, error: () => {} });
  const backups = discovery.listAvailableBackups();
  
  if (backups.length === 0) {
    console.log('❌ No backups available');
    process.exit(1);
  }

  console.log('\n📦 Available Backups:');
  backups.forEach((backup, index) => {
    console.log(`${index + 1}. ${backup.name} (${new Date(backup.timestamp).toLocaleString()})`);
  });

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('\nSelect backup number (or press Enter for latest): ', (answer) => {
      rl.close();
      
      if (!answer || answer.trim() === '') {
        resolve(backups[0].path);
      } else {
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < backups.length) {
          resolve(backups[index].path);
        } else {
          console.log('❌ Invalid selection');
          process.exit(1);
        }
      }
    });
  });
}

// Retry utility
async function retry(fn, maxRetries = config.maxRetries, delay = config.retryDelay) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const backupPath = args[0]; // Optional: specific backup path

  try {
    // If no backup path provided, show interactive selection
    const selectedBackupPath = backupPath || await selectBackupInteractively();
    
    const restorer = new GLMRestorer();
    const result = await retry(() => restorer.restore(selectedBackupPath));
    
    if (result.success) {
      console.log('\n🎉 Restoration completed successfully!');
      console.log(`📁 Backup used: ${result.backupPath}`);
      console.log(`📅 Backup timestamp: ${result.backupTimestamp}`);
      console.log(`⏱️ Duration: ${result.duration}s`);
      console.log(`🆔 Restore ID: ${result.restoreId}`);
      console.log('\n🔄 You can now restart your application');
      process.exit(0);
    } else {
      console.log('\n❌ Restoration failed!');
      console.log(`❌ Error: ${result.error}`);
      console.log(`🆔 Restore ID: ${result.restoreId}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Critical error:', error.message);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection:', reason);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { GLMRestorer, BackupDiscovery, EnvironmentRestorer, DatabaseRestorer, CodeRestorer };