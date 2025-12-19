#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const tar = require('tar');

// Simple color functions
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`
};

class SimpleRestore {
  constructor() {
    this.projectRoot = process.cwd();
    this.backupDir = path.join(this.projectRoot, 'backups');
    this.tempDir = path.join(this.projectRoot, 'temp-restore');
    
    // Ensure temp directory exists
    this.ensureDirectoryExists(this.tempDir);
  }

  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async restoreFromBackup(backupId) {
    console.log('🔄 Starting restore process...');
    
    try {
      // Find backup
      const backupPath = await this.findBackup(backupId);
      if (!backupPath) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      console.log('📦 Extracting backup...');
      const extractedPath = await this.extractBackup(backupPath);
      
      console.log('📋 Reading backup metadata...');
      const metadata = this.readMetadata(extractedPath);
      
      console.log('✅ Validating backup...');
      await this.validateBackup(metadata);
      
      console.log('📁 Restoring project files...');
      await this.restoreFiles(extractedPath);
      
      console.log('🔧 Installing dependencies...');
      await this.installDependencies();
      
      console.log('🗄️ Setting up database...');
      await this.setupDatabase();
      
      console.log('🧹 Cleaning up...');
      fs.rmSync(extractedPath, { recursive: true, force: true });
      
      console.log(colors.green('✅ Restore completed successfully!'));
      
      // Ask for GitHub token
      await this.configureGitHub();
      
      console.log(colors.blue('🚀 Project is ready to use!'));
      console.log(colors.blue('Run "npm run dev" to start the development server'));
      
    } catch (error) {
      console.error(colors.red('❌ Restore failed:'), error.message);
      throw error;
    }
  }

  async findBackup(backupId) {
    // Try as archive first
    const archivePath = path.join(this.backupDir, `${backupId}.tar.gz`);
    if (fs.existsSync(archivePath)) {
      return archivePath;
    }

    // Try as directory
    const dirPath = path.join(this.backupDir, backupId);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      return dirPath;
    }

    // List available backups
    const availableBackups = await this.listBackups();
    if (availableBackups.length > 0) {
      console.log(colors.yellow('Available backups:'));
      availableBackups.forEach((backup, index) => {
        console.log(`  ${index + 1}. ${colors.green(backup.name)} - ${backup.created.toLocaleString()}`);
      });
    }

    return null;
  }

  async extractBackup(backupPath) {
    const extractId = `restore-${Date.now()}`;
    const extractPath = path.join(this.tempDir, extractId);
    
    if (fs.existsSync(extractPath)) {
      fs.rmSync(extractPath, { recursive: true, force: true });
    }
    
    if (backupPath.endsWith('.tar.gz')) {
      try {
        await tar.extract({
          file: backupPath,
          cwd: this.tempDir,
          strip: 0
        });
      } catch (error) {
        throw new Error(`Failed to extract backup archive: ${error.message}`);
      }
    } else {
      // Copy directory
      this.copyDirectory(backupPath, extractPath);
    }
    
    // Check if files were extracted directly to tempDir or in a subdirectory
    const extractedDirs = fs.readdirSync(this.tempDir).filter(name => 
      name.includes('saanify-backup') || name.includes('restore-')
    );
    
    if (extractedDirs.length > 0) {
      // Files are in a subdirectory
      return path.join(this.tempDir, extractedDirs[0]);
    } else {
      // Files are directly in tempDir, use tempDir as extractedPath
      return this.tempDir;
    }
  }

  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        try {
          fs.copyFileSync(srcPath, destPath);
        } catch (error) {
          // If copy fails, try to delete the destination first
          if (fs.existsSync(destPath)) {
            fs.unlinkSync(destPath);
          }
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
  }

  readMetadata(extractedPath) {
    const metadataPath = path.join(extractedPath, 'backup-metadata.json');
    if (!fs.existsSync(metadataPath)) {
      throw new Error('Invalid backup: metadata not found');
    }
    
    try {
      return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    } catch (error) {
      throw new Error(`Failed to read backup metadata: ${error.message}`);
    }
  }

  async validateBackup(metadata) {
    if (metadata.projectName !== 'saanify-workspace') {
      throw new Error(`Backup project mismatch: expected saanify-workspace, got ${metadata.projectName}`);
    }
    
    console.log(colors.blue(`Restoring backup from: ${new Date(metadata.timestamp).toLocaleString()}`));
    console.log(colors.blue(`Backup version: ${metadata.version}`));
    if (metadata.stats) {
      console.log(colors.blue(`Files: ${metadata.stats.regular || 0} regular, ${metadata.stats.encrypted || 0} encrypted`));
    }
  }

  async restoreFiles(extractedPath) {
    const files = fs.readdirSync(extractedPath, { withFileTypes: true });
    
    for (const file of files) {
      if (file.name === 'backup-metadata.json' || file.name === 'backup-system') {
        continue; // Skip backup system files
      }
      
      const srcPath = path.join(extractedPath, file.name);
      const destPath = path.join(this.projectRoot, file.name);
      
      if (file.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else if (!file.name.endsWith('.encrypted')) {
        // Copy regular file
        this.ensureDirectoryExists(path.dirname(destPath));
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  async installDependencies() {
    if (fs.existsSync('package.json')) {
      try {
        console.log('Running npm install...');
        const { execSync } = require('child_process');
        execSync('npm install', { stdio: 'pipe' });
        console.log(colors.green('✅ Dependencies installed successfully'));
      } catch (error) {
        console.warn(colors.yellow('⚠️ Could not install dependencies automatically'));
        console.log(colors.yellow('Please run "npm install" manually'));
      }
    }
  }

  async setupDatabase() {
    if (fs.existsSync('prisma')) {
      try {
        console.log('Setting up database...');
        const { execSync } = require('child_process');
        execSync('npx prisma generate', { stdio: 'pipe' });
        execSync('npm run db:push', { stdio: 'pipe' });
        console.log(colors.green('✅ Database setup completed'));
      } catch (error) {
        console.warn(colors.yellow('⚠️ Could not setup database automatically'));
        console.log(colors.yellow('Please run "npx prisma generate" and "npm run db:push" manually'));
      }
    }
  }

  async configureGitHub() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('Enter your GitHub token (optional, press Enter to skip): ', (token) => {
        rl.close();
        
        if (token && token.trim()) {
          try {
            // Update .env file with GitHub token
            let envContent = '';
            if (fs.existsSync('.env')) {
              envContent = fs.readFileSync('.env', 'utf8');
            }

            // Update or add GITHUB_TOKEN
            const tokenLine = `GITHUB_TOKEN=${token.trim()}`;
            const tokenRegex = /^GITHUB_TOKEN=.*$/m;
            
            if (tokenRegex.test(envContent)) {
              envContent = envContent.replace(tokenRegex, tokenLine);
            } else {
              envContent += `\n${tokenLine}`;
            }

            fs.writeFileSync('.env', envContent);
            console.log(colors.green('✅ GitHub integration configured successfully'));
            
          } catch (error) {
            console.warn(colors.yellow('⚠️ Could not configure GitHub automatically'));
            console.log(colors.yellow('Please add GITHUB_TOKEN to your .env file manually'));
          }
        } else {
          console.log(colors.blue('Skipping GitHub configuration (no token provided)'));
        }
        
        resolve();
      });
    });
  }

  async listBackups() {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }

    const files = fs.readdirSync(this.backupDir);
    const backups = [];

    for (const file of files) {
      if (file.endsWith('.tar.gz')) {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        
        backups.push({
          name: file.replace('.tar.gz', ''),
          filename: file,
          path: filePath,
          size: stats.size,
          created: stats.birthtime
        });
      }
    }

    return backups.sort((a, b) => b.created - a.created);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const restoreSystem = new SimpleRestore();

  try {
    switch (command) {
      case 'restore':
        if (!args[1]) {
          // List available backups
          const backups = await restoreSystem.listBackups();
          if (backups.length === 0) {
            console.log(colors.yellow('No backups found.'));
            console.log(colors.blue('Create a backup first using: node simple-backup.js create'));
            process.exit(1);
          }

          const readline = require('readline');
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });

          rl.question('Enter the number of the backup to restore: ', (answer) => {
            const index = parseInt(answer) - 1;
            if (index >= 0 && index < backups.length) {
              rl.close();
              restoreSystem.restoreFromBackup(backups[index].name);
            } else {
              console.log(colors.red('Invalid choice'));
              rl.close();
              process.exit(1);
            }
          });
        } else {
          await restoreSystem.restoreFromBackup(args[1]);
        }
        break;

      case 'list':
        const backups = await restoreSystem.listBackups();
        if (backups.length === 0) {
          console.log(colors.yellow('No backups found.'));
          console.log(colors.blue('Create a backup first using: node simple-backup.js create'));
        } else {
          console.log(colors.blue('Available backups:'));
          backups.forEach((backup, index) => {
            console.log(`  ${index + 1}. ${colors.green(backup.name)} - ${backup.created.toLocaleString()}`);
          });
        }
        break;

      default:
        console.log(colors.red('Usage: node simple-restore.js [restore|list] [backup-id]'));
        console.log(colors.blue('Examples:'));
        console.log('  node simple-restore.js list                    # List available backups');
        console.log('  node simple-restore.js restore                 # Interactive restore');
        console.log('  node simple-restore.js restore backup-id        # Restore specific backup');
        process.exit(1);
    }
  } catch (error) {
    console.error(colors.red('Error:'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SimpleRestore;