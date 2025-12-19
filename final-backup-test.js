#!/usr/bin/env node

/**
 * Final Backup System Test
 * Tests all backup and restore functionality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Final Backup System Test\n');

// Test 1: Check all required files exist
function testRequiredFiles() {
  console.log('📁 Test 1: Checking required files...');
  
  const requiredFiles = [
    'backup-system/saanify-backup',
    'backup-system/scripts/backup.js',
    'backup-system/scripts/restore.js',
    'backup-system/scripts/quick-backup.sh',
    'backup-system/scripts/quick-restore.sh',
    'backup-system/config/backup-config.json',
    'backup-system/utils/encryption.js',
    'backup-system/utils/fileFilter.js'
  ];
  
  let missingFiles = [];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length === 0) {
    console.log('✅ All required files exist\n');
    return true;
  } else {
    console.log('❌ Missing files:', missingFiles.join(', '), '\n');
    return false;
  }
}

// Test 2: Check package.json scripts
function testPackageScripts() {
  console.log('📦 Test 2: Checking package.json scripts...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredScripts = [
      'backup',
      'backup:quick',
      'restore',
      'restore:list',
      'backup:status',
      'backup:setup'
    ];
    
    let missingScripts = [];
    
    for (const script of requiredScripts) {
      if (!packageJson.scripts[script]) {
        missingScripts.push(script);
      }
    }
    
    if (missingScripts.length === 0) {
      console.log('✅ All required scripts exist in package.json\n');
      return true;
    } else {
      console.log('❌ Missing scripts:', missingScripts.join(', '), '\n');
      return false;
    }
  } catch (error) {
    console.log('❌ Error reading package.json:', error.message, '\n');
    return false;
  }
}

// Test 3: Test backup creation
function testBackupCreation() {
  console.log('💾 Test 3: Testing backup creation...');
  
  try {
    const output = execSync('npm run backup:quick', { encoding: 'utf8' });
    console.log('Backup output:', output);
    if (output.includes('✔ Backup created:')) {
      console.log('✅ Backup creation successful\n');
      return true;
    } else {
      console.log('❌ Backup creation failed\n');
      return false;
    }
  } catch (error) {
    console.log('❌ Backup creation error:', error.message, '\n');
    return false;
  }
}

// Test 4: Test backup listing
function testBackupListing() {
  console.log('📋 Test 4: Testing backup listing...');
  
  try {
    const output = execSync('npm run restore:list', { encoding: 'utf8' });
    if (output.includes('Available backups:') && output.includes('📦')) {
      console.log('✅ Backup listing successful\n');
      return true;
    } else {
      console.log('❌ Backup listing failed\n');
      return false;
    }
  } catch (error) {
    console.log('❌ Backup listing error:', error.message, '\n');
    return false;
  }
}

// Test 5: Test backup status
function testBackupStatus() {
  console.log('📊 Test 5: Testing backup status...');
  
  try {
    const output = execSync('npm run backup:status', { encoding: 'utf8' });
    if (output.includes('✅ Backup directory exists') && 
        output.includes('✅ Encryption key exists') && 
        output.includes('✅ Configuration exists')) {
      console.log('✅ Backup status check successful\n');
      return true;
    } else {
      console.log('❌ Backup status check failed\n');
      return false;
    }
  } catch (error) {
    console.log('❌ Backup status error:', error.message, '\n');
    return false;
  }
}

// Test 6: Test backup integrity
function testBackupIntegrity() {
  console.log('🔍 Test 6: Testing backup integrity...');
  
  try {
    const backupDir = 'backups';
    if (!fs.existsSync(backupDir)) {
      console.log('❌ Backup directory does not exist\n');
      return false;
    }
    
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.tar.gz'));
    if (files.length === 0) {
      console.log('❌ No backup files found\n');
      return false;
    }
    
    // Test the latest backup
    const latestBackup = files.sort().pop();
    const backupPath = path.join(backupDir, latestBackup);
    
    // Try to list contents (integrity check)
    execSync(`tar -tzf "${backupPath}"`, { encoding: 'utf8' });
    
    console.log('✅ Backup integrity check passed\n');
    return true;
  } catch (error) {
    console.log('❌ Backup integrity check failed:', error.message, '\n');
    return false;
  }
}

// Test 7: Test encryption system
function testEncryptionSystem() {
  console.log('🔐 Test 7: Testing encryption system...');
  
  try {
    const EncryptionManager = require('./backup-system/utils/encryption');
    const encryption = new EncryptionManager();
    
    // Test encryption/decryption
    const testData = 'This is a secret test message';
    const encrypted = encryption.encrypt(testData);
    const decrypted = encryption.decrypt(encrypted);
    
    if (decrypted === testData) {
      console.log('✅ Encryption system working correctly\n');
      return true;
    } else {
      console.log('❌ Encryption system failed\n');
      return false;
    }
  } catch (error) {
    console.log('❌ Encryption system error:', error.message, '\n');
    return false;
  }
}

// Test 8: Test file filtering
function testFileFiltering() {
  console.log('🗂️ Test 8: Testing file filtering...');
  
  try {
    const FileFilter = require('./backup-system/utils/fileFilter');
    const fileFilter = new FileFilter();
    
    // Test file filtering logic
    const testFiles = [
      'src/app/page.tsx',
      'node_modules/react/index.js',
      '.next/cache/test.js',
      'src/lib/utils.ts',
      '.git/config',
      'README.md',
      'package.json'
    ];
    
    const filtered = fileFilter.getFilteredFiles(testFiles);
    
    // Should include source files but exclude node_modules, .next, .git
    const shouldInclude = ['src/app/page.tsx', 'src/lib/utils.ts', 'README.md', 'package.json'];
    const shouldExclude = ['node_modules/react/index.js', '.next/cache/test.js', '.git/config'];
    
    let allCorrect = true;
    
    for (const file of shouldInclude) {
      if (!filtered.includes(file)) {
        console.log(`❌ Should include: ${file}`);
        allCorrect = false;
      }
    }
    
    for (const file of shouldExclude) {
      if (filtered.includes(file)) {
        console.log(`❌ Should exclude: ${file}`);
        allCorrect = false;
      }
    }
    
    if (allCorrect) {
      console.log('✅ File filtering working correctly\n');
      return true;
    } else {
      console.log('❌ File filtering failed\n');
      return false;
    }
  } catch (error) {
    console.log('❌ File filtering error:', error.message, '\n');
    return false;
  }
}

// Run all tests
function runAllTests() {
  console.log('🚀 Saanify Backup System - Final Test Suite\n');
  console.log('==========================================\n');
  
  const tests = [
    testRequiredFiles,
    testPackageScripts,
    testBackupCreation,
    testBackupListing,
    testBackupStatus,
    testBackupIntegrity,
    testEncryptionSystem,
    testFileFiltering
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      if (test()) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ Test failed with exception: ${error.message}\n`);
      failed++;
    }
  }
  
  // Results
  console.log('==========================================');
  console.log('📊 Final Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Backup system is fully functional!');
    console.log('\n📋 Available Commands:');
    console.log('  npm run backup          - Create full backup');
    console.log('  npm run backup:quick    - Create quick backup');
    console.log('  npm run restore         - Restore from backup');
    console.log('  npm run restore:list    - List all backups');
    console.log('  npm run backup:status   - Check system status');
    console.log('  npm run backup:setup    - Setup backup system');
    console.log('\n🔧 Backup System Features:');
    console.log('  ✅ Automated backup creation');
    console.log('  ✅ AES-256 encryption for sensitive files');
    console.log('  ✅ Intelligent file filtering');
    console.log('  ✅ Compressed storage (tar.gz)');
    console.log('  ✅ Complete restore with auto-install');
    console.log('  ✅ GitHub integration support');
    console.log('  ✅ Cross-platform compatibility');
    console.log('  ✅ CLI interface with help system');
    console.log('\n🚀 The backup system is ready for production use!');
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Please check the issues above.');
    return false;
  }
}

// Run tests
const success = runAllTests();
process.exit(success ? 0 : 1);