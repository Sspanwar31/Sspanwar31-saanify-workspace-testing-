#!/usr/bin/env node

/**
 * Test script to validate infinite re-render fixes
 * This script checks for common patterns that cause infinite re-renders
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Scanning for infinite re-render patterns...\n');

let issuesFound = 0;
let filesScanned = 0;

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    filesScanned++;

    // Check for problematic patterns
    const patterns = [
      {
        name: 'useEffect with function dependency',
        regex: /useEffect\(\(\) => \{[\s\S]*?\}, \[.*function.*\]\)/g,
        severity: 'high'
      },
      {
        name: 'useEffect with changing dependencies',
        regex: /useEffect\(\(\) => \{[\s\S]*?\}, \[.*\.\.\..*\]\)/g,
        severity: 'medium'
      },
      {
        name: 'setState in render',
        regex: /(?:useState|setState)\([^)]*\).*\n.*\n.*setState/g,
        severity: 'high'
      },
      {
        name: 'Object/array in useEffect dependencies',
        regex: /useEffect\(\(\) => \{[\s\S]*?\}, \[.*\{.*\}.*\]\)/g,
        severity: 'medium'
      }
    ];

    let fileIssues = 0;
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern.regex);
      if (matches) {
        console.log(`❌ ${filePath}: ${pattern.name} (${pattern.severity} severity)`);
        matches.forEach((match, index) => {
          const lineNumber = content.substring(0, content.indexOf(match)).split('\n').length;
          console.log(`   Line ${lineNumber}: ${match.substring(0, 100)}...`);
        });
        fileIssues++;
        issuesFound++;
      }
    });

    // Check for missing dependency arrays
    const missingDeps = content.match(/useEffect\(\(\) => \{[\s\S]*?\}, \[\]\)/g);
    if (missingDeps) {
      console.log(`⚠️  ${filePath}: useEffect with empty dependency array (might be intentional)`);
    }

    if (fileIssues === 0) {
      console.log(`✅ ${filePath}: No infinite re-render patterns found`);
    }

  } catch (error) {
    console.log(`⚠️  Could not scan ${filePath}: ${error.message}`);
  }
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      scanDirectory(filePath);
    } else if (stat.isFile() && (file.endsWith('.tsx') || file.endsWith('.ts'))) {
      scanFile(filePath);
    }
  });
}

// Start scanning from src directory
const srcDir = path.join(process.cwd(), 'src');
if (fs.existsSync(srcDir)) {
  scanDirectory(srcDir);
} else {
  console.log('❌ src directory not found');
  process.exit(1);
}

console.log(`\n📊 Summary:`);
console.log(`   Files scanned: ${filesScanned}`);
console.log(`   Issues found: ${issuesFound}`);

if (issuesFound === 0) {
  console.log(`\n🎉 No infinite re-render patterns detected!`);
  console.log(`   The fixes should have resolved the "Maximum update depth exceeded" error.`);
} else {
  console.log(`\n⚠️  Found ${issuesFound} potential infinite re-render patterns.`);
  console.log(`   Please review the issues above.`);
}