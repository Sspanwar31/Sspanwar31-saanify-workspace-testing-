export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
}

export const GITHUB_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000
}

export class RetryHandler {
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = GITHUB_RETRY_CONFIG
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === config.maxRetries) {
          throw lastError
        }
        
        const delay = Math.min(
          config.baseDelay * Math.pow(2, attempt),
          config.maxDelay
        )
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError!
  }
}

export class ErrorHandler {
  static handle(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error
    }
    
    if (error instanceof Error) {
      return new ApiError(error.message, 500, 'UNKNOWN_ERROR')
    }
    
    return new ApiError('An unknown error occurred', 500, 'UNKNOWN_ERROR')
  }

  static handleGitHubError(error: any): ApiError {
    if (error?.status === 401) {
      return new ApiError('Invalid GitHub token', 401, 'INVALID_TOKEN')
    }
    if (error?.status === 403) {
      return new ApiError('GitHub API rate limit exceeded', 403, 'RATE_LIMIT')
    }
    if (error?.status === 404) {
      return new ApiError('Repository not found', 404, 'NOT_FOUND')
    }
    return this.handle(error)
  }

  static validateRequired(value: any, fieldName: string): void {
    if (!value) {
      throw new ApiError(`${fieldName} is required`, 400, 'MISSING_FIELD')
    }
  }

  static validateGitHubToken(token: string): void {
    if (!token) {
      throw new ApiError('GitHub token is required', 400, 'MISSING_TOKEN')
    }
    
    const isClassicToken = token.startsWith('ghp_')
    const isFineGrainedToken = token.startsWith('github_pat_')
    
    if (!isClassicToken && !isFineGrainedToken) {
      throw new ApiError('Invalid GitHub token format. Token should start with "ghp_" (classic) or "github_pat_" (fine-grained)', 400, 'INVALID_TOKEN_FORMAT')
    }
  }

  static validateRepository(repo: string): void {
    if (!repo || !repo.includes('/')) {
      throw new ApiError('Invalid repository format. Use "owner/repo"', 400, 'INVALID_REPO')
    }
  }

  static logError(error: Error, context?: string): void {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error.message)
  }
  
  static createErrorResponse(error: ApiError) {
    return Response.json(
      { 
        success: false, 
        error: error.message,
        code: error.code 
      },
      { status: error.statusCode }
    )
  }
}

export function handleApiError(error: unknown): ApiError {
  return ErrorHandler.handle(error)
}

export function createErrorResponse(error: ApiError) {
  return ErrorHandler.createErrorResponse(error)
}