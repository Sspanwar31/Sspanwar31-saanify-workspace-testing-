# Saanify Workspace Backup System

An advanced automated backup and restore system for the Saanify Workspace project.

## 🚀 Features

- **Automated Backup**: One-click backup with intelligent file filtering
- **Encryption**: Military-grade AES-256 encryption for sensitive files
- **GitHub Integration**: Automatic credential filtering for GitHub routes
- **Quick Restore**: Fully automated restore with dependency installation
- **Compression**: Efficient tar.gz compression for storage optimization
- **CLI Interface**: Easy-to-use command-line interface
- **Cross-Platform**: Works on Windows, macOS, and Linux

## 📦 Installation

The backup system is included in the Saanify Workspace project. To set it up:

```bash
# Setup backup system
npm run backup:setup

# Or manually
node backup-system/saanify-backup setup
```

## 🎯 Quick Start

### Create Backup

```bash
# Quick backup
npm run backup:quick

# Full backup
npm run backup

# Or using CLI
node backup-system/saanify-backup backup --quick
```

### Restore Backup

```bash
# Interactive restore (select from list)
npm run restore

# Restore specific backup
node backup-system/saanify-backup restore <backup-id>

# List available backups
npm run restore:list
```

### Check Status

```bash
# Check backup system status
npm run backup:status
```

## 📋 Commands

### Backup Commands

| Command | Description |
|---------|-------------|
| `npm run backup` | Create full backup |
| `npm run backup:quick` | Create quick backup |
| `npm run backup:status` | Show backup system status |
| `npm run backup:setup` | Setup backup system |

### Restore Commands

| Command | Description |
|---------|-------------|
| `npm run restore` | Interactive restore |
| `npm run restore:list` | List available backups |

### CLI Commands

```bash
# Backup
node backup-system/saanify-backup backup [--quick]

# Restore
node backup-system/saanify-backup restore [backup-id]

# List
node backup-system/saanify-backup list

# Status
node backup-system/saanify-backup status

# Setup
node backup-system/saanify-backup setup

# Help
node backup-system/saanify-backup help
```

### Shell Scripts

```bash
# Quick backup
./backup-system/scripts/quick-backup.sh [--quick]

# Quick restore
./backup-system/scripts/quick-restore.sh [backup-id]
```

## 🔧 Configuration

The backup system is configured via `backup-system/config/backup-config.json`:

### Included Files
- Source code (`src/**/*`)
- Configuration files
- Database schema
- Public assets
- Backup system itself

### Excluded Files
- `node_modules/`
- `.next/`
- `.git/`
- Log files
- Temporary files
- Personal configs

### Encrypted Files
- `.env` files (AES-256 encryption)

### GitHub Route Processing
- API routes included without credentials
- Tokens and keys automatically filtered
- Structure preserved for easy restoration

## 🗂️ Backup Structure

```
backups/
├── saanify-workspace-2024-01-15-10-30-45-abc123.tar.gz
├── saanify-workspace-2024-01-14-15-20-30-def456.tar.gz
└── ...
```

Each backup contains:
- Project files (filtered)
- Encrypted `.env` file
- Backup metadata
- GitHub routes (credentials filtered)

## 🔄 Restore Process

1. **Extract Backup**: Unpack backup archive
2. **Validate**: Check backup integrity
3. **Restore Files**: Copy project files
4. **Decrypt**: Restore encrypted `.env`
5. **Install Dependencies**: Auto-run `npm install`
6. **Setup Database**: Auto-run database migrations
7. **GitHub Token**: Prompt for GitHub token once
8. **Start Project**: Auto-start development server

## 🔐 Security

### Encryption
- **Algorithm**: AES-256-GCM
- **Key Management**: Auto-generated secure key
- **Storage**: Key stored with restricted permissions
- **Integrity**: Authenticated encryption with AEAD

### Credential Filtering
- GitHub tokens automatically removed
- API keys replaced with placeholders
- Passwords and secrets filtered
- Structure preserved for restoration

## 📊 Backup Information

Each backup includes metadata:
- Project name and version
- Timestamp and file counts
- Node.js version and platform
- Compression details
- File statistics

## 🛠️ Advanced Usage

### Custom Configuration

Edit `backup-system/config/backup-config.json` to customize:

```json
{
  "backup": {
    "include": ["src/**/*", "custom/**/*"],
    "exclude": ["node_modules/**/*"],
    "encrypt": [".env", ".secrets"]
  },
  "compression": {
    "enabled": true,
    "format": "tar.gz",
    "level": 6
  },
  "storage": {
    "local": {
      "path": "./backups",
      "maxBackups": 10
    }
  }
}
```

### Programmatic Usage

```javascript
const BackupSystem = require('./backup-system/scripts/backup');
const RestoreSystem = require('./backup-system/scripts/restore');

// Create backup
const backup = new BackupSystem();
await backup.createBackup();

// Restore backup
const restore = new RestoreSystem();
await restore.restoreFromBackup('backup-id');
```

## 🔍 Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure scripts are executable
2. **Missing Dependencies**: Run `npm run backup:setup`
3. **Encryption Key Lost**: Regenerate by deleting `.backup_key`
4. **Restore Fails**: Check backup integrity and disk space

### Logs

Backup operations log to console. For detailed logging:

```bash
# Enable verbose logging
DEBUG=backup:* node backup-system/saanify-backup backup
```

## 📝 Best Practices

1. **Regular Backups**: Schedule automatic backups
2. **Test Restores**: Verify backup integrity regularly
3. **Storage**: Keep backups in multiple locations
4. **Security**: Store encryption key securely
5. **Cleanup**: Remove old backups to save space

## 🚨 Important Notes

- **GitHub Token**: Only required once during restore
- **Database**: Automatically migrated during restore
- **Dependencies**: Auto-installed during restore
- **Configuration**: Preserved during backup/restore
- **Security**: Never store credentials in backups

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review backup logs
3. Verify configuration
4. Test with a fresh backup

---

**Saanify Workspace Backup System** - Automated, Secure, Reliable 🚀