import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { config, message } = await request.json()
    
    if (!config || !config.owner || !config.repo || !config.token) {
      return NextResponse.json(
        { error: 'GitHub configuration is required' },
        { status: 400 }
      )
    }

    // Reset any stuck commit state first
    try {
      await execAsync('git reset')
    } catch (resetError) {
      // Ignore reset errors, it's just precautionary
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const commitMessage = message || `🚀 Quick Backup: ${timestamp}`
    
    // Execute git commands
    const { stdout: addOutput } = await execAsync('git add -A')
    
    // Check if there are changes to commit
    try {
      const { stdout: commitOutput } = await execAsync(`git commit -m "${commitMessage}"`)
      const { stdout: logOutput } = await execAsync('git log --oneline -1')
      
      // Extract commit hash
      const commitHash = logOutput.split(' ')[0]
      
      // Configure remote with token
      const remoteUrl = `https://${config.token}@github.com/${config.owner}/${config.repo}.git`
      await execAsync(`git remote set-url origin ${remoteUrl}`)
      
      // Push to GitHub
      const { stdout: pushOutput } = await execAsync('git push -u origin main')
      
      return NextResponse.json({
        success: true,
        commitHash,
        timestamp,
        message: commitMessage,
        details: {
          addOutput,
          commitOutput,
          pushOutput
        }
      })
    } catch (commitError: any) {
      // Check if it's because there are no changes
      if (commitError.message.includes('nothing to commit')) {
        return NextResponse.json({
          success: true,
          commitHash: 'no-changes',
          message: 'No changes to commit - working tree clean',
          details: {
            note: 'No new changes detected'
          }
        })
      }
      
      // Check for stuck commit message issues
      if (commitError.message.includes('COMMIT_EDITMSG')) {
        try {
          // Try to fix the stuck commit
          await execAsync('git reset')
          await execAsync('rm -f .git/COMMIT_EDITMSG')
          
          // Retry the commit
          const { stdout: commitOutput } = await execAsync(`git commit -m "${commitMessage}"`)
          const { stdout: logOutput } = await execAsync('git log --oneline -1')
          
          const commitHash = logOutput.split(' ')[0]
          
          // Configure remote with token
          const remoteUrl = `https://${config.token}@github.com/${config.owner}/${config.repo}.git`
          await execAsync(`git remote set-url origin ${remoteUrl}`)
          
          // Push to GitHub
          const { stdout: pushOutput } = await execAsync('git push -u origin main')
          
          return NextResponse.json({
            success: true,
            commitHash,
            timestamp,
            message: commitMessage,
            details: {
              addOutput,
              commitOutput,
              pushOutput,
              recovered: true
            }
          })
        } catch (retryError) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Git state was corrupted and could not be auto-fixed. Please try again.' 
            },
            { status: 500 }
          )
        }
      }
      
      throw commitError
    }
    
  } catch (error) {
    console.error('Git push failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Git push failed' 
      },
      { status: 500 }
    )
  }
}