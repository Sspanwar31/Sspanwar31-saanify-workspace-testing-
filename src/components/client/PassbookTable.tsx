'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  FileText,
  BookOpen
} from 'lucide-react'

interface Transaction {
  id: string
  member: string
  date: string
  description: string
  depositAmount: number
  loanInstallment: number
  interest: number
  fine: number
  mode: 'Cash' | 'Online' | 'Cheque'
  balance: number
}

interface PassbookTableProps {
  transactions: Transaction[]
  onEdit: (transaction: Transaction) => void
  onDelete: (transactionId: string) => void
  formatCurrency: (amount: number) => string
}

const PassbookTable = ({ 
  transactions, 
  onEdit, 
  onDelete, 
  formatCurrency 
}: PassbookTableProps) => {
  const [sortField, setSortField] = useState<keyof Transaction>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedTransactions = [...transactions].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    let comparison = 0
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue)
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue
    }
    
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getModeBadge = (mode: string) => {
    const variants = {
      Cash: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      Online: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      Cheque: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
    }
    return (
      <Badge className={variants[mode as keyof typeof variants] || variants.Cash}>
        {mode}
      </Badge>
    )
  }

  const getBalanceChange = (balance: number) => {
    if (balance > 0) {
      return (
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="h-3 w-3" />
          {formatCurrency(balance)}
        </span>
      )
    } else if (balance < 0) {
      return (
        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <TrendingDown className="h-3 w-3" />
          {formatCurrency(balance)}
        </span>
      )
    }
    return (
      <span className="text-slate-600 dark:text-slate-400">
        {formatCurrency(balance)}
      </span>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 dark:border-slate-700">
                <TableHead 
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-2">
                    <span>Date</span>
                    {sortField === 'date' && (
                      <span className="text-xs text-slate-400">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('member')}
                >
                  <div className="flex items-center gap-2">
                    <span>Member</span>
                    {sortField === 'member' && (
                      <span className="text-xs text-slate-400">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="min-w-[120px]">Deposit</TableHead>
                <TableHead className="min-w-[120px]">Loan Installment</TableHead>
                <TableHead className="min-w-[100px]">Interest</TableHead>
                <TableHead className="min-w-[80px]">Fine</TableHead>
                <TableHead className="min-w-[100px]">Mode</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('balance')}
                >
                  <div className="flex items-center gap-2">
                    <span>Balance</span>
                    {sortField === 'balance' && (
                      <span className="text-xs text-slate-400">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.map((transaction, index) => (
                <motion.tr
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-900 dark:text-white font-medium">
                        {formatDate(transaction.date)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {transaction.member}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {transaction.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(transaction.depositAmount)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-blue-600 dark:text-blue-400">
                      {formatCurrency(transaction.loanInstallment)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-purple-600 dark:text-purple-400">
                      {formatCurrency(transaction.interest)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-red-600 dark:text-red-400">
                      {formatCurrency(transaction.fine)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getModeBadge(transaction.mode)}
                  </TableCell>
                  <TableCell>
                    {getBalanceChange(transaction.balance)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onEdit(transaction)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(transaction.id)}
                          className="flex items-center gap-2 text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {transactions.length === 0 && (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                <BookOpen className="h-8 w-8 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No transactions found
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Try adjusting your filters or add a new transaction to get started.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PassbookTable