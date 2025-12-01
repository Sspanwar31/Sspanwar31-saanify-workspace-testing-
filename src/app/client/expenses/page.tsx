'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, DollarSign, TrendingUp, Calendar, CreditCard, RefreshCw, Download } from 'lucide-react'
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
              <DollarSign className="h-8 w-8 text-orange-600" />
              Expenses Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Track and manage all society expenses and costs
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
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Expenses</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(stats.totalExpenses)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Maintenance</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(stats.maintenanceExpenses)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Utilities</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(stats.utilityExpenses)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingExpenses}</p>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {uniqueCategories.map((category, index) => {
          const categoryExpenses = expenses.filter(exp => exp.category === category)
          const categoryTotal = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0)
          
          return (
            <Card key={category} className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 capitalize">
                      {category}
                    </p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {formatCurrency(categoryTotal)}
                    </p>
                  </div>
                  <div className="p-2 bg-slate-100 dark:bg-slate-900/20 rounded-lg">
                    {getCategoryBadge(category)}
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {categoryExpenses.length} transaction{categoryExpenses.length !== 1 ? 's' : ''}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6"
      >
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter by Category:</span>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
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

      {/* Expenses Table - Using AutoTable */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <AutoTable data={filteredExpenses} title="Expenses" />
      </motion.div>

      {/* Add Expense Modal - Simplified for demo */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">Add New Expense</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This is a simplified demo. In production, this would include category selection, amount validation, and approval workflow.
            </p>
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => setIsAddModalOpen(false)} 
                variant="outline" 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => setIsAddModalOpen(false)} 
                className="flex-1"
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