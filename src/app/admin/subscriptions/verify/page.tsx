'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, CheckCircle, XCircle, FileText, DollarSign, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { makeAuthenticatedRequest } from '@/lib/auth'

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
    id: string
    name: string
    email: string
    societyName: string
  }
}

export default function AdminPaymentsPage() {
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>([])
  const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchPaymentProofs()
  }, [])

  const fetchPaymentProofs = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/subscriptions/payment-proofs')
      if (response.ok) {
        const data = await response.json()
        setPaymentProofs(data.proofs || [])
      }
    } catch (error) {
      console.error('Failed to fetch payment proofs:', error)
      toast.error('Failed to load payment proofs')
    }
  }

  const handleApprove = async (proofId: string) => {
    setIsProcessing(true)
    
    try {
      const response = await makeAuthenticatedRequest(`/api/admin/subscriptions/approve-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          proofId,
          adminNotes: adminNotes
        })
      })

      if (response.ok) {
        setPaymentProofs(prev => 
          prev.map(proof => 
            proof.id === proofId 
              ? { ...proof, status: 'approved' }
              : proof
          )
        )

        setSelectedProof(null)
        setAdminNotes('')
        toast.success('Payment approved successfully!')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to approve payment')
      }
    } catch (error) {
      console.error('Failed to approve payment:', error)
      toast.error('Failed to approve payment')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (proofId: string) => {
    setIsProcessing(true)
    
    try {
      const response = await makeAuthenticatedRequest(`/api/admin/subscriptions/reject-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          proofId,
          adminNotes: adminNotes
        })
      })

      if (response.ok) {
        setPaymentProofs(prev => 
          prev.map(proof => 
            proof.id === proofId 
              ? { ...proof, status: 'rejected' }
              : proof
          )
        )

        setSelectedProof(null)
        setAdminNotes('')
        toast.success('Payment rejected successfully!')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to reject payment')
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
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Approval Dashboard
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Review and approve payment requests from clients
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold">Total Revenue</h3>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-gray-900">₹0</div>
              <p className="text-sm text-gray-600">This month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Pending Payments</h3>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-gray-900">{paymentProofs.filter(p => p.status === 'pending').length}</div>
              <p className="text-sm text-gray-600">Awaiting approval</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold">Approved Payments</h3>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-gray-900">{paymentProofs.filter(p => p.status === 'approved').length}</div>
              <p className="text-sm text-gray-600">Approved this month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold">Rejected Payments</h3>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-gray-900">{paymentProofs.filter(p => p.status === 'rejected').length}</div>
              <p className="text-sm text-gray-600">Rejected this month</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Payment Proofs</h3>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentProofs.map((proof) => (
                    <TableRow key={proof.id}>
                      <TableCell>{proof.user.name}</TableCell>
                      <TableCell>{proof.plan.toUpperCase()}</TableCell>
                      <TableCell>{formatAmount(proof.amount)}</TableCell>
                      <TableCell>{proof.txnId}</TableCell>
                      <TableCell>
                        {getStatusBadge(proof.status)}
                      </TableCell>
                      <TableCell>{formatDate(proof.createdAt)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedProof(proof)}
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
          </CardContent>
        </Card>

        {selectedProof && (
          <Dialog open={true} onOpenChange={() => setSelectedProof(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] w-full">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-semibold">Payment Proof Details</h3>
                </DialogTitle>
              </DialogHeader>
              <DialogDescription>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Client Name</Label>
                      <p className="font-medium text-gray-700">{selectedProof.user.name}</p>
                    </div>
                    <div>
                      <Label>Client Email</Label>
                      <p className="font-medium text-gray-700">{selectedProof.user.email}</p>
                    </div>
                    <div>
                      <Label>Society Name</Label>
                      <p className="font-medium text-gray-700">{selectedProof.user.societyName}</p>
                    </div>
                    <div>
                      <Label>Plan</Label>
                      <p className="font-medium text-gray-700">{selectedProof.plan.toUpperCase()}</p>
                    </div>
                    <div>
                      <Label>Amount</Label>
                      <p className="font-medium text-gray-700">{formatAmount(selectedProof.amount)}</p>
                    </div>
                    <div>
                      <Label>Transaction ID</Label>
                      <p className="font-medium text-gray-700">{selectedProof.txnId}</p>
                    </div>
                    <div>
                      <Label>Date</Label>
                      <p className="font-medium text-gray-700">{formatDate(selectedProof.createdAt)}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <p className="font-medium text-gray-700">
                        {getStatusBadge(selectedProof.status)}
                      </p>
                    </div>
                  </div>
                  
                  {selectedProof.screenshotUrl && (
                    <div>
                      <Label>Screenshot</Label>
                      <p className="font-medium text-gray-700">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.open(selectedProof.screenshotUrl, '_blank')
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Full Size
                        </Button>
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <Label>Admin Notes</Label>
                    <Textarea
                      placeholder="Add admin notes..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </DialogDescription>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedProof(null)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(selectedProof.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Reject'}
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleApprove(selectedProof.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Approve'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
      </div>
    </div>
  )
}