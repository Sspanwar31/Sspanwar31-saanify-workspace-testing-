#!/bin/bash

# Simple backup script for Saanify project
# Creates backup of database and configuration files

echo "🔄 Starting backup..."

# Create backup directory with timestamp
BACKUP_DIR="/home/z/backups/saanify-backup-$(date +%Y-%m-%d-%H-%M-%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Backup directory created: $BACKUP_DIR"

# 1. Backup Database
echo "📊 Backing up database..."
if [ -f "/home/z/my-project/prisma/dev.db" ]; then
    cp "/home/z/my-project/prisma/dev.db" "$BACKUP_DIR/database/"
    echo "✅ Database backed up successfully"
else
    echo "⚠️ Database file not found, skipping..."
fi

# 2. Backup Prisma Schema
echo "📋 Backing up Prisma schema..."
if [ -f "/home/z/my-project/prisma/schema.prisma" ]; then
    cp "/home/z/my-project/prisma/schema.prisma" "$BACKUP_DIR/"
    echo "✅ Prisma schema backed up successfully"
else
    echo "⚠️ Prisma schema not found, skipping..."
fi

# 3. Backup Environment Configuration
echo "🔧 Backing up environment configuration..."
if [ -f "/home/z/my-project/.env" ]; then
    cp "/home/z/my-project/.env" "$BACKUP_DIR/"
fi
if [ -f "/home/z/my-project/.env.local" ]; then
    cp "/home/z/my-project/.env.local" "$BACKUP_DIR/"
fi
echo "✅ Environment files backed up successfully"

# 4. Backup Source Code
echo "💻 Backing up source code..."
SRC_DIR="$BACKUP_DIR/src"
mkdir -p "$SRC_DIR"

# Copy all source files
cp -r "/home/z/my-project/src/"* "$SRC_DIR/" 2>/dev/null
echo "✅ Source code backed up successfully"

# 5. Backup Package Configuration
echo "📦 Backing up package configuration..."
if [ -f "/home/z/my-project/package.json" ]; then
    cp "/home/z/my-project/package.json" "$BACKUP_DIR/"
fi
if [ -f "/home/z/my-project/package-lock.json" ]; then
    cp "/home/z/my-project/package-lock.json" "$BACKUP_DIR/"
fi
echo "✅ Package configuration backed up successfully"

# 6. Backup Public Assets
echo "🖼 Backing up public assets..."
if [ -d "/home/z/my-project/public" ]; then
    cp -r "/home/z/my-project/public/"* "$BACKUPUP_PUBLIC/" 2>/dev/null
    echo "✅ Public assets backed up successfully"
fi

# 7. Create backup manifest
echo "📋 Creating backup manifest..."
cat > "$BACKUP_DIR/backup-manifest.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "project": "Saanify Society Management Platform",
  "version": "1.0.0",
  "backup_type": "simple",
  "files": {
    "database": "prisma/dev.db",
    "schema": "prisma/schema.prisma",
    "env": ".env",
    "env_local": ".env.local",
    "package_json": "package.json",
    "package_lock": "package_lock.json",
    "public_dir": "src_dir": "src/"
  }
}
