'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, DollarSign, TrendingUp, Calendar, CreditCard, RefreshCw, Download, BookOpen, Receipt, IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AutoTable from '@/components/ui/auto-table'
import { expensesData } from '@/data/expensesData'
import { toast } from 'sonner'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState(expensesData)
  const [loading, setLoading] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('all')

  // Calculate statistics based on enhanced expenses data
  const stats = useMemo(() => ({
    totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    maintenanceExpenses: expenses.filter(exp => exp.category === 'maintenance').reduce((sum, exp) => sum + exp.amount, 0),
    utilityExpenses: expenses.filter(exp => exp.category === 'utility').reduce((sum, exp) => sum + exp.amount, 0),
    pendingExpenses: expenses.filter(exp => exp.status === 'pending').length,
    approvedExpenses: expenses.filter(exp => exp.status === 'approved').length
  }), [expenses])

  // Get unique categories for filter
  const uniqueCategories = Array.from(new Set(expenses.map(exp => exp.category)))

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    if (selectedType === 'all') return expenses
    return expenses.filter(expense => expense.category === selectedType)
  }, [expenses, selectedType])

  const handleAddExpense = (newExpense: any) => {
    const expenseWithId = {
      ...newExpense,
      id: `exp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    setExpenses([...expenses, expenseWithId])
    toast.success('✅ Expense Added', {
      description: `Expense "${newExpense.description}" has been added successfully`,
      duration: 3000
    })
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('🔄 Data Refreshed', {
        description: 'Expense data has been refreshed',
        duration: 2000
      })
    }, 1000)
  }

  const handleExport = () => {
    toast.info('📊 Export Started', {
      description: 'Expense data is being exported to CSV',
      duration: 3000
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getCategoryBadge = (category: string) => {
    const variants = {
      maintenance: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      utility: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      administrative: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      security: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
    }
    return (
      <Badge className={variants[category as keyof typeof variants] || variants.maintenance}>
        {category}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300',
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
    }
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status}
      </Badge>
    )
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
            <Receipt className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-800 to-orange-800 dark:from-amber-200 dark:to-orange-200 bg-clip-text text-transparent">
              Expenses Ledger
            </h1>
            <p className="text-amber-700 dark:text-amber-300 font-medium">
              Track and manage all society expenses
            </p>
          </div>
        </div>
      </motion.div>

      {/* Passbook-style Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
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
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Total Expenses</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {formatCurrency(stats.totalExpenses)}
                </p>
              </div>
              <div className="p-3 bg-amber-500 rounded-lg shadow-md">
                <DollarSign className="h-6 w-6 text-white" />
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
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Maintenance</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {formatCurrency(stats.maintenanceExpenses)}
                </p>
              </div>
              <div className="p-3 bg-blue-500 rounded-lg shadow-md">
                <Calendar className="h-6 w-6 text-white" />
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
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Utilities</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatCurrency(stats.utilityExpenses)}
                </p>
              </div>
              <div className="p-3 bg-green-500 rounded-lg shadow-md">
                <CreditCard className="h-6 w-6 text-white" />
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
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.pendingExpenses}</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-lg shadow-md">
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
          Refresh Ledger
        </Button>
        <Button
          variant="outline"
          onClick={handleExport}
          className="flex items-center gap-2 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30"
        >
          <Download className="h-4 w-4" />
          Export Expenses
        </Button>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </motion.div>

      {/* Category Breakdown - Passbook Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 shadow-lg overflow-hidden"
      >
        {/* Passbook header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Expense Categories
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {uniqueCategories.map((category, index) => {
              const categoryExpenses = expenses.filter(exp => exp.category === category)
              const categoryTotal = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0)
              
              return (
                <div key={category} className="p-4 border border-amber-200 dark:border-amber-800 rounded-xl bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-amber-900 dark:text-amber-100 capitalize">
                      {category}
                    </div>
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      {getCategoryBadge(category)}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-1">
                    {formatCurrency(categoryTotal)}
                  </div>
                  <div className="text-xs text-amber-700 dark:text-amber-300">
                    {categoryExpenses.length} transaction{categoryExpenses.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Filter Section - Passbook Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 shadow-lg p-6"
      >
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-amber-900 dark:text-amber-100">Filter by Category:</span>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-48 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Expenses Table - Passbook Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 shadow-lg overflow-hidden"
      >
        {/* Passbook header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Expense Register
          </h2>
        </div>
        
        <div className="p-6">
          <AutoTable data={filteredExpenses} title="" />
        </div>
      </motion.div>

      {/* Add Expense Modal - Passbook Style */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-6 w-full max-w-md border-2 border-amber-200 dark:border-amber-800 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-amber-900 dark:text-amber-100">Add New Expense Entry</h2>
            </div>
            
            <p className="text-amber-700 dark:text-amber-300 mb-6">
              Fill in details to add a new expense to the ledger
            </p>
            
            <div className="flex gap-3">
              <Button 
                onClick={() => setIsAddModalOpen(false)} 
                variant="outline" 
                className="flex-1 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => setIsAddModalOpen(false)} 
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                Add Expense (Demo)
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}