'use client'

import { PaymentModeToggle } from '@/components/admin/PaymentModeToggle'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
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

// Mock user data - in real app, this would come from API/auth context
const mockUserData = {
  trialEndsAt: '2025-12-13', // ISO date string
  subscriptionStatus: 'TRIAL' as 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'NONE'
}

// Get real user data from API or use mock
const getUserData = () => {
  // In real implementation, this would fetch from API
  // For now, return mock data to match the screenshot
  return mockUserData
}

export default function SubscriptionSelectPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isYearly, setIsYearly] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [trialStatus, setTrialStatus] = useState<{
    isValid: boolean
    daysRemaining: number | null
    isExpired: boolean
  }>({
    isValid: false,
    daysRemaining: null,
    isExpired: false
  })

  // Load payment mode from environment or API using TanStack Query
  const { 
    data: paymentData, 
    isLoading: isPaymentModeLoading, 
    error: paymentModeError 
  } = useQuery({
    queryKey: ['payment-mode'],
    queryFn: async () => {
      // First try to get from environment (for SSR)
      const envMode = process.env.NEXT_PUBLIC_PAYMENT_MODE
      
      if (envMode && ['MANUAL', 'RAZORPAY'].includes(envMode)) {
        return { mode: envMode as 'MANUAL' | 'RAZORPAY' }
      } else {
        // Fallback to API call (client-side only)
        if (typeof window !== 'undefined') {
          const response = await fetch('/api/admin/payment-mode')
          if (!response.ok) {
            throw new Error('Failed to fetch payment mode')
          }
          return response.json()
        }
        // Fallback for SSR
        return { mode: 'MANUAL' as 'MANUAL' | 'RAZORPAY' }
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
    retry: 3,
  })

  // Get payment mode from query data
  const paymentMode = paymentData?.mode || null

  // Calculate trial status
  useEffect(() => {
    const userData = getUserData()
    if (userData.trialEndsAt) {
      const trialEnd = new Date(userData.trialEndsAt)
      const now = new Date()
      const diffTime = trialEnd.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      setTrialStatus({
        isValid: diffDays > 0,
        daysRemaining: diffDays > 0 ? diffDays : null,
        isExpired: diffDays <= 0
      })
    }
  }, [])

  // Check if user is coming from client dashboard and detect admin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const referrer = document.referrer
      const path = window.location.pathname
      
      // Simple check if user is coming from client area
      setIsClient(path.includes('/client') || referrer.includes('/client'))
      
      // Check if user is admin (in real app, this would come from auth context)
      const checkAdminStatus = async () => {
        try {
          const response = await fetch('/api/auth/check-session')
          if (response.ok) {
            const data = await response.json()
            setIsAdmin(data.user?.role === 'ADMIN')
          }
        } catch (error) {
          console.error('Error checking admin status:', error)
        }
      }
      
      checkAdminStatus()
    }
  }, [])

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
  }

  const createRazorpayOrder = async (plan: SubscriptionPlan) => {
    try {
      const amount = isYearly ? plan.yearlyPrice || plan.monthlyPrice! * 12 : plan.monthlyPrice!
      
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          amount: amount,
          currency: 'INR',
          receipt: `receipt_${plan.id}_${Date.now()}`
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment order')
      }

      const data = await response.json()
      console.log('Razorpay order created:', data)
      
      // In a real implementation, you would initialize Razorpay here
      // For demo purposes, we'll just show success
      toast.success('Payment Order Created', {
        description: `Order ID: ${data.order.id}`,
        duration: 5000,
      })

      return data
    } catch (error) {
      console.error('Error creating Razorpay order:', error)
      throw error
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
        // Handle trial signup
        if (isClient) {
          // Existing user activating trial
          toast.success('Trial Activated', {
            description: 'Your 15-day trial has been activated',
            duration: 3000,
          })
          setTimeout(() => {
            router.push('/client/dashboard')
          }, 1000)
        } else {
          // New user signup
          router.push(`/auth/signup?plan=${planId}`)
        }
      } else {
        // Paid plan selection
        if (!paymentMode) {
          toast.error('Payment Mode Not Configured', {
            description: 'Please contact admin to configure payment settings',
            duration: 5000,
          })
          setIsLoading(false)
          return
        }

        if (paymentMode === 'MANUAL') {
          // Redirect to manual payment upload
          router.push(`/subscription/payment-upload?plan=${planId}&billing=${isYearly ? 'yearly' : 'monthly'}`)
        } else if (paymentMode === 'RAZORPAY') {
          // Create Razorpay order
          await createRazorpayOrder(plan)
          
          // In real implementation, initialize Razorpay checkout
          // For demo, redirect to waiting page
          setTimeout(() => {
            router.push('/subscription/waiting')
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Error handling plan selection:', error)
      toast.error('Error', {
        description: 'Failed to process your request. Please try again.',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPlanPrice = (plan: SubscriptionPlan) => {
    if (plan.id === 'trial') return plan.price
    
    const price = isYearly 
      ? (plan.yearlyPrice || plan.monthlyPrice! * 12)
      : plan.monthlyPrice!
    
    return `₹${price.toLocaleString('en-IN')}`
  }

  const getPlanDuration = (plan: SubscriptionPlan) => {
    if (plan.id === 'trial') return plan.duration
    return isYearly ? 'per year' : 'per month'
  }

  const getPaymentModeIcon = () => {
    if (!paymentMode) return <Settings className="h-4 w-4" />
    return <CreditCard className="h-4 w-4" />
  }

  const getPaymentModeText = () => {
    if (!paymentMode) return 'Payment mode not configured'
    return 'Instant payment available'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Saanify</span>
            </div>
            <div className="flex items-center space-x-3">
              {isClient && (
                <Button variant="outline" size="sm" onClick={() => router.push('/client/dashboard')}>
                  Back to Dashboard
                </Button>
              )}
              <Link href="/login">
                <Button variant="outline" size="sm" className="border-blue-200 hover:border-blue-300 hover:bg-blue-50">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Compact Trial Status Alert */}
        {isClient && (() => {
          const userData = getUserData()
          return userData.subscriptionStatus === 'TRIAL'
        })() && (
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
                      Trial expired on {new Date(getUserData().trialEndsAt!).toLocaleDateString()}
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

  

        {/* Compact Hero Section */}
        <div className="text-center mb-6">
          <div className="mb-3">
            <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">Current Subscription</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 leading-tight">
            Choose Your
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Perfect Plan</span>
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto">
            Select the subscription that best fits your society needs
          </p>
        </div>

        {/* Payment Mode Status for Admins */}
        {isAdmin && paymentMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-center">
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border",
                paymentMode === 'MANUAL' 
                  ? "bg-yellow-50 text-yellow-800 border-yellow-200" 
                  : "bg-green-50 text-green-800 border-green-200"
              )}>
                {paymentMode === 'MANUAL' ? (
                  <>
                    <Settings className="h-4 w-4" />
                    <span>Manual Payment Mode Active</span>
                    <Badge variant="secondary" className="text-xs">Users upload receipts</Badge>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span>Razorpay Gateway Active</span>
                    <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">Instant payments</Badge>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment Mode Loading/Error State */}
        {isPaymentModeLoading && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading payment configuration...</span>
            </div>
          </div>
        )}

        {paymentModeError && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Payment configuration unavailable</span>
            </div>
          </div>
        )}

        {/* Compact Pricing Cards */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan, index) => {
              const Icon = plan.icon
              const isDisabled = plan.id !== 'trial' && (!paymentMode || isPaymentModeLoading)
              const isSelected = selectedPlan === plan.id
              
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="w-full"
                >
                  <Card 
                    className={`relative h-full transition-all duration-300 hover:shadow-lg cursor-pointer border-2 ${
                      isSelected 
                        ? 'ring-2 ring-blue-500/30 border-blue-500 shadow-lg' 
                        : plan.popular 
                          ? 'border-blue-200 hover:border-blue-400' 
                          : isDisabled
                            ? 'border-slate-200 opacity-60 cursor-not-allowed'
                            : 'border-slate-200 hover:border-slate-300'
                    } bg-white`}
                    onClick={() => !isDisabled && handlePlanSelect(plan.id)}
                  >
                    {isDisabled && (
                      <div className="absolute inset-0 bg-slate-100/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <AlertCircle className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                          <p className="text-xs font-medium text-slate-600">
                            {isPaymentModeLoading ? 'Loading...' : 'Payment Disabled'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-3">
                      {/* Plan Name */}
                      <CardTitle className="text-lg font-bold text-slate-900 mb-2">
                        {plan.name}
                      </CardTitle>
                      
                      {/* Price */}
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-center space-x-1">
                          <span className="text-2xl font-bold text-slate-900">{getPlanPrice(plan)}</span>
                          {plan.id !== 'trial' && (
                            <span className="text-slate-500 text-xs">/{getPlanDuration(plan).split(' ')[1]}</span>
                          )}
                        </div>
                        {plan.id === 'trial' && (
                          <div className="text-xs text-slate-500 font-medium">{plan.duration}</div>
                        )}
                      </div>
                      
                      {/* Description */}
                      <CardDescription className="text-slate-600 text-xs mt-1 leading-relaxed">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-2 pb-3 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span className="text-xs text-slate-700 leading-tight">{feature}</span>
                        </div>
                      ))}
                    </CardContent>

                    <CardFooter className="pt-1">
                      <Button 
                        className={`w-full py-2 text-sm font-semibold transition-all duration-300 ${
                          isSelected 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                            : plan.popular
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                              : isDisabled
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                : 'bg-slate-900 hover:bg-slate-800 text-white hover:shadow-lg'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!isDisabled) {
                            handleContinue(plan.id)
                          }
                        }}
                        disabled={isLoading || isDisabled || isPaymentModeLoading}
                      >
                        {(isLoading && isSelected) ? (
                          <span className="flex items-center">
                            <Loader2 className="animate-spin h-3 w-3 mr-1" />
                            Processing...
                          </span>
                        ) : isPaymentModeLoading ? (
                          <span className="flex items-center">
                            <Loader2 className="animate-spin h-3 w-3 mr-1" />
                            Loading...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            {plan.id === 'trial' ? 'Start Free Trial' : 
                             isDisabled ? 'Payment Disabled' : 
                             'Pay Now'}
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </span>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Compact Trust Badges */}
        <div className="mb-6">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Why Choose Saanify?</h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              Trusted by societies across India for reliable management solutions
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="text-center group">
              <div className="mx-auto mb-2 h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="text-xl font-bold text-slate-900 mb-1">1000+</div>
              <div className="text-xs text-slate-600">Happy Users</div>
            </div>
            <div className="text-center group">
              <div className="mx-auto mb-2 h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
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
              <div className="mx-auto mb-2 h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div className="text-xl font-bold text-slate-900 mb-1">15+</div>
              <div className="text-xs text-slate-600">Days Free Trial</div>
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
                onModeChange={(mode) => setPaymentMode(mode)}
                isAdmin={isAdmin}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}