'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Crown, 
  Zap, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  Upload,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    router.push('/client/subscription/upgrade')
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-8">
      <div className="w-full max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Subscription Management</h1>
            <p className="text-slate-600">Manage your subscription, payments, and billing information</p>
          </div>

          {/* Status Banner */}
          <Card className={`border-2 ${getStatusColor(subscriptionData.status)} mb-6 shadow-lg`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${planDetails.bgColor} bg-opacity-20`}>
                    <PlanIcon className={`w-5 h-5 ${planDetails.textColor}`} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h2 className="text-lg font-semibold text-slate-900">
                        {planDetails.name} Plan
                      </h2>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(subscriptionData.status)} text-xs px-2 py-1`}
                      >
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(subscriptionData.status)}
                          <span>{subscriptionData.status.replace('_', ' ').toUpperCase()}</span>
                        </div>
                      </Badge>
                    </div>
                    <p className="text-slate-600 text-sm">
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
                    <Button onClick={handleUpgradePlan} className="flex items-center space-x-1 px-4 py-2 text-sm">
                      <ArrowRight className="w-4 h-4" />
                      <span>Upgrade Now</span>
                    </Button>
                  )}
                  {subscriptionData.status === 'PENDING_PAYMENT' && (
                    <Button onClick={handleUploadPayment} variant="outline" className="flex items-center space-x-1 px-4 py-2 text-sm">
                      <Upload className="w-4 h-4" />
                      <span>Upload Payment</span>
                    </Button>
                  )}
                  {subscriptionData.status === 'EXPIRED' && (
                    <Button onClick={handleUpgradePlan} className="flex items-center space-x-1 px-4 py-2 text-sm">
                      <RefreshCw className="w-4 h-4" />
                      <span>Renew Subscription</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Sections - Single Column Layout */}
          <div className="space-y-6">
            {/* Trial Progress Bar */}
            {subscriptionData.status === 'TRIAL' && subscriptionData.daysRemaining !== undefined && (
              <Card className="shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-lg">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <span>Trial Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="flex justify-between text-base">
                      <span className="text-slate-600 font-medium">Days Remaining</span>
                      <span className="font-bold text-lg">{subscriptionData.daysRemaining} days</span>
                    </div>
                    <Progress 
                      value={(subscriptionData.daysRemaining / 15) * 100} 
                      className="h-3"
                    />
                    <p className="text-base text-slate-500">
                      Upgrade before your trial ends to continue using all features
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Plan Details */}
            <Card className="shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Current Plan Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                    <span className="text-slate-600 font-medium text-base">Plan Type</span>
                    <span className="font-bold text-lg">{planDetails.name}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                    <span className="text-slate-600 font-medium text-base">Status</span>
                    <Badge variant="outline" className={`${getStatusColor(subscriptionData.status)} text-sm font-medium px-3 py-1`}>
                      {subscriptionData.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  {subscriptionData.trialEndsAt && (
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                      <span className="text-slate-600 font-medium text-base">Trial Ends</span>
                      <span className="font-bold text-lg">
                        {new Date(subscriptionData.trialEndsAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {subscriptionData.subscriptionEndsAt && (
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                      <span className="text-slate-600 font-medium text-base">Subscription Ends</span>
                      <span className="font-bold text-lg">
                        {new Date(subscriptionData.subscriptionEndsAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}