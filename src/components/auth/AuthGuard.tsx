'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import LoadingSpinner from '@/components/ui/loading-spinner'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = async () => {
    try {
      console.log('🔍 AuthGuard: Checking authentication...')
      
      // Check if user is authenticated
      const response = await fetch('/api/auth/check-session', {
        credentials: 'include'
      })

      console.log('🔍 AuthGuard: Session check response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('🔍 AuthGuard: Session data:', data)
        
        // Check if user has client role and society account
        if (data.user && (data.user.role === 'ADMIN' || data.user.role === 'MEMBER' || data.user.role === 'TREASURER' || data.user.role === 'CLIENT')) {
          if (data.user.societyAccountId) {
            console.log('✅ AuthGuard: User authenticated successfully')
            setIsAuthenticated(true)
          } else {
            console.error('❌ AuthGuard: User is not associated with any society')
            router.push('/login')
            return
          }
        } else {
          console.error('❌ AuthGuard: User is not a client - Role:', data.user?.role)
          router.push('/login')
          return
        }
      } else {
        console.error('❌ AuthGuard: No valid session found - Status:', response.status)
        router.push('/login')
        return
      }
    } catch (error) {
      console.error('❌ AuthGuard: Authentication check failed:', error)
      router.push('/login')
      return
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/50 dark:from-slate-900 dark:via-emerald-950/20 dark:to-teal-950/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <LoadingSpinner />
          <p className="mt-4 text-muted-foreground">Checking authentication...</p>
        </motion.div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-950/20 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please log in to access the client panel.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}