'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Crown, Zap, Building, Star, ArrowRight, Shield, Headphones, Users, TrendingUp } from 'lucide-react'

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
    popular: false,
    gradient: 'from-gray-500 to-gray-600',
    bgLight: 'bg-gray-50'
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '₹4,000',
    duration: 'per month',
    description: 'Perfect for small societies getting started',
    features: [
      'Up to 50 members',
      'Basic transaction tracking',
      'Monthly reports',
      'Email support',
      'Mobile app access',
      'Advanced analytics',
      'Custom branding',
      'API access'
    ],
    icon: Crown,
    badge: 'Most Popular',
    badgeVariant: 'default' as const,
    cta: 'Choose Basic',
    popular: true,
    gradient: 'from-blue-500 to-cyan-500',
    bgLight: 'bg-blue-50'
  },
  {
    id: 'pro',
    name: 'Professional',
    price: '₹7,000',
    duration: 'per month',
    description: 'Ideal for growing societies with more needs',
    features: [
      'Up to 200 members',
      'Advanced transaction tracking',
      'Weekly & monthly reports',
      'Priority email support',
      'Mobile app access',
      'Advanced analytics dashboard',
      'Custom branding options',
      'API access',
      'Dedicated account manager'
    ],
    icon: Zap,
    badge: 'Best Value',
    badgeVariant: 'destructive' as const,
    cta: 'Choose Professional',
    popular: false,
    gradient: 'from-purple-500 to-pink-500',
    bgLight: 'bg-purple-50'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '₹10,000',
    duration: 'per month',
    description: 'Complete solution for large societies',
    features: [
      'Unlimited members',
      'Complete transaction management',
      'Real-time reporting & analytics',
      '24/7 phone & email support',
      'Mobile app with white-labeling',
      'Advanced analytics & insights',
      'Full custom branding',
      'API access for integrations',
      'Dedicated account manager',
      'On-site training & setup'
    ],
    icon: Building,
    badge: 'Premium',
    badgeVariant: 'outline' as const,
    cta: 'Choose Enterprise',
    popular: false,
    gradient: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-50'
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
    
    // Redirect to payment upload page with plan parameter
    setTimeout(() => {
      router.push(`/subscription/payment-upload?plan=${planId}`)
    }, 300)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Saanify</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">Already have an account?</span>
              <Link href="/login">
                <Button variant="outline" size="sm" className="border-blue-200 hover:border-blue-300 hover:bg-blue-50">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <Badge className="mb-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
            <Star className="w-4 h-4 mr-1" />
            Flexible Pricing Plans
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Choose Your
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Perfect Plan</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Start with a free trial or select a plan that fits your society's needs. 
            No hidden fees, cancel anytime. 14-day money-back guarantee.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto mb-20">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <div key={plan.id} className="relative group">
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>{plan.badge}</span>
                    </div>
                  </div>
                )}
                
                <Card 
                  className={`relative h-full transition-all duration-500 hover:shadow-2xl cursor-pointer border-2 ${
                    selectedPlan === plan.id 
                      ? 'ring-4 ring-blue-500/20 border-blue-500 shadow-2xl scale-105' 
                      : plan.popular 
                        ? 'border-blue-200 hover:border-blue-400' 
                        : 'border-slate-200 hover:border-slate-300'
                  } bg-white`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {/* Gradient Border Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-5 rounded-lg transition-opacity duration-300`}></div>
                  
                  <CardHeader className="text-center pb-6 relative">
                    {/* Icon */}
                    <div className={`mx-auto mb-6 h-16 w-16 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    
                    {/* Plan Name */}
                    <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
                      {plan.name}
                    </CardTitle>
                    
                    {/* Price */}
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-center space-x-1">
                        <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                        {plan.price !== 'Free' && (
                          <span className="text-slate-500 text-lg">/{plan.duration}</span>
                        )}
                      </div>
                      {plan.price === 'Free' && (
                        <div className="text-sm text-slate-500 font-medium">{plan.duration}</div>
                      )}
                    </div>
                    
                    {/* Description */}
                    <CardDescription className="text-slate-600 text-sm mt-3 leading-relaxed">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 pb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3 group/item">
                        <div className={`h-5 w-5 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm text-slate-700 leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </CardContent>

                  <CardFooter className="pt-2">
                    <Button 
                      className={`w-full py-3 text-base font-semibold transition-all duration-300 ${
                        selectedPlan === plan.id 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg' 
                          : plan.popular
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl'
                            : 'bg-slate-900 hover:bg-slate-800 text-white hover:shadow-lg'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleContinue(plan.id)
                      }}
                      disabled={isLoading}
                    >
                      {isLoading && selectedPlan === plan.id ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          {plan.cta}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )
          })}
        </div>

        {/* Trust Badges */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Choose Saanify?</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Trusted by societies across India for reliable management solutions
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">1000+</div>
              <div className="text-sm text-slate-600">Happy Users</div>
            </div>
            <div className="text-center group">
              <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">Secure</div>
              <div className="text-sm text-slate-600">Payment</div>
            </div>
            <div className="text-center group">
              <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Headphones className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">24/7</div>
              <div className="text-sm text-slate-600">Support</div>
            </div>
            <div className="text-center group">
              <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">15+</div>
              <div className="text-sm text-slate-600">Days Free Trial</div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
              Have Questions?
            </Badge>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to know about our pricing and plans
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="group hover:shadow-lg transition-all duration-300 border-slate-200 hover:border-blue-300">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                    Can I change plans later?
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-slate-600 leading-relaxed">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 border-slate-200 hover:border-blue-300">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                    What happens after trial?
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-slate-600 leading-relaxed">
                  After 15 days, you'll need to choose a paid plan to continue using our service.
                </p>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 border-slate-200 hover:border-blue-300">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                    Do you offer refunds?
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-slate-600 leading-relaxed">
                  We offer a 7-day money-back guarantee for all paid plans. No questions asked.
                </p>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 border-slate-200 hover:border-blue-300">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                    Is my data secure?
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-slate-600 leading-relaxed">
                  Yes! We use industry-standard encryption and security measures to protect your data.
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Contact Support */}
          <div className="text-center mt-12 p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
            <Headphones className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Still have questions?</h3>
            <p className="text-slate-600 mb-6">Our support team is here to help you 24/7</p>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}