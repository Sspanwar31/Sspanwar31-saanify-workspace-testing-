#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const tar = require('tar');

// Simple color functions instead of chalk
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`
};

class SimpleBackup {
  constructor() {
    this.projectRoot = process.cwd();
    this.backupDir = path.join(this.projectRoot, 'backups');
    this.ensureDirectoryExists(this.backupDir);
  }

  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async createBackup() {
    console.log('Creating backup...');
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `saanify-backup-${timestamp}`;
      const backupPath = path.join(this.backupDir, `${backupName}.tar.gz`);
      
      // Files to include in backup
      const filesToInclude = [
        'src/**/*',
        'public/**/*',
        'package.json',
        'package-lock.json',
        'tailwind.config.ts',
        'next.config.ts',
        'tsconfig.json',
        'eslint.config.mjs',
        'prisma/**/*',
        'db/**/*',
        'server.ts',
        'README.md',
        '.env.example',
        'components.json',
        'middleware.ts'
      ];

      // Create metadata
      const metadata = {
        projectName: 'saanify-workspace',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        files: filesToInclude,
        stats: {
          regular: filesToInclude.length,
          encrypted: 0
        }
      };

      // Create temporary directory for backup
      const tempDir = path.join(this.backupDir, 'temp-backup');
      this.ensureDirectoryExists(tempDir);
      
      // Write metadata
      fs.writeFileSync(
        path.join(tempDir, 'backup-metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      // Copy files to temp directory
      for (const pattern of filesToInclude) {
        try {
          const files = this.expandGlob(pattern);
          for (const file of files) {
            if (fs.existsSync(file)) {
              const relativePath = path.relative(this.projectRoot, file);
              const destPath = path.join(tempDir, relativePath);
              this.ensureDirectoryExists(path.dirname(destPath));
              fs.copyFileSync(file, destPath);
            }
          }
        } catch (error) {
          console.warn(`Warning: Could not include ${pattern}: ${error.message}`);
        }
      }

      console.log('Creating archive...');
      
      // Create tar archive
      await tar.create(
        {
          gzip: true,
          file: backupPath,
          cwd: tempDir
        },
        fs.readdirSync(tempDir)
      );

      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });

      console.log(colors.green(`✅ Backup created: ${backupName}`));
      console.log(colors.green(`Backup saved to: ${backupPath}`));
      
      return backupName;
      
    } catch (error) {
      console.log(colors.red(`❌ Backup failed: ${error.message}`));
      throw error;
    }
  }

  expandGlob(pattern) {
    // Simple glob expansion for common patterns
    const parts = pattern.split('/**');
    const base = parts[0];
    const rest = parts.slice(1).join('/**');
    
    const files = [];
    
    if (fs.existsSync(base)) {
      const stat = fs.statSync(base);
      
      if (stat.isDirectory()) {
        this.collectFiles(base, files);
      } else {
        files.push(base);
      }
    }
    
    return files;
  }

  collectFiles(dir, files) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        this.collectFiles(fullPath, files);
      } else {
        files.push(fullPath);
      }
    }
  }

  listBackups() {
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
          name: file,
          path: filePath,
          size: stats.size,
          created: stats.birthtime
        });
      }
    }

    return backups.sort((a, b) => b.created - a.created);
  }
}

// CLI
async function main() {
  const command = process.argv[2];
  const backup = new SimpleBackup();

  try {
    switch (command) {
      case 'create':
        await backup.createBackup();
        break;
        
      case 'list':
        const backups = backup.listBackups();
        if (backups.length === 0) {
          console.log(colors.yellow('No backups found.'));
        } else {
          console.log(colors.blue('Available backups:'));
          backups.forEach(backup => {
            console.log(`  ${colors.green(backup.name)} - ${backup.created.toLocaleString()}`);
          });
        }
        break;
        
      default:
        console.log(colors.red('Usage: node simple-backup.js [create|list]'));
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

module.exports = SimpleBackup;