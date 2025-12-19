const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

class FileFilter {
  constructor(config) {
    this.config = config;
    this.includedFiles = new Set();
    this.excludedFiles = new Set();
    this.encryptedFiles = new Set();
  }

  async buildFileList() {
    const allFiles = await this.getAllFiles();
    
    // Apply include patterns
    for (const pattern of this.config.backup.include) {
      const files = await glob(pattern, { 
        cwd: process.cwd(),
        absolute: true,
        nodir: true
      });
      files.forEach(file => this.includedFiles.add(file));
    }

    // Apply exclude patterns
    for (const pattern of this.config.backup.exclude) {
      const files = await glob(pattern, { 
        cwd: process.cwd(),
        absolute: true,
        nodir: true
      });
      files.forEach(file => this.excludedFiles.add(file));
    }

    // Mark files for encryption
    for (const pattern of this.config.backup.encrypt) {
      const files = await glob(pattern, { 
        cwd: process.cwd(),
        absolute: true,
        nodir: true
      });
      files.forEach(file => this.encryptedFiles.add(file));
    }

    return this.getFilteredFiles();
  }

  async getAllFiles() {
    const files = [];
    const patterns = [
      '**/*',
      '.*'
    ];

    for (const pattern of patterns) {
      const matchedFiles = await glob(pattern, { 
        cwd: process.cwd(),
        absolute: true,
        nodir: true
      });
      files.push(...matchedFiles);
    }

    return files;
  }

  getFilteredFiles() {
    const filtered = {
      regular: [],
      encrypted: []
    };

    for (const file of this.includedFiles) {
      if (this.excludedFiles.has(file)) {
        continue;
      }

      if (this.encryptedFiles.has(file)) {
        filtered.encrypted.push(file);
      } else {
        filtered.regular.push(file);
      }
    }

    return filtered;
  }

  filterGitHubCredentials(content) {
    // Remove actual credentials but keep the structure
    return content
      .replace(/GITHUB_TOKEN\s*=\s*['"]?[^'"\s]+['"]?/g, 'GITHUB_TOKEN=""')
      .replace(/API_KEY\s*=\s*['"]?[^'"\s]+['"]?/g, 'API_KEY=""')
      .replace(/SECRET\s*=\s*['"]?[^'"\s]+['"]?/g, 'SECRET=""')
      .replace(/PASSWORD\s*=\s*['"]?[^'"\s]+['"]?/g, 'PASSWORD=""')
      .replace(/TOKEN\s*=\s*['"]?[^'"\s]+['"]?/g, 'TOKEN=""');
  }

  processGitHubRoutes(files) {
    const processed = [];
    
    for (const file of files) {
      if (this.shouldProcessGitHubRoute(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const filteredContent = this.filterGitHubCredentials(content);
        
        // Write filtered content to temp location
        const tempPath = path.join(__dirname, '../temp', path.relative(process.cwd(), file));
        const tempDir = path.dirname(tempPath);
        
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        fs.writeFileSync(tempPath, filteredContent);
        processed.push(tempPath);
      } else {
        processed.push(file);
      }
    }
    
    return processed;
  }

  shouldProcessGitHubRoute(filePath) {
    const githubRoutePatterns = this.config.backup.specialHandling.githubRoutes.include;
    
    for (const pattern of githubRoutePatterns) {
      const files = glob.sync(pattern, { cwd: process.cwd() });
      if (files.includes(path.relative(process.cwd(), filePath))) {
        return true;
      }
    }
    
    return false;
  }
}

module.exports = FileFilter;