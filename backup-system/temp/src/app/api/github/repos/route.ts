import { NextRequest, NextResponse } from 'next/server'

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
  html_url: string
  description: string | null
  created_at: string
  updated_at: string
}

interface GitHubSearchResult {
  total_count: number
  incomplete_results: boolean
  items: GitHubRepo[]
}

// GET - Search repositories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = Math.min(parseInt(searchParams.get('per_page') || '30'), 100)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'GitHub token is required' },
        { status: 401 }
      )
    }

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // Validate token format
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
      return NextResponse.json(
        { error: 'Invalid GitHub token format' },
        { status: 401 }
      )
    }

    // Search repositories
    const searchQuery = `${query} in:name user:${await getUsername(token)}`
    const searchResponse = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&page=${page}&per_page=${perPage}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    )

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}))
      return handleGitHubError(searchResponse.status, errorData.message || 'Search failed')
    }

    const searchResult: GitHubSearchResult = await searchResponse.json()
    
    return NextResponse.json({
      success: true,
      data: {
        totalCount: searchResult.total_count,
        repositories: searchResult.items.map(repo => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          private: repo.private,
          url: repo.html_url,
          description: repo.description,
          createdAt: repo.created_at,
          updatedAt: repo.updated_at
        })),
        currentPage: page,
        perPage
      },
      message: `Found ${searchResult.items.length} repositories`
    })

  } catch (error: any) {
    console.error('Repository search error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: 'An unexpected error occurred while searching repositories.',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

// POST - Get user repositories
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json(
        { error: 'GitHub token is required' },
        { status: 401 }
      )
    }

    // Validate token format
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
      return NextResponse.json(
        { error: 'Invalid GitHub token format' },
        { status: 401 }
      )
    }
    
    // Get user repositories
    const reposResponse = await fetch('https://api.github.com/user/repos?per_page=100&type=all', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    if (!reposResponse.ok) {
      const errorData = await reposResponse.json().catch(() => ({}))
      return handleGitHubError(reposResponse.status, errorData.message || 'Failed to fetch repositories')
    }
    
    const repos: GitHubRepo[] = await reposResponse.json()
    
    // Get user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    if (!userResponse.ok) {
      const errorData = await userResponse.json().catch(() => ({}))
      return handleGitHubError(userResponse.status, errorData.message || 'Failed to fetch user profile')
    }
    
    const user = await userResponse.json()
    
    return NextResponse.json({
      success: true,
      user: {
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
        html_url: user.html_url
      },
      repositories: repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        url: repo.html_url,
        description: repo.description,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at
      }))
    })
    
  } catch (error: any) {
    console.error('GitHub repositories error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: 'An unexpected error occurred while fetching repositories.',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

// Helper function to get username from token
async function getUsername(token: string): Promise<string> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to get username')
    }
    
    const user = await response.json()
    return user.login
  } catch (error) {
    console.error('Error getting username:', error)
    return ''
  }
}

// Helper function to handle GitHub API errors
function handleGitHubError(status: number, message: string) {
  switch (status) {
    case 401:
      return NextResponse.json(
        { 
          error: 'Authentication failed',
          details: 'Your GitHub token is invalid or expired. Please generate a new token.',
          code: 'INVALID_TOKEN'
        },
        { status: 401 }
      )

    case 403:
      return NextResponse.json(
        { 
          error: 'Insufficient permissions',
          details: 'Your token lacks the required permissions. Please ensure it has the "repo" scope.',
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        { status: 403 }
      )

    case 422:
      return NextResponse.json(
        { 
          error: 'Invalid search query',
          details: 'Your search query is too short or contains invalid characters.',
          code: 'INVALID_QUERY'
        },
        { status: 422 }
      )

    default:
      return NextResponse.json(
        { 
          error: 'GitHub API error',
          details: message,
          code: 'GITHUB_API_ERROR'
        },
        { status: status }
      )
  }
}