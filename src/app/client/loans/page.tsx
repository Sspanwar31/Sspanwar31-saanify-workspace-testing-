'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Clock, BookOpen } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import EnhancedLoanApproval from '@/components/client/EnhancedLoanApproval'
import SimplifiedAllLoans from '@/components/client/SimplifiedAllLoans'

export default function IntegratedLoansPage() {
  const [activeTab, setActiveTab] = useState('loan-requests')

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-4 mb-6 p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-700 shadow-lg">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-800 to-orange-800 dark:from-amber-200 dark:to-orange-200 bg-clip-text text-transparent">
              Complete Loan Management
            </h1>
            <p className="text-amber-700 dark:text-amber-300 font-medium text-lg mt-1">
              Manage loan requests and existing loans with enhanced approval system
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shadow-inner">
            <TabsTrigger 
              value="loan-requests" 
              className="flex items-center gap-3 text-base font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <Clock className="h-5 w-5" />
              Loan Requests
            </TabsTrigger>
            <TabsTrigger 
              value="existing-loans" 
              className="flex items-center gap-3 text-base font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-lg rounded-lg transition-all duration-200"
            >
              <BookOpen className="h-5 w-5" />
              All Loans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="loan-requests" className="mt-8">
            <EnhancedLoanApproval />
          </TabsContent>

          <TabsContent value="existing-loans" className="mt-8">
            <SimplifiedAllLoans />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}