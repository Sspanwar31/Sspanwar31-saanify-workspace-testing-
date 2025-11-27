'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Clock, CheckCircle, AlertCircle, RefreshCw, Mail, Phone, ArrowLeft, Home, LogIn } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function WaitingPage() {
  const router = useRouter()
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [isChecking, setIsChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date>(new Date())

  useEffect(() => {
    // Check payment status periodically
    const interval = setInterval(async () => {
      await checkPaymentStatus()
    }, 30000) // Check every 30 seconds

    // Initial check
    checkPaymentStatus()

    return () => clearInterval(interval)
  }, [])

  const checkPaymentStatus = async () => {
    try {
      setIsChecking(true)
      
      // Get token from cookies
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]

      const response = await fetch('/api/subscription/payment-status', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPaymentStatus(data.status)
        setLastChecked(new Date())

        if (data.status === 'approved') {
          toast.success('🎉 Payment Approved!', {
            description: 'Your subscription has been activated. Redirecting to signup...',
            duration: 3000,
          })
          setTimeout(() => {
            router.push('/signup')
          }, 2000)
        } else if (data.status === 'rejected') {
          toast.error('❌ Payment Rejected', {
            description: 'Please contact support or reupload your payment proof.',
            duration: 5000,
          })
        }
      }
    } catch (error) {
      console.error('Failed to check payment status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const getStatusBadge = () => {
    switch (paymentStatus) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'pending':
        return {
          title: 'Payment Under Review',
          description: 'Your payment proof has been submitted and is currently being reviewed by our team.',
          color: 'text-blue-600'
        }
      case 'approved':
        return {
          title: 'Payment Approved!',
          description: 'Congratulations! Your subscription has been activated. You can now complete your signup.',
          color: 'text-green-600'
        }
      case 'rejected':
        return {
          title: 'Payment Rejected',
          description: 'We couldn\'t verify your payment. Please contact support or reupload your payment proof.',
          color: 'text-red-600'
        }
      default:
        return {
          title: 'Checking Status',
          description: 'Please wait while we check your payment status...',
          color: 'text-gray-600'
        }
    }
  }

  const statusInfo = getStatusMessage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/subscription" className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Plans
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-slate-900">Saanify</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Status Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    {paymentStatus === 'pending' && <Clock className="w-6 h-6 text-yellow-500 animate-pulse" />}
                    {paymentStatus === 'approved' && <CheckCircle className="w-6 h-6 text-green-500" />}
                    {paymentStatus === 'rejected' && <AlertCircle className="w-6 h-6 text-red-500" />}
                    {statusInfo.title}
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    {statusInfo.description}
                  </CardDescription>
                </div>
                {getStatusBadge()}
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Status Details */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Status Details</CardTitle>
                <CardDescription>
                  Current status of your subscription payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium">Current Status</span>
                  {getStatusBadge()}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium">Last Checked</span>
                  <span className="text-sm text-gray-600">
                    {lastChecked.toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium">Auto-refresh</span>
                  <span className="text-sm text-green-600">Every 30 seconds</span>
                </div>

                <Button
                  onClick={checkPaymentStatus}
                  disabled={isChecking}
                  className="w-full"
                  variant="outline"
                >
                  {isChecking ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Checking...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Check Status Now
                    </div>
 )}
                </Button>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>What's Next?</CardTitle>
                <CardDescription>
                  Here's what happens after your payment is approved
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Payment Verification</p>
                      <p className="text-sm text-gray-600">Our team reviews your payment proof</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Account Activation</p>
                      <p className="text-sm text-gray-600">Your subscription gets activated</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Complete Signup</p>
                      <p className="text-sm text-gray-600">Finish your profile setup</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mt-0.5">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Access Dashboard</p>
                      <p className="text-sm text-gray-600">Start using all features</p>
                    </div>
                  </div>
                </div>

                {paymentStatus === 'approved' && (
                  <Button asChild className="w-full">
                    <Link href="/signup">
                      Complete Your Signup
                    </Link>
                  </Button>
                )}

                {paymentStatus === 'rejected' && (
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/subscription/payment-upload">
                      Reupload Payment
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Support Section */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                If you have any questions or issues with your payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-gray-600">support@saanify.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Phone Support</p>
                    <p className="text-sm text-gray-600">+91 98765 43210</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">
                <LogIn className="w-4 h-4 mr-2" />
                Go to Login
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}