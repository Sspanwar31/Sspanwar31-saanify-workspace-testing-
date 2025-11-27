'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Crown, 
  Zap, 
  Shield, 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  Upload,
  FileText,
  History,
  Bell,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface SubscriptionData {
  plan: string
  status: string
  trialEndsAt?: string
  subscriptionEndsAt?: string
  daysRemaining?: number
  paymentHistory?: Array<{
    id: string
    amount: number
    plan: string
    status: string
    createdAt: string
    transactionId: string
  }>
  notifications?: Array<{
    id: string
    title: string
    message: string
    type: string
    createdAt: string
    isRead: boolean
  }>
}

const PLAN_DETAILS = {
  TRIAL: {
    name: 'Trial',
    icon: Zap,
    color: 'blue',
    bgColor: 'bg-blue-500',
    textColor: 'text-blue-600'
  },
  BASIC: {
    name: 'Basic',
    icon: Crown,
    color: 'purple',
    bgColor: 'bg-purple-500',
    textColor: 'text-purple-600'
  },
  PRO: {
    name: 'Pro',
    icon: Shield,
    color: 'green',
    bgColor: 'bg-green-500',
    textColor: 'text-green-600'
  },
  ENTERPRISE: {
    name: 'Enterprise',
    icon: Crown,
    color: 'orange',
    bgColor: 'bg-orange-500',
    textColor: 'text-orange-600'
  }
}

