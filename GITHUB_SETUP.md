# GitHub Integration Setup Guide

## Required Environment Variables

The following environment variables are required for GitHub integration to work properly:

### 1. GITHUB_TOKEN
- **Purpose**: Personal Access Token for GitHub API authentication
- **Format**: Must start with `ghp_` (classic) or `github_pat_` (fine-grained)
- **Permissions Required**:
  - `repo` (Full control of private repositories) for backup/restore
  - `admin:repo_hook` (Manage repository hooks) for webhook management
  - `read:org` (Read org and team membership) for organization repos

### 2. GITHUB_WEBHOOK_SECRET
- **Purpose**: Secret key for webhook signature verification
- **Format**: Any secure random string (minimum 20 characters)
- **Generation**: Use `openssl rand -hex 20` or similar

### 3. GITHUB_REPO_URL (Optional)
- **Purpose**: Default repository URL for operations
- **Format**: `https://github.com/username/repository-name`

## Setup Instructions

### Step 1: Create GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Set the following permissions:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `admin:repo_hook` (Manage repository hooks)
   - ✅ `read:org` (Read org and team membership, if using org repos)
4. Set expiration as needed
5. Generate token and copy it immediately

### Step 2: Generate Webhook Secret

```bash
# Generate a secure webhook secret
openssl rand -hex 20
```

### Step 3: Update Environment Variables

Edit your `.env` file and replace the placeholder values:

```env
# GitHub Integration Configuration
GITHUB_TOKEN=ghp_your_actual_github_token_here
GITHUB_WEBHOOK_SECRET=your_actual_webhook_secret_here
GITHUB_REPO_URL=https://github.com/your-username/your-repo-name
```

### Step 4: Validate Configuration

After setting up the environment variables, test the configuration:

```bash
curl http://localhost:3000/api/github/validate
```

Expected response for valid configuration:
```json
{
  "valid": true,
  "message": "GitHub configuration is valid",
  "user": {
    "login": "your-username",
    "name": "Your Name",
    "avatar_url": "https://avatars.githubusercontent.com/u/..."
  },
  "config": {
    "tokenPresent": true,
    "tokenFormat": "valid",
    "webhookSecretPresent": true,
    "repoUrlPresent": true
  }
}
```

## Troubleshooting

### Common Issues

1. **"Bad credentials" error**
   - Token is invalid or expired
   - Token doesn't have required permissions
   - Token format is incorrect

2. **"Insufficient permissions" error**
   - Token lacks `repo` scope
   - Token doesn't have write access to target repository

3. **"Repository not found" error**
   - Repository name is incorrect
   - Token doesn't have access to the repository
   - Repository is private and token doesn't have access

### Validation Commands

```bash
# Test token manually
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.github.com/user

# Test repository access
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.github.com/repos/owner/repo
```

## Security Notes

- Never commit your `.env` file to version control
- Use fine-grained tokens when possible for better security
- Rotate tokens regularly
- Limit token permissions to only what's necessary
- Store webhook secrets securely

## Webhook Configuration

To configure webhooks:

1. Go to your repository Settings → Webhooks
2. Add webhook with URL: `https://your-domain.com/api/github/webhook`
3. Set content type to `application/json`
4. Use the same webhook secret from your environment variables
5. Select events: push, pull_request, issues, release, star, fork

## API Endpoints

- `GET /api/github/validate` - Validate GitHub configuration
- `POST /api/github/validate` - Validate repository access
- `POST /api/github/backup` - Create backup to GitHub
- `POST /api/github/webhook` - Handle GitHub webhooks
- `GET /api/github/repos` - List repositories
- `POST /api/github/issues` - Manage issues
- `POST /api/github/actions` - Manage GitHub Actions
- `POST /api/github/analytics` - Get repository analytics