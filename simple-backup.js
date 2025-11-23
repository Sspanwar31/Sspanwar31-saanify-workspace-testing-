#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SimpleBackupSystem {
  constructor() {
    this.workspaceRoot = process.cwd();
    this.backupDir = null;
  }

  async initialize() {
    console.log('🚀 Initializing Simple Backup System\n');
    
    // Step 1: Validate workspace
    const validation = await this.validateWorkspace();
    
    if (!validation.isValid) {
      console.log('\n❌ Workspace validation failed');
      process.exit(1);
    }
    
    // Step 2: Setup backup directory
    this.setupBackupDirectory();
    
    console.log('\n✅ Backup system initialized successfully');
    console.log(`📁 Workspace: ${this.workspaceRoot}`);
    console.log(`💾 Backup dir: ${this.backupDir}`);
    
    return true;
  }

  async validateWorkspace() {
    console.log('📋 Validating workspace...');
    
    // Check for essential files
    const hasPackageJson = fs.existsSync('package.json');
    const hasSrc = fs.existsSync('src');
    const hasNextConfig = fs.existsSync('next.config.ts') || fs.existsSync('next.config.js');
    
    // Count files
    try {
      const result = execSync('find . -type f ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./dist/*" ! -path "./build/*" | wc -l', { encoding: 'utf8' });
      const fileCount = parseInt(result.trim());
      
      console.log(`📊 Found ${fileCount} files`);
      console.log(`📄 package.json: ${hasPackageJson ? '✅' : '❌'}`);
      console.log(`📁 src directory: ${hasSrc ? '✅' : '❌'}`);
      console.log(`⚙️  next.config: ${hasNextConfig ? '✅' : '❌'}`);
      
      const isValid = fileCount >= 50 && hasSrc;
      console.log(`✅ Workspace valid: ${isValid}`);
      
      return { isValid, fileCount, hasPackageJson, hasSrc, hasNextConfig };
    } catch (error) {
      console.error('Error validating workspace:', error.message);
      return { isValid: false };
    }
  }

  setupBackupDirectory() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupName = `simple-backup-${timestamp}`;
    
    // Create backup directory in project root
    this.backupDir = path.join(this.workspaceRoot, 'backups', backupName);
    
    if (!fs.existsSync(path.join(this.workspaceRoot, 'backups'))) {
      fs.mkdirSync(path.join(this.workspaceRoot, 'backups'), { recursive: true });
    }
    
    fs.mkdirSync(this.backupDir, { recursive: true });
  }

  async createBackup() {
    console.log('\n📦 Creating backup...');
    
    const timestamp = new Date().toISOString();
    const backupData = {
      timestamp,
      workspaceRoot: this.workspaceRoot,
      backupDir: this.backupDir,
      files: {}
    };

    try {
      // Backup source code
      await this.backupSourceCode(backupData);
      
      // Backup configuration files
      await this.backupConfigFiles(backupData);
      
      // Backup database schema
      await this.backupDatabase(backupData);
      
      // Create backup manifest
      await this.createManifest(backupData);
      
      // Create compressed archive
      await this.createCompressedBackup();
      
      console.log('✅ Backup created successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      throw error;
    }
  }

  async backupSourceCode(backupData) {
    console.log('   📁 Backing up source code...');
    
    const sourceData = {};
    
    // Backup src directory
    if (fs.existsSync('src')) {
      sourceData.src = await this.backupDirectory('src', 'src');
    }
    
    // Backup components if exists
    if (fs.existsSync('components')) {
      sourceData.components = await this.backupDirectory('components', 'components');
    }
    
    backupData.files.sourceCode = sourceData;
    
    // Save source files as JSON
    const sourceCodePath = path.join(this.backupDir, 'source-code.json');
    fs.writeFileSync(sourceCodePath, JSON.stringify(sourceData, null, 2));
  }

  async backupConfigFiles(backupData) {
    console.log('   ⚙️  Backing up configuration files...');
    
    const configFiles = [
      'package.json', 'package-lock.json', 'next.config.ts', 'tailwind.config.ts',
      'tsconfig.json', 'eslint.config.mjs', 'postcss.config.mjs', 'components.json',
      'middleware.ts', '.gitignore', '.dockerignore'
    ];
    
    const configData = {};
    
    for (const file of configFiles) {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          configData[file] = {
            content: content,
            size: content.length,
            lastModified: fs.statSync(file).mtime.toISOString()
          };
        } catch (error) {
          console.warn(`     Warning: Could not read ${file}: ${error.message}`);
        }
      }
    }
    
    backupData.files.config = configData;
    
    // Save config files
    const configPath = path.join(this.backupDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
  }

  async backupDatabase(backupData) {
    console.log('   🗄️  Backing up database schema...');
    
    const dbFiles = ['schema.prisma', 'schema-dev.prisma', 'schema-prod.prisma', 'seed.ts', 'seed.sql'];
    const dbData = {};
    
    for (const file of dbFiles) {
      const filePath = path.join('prisma', file);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          dbData[file] = {
            content: content,
            size: content.length,
            lastModified: fs.statSync(filePath).mtime.toISOString()
          };
        } catch (error) {
          console.warn(`     Warning: Could not read ${file}: ${error.message}`);
        }
      }
    }
    
    // Also backup actual database if it exists
    const dbPath = path.join('prisma', 'dev.db');
    if (fs.existsSync(dbPath)) {
      try {
        const dbBuffer = fs.readFileSync(dbPath);
        dbData['dev.db'] = {
          size: dbBuffer.length,
          lastModified: fs.statSync(dbPath).mtime.toISOString(),
          isBinary: true
        };
        
        // Copy binary database file
        const backupDbPath = path.join(this.backupDir, 'dev.db');
        fs.copyFileSync(dbPath, backupDbPath);
      } catch (error) {
        console.warn(`     Warning: Could not backup database: ${error.message}`);
      }
    }
    
    backupData.files.database = dbData;
    
    // Save database schema
    const dbSchemaPath = path.join(this.backupDir, 'database.json');
    fs.writeFileSync(dbSchemaPath, JSON.stringify(dbData, null, 2));
  }

  async backupDirectory(dirPath, relativePath) {
    const files = {};
    
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          files[item] = await this.backupDirectory(itemPath, path.join(relativePath, item));
        } else if (stat.isFile()) {
          try {
            const content = fs.readFileSync(itemPath, 'utf8');
            files[item] = {
              content: content,
              size: content.length,
              lastModified: stat.mtime.toISOString()
            };
          } catch (error) {
            // Skip binary files or files that can't be read as text
            files[item] = {
              isBinary: true,
              size: stat.size,
              lastModified: stat.mtime.toISOString(),
              error: error.message
            };
          }
        }
      }
    } catch (error) {
      console.warn(`     Warning: Could not read directory ${dirPath}: ${error.message}`);
    }
    
    return files;
  }

  async createManifest(backupData) {
    console.log('   📋 Creating backup manifest...');
    
    const manifest = {
      backupInfo: {
        timestamp: backupData.timestamp,
        workspaceRoot: backupData.workspaceRoot,
        backupDir: backupData.backupDir,
        totalFiles: 0,
        totalSize: 0
      },
      metadata: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
    
    // Count files and calculate total size
    try {
      const result = execSync('find . -type f ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./dist/*" ! -path "./build/*" -exec ls -la {} \\; | awk \'{sum += $5; count++} END {print count " " sum}\'', { encoding: 'utf8' });
      const [count, size] = result.trim().split(' ');
      manifest.backupInfo.totalFiles = parseInt(count);
      manifest.backupInfo.totalSize = parseInt(size);
    } catch (error) {
      console.warn('     Warning: Could not calculate file statistics');
    }
    
    // Save manifest
    const manifestPath = path.join(this.backupDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    backupData.manifest = manifest;
  }

  async createCompressedBackup() {
    console.log('   🗜️  Creating compressed archive...');
    
    const archiveName = path.basename(this.backupDir);
    const archivePath = path.join(path.dirname(this.backupDir), `${archiveName}.tar.gz`);
    
    try {
      // Create tar.gz archive
      execSync(`cd "${path.dirname(this.backupDir)}" && tar -czf "${archiveName}.tar.gz" "${path.basename(this.backupDir)}"`, { stdio: 'inherit' });
      
      // Get archive size
      const stats = fs.statSync(archivePath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log(`   ✅ Archive created: ${archivePath}`);
      console.log(`   📊 Archive size: ${sizeInMB} MB`);
      
      return archivePath;
    } catch (error) {
      console.error('   ❌ Failed to create compressed archive:', error.message);
      throw error;
    }
  }

  async pushToGitHub(branch = null) {
    console.log('\n🚀 Pushing to GitHub...');
    
    try {
      // Get current branch if not specified
      if (!branch) {
        branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
        console.log(`   🌿 Using current branch: ${branch}`);
      }
      
      // Check git status
      console.log('   📋 Checking git status...');
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      
      if (!status.trim()) {
        console.log('   ✅ No changes to commit');
        return true;
      }
      
      // Add all changes
      console.log('   ➕ Adding changes...');
      execSync('git add .', { stdio: 'inherit' });
      
      // Commit changes
      console.log('   💾 Committing changes...');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const commitMessage = `🚀 Simple Backup: ${timestamp}`;
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      
      // Pull latest changes
      console.log(`   📥 Pulling latest changes...`);
      try {
        execSync(`git pull origin ${branch}`, { stdio: 'inherit' });
      } catch (pullError) {
        console.log('   ⚠️  Pull failed, continuing...');
      }
      
      // Push to GitHub
      console.log(`   📤 Pushing to ${branch} branch...`);
      try {
        execSync(`git push origin ${branch}`, { stdio: 'inherit' });
      } catch (pushError) {
        if (pushError.message.includes('non-fast-forward')) {
          console.log('   🔄 Trying force push...');
          execSync(`git push origin ${branch} --force`, { stdio: 'inherit' });
        } else {
          throw pushError;
        }
      }
      
      console.log('   ✅ Successfully pushed to GitHub');
      return true;
      
    } catch (error) {
      console.error('   ❌ GitHub push failed:', error.message);
      return false;
    }
  }

  async run() {
    try {
      // Initialize backup system
      await this.initialize();
      
      // Create backup
      await this.createBackup();
      
      // Push to GitHub
      await this.pushToGitHub(); // Use current branch automatically
      
      console.log('\n🎉 Simple backup completed successfully!');
      console.log(`📁 Backup location: ${this.backupDir}`);
      
    } catch (error) {
      console.error('\n❌ Backup failed:', error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const backupSystem = new SimpleBackupSystem();
  backupSystem.run();
}

module.exports = SimpleBackupSystem;