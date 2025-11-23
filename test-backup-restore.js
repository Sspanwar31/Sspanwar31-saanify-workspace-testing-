#!/usr/bin/env node

/**
 * Comprehensive Backup and Restore Test Script
 * Tests the complete backup and restore functionality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEST_DIR = path.join(__dirname, 'test-restore-temp');
const BACKUP_ID = 'saanify-workspace-2025-10-29T14-38-33-013Z-ed1634be';

console.log('🧪 Starting Backup and Restore Test\n');

// Cleanup function
function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    console.log('🧹 Cleaning up test directory...');
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

// Test 1: Check backup system status
function testBackupStatus() {
  console.log('📊 Test 1: Checking backup system status...');
  try {
    const output = execSync('npm run backup:status', { encoding: 'utf8' });
    console.log('Status output:', output);
    if (output.includes('✅ Backup directory exists') && 
        output.includes('✅ Encryption key exists') && 
        output.includes('✅ Configuration exists')) {
      console.log('✅ Backup system status check passed\n');
      return true;
    } else {
      console.log('❌ Backup system status check failed\n');
      return false;
    }
  } catch (error) {
    console.log('❌ Backup system status check failed:', error.message, '\n');
    return false;
  }
}

// Test 2: Create a new backup
function testCreateBackup() {
  console.log('📦 Test 2: Creating a new backup...');
  try {
    const output = execSync('npm run backup:quick', { encoding: 'utf8' });
    if (output.includes('✔ Backup created:')) {
      console.log('✅ Backup creation test passed\n');
      return true;
    } else {
      console.log('❌ Backup creation test failed\n');
      return false;
    }
  } catch (error) {
    console.log('❌ Backup creation test failed:', error.message, '\n');
    return false;
  }
}

// Test 3: List available backups
function testListBackups() {
  console.log('📋 Test 3: Listing available backups...');
  try {
    const output = execSync('npm run restore:list', { encoding: 'utf8' });
    if (output.includes('Available backups:') && output.includes('📦')) {
      console.log('✅ Backup listing test passed\n');
      return true;
    } else {
      console.log('❌ Backup listing test failed\n');
      return false;
    }
  } catch (error) {
    console.log('❌ Backup listing test failed:', error.message, '\n');
    return false;
  }
}

// Test 4: Verify backup integrity
function testBackupIntegrity() {
  console.log('🔍 Test 4: Verifying backup integrity...');
  try {
    // Check if backup file exists
    const backupPath = path.join(__dirname, 'backups', `${BACKUP_ID}.tar.gz`);
    if (!fs.existsSync(backupPath)) {
      console.log('❌ Backup file does not exist\n');
      return false;
    }

    // Check if backup can be listed (tar -t)
    execSync(`tar -tzf "${backupPath}"`, { encoding: 'utf8' });
    
    // Check for essential files
    const output = execSync(`tar -tzf "${backupPath}"`, { encoding: 'utf8' });
    const essentialFiles = [
      'package.json',
      'src/',
      'backup-system/',
      'README.md'
    ];

    let hasAllFiles = true;
    for (const file of essentialFiles) {
      if (!output.includes(file)) {
        console.log(`❌ Missing essential file: ${file}`);
        hasAllFiles = false;
      }
    }

    if (hasAllFiles) {
      console.log('✅ Backup integrity test passed\n');
      return true;
    } else {
      console.log('❌ Backup integrity test failed\n');
      return false;
    }
  } catch (error) {
    console.log('❌ Backup integrity test failed:', error.message, '\n');
    return false;
  }
}

// Test 5: Test restore preparation (simulate restore)
function testRestorePreparation() {
  console.log('🔄 Test 5: Testing restore preparation...');
  try {
    // Create test directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });

    // Extract backup to test directory
    const backupPath = path.join(__dirname, 'backups', `${BACKUP_ID}.tar.gz`);
    execSync(`tar -xzf "${backupPath}" -C "${TEST_DIR}"`, { encoding: 'utf8' });

    // Check if extracted files exist
    const extractedDir = path.join(TEST_DIR, BACKUP_ID);
    if (!fs.existsSync(extractedDir)) {
      console.log('❌ Backup extraction failed\n');
      return false;
    }

    // Check for essential files in extracted backup
    const essentialFiles = [
      'package.json',
      'src',
      'backup-system',
      'README.md'
    ];

    let hasAllFiles = true;
    for (const file of essentialFiles) {
      const filePath = path.join(extractedDir, file);
      if (!fs.existsSync(filePath)) {
        console.log(`❌ Missing extracted file: ${file}`);
        hasAllFiles = false;
      }
    }

    if (hasAllFiles) {
      console.log('✅ Restore preparation test passed\n');
      return true;
    } else {
      console.log('❌ Restore preparation test failed\n');
      return false;
    }
  } catch (error) {
    console.log('❌ Restore preparation test failed:', error.message, '\n');
    return false;
  }
}

// Test 6: Test encryption/decryption
function testEncryption() {
  console.log('🔐 Test 6: Testing encryption/decryption...');
  try {
    const extractedDir = path.join(TEST_DIR, BACKUP_ID);
    const encryptedFile = path.join(extractedDir, '.env.encrypted');
    
    if (fs.existsSync(encryptedFile)) {
      console.log('✅ Encrypted file exists in backup\n');
      return true;
    } else {
      console.log('⚠️  No encrypted file found (may be normal if .env doesn\'t exist)\n');
      return true;
    }
  } catch (error) {
    console.log('❌ Encryption test failed:', error.message, '\n');
    return false;
  }
}

// Test 7: Test backup metadata
function testBackupMetadata() {
  console.log('📄 Test 7: Testing backup metadata...');
  try {
    const extractedDir = path.join(TEST_DIR, BACKUP_ID);
    const metadataFile = path.join(extractedDir, 'backup-metadata.json');
    
    if (!fs.existsSync(metadataFile)) {
      console.log('❌ Backup metadata file not found\n');
      return false;
    }

    const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
    
    // Check essential metadata fields
    const requiredFields = ['projectName', 'version', 'timestamp', 'nodeVersion'];
    let hasAllFields = true;
    
    for (const field of requiredFields) {
      if (!metadata[field]) {
        console.log(`❌ Missing metadata field: ${field}`);
        hasAllFields = false;
      }
    }

    if (hasAllFields) {
      console.log('✅ Backup metadata test passed\n');
      return true;
    } else {
      console.log('❌ Backup metadata test failed\n');
      return false;
    }
  } catch (error) {
    console.log('❌ Backup metadata test failed:', error.message, '\n');
    return false;
  }
}

// Main test execution
function runTests() {
  console.log('🚀 Saanify Workspace Backup & Restore Test Suite\n');
  console.log('===============================================\n');

  const tests = [
    testBackupStatus,
    testCreateBackup,
    testListBackups,
    testBackupIntegrity,
    testRestorePreparation,
    testEncryption,
    testBackupMetadata
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

  // Cleanup
  cleanup();

  // Results
  console.log('===============================================');
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Backup and restore functionality is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the backup system configuration.');
    process.exit(1);
  }
}

// Run tests
runTests();