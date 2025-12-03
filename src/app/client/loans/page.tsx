'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Clock, BookOpen, RefreshCw, Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import EnhancedLoanApproval from '@/components/client/EnhancedLoanApproval'
import SimplifiedAllLoansCompact from '@/components/client/SimplifiedAllLoansCompact'
import { toast } from 'sonner'

export default function IntegratedLoansPage() {
  const [activeTab, setActiveTab] = useState('loan-requests')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    toast.info('🔄 लोन डेटा रिफ़्रेश हो रहा है', {
      description: 'नवीनतम लोन जानकारी लोड हो रही है',
      duration: 2000
    })
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
      {/* Compact Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                Loan Management
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Manage loan requests and track existing loans
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Compact Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <TabsTrigger 
              value="loan-requests" 
              className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md rounded-lg transition-all duration-200"
            >
              <Clock className="h-4 w-4" />
              Loan Requests
            </TabsTrigger>
            <TabsTrigger 
              value="existing-loans" 
              className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md rounded-lg transition-all duration-200"
            >
              <BookOpen className="h-4 w-4" />
              All Loans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="loan-requests" className="mt-6">
            <EnhancedLoanApproval key={refreshKey} />
          </TabsContent>

          <TabsContent value="existing-loans" className="mt-6">
            <SimplifiedAllLoansCompact key={refreshKey} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}