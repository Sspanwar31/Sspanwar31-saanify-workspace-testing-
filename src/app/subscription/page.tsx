'use client'

import { PaymentModeToggle } from '@/components/admin/PaymentModeToggle'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Check, 
  Crown, 
  Zap, 
  Building, 
  Star, 
  ArrowRight, 
  Shield, 
  Headphones, 
  Users, 
  TrendingUp,
  AlertCircle,
  Loader2,
  Upload,
  CreditCard,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SubscriptionPlan {
  id: string
  name: string
  price: string
  duration: string
  description: string
  features: string[]
  icon: any
  badge: string
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'
  cta: string
  popular: boolean
  gradient: string
  bgLight: string
  monthlyPrice?: number
  yearlyPrice?: number
}

interface UserData {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'CLIENT' | 'USER'
  trialEndsAt?: string | null
  subscriptionEndsAt?: string | null
  societyAccountId?: string | null
  authenticated: boolean
}

const PLANS: SubscriptionPlan[] = [
  {
    id: 'trial',
    name: 'Trial',
    price: 'Free',
    duration: '15 Days',
    description: 'Perfect for getting started and exploring our platform',
    features: [
      'Access to all basic features',
      'Up to 3 users',
      '15-day trial period',
      'Email support',
      'Basic analytics'
    ],
    icon: Zap,
    badge: 'Free Trial',
    badgeVariant: 'secondary',
    cta: 'Start Free Trial',
    popular: false,
    gradient: 'from-gray-500 to-gray-600',
    bgLight: 'bg-gray-50'
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '₹4,000',
    duration: 'per month',
    description: 'Great for small societies and growing organizations',
    features: [
      'Everything in Trial',
      'Up to 10 users',
      'Advanced analytics',
      'Priority email support',
      'Data export',
      'Monthly reports'
    ],
    icon: Crown,
    badge: 'Most Popular',
    badgeVariant: 'default',
    cta: 'Choose Basic',
    popular: true,
    gradient: 'from-blue-500 to-cyan-500',
    bgLight: 'bg-blue-50',
    monthlyPrice: 4000,
    yearlyPrice: 48000
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹7,000',
    duration: 'per month',
    description: 'Advanced features for larger societies',
    features: [
      'Everything in Basic',
      'Unlimited users',
      'Real-time collaboration',
      'Phone & email support',
      'Custom integrations',
      'Advanced security',
      'API access'
    ],
    icon: Zap,
    badge: 'Best Value',
    badgeVariant: 'destructive',
    cta: 'Choose Pro',
    popular: false,
    gradient: 'from-purple-500 to-pink-500',
    bgLight: 'bg-purple-50',
    monthlyPrice: 7000,
    yearlyPrice: 84000
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '₹10,000',
    duration: 'per month',
    description: 'Complete solution for large organizations',
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      'Custom training',
      'SLA guarantee',
      'White-label options',
      'On-premise deployment',
      'Custom contracts'
    ],
    icon: Building,
    badge: 'Premium',
    badgeVariant: 'outline',
    cta: 'Choose Enterprise',
    popular: false,
    gradient: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-50',
    monthlyPrice: 10000,
    yearlyPrice: 120000
  }
]

