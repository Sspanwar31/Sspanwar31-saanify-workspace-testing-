const fs = require('fs');
const path = require('path');

// Superadmin variants to replace
const superadminVariants = [
  'SUPERADMIN',
  'SUPER_ADMIN',
  'SUPER-ADMIN',
  'superadmin',
  'super_admin',
  'super-admin',
  'SuperAdmin',
  'Super_Admin',
  'Super-Admin',
  'superAdmin',
  'Super Admin',
  'Superadmin',
  'super admin'
];

// Files to skip (important system files)
const skipFiles = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'merge-superadmin-to-admin.js',
  'find-superadmin-variants.js',
  'final-verification.js',
  'fix-all-superadmin.js'
];

function shouldSkipFile(filePath) {
  return skipFiles.some(skip => filePath.includes(skip));
}

function fixSuperadminInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let changes = 0;

    // Replace superadmin variants with ADMIN
    superadminVariants.forEach(variant => {
      const regex = new RegExp(`\\b${variant}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        changes += matches.length;
        content = content.replace(regex, 'ADMIN');
      }
    });

    // Special case: role-based replacements
    content = content.replace(/role\s*[=:]\s*['"`]superadmin['"`]/gi, "role = 'ADMIN'");
    content = content.replace(/role\s*[=:]\s*['"`]SUPERADMIN['"`]/g, "role = 'ADMIN'");
    content = content.replace(/role\s*[=:]\s*['"`]super_admin['"`]/gi, "role = 'ADMIN'");
    content = content.replace(/role\s*[=:]\s*['"`]SUPER_ADMIN['"`]/g, "role = 'ADMIN'");

    // Special case: user role checks
    content = content.replace(/user\.role\s*[=!]==\s*['"`]superadmin['"`]/gi, "user.role === 'ADMIN'");
    content = content.replace(/user\.role\s*[=!]==\s*['"`]SUPERADMIN['"`]/g, "user.role === 'ADMIN'");
    content = content.replace(/user\.role\s*[=!]==\s*['"`]super_admin['"`]/gi, "user.role === 'ADMIN'");
    content = content.replace(/user\.role\s*[=!]==\s*['"`]SUPER_ADMIN['"`]/g, "user.role === 'ADMIN'");

    // Special case: includes checks
    content = content.replace(/\.includes\(['"`]superadmin['"`]\)/gi, ".includes('ADMIN')");
    content = content.replace(/\.includes\(['"`]SUPERADMIN['"`]\)/g, ".includes('ADMIN')");
    content = content.replace(/\.includes\(['"`]super_admin['"`]\)/gi, ".includes('ADMIN')");
    content = content.replace(/\.includes\(['"`]SUPER_ADMIN['"`]\)/g, ".includes('ADMIN')");

    // Count additional changes
    const additionalChanges = (originalContent.match(/role\s*[=:]\s*['"`]superadmin['"`]/gi) || []).length +
                             (originalContent.match(/user\.role\s*[=!]==\s*['"`]superadmin['"`]/gi) || []).length +
                             (originalContent.match(/\.includes\(['"`]superadmin['"`]\)/gi) || []).length;

    changes += additionalChanges;

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      return changes;
    }

    return 0;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function findAndFixFiles(dir) {
  let totalFiles = 0;
  let totalChanges = 0;
  let processedFiles = [];

  function walkDirectory(currentDir) {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);

      if (shouldSkipFile(filePath)) {
        continue;
      }

      if (stat.isDirectory()) {
        walkDirectory(filePath);
      } else if (stat.isFile()) {
        // Only process relevant file types
        const ext = path.extname(filePath).toLowerCase();
        const relevantExts = ['.js', '.ts', '.tsx', '.jsx', '.sql', '.sh', '.md', '.json'];
        
        if (relevantExts.includes(ext)) {
          const changes = fixSuperadminInFile(filePath);
          if (changes > 0) {
            totalFiles++;
            totalChanges += changes;
            processedFiles.push({ file: filePath, changes });
            console.log(`✅ Fixed ${filePath} - ${changes} changes`);
          }
        }
      }
    }
  }

  walkDirectory(dir);
  return { totalFiles, totalChanges, processedFiles };
}

// Main execution
console.log('🚀 Starting to fix all superadmin variants in the project...\n');

const result = findAndFixFiles('./');

console.log('\n📊 SUMMARY:');
console.log(`✅ Total files processed: ${result.totalFiles}`);
console.log(`✅ Total changes made: ${result.totalChanges}`);

if (result.processedFiles.length > 0) {
  console.log('\n📋 Files with changes:');
  result.processedFiles.forEach(({ file, changes }) => {
    console.log(`  - ${file}: ${changes} changes`);
  });
} else {
  console.log('\n✅ No files needed changes!');
}

console.log('\n🎉 All superadmin variants have been replaced with ADMIN!');