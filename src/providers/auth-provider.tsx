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
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: async () => {},
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
        cache: 'no-store' 
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.authenticated && data.user) {
          setUser(data.user)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Session check failed", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Check auth on mount and path change
  useEffect(() => {
    checkAuth()
  }, [pathname])

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
