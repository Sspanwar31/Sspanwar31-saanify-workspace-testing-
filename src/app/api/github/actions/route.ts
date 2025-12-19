import { NextRequest, NextResponse } from 'next/server'

interface GitHubWorkflow {
  id: number
  name: string
  path: string
  state: 'active' | 'disabled'
  created_at: string
  updated_at: string
  html_url: string
  badge_url: string
}

interface WorkflowRun {
  id: number
  name: string
  head_branch: string
  head_sha: string
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null
  workflow_id: number
  created_at: string
  updated_at: string
  html_url: string
}

interface ActionsResponse {
  success: boolean
  message: string
  workflows?: GitHubWorkflow[]
  workflow?: GitHubWorkflow
  runs?: WorkflowRun[]
  run?: WorkflowRun
  error?: string
}

class GitHubActionsAPI {
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

  // Get all workflows
  async getWorkflows(): Promise<GitHubWorkflow[]> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/actions/workflows`
    )
    const data = await response.json()
    return data.workflows
  }

  // Get a specific workflow
  async getWorkflow(workflowId: number | string): Promise<GitHubWorkflow> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/actions/workflows/${workflowId}`
    )
    return response.json()
  }

  // Get workflow runs
  async getWorkflowRuns(workflowId?: number | string, branch?: string, status?: string): Promise<WorkflowRun[]> {
    let url = `https://api.github.com/repos/${this.owner}/${this.repo}/actions/runs`
    
    if (workflowId) {
      url = `https://api.github.com/repos/${this.owner}/${this.repo}/actions/workflows/${workflowId}/runs`
    }

    const params = new URLSearchParams()
    if (branch) params.append('branch', branch)
    if (status) params.append('status', status)
    
    if (params.toString()) {
      url += `?${params.toString()}`
    }

    const response = await this.makeRequest(url)
    const data = await response.json()
    return data.workflow_runs
  }

  // Get a specific workflow run
  async getWorkflowRun(runId: number): Promise<WorkflowRun> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/actions/runs/${runId}`
    )
    return response.json()
  }

  // Trigger a workflow run
  async triggerWorkflow(workflowId: string, ref: string, inputs?: Record<string, any>): Promise<any> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/actions/workflows/${workflowId}/dispatches`,
      {
        method: 'POST',
        body: JSON.stringify({
          ref,
          inputs: inputs || {}
        })
      }
    )
    return response.json()
  }

  // Re-run a workflow
  async rerunWorkflow(runId: number): Promise<any> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/actions/runs/${runId}/rerun`,
      {
        method: 'POST'
      }
    )
    return response.json()
  }

  // Cancel a workflow run
  async cancelWorkflowRun(runId: number): Promise<any> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/actions/runs/${runId}/cancel`,
      {
        method: 'POST'
      }
    )
    return response.json()
  }

  // Get workflow run logs
  async getWorkflowRunLogs(runId: number): Promise<any> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/actions/runs/${runId}/logs`
    )
    return response
  }

  // Enable/disable a workflow
  async toggleWorkflow(workflowId: number | string, enable: boolean): Promise<any> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/actions/workflows/${workflowId}/${enable ? 'enable' : 'disable'}`,
      {
        method: 'PUT'
      }
    )
    return response.json()
  }
}

// Default workflow templates
const WORKFLOW_TEMPLATES = {
  'ci-cd': {
    name: 'CI/CD Pipeline',
    content: `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to production
      run: |
        echo "Deploying to production..."
        # Add your deployment commands here`
  },
  'backup': {
    name: 'Automatic Backup',
    content: `name: Automatic Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Create backup
      run: |
        # Create backup with timestamp
        TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
        BACKUP_NAME="backup_\${TIMESTAMP}"
        
        # Create backup archive
        tar -czf "\${BACKUP_NAME}.tar.gz" \
          --exclude=node_modules \
          --exclude=.git \
          --exclude=.next \
          --exclude=dist \
          .
        
        echo "Backup created: \${BACKUP_NAME}.tar.gz"
    
    - name: Upload backup artifact
      uses: actions/upload-artifact@v3
      with:
        name: backup-\${{ github.run_number }}
        path: backup_*.tar.gz
        retention-days: 30`
  },
  'security': {
    name: 'Security Scan',
    content: `name: Security Scan

on:
  push:
    branches: [ main ]
  schedule:
    - cron: '0 6 * * 1'  # Weekly on Monday at 6 AM

jobs:
  security:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Run security audit
      run: npm audit --audit-level high
    
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high`
  }
}

