'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Star, Crown, Building, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  color: string
  gradient?: string
  popular?: boolean
  icon?: React.ReactNode
  introductoryPrice?: boolean
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'trial',
    name: 'Free Trial',
    description: 'Experience all features free for 15 days',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'All premium features unlocked',
      'Up to 50 members',
      'Advanced accounting & reporting',
      'Priority support',
      'Mobile app + Web access',
      'Advanced analytics',
      'No credit card required'
    ],
    color: 'bg-gradient-to-br from-green-500 to-emerald-600',
    gradient: 'from-green-500 to-emerald-600',
    icon: <Users className="h-8 w-8" />,
    popular: false
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for small societies',
    monthlyPrice: 4000,
    yearlyPrice: 48000,
    features: [
      'Up to 50 members',
      'Basic accounting features',
      'Email support',
      'Mobile app access',
      'Community management',
      'Basic reporting',
      '15-day trial included'
    ],
    color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    gradient: 'from-blue-500 to-blue-600',
    icon: <Star className="h-8 w-8" />,
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Most popular choice',
    monthlyPrice: 7000,
    yearlyPrice: 84000,
    features: [
      'Up to 200 members',
      'Advanced accounting & reporting',
      'Priority support',
      'Mobile app + Web access',
      'Advanced analytics',
      'API integrations',
      'Custom workflows',
      'Community management + forums',
      '15-day trial included'
    ],
    color: 'bg-gradient-to-br from-purple-500 to-purple-600',
    gradient: 'from-purple-500 to-purple-600',
    icon: <Crown className="h-8 w-8" />,
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Complete solution for large enterprises',
    monthlyPrice: 10000,
    yearlyPrice: 120000,
    features: [
      'Unlimited members',
      'Enterprise-grade security',
      'Advanced analytics & reporting',
      'API integrations + Webhooks',
      'Custom workflows & automations',
      'Priority support 24/7',
      'Mobile app + Web access',
      'Advanced security & compliance',
      'Dedicated account manager',
      'White-label solutions',
      'Advanced community features',
      '15-day trial included'
    ],
    color: 'bg-gradient-to-br from-gray-700 to-gray-900',
    gradient: 'from-gray-700 to-gray-900',
    icon: <Building className="h-8 w-8" />,
    popular: false
  }
]

export default function SubscriptionPage() {
  const router = useRouter()
  const [isYearly, setIsYearly] = useState(false)

  const handlePlanSelect = (planId: string) => {
    if (planId === 'trial') {
      router.push('/auth/signup?plan=trial')
    } else {
      router.push(`/subscription/payment-upload?plan=${planId}&billing=${isYearly ? 'yearly' : 'monthly'}`)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getPopularBadge = (plan: SubscriptionPlan) => {
    if (plan.popular) {
      return <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg">Most Popular</Badge>
    }
    return null
  }

  const getPrice = (plan: SubscriptionPlan) => {
    return isYearly ? plan.yearlyPrice : plan.monthlyPrice
  }

  const getBillingText = (plan: SubscriptionPlan) => {
    if (plan.id === 'trial') return '15 Days'
    if (isYearly) {
      return '/year'
    }
    return '/month'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
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
              <Button variant="outline" size="sm" className="border-blue-200 hover:border-blue-300 hover:bg-blue-50">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {/* Annual Billing Discount */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full px-6 py-3 inline-flex items-center gap-2 mb-6">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-800 font-medium">Save up to 26% with annual billing</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
            Choose Your
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Perfect Plan</span>
          </h1>
          <p className="text-lg text-slate-600 mb-6 max-w-4xl mx-auto leading-relaxed">
            Select subscription that best fits your needs. Start with our free trial and upgrade as you grow.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-lg font-medium ${!isYearly ? 'text-slate-900' : 'text-slate-500'}`}>Pay monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 ${
                isYearly ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${
                  isYearly ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-lg font-medium ${isYearly ? 'text-slate-900' : 'text-slate-500'}`}>Pay annually</span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {SUBSCRIPTION_PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ delay: index * 0.1 }}
              className="h-full"
            >
              <Card 
                className={`relative h-full min-h-[520px] overflow-hidden border-2 bg-white hover:border-opacity-40 transition-all duration-300 cursor-pointer group ${
                  plan.popular ? 'ring-4 ring-purple-500/20 shadow-2xl border-purple-200' : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="p-4 relative">
                  <div className="text-center mb-3">
                    <div className={`w-12 h-12 rounded-xl ${plan.color} text-white flex items-center justify-center text-lg font-bold shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto mb-3`}>
                      {plan.icon}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
                    <p className="text-xs text-slate-600">{plan.description}</p>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 relative flex flex-col">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                      {plan.id === 'trial' ? 'FREE' : formatPrice(getPrice(plan))}
                    </div>
                    <div className="text-sm text-slate-600 font-medium">
                      {getBillingText(plan)}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <Button 
                      className={`w-full py-2 text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
                        plan.id === 'trial' 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white' 
                          : plan.popular
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                      }`}
                    >
                      {plan.id === 'trial' ? 'Start Free Trial' : 'Select Plan'}
                    </Button>
                  </div>
                  
                  <div className="flex-grow">
                    <ul className="space-y-2 text-xs text-slate-700">
                      {plan.features.slice(0, 6).map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                      {plan.features.length > 6 && (
                        <li className="text-xs text-slate-500 italic">+{plan.features.length - 6} more features</li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}