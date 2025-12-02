'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, CreditCard, Users, Calendar, TrendingUp, RefreshCw, Download, Edit, Trash2, BookOpen, Calculator, IndianRupee, Clock, AlertTriangle, Percent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AutoTable from '@/components/ui/auto-table'
import AutoForm from '@/components/ui/auto-form'
import { loansData, Loan } from '@/data/loansData'
import { membersData, getActiveMembers } from '@/data/membersData'
import { toast } from 'sonner'
import EnhancedLoanManagement from '@/components/client/EnhancedLoanManagement'

export default function IntegratedLoansPage() {
  const [loans, setLoans] = useState(loansData)
  const [loading, setLoading] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null)
  const [activeMembers, setActiveMembers] = useState(membersData.filter(m => m.status === 'active'))
  const [currentEMI, setCurrentEMI] = useState<number>(0)
  const [activeTab, setActiveTab] = useState('existing-loans')

  // Calculate statistics based on enhanced loan data
  const stats = useMemo(() => ({
    totalLoans: loans.reduce((sum, loan) => sum + loan.amount, 0),
    activeLoans: loans.filter(loan => loan.status === 'active').length,
    pendingLoans: loans.filter(loan => loan.status === 'pending').length,
    completedLoans: loans.filter(loan => loan.status === 'completed').length
  }), [loans])

  const handleAddLoan = (newLoan: any) => {
    const calculatedEMI = calculateEMI(
      parseInt(newLoan.amount),
      parseFloat(newLoan.interest),
      parseInt(newLoan.duration)
    )
    
    const loanWithId = {
      ...newLoan,
      id: `loan-uuid-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`,
      status: 'pending',
      remainingBalance: newLoan.amount,
      emi: calculatedEMI,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + parseInt(newLoan.duration || 12))).toISOString().split('T')[0],
      nextEmiDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setLoans([...loans, loanWithId])
    setCurrentEMI(0) // Reset EMI after adding
    toast.success('✅ Loan Added', {
      description: `Loan for ${newLoan.memberId} has been added successfully with EMI: ₹${calculatedEMI.toLocaleString('en-IN')}`,
      duration: 3000
    })
  }

  const handleEditLoan = (loan: Loan) => {
    setEditingLoan(loan)
  }

  const handleUpdateLoan = (updatedLoan: any) => {
    const calculatedEMI = calculateEMI(
      parseInt(updatedLoan.amount),
      parseFloat(updatedLoan.interest),
      parseInt(updatedLoan.duration)
    )
    
    setLoans(loans.map(loan => 
      loan.id === editingLoan?.id 
        ? { 
            ...loan, 
            ...updatedLoan, 
            emi: calculatedEMI,
            updated_at: new Date().toISOString() 
          }
        : loan
    ))
    setEditingLoan(null)
    setCurrentEMI(0) // Reset EMI after updating
    toast.success('✅ Loan Updated', {
      description: `Loan has been updated successfully with new EMI: ₹${calculatedEMI.toLocaleString('en-IN')}`,
      duration: 3000
    })
  }

  const handleDeleteLoan = (loanId: string) => {
    if (confirm('Are you sure you want to delete this loan?')) {
      setLoans(loans.filter(loan => loan.id !== loanId))
      toast.success('🗑️ Loan Deleted', {
        description: 'Loan has been deleted successfully',
        duration: 3000
      })
    }
  }

  // EMI Calculation Function
  const calculateEMI = (principal: number, annualRate: number, tenureMonths: number): number => {
    if (!principal || !annualRate || !tenureMonths) return 0
    
    const monthlyRate = annualRate / 12 / 100
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
                (Math.pow(1 + monthlyRate, tenureMonths) - 1)
    return Math.round(emi * 100) / 100 // Round to 2 decimal places
  }

  // Handle form data change for EMI calculation
  const handleFormDataChange = (formData: Record<string, any>) => {
    const amount = parseInt(formData.amount) || 0
    const interest = parseFloat(formData.interest) || 0
    const duration = parseInt(formData.duration) || 0
    
    if (amount > 0 && interest > 0 && duration > 0) {
      const emi = calculateEMI(amount, interest, duration)
      setCurrentEMI(emi)
    } else {
      setCurrentEMI(0)
    }
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('🔄 Data Refreshed', {
        description: 'Loan data has been refreshed',
        duration: 2000
      })
    }, 1000)
  }

  const handleExport = () => {
    toast.info('📊 Export Started', {
      description: 'Loan data is being exported to CSV',
      duration: 3000
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300',
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
    }
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status}
      </Badge>
    )
  }

  // AutoForm Configuration for Loans
  const loanFormFields = {
    memberId: {
      type: 'select' as const,
      label: 'Select Member',
      placeholder: 'Choose a member',
      required: true,
      options: activeMembers.map(member => `${member.name} (${member.id})`)
    },
    amount: {
      type: 'text' as const,
      label: 'Loan Amount (₹)',
      placeholder: 'Enter loan amount',
      required: true,
      validation: {
        min: 1000,
        max: 10000000,
        pattern: /^\d+$/,
        custom: (value: string) => {
          const amount = parseInt(value)
          if (amount < 1000) return 'Minimum loan amount is ₹1,000'
          if (amount > 10000000) return 'Maximum loan amount is ₹1,00,00,000'
          return null
        }
      }
    },
    interest: {
      type: 'text' as const,
      label: 'Interest Rate (%)',
      placeholder: 'Annual interest rate',
      required: true,
      validation: {
        min: 1,
        max: 36,
        pattern: /^\d+(\.\d{1,2})?$/,
        custom: (value: string) => {
          const rate = parseFloat(value)
          if (rate < 1) return 'Minimum interest rate is 1%'
          if (rate > 36) return 'Maximum interest rate is 36%'
          return null
        }
      }
    },
    duration: {
      type: 'select' as const,
      label: 'Loan Duration',
      placeholder: 'Select duration',
      required: true,
      options: ['3', '6', '12', '18', '24', '36', '48', '60']
    },
    description: {
      type: 'textarea' as const,
      label: 'Loan Description',
      placeholder: 'Purpose of loan',
      required: false
    },
    depositReference: {
      type: 'text' as const,
      label: 'Deposit Reference',
      placeholder: 'Reference to passbook deposit',
      required: false
    },
    memberDepositAmount: {
      type: 'text' as const,
      label: 'Member Deposit Amount (₹)',
      placeholder: 'Total deposit amount for 80% calculation',
      required: false,
      validation: {
        pattern: /^\d+$/,
        custom: (value: string) => {
          if (value && parseInt(value) < 1000) return 'Minimum deposit amount is ₹1,000'
          return null
        }
      }
    }
  }

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
              Manage loan requests and existing loans with passbook integration
            </p>
          </div>
        </div>
      </motion.div>

      {/* Passbook-style Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="relative overflow-hidden rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 shadow-lg">
          {/* Passbook-style decorative pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="h-full w-full" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, #d97706 0px, transparent 1px, transparent 10px, #d97706 11px)',
              backgroundSize: '11px 11px'
            }} />
          </div>
          
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Total Loans</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  ₹{stats.totalLoans.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 bg-amber-500 rounded-lg shadow-md">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 shadow-lg">
          <div className="absolute inset-0 opacity-5">
            <div className="h-full w-full" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, #059669 0px, transparent 1px, transparent 10px, #059669 11px)',
              backgroundSize: '11px 11px'
            }} />
          </div>
          
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Active</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.activeLoans}</p>
              </div>
              <div className="p-3 bg-green-500 rounded-lg shadow-md">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 shadow-lg">
          <div className="absolute inset-0 opacity-5">
            <div className="h-full w-full" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, #ea580c 0px, transparent 1px, transparent 10px, #ea580c 11px)',
              backgroundSize: '11px 11px'
            }} />
          </div>
          
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Pending</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.pendingLoans}</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-lg shadow-md">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 shadow-lg">
          <div className="absolute inset-0 opacity-5">
            <div className="h-full w-full" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, #2563eb 0px, transparent 1px, transparent 10px, #2563eb 11px)',
              backgroundSize: '11px 11px'
            }} />
          </div>
          
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Completed</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.completedLoans}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-lg shadow-md">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-col md:flex-row gap-4 justify-center"
      >
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
        <Button
          variant="outline"
          onClick={handleExport}
          className="flex items-center gap-2 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30"
        >
          <Download className="h-4 w-4" />
          Export Loans
        </Button>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Add New Loan
        </Button>
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
              <AlertTriangle className="h-4 w-4" />
              Loan Requests
            </TabsTrigger>
            <TabsTrigger value="existing-loans" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Existing Loans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="loan-requests" className="mt-6">
            <EnhancedLoanManagement />
          </TabsContent>

          <TabsContent value="existing-loans" className="mt-6">
            {/* Existing Loans Table - Passbook Style */}
            <div className="rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 shadow-lg overflow-hidden">
              {/* Passbook header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Existing Loans Register
                </h2>
              </div>
              
              <div className="p-6">
                <AutoTable 
                  data={loans} 
                  title=""
                  actions={(loan: Loan) => (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditLoan(loan)}
                        className="h-8 w-8 p-0 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteLoan(loan.id)}
                        className="h-8 w-8 p-0 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  columns={[
                    { key: 'id', label: 'Loan ID', render: (loan: Loan) => (
                      <span className="font-mono text-xs bg-amber-100 dark:bg-amber-900/20 px-2 py-1 rounded">
                        {loan.id}
                      </span>
                    )},
                    { key: 'memberId', label: 'Member', render: (loan: Loan) => (
                      <div>
                        <div className="font-medium">{loan.memberId}</div>
                        {loan.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{loan.description}</div>
                        )}
                      </div>
                    )},
                    { key: 'amount', label: 'Amount', render: (loan: Loan) => (
                      <div className="font-semibold text-amber-600 dark:text-amber-400">
                        ₹{loan.amount.toLocaleString('en-IN')}
                      </div>
                    )},
                    { key: 'interest', label: 'Interest', render: (loan: Loan) => (
                      <div className="flex items-center gap-1">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <span>{loan.interest}%</span>
                      </div>
                    )},
                    { key: 'duration', label: 'Duration', render: (loan: Loan) => (
                      <span>{loan.duration} months</span>
                    )},
                    { key: 'emi', label: 'EMI', render: (loan: Loan) => (
                      <div className="font-semibold text-blue-600 dark:text-blue-400">
                        ₹{loan.emi?.toLocaleString('en-IN') || 'N/A'}
                      </div>
                    )},
                    { key: 'status', label: 'Status', render: (loan: Loan) => (
                      getStatusBadge(loan.status)
                    )},
                    { key: 'startDate', label: 'Start Date', render: (loan: Loan) => (
                      <span className="text-sm">{loan.startDate || 'N/A'}</span>
                    )},
                  ]}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Add Loan Modal */}
      <AutoForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingLoan ? 'Edit Loan' : 'Add New Loan'}
        fields={loanFormFields}
        initialData={editingLoan || undefined}
        onSubmit={editingLoan ? handleUpdateLoan : handleAddLoan}
        onFormDataChange={handleFormDataChange}
        submitButtonText={editingLoan ? 'Update Loan' : 'Add Loan'}
      />

      {/* EMI Display */}
      {currentEMI > 0 && isAddModalOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg max-w-sm"
        >
          <div className="flex items-center gap-3">
            <Calculator className="h-6 w-6" />
            <div>
              <p className="text-sm opacity-90">Calculated EMI</p>
              <p className="text-xl font-bold">₹{currentEMI.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}