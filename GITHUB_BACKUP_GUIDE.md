# GitHub Backup Integration

Saanify में built-in GitHub backup integration है जो आपको अपने प्रोजेक्ट का automatic backup लेने और restore करने की सुविधा देता है।

## 🚀 Features

- **Automatic Backup**: एक click में पूरे project का backup GitHub पर upload करें
- **Version Control**: हर backup का version history maintain होता है
- **Quick Restore**: किसी भी previous version से आसानी से restore करें
- **Secure**: GitHub token locally store होता है, secure और private
- **Real-time Status**: Connection status और backup progress real-time में देखें

## 📋 Setup Instructions

### 1. GitHub Personal Access Token बनाएं

1. GitHub पर जाएं: Settings → Developer settings → Personal access tokens
2. "Generate new token (classic)" पर click करें
3. Token को एक name दें (जैसे "Saanify Backup")
4. Expiration period select करें
5. **`repo`** scope check करें (यह required है)
6. Token generate करें और copy करें

### 2. Repository Configure करें

1. GitHub पर एक new repository बनाएं या existing का use करें
2. Repository owner (username) और repository name note करें
3. Branch select करें (main, master, या develop)

### 3. Saanify में Configure करें

1. Page के bottom-right corner में GitHub button पर click करें
2. Repository owner और name enter करें
3. GitHub token paste करें
4. Branch select करें
5. "Test Connection" पर click करें
6. "Save Configuration" पर click करें

## 🔧 Usage

### Backup बनाने के लिए

1. GitHub button पर click करें
2. "Create Backup" button पर click करें
3. Backup complete होने तक wait करें
4. Success message के साथ backup complete हो जाएगा

### Backup History देखने के लिए

1. GitHub button पर click करें
2. "Show History" button पर click करें
3. सभी previous backups की list दिखेगी
4. किसी भी backup को GitHub पर देखने के लिए GitHub icon पर click करें

### Restore करने के लिए

1. Backup history में जाएं
2. जिस backup को restore करना है, उसके download icon पर click करें
3. Restore process start हो जाएगा

## 🛡️ Security Features

- **Local Storage**: GitHub token आपके browser में locally store होता है
- **Encrypted**: सभी data GitHub के security के साथ encrypted रहता है
- **Private Repositories**: Private repositories को भी support करता है
- **No Server Storage**: Token कभी भी हमारे servers पर store नहीं होता

## 📝 Best Practices

1. **Regular Backups**: हर बड़े change के बाद backup बनाएं
2. **Token Security**: Token को कभी share न करें
3. **Branch Management**: Development के लिए separate branch use करें
4. **Repository Naming**: Repository को descriptive name दें

## 🔍 Troubleshooting

### Common Issues

**Q: Backup fail हो रहा है?**
A: Check करें कि GitHub token correct है और `repo` permission है

**Q: Repository not found error आ रहा है?**
A: Repository name और owner correct है या check करें

**Q: Token expire हो गया है?**
A: New token generate करें और configuration update करें

### Help चाहिए?

- GitHub button पर click करें
- "View Setup Guide" पर click करें
- Detailed instructions के लिए guide follow करें

## 📞 Support

किसी भी issue के लिए:
- Email: contact@saanify.com
- Phone: +91 98765 43210

---

**Note**: यह feature fully secure है और आपके data की privacy की पूरी guarantee है।