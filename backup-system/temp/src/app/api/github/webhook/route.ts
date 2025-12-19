import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { headers } from 'next/headers'

interface WebhookEvent {
  zen?: string
  hook_id: number
  hook: any
  repository: any
  sender: any
  action?: string
  issue?: any
  pull_request?: any
  commits?: any[]
  ref?: string
  pusher?: any
  release?: any
  forker?: any
}

interface WebhookResponse {
  success: boolean
  message: string
  event?: string
  data?: any
}

// Webhook secret should be stored in environment variables
const WEBHOOK_SECRET="" || 'your-webhook-secret'

// Verify webhook signature
function verifySignature(payload: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET)
  const digest = 'sha256=' + hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

// Handle different webhook events
async function handleWebhookEvent(event: string, payload: WebhookEvent): Promise<WebhookResponse> {
  try {
    switch (event) {
      case 'push':
        return await handlePushEvent(payload)
      case 'pull_request':
        return await handlePullRequestEvent(payload)
      case 'issues':
        return await handleIssuesEvent(payload)
      case 'release':
        return await handleReleaseEvent(payload)
      case 'star':
        return await handleStarEvent(payload)
      case 'fork':
        return await handleForkEvent(payload)
      default:
        return {
          success: true,
          message: `Webhook received for event: ${event}`,
          event,
          data: { action: payload.action }
        }
    }
  } catch (error) {
    console.error(`Error handling webhook event ${event}:`, error)
    return {
      success: false,
      message: `Failed to handle ${event} event`,
      event
    }
  }
}

// Handle push events
async function handlePushEvent(payload: WebhookEvent): Promise<WebhookResponse> {
  const { ref, commits, pusher, repository } = payload
  
  const branch = ref?.replace('refs/heads/', '') || 'unknown'
  const commitCount = commits?.length || 0
  
  // Trigger real-time sync notification
  console.log(`Push to ${branch} by ${pusher?.name}: ${commitCount} commits`)
  
  // You could trigger a database update, send notifications, etc.
  
  return {
    success: true,
    message: `Push event processed: ${commitCount} commits to ${branch}`,
    event: 'push',
    data: {
      branch,
      commitCount,
      pusher: pusher?.name,
      repository: repository?.full_name,
      commits: commits?.map(commit => ({
        id: commit.id,
        message: commit.message,
        author: commit.author?.name,
        url: commit.url
      }))
    }
  }
}

// Handle pull request events
async function handlePullRequestEvent(payload: WebhookEvent): Promise<WebhookResponse> {
  const { action, pull_request, repository } = payload
  
  console.log(`Pull request ${action}: #${pull_request?.number} - ${pull_request?.title}`)
  
  return {
    success: true,
    message: `Pull request ${action} processed`,
    event: 'pull_request',
    data: {
      action,
      pullRequest: {
        number: pull_request?.number,
        title: pull_request?.title,
        state: pull_request?.state,
        author: pull_request?.user?.login,
        url: pull_request?.html_url
      },
      repository: repository?.full_name
    }
  }
}

// Handle issues events
async function handleIssuesEvent(payload: WebhookEvent): Promise<WebhookResponse> {
  const { action, issue, repository } = payload
  
  console.log(`Issue ${action}: #${issue?.number} - ${issue?.title}`)
  
  return {
    success: true,
    message: `Issue ${action} processed`,
    event: 'issues',
    data: {
      action,
      issue: {
        number: issue?.number,
        title: issue?.title,
        state: issue?.state,
        author: issue?.user?.login,
        url: issue?.html_url
      },
      repository: repository?.full_name
    }
  }
}

// Handle release events
async function handleReleaseEvent(payload: WebhookEvent): Promise<WebhookResponse> {
  const { action, release, repository } = payload
  
  console.log(`Release ${action}: ${release?.tag_name}`)
  
  return {
    success: true,
    message: `Release ${action} processed`,
    event: 'release',
    data: {
      action,
      release: {
        tag_name: release?.tag_name,
        name: release?.name,
        draft: release?.draft,
        prerelease: release?.prerelease,
        author: release?.author?.login,
        url: release?.html_url
      },
      repository: repository?.full_name
    }
  }
}

// Handle star events
async function handleStarEvent(payload: WebhookEvent): Promise<WebhookResponse> {
  const { action, repository } = payload
  
  console.log(`Repository ${action}d: ${repository?.full_name}`)
  
  return {
    success: true,
    message: `Star ${action} processed`,
    event: 'star',
    data: {
      action,
      repository: {
        full_name: repository?.full_name,
        stars: repository?.stargazers_count,
        url: repository?.html_url
      }
    }
  }
}

// Handle fork events
async function handleForkEvent(payload: WebhookEvent): Promise<WebhookResponse> {
  const { repository, forker } = payload
  
  console.log(`Repository forked by ${forker?.login}`)
  
  return {
    success: true,
    message: 'Fork event processed',
    event: 'fork',
    data: {
      forker: {
        login: forker?.login,
        url: forker?.html_url
      },
      repository: {
        full_name: repository?.full_name,
        forks: repository?.forks_count,
        url: repository?.html_url
      }
    }
  }
}

// Main webhook handler
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const signature = headersList.get('x-hub-signature-256')
    const event = headersList.get('x-github-event')
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      )
    }
    
    if (!event) {
      return NextResponse.json(
        { error: 'Missing event header' },
        { status: 400 }
      )
    }
    
    // Read the raw body
    const body = await request.text()
    
    // Verify the signature
    if (!verifySignature(body, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }
    
    // Parse the payload
    const payload: WebhookEvent = JSON.parse(body)
    
    // Handle the webhook event
    const result = await handleWebhookEvent(event, payload)
    
    // Log the webhook event for debugging
    console.log(`Webhook processed: ${event}`, {
      success: result.success,
      message: result.message,
      repository: payload.repository?.full_name
    })
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for webhook configuration/testing
export async function GET() {
  return NextResponse.json({
    message: 'GitHub webhook endpoint is active',
    events: [
      'push',
      'pull_request',
      'issues',
      'release',
      'star',
      'fork'
    ],
    setup: {
      url: '/api/github/webhook',
      secret: 'Configure your webhook with a secret',
      content_type: 'application/json'
    }
  })
}