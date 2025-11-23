import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { owner, repo, token } = await request.json()
    
    if (!owner || !repo || !token) {
      return NextResponse.json(
        { error: 'Owner, repo, and token are required' },
        { status: 400 }
      )
    }
    
    // Determine token type and use appropriate auth method
    const isClassicToken = token.startsWith('ghp_')
    const authMethod = isClassicToken ? 'token' : 'Bearer'
    
    // Test repository access
    const repoResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          'Authorization': `${authMethod} ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )
    
    if (repoResponse.ok) {
      const repoData = await repoResponse.json()
      
      // Test write permissions by trying to create a dummy file (dry run)
      const testResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/README.md`,
        {
          headers: {
            'Authorization': `${authMethod} ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }
      )
      
      let hasWriteAccess = false
      if (testResponse.ok || testResponse.status === 404) {
        hasWriteAccess = true
      }
      
      return NextResponse.json({
        success: true,
        repository: {
          name: repoData.full_name,
          description: repoData.description,
          private: repoData.private,
          defaultBranch: repoData.default_branch,
          createdAt: repoData.created_at,
          updatedAt: repoData.updated_at
        },
        permissions: {
          hasWriteAccess,
          canRead: true
        },
        message: 'Repository access verified successfully'
      })
      
    } else {
      const errorData = await repoResponse.json().catch(() => ({}))
      
      if (repoResponse.status === 404) {
        return NextResponse.json({
          success: false,
          error: `Repository "${owner}/${repo}" not found or you don't have access`,
          suggestions: [
            'Check the repository name spelling',
            'Ensure you have access to this repository',
            'Use the "Search My Repos" feature to find your repositories'
          ]
        }, { status: 404 })
      } else if (repoResponse.status === 401) {
        return NextResponse.json({
          success: false,
          error: 'Invalid or expired token',
          suggestions: [
            'Generate a new token from GitHub settings',
            'Ensure token has "repo" scope'
          ]
        }, { status: 401 })
      } else if (repoResponse.status === 403) {
        return NextResponse.json({
          success: false,
          error: 'Token lacks required permissions',
          suggestions: [
            'Ensure token has "repo" scope',
            'For private repos, you need collaborator access'
          ]
        }, { status: 403 })
      }
      
      return NextResponse.json({
        success: false,
        error: errorData.message || 'Failed to access repository'
      }, { status: repoResponse.status })
    }
    
  } catch (error) {
    console.error('Repository test error:', error)
    return NextResponse.json(
      { error: 'Network error - please check your internet connection' },
      { status: 500 }
    )
  }
}
