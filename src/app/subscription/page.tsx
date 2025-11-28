'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, CheckCircle, Star, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  duration: string
  features: string[]
  color: string
  popular?: boolean
  icon?: string
  trialDays?: number
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'BASIC',
    description: 'Perfect for small societies with basic accounting needs',
    price: 4000,
    duration: 'monthly',
    features: [
      'Up to 50 members',
      'Basic accounting features',
      'Email support',
      'Mobile app access',
      'Community management'
    ],
    color: 'bg-blue-500',
    icon: '🏠️',
    popular: true,
    trialDays: 15
  },
  {
    id: 'pro',
    name: 'PROFESSIONAL',
    description: 'Advanced features for growing societies with complex operations',
    price: 8000,
    duration: 'monthly',
    features: [
      'Up to 200 members',
      'Advanced accounting & reporting',
      'Priority support',
      'Mobile app + Web access',
      'Advanced analytics',
      'API integrations',
      'Custom workflows',
      'Community management + forums'
    ],
    color: 'bg-purple-500',
    icon: '💎',
    popular: true,
    trialDays: 15
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    description: 'Complete solution for large enterprises with unlimited everything',
    price: 15000,
    duration: 'monthly',
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
      'Advanced community features'
    ],
    color: 'bg-gradient-to-r from-purple-600 to-indigo-600',
    icon: '🏢',
    popular: false,
    trialDays: 15
  }
]

export default function SubscriptionPage() {
  const router = useRouter()

  const handlePlanSelect = (planId: string) => {
    router.push(`/subscription/payment-upload?plan=${planId}`)
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
      return <Badge className="bg-orange-100 text-orange-800">Popular</Badge>
    }
    return null
  }

  const getTrialBadge = (plan: SubscriptionPlan) => {
    if (plan.trialDays && plan.trialDays > 0) {
      return <Badge className="bg-green-100 text-green-800">Trial Available</Badge>
    }
    return null
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Select the subscription that best fits your society needs
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="h-full"
            >
              <Card 
                className={`relative overflow-hidden border-2 ${plan.color} border-opacity-20 hover:border-opacity-30 transition-all duration-300 cursor-pointer`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                <CardHeader className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full ${plan.color} text-white flex items-center justify-center text-lg font-bold`}>
                        {plan.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                        <p className="text-gray-600 text-sm">{plan.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {getPopularBadge(plan)}
                      {getTrialBadge(plan)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{formatPrice(plan.price)}</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span>/{plan.duration}</span>
                      {plan.trialDays && (
                        <span className="text-green-600">+{plan.trialDays} days trial</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <ul className="space-y-2 text-sm text-gray-700">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
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