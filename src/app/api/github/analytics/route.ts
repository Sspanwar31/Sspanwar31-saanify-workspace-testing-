import { NextRequest, NextResponse } from 'next/server'
import { RetryHandler, ErrorHandler, GITHUB_RETRY_CONFIG } from '@/lib/error-handling'

interface RepositoryAnalytics {
  overview: {
    name: string
    fullName: string
    description: string
    language: string
    size: number
    stars: number
    forks: number
    watchers: number
    openIssues: number
    createdAt: string
    updatedAt: string
    pushedAt: string
    isPrivate: boolean
    defaultBranch: string
  }
  traffic: {
    views: number
    uniqueVisitors: number
    clones: number
    uniqueCloners: number
    referrers: Array<{ source: string; count: number; uniques: number }>
    paths: Array<{ path: string; count: number; uniques: number }>
  }
  contributors: Array<{
    login: string
    contributions: number
    avatar: string
    htmlUrl: string
    type: string
  }>
  languages: Array<{ language: string; bytes: number; percentage: number }>
  commits: {
    total: number
    weekly: Array<{ week: number; additions: number; deletions: number; commits: number }>
    latest: Array<{
      sha: string
      message: string
      author: string
      date: string
      url: string
    }>
  }
  issues: {
    open: number
    closed: number
    total: number
    byLabel: Array<{ label: string; count: number }>
    byState: Array<{ state: string; count: number }>
  }
  pullRequests: {
    open: number
    closed: number
    merged: number
    total: number
    averageMergeTime: number
  }
  releases: Array<{
    tagName: string
    name: string
    createdAt: string
    isPrerelease: boolean
    assets: number
  }>
  health: {
    score: number
    issues: string[]
    recommendations: string[]
  }
}

interface AnalyticsResponse {
  success: boolean
  message: string
  analytics?: RepositoryAnalytics
  error?: string
}

class GitHubAnalyticsAPI {
  private token: string
  private owner: string
  private repo: string

