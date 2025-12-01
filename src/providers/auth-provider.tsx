'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// User Type Definition
interface User {
  id: string
  email: string
  name: string
  role: string
  societyAccountId?: string
  trialEndsAt?: string
  subscriptionEndsAt?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: async () => {},
  refreshSession: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Function to check session from API
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/check-session', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for httpOnly cookies
        cache: 'no-store' 
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.authenticated && data.user) {
          setUser(data.user)
          
          // Store user info in localStorage for persistence
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(data.user))
          }
        } else {
          setUser(null)
          // Clear localStorage if session is invalid
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user')
          }
        }
      } else {
        setUser(null)
        // Clear localStorage on API error
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user')
        }
      }
    } catch (error) {
      console.error("Session check failed", error)
      setUser(null)
      // Clear localStorage on error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user')
      }
    } finally {
      setIsLoading(false)
    }
  }, []) // Empty dependency array - this function is stable

  // Function to refresh session
  const refreshSession = useCallback(async () => {
    setIsLoading(true)
    await checkAuth()
  }, [checkAuth])

  // Enhanced logout function
  const logout = useCallback(async () => {
    try {
      // Call logout API to clear server-side cookies
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout API call failed', error)
    } finally {
      // Clear client-side state regardless of API success
      setUser(null)
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user')
        sessionStorage.clear()
      }
      
      // Redirect to login page
      router.push('/login')
      router.refresh()
    }
  }, [router])

  // Check auth on mount only (avoid infinite re-renders)
  useEffect(() => {
    // Only run on mount for significant auth-related paths
    const isAuthRelatedPath = pathname?.startsWith('/login') || 
                             pathname?.startsWith('/signup') || 
                             pathname?.startsWith('/dashboard') ||
                             pathname?.startsWith('/admin')
    
    if (isAuthRelatedPath) {
      // First, try to restore user from localStorage for instant UI
      if (typeof window !== 'undefined') {
        try {
          const storedUser = localStorage.getItem('user')
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser)
            setUser(parsedUser)
            setIsLoading(false)
          }
        } catch (error) {
          console.error('Failed to parse stored user', error)
          localStorage.removeItem('user')
        }
      }

      // Then verify with server (with a small delay to ensure cookies are set)
      const timer = setTimeout(() => {
        checkAuth()
      }, 100)

      return () => clearTimeout(timer)
    }
  }, []) // Remove pathname dependency to prevent infinite re-renders

  // Set up periodic session refresh (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if we have a user and don't trigger state changes unnecessarily
      if (user && !isLoading) {
        // Silent refresh without triggering loading states
        fetch('/api/auth/check-session', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-store' 
        }).then(res => {
          if (res.ok) {
            return res.json()
          }
          throw new Error('Session check failed')
        }).then(data => {
          if (data.authenticated && data.user) {
            // Only update if user data actually changed - compare individual fields
            const currentUserId = user?.id
            const currentUserEmail = user?.email  
            const currentUserRole = user?.role
            
            if (data.user.id !== currentUserId || 
                data.user.email !== currentUserEmail || 
                data.user.role !== currentUserRole) {
              setUser(data.user)
              if (typeof window !== 'undefined') {
                localStorage.setItem('user', JSON.stringify(data.user))
              }
            }
          }
        }).catch(error => {
          console.error("Periodic session check failed", error)
          // Don't automatically log out on periodic check failure
          // This prevents unnecessary logouts due to network issues
        })
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [user?.id, isLoading]) // Depend only on user ID and loading state

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}
