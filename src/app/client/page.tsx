'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ClientPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/client')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
        <p className="text-amber-600 dark:text-amber-400">Loading dashboard...</p>
      </div>
    </div>
  )
}