import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, "../src/data");

// camelCase regex
const camelCase = /^[a-z][a-zA-Z0-9]*$/;

function scan(obj: any, filename: string) {
  Object.keys(obj).forEach(key => {
    if (!camelCase.test(key)) {
      console.log(`❌ INVALID KEY in ${filename}: ${key}`);
    }
  });
}

// scan all files
try {
  fs.readdirSync(dataPath).forEach(file => {
    const filePath = path.join(dataPath, file);
    if (file.endsWith(".ts")) {
      try {
        // Read file content and eval it (since it's TypeScript with exports)
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        // Simple parsing to extract object keys from the file content
        const objectMatches = fileContent.match(/\{[\s\S]*\}/g);
        if (objectMatches) {
          console.log(`\n📂 Checking ${file} ...`);
          objectMatches.forEach(objStr => {
            try {
              // Extract keys from object string
              const keys = objStr.match(/(\w+):/g);
              if (keys) {
                keys.forEach(key => {
                  const cleanKey = key.replace(':', '').trim();
                  if (!camelCase.test(cleanKey)) {
                    console.log(`❌ INVALID KEY in ${file}: ${cleanKey}`);
                  }
                });
              }
            } catch (e) {
              // Skip parsing errors
            }
          });
        }
      } catch (error: any) {
        console.log(`⚠️ Could not parse ${file}: ${error.message}`);
      }
    }
  });
} catch (error: any) {
  console.log(`❌ Error reading data directory: ${error.message}`);
}

console.log("\n✔️ Scan Complete");