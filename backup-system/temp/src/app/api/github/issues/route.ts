import { NextRequest, NextResponse } from 'next/server'

interface GitHubIssue {
  id: number
  number: number
  title: string
  body: string
  state: 'open' | 'closed'
  user: {
    login: string
    avatar_url: string
  }
  labels: Array<{
    name: string
    color: string
  }>
  created_at: string
  updated_at: string
  html_url: string
}

interface GitHubProject {
  id: number
  name: string
  body: string
  state: 'open' | 'closed'
  creator: {
    login: string
  }
  created_at: string
  updated_at: string
  html_url: string
}

interface IssueResponse {
  success: boolean
  message: string
  issue?: GitHubIssue
  issues?: GitHubIssue[]
  error?: string
}

interface ProjectResponse {
  success: boolean
  message: string
  project?: GitHubProject
  projects?: GitHubProject[]
  error?: string
}

class GitHubIssuesAPI {
  private token: string
  private owner: string
  private repo: string

  constructor(token: string, owner: string, repo: string) {
    this.token = token
    this.owner = owner
    this.repo = repo
  }

  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
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

  // Get all issues
  async getIssues(state: 'open' | 'closed' | 'all' = 'open', labels?: string[]): Promise<GitHubIssue[]> {
    const labelsParam = labels ? `&labels=${labels.join(',')}` : ''
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/issues?state=${state}${labelsParam}`
    )
    return response.json()
  }

  // Get a single issue
  async getIssue(issueNumber: number): Promise<GitHubIssue> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/issues/${issueNumber}`
    )
    return response.json()
  }

  // Create a new issue
  async createIssue(title: string, body: string, labels?: string[]): Promise<GitHubIssue> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/issues`,
      {
        method: 'POST',
        body: JSON.stringify({
          title,
          body,
          labels: labels || []
        })
      }
    )
    return response.json()
  }

  // Update an issue
  async updateIssue(issueNumber: number, updates: {
    title?: string
    body?: string
    state?: 'open' | 'closed'
    labels?: string[]
  }): Promise<GitHubIssue> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/issues/${issueNumber}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }
    )
    return response.json()
  }

  // Add comment to issue
  async addComment(issueNumber: number, body: string): Promise<any> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/issues/${issueNumber}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ body })
      }
    )
    return response.json()
  }

  // Get issue comments
  async getComments(issueNumber: number): Promise<any[]> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/issues/${issueNumber}/comments`
    )
    return response.json()
  }

  // Get repository labels
  async getLabels(): Promise<Array<{ name: string; color: string; description: string }>> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/labels`
    )
    return response.json()
  }

  // Create a label
  async createLabel(name: string, color: string, description?: string): Promise<any> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/labels`,
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          color,
          description
        })
      }
    )
    return response.json()
  }
}

class GitHubProjectsAPI {
  private token: string
  private owner: string

  constructor(token: string, owner: string) {
    this.token = token
    this.owner = owner
  }

  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
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

  // Get user projects
  async getUserProjects(): Promise<GitHubProject[]> {
    const response = await this.makeRequest(
      `https://api.github.com/users/${this.owner}/projects`
    )
    return response.json()
  }

  // Get repository projects
  async getRepoProjects(repo: string): Promise<GitHubProject[]> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${repo}/projects`
    )
    return response.json()
  }

  // Create a project
  async createProject(name: string, body: string): Promise<GitHubProject> {
    const response = await this.makeRequest(
      `https://api.github.com/user/projects`,
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          body
        })
      }
    )
    return response.json()
  }
}

