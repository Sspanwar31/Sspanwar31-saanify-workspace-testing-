#!/bin/bash

# Saanify Backup Script - Fixed Version
# This script creates a proper backup and pushes to GitHub

echo "🚀 Starting Saanify Backup Process..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git config user.name "Saanify Backup"
    git config user.email "backup@saanify.com"
fi

# Check if remote is configured
if ! git remote get-url origin >/dev/null 2>&1; then
    echo "⚠️ No remote repository configured."
    echo "Please run: git remote add origin <your-github-repo-url>"
    echo "Or configure GitHub integration in the dashboard."
    exit 1
fi

# Add all files
echo "📋 Adding files to git..."
git add .

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "ℹ️ No changes to commit."
    exit 0
fi

# Create commit with timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_MESSAGE="🚀 Saanify Backup: $TIMESTAMP

📊 Backup Details:
• Files: $(git diff --cached --name-only | wc -l)
• Timestamp: $TIMESTAMP
• Auto-generated backup from Saanify Dashboard"

echo "💾 Creating commit..."
git commit -m "$COMMIT_MESSAGE"

# Push to remote
echo "📤 Pushing to GitHub..."
git push origin main 2>/dev/null || git push origin master 2>/dev/null || {
    echo "⚠️ Push failed. Trying to set upstream..."
    git push --set-upstream origin main 2>/dev/null || git push --set-upstream origin master 2>/dev/null || {
        echo "❌ Failed to push. Please check your repository configuration."
        exit 1
    }
}

echo "✅ Backup completed successfully!"
echo "🔗 Check your GitHub repository for the backup."

# Create backup info file
cat > backup-info.json << EOF
{
  "timestamp": "$(date -Iseconds)",
  "commit": "$(git rev-parse HEAD)",
  "files": $(git diff --cached --name-only | wc -l),
  "status": "success"
}
EOF

echo "📄 Backup info saved to backup-info.json"