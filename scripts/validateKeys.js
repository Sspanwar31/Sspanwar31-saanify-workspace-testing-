const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../src/data");

// camelCase regex
const camelCase = /^[a-z][a-zA-Z0-9]*$/;

function scanKeysInFile(filePath, filename) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    console.log(`\n📂 Checking ${filename} ...`);
    
    // Find all object keys in the file
    const keyMatches = fileContent.match(/(\w+):/g);
    if (keyMatches) {
      let foundInvalidKeys = false;
      keyMatches.forEach(key => {
        const cleanKey = key.replace(':', '').trim();
        // Skip common TypeScript keywords and imports
        if (!['import', 'export', 'default', 'from', 'const', 'let', 'var', 'function', 'class', 'interface', 'type'].includes(cleanKey)) {
          if (!camelCase.test(cleanKey)) {
            console.log(`❌ INVALID KEY in ${filename}: ${cleanKey}`);
            foundInvalidKeys = true;
          }
        }
      });
      
      if (!foundInvalidKeys) {
        console.log(`✅ All keys in ${filename} are valid camelCase`);
      }
    } else {
      console.log(`ℹ️ No object keys found in ${filename}`);
    }
  } catch (error) {
    console.log(`⚠️ Could not parse ${filename}: ${error.message}`);
  }
}

// Scan all files in the data directory
try {
  if (fs.existsSync(dataPath)) {
    const files = fs.readdirSync(dataPath);
    const tsFiles = files.filter(file => file.endsWith(".ts"));
    
    if (tsFiles.length === 0) {
      console.log("ℹ️ No TypeScript files found in src/data directory");
    } else {
      console.log(`🔍 Scanning ${tsFiles.length} TypeScript files for camelCase validation...`);
      
      tsFiles.forEach(file => {
        const filePath = path.join(dataPath, file);
        scanKeysInFile(filePath, file);
      });
    }
  } else {
    console.log("❌ src/data directory not found");
  }
} catch (error) {
  console.log(`❌ Error reading data directory: ${error.message}`);
}

console.log("\n✔️ Scan Complete");