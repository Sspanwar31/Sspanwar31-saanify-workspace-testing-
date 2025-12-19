#!/bin/bash

# GitHub Integration Test Script
# This script helps test GitHub integration setup

echo "🔧 GitHub Integration Test Script"
echo "================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

echo "✅ .env file found"
echo ""

# Test configuration endpoint
echo "🔍 Testing GitHub configuration..."
CONFIG_RESPONSE=$(curl -s http://localhost:3000/api/github/validate)
echo "Response: $CONFIG_RESPONSE"
echo ""

# Extract validity from response
VALID=$(echo $CONFIG_RESPONSE | jq -r '.valid // false')

if [ "$VALID" = "true" ]; then
    echo "✅ GitHub configuration is valid!"
    echo ""
    USER_INFO=$(echo $CONFIG_RESPONSE | jq -r '.user')
    echo "👤 Connected as: $(echo $USER_INFO | jq -r '.login')"
    echo "📧 Name: $(echo $USER_INFO | jq -r '.name // "Not set")')"
    echo ""
    
    # Test repository validation if repo URL is provided
    REPO_URL=$(echo $CONFIG_RESPONSE | jq -r '.config.repoUrl // empty')
    if [ ! -z "$REPO_URL" ] && [ "$REPO_URL" != "null" ]; then
        echo "🔍 Testing repository access..."
        REPO_NAME=$(basename $REPO_URL)
        OWNER=$(basename $(dirname $REPO_URL))
        
        REPO_RESPONSE=$(curl -s -X POST http://localhost:3000/api/github/validate \
            -H "Content-Type: application/json" \
            -d "{\"token\":\"$(grep GITHUB_TOKEN .env | cut -d'=' -f2)\",\"repository\":\"$OWNER/$REPO_NAME\"}")
        
        REPO_VALID=$(echo $REPO_RESPONSE | jq -r '.isValid // false')
        if [ "$REPO_VALID" = "true" ]; then
            echo "✅ Repository access validated!"
            echo "📝 Permissions: $(echo $REPO_RESPONSE | jq -r '.permissions')"
        else
            echo "❌ Repository access failed!"
            echo "Error: $(echo $REPO_RESPONSE | jq -r '.error')"
            echo "Details: $(echo $REPO_RESPONSE | jq -r '.details')"
        fi
    fi
else
    echo "❌ GitHub configuration is invalid!"
    echo ""
    echo "Error details:"
    echo $CONFIG_RESPONSE | jq -r '.error // "Unknown error"'
    echo ""
    echo "Configuration status:"
    echo $CONFIG_RESPONSE | jq -r '.config'
    echo ""
    echo "🔧 To fix this issue:"
    echo "1. Ensure you have a valid GitHub Personal Access Token"
    echo "2. Token must start with 'ghp_' or 'github_pat_'"
    echo "3. Token must have 'repo' permissions"
    echo "4. Update your .env file with correct values"
    echo "5. See GITHUB_SETUP.md for detailed instructions"
fi

echo ""
echo "🌐 Webhook endpoint test:"
WEBHOOK_RESPONSE=$(curl -s http://localhost:3000/api/github/webhook)
echo "Status: $(echo $WEBHOOK_RESPONSE | jq -r '.message // "Endpoint is responding"')"

echo ""
echo "🏁 Test completed!"