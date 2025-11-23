import { NextRequest, NextResponse } from 'next/server'

interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      date: string
    }
    committer: {
      name: string
      date: string
    }
  }
  html_url: string
}

export async function POST(request: NextRequest) {
  try {
    const { owner, repo, token, branch = 'main' } = await request.json()
    
    if (!owner || !repo || !token) {
      return NextResponse.json(
        { error: 'Owner, repo, and token are required' },
        { status: 400 }
      )
    }
    
    // Get commit history
    // Determine token type and use appropriate auth method
    const isClassicToken = token.startsWith('ghp_')
    const authMethod = isClassicToken ? 'token' : 'Bearer'
    
    console.log('Request body:', { owner, repo, branch: branch, tokenProvided: !!token })
    console.log(`Fetching commits for ${owner}/${repo} from branch: ${branch}`)
    console.log(`Using auth method: ${authMethod}`)
    
    const commitsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=50`,
      {
        headers: {
          'Authorization': `${authMethod} ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )
    
    if (!commitsResponse.ok) {
      const errorData = await commitsResponse.json().catch(() => ({}))
      let errorMessage = 'Failed to fetch commit history'
      
      // Provide specific error messages
      if (commitsResponse.status === 401) {
        errorMessage = '❌ Invalid or expired token. Please check your GitHub personal access token'
      } else if (commitsResponse.status === 403) {
        errorMessage = '❌ Token lacks required permissions. Please ensure token has "repo" scope'
      } else if (commitsResponse.status === 404) {
        errorMessage = `❌ Repository "${owner}/${repo}" not found or you don't have access`
      } else if (commitsResponse.status === 409) {
        errorMessage = '⚠️ Repository is empty. No commits found'
      }
      
      console.error('GitHub API Error:', commitsResponse.status, errorData)
      return NextResponse.json(
        { error: errorMessage, details: errorData },
        { status: commitsResponse.status }
      )
    }
    
    const commits: GitHubCommit[] = await commitsResponse.json()
    
      console.log(`Found ${commits.length} total commits`)
    
    // Log some commit messages for debugging
    if (commits.length > 0) {
      console.log('Recent commit messages:')
      commits.slice(0, 5).forEach((commit, index) => {
        console.log(`  ${index + 1}. ${commit.commit.message}`)
      })
    }
    
    // Check if commits array is empty (repository might be empty)
    if (!commits || commits.length === 0) {
      return NextResponse.json({
        success: true,
        commits: [],
        total: 0,
        message: 'Repository is empty or no commits found'
      })
    }
    
    // Filter backup commits (those with "Backup:" prefix)
    const backupCommits = commits
      .filter(commit => commit.commit.message.includes('Backup:'))
      .map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        url: commit.html_url,
        timestamp: commit.commit.message.replace('Backup: ', '')
      }))
    
    console.log(`Found ${backupCommits.length} backup commits out of ${commits.length} total commits`)
    
    // If no backup commits found, return all commits so user can see repository activity
    if (backupCommits.length === 0) {
      const allCommitsFormatted = commits.slice(0, 10).map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        url: commit.html_url,
        timestamp: commit.commit.author.date
      }))
      
      return NextResponse.json({
        success: true,
        commits: allCommitsFormatted,
        total: allCommitsFormatted.length,
        message: 'No backup commits found. Showing recent commits instead.'
      })
    }
    
    return NextResponse.json({
      success: true,
      commits: backupCommits,
      total: backupCommits.length
    })
    
  } catch (error) {
    console.error('GitHub history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch commit history' },
      { status: 500 }
    )
  }
}