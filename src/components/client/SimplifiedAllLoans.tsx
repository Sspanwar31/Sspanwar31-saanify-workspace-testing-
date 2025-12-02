'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { 
  CreditCard, 
  Users, 
  Calendar, 
  TrendingUp, 
  RefreshCw, 
  Download, 
  BookOpen, 
  Percent,
  Search,
  Filter
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { loansData, Loan } from '@/data/loansData'

// Types
interface SimplifiedLoan {
  id: string
  memberName: string
  loanAmount: number
  remainingBalance: number
  nextEmiDate: string
  interestRate: number
  totalInterestEarned: number
  status: 'active' | 'pending' | 'closed'
  startDate: string
  endDate: string
  description: string
  emi?: number
}

export default function SimplifiedAllLoans() {
  const [loans, setLoans] = useState<SimplifiedLoan[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Fetch loans from API
  const fetchLoans = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/client/loans')
      if (response.ok) {
        const data = await response.json()
        // Transform to simplified format
        const simplifiedLoans = data.loans.map((loan: any): SimplifiedLoan => ({
          id: loan.id,
          memberName: loan.memberName,
          loanAmount: loan.amount,
          remainingBalance: loan.remainingBalance,
          nextEmiDate: loan.endDate || calculateNextDate(loan.startDate, 12),
          interestRate: loan.interest,
          totalInterestEarned: calculateTotalInterest(loan),
          status: loan.remainingBalance > 0 ? 'active' : 'closed',
          startDate: loan.startDate,
          endDate: loan.endDate || calculateEndDate(loan.startDate, 12),
          description: loan.description || 'No description provided',
          emi: loan.emi
        }))
        setLoans(simplifiedLoans)
      } else {
        toast.error('Failed to fetch loans')
      }
    } catch (error) {
      console.error('Error fetching loans:', error)
      toast.error('Failed to fetch loans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLoans()
  }, [])

  // Helper functions
  const calculateNextDate = (startDate: string, tenureMonths: number): string => {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + 1)
    return date.toISOString().split('T')[0]
  }

  const calculateEndDate = (startDate: string, tenureMonths: number): string => {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + tenureMonths)
    return date.toISOString().split('T')[0]
  }

  const calculateTotalInterest = (loan: any): number => {
    if (!loan.emi || !loan.interest) return 0
    const totalPayable = loan.emi * 12 // Assuming 12 months tenure
    return totalPayable - loan.amount
  }

  // Filter loans
  const filteredLoans = useMemo(() => {
    return loans.filter(loan => {
      const matchesSearch = loan.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           loan.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || loan.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [loans, searchTerm, statusFilter])

  // Calculate statistics
  const stats = useMemo(() => ({
    totalLoans: loans.length,
    activeLoans: loans.filter(loan => loan.status === 'active').length,
    pendingLoans: loans.filter(loan => loan.status === 'pending').length,
    closedLoans: loans.filter(loan => loan.status === 'closed').length,
    totalAmount: loans.reduce((sum, loan) => sum + loan.loanAmount, 0),
    outstandingAmount: loans.reduce((sum, loan) => sum + loan.remainingBalance, 0)
  }), [loans])

  const handleRefresh = () => {
    setLoading(true)
    fetchLoans()
    toast.success('🔄 Data Refreshed', {
      description: 'Loan data has been refreshed',
      duration: 2000
    })
  }

  const handleExport = () => {
    toast.info('📊 Export Started', {
      description: 'Loan data is being exported to CSV',
      duration: 3000
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
      closed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
    }
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
            <CreditCard className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLoans}</div>
            <p className="text-xs text-blue-100">All registered loans</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLoans}</div>
            <p className="text-xs text-green-100">Currently active</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingLoans}</div>
            <p className="text-xs text-amber-100">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.closedLoans}</div>
            <p className="text-xs text-purple-100">Completed loans</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search loans by member name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-center">
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
        <Button
          variant="outline"
          onClick={handleExport}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export Loans
        </Button>
      </div>

      {/* Simplified Loans Table */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-blue-600" />
            All Loans Register
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Loans Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm 
                  ? 'Try adjusting your search terms to find loans you\'re looking for.'
                  : 'No loans have been added yet.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Member Name</th>
                    <th className="text-left p-4 font-medium">Loan Amount</th>
                    <th className="text-left p-4 font-medium">Remaining Balance</th>
                    <th className="text-left p-4 font-medium">Next EMI Date</th>
                    <th className="text-left p-4 font-medium">Interest</th>
                    <th className="text-left p-4 font-medium">Total Interest Earned</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Start Date</th>
                    <th className="text-left p-4 font-medium">End Date</th>
                    <th className="text-left p-4 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map((loan, index) => (
                    <tr key={loan.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="p-4 font-medium">{loan.memberName}</td>
                      <td className="p-4 font-semibold text-blue-600 dark:text-blue-400">
                        {formatCurrency(loan.loanAmount)}
                      </td>
                      <td className="p-4 font-semibold text-orange-600 dark:text-orange-400">
                        {formatCurrency(loan.remainingBalance)}
                      </td>
                      <td className="p-4">{loan.nextEmiDate}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Percent className="h-4 w-4 text-muted-foreground" />
                          <span>{loan.interestRate}%</span>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(loan.totalInterestEarned)}
                      </td>
                      <td className="p-4">{getStatusBadge(loan.status)}</td>
                      <td className="p-4">{formatDate(loan.startDate)}</td>
                      <td className="p-4">{formatDate(loan.endDate)}</td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {loan.description || 'No description provided'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}