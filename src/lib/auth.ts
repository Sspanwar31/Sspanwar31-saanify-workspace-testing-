// Enhanced client-side auth utility with refresh token support
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface UserInfo {
  id: string
  email: string
  name?: string
  role: 'ADMIN' | 'CLIENT'
  societyAccountId?: string
}

type RequestCredentials = 'include' | 'omit' | 'same-origin'

export const setAuthTokens = (tokens: AuthTokens) => {
  // Note: httpOnly cookies are set by the server, so we don't need to set them via document.cookie
  // The server will set httpOnly cookies, we just need to store refresh token in localStorage as backup
  
  // Store refresh token in localStorage as backup for refresh operations
  localStorage.setItem('refresh-token', tokens.refreshToken)
  
  console.log('✅ [DEBUG] Auth tokens set - refresh token stored in localStorage')
}

export const getAccessToken = () => {
  // Try to get from cookie first
  const cookies = document.cookie.split(';')
  const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='))
  if (authCookie) {
    return authCookie.split('=')[1]
  }
  
  return null
}

export const getRefreshToken = () => {
  // Try to get from cookie first
  const cookies = document.cookie.split(';')
  const refreshCookie = cookies.find(cookie => cookie.trim().startsWith('refresh-token='))
  if (refreshCookie) {
    return refreshCookie.split('=')[1]
  }
  
  // Fallback to localStorage
  return localStorage.getItem('refresh-token')
}

export const removeAuthTokens = () => {
  // Remove cookies
  document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  document.cookie = 'refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  
  // Remove from localStorage
  localStorage.removeItem('refresh-token')
}

export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken()
  
  if (!refreshToken) {
    return null
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })

    if (response.ok) {
      const data = await response.json()
      
      // Update the access token cookie
      document.cookie = `auth-token=${data.accessToken}; path=/; max-age=900; samesite=lax`
      
      return data.accessToken
    } else {
      // Refresh failed, clear tokens
      removeAuthTokens()
      return null
    }
  } catch (error) {
    console.error('Token refresh failed:', error)
    removeAuthTokens()
    return null
  }
}

export const makeAuthenticatedRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  console.log(`🔐 [DEBUG] makeAuthenticatedRequest called for: ${url}`)
  console.log(`  - Using httpOnly cookies for authentication`)

  // For httpOnly cookies, we don't need to manually add Authorization header
  // The browser will automatically send the httpOnly cookies
  const requestOptions = {
    ...options,
    credentials: 'include' as RequestCredentials,
    // Don't set Authorization header when using httpOnly cookies
    headers: {
      ...options.headers
      // Authorization header removed - cookies will be sent automatically
    }
  }

  console.log(`📡 [DEBUG] Making request with httpOnly cookies to: ${url}`)

  const response = await fetch(url, requestOptions)

  console.log(`📡 [DEBUG] Response status: ${response.status}`)

  // If the response is 401, we need to refresh the token
  if (response.status === 401) {
    console.log('🔄 [DEBUG] Got 401, attempting token refresh...')
    
    try {
      // Get refresh token from localStorage (should be available from login)
      const refreshToken = localStorage.getItem('refresh-token')
      
      if (!refreshToken) {
        console.log('❌ [DEBUG] No refresh token available')
        throw new Error('No refresh token available')
      }

      // Call refresh endpoint
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken })
      })

      if (refreshResponse.ok) {
        console.log('✅ [DEBUG] Token refresh successful, retrying request...')
        // Retry the original request - new httpOnly cookie will be sent automatically
        return fetch(url, requestOptions)
      } else {
        console.log('❌ [DEBUG] Token refresh failed')
        throw new Error('Authentication failed')
      }
    } catch (refreshError) {
      console.log('❌ [DEBUG] Refresh error:', refreshError.message)
      throw new Error('Authentication failed')
    }
  }

  return response
}

export const checkSession = async (): Promise<{ authenticated: boolean; user?: UserInfo }> => {
  try {
    // Make request to check-session - the server will read httpOnly cookies
    const response = await fetch('/api/auth/check-session', {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      credentials: 'include' // Important for httpOnly cookies
    })
    
    const data = await response.json()
    
    if (data.authenticated && data.user) {
      return {
        authenticated: true,
        user: data.user
      }
    } else {
      // Clear invalid tokens (if any)
      removeAuthTokens()
      return { authenticated: false }
    }
  } catch (error) {
    console.error('Session check failed:', error)
    removeAuthTokens()
    return { authenticated: false }
  }
}

export const logout = async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST' })
  } catch (error) {
    console.error('Logout API call failed:', error)
  } finally {
    // Always clear local tokens
    removeAuthTokens()
    // Redirect to login
    window.location.href = '/'
  }
}