// Actions API handler
async function handleActionsAction(action: string, body: any): Promise<ActionsResponse> {
  const { token, owner, repo } = body

  if (!token || !owner || !repo) {
    return {
      success: false,
      message: 'token, owner, and repo are required',
      error: 'Missing required parameters'
    }
  }

  const actionsAPI = new GitHubActionsAPI(token, owner, repo)

  try {
    switch (action) {
      case 'listWorkflows':
        const workflows = await actionsAPI.getWorkflows()
        return {
          success: true,
          message: `Found ${workflows.length} workflows`,
          workflows
        }

      case 'getWorkflow':
        const { workflowId } = body
        if (!workflowId) {
          return {
            success: false,
            message: 'workflowId is required',
            error: 'Missing workflow ID'
          }
        }
        const workflow = await actionsAPI.getWorkflow(workflowId)
        return {
          success: true,
          message: 'Workflow retrieved successfully',
          workflow
        }

      case 'listRuns':
        const { workflowId: runsWorkflowId, branch, status } = body
        const runs = await actionsAPI.getWorkflowRuns(runsWorkflowId, branch, status)
        return {
          success: true,
          message: `Found ${runs.length} workflow runs`,
          runs
        }

      case 'getRun':
        const { runId } = body
        if (!runId) {
          return {
            success: false,
            message: 'runId is required',
            error: 'Missing run ID'
          }
        }
        const run = await actionsAPI.getWorkflowRun(runId)
        return {
          success: true,
          message: 'Workflow run retrieved successfully',
          run
        }

      case 'trigger':
        const { triggerWorkflowId, ref, inputs } = body
        if (!triggerWorkflowId || !ref) {
          return {
            success: false,
            message: 'workflowId and ref are required',
            error: 'Missing required parameters'
          }
        }
        const triggerResult = await actionsAPI.triggerWorkflow(triggerWorkflowId, ref, inputs)
        return {
          success: true,
          message: 'Workflow triggered successfully',
          run: triggerResult
        }

      case 'rerun':
        const { rerunId } = body
        if (!rerunId) {
          return {
            success: false,
            message: 'runId is required',
            error: 'Missing run ID'
          }
        }
        const rerunResult = await actionsAPI.rerunWorkflow(rerunId)
        return {
          success: true,
          message: 'Workflow rerun initiated',
          run: rerunResult
        }

      case 'cancel':
        const { cancelId } = body
        if (!cancelId) {
          return {
            success: false,
            message: 'runId is required',
            error: 'Missing run ID'
          }
        }
        const cancelResult = await actionsAPI.cancelWorkflowRun(cancelId)
        return {
          success: true,
          message: 'Workflow run cancelled',
          run: cancelResult
        }

      case 'logs':
        const { logsId } = body
        if (!logsId) {
          return {
            success: false,
            message: 'runId is required',
            error: 'Missing run ID'
          }
        }
        const logs = await actionsAPI.getWorkflowRunLogs(logsId)
        return {
          success: true,
          message: 'Workflow logs retrieved',
          run: logs
        }

      case 'toggle':
        const { toggleWorkflowId, enable } = body
        if (!toggleWorkflowId || enable === undefined) {
          return {
            success: false,
            message: 'workflowId and enable are required',
            error: 'Missing required parameters'
          }
        }
        const toggleResult = await actionsAPI.toggleWorkflow(toggleWorkflowId, enable)
        return {
          success: true,
          message: `Workflow ${enable ? 'enabled' : 'disabled'} successfully`,
          run: toggleResult
        }

      case 'getTemplates':
        return {
          success: true,
          message: 'Workflow templates retrieved',
          workflows: Object.keys(WORKFLOW_TEMPLATES).map(key => ({
            name: WORKFLOW_TEMPLATES[key as keyof typeof WORKFLOW_TEMPLATES].name,
            id: key,
            content: WORKFLOW_TEMPLATES[key as keyof typeof WORKFLOW_TEMPLATES].content
          })) as any
        }

      case 'getTemplate':
        const { templateId } = body
        if (!templateId || !WORKFLOW_TEMPLATES[templateId as keyof typeof WORKFLOW_TEMPLATES]) {
          return {
            success: false,
            message: 'Invalid template ID',
            error: 'Template not found'
          }
        }
        const template = WORKFLOW_TEMPLATES[templateId as keyof typeof WORKFLOW_TEMPLATES]
        return {
          success: true,
          message: 'Template retrieved successfully',
          workflow: {
            name: template.name,
            content: template.content
          } as any
        }

      default:
        return {
          success: false,
          message: 'Invalid action',
          error: 'Unsupported action'
        }
    }
  } catch (error) {
    console.error('Actions API error:', error)
    return {
      success: false,
      message: 'Failed to process actions action',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Main API handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      )
    }

    const result = await handleActionsAction(action, body)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { error: result.error || result.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('GitHub Actions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for API information
export async function GET() {
  return NextResponse.json({
    message: 'GitHub Actions API',
    actions: [
      'listWorkflows',
      'getWorkflow', 
      'listRuns',
      'getRun',
      'trigger',
      'rerun',
      'cancel',
      'logs',
      'toggle',
      'getTemplates',
      'getTemplate'
    ],
    parameters: {
      listWorkflows: [],
      getWorkflow: ['workflowId'],
      listRuns: ['workflowId?', 'branch?', 'status?'],
      getRun: ['runId'],
      trigger: ['workflowId', 'ref', 'inputs?'],
      rerun: ['runId'],
      cancel: ['runId'],
      logs: ['runId'],
      toggle: ['workflowId', 'enable'],
      getTemplates: [],
      getTemplate: ['templateId']
    },
    templates: Object.keys(WORKFLOW_TEMPLATES)
  })
}