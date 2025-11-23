import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

interface BackupConfig {
  owner: string
  repo: string
  token: string
  branch: string
}

interface BackupResult {
  success: boolean
  commitHash?: string
  timestamp?: string
  filesCount?: number
  error?: string
  details?: any
}

// Simple Git-based backup function
async function createGitBackup(config?: BackupConfig, options?: { syncFromGitHub?: boolean, overrideLatest?: boolean }): Promise<BackupResult> {
  const projectRoot = process.cwd()
  const { syncFromGitHub = true, overrideLatest = true } = options || {}
  
  try {
    console.log('🚀 Starting Git backup process...')
    
    // Step 1: Check if git is initialized
    try {
      await execAsync('git status', { timeout: 5000 })
    } catch (error) {
      console.log('📦 Initializing Git repository...')
      await execAsync('git init', { timeout: 5000 })
      await execAsync('git config user.name "Saanify Backup"', { timeout: 3000 })
      await execAsync('git config user.email "backup@saanify.com"', { timeout: 3000 })
    }
    
    // Step 2: Configure remote if config provided
    if (config && config.owner && config.repo && config.token) {
      const remoteUrl = `https://${config.token}@github.com/${config.owner}/${config.repo}.git`
      try {
        await execAsync(`git remote set-url origin ${remoteUrl}`, { timeout: 5000 })
        console.log('🔗 Remote configured successfully')
      } catch (error) {
        console.log('⚠️ Failed to configure remote, will try to add it...')
        try {
          await execAsync(`git remote add origin ${remoteUrl}`, { timeout: 5000 })
        } catch (addError) {
          console.warn('Could not configure remote:', addError)
        }
      }
      
      // Step 2.5: Sync from GitHub if enabled
      if (syncFromGitHub) {
        console.log('🔄 Syncing latest changes from GitHub...')
        try {
          const branch = config.branch || 'main'
          
          // Fetch latest changes from GitHub
          await execAsync('git fetch origin', { timeout: 30000 })
          console.log('✅ Fetched latest changes from GitHub')
          
          // Check if remote branch exists
          try {
            const { stdout: remoteBranches } = await execAsync(`git branch -r | grep "origin/${branch}"`, { timeout: 5000 })
            if (remoteBranches.trim()) {
              // Pull latest changes if we want to override or if local is behind
              if (overrideLatest) {
                try {
                  // Reset to remote branch to get latest state
                  await execAsync(`git reset --hard origin/${branch}`, { timeout: 10000 })
                  console.log('🔄 Reset to latest GitHub changes')
                } catch (resetError) {
                  console.warn('Could not reset to remote branch:', resetError)
                  // Try pull as fallback
                  await execAsync(`git pull origin ${branch}`, { timeout: 30000 })
                  console.log('📥 Pulled latest changes from GitHub')
                }
              } else {
                // Try to merge changes
                try {
                  await execAsync(`git pull origin ${branch} --rebase`, { timeout: 30000 })
                  console.log('📥 Merged latest changes from GitHub')
                } catch (pullError) {
                  console.warn('Could not pull changes, continuing with local state:', pullError)
                }
              }
            } else {
              console.log('ℹ️ Remote branch does not exist, will create on push')
            }
          } catch (branchCheckError) {
            console.log('ℹ️ Remote branch check failed, continuing with local state')
          }
        } catch (fetchError) {
          console.warn('Could not sync from GitHub, continuing with local state:', fetchError)
        }
      }
    }
    
    // Step 3: Add all files
    console.log('📋 Adding files to Git...')
    try {
      await execAsync('git add -A', { timeout: 10000 })
    } catch (addError) {
      console.warn('Git add failed:', addError)
    }
    
    // Step 4: Check if there are changes
    try {
      const { stdout: statusOutput } = await execAsync('git status --porcelain', { timeout: 5000 })
      if (!statusOutput.trim()) {
        console.log('ℹ️ No changes to commit')
        return {
          success: true,
          commitHash: 'no-changes',
          timestamp: new Date().toISOString(),
          filesCount: 0,
          details: {
            message: 'No changes to commit',
            note: 'Working tree is clean'
          }
        }
      }
    } catch (statusError) {
      console.warn('Could not check git status:', statusError)
    }
    
    // Step 5: Create commit
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const commitMessage = `🚀 Saanify Backup: ${timestamp}`
    
    console.log('💾 Creating commit...')
    try {
      const { stdout: commitOutput } = await execAsync(`git commit -m "${commitMessage}"`, { timeout: 10000 })
      console.log('Commit created:', commitOutput)
    } catch (commitError: any) {
      if (commitError.message?.includes('nothing to commit')) {
        return {
          success: true,
          commitHash: 'no-changes',
          timestamp,
          filesCount: 0,
          details: {
            message: 'No changes to commit',
            note: 'Working tree is clean'
          }
        }
      }
      throw commitError
    }
    
    // Step 6: Get commit hash
    let commitHash = 'unknown'
    try {
      const { stdout: logOutput } = await execAsync('git rev-parse HEAD', { timeout: 5000 })
      commitHash = logOutput.trim()
    } catch (hashError) {
      console.warn('Could not get commit hash:', hashError)
    }
    
    // Step 7: Push to remote if configured
    let pushSuccess = false
    let pushError = null
    
    if (config && config.owner && config.repo && config.token) {
      try {
        console.log('📤 Pushing to GitHub...')
        const branch = config.branch || 'main'
        
        // Try to push
        await execAsync(`git push -u origin ${branch}`, { timeout: 30000 })
        pushSuccess = true
        console.log('✅ Push successful')
      } catch (pushErr: any) {
        pushError = pushErr.message || 'Unknown push error'
        console.warn('Git push failed:', pushError)
        
        // Try setting upstream and pushing again
        try {
          await execAsync(`git push --set-upstream origin ${config.branch || 'main'}`, { timeout: 30000 })
          pushSuccess = true
          console.log('✅ Push successful (with upstream set)')
        } catch (secondPushErr) {
          console.warn('Second push attempt also failed:', secondPushErr)
        }
      }
    }
    
    // Step 8: Count files
    let filesCount = 0
    try {
      const { stdout: lsFilesOutput } = await execAsync('git ls-files | wc -l', { timeout: 5000 })
      filesCount = parseInt(lsFilesOutput.trim()) || 0
    } catch (countError) {
      console.warn('Could not count files:', countError)
    }
    
    return {
      success: true,
      commitHash,
      timestamp,
      filesCount,
      details: {
        pushSuccess,
        pushError,
        remoteConfigured: !!(config && config.owner && config.repo && config.token),
        repository: config ? `${config.owner}/${config.repo}` : 'local-only',
        branch: config?.branch || 'main',
        syncedFromGitHub: syncFromGitHub,
        overrodeLatest: overrideLatest
      }
    }
    
  } catch (error) {
    console.error('Backup failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// API Route Handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      action, 
      config, 
      useGit = true, 
      pushToGitHub = false, 
      syncFromGitHub = true,
      overrideLatest = true 
    } = body
    
    console.log('📥 Backup API called with action:', action)
    
    switch (action) {
      case 'quick-backup':
      case 'github-push-backup':
      case 'auto-backup':
        const result = await createGitBackup(
          pushToGitHub ? config : undefined, 
          { syncFromGitHub, overrideLatest }
        )
        
        if (result.success) {
          let message = '✅ Backup completed successfully'
          if (result.details?.syncedFromGitHub) {
            message += ' (synced from GitHub)'
          }
          if (result.details?.overrodeLatest) {
            message += ' (latest override)'
          }
          
          return NextResponse.json({
            success: true,
            commitHash: result.commitHash,
            timestamp: result.timestamp,
            filesCount: result.filesCount,
            message,
            details: result.details
          })
        } else {
          return NextResponse.json({
            success: false,
            error: result.error || 'Backup failed'
          }, { status: 500 })
        }
        
      case 'git-status':
        try {
          const { stdout: statusOutput } = await execAsync('git status --porcelain', { timeout: 5000 })
          const { stdout: branchOutput } = await execAsync('git branch --show-current', { timeout: 5000 })
          const { stdout: remoteOutput } = await execAsync('git remote -v', { timeout: 5000 })
          
          return NextResponse.json({
            success: true,
            status: {
              hasChanges: statusOutput.trim().length > 0,
              currentBranch: branchOutput.trim(),
              remote: remoteOutput.includes('origin'),
              changes: statusOutput.trim().split('\n').filter(line => line.trim())
            }
          })
        } catch (statusError) {
          return NextResponse.json({
            success: false,
            error: 'Could not get git status'
          }, { status: 500 })
        }
        
      default:
        return NextResponse.json({
          success: false,
          error: `Invalid action: ${action}. Supported actions: quick-backup, github-push-backup, auto-backup, git-status`
        }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Backup API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error during backup operation'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get backup history/log
    try {
      const { stdout: logOutput } = await execAsync('git log --oneline --pretty=format:"%H|%s|%ai" -20', { timeout: 5000 })
      
      const commits = logOutput.trim().split('\n').filter(line => line.trim()).map(line => {
        const [hash, ...messageParts] = line.split('|')
        const message = messageParts.join('|').slice(0, -6) // Remove timezone part
        const date = messageParts.slice(-1)[0]
        
        return {
          hash,
          message,
          date,
          isBackup: message.includes('Saanify Backup')
        }
      })
      
      return NextResponse.json({
        success: true,
        commits
      })
    } catch (logError) {
      return NextResponse.json({
        success: false,
        error: 'Could not get git log'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Backup GET error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}