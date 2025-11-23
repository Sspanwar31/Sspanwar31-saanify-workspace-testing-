import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

interface GitHubConfig {
  owner: string
  repo: string
  token: string
  branch: string
}

interface BackupResult {
  success: boolean
  commitSha?: string
  timestamp?: string
  filesCount?: number
  error?: string
  details?: any
}

// Enhanced GitHub API helper functions
class GitHubAPI {
  private config: GitHubConfig

  constructor(config: GitHubConfig) {
    this.config = config
  }

  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    // Determine token type and use appropriate auth method
    const isClassicToken = this.config.token.startsWith('ghp_')
    const authMethod = isClassicToken ? 'token' : 'Bearer'
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `${authMethod} ${this.config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...options.headers
      },
      ...options
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`GitHub API Error: ${response.status} - ${error.message || response.statusText}`)
    }

    return response
  }

  async getBranchInfo() {
    try {
      const response = await this.makeRequest(
        `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/refs/heads/${this.config.branch}`
      )
      return response.json()
    } catch (error: any) {
      // If branch doesn't exist, check if repository exists and is empty
      if (error.message?.includes('Not Found')) {
        try {
          const repoResponse = await this.getRepository()
          if (repoResponse) {
            // Repository exists but branch doesn't - might be empty repo
            console.log('Repository exists but branch not found - checking if empty...')
            return null // Indicates empty repository or no branch
          }
        } catch (repoError) {
          console.error('Repository access failed:', repoError)
        }
      }
      throw error
    }
  }

  async getDefaultBranch() {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.config.owner}/${this.config.repo}`
    )
    const repo = await response.json()
    return repo.default_branch || 'main'
  }

  async createBranch(branchName: string, fromSha?: string) {
    try {
      // Get default branch if no SHA provided
      if (!fromSha) {
        const defaultBranch = await this.getDefaultBranch()
        const defaultBranchInfo = await this.makeRequest(
          `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/refs/heads/${defaultBranch}`
        )
        const defaultBranchData = await defaultBranchInfo.json()
        fromSha = defaultBranchData.object.sha
      }

      const response = await this.makeRequest(
        `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/refs`,
        {
          method: 'POST',
          body: JSON.stringify({
            ref: `refs/heads/${branchName}`,
            sha: fromSha
          })
        }
      )
      return response.json()
    } catch (error: any) {
      console.error('Failed to create branch:', error)
      throw error
    }
  }

  async getCommit(sha: string) {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/commits/${sha}`
    )
    return response.json()
  }

  async createBlob(content: string, encoding: 'base64' | 'utf-8' = 'base64') {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/blobs`,
      {
        method: 'POST',
        body: JSON.stringify({ content, encoding })
      }
    )
    return response.json()
  }

  async createTree(baseTreeSha?: string, files: any[]) {
    const requestBody: any = {
      tree: files
    }
    
    // Only include base_tree if it exists
    if (baseTreeSha) {
      requestBody.base_tree = baseTreeSha
    }
    
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/trees`,
      {
        method: 'POST',
        body: JSON.stringify(requestBody)
      }
    )
    return response.json()
  }

  async createCommit(message: string, treeSha: string, parentSha?: string) {
    const requestBody: any = {
      message,
      tree: treeSha
    }
    
    // Only include parents if they exist
    if (parentSha) {
      requestBody.parents = [parentSha]
    }
    
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/commits`,
      {
        method: 'POST',
        body: JSON.stringify(requestBody)
      }
    )
    return response.json()
  }

  async updateReference(sha: string, force: boolean = false) {
    try {
      const response = await this.makeRequest(
        `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/refs/heads/${this.config.branch}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ sha, force })
        }
      )
      return response.json()
    } catch (error: any) {
      // If reference doesn't exist (404), create it
      if (error.message?.includes('Not Found')) {
        console.log('Branch reference not found, creating new branch...')
        try {
          // Try to create the branch
          await this.createBranch(this.config.branch, sha)
          // Return success response
          return { ref: `refs/heads/${this.config.branch}`, object: { sha } }
        } catch (createError: any) {
          // If branch creation fails, try to create reference directly
          console.log('Creating reference directly...')
          const createResponse = await this.makeRequest(
            `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/git/refs`,
            {
              method: 'POST',
              body: JSON.stringify({
                ref: `refs/heads/${this.config.branch}`,
                sha
              })
            }
          )
          return createResponse.json()
        }
      }
      // If fast-forward error and force is not enabled, try with force
      else if (!force && error.message?.includes('Update is not a fast forward')) {
        console.log('Fast-forward update failed, attempting force push...')
        return this.updateReference(sha, true)
      }
      throw error
    }
  }

  async getRepository() {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.config.owner}/${this.config.repo}`
    )
    return response.json()
  }

  async createCommitStatus(sha: string, state: 'pending' | 'success' | 'error' | 'failure', description: string) {
    try {
      const response = await this.makeRequest(
        `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/statuses/${sha}`,
        {
          method: 'POST',
          body: JSON.stringify({
            state,
            description,
            context: 'saanify-backup'
          })
        }
      )
      return response.json()
    } catch (error) {
      // Status creation is optional, don't fail if it doesn't work
      console.warn('Failed to create commit status:', error)
    }
  }
}