  constructor(token: string, owner: string, repo: string) {
    this.token = token
    this.owner = owner
    this.repo = repo
  }

  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    // Determine token type and use appropriate auth method
    const isClassicToken = this.token.startsWith('ghp_')
    const authMethod = isClassicToken ? 'token' : 'Bearer'
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `${authMethod} ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...options.headers
      },
      ...options
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw ErrorHandler.handleGitHubError(error)
    }

    return response
  }

  // Get repository overview
  async getRepositoryOverview(): Promise<any> {
    return RetryHandler.executeWithRetry(async () => {
      const response = await this.makeRequest(
        `https://api.github.com/repos/${this.owner}/${this.repo}`
      )
      return response.json()
    }, GITHUB_RETRY_CONFIG)
  }

  // Get traffic data
  async getTrafficData(): Promise<any> {
    const [views, clones, referrers, paths] = await Promise.allSettled([
      this.getViews(),
      this.getClones(),
      this.getReferrers(),
      this.getPaths()
    ])

    return {
      views: views.status === 'fulfilled' ? views.value : { count: 0, uniques: 0 },
      clones: clones.status === 'fulfilled' ? clones.value : { count: 0, uniques: 0 },
      referrers: referrers.status === 'fulfilled' ? referrers.value : [],
      paths: paths.status === 'fulfilled' ? paths.value : []
    }
  }

  private async getViews(): Promise<any> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/traffic/views`
    )
    const data = await response.json()
    return data.views?.[0] || { count: 0, uniques: 0 }
  }

  private async getClones(): Promise<any> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/traffic/clones`
    )
    const data = await response.json()
    return data.clones?.[0] || { count: 0, uniques: 0 }
  }

  private async getReferrers(): Promise<any[]> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/traffic/popular/referrers`
    )
    return response.json()
  }

  private async getPaths(): Promise<any[]> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/traffic/popular/paths`
    )
    return response.json()
  }

  // Get contributors
  async getContributors(): Promise<any[]> {
    return RetryHandler.executeWithRetry(async () => {
      const response = await this.makeRequest(
        `https://api.github.com/repos/${this.owner}/${this.repo}/contributors`
      )
      return response.json()
    }, GITHUB_RETRY_CONFIG)
  }

  // Get languages
  async getLanguages(): Promise<any> {
    return RetryHandler.executeWithRetry(async () => {
      const response = await this.makeRequest(
        `https://api.github.com/repos/${this.owner}/${this.repo}/languages`
      )
      return response.json()
    }, GITHUB_RETRY_CONFIG)
  }

  // Get commit activity
  async getCommitActivity(): Promise<any> {
    return RetryHandler.executeWithRetry(async () => {
      const response = await this.makeRequest(
        `https://api.github.com/repos/${this.owner}/${this.repo}/stats/commit_activity`
      )
      return response.json()
    }, GITHUB_RETRY_CONFIG)
  }

  // Get recent commits
  async getRecentCommits(limit: number = 10): Promise<any[]> {
    return RetryHandler.executeWithRetry(async () => {
      const response = await this.makeRequest(
        `https://api.github.com/repos/${this.owner}/${this.repo}/commits?per_page=${limit}`
      )
      const commits = await response.json()
      return commits.map((commit: any) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        url: commit.html_url
      }))
    }, GITHUB_RETRY_CONFIG)
  }

  // Get issues statistics
  async getIssuesStats(): Promise<any> {
    const [openIssues, closedIssues] = await Promise.allSettled([
      this.getIssuesByState('open'),
      this.getIssuesByState('closed')
    ])

    return {
      open: openIssues.status === 'fulfilled' ? openIssues.value.length : 0,
      closed: closedIssues.status === 'fulfilled' ? closedIssues.value.length : 0,
      total: (openIssues.status === 'fulfilled' ? openIssues.value.length : 0) +
            (closedIssues.status === 'fulfilled' ? closedIssues.value.length : 0)
    }
  }

  private async getIssuesByState(state: string): Promise<any[]> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/issues?state=${state}&per_page=100`
    )
    return response.json()
  }

  // Get pull requests statistics
  async getPullRequestsStats(): Promise<any> {
    const [openPRs, closedPRs, mergedPRs] = await Promise.allSettled([
      this.getPullRequestsByState('open'),
      this.getPullRequestsByState('closed'),
      this.getPullRequestsByState('merged')
    ])

    return {
      open: openPRs.status === 'fulfilled' ? openPRs.value.length : 0,
      closed: closedPRs.status === 'fulfilled' ? closedPRs.value.length : 0,
      merged: mergedPRs.status === 'fulfilled' ? mergedPRs.value.length : 0,
      total: (openPRs.status === 'fulfilled' ? openPRs.value.length : 0) +
            (closedPRs.status === 'fulfilled' ? closedPRs.value.length : 0) +
            (mergedPRs.status === 'fulfilled' ? mergedPRs.value.length : 0)
    }
  }

  private async getPullRequestsByState(state: string): Promise<any[]> {
    const response = await this.makeRequest(
      `https://api.github.com/repos/${this.owner}/${this.repo}/pulls?state=${state}&per_page=100`
    )
    return response.json()
  }

  // Get releases
  async getReleases(): Promise<any[]> {
    return RetryHandler.executeWithRetry(async () => {
      const response = await this.makeRequest(
        `https://api.github.com/repos/${this.owner}/${this.repo}/releases?per_page=10`
      )
      const releases = await response.json()
      return releases.map((release: any) => ({
        tagName: release.tag_name,
        name: release.name,
        createdAt: release.created_at,
        isPrerelease: release.prerelease,
        assets: release.assets?.length || 0
      }))
    }, GITHUB_RETRY_CONFIG)
  }

  // Calculate repository health score
  calculateHealthScore(analytics: Partial<RepositoryAnalytics>): number {
    let score = 0
    const maxScore = 100

    // Activity score (30%)
    if (analytics.commits?.weekly && analytics.commits.weekly.length > 0) {
      const recentActivity = analytics.commits.weekly.slice(-4).reduce((sum, week) => sum + week.commits, 0)
      score += Math.min(30, (recentActivity / 20) * 30)
    }

    // Issue management score (20%)
    if (analytics.issues) {
      const issueRatio = analytics.issues.open / (analytics.issues.total || 1)
      score += Math.max(0, 20 - (issueRatio * 20))
    }

    // PR management score (20%)
    if (analytics.pullRequests) {
      const prRatio = analytics.pullRequests.merged / (analytics.pullRequests.total || 1)
      score += prRatio * 20
    }

    // Contributor diversity score (15%)
    if (analytics.contributors && analytics.contributors.length > 0) {
      score += Math.min(15, analytics.contributors.length * 3)
    }

    // Documentation score (15%)
    if (analytics.overview?.description) {
      score += 10
    }
    if (analytics.releases && analytics.releases.length > 0) {
      score += 5
    }

    return Math.min(maxScore, Math.round(score))
  }

  // Generate health recommendations
  generateHealthRecommendations(analytics: Partial<RepositoryAnalytics>): string[] {
    const recommendations: string[] = []

    if (!analytics.overview?.description) {
      recommendations.push('Add a repository description to improve discoverability')
    }

    if ((analytics.issues?.open || 0) > 20) {
      recommendations.push('Consider addressing open issues to maintain repository health')
    }

    if ((analytics.pullRequests?.open || 0) > 10) {
      recommendations.push('Review and merge pending pull requests')
    }

    if (analytics.contributors?.length === 1) {
      recommendations.push('Encourage community contributions to improve project sustainability')
    }

    if (!analytics.releases || analytics.releases.length === 0) {
      recommendations.push('Create releases to mark important milestones')
    }

    if (analytics.commits?.weekly) {
      const recentActivity = analytics.commits.weekly.slice(-4).reduce((sum, week) => sum + week.commits, 0)
      if (recentActivity === 0) {
        recommendations.push('Recent activity is low - consider regular updates')
      }
    }

    return recommendations
  }
}

