'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, CreditCard, Users, Calendar, TrendingUp, RefreshCw, Download, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import AutoTable from '@/components/ui/auto-table'
import AutoForm from '@/components/ui/auto-form'
import { loansData, Loan } from '@/data/loansData'
import { membersData, getActiveMembers } from '@/data/membersData'
import { toast } from 'sonner'

export default function LoansPage() {
  const [loans, setLoans] = useState(loansData)
  const [loading, setLoading] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null)
  const [activeMembers, setActiveMembers] = useState(membersData.filter(m => m.status === 'active'))
  const [currentEMI, setCurrentEMI] = useState<number>(0)

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
      placeholder: 'Purpose of the loan',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-blue-600" />
              Loans Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Manage and track all member loans with EMI calculations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Loan
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Loans</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  ₹{stats.totalLoans.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.activeLoans}</p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingLoans}</p>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Completed</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.completedLoans}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Loans Table - Using AutoTable with Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <AutoTable 
          data={loans} 
          title="Loans"
          actions={(loan: Loan) => (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditLoan(loan)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteLoan(loan.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:border-red-300"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        />
      </motion.div>

      {/* AutoForm for Add/Edit Loan */}
      <AutoForm
        isOpen={isAddModalOpen || !!editingLoan}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingLoan(null)
          setCurrentEMI(0) // Reset EMI when closing
        }}
        onSubmit={editingLoan ? handleUpdateLoan : handleAddLoan}
        editingData={editingLoan}
        title={editingLoan ? 'Edit Loan' : 'Add New Loan'}
        description={editingLoan 
          ? 'Update loan information below'
          : 'Fill in details to add a new loan'
        }
        fields={loanFormFields}
        excludeFields={['id', 'status', 'remainingBalance', 'startDate', 'endDate', 'nextEmiDate', 'approvedBy', 'approvedDate', 'createdAt', 'updatedAt', 'emi']}
        onFormDataChange={handleFormDataChange}
      />

      {/* EMI Display */}
      {currentEMI > 0 && (isAddModalOpen || editingLoan) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50"
        >
          <div className="text-sm font-medium">Calculated EMI</div>
          <div className="text-2xl font-bold">₹{currentEMI.toLocaleString('en-IN')}</div>
          <div className="text-xs opacity-90">per month</div>
        </motion.div>
      )}
    </div>
  )
}