// Enhanced file system operations
class FileSystemManager {
  private static readonly EXCLUDE_PATTERNS = [
    'node_modules',
    '.next',
    '.git',
    'dist',
    'build',
    '.env*',
    '*.log',
    '.DS_Store',
    'Thumbs.db'
  ]

  static async getAllFiles(dir: string, fileList: string[] = []): Promise<string[]> {
    try {
      const files = await fs.readdir(dir)
      
      for (const file of files) {
        const filePath = path.join(dir, file)
        const stat = await fs.stat(filePath)
        
        if (stat.isDirectory()) {
          // Skip excluded directories
          if (this.shouldExclude(file)) continue
          await this.getAllFiles(filePath, fileList)
        } else if (stat.isFile()) {
          // Skip excluded files
          if (this.shouldExclude(file)) continue
          fileList.push(filePath)
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dir}:`, error)
    }
    
    return fileList
  }

  private static shouldExclude(fileName: string): boolean {
    return this.EXCLUDE_PATTERNS.some(pattern => {
      // Simple glob pattern matching
      const regex = new RegExp(pattern.replace('*', '.*'))
      return regex.test(fileName)
    })
  }

  static async getFileSize(filePath: string): Promise<number> {
    try {
      const stat = await fs.stat(filePath)
      return stat.size
    } catch {
      return 0
    }
  }

  static async createBackupManifest(files: string[]): Promise<any> {
    const manifest = {
      timestamp: new Date().toISOString(),
      totalFiles: files.length,
      totalSize: 0,
      files: [] as any[]
    }

    for (const file of files) {
      const size = await this.getFileSize(file)
      manifest.totalSize += size
      manifest.files.push({
        path: file.replace(process.cwd() + '/', ''),
        size,
        lastModified: (await fs.stat(file)).mtime.toISOString()
      })
    }

    return manifest
  }
}

// Main backup function with enhanced error handling
async function createBackup(config: GitHubConfig): Promise<BackupResult> {
  const github = new GitHubAPI(config)
  const projectRoot = process.cwd()
  
  try {
    // Step 1: Get current branch info
    console.log('Getting branch information...')
    let latestCommitSha: string | null = null
    let repositoryExists = true
    
    try {
      const branchInfo = await github.getBranchInfo()
      if (branchInfo) {
        latestCommitSha = branchInfo.object.sha
      } else {
        // Branch doesn't exist, check if repository exists
        await github.getRepository()
        console.log('Repository exists but branch not found - will create new branch')
        latestCommitSha = null
      }
    } catch (branchError: any) {
      // If repository doesn't exist or access denied
      if (branchError.message?.includes('Not Found') || branchError.message?.includes('Git Repository is empty')) {
        console.log('Repository is empty or not accessible, creating initial commit...')
        latestCommitSha = null
        repositoryExists = false
      } else {
        throw branchError
      }
    }
    
    // Step 2: Get all project files
    console.log('Scanning project files...')
    const files = await FileSystemManager.getAllFiles(projectRoot)
    
    if (files.length === 0) {
      throw new Error('No files found to backup')
    }

    // Step 3: Create backup manifest
    console.log('Creating backup manifest...')
    const manifest = await FileSystemManager.createBackupManifest(files)
    
    // Step 4: Create blobs for all files
    console.log(`Creating blobs for ${files.length} files...`)
    const filePromises = files.map(async (file) => {
      try {
        const content = await fs.readFile(file, 'base64')
        const blob = await github.createBlob(content)
        return {
          path: file.replace(projectRoot + '/', ''),
          mode: '100644',
          type: 'blob',
          sha: blob.sha
        }
      } catch (error) {
        console.warn(`Failed to process file ${file}:`, error)
        return null
      }
    })

    const fileObjects = (await Promise.all(filePromises)).filter(obj => obj !== null)
    
    if (fileObjects.length === 0) {
      throw new Error('No files could be processed for backup')
    }

    // Step 5: Create tree
    console.log('Creating git tree...')
    const tree = await github.createTree(latestCommitSha || undefined, fileObjects)
    
    // Step 6: Create commit
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const commitMessage = `🚀 Saanify Backup: ${timestamp}\n\n📊 Backup Summary:\n• Files: ${files.length}\n• Size: ${(manifest.totalSize / 1024 / 1024).toFixed(2)} MB\n• Timestamp: ${timestamp}`
    
    console.log('Creating commit...')
    const commit = await github.createCommit(commitMessage, tree.sha, latestCommitSha || undefined)
    
    // Step 7: Update reference (create branch if needed)
    console.log('Updating branch reference...')
    try {
      await github.updateReference(commit.sha, false)
    } catch (updateError: any) {
      console.warn('Failed to update reference, trying force update...')
      await github.updateReference(commit.sha, true)
    }
    
    // Step 8: Create commit status
    await github.createCommitStatus(commit.sha, 'success', 'Backup completed successfully')
    
    return {
      success: true,
      commitSha: commit.sha,
      timestamp,
      filesCount: files.length,
      details: {
        manifest,
        commitUrl: `https://github.com/${config.owner}/${config.repo}/commit/${commit.sha}`,
        totalSize: manifest.totalSize,
        repositoryCreated: !repositoryExists,
        branchCreated: latestCommitSha === null
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

// Restore function with enhanced capabilities
async function restoreFromBackup(config: GitHubConfig, commitSha: string): Promise<BackupResult> {
  const github = new GitHubAPI(config)
  
  try {
    console.log('Getting commit information...')
    const commit = await github.getCommit(commitSha)
    
    // This is a simplified restore - in production, you'd want to handle this more carefully
    // You might need to checkout the specific commit and handle conflicts
    
    return {
      success: true,
      commitSha,
      timestamp: commit.commit.committer.date,
      details: {
        message: commit.commit.message,
        author: commit.commit.author.name,
        treeSha: commit.tree.sha,
        commitUrl: `https://github.com/${config.owner}/${config.repo}/commit/${commitSha}`
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

// Enhanced API route handler
export async function POST(request: NextRequest) {
  try {
    const { action, config, commitSha, useGit, pushToGitHub } = await request.json()
    
    // Check if we have valid GitHub configuration (not demo values) - DO THIS FIRST
    const isDemoConfig = !config || 
                        !config.token || 
                        config.token === 'demo-token' || 
                        config.owner === 'demo-user' || 
                        config.repo === 'demo-repo' ||
                        config.token.includes('your-personal-access-token') ||
                        config.owner.includes('your-username') ||
                        config.repo.includes('your-repo-name')
    
    // Handle quick git backup (no GitHub API required)
    if (action === 'quick-backup' && useGit) {
      return await handleQuickGitBackup()
    }

    // Handle GitHub push backup
    if (action === 'github-push-backup' && pushToGitHub) {
      return await handleGitHubPushBackup(config)
    }

    // Handle auto backup
    if (action === 'auto-backup' && pushToGitHub) {
      return await handleAutoBackup(config)
    }

    // Handle restore
    if (action === 'restore') {
      return await handleRestore(config)
    }

    // Handle git restore (fetch and reset)
    if (action === 'git-restore') {
      return await handleGitRestore(config)
    }
    
    // Skip validation for demo mode
    if (isDemoConfig) {
      return NextResponse.json(
        { error: 'Demo mode: This action is not supported with demo credentials' },
        { status: 400 }
      )
    }
    
    if (!config || !config.owner || !config.repo || !config.token) {
      return NextResponse.json(
        { error: 'GitHub configuration is required (owner, repo, token)' },
        { status: 400 }
      )
    }

    // Validate configuration (only for real config)
    try {
      const github = new GitHubAPI(config)
      await github.getRepository()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid GitHub configuration or insufficient permissions' },
        { status: 400 }
      )
    }

    let result: BackupResult

    switch (action) {
      case 'backup':
        result = await createBackup(config)
        break
        
      case 'restore':
        if (!commitSha) {
          return NextResponse.json(
            { error: 'Commit SHA is required for restore operation' },
            { status: 400 }
          )
        }
        result = await restoreFromBackup(config, commitSha)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: backup, restore' },
          { status: 400 }
        )
    }

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { error: result.error || 'Operation failed' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('GitHub API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during GitHub operation' },
      { status: 500 }
    )
  }
}

// GitHub Push Backup Function
async function handleGitHubPushBackup(config: GitHubConfig): Promise<NextResponse> {
  try {
    // Check if we have valid GitHub configuration (not demo values) - DO THIS FIRST
    const isDemoConfig = !config.token || 
                        config.token === 'demo-token' || 
                        config.owner === 'demo-user' || 
                        config.repo === 'demo-repo' ||
                        config.token.includes('your-personal-access-token') ||
                        config.owner.includes('your-username') ||
                        config.repo.includes('your-repo-name')

    // If demo mode, return immediately without any git operations
    if (isDemoConfig) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      return NextResponse.json({
        success: true,
        commitHash: 'demo-mode',
        timestamp,
        message: 'Demo mode - backup simulated',
        details: {
          localBackup: false,
          pushToGitHub: false,
          note: 'Demo mode: Backup simulated (no actual git operations performed)',
          reason: 'GitHub credentials not configured or using demo values'
        }
      })
    }

    // Reset any stuck commit state first (only for real config)
    try {
      await execAsync('git reset', { timeout: 3000 })
    } catch (resetError) {
      // Ignore reset errors, it's just precautionary
    }

    // Sync from GitHub first to get latest changes
    console.log('🔄 Syncing from GitHub before backup...')
    let remoteBranchExists = false
    
    try {
      const remoteUrl = `https://${config.token}@github.com/${config.owner}/${config.repo}.git`
      await execAsync(`git remote set-url origin ${remoteUrl}`, { timeout: 5000 })
      
      // Fetch latest changes
      await execAsync('git fetch origin', { timeout: 30000 })
      console.log('✅ Fetched latest changes from GitHub')
      
      // Check if remote branch exists
      const branch = config.branch || 'main'
      try {
        const { stdout: branchCheck } = await execAsync(`git ls-remote --heads origin ${branch}`, { timeout: 5000 })
        if (branchCheck.trim()) {
          remoteBranchExists = true
          console.log(`✅ Remote branch '${branch}' exists`)
          
          // Reset to match remote exactly (override local with latest)
          try {
            await execAsync(`git reset --hard origin/${branch}`, { timeout: 10000 })
            console.log('🔄 Reset to latest GitHub changes')
          } catch (resetError) {
            console.warn('Could not reset to remote branch:', resetError)
            // Continue with local state if reset fails
          }
        } else {
          console.log(`ℹ️ Remote branch '${branch}' does not exist - will create on push`)
          remoteBranchExists = false
        }
      } catch (branchCheckError) {
        console.log('ℹ️ Could not check remote branch, assuming it does not exist')
        remoteBranchExists = false
      }
    } catch (syncError) {
      console.warn('Could not sync from GitHub, continuing with local state:', syncError)
      remoteBranchExists = false
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const commitMessage = `🚀 Saanify Backup: ${timestamp}`
    
    // Execute git commands with shorter timeouts
    const { stdout: addOutput } = await execAsync('git add -A', { timeout: 5000 })
    
    // Try to commit, but handle case where there are no changes
    let commitOutput: string
    let hasChanges = false
    
    try {
      const result = await execAsync(`git commit -m "${commitMessage}"`, { timeout: 10000 })
      commitOutput = result.stdout
      hasChanges = true
    } catch (commitError: any) {
      // Check if it's because there are no changes
      if (commitError.stdout?.includes('nothing to commit') || 
          commitError.stdout?.includes('working tree clean') ||
          commitError.message?.includes('nothing to commit')) {
        
        // Try to push existing commits
        try {
          const remoteUrl = `https://${config.token}@github.com/${config.owner}/${config.repo}.git`
          await execAsync(`git remote set-url origin ${remoteUrl}`, { timeout: 3000 })
          const { stdout: pushOutput } = await execAsync('git push -u origin main', { timeout: 15000 })
          
          return NextResponse.json({
            success: true,
            commitHash: 'existing-commits',
            timestamp,
            message: 'No new changes to backup',
            details: {
              localBackup: false,
              pushToGitHub: true,
              note: 'No new changes, pushed existing commits',
              pushOutput
            }
          })
        } catch (pushError) {
          console.warn('Git push failed (no changes scenario):', pushError)
          return NextResponse.json({
            success: true,
            commitHash: 'no-changes',
            timestamp,
            message: 'No changes - local backup only',
            details: {
              localBackup: true,
              pushToGitHub: false,
              note: 'Working tree clean, GitHub push failed - possibly due to invalid credentials',
              addOutput
            }
          })
        }
      }
      throw commitError
    }
    
    const { stdout: logOutput } = await execAsync('git log --oneline -1', { timeout: 3000 })
    
    // Extract commit hash
    const commitHash = logOutput.split(' ')[0]
    
    // Configure remote with token
    let pushSuccess = false
    let pushError = null
    
    try {
      const remoteUrl = `https://${config.token}@github.com/${config.owner}/${config.repo}.git`
      await execAsync(`git remote set-url origin ${remoteUrl}`, { timeout: 3000 })
      
      // Push to GitHub with proper branch
      const branch = config.branch || 'main'
      console.log(`📤 Pushing to GitHub (${branch})... Remote branch exists: ${remoteBranchExists}`)
      
      let pushCommand
      if (remoteBranchExists) {
        // Normal push if branch exists
        pushCommand = `git push -u origin ${branch}`
      } else {
        // Force push with upstream if branch doesn't exist (first time setup)
        pushCommand = `git push -u origin ${branch} --force`
      }
      
      const { stdout: pushOutput } = await execAsync(pushCommand, { timeout: 30000 })
      pushSuccess = true
      console.log('✅ Push successful to GitHub')
      
      return NextResponse.json({
        success: true,
        commitHash,
        timestamp,
        message: commitMessage,
        details: {
          localBackup: true,
          pushToGitHub: true,
          pushSuccess: true,
          syncedFromGitHub: true,
          overrodeLatest: true,
          remoteBranchExisted: remoteBranchExists,
          initialSetup: !remoteBranchExists,
          commitMessage,
          addOutput,
          commitOutput,
          pushOutput,
          repository: `${config.owner}/${config.repo}`,
          branch: branch
        }
      })
    } catch (pushError: any) {
      pushError = pushError.message || 'Unknown push error'
      console.warn('Git push failed:', pushError)
      
      // Try force push as fallback
      try {
        const branch = config.branch || 'main'
        console.log('🔄 Trying force push...')
        
        let forcePushCommand
        if (remoteBranchExists) {
          forcePushCommand = `git push -f origin ${branch}`
        } else {
          forcePushCommand = `git push -u origin ${branch} --force`
        }
        
        const { stdout: forcePushOutput } = await execAsync(forcePushCommand, { timeout: 30000 })
        pushSuccess = true
        console.log('✅ Force push successful')
        
        return NextResponse.json({
          success: true,
          commitHash,
          timestamp,
          message: commitMessage,
          details: {
            localBackup: true,
            pushToGitHub: true,
            pushSuccess: true,
            syncedFromGitHub: true,
            overrodeLatest: true,
            forcePush: true,
            remoteBranchExisted: remoteBranchExists,
            initialSetup: !remoteBranchExists,
            commitMessage,
            addOutput,
            commitOutput,
            pushOutput: forcePushOutput,
            repository: `${config.owner}/${config.repo}`,
            branch: branch
          }
        })
      } catch (forcePushError) {
        console.error('Force push also failed:', forcePushError)
        return NextResponse.json({
          success: true,
          commitHash,
          timestamp,
          message: commitMessage,
          details: {
            localBackup: true,
            pushToGitHub: false,
            pushSuccess: false,
            syncedFromGitHub: true,
            overrodeLatest: true,
            remoteBranchExisted: remoteBranchExists,
            initialSetup: !remoteBranchExists,
            commitMessage,
            addOutput,
            commitOutput,
            pushError: pushError,
            forcePushError: forcePushError.message || 'Unknown force push error',
            repository: `${config.owner}/${config.repo}`,
            branch: config.branch || 'main'
          }
        })
      }
    }
  } catch (error) {
    console.error('GitHub push backup error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during GitHub backup'
    }, { status: 500 })
  }
}
