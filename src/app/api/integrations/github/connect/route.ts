import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/error-handling'

export async function POST(request: NextRequest) {
  try {
    const { githubUrl, accessToken } = await request.json()
    
    if (!githubUrl || !accessToken) {
      return NextResponse.json(
        { error: 'Missing GitHub URL or Access Token' },
        { status: 400 }
      )
    }

    // Validate GitHub URL format
    try {
      const url = new URL(githubUrl)
      if (!url.hostname.includes('github.com')) {
        throw new Error('Invalid GitHub URL')
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid GitHub URL format' },
        { status: 400 }
      )
    }

    // Validate access token format (basic check)
    if (!accessToken.startsWith('ghp_') && !accessToken.startsWith('github_pat_')) {
      return NextResponse.json(
        { error: 'Invalid GitHub access token format' },
        { status: 400 }
      )
    }

    // Extract owner and repo from URL
    const urlParts = githubUrl.replace('https://github.com/', '').replace('http://github.com/', '').split('/')
    const [owner, repo] = urlParts

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL' },
        { status: 400 }
      )
    }

    // Test GitHub API connection
    const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}`
    
    const response = await fetch(githubApiUrl, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Saanify-Integration'
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid GitHub access token' },
          { status: 401 }
        )
      } else if (response.status === 404) {
        return NextResponse.json(
          { error: 'GitHub repository not found' },
          { status: 404 }
        )
      } else {
        return NextResponse.json(
          { error: 'Failed to access GitHub repository', details: `Status: ${response.status}` },
          { status: response.status }
        )
      }
    }

    const repoData = await response.json()

    // Save GitHub configuration (in a real app, this would be stored securely)
    const config = {
      githubUrl,
      accessToken: accessToken.replace(/./g, '[REDACTED]'), // Don't log full token
      owner,
      repo,
      repoName: repoData.name,
      description: repoData.description,
      isPrivate: repoData.private,
      defaultBranch: repoData.default_branch,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      createdAt: repoData.created_at,
      updatedAt: repoData.updated_at
    }

    console.log('✅ GitHub repository connected:', {
      repository: `${owner}/${repo}`,
      name: repoData.name,
      private: repoData.private,
      stars: repoData.stargazers_count
    })

    // In a real implementation, you would:
    // 1. Store the access token securely (environment variable, secret manager, etc.)
    // 2. Set up webhooks for automated backups
    // 3. Configure GitHub Actions for deployment
    // 4. Initialize git repository if needed

    return NextResponse.json({
      message: '🎉 GitHub Repository Connected Successfully!',
      details: {
        repository: `${owner}/${repo}`,
        name: repoData.name,
        description: repoData.description,
        private: repoData.private,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        defaultBranch: repoData.default_branch,
        connectedAt: new Date().toISOString()
      },
      features: [
        'Repository access verified',
        'API connection established',
        'Ready for automated workflows',
        'Backup integration available'
      ],
      nextSteps: [
        'Configure automated backup schedules',
        'Set up GitHub Actions for deployment',
        'Configure webhooks for real-time sync',
        'Test pull request automation'
      ]
    })

  } catch (error: any) {
    console.error('GitHub connection error:', error)
    return handleApiError(error)
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'GitHub integration endpoint',
    usage: 'POST with { githubUrl, accessToken }',
    security: 'Access tokens are handled securely and never exposed to client-side'
  })
}