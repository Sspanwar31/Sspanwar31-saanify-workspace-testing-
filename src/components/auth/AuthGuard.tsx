'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'SUPER_ADMIN' | 'CLIENT' | 'SUPERADMIN'
  redirectTo?: string
}

export default function AuthGuard({ children, requiredRole, redirectTo = '/login' }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. Check Session via API
        const response = await fetch('/api/auth/check-session', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        })

        if (!response.ok) {
          console.log("AuthGuard: Session check failed")
          router.push(redirectTo)
          return
        }

        const data = await response.json()

        if (!data.authenticated || !data.user) {
          console.log("AuthGuard: Not authenticated")
          router.push(redirectTo)
          return
        }

        // 2. Role Checking Logic (Flexible & Safe)
        if (requiredRole) {
          // Role ko string banakar uppercase karein taaki crash na ho
          const userRole = String(data.user.role || '').toUpperCase()
          
          // Super Admin Check
          if (requiredRole === 'SUPER_ADMIN' || requiredRole === 'SUPERADMIN') {
            if (!userRole.includes('SUPER') && !userRole.includes('ADMIN')) {
              console.error("AuthGuard: Role Mismatch. User:", userRole)
              router.push('/not-authorized')
              return
            }
          } 
          // Client Check
          else if (userRole !== requiredRole) {
            router.push('/not-authorized')
            return
          }
        }

        setIsAuthenticated(true)
      } catch (error) {
        console.error('AuthGuard Error:', error)
        router.push(redirectTo)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, requiredRole, redirectTo])

  // --- SAFE LOADING UI (No External Component) ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-500 font-medium">Verifying Access...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Redirecting...
  }

  return <>{children}</>
}