// Issues API handler
async function handleIssuesAction(action: string, body: any): Promise<IssueResponse> {
  const { token, owner, repo } = body

  if (!token || !owner || !repo) {
    return {
      success: false,
      message: 'token, owner, and repo are required',
      error: 'Missing required parameters'
    }
  }

  const issuesAPI = new GitHubIssuesAPI(token, owner, repo)

  try {
    switch (action) {
      case 'list':
        const { state = 'open', labels } = body
        const issues = await issuesAPI.getIssues(state, labels)
        return {
          success: true,
          message: `Found ${issues.length} issues`,
          issues
        }

      case 'get':
        const { issueNumber } = body
        if (!issueNumber) {
          return {
            success: false,
            message: 'issueNumber is required',
            error: 'Missing issue number'
          }
        }
        const issue = await issuesAPI.getIssue(issueNumber)
        return {
          success: true,
          message: 'Issue retrieved successfully',
          issue
        }

      case 'create':
        const { title, issueBody, labels: createLabels } = body
        if (!title) {
          return {
            success: false,
            message: 'title is required',
            error: 'Missing issue title'
          }
        }
        const newIssue = await issuesAPI.createIssue(title, issueBody || '', createLabels)
        return {
          success: true,
          message: 'Issue created successfully',
          issue: newIssue
        }

      case 'update':
        const { issueNumber: updateNumber, updates } = body
        if (!updateNumber || !updates) {
          return {
            success: false,
            message: 'issueNumber and updates are required',
            error: 'Missing required parameters'
          }
        }
        const updatedIssue = await issuesAPI.updateIssue(updateNumber, updates)
        return {
          success: true,
          message: 'Issue updated successfully',
          issue: updatedIssue
        }

      case 'comment':
        const { issueNumber: commentNumber, comment } = body
        if (!commentNumber || !comment) {
          return {
            success: false,
            message: 'issueNumber and comment are required',
            error: 'Missing required parameters'
          }
        }
        const commentResult = await issuesAPI.addComment(commentNumber, comment)
        return {
          success: true,
          message: 'Comment added successfully',
          issue: commentResult
        }

      case 'comments':
        const { issueNumber: commentsNumber } = body
        if (!commentsNumber) {
          return {
            success: false,
            message: 'issueNumber is required',
            error: 'Missing issue number'
          }
        }
        const comments = await issuesAPI.getComments(commentsNumber)
        return {
          success: true,
          message: `Found ${comments.length} comments`,
          issue: comments as any
        }

      case 'labels':
        const labelsList = await issuesAPI.getLabels()
        return {
          success: true,
          message: `Found ${labelsList.length} labels`,
          issue: labelsList as any
        }

      case 'createLabel':
        const { labelName, color, description } = body
        if (!labelName || !color) {
          return {
            success: false,
            message: 'labelName and color are required',
            error: 'Missing required parameters'
          }
        }
        const newLabel = await issuesAPI.createLabel(labelName, color, description)
        return {
          success: true,
          message: 'Label created successfully',
          issue: newLabel
        }

      default:
        return {
          success: false,
          message: 'Invalid action',
          error: 'Unsupported action'
        }
    }
  } catch (error) {
    console.error('Issues API error:', error)
    return {
      success: false,
      message: 'Failed to process issue action',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Projects API handler
async function handleProjectsAction(action: string, body: any): Promise<ProjectResponse> {
  const { token, owner, repo } = body

  if (!token || !owner) {
    return {
      success: false,
      message: 'token and owner are required',
      error: 'Missing required parameters'
    }
  }

  const projectsAPI = new GitHubProjectsAPI(token, owner)

  try {
    switch (action) {
      case 'listUser':
        const userProjects = await projectsAPI.getUserProjects()
        return {
          success: true,
          message: `Found ${userProjects.length} user projects`,
          projects: userProjects
        }

      case 'listRepo':
        if (!repo) {
          return {
            success: false,
            message: 'repo is required for repository projects',
            error: 'Missing repository name'
          }
        }
        const repoProjects = await projectsAPI.getRepoProjects(repo)
        return {
          success: true,
          message: `Found ${repoProjects.length} repository projects`,
          projects: repoProjects
        }

      case 'create':
        const { name, projectBody } = body
        if (!name) {
          return {
            success: false,
            message: 'name is required',
            error: 'Missing project name'
          }
        }
        const newProject = await projectsAPI.createProject(name, projectBody || '')
        return {
          success: true,
          message: 'Project created successfully',
          project: newProject
        }

      default:
        return {
          success: false,
          message: 'Invalid action',
          error: 'Unsupported action'
        }
    }
  } catch (error) {
    console.error('Projects API error:', error)
    return {
      success: false,
      message: 'Failed to process project action',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Main API handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, action } = body

    if (!type || !action) {
      return NextResponse.json(
        { error: 'type and action are required' },
        { status: 400 }
      )
    }

    let result

    switch (type) {
      case 'issues':
        result = await handleIssuesAction(action, body)
        break
      case 'projects':
        result = await handleProjectsAction(action, body)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid type. Supported types: issues, projects' },
          { status: 400 }
        )
    }

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { error: result.error || result.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Issues/Projects API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for API information
export async function GET() {
  return NextResponse.json({
    message: 'GitHub Issues and Projects API',
    types: {
      issues: {
        actions: ['list', 'get', 'create', 'update', 'comment', 'comments', 'labels', 'createLabel'],
        parameters: {
          list: ['state?', 'labels?'],
          get: ['issueNumber'],
          create: ['title', 'body?', 'labels?'],
          update: ['issueNumber', 'updates'],
          comment: ['issueNumber', 'comment'],
          comments: ['issueNumber'],
          labels: [],
          createLabel: ['name', 'color', 'description?']
        }
      },
      projects: {
        actions: ['listUser', 'listRepo', 'create'],
        parameters: {
          listUser: [],
          listRepo: ['repo'],
          create: ['name', 'body?']
        }
      }
    }
  })
}