export default function SubscriptionPage() {
  const router = useRouter()
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'notifications'>('overview')

  useEffect(() => {
    fetchSubscriptionData()
  }, [])

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/client/subscription')
      if (response.ok) {
        const data = await response.json()
        setSubscriptionData(data)
      } else {
        throw new Error('Failed to fetch subscription data')
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error)
      toast.error('Failed to load subscription data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgradePlan = () => {
    router.push('/subscription/select-plan')
  }

  const handleUploadPayment = () => {
    router.push('/subscription/payment-upload')
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'trial':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'trial':
        return <Clock className="w-4 h-4" />
      case 'active':
        return <CheckCircle className="w-4 h-4" />
      case 'pending_payment':
        return <AlertCircle className="w-4 h-4" />
      case 'expired':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-gray-600">Loading subscription data...</p>
        </div>
      </div>
    )
  }

  if (!subscriptionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-lg text-gray-600 mb-4">Failed to load subscription data</p>
          <Button onClick={fetchSubscriptionData}>Retry</Button>
        </div>
      </div>
    )
  }

  const planDetails = PLAN_DETAILS[subscriptionData.plan as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.TRIAL
  const PlanIcon = planDetails.icon

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
              <span className="text-xl font-bold text-slate-900">Saanify</span>
            </div>
            <Link href="/client/dashboard">
              <Button variant="outline" size="sm">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Subscription Management</h1>
            <p className="text-slate-600">Manage your subscription, payments, and billing information</p>
          </div>

          {/* Status Banner */}
          <Card className={`mb-8 border-2 ${getStatusColor(subscriptionData.status)}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${planDetails.bgColor} bg-opacity-20`}>
                    <PlanIcon className={`w-6 h-6 ${planDetails.textColor}`} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-xl font-semibold text-slate-900">
                        {planDetails.name} Plan
                      </h2>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(subscriptionData.status)}
                      >
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(subscriptionData.status)}
                          <span>{subscriptionData.status.replace('_', ' ').toUpperCase()}</span>
                        </div>
                      </Badge>
                    </div>
                    <p className="text-slate-600 mt-1">
                      {subscriptionData.status === 'TRIAL' && subscriptionData.trialEndsAt && (
                        <>Trial ends on {new Date(subscriptionData.trialEndsAt).toLocaleDateString()}</>
                      )}
                      {subscriptionData.status === 'ACTIVE' && subscriptionData.subscriptionEndsAt && (
                        <>Subscription renews on {new Date(subscriptionData.subscriptionEndsAt).toLocaleDateString()}</>
                      )}
                      {subscriptionData.status === 'PENDING_PAYMENT' && (
                        <>Payment is under review</>
                      )}
                      {subscriptionData.status === 'EXPIRED' && (
                        <>Your subscription has expired</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {subscriptionData.status === 'TRIAL' && (
                    <Button onClick={handleUpgradePlan} className="flex items-center space-x-2">
                      <ArrowRight className="w-4 h-4" />
                      <span>Upgrade Now</span>
                    </Button>
                  )}
                  {subscriptionData.status === 'PENDING_PAYMENT' && (
                    <Button onClick={handleUploadPayment} variant="outline" className="flex items-center space-x-2">
                      <Upload className="w-4 h-4" />
                      <span>Upload Payment</span>
                    </Button>
                  )}
                  {subscriptionData.status === 'EXPIRED' && (
                    <Button onClick={handleUpgradePlan} className="flex items-center space-x-2">
                      <RefreshCw className="w-4 h-4" />
                      <span>Renew Subscription</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trial Progress Bar */}
          {subscriptionData.status === 'TRIAL' && subscriptionData.daysRemaining !== undefined && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span>Trial Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Days Remaining</span>
                    <span className="font-semibold">{subscriptionData.daysRemaining} days</span>
                  </div>
                  <Progress 
                    value={(subscriptionData.daysRemaining / 15) * 100} 
                    className="h-2"
                  />
                  <p className="text-sm text-slate-500">
                    Upgrade before your trial ends to continue using all features
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: Crown },
                { id: 'history', label: 'Payment History', icon: History },
                { id: 'notifications', label: 'Notifications', icon: Bell }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Current Plan Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Plan Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Plan Type</span>
                          <span className="font-semibold">{planDetails.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Status</span>
                          <Badge variant="outline" className={getStatusColor(subscriptionData.status)}>
                            {subscriptionData.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        {subscriptionData.trialEndsAt && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Trial Ends</span>
                            <span className="font-semibold">
                              {new Date(subscriptionData.trialEndsAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {subscriptionData.subscriptionEndsAt && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Subscription Ends</span>
                            <span className="font-semibold">
                              {new Date(subscriptionData.subscriptionEndsAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          variant="outline" 
                          className="h-auto p-4 flex flex-col items-center space-y-2"
                          onClick={handleUpgradePlan}
                        >
                          <ArrowRight className="w-6 h-6" />
                          <span>Upgrade Plan</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-auto p-4 flex flex-col items-center space-y-2"
                          onClick={handleUploadPayment}
                        >
                          <Upload className="w-6 h-6" />
                          <span>Upload Payment</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'history' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <History className="w-5 h-5" />
                      <span>Payment History</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {subscriptionData.paymentHistory && subscriptionData.paymentHistory.length > 0 ? (
                      <div className="space-y-4">
                        {subscriptionData.paymentHistory.map((payment) => (
                          <div key={payment.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold">{payment.plan} Plan</p>
                                <p className="text-sm text-slate-600">Transaction ID: {payment.transactionId}</p>
                                <p className="text-sm text-slate-600">
                                  {new Date(payment.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">₹{payment.amount}</p>
                                <Badge 
                                  variant="outline" 
                                  className={getStatusColor(payment.status)}
                                >
                                  {payment.status.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">No payment history available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === 'notifications' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="w-5 h-5" />
                      <span>Notifications</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {subscriptionData.notifications && subscriptionData.notifications.length > 0 ? (
                      <div className="space-y-4">
                        {subscriptionData.notifications.map((notification) => (
                          <div key={notification.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-semibold">{notification.title}</p>
                                <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                                <p className="text-xs text-slate-500 mt-2">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">No notifications</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Help Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">
                      Our support team is here to help you with any subscription-related questions.
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Contact Us:</p>
                      <p className="text-sm text-slate-600">Email: support@saanify.com</p>
                      <p className="text-sm text-slate-600">Phone: +91 98765 43210</p>
                    </div>
                    <Button variant="outline" className="w-full">
                      Contact Support
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-sm mb-1">How do I upgrade my plan?</p>
                      <p className="text-sm text-slate-600">
                        Click the "Upgrade Now" button and select your preferred plan.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1">When will my payment be approved?</p>
                      <p className="text-sm text-slate-600">
                        Payments are typically reviewed within 2-24 hours.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1">Can I cancel anytime?</p>
                      <p className="text-sm text-slate-600">
                        Yes, you can cancel your subscription at any time.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}