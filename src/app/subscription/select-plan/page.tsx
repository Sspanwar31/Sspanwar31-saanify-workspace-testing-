'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Crown, Zap, Building } from 'lucide-react'

const plans = [
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
    badgeVariant: 'secondary' as const,
    cta: 'Start Free Trial',
    popular: false
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
    badgeVariant: 'default' as const,
    cta: 'Choose Basic',
    popular: true
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
    badgeVariant: 'destructive' as const,
    cta: 'Choose Pro',
    popular: false
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
    badgeVariant: 'outline' as const,
    cta: 'Choose Enterprise',
    popular: false
  }
]

export default function SubscriptionSelectPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Save selected plan to localStorage
  useEffect(() => {
    if (selectedPlan) {
      localStorage.setItem('selectedPlan', selectedPlan)
    }
  }, [selectedPlan])

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
  }

  const handleContinue = (planId: string) => {
    setIsLoading(true)
    
    // Save selected plan to session storage as well
    sessionStorage.setItem('selectedPlan', planId)
    
    // Redirect to signup with plan parameter
    setTimeout(() => {
      router.push(`/auth/signup?plan=${planId}`)
    }, 300)
  }

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
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">Already have an account?</span>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Start with a free trial or select a plan that fits your society's needs. 
            No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <Card 
                key={plan.id}
                className={`relative transition-all duration-300 hover:shadow-lg cursor-pointer ${
                  selectedPlan === plan.id 
                    ? 'ring-2 ring-primary shadow-lg scale-105' 
                    : 'hover:scale-102'
                } ${plan.popular ? 'border-primary' : ''}`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="default" className="px-3 py-1">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-slate-900">
                      {plan.price}
                    </div>
                    <div className="text-sm text-slate-500">
                      {plan.duration}
                    </div>
                  </div>
                  <CardDescription className="text-sm">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                </CardContent>

                <CardFooter>
                  <Button 
                    className="w-full"
                    variant={selectedPlan === plan.id ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleContinue(plan.id)
                    }}
                    disabled={isLoading}
                  >
                    {isLoading && selectedPlan === plan.id ? (
                      <span>Processing...</span>
                    ) : (
                      plan.cta
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">15+</div>
              <div className="text-sm text-slate-600">Days Free Trial</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">1000+</div>
              <div className="text-sm text-slate-600">Happy Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">24/7</div>
              <div className="text-sm text-slate-600">Support</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">Secure</div>
              <div className="text-sm text-slate-600">Payment</div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens after the trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  After 15 days, you'll need to choose a paid plan to continue using the service.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  We offer a 7-day money-back guarantee for all paid plans.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is my data secure?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Yes! We use industry-standard encryption and security measures to protect your data.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}