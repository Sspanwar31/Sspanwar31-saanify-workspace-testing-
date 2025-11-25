'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus,
  AlertCircle,
  CheckCircle,
  Wallet,
  PiggyBank,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
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
  const [transactions, setTransactions] = useState<FundTransaction[]>([])
  const [fundSummary, setFundSummary] = useState<FundSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchFundData()
  }, [])

  const fetchFundData = async () => {
    try {
      setLoading(true)
      
      // Mock fund summary
      const mockSummary: FundSummary = {
        totalBalance: 2500000,
        totalContributions: 3200000,
        totalExpenses: 450000,
        investments: 800000,
        reserves: 500000,
        emergencyFund: 250000,
        monthChange: 150000,
        monthChangePercent: 6.5
      }

      // Mock transactions
      const mockTransactions: FundTransaction[] = [
        {
          id: '1',
          type: 'credit',
          category: 'contribution',
          amount: 50000,
          description: 'Monthly member contributions',
          date: '2024-01-15',
          reference: 'MC-2024-01',
          approvedBy: 'Admin',
          status: 'approved'
        },
        {
          id: '2',
          type: 'debit',
          category: 'expense',
          amount: 15000,
          description: 'Office rent payment',
          date: '2024-01-10',
          reference: 'EXP-2024-01',
          approvedBy: 'Admin',
          status: 'approved'
        },
        {
          id: '3',
          type: 'credit',
          category: 'investment',
          amount: 100000,
          description: 'Fixed deposit investment',
          date: '2024-01-08',
          reference: 'INV-2024-01',
          approvedBy: 'Admin',
          status: 'approved'
        },
        {
          id: '4',
          type: 'debit',
          category: 'emergency',
          amount: 25000,
          description: 'Emergency maintenance fund',
          date: '2024-01-05',
          reference: 'EMR-2024-01',
          status: 'pending'
        },
        {
          id: '5',
          type: 'credit',
          category: 'reserve',
          amount: 75000,
          description: 'Reserve fund allocation',
          date: '2024-01-03',
          reference: 'RES-2024-01',
          approvedBy: 'Admin',
          status: 'approved'
        }
      ]

      setFundSummary(mockSummary)
      setTransactions(mockTransactions)
    } catch (error) {
      toast.error('Failed to fetch fund data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'contribution': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'expense': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'investment': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'reserve': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'emergency': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = filter === 'all' || transaction.type === filter || transaction.category === filter
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!fundSummary) {
    return <div>No fund data available</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Fund Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage society funds and transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Transaction</DialogTitle>
                <DialogDescription>
                  Record a new fund transaction.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="debit">Debit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contribution">Contribution</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="reserve">Reserve</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Amount
                  </Label>
                  <Input id="amount" type="number" placeholder="Enter amount" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea id="description" placeholder="Enter description" className="col-span-3" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast.success('Transaction added successfully')
                  setShowAddDialog(false)
                }}>
                  Add Transaction
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Main Balance Card */}
          <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-6 w-6" />
                Total Fund Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">₹{fundSummary.totalBalance.toLocaleString()}</div>
              <div className="flex items-center gap-2 text-emerald-100">
                {fundSummary.monthChangePercent > 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span>
                  ₹{fundSummary.monthChange.toLocaleString()} ({fundSummary.monthChangePercent}%) this month
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Fund Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₹{fundSummary.totalContributions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  All time contributions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">₹{fundSummary.totalExpenses.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  All time expenses
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Investments</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">₹{fundSummary.investments.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Current investments
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reserve Fund</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">₹{fundSummary.reserves.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Reserve + Emergency
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Fund Allocation */}
          <Card>
            <CardHeader>
              <CardTitle>Fund Allocation</CardTitle>
              <CardDescription>
                Current fund distribution across categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Available Balance</span>
                  <span className="text-sm">₹{(fundSummary.totalBalance - fundSummary.investments - fundSummary.reserves - fundSummary.emergencyFund).toLocaleString()}</span>
                </div>
                <Progress value={(fundSummary.totalBalance - fundSummary.investments - fundSummary.reserves - fundSummary.emergencyFund) / fundSummary.totalBalance * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Investments</span>
                  <span className="text-sm">₹{fundSummary.investments.toLocaleString()}</span>
                </div>
                <Progress value={fundSummary.investments / fundSummary.totalBalance * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Reserve Fund</span>
                  <span className="text-sm">₹{fundSummary.reserves.toLocaleString()}</span>
                </div>
                <Progress value={fundSummary.reserves / fundSummary.totalBalance * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Emergency Fund</span>
                  <span className="text-sm">₹{fundSummary.emergencyFund.toLocaleString()}</span>
                </div>
                <Progress value={fundSummary.emergencyFund / fundSummary.totalBalance * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
                <SelectItem value="contribution">Contributions</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
                <SelectItem value="investment">Investments</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Latest fund transactions and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Amount</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <motion.tr
                        key={transaction.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{transaction.date}</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{transaction.description}</div>
                            {transaction.reference && (
                              <div className="text-sm text-gray-500">{transaction.reference}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge className={getCategoryColor(transaction.category)}>
                            {transaction.category}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className={`font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {transaction.status === 'pending' && (
                              <Button 
                                size="sm" 
                                onClick={() => toast.success('Transaction approved')}
                              >
                                Approve
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trend</CardTitle>
                <CardDescription>
                  Fund balance over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                    <p>Chart visualization would go here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>
                  Fund allocation by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <PiggyBank className="w-12 h-12 mx-auto mb-2" />
                    <p>Pie chart would go here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}