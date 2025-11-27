'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  Calendar, 
  User, 
  Search,
  Filter,
  RefreshCw,
  Eye,
  Download,
  Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface PaymentProof {
  id: string
  userId: string
  amount: number
  plan: string
  txnId: string
  screenshotUrl?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface Stats {
  total: number
  pending: number
  approved: number
  rejected: number
  totalAmount: number
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentProof[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedPayment, setSelectedPayment] = useState<PaymentProof | null>(null)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/admin/payments')
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
        setStats(data.stats || stats)
      } else {
        throw new Error('Failed to fetch payments')
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to load payments data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprovePayment = async (paymentId: string) => {
    setIsProcessing(paymentId)
    try {
      const response = await fetch(`/api/admin/payments/approve/${paymentId}`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Payment approved successfully', {
          description: 'User subscription has been activated for 30 days'
        })
        fetchPayments() // Refresh data
      } else {
        throw new Error('Failed to approve payment')
      }
    } catch (error) {
      console.error('Error approving payment:', error)
      toast.error('Failed to approve payment')
    } finally {
      setIsProcessing(null)
    }
  }

  const handleRejectPayment = async (paymentId: string) => {
    setIsProcessing(paymentId)
    try {
      const response = await fetch(`/api/admin/payments/reject/${paymentId}`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Payment rejected', {
          description: 'User has been notified about the rejection'
        })
        fetchPayments() // Refresh data
      } else {
        throw new Error('Failed to reject payment')
      }
    } catch (error) {
      console.error('Error rejecting payment:', error)
      toast.error('Failed to reject payment')
    } finally {
      setIsProcessing(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'approved':
        return <CheckCircle className="w-4 h-4" />
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        payment.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        payment.txnId.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-gray-600">Loading payments data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-slate-900">Saanify Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={fetchPayments}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Approvals</h1>
            <p className="text-slate-600">Review and approve user payment submissions</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Payments</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Amount</p>
                    <p className="text-2xl font-bold text-slate-900">₹{stats.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                    <span className="text-white text-xs font-bold">₹</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, email, or transaction ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments List */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Submissions</CardTitle>
              <CardDescription>
                {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPayments.length > 0 ? (
                <div className="space-y-4">
                  {filteredPayments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={payment.user.email} />
                            <AvatarFallback>
                              {payment.user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-slate-900">{payment.user.name}</p>
                            <p className="text-sm text-slate-600">{payment.user.email}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <div className="flex items-center space-x-1">
                                <CreditCard className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-slate-600">{payment.plan} Plan</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-slate-600">
                                  {new Date(payment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg font-bold text-slate-900">₹{payment.amount}</span>
                            <Badge variant="outline" className={getStatusColor(payment.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(payment.status)}
                                <span>{payment.status.toUpperCase()}</span>
                              </div>
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">Txn ID: {payment.txnId}</p>
                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedPayment(payment)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Payment Details</DialogTitle>
                                  <DialogDescription>
                                    Review payment proof and user information
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedPayment && (
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm font-medium text-slate-600">User Name</p>
                                        <p className="font-semibold">{selectedPayment.user.name}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-slate-600">Email</p>
                                        <p className="font-semibold">{selectedPayment.user.email}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-slate-600">Plan</p>
                                        <p className="font-semibold">{selectedPayment.plan}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-slate-600">Amount</p>
                                        <p className="font-semibold">₹{selectedPayment.amount}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-slate-600">Transaction ID</p>
                                        <p className="font-semibold">{selectedPayment.txnId}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-slate-600">Status</p>
                                        <Badge variant="outline" className={getStatusColor(selectedPayment.status)}>
                                          {selectedPayment.status.toUpperCase()}
                                        </Badge>
                                      </div>
                                    </div>
                                    {selectedPayment.screenshotUrl && (
                                      <div>
                                        <p className="text-sm font-medium text-slate-600 mb-2">Payment Screenshot</p>
                                        <div className="border rounded-lg overflow-hidden">
                                          <img 
                                            src={`data:image/jpeg;base64,${selectedPayment.screenshotUrl}`}
                                            alt="Payment screenshot"
                                            className="w-full h-auto max-h-96 object-contain"
                                          />
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex justify-end space-x-2">
                                      <Button 
                                        variant="destructive"
                                        onClick={() => handleRejectPayment(selectedPayment.id)}
                                        disabled={isProcessing === selectedPayment.id}
                                      >
                                        {isProcessing === selectedPayment.id ? (
                                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                          <XCircle className="w-4 h-4 mr-2" />
                                        )}
                                        Reject
                                      </Button>
                                      <Button 
                                        onClick={() => handleApprovePayment(selectedPayment.id)}
                                        disabled={isProcessing === selectedPayment.id}
                                      >
                                        {isProcessing === selectedPayment.id ? (
                                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                        )}
                                        Approve
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            {payment.status === 'pending' && (
                              <>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleRejectPayment(payment.id)}
                                  disabled={isProcessing === payment.id}
                                >
                                  {isProcessing === payment.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => handleApprovePayment(payment.id)}
                                  disabled={isProcessing === payment.id}
                                >
                                  {isProcessing === payment.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg text-gray-600 mb-2">No payments found</p>
                  <p className="text-sm text-gray-500">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'No payment submissions yet'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}