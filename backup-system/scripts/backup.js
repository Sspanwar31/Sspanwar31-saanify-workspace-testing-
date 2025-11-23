#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const tar = require('tar');
const crypto = require('crypto');
const inquirer = require('inquirer');
const { execSync } = require('child_process');

// Simple color functions instead of chalk
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`
};

// Simple spinner function
const simpleSpinner = {
  start: (text) => {
    console.log(`⏳ ${text}`);
    return {
      text: text,
      succeed: (msg) => console.log(`✅ ${msg}`),
      fail: (msg) => console.log(`❌ ${msg}`),
      text: ''
    };
  }
};

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
    const spinner = simpleSpinner.start('Creating backup...');
    
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
        
        // Store backup based on configuration
        const finalPath = await this.storeBackup(archivePath, backupId, spinner);
        
        spinner.succeed(`Backup created: ${colors.green(finalPath)}`);
        return finalPath;
      } else {
        const finalPath = await this.moveBackup(backupId, backupPath);
        spinner.succeed(`Backup created: ${colors.green(finalPath)}`);
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

  async storeBackup(archivePath, backupId, spinner) {
    // Check if cloud storage is enabled and configured for GitHub
    if (this.config.storage.cloud.enabled && this.config.storage.cloud.provider === 'github') {
      return await this.storeToGitHub(archivePath, backupId, spinner);
    } else if (this.config.storage.local.enabled) {
      // Fallback to local storage
      const finalPath = path.join(this.backupDir, path.basename(archivePath));
      if (fs.existsSync(finalPath)) {
        fs.rmSync(finalPath, { force: true });
      }
      fs.renameSync(archivePath, finalPath);
      return finalPath;
    } else {
      throw new Error('No storage destination configured');
    }
  }

  async storeToGitHub(archivePath, backupId, spinner) {
    try {
      spinner.text = 'Preparing GitHub backup...';
      
      const githubConfig = this.config.storage.cloud.config;
      const repoUrl = githubConfig.repository;
      const branch = githubConfig.branch || 'main';
      
      // Get GitHub token from environment or prompt user
      let githubToken = githubConfig.token || process.env.GITHUB_TOKEN;
      
      if (!githubToken) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'token',
            message: 'Enter your GitHub token:',
            validate: (input) => input.length > 0 || 'GitHub token is required'
          }
        ]);
        githubToken = answers.token;
      }
      
      // Create a temporary directory for GitHub operations
      const tempGitHubDir = path.join(this.tempDir, 'github-backup');
      if (fs.existsSync(tempGitHubDir)) {
        fs.rmSync(tempGitHubDir, { recursive: true, force: true });
      }
      fs.mkdirSync(tempGitHubDir, { recursive: true });
      
      spinner.text = 'Cloning GitHub repository...';
      
      // Clone the repository
      const authRepoUrl = repoUrl.replace('https://', `https://${githubToken}@`);
      execSync(`git clone "${authRepoUrl}" "${tempGitHubDir}"`, { stdio: 'pipe' });
      
      // Create backups directory in the repo if it doesn't exist
      const repoBackupsDir = path.join(tempGitHubDir, 'backups');
      if (!fs.existsSync(repoBackupsDir)) {
        fs.mkdirSync(repoBackupsDir, { recursive: true });
      }
      
      // Copy the backup file to the repository
      const backupFileName = path.basename(archivePath);
      const targetBackupPath = path.join(repoBackupsDir, backupFileName);
      fs.copyFileSync(archivePath, targetBackupPath);
      
      // Configure git user
      const author = githubConfig.commitAuthor;
      execSync(`git config user.name "${author.name}"`, { cwd: tempGitHubDir, stdio: 'pipe' });
      execSync(`git config user.email "${author.email}"`, { cwd: tempGitHubDir, stdio: 'pipe' });
      
      spinner.text = 'Committing backup to GitHub...';
      
      // Add, commit and push
      execSync('git add .', { cwd: tempGitHubDir, stdio: 'pipe' });
      const commitMessage = `🚀 Saanify Backup: ${new Date().toISOString()}`;
      execSync(`git commit -m "${commitMessage}"`, { cwd: tempGitHubDir, stdio: 'pipe' });
      execSync(`git push origin ${branch}`, { cwd: tempGitHubDir, stdio: 'pipe' });
      
      // Cleanup temporary directory
      fs.rmSync(tempGitHubDir, { recursive: true, force: true });
      
      // Remove local archive file
      fs.rmSync(archivePath, { force: true });
      
      const githubBackupUrl = `${repoUrl}/tree/${branch}/backups/${backupFileName}`;
      spinner.succeed(`Backup pushed to GitHub: ${colors.green(githubBackupUrl)}`);
      
      return githubBackupUrl;
      
    } catch (error) {
      spinner.fail(`GitHub backup failed: ${error.message}`);
      throw error;
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
          console.log(colors.yellow('No backups found.'));
        } else {
          console.log(colors.blue('Available backups:'));
          backups.forEach(backup => {
            console.log(`  ${colors.green(backup.id)} - ${new Date(backup.created).toLocaleString()} (${backup.type})`);
          });
        }
        break;

      default:
        console.log(colors.red('Usage: node backup.js [create|list] [--quick]'));
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

module.exports = BackupSystem;