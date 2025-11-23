import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging Git status...')
    
    const results: any = {}
    
    // Check git status
    try {
      const { stdout: gitStatus } = await execAsync('git status --porcelain', { timeout: 5000 })
      results.gitStatus = gitStatus
      results.hasChanges = gitStatus.trim().length > 0
    } catch (error: any) {
      results.gitStatusError = error.message
    }
    
    // Check current branch
    try {
      const { stdout: currentBranch } = await execAsync('git branch --show-current', { timeout: 5000 })
      results.currentBranch = currentBranch.trim()
    } catch (error: any) {
      results.currentBranchError = error.message
    }
    
    // Check remote status
    try {
      const { stdout: remoteStatus } = await execAsync('git remote -v', { timeout: 5000 })
      results.remoteStatus = remoteStatus
    } catch (error: any) {
      results.remoteStatusError = error.message
    }
    
    // Check last commit
    try {
      const { stdout: lastCommit } = await execAsync('git log --oneline -1', { timeout: 5000 })
      results.lastCommit = lastCommit.trim()
    } catch (error: any) {
      results.lastCommitError = error.message
    }
    
    // Check if git is initialized
    try {
      const { stdout: gitDir } = await execAsync('git rev-parse --git-dir', { timeout: 5000 })
      results.gitDir = gitDir.trim()
    } catch (error: any) {
      results.gitDirError = error.message
    }
    
    // Check working directory
    try {
      const { stdout: workingDir } = await execAsync('pwd', { timeout: 5000 })
      results.workingDir = workingDir.trim()
    } catch (error: any) {
      results.workingDirError = error.message
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    })
    
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}