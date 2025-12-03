'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/client/Sidebar'
import Topbar from '@/components/client/Topbar'
import LoadingSpinner from '@/components/ui/loading-spinner'
import ApiStatusMonitor from '@/components/client/ApiStatusMonitor'
import '@/lib/api-interceptor' // Initialize API notifications

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(false) // Set to false since we removed the loading effect
  const [error, setError] = useState<string | null>(null)
  const pathname = usePathname()

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handle navigation loading state - removed to prevent infinite re-renders
  // useEffect(() => {
  //   setIsLoading(true)
  //   const timer = setTimeout(() => {
  //     setIsLoading(false)
  //     setError(null)
  //   }, 300)
  //   
  //   return () => clearTimeout(timer)
  // }, [pathname])

  const handleSignOut = () => {
    window.location.href = '/login'
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-950/20 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Passbook-style Background Pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-yellow-950/20">
        {/* Traditional passbook pattern overlay */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="h-full w-full" style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, #d97706 0px, transparent 1px, transparent 40px, #d97706 41px),
              repeating-linear-gradient(90deg, #d97706 0px, transparent 1px, transparent 40px, #d97706 41px)
            `,
            backgroundSize: '41px 41px'
          }} />
        </div>
        {/* Ledger-style vertical lines */}
        <div className="absolute inset-0 opacity-3 dark:opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #92400e 0px, transparent 2px, transparent 200px, #92400e 202px)',
            backgroundSize: '202px 100%'
          }} />
        </div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-amber-50/90 dark:bg-amber-950/90 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-amber-800 dark:text-amber-200 font-medium">Loading Passbook...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex">
        {/* Sidebar */}
        <Sidebar 
          onClose={() => setSidebarOpen(false)} 
          pathname={pathname}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Topbar */}
          <Topbar
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            onSignOut={handleSignOut}
            sidebarOpen={sidebarOpen}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto p-6">
  
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* API Status Monitor */}
      <ApiStatusMonitor />
    </div>
  )
}