'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Mail, Phone, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface PaymentStatus {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  plan: string
  amount: number
  transactionId: string
  submittedAt: string
  reviewedAt?: string
  adminNotes?: string
  rejectionReason?: string
}

export default function WaitingPage() {
  const router = useRouter()
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [progress, setProgress] = useState(0)

  // Simulate time elapsed
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
      setProgress(prev => {
        const newProgress = prev + (100 / (24 * 60)) // 24 hours in minutes
        return newProgress >= 100 ? 100 : newProgress
      })
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  // Check payment status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/subscription/payment-status')
        const data = await response.json()

        if (response.ok && data.payment) {
          setPaymentStatus(data.payment)
          
          // If payment is approved, redirect to signup
          if (data.payment.status === 'approved') {
            toast.success('🎉 Payment Approved!', {
              description: 'Your payment has been approved. Redirecting to signup...',
              duration: 3000,
            })
            setTimeout(() => {
              router.push('/signup')
            }, 2000)
          }
          
          // If payment is rejected, show error
          if (data.payment.status === 'rejected') {
            toast.error('❌ Payment Rejected', {
              description: data.payment.rejectionReason || 'Your payment was rejected. Please contact support.',
              duration: 5000,
            })
          }
        } else {
          // No payment found, redirect to subscription
          router.push('/subscription')
        }
      } catch (error) {
        console.error('Failed to check payment status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkStatus()
    
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [router])

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const handleContactSupport = () => {
    toast.info('📞 Contact Support', {
      description: 'Our support team will contact you within 24 hours.',
      duration: 3000,
    })
  }

  const handleViewDetails = () => {
    if (paymentStatus) {
      toast.info('📄 Payment Details', {
        description: `Transaction ID: ${paymentStatus.transactionId}`,
        duration: 5000,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking payment status...</p>
        </div>
      </div>
    )
  }

  if (!paymentStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <CardTitle>No Payment Found</CardTitle>
            <CardDescription>
              No pending payment found. Please complete your payment first.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/subscription')}>
              Complete Payment
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Verification in Progress
          </h1>
          <p className="text-gray-600">
            Your payment is being reviewed by our team
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {paymentStatus.status === 'pending' && (
                    <>
                      <Clock className="w-5 h-5 text-yellow-500" />
                      Payment Under Review
                    </>
                  )}
                  {paymentStatus.status === 'approved' && (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Payment Approved
                    </>
                  )}
                  {paymentStatus.status === 'rejected' && (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      Payment Rejected
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {paymentStatus.status === 'pending' && 
                    'Your payment proof is being reviewed. This usually takes 24 hours.'
                  }
                  {paymentStatus.status === 'approved' && 
                    'Your payment has been approved! You can now proceed with signup.'
                  }
                  {paymentStatus.status === 'rejected' && 
                    'Your payment was rejected. Please check the reason below.'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Badge */}
                <div className="flex items-center justify-center">
                  {getStatusBadge(paymentStatus.status)}
                </div>

                {/* Progress Bar for Pending */}
                {paymentStatus.status === 'pending' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Review Progress</span>
                      <span>{formatTime(timeElapsed)} elapsed</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-gray-500 text-center">
                      Estimated review time: 24 hours
                    </p>
                  </div>
                )}

                {/* Payment Details */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-gray-900">Payment Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Plan:</span>
                      <p className="font-medium">{paymentStatus.plan.toUpperCase()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <p className="font-medium">₹{paymentStatus.amount.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Transaction ID:</span>
                      <p className="font-medium">{paymentStatus.transactionId}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Submitted:</span>
                      <p className="font-medium">{formatDateTime(paymentStatus.submittedAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                {(paymentStatus.adminNotes || paymentStatus.rejectionReason) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">
                      {paymentStatus.status === 'rejected' ? 'Rejection Reason' : 'Admin Notes'}
                    </h4>
                    <p className="text-blue-800 text-sm">
                      {paymentStatus.rejectionReason || paymentStatus.adminNotes}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {paymentStatus.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleViewDetails}
                        className="flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleContactSupport}
                        className="flex items-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        Contact Support
                      </Button>
                    </>
                  )}
                  {paymentStatus.status === 'approved' && (
                    <Button
                      onClick={() => router.push('/signup')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Proceed to Signup
                    </Button>
                  )}
                  {paymentStatus.status === 'rejected' && (
                    <Button
                      onClick={() => router.push('/subscription')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Try Again
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-500" />
                  What Happens Next?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Review Process</h4>
                      <p className="text-sm text-gray-600">
                        Our team reviews your payment proof for authenticity and correctness.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Verification</h4>
                      <p className="text-sm text-gray-600">
                        We verify the transaction details and match with our records.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Approval</h4>
                      <p className="text-sm text-gray-600">
                        Once approved, you'll receive an email and can proceed with signup.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Need Help?</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>📧 support@saanify.com</p>
                    <p>📞 +91-XXXXXXXXXX</p>
                    <p>💬 Live chat available</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <RefreshCw className="w-4 h-4" />
                    <span>Auto-refreshes every 30 seconds</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}