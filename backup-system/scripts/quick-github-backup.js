#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const crypto = require('crypto');

class QuickGitHubBackup {
  constructor() {
    this.projectName = 'saanify-workspace';
    this.backupDir = path.join(process.cwd(), 'backups');
    this.tempDir = path.join(process.cwd(), '.temp-backup');
    
    // GitHub configuration
    this.githubRepo = 'https://github.com/Sspanwar31/saanify-workspace-testing-';
    this.githubBranch = 'main';
    this.githubToken = process.env.GITHUB_TOKEN || '';
    
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

  generateBackupId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const hash = crypto.randomBytes(4).toString('hex');
    return `${this.projectName}-${timestamp}-${hash}`;
  }

  async createQuickBackup() {
    console.log(chalk.blue('🚀 Creating quick GitHub backup...'));
    
    try {
      const backupId = this.generateBackupId();
      const archiveName = `${backupId}.tar.gz`;
      const archivePath = path.join(this.tempDir, archiveName);
      
      // Create tar.gz backup
      console.log(chalk.yellow('📦 Creating archive...'));
      const tarCommand = `tar -czf "${archivePath}" \
        --exclude=node_modules \
        --exclude=.next \
        --exclude=dist \
        --exclude=.git \
        --exclude=*.log \
        --exclude=.DS_Store \
        --exclude=Thumbs.db \
        --exclude=temp \
        --exclude=tmp \
        --exclude=.env.local \
        --exclude=.env.*.local \
        --exclude=coverage \
        --exclude=.nyc_output \
        --exclude=.vscode \
        --exclude=.idea \
        --exclude=*.tmp \
        --exclude=*.temp \
        src/ public/ package.json package-lock.json tailwind.config.ts next.config.ts tsconfig.json eslint.config.mjs prisma/ db/ server.ts README.md .env.example backup-system/`;
      
      execSync(tarCommand, { stdio: 'inherit' });
      
      // Push to GitHub
      if (this.githubToken) {
        await this.pushToGitHub(archivePath, archiveName, backupId);
      } else {
        console.log(chalk.red('❌ GITHUB_TOKEN not found in environment variables'));
        console.log(chalk.yellow('💡 Set GITHUB_TOKEN environment variable to enable GitHub backups'));
        
        // Fallback to local storage
        const localPath = path.join(this.backupDir, archiveName);
        fs.copyFileSync(archivePath, localPath);
        console.log(chalk.green(`✅ Backup saved locally: ${localPath}`));
      }
      
      // Cleanup
      fs.rmSync(this.tempDir, { recursive: true, force: true });
      
    } catch (error) {
      console.error(chalk.red(`❌ Backup failed: ${error.message}`));
      process.exit(1);
    }
  }

  async pushToGitHub(archivePath, archiveName, backupId) {
    console.log(chalk.yellow('📤 Pushing to GitHub...'));
    
    try {
      const tempGitHubDir = path.join(this.tempDir, 'github-repo');
      
      // Clone repository
      const authRepoUrl = this.githubRepo.replace('https://', `https://${this.githubToken}@`);
      execSync(`git clone "${authRepoUrl}" "${tempGitHubDir}"`, { stdio: 'pipe' });
      
      // Create backups directory
      const backupsDir = path.join(tempGitHubDir, 'backups');
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }
      
      // Copy backup file
      const targetPath = path.join(backupsDir, archiveName);
      fs.copyFileSync(archivePath, targetPath);
      
      // Configure git
      execSync('git config user.name "Saanify Quick Backup"', { cwd: tempGitHubDir, stdio: 'pipe' });
      execSync('git config user.email "backup@saanify.com"', { cwd: tempGitHubDir, stdio: 'pipe' });
      
      // Commit and push
      execSync('git add .', { cwd: tempGitHubDir, stdio: 'pipe' });
      const commitMessage = `🚀 Quick Backup: ${new Date().toISOString()}`;
      execSync(`git commit -m "${commitMessage}"`, { cwd: tempGitHubDir, stdio: 'pipe' });
      execSync(`git push origin ${this.githubBranch}`, { cwd: tempGitHubDir, stdio: 'pipe' });
      
      // Cleanup
      fs.rmSync(tempGitHubDir, { recursive: true, force: true });
      
      const githubUrl = `${this.githubRepo}/tree/${this.githubBranch}/backups/${archiveName}`;
      console.log(chalk.green(`✅ Backup pushed to GitHub: ${githubUrl}`));
      
    } catch (error) {
      console.error(chalk.red(`❌ GitHub push failed: ${error.message}`));
      throw error;
    }
  }
}

// Main execution
if (require.main === module) {
  const backup = new QuickGitHubBackup();
  backup.createQuickBackup().catch(console.error);
}

module.exports = QuickGitHubBackup;