// API function to fetch user data
const fetchUserData = async (): Promise<UserData | null> => {
  try {
    const response = await fetch('/api/auth/check-session')
    if (!response.ok) return null
    const data = await response.json()
    if (!data.authenticated || !data.user) return null

    return {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role || 'USER',
      trialEndsAt: data.user.trialEndsAt,
      subscriptionEndsAt: data.user.subscriptionEndsAt,
      societyAccountId: data.user.societyAccountId,
      authenticated: true
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
    return null
  }
}

// API function to fetch payment mode
const fetchPaymentMode = async () => {
  const response = await fetch('/api/admin/payment-mode')
  if (!response.ok) throw new Error('Failed to fetch payment mode')
  return response.json()
}

// API function to update payment mode
const updatePaymentModeAPI = async (mode: 'MANUAL' | 'RAZORPAY') => {
  const response = await fetch('/api/admin/payment-mode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  })
  if (!response.ok) throw new Error('Failed to update payment mode')
  return response.json()
}

export default function SubscriptionSelectPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isYearly, setIsYearly] = useState(false)
  const [isClient, setIsClient] = useState(false)

  const { data: userData, isLoading: isUserLoading, error: userError } = useQuery({
    queryKey: ['user-session'],
    queryFn: fetchUserData,
    retry: 1,
    refetchOnWindowFocus: true,
  })

  const { data: paymentData, isLoading: isPaymentModeLoading, error: paymentModeError } = useQuery({
    queryKey: ['payment-mode'],
    queryFn: fetchPaymentMode,
    retry: 3,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  })

  const updatePaymentModeMutation = useMutation({
    mutationFn: updatePaymentModeAPI,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payment-mode'] })
      toast.success('Payment Mode Updated', {
        description: `Payment processing switched to ${data.mode} mode`,
        duration: 3000,
      })
    },
    onError: (error) => {
      console.error('Error updating payment mode:', error)
      toast.error('Update Failed', {
        description: 'Could not update payment mode. Please try again.',
        duration: 3000,
      })
    },
  })

  const isAdmin = userData?.role === 'ADMIN'
  const paymentMode = paymentData?.mode || null
  const isAuthenticated = userData?.authenticated || false

  const trialStatus = { isValid: false, daysRemaining: null as number | null, isExpired: false }
  if (userData?.trialEndsAt) {
    const trialEnd = new Date(userData.trialEndsAt)
    const now = new Date()
    const diffDays = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    trialStatus.isValid = diffDays > 0
    trialStatus.daysRemaining = diffDays > 0 ? diffDays : null
    trialStatus.isExpired = diffDays <= 0
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const referrer = document.referrer
      const path = window.location.pathname
      setIsClient(path.includes('/client') || referrer.includes('/client'))
    }
  }, [])

  const handlePlanSelect = (planId: string) => setSelectedPlan(planId)

  const createRazorpayOrder = async (plan: SubscriptionPlan) => {
    try {
      const amount = isYearly ? plan.yearlyPrice || plan.monthlyPrice! * 12 : plan.monthlyPrice!
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, amount, currency: 'INR', receipt: `receipt_${plan.id}_${Date.now()}` }),
      })
      if (!response.ok) throw new Error('Failed to create payment order')
      const data = await response.json()
      
      if (typeof window !== 'undefined') {
        const options = {
          key: data.key_id,
          amount: data.amount,
          currency: data.currency,
          name: "Saanify",
          order_id: data.order.id,
          handler: async function(paymentResponse: any) {
            const verify = await fetch("/api/subscription/verify-razorpay", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_signature: paymentResponse.razorpay_signature
              })
            }).then(r => r.json())

            if (verify?.token) {
              localStorage.setItem("auth-token", verify.token)
              document.cookie = `auth-token=${verify.token}; path=/; max-age=86400; secure=true; samesite=lax`
              toast.success('Payment Successful', { description: 'Your subscription has been activated!', duration: 3000 })
              setTimeout(() => router.push("/client/dashboard"), 1000)
            } else {
              toast.error('Verification Failed', { description: 'Payment verification failed. Please contact support.', duration: 5000 })
            }
          }
        }
        const razorpay = new (window as any).Razorpay(options)
        razorpay.open()
      }
      return data
    } catch (error) {
      console.error('Error creating Razorpay order:', error)
      toast.error('Payment Error', { description: 'Failed to initialize payment. Please try again.', duration: 3000 })
      throw error
    }
  }

  const handleMockPayment = async (plan: SubscriptionPlan) => {
    const amount = isYearly ? plan.yearlyPrice || plan.monthlyPrice! * 12 : plan.monthlyPrice!
    const res = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: plan.id,
        amount: amount,
      })
    })
    
    const data = await res.json()

    if (data.success) {
      toast.success("💰 Mock Payment Success — Subscription Activated!", {
        description: 'Your subscription has been activated successfully!',
        duration: 3000
      })
      // yaha aap DB update API call karwa sakte ho (status=ACTIVE)
      setTimeout(() => router.push("/client/dashboard"), 1000)
    } else {
      toast.error('Payment Failed', {
        description: 'Mock payment failed. Please try again.',
        duration: 3000
      })
    }
  }

  const handleContinue = async (planId: string) => {
    if (isLoading) return
    const plan = PLANS.find(p => p.id === planId)
    if (!plan) return
    setIsLoading(true)
    setSelectedPlan(planId)

    try {
      if (planId === 'trial') {
        if (isAuthenticated && isClient) {
          toast.success('Trial Activated', { description: 'Your 15-day trial has been activated', duration: 3000 })
          setTimeout(() => router.push('/client/dashboard'), 1000)
        } else {
          router.push(`/auth/signup?plan=${planId}`)
        }
      } else {
        // For mock payment, directly call handleMockPayment
        await handleMockPayment(plan)
      }
    } catch (error) {
      console.error('Error handling plan selection:', error)
      setSelectedPlan(null)
      toast.error('Error', { description: 'Failed to process your request. Please try again.', duration: 3000 })
    } finally {
      setIsLoading(false)
    }
  }

  const getPlanPrice = (plan: SubscriptionPlan) => {
    if (plan.id === 'trial') return plan.price
    const price = isYearly ? (plan.yearlyPrice || plan.monthlyPrice! * 12) : plan.monthlyPrice!
    return `₹${price.toLocaleString('en-IN')}`
  }

  const getPlanDuration = (plan: SubscriptionPlan) => plan.id === 'trial' ? plan.duration : isYearly ? 'per year' : 'per month'

  const getPaymentModeIcon = () => !paymentMode ? <Settings className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />
  const getPaymentModeText = () => !paymentMode ? 'Payment mode not configured' : 'Instant payment available'
  const getSubscriptionStatus = () => {
    if (!userData) return 'NONE'
    if (trialStatus.isValid) return 'TRIAL'
    if (trialStatus.isExpired) return 'EXPIRED'
    if (userData.subscriptionEndsAt && new Date(userData.subscriptionEndsAt) > new Date()) return 'ACTIVE'
    return 'NONE'
  }

  const subscriptionStatus = getSubscriptionStatus()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Saanify</span>
          </div>
          <div className="flex items-center space-x-3">
            {isClient && isAuthenticated && (
              <Button variant="outline" size="sm" onClick={() => router.push('/client/dashboard')}>Back to Dashboard</Button>
            )}
            <Link href="/login">
              <Button variant="outline" size="sm" className="border-blue-200 hover:border-blue-300 hover:bg-blue-50">Sign In</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {paymentModeError && (
          <Alert className="border-2 border-red-200 bg-red-50 mb-4">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Failed to load payment mode. Admin needs to configure it.
            </AlertDescription>
          </Alert>
        )}

        {/* Compact Trial Status Alert */}
        {isAuthenticated && subscriptionStatus === 'TRIAL' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert className={`border-2 ${
              trialStatus.isExpired 
                ? 'border-red-200 bg-red-50' 
                : trialStatus.isValid 
                  ? 'border-green-200 bg-green-50'
                  : 'border-amber-200 bg-amber-50'
            }`}>
              <AlertCircle className={`h-4 w-4 ${
                trialStatus.isExpired ? 'text-red-600' : trialStatus.isValid ? 'text-green-600' : 'text-amber-600'
              }`} />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  {trialStatus.isExpired ? (
                    <span className="font-medium text-red-800">
                      Trial expired on {userData?.trialEndsAt ? new Date(userData.trialEndsAt).toLocaleDateString() : 'unknown date'}
                    </span>
                  ) : trialStatus.isValid ? (
                    <span className="font-medium text-green-800">
                      Trial active - {trialStatus.daysRemaining} days remaining
                    </span>
                  ) : (
                    <span className="font-medium text-amber-800">
                      Trial status unknown
                    </span>
                  )}
                </div>
                {trialStatus.isExpired && (
                  <Button size="sm" onClick={() => router.push('/subscription')}>
                    Upgrade Now
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Loading State */}
        {isUserLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-slate-600">Loading subscription plans...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {userError && !isUserLoading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert className="border-2 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Failed to load user information. Please refresh page and try again.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Payment Mode Status for Admins */}
        {isAdmin && paymentMode && !isPaymentModeLoading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert className="border-2 border-blue-200 bg-blue-50">
              {getPaymentModeIcon()}
              <AlertDescription className="flex items-center justify-between">
                <span className="font-medium text-blue-800">
                  {getPaymentModeText()}
                </span>
                <Badge variant="outline" className="border-blue-300 text-blue-700">
                  {paymentMode === 'MANUAL' ? '📋 Manual' : '⚡ Razorpay'}
                </Badge>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {!isUserLoading && (
          <>
            {/* Compact Hero Section */}
            <div className="text-center mb-6">
              <div className="mb-3">
                <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                  {isAuthenticated ? `Current Subscription: ${subscriptionStatus}` : 'Choose Your Plan'}
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 leading-tight">
                Choose Your
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Perfect Plan</span>
              </h1>
              <p className="text-base text-slate-600 max-w-2xl mx-auto">
                Select subscription that best fits your society needs
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-lg border p-1 shadow-sm">
                <button
                  onClick={() => setIsYearly(false)}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    !isYearly 
                      ? "bg-blue-600 text-white shadow-sm" 
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsYearly(true)}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    isYearly 
                      ? "bg-blue-600 text-white shadow-sm" 
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Yearly (Save 20%)
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {PLANS.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="relative"
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-3 py-1 text-xs font-semibold">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <Card className={cn(
                    "h-full cursor-pointer transition-all duration-300 border-2",
                    selectedPlan === plan.id 
                      ? "border-blue-500 shadow-xl scale-105" 
                      : "border-slate-200 hover:border-slate-300 hover:shadow-lg",
                    plan.popular && selectedPlan !== plan.id && "border-blue-200"
                  )}>
                    <CardHeader className={cn(
                      "text-center pb-4",
                      plan.bgLight,
                      plan.popular && "bg-gradient-to-br from-blue-50 to-purple-50"
                    )}>
                      <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg"
                           style={{ backgroundImage: `linear-gradient(to bottom right, ${plan.gradient})` }}>
                        <plan.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900 mb-1">
                        {plan.name}
                      </CardTitle>
                      <div className="mb-2">
                        <span className="text-3xl font-bold text-slate-900">
                          {getPlanPrice(plan)}
                        </span>
                        <span className="text-slate-600 ml-1">
                          {getPlanDuration(plan)}
                        </span>
                      </div>
                      <CardDescription className="text-slate-600 text-sm">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-4">
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start space-x-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-slate-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    
                    <CardFooter className="pt-2">
                      <Button
                        onClick={() => handleContinue(plan.id)}
                        disabled={isLoading || (plan.id !== 'trial' && isPaymentModeLoading)}
                        className={cn(
                          "w-full font-medium transition-all duration-200",
                          plan.popular 
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                            : "",
                          selectedPlan === plan.id && "ring-2 ring-blue-500 ring-offset-2"
                        )}
                        variant={plan.popular ? "default" : "outline"}
                      >
                        {isLoading && selectedPlan === plan.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : plan.id === 'trial' && isClient ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Activate Trial
                          </>
                        ) : (
                          <>
                            {plan.cta}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Trust Indicators */}
            <div className="mb-12">
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center group">
                    <div className="mx-auto mb-2 h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-xl font-bold text-slate-900 mb-1">Secure</div>
                    <div className="text-xs text-slate-600">Payment</div>
                  </div>
                  <div className="text-center group">
                    <div className="mx-auto mb-2 h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Headphones className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-xl font-bold text-slate-900 mb-1">24/7</div>
                    <div className="text-xs text-slate-600">Support</div>
                  </div>
                  <div className="text-center group">
                    <div className="mx-auto mb-2 h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-xl font-bold text-slate-900 mb-1">Unlimited</div>
                    <div className="text-xs text-slate-600">Users</div>
                  </div>
                  <div className="text-center group">
                    <div className="mx-auto mb-2 h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-xl font-bold text-slate-900 mb-1">15+</div>
                    <div className="text-xs text-slate-600">Days Free Trial</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Admin Settings */}
            {isAdmin && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mb-6"
              >
                <div className="max-w-3xl mx-auto">
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Admin Settings</h2>
                    <p className="text-sm text-slate-600">
                      Manage payment processing modes and subscription settings
                    </p>
                  </div>
                  <PaymentModeToggle 
                    currentMode={paymentMode}
                    onModeChange={(mode) => updatePaymentModeMutation.mutate(mode)}
                    isAdmin={isAdmin}
                  />
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}