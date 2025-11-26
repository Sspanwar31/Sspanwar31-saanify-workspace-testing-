'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Eye, CheckCircle, XCircle, Calendar, User, Mail, IndianRupee, Clock, AlertCircle, Download, RefreshCw, Shield, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { makeAuthenticatedRequest } from '@/lib/auth'
import Image from 'next/image'

interface PaymentProof {
  id: string
  userId: string
  amount: number
  plan: string
  txnId: string
  screenshotUrl: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  user: {
    name: string
    email: string
  }
}

export default function AdminSubscriptionVerifyPage() {
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>([])
  const [filteredProofs, setFilteredProofs] = useState<PaymentProof[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchPaymentProofs()
  }, [])

  useEffect(() => {
    filterPaymentProofs()
  }, [paymentProofs, statusFilter, searchQuery])

  const fetchPaymentProofs = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/subscriptions/payment-proofs')
      const data = await response.json()

      if (response.ok) {
        setPaymentProofs(data.paymentProofs || [])
      } else {
        toast.error('❌ Failed to load payment proofs', {
          description: data.error || 'Please try again',
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Error fetching payment proofs:', error)
      toast.error('❌ Network Error', {
        description: 'Failed to load payment proofs',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterPaymentProofs = () => {
    let filtered = [...paymentProofs]

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(proof => proof.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(proof =>
        proof.user.name.toLowerCase().includes(query) ||
        proof.user.email.toLowerCase().includes(query) ||
        proof.txnId.toLowerCase().includes(query) ||
        proof.plan.toLowerCase().includes(query)
      )
    }

    setFilteredProofs(filtered)
  }

  const handleApprove = async (proofId: string) => {
    setIsProcessing(true)
    try {
      const response = await makeAuthenticatedRequest(`/api/admin/subscriptions/approve-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proofId }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('✅ Payment Approved', {
          description: 'Payment has been approved and subscription activated',
          duration: 3000,
        })
        
        // Update the local state
        setPaymentProofs(prev =>
          prev.map(proof =>
            proof.id === proofId
              ? { ...proof, status: 'approved' }
              : proof
          )
        )
        
        setSelectedProof(null)
      } else {
        toast.error('❌ Approval Failed', {
          description: data.error || 'Failed to approve payment',
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Error approving payment:', error)
      toast.error('❌ Network Error', {
        description: 'Failed to approve payment',
        duration: 3000,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (proofId: string) => {
    setIsProcessing(true)
    try {
      const response = await makeAuthenticatedRequest(`/api/admin/subscriptions/reject-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proofId }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('❌ Payment Rejected', {
          description: 'Payment has been rejected',
          duration: 3000,
        })
        
        // Update the local state
        setPaymentProofs(prev =>
          prev.map(proof =>
            proof.id === proofId
              ? { ...proof, status: 'rejected' }
              : proof
          )
        )
        
        setSelectedProof(null)
      } else {
        toast.error('❌ Rejection Failed', {
          description: data.error || 'Failed to reject payment',
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Error rejecting payment:', error)
      toast.error('❌ Network Error', {
        description: 'Failed to reject payment',
        duration: 3000,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'approved':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'rejected':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-200">Loading payment proofs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button 
                variant="outline" 
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Payment Verification</h1>
              <p className="text-purple-200">Review and verify payment proofs from users</p>
            </div>
          </div>
          
          <Button
            onClick={fetchPaymentProofs}
            variant="outline"
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-white/10 backdrop-blur-xl border-0 shadow-2xl mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-purple-300" />
                  <Input
                    placeholder="Search by name, email, transaction ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder-purple-300"
                  />
                </div>
              </div>
              
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Proofs List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredProofs.length === 0 ? (
              <Card className="bg-white/10 backdrop-blur-xl border-0 shadow-2xl">
                <CardContent className="p-8 text-center">
                  <Shield className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Payment Proofs Found</h3>
                  <p className="text-purple-200">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'No payment proofs have been submitted yet'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredProofs.map((proof) => (
                <motion.div
                  key={proof.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    className={`bg-white/10 backdrop-blur-xl border-0 shadow-2xl cursor-pointer transition-all duration-300 hover:bg-white/15 ${
                      selectedProof?.id === proof.id ? 'ring-2 ring-purple-500' : ''
                    }`}
                    onClick={() => setSelectedProof(proof)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-purple-300" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{proof.user.name}</h3>
                            <p className="text-sm text-purple-200">{proof.user.email}</p>
                          </div>
                        </div>
                        
                        <Badge className={`flex items-center gap-1 ${getStatusColor(proof.status)}`}>
                          {getStatusIcon(proof.status)}
                          {proof.status.charAt(0).toUpperCase() + proof.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-purple-300">Plan</p>
                          <p className="text-white font-medium capitalize">{proof.plan}</p>
                        </div>
                        <div>
                          <p className="text-sm text-purple-300">Amount</p>
                          <p className="text-white font-medium flex items-center gap-1">
                            <IndianRupee className="w-4 h-4" />
                            {proof.amount}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-purple-300">Transaction ID</p>
                          <p className="text-white font-medium text-sm">{proof.txnId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-purple-300">Submitted</p>
                          <p className="text-white font-medium text-sm">
                            {new Date(proof.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-purple-300" />
                        <span className="text-sm text-purple-200">Click to view payment proof</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Payment Proof Detail */}
          <div className="lg:col-span-1">
            {selectedProof ? (
              <Card className="bg-white/10 backdrop-blur-xl border-0 shadow-2xl sticky top-4">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white">Payment Proof</CardTitle>
                  <CardDescription className="text-purple-200">
                    Review the payment screenshot and details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* User Info */}
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">User Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-300" />
                        <span className="text-purple-200">{selectedProof.user.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-purple-300" />
                        <span className="text-purple-200 text-sm">{selectedProof.user.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Payment Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-purple-200">Plan:</span>
                        <span className="text-white capitalize">{selectedProof.plan}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-200">Amount:</span>
                        <span className="text-white flex items-center gap-1">
                          <IndianRupee className="w-4 h-4" />
                          {selectedProof.amount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-200">Txn ID:</span>
                        <span className="text-white text-sm">{selectedProof.txnId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Screenshot */}
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Payment Screenshot</h4>
                    <div className="relative rounded-lg overflow-hidden bg-white/5">
                      <Image
                        src={selectedProof.screenshotUrl}
                        alt="Payment screenshot"
                        width={300}
                        height={200}
                        className="w-full h-auto object-contain"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={() => window.open(selectedProof.screenshotUrl, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Full Size
                    </Button>
                  </div>

                  {/* Actions */}
                  {selectedProof.status === 'pending' && (
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleApprove(selectedProof.id)}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                        disabled={isProcessing}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Payment
                      </Button>
                      <Button
                        onClick={() => handleReject(selectedProof.id)}
                        variant="outline"
                        className="w-full bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
                        disabled={isProcessing}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Payment
                      </Button>
                    </div>
                  )}

                  {selectedProof.status !== 'pending' && (
                    <div className="text-center">
                      <Badge className={`${getStatusColor(selectedProof.status)} text-sm`}>
                        {getStatusIcon(selectedProof.status)}
                        {selectedProof.status.charAt(0).toUpperCase() + selectedProof.status.slice(1)}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/10 backdrop-blur-xl border-0 shadow-2xl">
                <CardContent className="p-8 text-center">
                  <Eye className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Select Payment Proof</h3>
                  <p className="text-purple-200">
                    Click on a payment proof from the list to view details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}