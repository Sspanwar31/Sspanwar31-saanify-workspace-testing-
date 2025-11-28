'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, CheckCircle, XCircle, FileText, DollarSign, Bell, Download, RefreshCw, Search, Filter, ArrowLeft, Check, X, CreditCard, Users, TrendingUp, AlertTriangle, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { makeAuthenticatedRequest } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { NotificationService } from '@/lib/notifications'

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
  adminNotes?: string
  rejectionReason?: string
  user: {
    id: string
    name: string
    email: string
    societyName?: string
  }
}

interface Stats {
  totalRevenue: number
  pendingCount: number
  approvedCount: number
  rejectedCount: number
}

export default function AdminPaymentsPage() {
  const router = useRouter()
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>([])
  const [filteredProofs, setFilteredProofs] = useState<PaymentProof[]>([])
  const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0
  })

  useEffect(() => {
    fetchPaymentProofs()
  }, [])

  useEffect(() => {
    // Filter proofs based on search and status
    let filtered = paymentProofs

    if (statusFilter !== 'all') {
      filtered = filtered.filter(proof => proof.status === statusFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(proof => 
        proof.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proof.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proof.plan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proof.txnId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredProofs(filtered)
  }, [paymentProofs, searchTerm, statusFilter])

  const fetchPaymentProofs = async () => {
    setIsLoading(true)
    try {
      const response = await makeAuthenticatedRequest('/api/admin/subscriptions/payment-proofs')
      if (response.ok) {
        const data = await response.json()
        const proofs = data.paymentProofs || []
        
        // Transform data to match UI expectations
        const transformedProofs = proofs.map((proof: any) => ({
          ...proof,
          user: {
            ...proof.user,
            societyName: proof.user.societyName || 'N/A'
          }
        }))
        
        setPaymentProofs(transformedProofs)
        
        // Calculate stats
        const approved = proofs.filter((p: any) => p.status === 'approved')
        const totalRevenue = approved.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
        
        setStats({
          totalRevenue,
          pendingCount: proofs.filter((p: any) => p.status === 'pending').length,
          approvedCount: approved.length,
          rejectedCount: proofs.filter((p: any) => p.status === 'rejected').length
        })
      } else {
        toast.error('Failed to load payment proofs')
      }
    } catch (error) {
      console.error('Failed to fetch payment proofs:', error)
      toast.error('Failed to load payment proofs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (proof: PaymentProof) => {
    if (!adminNotes.trim()) {
      toast.error('Please add admin notes before approving')
      return
    }

    setIsProcessing(true)
    
    try {
      const response = await makeAuthenticatedRequest(`/api/admin/subscriptions/approve-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: proof.userId,
          plan: proof.plan.toLowerCase(),
          duration: 1, // Default 1 month duration
          adminNotes: adminNotes,
          proofId: proof.id
        })
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        // Update local state
        setPaymentProofs(prev => 
          prev.map(p => 
            p.id === proof.id 
              ? { ...p, status: 'approved', adminNotes, updatedAt: new Date().toISOString() }
              : p
          )
        )

        setSelectedProof(null)
        setAdminNotes('')
        
        // Send notification to user
        try {
          await NotificationService.sendPaymentApprovalNotification(
            proof.user.email,
            proof.user.name,
            proof.plan,
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          )
        } catch (notifError) {
          console.error('Failed to send approval notification:', notifError)
        }
        
        toast.success('Payment approved successfully! User has been activated.')
      } else {
        toast.error(result.error || 'Failed to approve payment')
      }
    } catch (error) {
      console.error('Failed to approve payment:', error)
      toast.error('Failed to approve payment')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (proof: PaymentProof) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    setIsProcessing(true)
    
    try {
      const response = await makeAuthenticatedRequest(`/api/admin/subscriptions/reject-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: proof.userId,
          reason: rejectionReason,
          adminNotes: adminNotes,
          proofId: proof.id
        })
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        // Update local state
        setPaymentProofs(prev => 
          prev.map(p => 
            p.id === proof.id 
              ? { ...p, status: 'rejected', rejectionReason, adminNotes, updatedAt: new Date().toISOString() }
              : p
          )
        )

        setSelectedProof(null)
        setAdminNotes('')
        setRejectionReason('')
        
        // Send notification to user
        try {
          await NotificationService.sendPaymentRejectionNotification(
            proof.user.email,
            proof.user.name,
            rejectionReason
          )
        } catch (notifError) {
          console.error('Failed to send rejection notification:', notifError)
        }
        
        toast.success('Payment rejected successfully!')
      } else {
        toast.error(result.error || 'Failed to reject payment')
      }
    } catch (error) {
      console.error('Failed to reject payment:', error)
      toast.error('Failed to reject payment')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Rejected</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleSendNotifications = async () => {
    try {
      // Send notifications to all pending payment users
      const pendingUsers = paymentProofs.filter(p => p.status === 'pending')
      
      for (const proof of pendingUsers) {
        await NotificationService.createNotification({
          userId: proof.userId,
          title: 'Payment Under Review',
          message: `Your payment of ${formatAmount(proof.amount)} for ${proof.plan} plan is currently under review by our admin team.`,
          type: 'info',
          data: {
            proofId: proof.id,
            amount: proof.amount,
            plan: proof.plan,
            transactionId: proof.txnId
          }
        })
      }
      
      toast.success(`Notifications sent to ${pendingUsers.length} pending payment users`)
    } catch (error) {
      console.error('Error sending notifications:', error)
      toast.error('Failed to send notifications')
    }
  }

  const handleRefresh = () => {
    fetchPaymentProofs()
    toast.success('Data refreshed successfully')
  }

  const handleViewScreenshot = (url: string) => {
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header with Back Button */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative backdrop-blur-xl bg-white/5 border-b border-white/10 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  onClick={() => window.history.back()}
                  className="text-white hover:bg-white/10 transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Admin
                </Button>
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Payment Approval
                </h1>
                <p className="text-sm text-cyan-400">Review and verify client payments</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  onClick={() => window.location.href = '/admin'}
                  className="text-white hover:bg-white/10 transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 00-1-1H6a1 1 0 00-1 1H3a1 1 0 00-1-1V6z" />
                  </svg>
                  Admin Dashboard
                </Button>
              </motion.div>
              <Badge className="bg-gradient-to-r from-cyan-500 to-teal-600 text-white border-0">
                Payment Verification
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
          >
            <Card className="backdrop-blur-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Total Revenue</h3>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-white">{formatAmount(stats.totalRevenue)}</div>
                <p className="text-sm text-white/60">This month</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
          >
            <Card className="backdrop-blur-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Pending</h3>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-yellow-400">{stats.pendingCount}</div>
                <p className="text-sm text-white/60">Awaiting approval</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
          >
            <Card className="backdrop-blur-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Approved</h3>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-green-400">{stats.approvedCount}</div>
                <p className="text-sm text-white/60">Approved payments</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
          >
            <Card className="backdrop-blur-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Rejected</h3>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-red-400">{stats.rejectedCount}</div>
                <p className="text-sm text-white/60">Rejected payments</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                    <Input
                      placeholder="Search by name, email, plan, or transaction ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/40"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10">
                      <SelectItem value="all" className="text-white hover:bg-white/10">All Status</SelectItem>
                      <SelectItem value="pending" className="text-white hover:bg-white/10">Pending</SelectItem>
                      <SelectItem value="approved" className="text-white hover:bg-white/10">Approved</SelectItem>
                      <SelectItem value="rejected" className="text-white hover:bg-white/10">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Proofs Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Payment Proofs ({filteredProofs.length})</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                  <p className="text-white/60">Loading payment proofs...</p>
                </div>
              ) : filteredProofs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">No payment proofs found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-white/60">Client</TableHead>
                        <TableHead className="text-white/60">Plan</TableHead>
                        <TableHead className="text-white/60">Amount</TableHead>
                        <TableHead className="text-white/60">Transaction ID</TableHead>
                        <TableHead className="text-white/60">Status</TableHead>
                        <TableHead className="text-white/60">Date</TableHead>
                        <TableHead className="text-white/60">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProofs.map((proof, index) => (
                        <motion.tr 
                          key={proof.id} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border-white/5 hover:bg-white/10 transition-colors"
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-white">{proof.user.name}</div>
                              <div className="text-sm text-white/60">{proof.user.email}</div>
                              {proof.user.societyName && proof.user.societyName !== 'N/A' && (
                                <div className="text-xs text-white/40">{proof.user.societyName}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-medium border-cyan-500/30 text-cyan-400">
                              {proof.plan.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-white">
                            {formatAmount(proof.amount)}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-white/80">
                            {proof.txnId}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(proof.status)}
                          </TableCell>
                          <TableCell className="text-sm text-white/60">
                            {formatDate(proof.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedProof(proof)
                                setAdminNotes(proof.adminNotes || '')
                                setRejectionReason(proof.rejectionReason || '')
                              }}
                              className="w-full text-white hover:bg-white/10"
                            >
                              <Eye className="w-4 h-4 text-cyan-400" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Details Dialog */}
        {selectedProof && (
          <Dialog open={true} onOpenChange={() => setSelectedProof(null)}>
            <DialogContent className="max-w-6xl max-h-[95vh] w-full overflow-y-auto bg-slate-900 border-white/10">
              <DialogHeader className="border-b border-white/10">
                <DialogTitle className="flex items-center gap-3 text-white">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">Payment Proof Details</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(selectedProof.status)}
                      <Badge className="bg-white/10 text-white/80 text-xs">
                        ID: {selectedProof.id.slice(-8)}
                      </Badge>
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 p-6">
                {/* Client Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-base text-white flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 0 8 8M12 20l4 4m0 0l-4-4m4 4H8a2 2 0 002-2v8a2 2 0 002 2h8a2 2 0 002 2v-8a2 2 0 00-2-2H8a2 2 0 00-2-2V6a2 2 0 00-2-2z" />
                            </svg>
                          </div>
                          Client Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-white/60">Name</Label>
                            <p className="font-medium text-white">{selectedProof.user.name}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-white/60">Email</Label>
                            <p className="font-medium text-white">{selectedProof.user.email}</p>
                          </div>
                        </div>
                        {selectedProof.user.societyName && selectedProof.user.societyName !== 'N/A' && (
                          <div>
                            <Label className="text-sm text-white/60">Society Name</Label>
                            <p className="font-medium text-white">{selectedProof.user.societyName}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-base text-white flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-3 h-3 text-white" />
                          </div>
                          Payment Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-white/60">Plan</Label>
                            <p className="font-medium text-white">{selectedProof.plan.toUpperCase()}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-white/60">Amount</Label>
                            <p className="font-medium text-white">{formatAmount(selectedProof.amount)}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-white/60">Transaction ID</Label>
                            <p className="font-medium text-white font-mono text-sm">{selectedProof.txnId}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-white/60">Submitted On</Label>
                            <p className="font-medium text-white">{formatDate(selectedProof.createdAt)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Screenshot Preview */}
                {selectedProof.screenshotUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-base text-white flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                            <Eye className="w-3 h-3 text-white" />
                          </div>
                          Payment Screenshot
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewScreenshot(selectedProof.screenshotUrl!)}
                            className="ml-auto border-white/20 text-white hover:bg-white/10"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Full Size
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-xl overflow-hidden bg-white/10">
                          <img
                            src={selectedProof.screenshotUrl}
                            alt="Payment Screenshot"
                            className="w-full h-auto max-h-96 object-contain rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-screenshot.png'
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Previous Notes */}
                {(selectedProof.adminNotes || selectedProof.rejectionReason) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-base text-white flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                            <FileText className="w-3 h-3 text-white" />
                          </div>
                          Previous Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {selectedProof.adminNotes && (
                          <div>
                            <Label className="text-sm text-white/60">Admin Notes</Label>
                            <p className="text-sm text-white/80 bg-green-500/10 p-4 rounded-lg border border-green-500/20">{selectedProof.adminNotes}</p>
                          </div>
                        )}
                        {selectedProof.rejectionReason && (
                          <div>
                            <Label className="text-sm text-white/60">Rejection Reason</Label>
                            <p className="text-sm text-white/80 bg-red-500/10 p-4 rounded-lg border border-red-500/20">{selectedProof.rejectionReason}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Admin Actions */}
                {selectedProof.status === 'pending' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-base text-white flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Settings className="w-3 h-3 text-white" />
                          </div>
                          Admin Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <Label className="text-sm text-white/60">Admin Notes *</Label>
                          <Textarea
                            placeholder="Add detailed notes about this payment verification..."
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            rows={3}
                            className="mt-1 bg-white/10 border-white/20 text-white placeholder-white/40"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm text-white/60">Rejection Reason (if rejecting)</Label>
                          <Textarea
                            placeholder="Provide specific reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={2}
                            className="mt-1 bg-white/10 border-white/20 text-white placeholder-white/40"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>

              <DialogFooter className="flex gap-3 pt-4 border-t border-white/10 bg-slate-800">
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin')}
                  disabled={isProcessing}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Admin
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedProof(null)}
                  disabled={isProcessing}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Close
                </Button>
                
                {selectedProof.status === 'pending' && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(selectedProof)}
                      disabled={isProcessing || !adminNotes.trim() || !rejectionReason.trim()}
                      className="flex items-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Reject Payment
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => handleApprove(selectedProof)}
                      disabled={isProcessing || !adminNotes.trim()}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Approve & Activate
                        </>
                      )}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        
        {/* Success Notification Toast */}
        {isProcessing === false && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Payment processed successfully!</span>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}