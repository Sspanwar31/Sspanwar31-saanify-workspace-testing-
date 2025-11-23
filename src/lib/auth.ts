// Enhanced client-side auth utility with refresh token support
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface UserInfo {
  id: string
  email: string
  name?: string
  role: 'SUPER_ADMIN' | 'CLIENT'
  societyAccountId?: string
}

export const setAuthTokens = (tokens: AuthTokens) => {
  // Set access token cookie via document.cookie (fallback)
  document.cookie = `auth-token=${tokens.accessToken}; path=/; max-age=900; samesite=lax` // 15 minutes
  
  // Set refresh token cookie
  document.cookie = `refresh-token=${tokens.refreshToken}; path=/; max-age=604800; samesite=lax` // 7 days
  
  // Store refresh token in localStorage as backup
  localStorage.setItem('refresh-token', tokens.refreshToken)
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
  let accessToken = getAccessToken()

  // If no access token, try to refresh
  if (!accessToken) {
    accessToken = await refreshAccessToken()
    
    if (!accessToken) {
      throw new Error('No valid authentication token')
    }
  }

  // Make the request with the access token
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    }
  })

  // If the response is 401, try to refresh the token and retry once
  if (response.status === 401) {
    const newAccessToken = await refreshAccessToken()
    
    if (newAccessToken) {
      // Retry the request with the new token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newAccessToken}`
        }
      })
    } else {
      throw new Error('Authentication failed')
    }
  }

  return response
}

export const checkSession = async (): Promise<{ authenticated: boolean; user?: UserInfo }> => {
  try {
    // Get access token and send it with the request
    const accessToken = getAccessToken()
    
    const response = await fetch('/api/auth/check-session', {
      headers: accessToken ? {
        'Authorization': `Bearer ${accessToken}`
      } : {}
    })
    
    const data = await response.json()
    
    if (data.authenticated && data.user) {
      return {
        authenticated: true,
        user: data.user
      }
    } else {
      // Clear invalid tokens
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