// Main analytics handler
async function generateRepositoryAnalytics(token: string, owner: string, repo: string): Promise<AnalyticsResponse> {
  try {
    // Validate inputs
    ErrorHandler.validateRequired(token, 'token')
    ErrorHandler.validateGitHubToken(token)
    ErrorHandler.validateRepository(`${owner}/${repo}`)

    const analyticsAPI = new GitHubAnalyticsAPI(token, owner, repo)

    // Fetch all data in parallel with error handling
    const [
      overviewResult,
      trafficResult,
      contributorsResult,
      languagesResult,
      commitActivityResult,
      recentCommitsResult,
      issuesStatsResult,
      pullRequestsStatsResult,
      releasesResult
    ] = await Promise.allSettled([
      analyticsAPI.getRepositoryOverview(),
      analyticsAPI.getTrafficData(),
      analyticsAPI.getContributors(),
      analyticsAPI.getLanguages(),
      analyticsAPI.getCommitActivity(),
      analyticsAPI.getRecentCommits(),
      analyticsAPI.getIssuesStats(),
      analyticsAPI.getPullRequestsStats(),
      analyticsAPI.getReleases()
    ])

    // Build analytics object with fallbacks
    const analytics: RepositoryAnalytics = {
      overview: overviewResult.status === 'fulfilled' ? overviewResult.value : {},
      traffic: trafficResult.status === 'fulfilled' ? trafficResult.value : {
        views: { count: 0, uniques: 0 },
        clones: { count: 0, uniques: 0 },
        referrers: [],
        paths: []
      },
      contributors: contributorsResult.status === 'fulfilled' ? contributorsResult.value.map((c: any) => ({
        login: c.login,
        contributions: c.contributions,
        avatar: c.avatar_url,
        htmlUrl: c.html_url,
        type: c.type
      })) : [],
      languages: languagesResult.status === 'fulfilled' ? 
        Object.entries(languagesResult.value).map(([lang, bytes]) => ({
          language: lang,
          bytes: bytes as number,
          percentage: 0 // Will be calculated below
        })) : [],
      commits: {
        total: 0,
        weekly: commitActivityResult.status === 'fulfilled' ? commitActivityResult.value : [],
        latest: recentCommitsResult.status === 'fulfilled' ? recentCommitsResult.value : []
      },
      issues: issuesStatsResult.status === 'fulfilled' ? issuesStatsResult.value : {
        open: 0,
        closed: 0,
        total: 0
      },
      pullRequests: pullRequestsStatsResult.status === 'fulfilled' ? pullRequestsStatsResult.value : {
        open: 0,
        closed: 0,
        merged: 0,
        total: 0,
        averageMergeTime: 0
      },
      releases: releasesResult.status === 'fulfilled' ? releasesResult.value : [],
      health: {
        score: 0,
        issues: [],
        recommendations: []
      }
    }

    // Calculate language percentages
    const totalBytes = analytics.languages.reduce((sum, lang) => sum + lang.bytes, 0)
    analytics.languages.forEach(lang => {
      lang.percentage = totalBytes > 0 ? Math.round((lang.bytes / totalBytes) * 100) : 0
    })

    // Calculate total commits
    if (analytics.commits.weekly) {
      analytics.commits.total = analytics.commits.weekly.reduce((sum, week) => sum + week.commits, 0)
    }

    // Calculate health score and recommendations
    analytics.health.score = analyticsAPI.calculateHealthScore(analytics)
    analytics.health.recommendations = analyticsAPI.generateHealthRecommendations(analytics)

    return {
      success: true,
      message: 'Repository analytics generated successfully',
      analytics
    }

  } catch (error) {
    ErrorHandler.logError(error as Error, 'Repository Analytics')
    const apiError = ErrorHandler.handleGitHubError(error)
    return ErrorHandler.createErrorResponse(apiError) as any
  }
}

// Main API handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, owner, repo } = body

    const result = await generateRepositoryAnalytics(token, owner, repo)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for API information
export async function GET() {
  return NextResponse.json({
    message: 'GitHub Repository Analytics API',
    description: 'Generate comprehensive analytics and insights for GitHub repositories',
    features: [
      'Repository overview and statistics',
      'Traffic analytics (views, clones, referrers)',
      'Contributor analysis',
      'Language breakdown',
      'Commit activity tracking',
      'Issues and PR statistics',
      'Release history',
      'Health score calculation',
      'Recommendations for improvement'
    ],
    parameters: {
      token: 'GitHub personal access token (required)',
      owner: 'Repository owner (required)',
      repo: 'Repository name (required)'
    },
    healthMetrics: [
      'Activity score',
      'Issue management',
      'PR management',
      'Contributor diversity',
      'Documentation completeness'
    ]
  })
}