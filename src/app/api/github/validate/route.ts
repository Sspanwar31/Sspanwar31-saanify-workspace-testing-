import { NextRequest, NextResponse } from 'next/server';
import { githubService } from '@/lib/github';
import { getGitHubConfig } from '@/lib/github';

export async function POST(request: NextRequest) {
  try {
    const { token, repository } = await request.json();

    if (!token || !repository) {
      return NextResponse.json(
        { error: 'Token and repository are required' },
        { status: 400 }
      );
    }

    // Validate repository using the GitHub service
    const validationResult = await githubService.validateRepository(token, repository);

    return NextResponse.json(validationResult);

  } catch (error: any) {
    console.error('Repository validation error:', error);

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return NextResponse.json(
        { 
          error: 'Network error',
          details: 'Unable to connect to GitHub. Please check your internet connection.',
          code: 'NETWORK_ERROR'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: 'An unexpected error occurred while validating the repository.',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to validate GitHub configuration
export async function GET() {
  try {
    const config = getGitHubConfig();
    
    // Test the GitHub token by making a simple API call
    const testResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!testResponse.ok) {
      const errorData = await testResponse.json().catch(() => ({}));
      return NextResponse.json({
        valid: false,
        error: 'Invalid GitHub token',
        details: errorData.message || 'Token validation failed',
        config: {
          tokenPresent: !!config.token,
          tokenFormat: config.token.startsWith('ghp_') || config.token.startsWith('github_pat_') ? 'valid' : 'invalid',
          webhookSecretPresent: !!config.webhookSecret,
          repoUrlPresent: !!config.repoUrl
        }
      }, { status: 400 });
    }

    const userData = await testResponse.json();

    return NextResponse.json({
      valid: true,
      message: 'GitHub configuration is valid',
      user: {
        login: userData.login,
        name: userData.name,
        avatar_url: userData.avatar_url
      },
      config: {
        tokenPresent: !!config.token,
        tokenFormat: 'valid',
        webhookSecretPresent: !!config.webhookSecret,
        repoUrlPresent: !!config.repoUrl
      }
    });

  } catch (error: any) {
    console.error('Configuration validation error:', error);
    
    return NextResponse.json({
      valid: false,
      error: 'Configuration validation failed',
      details: error.message || 'Unknown error occurred',
      config: {
        tokenPresent: !!process.env.GITHUB_TOKEN,
        webhookSecretPresent: !!process.env.GITHUB_WEBHOOK_SECRET,
        repoUrlPresent: !!process.env.GITHUB_REPO_URL
      }
    }, { status: 500 });
  }
}