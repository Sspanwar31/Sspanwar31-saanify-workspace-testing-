'use client'

import { createContext, useContext, useEffect, useState } from 'react'
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
  const checkAuth = async () => {
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
  }

  // Function to refresh session
  const refreshSession = async () => {
    setIsLoading(true)
    await checkAuth()
  }

  // Enhanced logout function
  const logout = async () => {
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
  }

  // Check auth on mount and path change
  useEffect(() => {
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
  }, [pathname])

  // Set up periodic session refresh (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        checkAuth()
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}
