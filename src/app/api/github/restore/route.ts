import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface GitHubConfig {
  owner: string
  repo: string
  token: string
  branch: string
}

interface RestoreResult {
  success: boolean
  commitHash?: string
  timestamp?: string
  filesCount?: number
  error?: string
  details?: any
}

// Restore from latest GitHub backup
async function restoreFromLatestGitHub(config: GitHubConfig): Promise<RestoreResult> {
  const projectRoot = process.cwd()
  
  try {
    console.log('🔄 Starting restore from latest GitHub backup...')
    
    // Step 1: Configure remote
    const remoteUrl = `https://${config.token}@github.com/${config.owner}/${config.repo}.git`
    try {
      await execAsync(`git remote set-url origin ${remoteUrl}`, { timeout: 5000 })
      console.log('🔗 Remote configured successfully')
    } catch (error) {
      try {
        await execAsync(`git remote add origin ${remoteUrl}`, { timeout: 5000 })
        console.log('🔗 Remote added successfully')
      } catch (addError) {
        console.warn('Could not configure remote:', addError)
        throw new Error('Failed to configure GitHub remote')
      }
    }
    
    // Step 2: Fetch latest changes from GitHub
    console.log('📥 Fetching latest changes from GitHub...')
    try {
      await execAsync('git fetch origin', { timeout: 30000 })
      console.log('✅ Fetched latest changes from GitHub')
    } catch (fetchError) {
      console.error('Failed to fetch from GitHub:', fetchError)
      throw new Error('Failed to fetch latest changes from GitHub')
    }
    
    // Step 3: Get latest commit hash from remote
    let latestCommitHash = ''
    const branch = config.branch || 'main'
    
    try {
      const { stdout: latestCommit } = await execAsync(`git rev-parse origin/${branch}`, { timeout: 5000 })
      latestCommitHash = latestCommit.trim()
      console.log(`📝 Latest commit hash: ${latestCommitHash}`)
    } catch (commitError) {
      console.error('Failed to get latest commit hash:', commitError)
      throw new Error('Failed to get latest commit from GitHub')
    }
    
    // Step 4: Clean working directory (remove uncommitted changes)
    console.log('🧹 Cleaning working directory...')
    try {
      // Stash any changes first
      await execAsync('git stash push -m "Auto-stash before restore"', { timeout: 10000 })
      console.log('💾 Stashed local changes')
    } catch (stashError) {
      console.log('ℹ️ No changes to stash or stash failed')
    }
    
    // Reset to match remote exactly
    try {
      await execAsync(`git reset --hard origin/${branch}`, { timeout: 10000 })
      console.log('🔄 Reset to latest GitHub state')
    } catch (resetError) {
      console.error('Failed to reset to remote state:', resetError)
      throw new Error('Failed to reset to latest GitHub state')
    }
    
    // Clean untracked files
    try {
      await execAsync('git clean -fd', { timeout: 10000 })
      console.log('🧹 Cleaned untracked files')
    } catch (cleanError) {
      console.warn('Could not clean untracked files:', cleanError)
    }
    
    // Step 5: Count files
    let filesCount = 0
    try {
      const { stdout: lsFilesOutput } = await execAsync('git ls-files | wc -l', { timeout: 5000 })
      filesCount = parseInt(lsFilesOutput.trim()) || 0
    } catch (countError) {
      console.warn('Could not count files:', countError)
    }
    
    // Step 6: Get commit details
    let commitDetails = {}
    try {
      const { stdout: commitInfo } = await execAsync(
        `git show --format="%H|%s|%ai|%an" --no-patch ${latestCommitHash}`, 
        { timeout: 5000 }
      )
      const [hash, message, date, author] = commitInfo.trim().split('|')
      commitDetails = { hash, message, date, author }
    } catch (infoError) {
      console.warn('Could not get commit details:', infoError)
    }
    
    return {
      success: true,
      commitHash: latestCommitHash,
      timestamp: new Date().toISOString(),
      filesCount,
      details: {
        repository: `${config.owner}/${config.repo}`,
        branch: config.branch || 'main',
        commitDetails,
        message: 'Successfully restored from latest GitHub backup',
        restoredFrom: 'GitHub'
      }
    }
    
  } catch (error) {
    console.error('Restore failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// API Route Handler
export async function POST(request: NextRequest) {
  try {
    const { config, action } = await request.json()
    
    if (!config || !config.owner || !config.repo || !config.token) {
      return NextResponse.json(
        { error: 'GitHub configuration is required (owner, repo, token)' },
        { status: 400 }
      )
    }
    
    if (action === 'restore-latest') {
      const result = await restoreFromLatestGitHub(config)
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          commitHash: result.commitHash,
          timestamp: result.timestamp,
          filesCount: result.filesCount,
          message: '✅ Successfully restored from latest GitHub backup',
          details: result.details
        })
      } else {
        return NextResponse.json({
          success: false,
          error: result.error || 'Restore failed'
        }, { status: 500 })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: `Invalid action: ${action}. Supported actions: restore-latest`
    }, { status: 400 })
    
  } catch (error) {
    console.error('GitHub restore API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error during restore operation'
    }, { status: 500 })
  }
}