'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Wallet,
  PiggyBank,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AutoTable from '@/components/ui/auto-table'
import { adminFundData } from '@/data/adminFundData'
import { toast } from 'sonner'

interface FundTransaction {
  id: string
  type: 'credit' | 'debit'
  category: 'contribution' | 'expense' | 'investment' | 'reserve' | 'emergency'
  amount: number
  description: string
  date: string
  reference?: string
  approvedBy?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at?: string
  updated_at?: string
}

interface FundSummary {
  totalBalance: number
  totalContributions: number
  totalExpenses: number
  investments: number
  reserves: number
  emergencyFund: number
  monthChange: number
  monthChangePercent: number
}

export default function AdminFundManagement() {
  const [transactions, setTransactions] = useState<FundTransaction[]>(adminFundData)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')

  // Calculate fund summary based on enhanced data
  const fundSummary = useMemo(() => {
    const credits = transactions.filter(t => t.type === 'credit')
    const debits = transactions.filter(t => t.type === 'debit')
    
    const totalContributions = credits
      .filter(t => t.category === 'contribution')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalExpenses = debits
      .filter(t => t.category === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const investments = credits
      .filter(t => t.category === 'investment')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const reserves = credits
      .filter(t => t.category === 'reserve')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const emergencyFund = credits
      .filter(t => t.category === 'emergency')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalBalance = credits.reduce((sum, t) => sum + t.amount, 0) - 
                        debits.reduce((sum, t) => sum + t.amount, 0)

    return {
      totalBalance,
      totalContributions,
      totalExpenses,
      investments,
      reserves,
      emergencyFund,
      monthChange: totalBalance * 0.065, // Mock 6.5% growth
      monthChangePercent: 6.5
    }
  }, [transactions])

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions
    return transactions.filter(transaction => 
      transaction.type === filter || transaction.category === filter
    )
  }, [transactions, filter])

  const handleAddTransaction = (newTransaction: any) => {
    const transactionWithId = {
      ...newTransaction,
      id: `fund-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    setTransactions([...transactions, transactionWithId])
    toast.success('✅ Transaction Added', {
      description: `Fund transaction has been added successfully`,
      duration: 3000
    })
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('🔄 Data Refreshed', {
        description: 'Fund data has been refreshed',
        duration: 2000
      })
    }, 1000)
  }

  const handleExport = () => {
    toast.info('📊 Export Started', {
      description: 'Fund data is being exported to CSV',
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

  const getStatusColor = (status: string) => {
    const variants = {
      approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    }
    return variants[status as keyof typeof variants] || variants.pending
  }

  const getCategoryColor = (category: string) => {
    const variants = {
      contribution: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      expense: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      investment: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      reserve: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      emergency: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    }
    return variants[category as keyof typeof variants] || variants.contribution
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
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
              <Wallet className="h-8 w-8 text-emerald-600" />
              Admin Fund Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Manage society funds, contributions, and financial reserves
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
              Export Report
            </Button>
            <Button
              onClick={() => handleAddTransaction({})}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Add Transaction
            </Button>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Main Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-6 w-6" />
                  Total Fund Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">
                  {formatCurrency(fundSummary.totalBalance)}
                </div>
                <div className="flex items-center gap-2 text-emerald-100">
                  {fundSummary.monthChangePercent > 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  <span>
                    {formatCurrency(fundSummary.monthChange)} ({fundSummary.monthChangePercent}%) this month
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Fund Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Contributions</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(fundSummary.totalContributions)}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Expenses</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(fundSummary.totalExpenses)}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                    <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Investments</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(fundSummary.investments)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <PiggyBank className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Reserve Fund</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {formatCurrency(fundSummary.reserves + fundSummary.emergencyFund)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Fund Allocation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Fund Allocation</CardTitle>
                <CardDescription>Current fund distribution across categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Available Balance</span>
                    <span className="text-sm">{formatCurrency(fundSummary.totalBalance)}</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Investments</span>
                    <span className="text-sm">{formatCurrency(fundSummary.investments)}</span>
                  </div>
                  <Progress value={(fundSummary.investments / fundSummary.totalBalance) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Reserve Fund</span>
                    <span className="text-sm">{formatCurrency(fundSummary.reserves + fundSummary.emergencyFund)}</span>
                  </div>
                  <Progress value={((fundSummary.reserves + fundSummary.emergencyFund) / fundSummary.totalBalance) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Total Transactions</span>
                  <span className="text-sm font-medium">{transactions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Pending Approvals</span>
                  <span className="text-sm font-medium">
                    {transactions.filter(t => t.status === 'pending').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Monthly Growth</span>
                  <span className="text-sm font-medium text-emerald-600">
                    +{fundSummary.monthChangePercent}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter:</span>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Transactions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="credit">Credits</SelectItem>
                  <SelectItem value="debit">Debits</SelectItem>
                  <SelectItem value="contribution">Contributions</SelectItem>
                  <SelectItem value="expense">Expenses</SelectItem>
                  <SelectItem value="investment">Investments</SelectItem>
                  <SelectItem value="reserve">Reserves</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Transactions Table - Using AutoTable */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <AutoTable data={filteredTransactions} title="Admin Fund" />
          </motion.div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Transaction Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">This Month</span>
                    <span className="text-sm font-medium">{formatCurrency(fundSummary.monthChange)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average Transaction</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(fundSummary.totalBalance / transactions.length)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Contributions</span>
                    <span className="text-sm font-medium">{formatCurrency(fundSummary.totalContributions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Expenses</span>
                    <span className="text-sm font-medium">{formatCurrency(fundSummary.totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Investments</span>
                    <span className="text-sm font-medium">{formatCurrency(fundSummary.investments)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Reserves</span>
                    <span className="text-sm font-medium">{formatCurrency(fundSummary.reserves + fundSummary.emergencyFund)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Growth Rate</span>
                    <span className="text-sm font-medium text-emerald-600">+{fundSummary.monthChangePercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Transactions</span>
                    <span className="text-sm font-medium">{transactions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="text-sm font-medium">
                      {Math.round((transactions.filter(t => t.status === 'approved').length / transactions.length) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}