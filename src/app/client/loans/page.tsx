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
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <CreditCard className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-800 to-orange-800 dark:from-amber-200 dark:to-orange-200 bg-clip-text text-transparent">
              Complete Loan Management
            </h1>
            <p className="text-amber-700 dark:text-amber-300 font-medium">
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="loan-requests" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Loan Requests
            </TabsTrigger>
            <TabsTrigger value="existing-loans" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              All Loans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="loan-requests" className="mt-6">
            <EnhancedLoanApproval />
          </TabsContent>

          <TabsContent value="existing-loans" className="mt-6">
            <SimplifiedAllLoans />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}