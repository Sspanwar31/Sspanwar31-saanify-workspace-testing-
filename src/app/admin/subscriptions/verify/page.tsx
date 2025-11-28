'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, CheckCircle, XCircle, FileText, DollarSign, Bell, Download, RefreshCw, Search, Filter } from 'lucide-react'
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

  const handleRefresh = () => {
    fetchPaymentProofs()
    toast.success('Data refreshed successfully')
  }

  const handleViewScreenshot = (url: string) => {
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Payment Approval Dashboard
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Review and approve payment requests from clients
          </p>
          
          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold">Total Revenue</h3>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-gray-900">{formatAmount(stats.totalRevenue)}</div>
              <p className="text-sm text-gray-600">This month</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold">Pending</h3>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.pendingCount}</div>
              <p className="text-sm text-gray-600">Awaiting approval</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold">Approved</h3>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.approvedCount}</div>
              <p className="text-sm text-gray-600">Approved payments</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold">Rejected</h3>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.rejectedCount}</div>
              <p className="text-sm text-gray-600">Rejected payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, plan, or transaction ID..."
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

        {/* Payment Proofs Table */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Payment Proofs ({filteredProofs.length})</h3>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading payment proofs...</p>
              </div>
            ) : filteredProofs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No payment proofs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProofs.map((proof) => (
                      <TableRow key={proof.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{proof.user.name}</div>
                            <div className="text-sm text-gray-500">{proof.user.email}</div>
                            {proof.user.societyName && proof.user.societyName !== 'N/A' && (
                              <div className="text-xs text-gray-400">{proof.user.societyName}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {proof.plan.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatAmount(proof.amount)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {proof.txnId}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(proof.status)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
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
                            className="w-full"
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Details Dialog */}
        {selectedProof && (
          <Dialog open={true} onOpenChange={() => setSelectedProof(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] w-full overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-semibold">Payment Proof Details</h3>
                  {getStatusBadge(selectedProof.status)}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Client Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Client Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm text-gray-600">Name</Label>
                        <p className="font-medium text-gray-900">{selectedProof.user.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Email</Label>
                        <p className="font-medium text-gray-900">{selectedProof.user.email}</p>
                      </div>
                      {selectedProof.user.societyName && selectedProof.user.societyName !== 'N/A' && (
                        <div>
                          <Label className="text-sm text-gray-600">Society Name</Label>
                          <p className="font-medium text-gray-900">{selectedProof.user.societyName}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Payment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm text-gray-600">Plan</Label>
                        <p className="font-medium text-gray-900">{selectedProof.plan.toUpperCase()}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Amount</Label>
                        <p className="font-medium text-gray-900">{formatAmount(selectedProof.amount)}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Transaction ID</Label>
                        <p className="font-medium text-gray-900 font-mono text-sm">{selectedProof.txnId}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Submitted On</Label>
                        <p className="font-medium text-gray-900">{formatDate(selectedProof.createdAt)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Screenshot Preview */}
                {selectedProof.screenshotUrl && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        Payment Screenshot
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewScreenshot(selectedProof.screenshotUrl!)}
                          className="ml-auto"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Full Size
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={selectedProof.screenshotUrl}
                          alt="Payment Screenshot"
                          className="w-full h-auto max-h-96 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-screenshot.png'
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Previous Notes */}
                {(selectedProof.adminNotes || selectedProof.rejectionReason) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Previous Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedProof.adminNotes && (
                        <div>
                          <Label className="text-sm text-gray-600">Admin Notes</Label>
                          <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded">{selectedProof.adminNotes}</p>
                        </div>
                      )}
                      {selectedProof.rejectionReason && (
                        <div>
                          <Label className="text-sm text-gray-600">Rejection Reason</Label>
                          <p className="text-sm text-red-800 bg-red-50 p-3 rounded">{selectedProof.rejectionReason}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Admin Actions */}
                {selectedProof.status === 'pending' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Admin Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Admin Notes *</Label>
                        <Textarea
                          placeholder="Add detailed notes about this payment verification..."
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label>Rejection Reason (if rejecting)</Label>
                        <Textarea
                          placeholder="Provide specific reason for rejection..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedProof(null)}
                  disabled={isProcessing}
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
                      className="flex items-center gap-2"
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
      </div>
    </div>
  )
}