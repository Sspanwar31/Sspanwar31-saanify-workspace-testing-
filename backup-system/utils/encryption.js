const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class EncryptionManager {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
    this.secretKey = this.generateOrLoadKey();
  }

  generateOrLoadKey() {
    const keyPath = path.join(__dirname, '../config/.backup_key');
    
    if (fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath);
    }
    
    const key = crypto.randomBytes(this.keyLength);
    fs.writeFileSync(keyPath, key);
    fs.chmodSync(keyPath, 0o600); // Only owner can read/write
    return key;
  }

  encrypt(text) {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, Buffer.from(encryptedData.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  encryptFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const encrypted = this.encrypt(content);
    
    const encryptedPath = filePath + '.encrypted';
    fs.writeFileSync(encryptedPath, JSON.stringify(encrypted, null, 2));
    
    return encryptedPath;
  }

  decryptFile(encryptedFilePath) {
    if (!fs.existsSync(encryptedFilePath)) {
      throw new Error(`Encrypted file not found: ${encryptedFilePath}`);
    }
    
    const encryptedData = JSON.parse(fs.readFileSync(encryptedFilePath, 'utf8'));
    const decrypted = this.decrypt(encryptedData);
    
    const originalPath = encryptedFilePath.replace('.encrypted', '');
    fs.writeFileSync(originalPath, decrypted);
    
    return originalPath;
  }
}

module.exports = EncryptionManager;