#!/bin/bash

echo "🚀 GitHub Setup Script for Saanify Workspace"
echo "=========================================="

# Repository details
REPO_URL="https://github.com/Sspanwar31/saanify-workspace.git"
BRANCH="main"

echo "📋 Repository: $REPO_URL"
echo "🌿 Branch: $BRANCH"
echo ""

# Check if we have commits to push
echo "🔍 Checking local commits..."
COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
echo "📊 Local commits: $COMMIT_COUNT"

if [ "$COMMIT_COUNT" -eq 0 ]; then
    echo "❌ No commits found. Creating initial commit..."
    git add -A
    git commit -m "🚀 Initial commit - Saanify Workspace Setup"
fi

# Check if remote is configured
echo "🔍 Checking remote configuration..."
if ! git remote get-url origin >/dev/null 2>&1; then
    echo "📡 Adding remote origin..."
    git remote add origin "$REPO_URL"
else
    echo "✅ Remote origin already configured"
fi

# Show current status
echo ""
echo "📋 Current Status:"
echo "=================="
git status
echo ""

echo "🌲 Recent Commits:"
git log --oneline -5
echo ""

echo "📡 Remote URLs:"
git remote -v
echo ""

echo "🔧 To push to GitHub, you need to:"
echo "1. Get a GitHub Personal Access Token"
echo "2. Run: git push https://<TOKEN>@github.com/Sspanwar31/saanify-workspace.git main"
echo ""
echo "📝 Or configure git credential helper"
echo "3. Or use GitHub CLI: gh auth login && git push origin main"
echo ""

echo "✅ Setup complete! Ready to push to GitHub."