import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

// Function to collect all project files for backup
function collectProjectFiles(): { [key: string]: string } {
  const files: { [key: string]: string } = {}
  const projectDir = process.cwd()
  const MAX_FILE_SIZE = 1024 * 1024 // 1MB per file limit
  const MAX_FILES = 500 // Maximum number of files to backup
  
  // Files and directories to exclude
  const excludeDirs = [
    'node_modules', '.git', '.next', 'dist', 'build', '.vercel',
    '.env.local', '.env.production', 'package-lock.json', 'yarn.lock',
    'coverage', '.nyc_output', '.pytest_cache', '__pycache__'
  ]
  
  // Files to definitely include
  const includeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.yml', '.yaml', '.env', '.sql', '.prisma']
  
  function walkDirectory(dir: string, relativePath: string = '') {
    try {
      const items = fs.readdirSync(dir)
      
      for (const item of items) {
        const fullPath = path.join(dir, item)
        const relativeItemPath = path.join(relativePath, item)
        
        // Skip excluded directories
        if (excludeDirs.includes(item) || item.startsWith('.')) {
          continue
        }
        
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          // Recursively walk subdirectories
          walkDirectory(fullPath, relativeItemPath)
        } else if (stat.isFile()) {
          // Include files with matching extensions or specific files
          const ext = path.extname(item)
          if (includeExtensions.includes(ext) || 
              item === 'README' || 
              item === 'Dockerfile' ||
              item === 'Caddyfile' ||
              item === '.gitignore' ||
              item.startsWith('env.')) {
            
            try {
              // Check file count limit
              if (Object.keys(files).length >= MAX_FILES) {
                console.warn(`Reached maximum file limit (${MAX_FILES}), skipping remaining files`)
                return
              }
              
              const content = fs.readFileSync(fullPath, 'utf8')
              
              // Check file size limit
              if (content.length > MAX_FILE_SIZE) {
                console.warn(`Skipping large file: ${relativeItemPath} (${content.length} bytes)`)
                continue
              }
              
              files[relativeItemPath] = content
            } catch (error) {
              console.warn(`Could not read file: ${relativeItemPath}`, error)
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Could not read directory: ${dir}`, error)
    }
  }
  
  walkDirectory(projectDir)
  
  // Add a manifest file
  files['BACKUP_MANIFEST.txt'] = `🚀 Project Backup - ${new Date().toISOString()}
Total files: ${Object.keys(files).length - 1}
Project: Next.js Subscription Management System
Backup Type: Full Project Backup

Files included:
${Object.keys(files).filter(f => f !== 'BACKUP_MANIFEST.txt').sort().join('\n')}
`
  
  return files
}

// Direct GitHub API function (copied from push-simple)
async function pushToGitHub(owner: string, repo: string, token: string, files: any, message: string) {
  try {
    console.log('🔧 GitHub API Call:', { 
      owner, 
      repo, 
      hasToken: !!token,
      tokenPrefix: token?.substring(0, 7) + '...',
      fileCount: Object.keys(files).length,
      message 
    })
    
    const time = new Date().toISOString()

    // 1) Get current HEAD commit
    const headResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30000) // 30 second timeout
    })
    
    if (!headResponse.ok) {
      const error = await headResponse.json().catch(() => ({}))
      throw new Error(`GitHub API Error: ${headResponse.status} - ${error.message || 'Repository access denied'}`)
    }
    
    const head = await headResponse.json()
    
    if (!head.object || !head.object.sha) {
      throw new Error('Invalid repository or branch not found')
    }
    
    console.log('✅ Head commit:', head.object.sha ? 'Success' : 'Failed')

    const baseCommitSha = head.object.sha

    // 2) Get base tree
    const baseTree = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${baseCommitSha}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30000)
    }).then(r => r.json())

    // 3) Upload new files as BLOB
    const tree = []
    for (const path in files) {
      const blob = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: files[path], encoding: "utf-8" }),
        signal: AbortSignal.timeout(30000)
      }).then(r => r.json())

      tree.push({ path, mode: "100644", type: "blob", sha: blob.sha })
    }

    // 4) Create new tree
    const newTree = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ base_tree: baseTree.tree.sha, tree }),
      signal: AbortSignal.timeout(30000)
    }).then(r => r.json())

    // 5) Create commit
    const commit = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        message: `🚀 Backup: ${time} → ${message}`,
        tree: newTree.sha,
        parents: [baseCommitSha]
      }),
      signal: AbortSignal.timeout(30000)
    }).then(r => r.json())

    // 6) Update HEAD pointer
    await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sha: commit.sha }),
      signal: AbortSignal.timeout(30000)
    })

    return {
      success: true,
      pushed: Object.keys(files).length,
      commit: commit.sha,
      time
    }

  } catch (e) {
    // Handle timeout errors specifically
    if (e.name === 'TimeoutError' || e.message.includes('timeout')) {
      return {
        success: false,
        error: "Request timed out. The backup might be too large or GitHub API is slow. Please try again."
      }
    }
    
    return {
      success: false,
      error: e.message || "GitHub Push Failed"
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, config, useGit, pushToGitHub: shouldPushToGitHub } = await request.json()
    
    // Handle simple git backup (no GitHub API)
    if (action === 'quick-backup' && useGit) {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const commitMessage = `🚀 Quick Backup: ${timestamp}`
        
        // Execute git commands
        const { stdout: addOutput } = await execAsync('git add -A')
        
        // Check if there are changes to commit
        try {
          const { stdout: commitOutput } = await execAsync(`git commit -m "${commitMessage}"`)
          const { stdout: logOutput } = await execAsync('git log --oneline -1')
          
          // Extract commit hash
          const commitHash = logOutput.split(' ')[0]
          
          return NextResponse.json({
            success: true,
            commitHash,
            timestamp,
            message: commitMessage,
            details: {
              addOutput,
              commitOutput
            }
          })
        } catch (commitError: any) {
          // Check if it's because there are no changes
          if (commitError.message.includes('nothing to commit') || 
              commitError.stdout?.includes('nothing to commit') ||
              commitError.stderr?.includes('nothing to commit')) {
            return NextResponse.json({
              success: true,
              commitHash: 'no-changes',
              message: 'No changes to commit - working tree clean',
              details: {
                note: 'No new changes detected'
              }
            })
          }
          throw commitError
        }
        
      } catch (error) {
        console.error('Git backup failed:', error)
        return NextResponse.json(
          { 
            success: false, 
            error: error instanceof Error ? error.message : 'Git backup failed' 
          },
          { status: 500 }
        )
      }
    }
    
    // Handle main backup action (for GitHub integration)
    if (action === 'backup') {
      console.log('🔍 Backup action received:', { 
        hasConfig: !!config, 
        hasToken: !!config?.token,
        tokenType: config?.token?.substring(0, 10) + '...',
        owner: config?.owner,
        repo: config?.repo
      })
      
      // Check if we should use local git instead
      if (!config || !config.token || config.token === 'demo-token' || 
          config.owner === 'demo-user' || config.repo === 'demo-repo') {
        console.log('🔄 Using local git fallback')
        // Fall back to local git backup
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const commitMessage = `🚀 Auto Backup: ${timestamp}`
          
          const { stdout: addOutput } = await execAsync('git add -A')
          
          try {
            const { stdout: commitOutput } = await execAsync(`git commit -m "${commitMessage}"`)
            const { stdout: logOutput } = await execAsync('git log --oneline -1')
            
            const commitHash = logOutput.split(' ')[0]
            
            return NextResponse.json({
              success: true,
              commitHash,
              timestamp,
              message: commitMessage,
              filesCount: 1,
              details: {
                addOutput,
                commitOutput
              }
            })
          } catch (commitError: any) {
            if (commitError.message.includes('nothing to commit') || 
                commitError.stdout?.includes('nothing to commit') ||
                commitError.stderr?.includes('nothing to commit')) {
              return NextResponse.json({
                success: true,
                commitHash: 'no-changes',
                message: 'No changes to commit - working tree clean',
                filesCount: 0,
                details: {
                  note: 'No new changes detected'
                }
              })
            }
            throw commitError
          }
        } catch (error) {
          console.error('Local backup failed:', error)
          return NextResponse.json(
            { 
              success: false, 
              error: error instanceof Error ? error.message : 'Local backup failed' 
            },
            { status: 500 }
          )
        }
      }
      
      // For real GitHub config, use direct GitHub API
      console.log('🚀 Using GitHub API for backup')
      
      // Collect all project files
      const projectFiles = collectProjectFiles()
      console.log(`📁 Collected ${Object.keys(projectFiles).length} files for backup`)
      
      const result = await pushToGitHub(
        config.owner,
        config.repo,
        config.token,
        projectFiles,
        `🚀 Auto Backup: ${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}`
      )
      
      if (result.success) {
        return NextResponse.json({
          ...result,
          filesCount: Object.keys(projectFiles).length
        })
      } else {
        throw new Error(result.error || 'GitHub backup failed')
      }
    }
    
    // Handle GitHub push with simplified API
    if (action === 'github-push-backup') {
      // Collect all project files
      const projectFiles = collectProjectFiles()
      console.log(`📁 Collected ${Object.keys(projectFiles).length} files for GitHub push`)
      
      const result = await pushToGitHub(
        config.owner,
        config.repo,
        config.token,
        projectFiles,
        `🚀 Simple Backup: ${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}`
      )
      
      if (result.success) {
        return NextResponse.json({
          ...result,
          filesCount: Object.keys(projectFiles).length
        })
      } else {
        throw new Error(result.error || 'GitHub push failed')
      }
    }
    
    // Handle auto-backup action
    if (action === 'auto-backup' && shouldPushToGitHub) {
      // Collect all project files
      const projectFiles = collectProjectFiles()
      console.log(`📁 Collected ${Object.keys(projectFiles).length} files for auto-backup`)
      
      const result = await pushToGitHub(
        config.owner,
        config.repo,
        config.token,
        projectFiles,
        `🚀 Auto Backup: ${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}`
      )
      
      if (result.success) {
        return NextResponse.json({
          ...result,
          filesCount: Object.keys(projectFiles).length
        })
      } else {
        throw new Error(result.error || 'Auto backup failed')
      }
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Invalid action. Supported actions: backup, quick-backup, github-push-backup, auto-backup' 
      },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Backup failed' 
      },
      { status: 500 }
    )
  }
}