#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const tar = require('tar');
const crypto = require('crypto');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');

const EncryptionManager = require('../utils/encryption');
const FileFilter = require('../utils/fileFilter');

class BackupSystem {
  constructor() {
    this.configPath = path.join(__dirname, '../config/backup-config.json');
    this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    this.encryption = new EncryptionManager();
    this.fileFilter = new FileFilter(this.config);
    this.backupDir = path.join(process.cwd(), this.config.storage.local.path);
    this.tempDir = path.join(__dirname, '../temp');
    
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async createBackup(options = {}) {
    const spinner = ora('Creating backup...').start();
    
    try {
      // Generate backup ID
      const backupId = this.generateBackupId();
      const backupPath = path.join(this.tempDir, backupId);
      
      if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
      }

      spinner.text = 'Analyzing project files...';
      const filteredFiles = await this.fileFilter.buildFileList();
      
      spinner.text = 'Processing GitHub routes...';
      const processedFiles = this.fileFilter.processGitHubRoutes(filteredFiles.regular);
      
      spinner.text = 'Encrypting sensitive files...';
      const encryptedFiles = await this.encryptFiles(filteredFiles.encrypted, backupPath);
      
      spinner.text = 'Copying project files...';
      await this.copyFiles(processedFiles, backupPath);
      
      spinner.text = 'Creating backup metadata...';
      await this.createMetadata(backupId, backupPath, {
        regular: processedFiles.length,
        encrypted: encryptedFiles.length
      });
      
      if (this.config.compression.enabled) {
        spinner.text = 'Compressing backup...';
        const archivePath = await this.createArchive(backupId, backupPath);
        
        // Cleanup temp directory
        fs.rmSync(backupPath, { recursive: true, force: true });
        
        spinner.succeed(`Backup created: ${chalk.green(archivePath)}`);
        return archivePath;
      } else {
        const finalPath = await this.moveBackup(backupId, backupPath);
        spinner.succeed(`Backup created: ${chalk.green(finalPath)}`);
        return finalPath;
      }
      
    } catch (error) {
      spinner.fail(`Backup failed: ${error.message}`);
      throw error;
    }
  }

  async encryptFiles(files, backupPath) {
    const encryptedFiles = [];
    
    for (const file of files) {
      try {
        const relativePath = path.relative(process.cwd(), file);
        const encryptedPath = path.join(backupPath, relativePath + '.encrypted');
        
        // Ensure directory exists
        const encryptedDir = path.dirname(encryptedPath);
        if (!fs.existsSync(encryptedDir)) {
          fs.mkdirSync(encryptedDir, { recursive: true });
        }
        
        // Encrypt and save
        const content = fs.readFileSync(file, 'utf8');
        const encrypted = this.encryption.encrypt(content);
        fs.writeFileSync(encryptedPath, JSON.stringify(encrypted, null, 2));
        
        encryptedFiles.push(encryptedPath);
      } catch (error) {
        console.warn(`Warning: Could not encrypt ${file}: ${error.message}`);
      }
    }
    
    return encryptedFiles;
  }

  async copyFiles(files, backupPath) {
    for (const file of files) {
      try {
        const relativePath = path.relative(process.cwd(), file);
        const targetPath = path.join(backupPath, relativePath);
        
        // Ensure directory exists
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // Copy file
        fs.copyFileSync(file, targetPath);
      } catch (error) {
        console.warn(`Warning: Could not copy ${file}: ${error.message}`);
      }
    }
  }

  async createMetadata(backupId, backupPath, stats) {
    const metadata = {
      id: backupId,
      projectName: this.config.projectName,
      version: this.config.version,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      stats,
      config: {
        ...this.config,
        storage: undefined // Don't include storage config in backup
      }
    };
    
    fs.writeFileSync(
      path.join(backupPath, 'backup-metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
  }

  async createArchive(backupId, backupPath) {
    const archiveName = `${backupId}.${this.config.compression.format}`;
    const archivePath = path.join(this.backupDir, archiveName);
    
    await tar.create(
      {
        file: archivePath,
        cwd: this.tempDir,
        gzip: this.config.compression.format === 'tar.gz',
        filter: (path) => !path.includes('.git')
      },
      [backupId]
    );
    
    return archivePath;
  }

  async moveBackup(backupId, backupPath) {
    const finalPath = path.join(this.backupDir, backupId);
    if (fs.existsSync(finalPath)) {
      fs.rmSync(finalPath, { recursive: true, force: true });
    }
    fs.renameSync(backupPath, finalPath);
    return finalPath;
  }

  generateBackupId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const hash = crypto.randomBytes(4).toString('hex');
    return `${this.config.projectName}-${timestamp}-${hash}`;
  }

  async listBackups() {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }

    const files = fs.readdirSync(this.backupDir);
    const backups = [];

    for (const file of files) {
      const filePath = path.join(this.backupDir, file);
      const stats = fs.statSync(filePath);
      
      if (file.endsWith('.tar.gz') || fs.statSync(filePath).isDirectory()) {
        backups.push({
          id: file.replace(/\.(tar\.gz)$/, ''),
          filename: file,
          size: stats.size,
          created: stats.birthtime.toISOString(),
          type: file.endsWith('.tar.gz') ? 'archive' : 'directory'
        });
      }
    }

    return backups.sort((a, b) => new Date(b.created) - new Date(a.created));
  }

  async cleanupOldBackups() {
    const backups = await this.listBackups();
    const maxBackups = this.config.storage.local.maxBackups;
    
    if (backups.length > maxBackups) {
      const toDelete = backups.slice(maxBackups);
      
      for (const backup of toDelete) {
        const backupPath = path.join(this.backupDir, backup.filename);
        fs.rmSync(backupPath, { recursive: true, force: true });
        console.log(`Deleted old backup: ${backup.filename}`);
      }
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const backupSystem = new BackupSystem();

  try {
    switch (command) {
      case 'create':
        const options = {};
        if (args.includes('--quick')) {
          options.quick = true;
        }
        await backupSystem.createBackup(options);
        await backupSystem.cleanupOldBackups();
        break;

      case 'list':
        const backups = await backupSystem.listBackups();
        if (backups.length === 0) {
          console.log(chalk.yellow('No backups found.'));
        } else {
          console.log(chalk.blue('Available backups:'));
          backups.forEach(backup => {
            console.log(`  ${chalk.green(backup.id)} - ${new Date(backup.created).toLocaleString()} (${backup.type})`);
          });
        }
        break;

      default:
        console.log(chalk.red('Usage: node backup.js [create|list] [--quick]'));
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = BackupSystem;