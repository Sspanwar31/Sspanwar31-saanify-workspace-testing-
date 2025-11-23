'use client'

import { useState, useEffect } from 'react'
import ErrorBoundaryClass from '@/components/error-boundary-new'
import CloudDashboard from '@/components/cloud/CloudDashboard'

export default function CloudDashboardPage() {
  return (
    <ErrorBoundaryClass>
      <div className="min-h-screen bg-gradient-to-br from-background via-sky-50/10 to-sky-100/10 dark:from-background dark:via-sky-950/50 dark:to-sky-900/50 p-6">
        <CloudDashboard onStatsUpdate={() => {}} />
      </div>
    </ErrorBoundaryClass>
  )
}