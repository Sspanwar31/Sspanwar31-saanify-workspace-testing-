'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Home, User, Settings, BarChart3, FileText, LogOut, Users } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'

export default function ClientDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { checkSession } = await import('@/lib/auth')
        const session = await checkSession()
        
        if (!session.authenticated || session.user?.role !== 'CLIENT') {
          window.location.href = '/'
          return
        }
        
        setUserData(session.user)
      } catch (error) {
        console.error('Auth check failed:', error)
        window.location.href = '/'
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogout = async () => {
    try {
      const { logout } = await import('@/lib/auth')
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">Saanify</span>
              </Link>
              <span className="text-gray-500">|</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Client Dashboard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Coming Soon Section */}
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-2xl text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
                  <User className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Client Dashboard
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
                  Coming Soon! 🚀
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  We're working hard to bring you an amazing client dashboard experience. 
                  This feature is currently under development and will be available soon.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Project Management</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Track and manage your projects</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-medium text-green-900 dark:text-green-100">Analytics</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">Detailed insights and reports</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">Team Collaboration</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">Work together seamlessly</p>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-amber-800 dark:text-amber-200 font-medium">
                    👋 Welcome {userData?.name || 'Client'}! Your account is active and ready.
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    You'll be notified as soon as the client dashboard is live.
                  </p>
                </div>

                <div className="flex justify-center space-x-4 mt-6">
                  <Button onClick={() => window.location.href = '/'} variant="outline">
                    <Home className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                  <Button onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  )
}