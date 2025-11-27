'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, CheckCircle, ArrowRight, Star, Shield, Zap } from 'lucide-react'
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
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'BASIC',
    description: 'Perfect for small societies with basic accounting needs',
    price: 4000,
    duration: 'per month',
    features: [
      'Up to 50 members',
      'Basic accounting features',
      'Email support',
      'Mobile app access',
      'Community management'
    ],
    color: 'bg-blue-500',
    icon: '🏠️',
    popular: true
  },
  {
    id: 'pro',
    name: 'PROFESSIONAL',
    description: 'Advanced features for growing societies with complex operations',
    price: 7000,
    duration: 'per month',
    features: [
      'Up to 200 members',
      'Advanced accounting & reporting',
      'Priority support',
      'Mobile app + Web access',
      'Advanced analytics',
      'API integrations',
      'Custom workflows'
    ],
    color: 'bg-purple-500',
    icon: '💎',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    description: 'Complete solution for large enterprises with unlimited everything',
    price: 10000,
    duration: 'per month',
    features: [
      'Unlimited members',
      'Enterprise-grade security',
      'Advanced analytics & reporting',
      'API integrations + Webhooks',
      'Custom workflows & automations',
      'Priority support 24/7',
      'Dedicated account manager'
    ],
    color: 'bg-gradient-to-r from-purple-600 to-indigo-600',
    icon: '🏢',
    popular: false
  }
]

export default function SubscriptionPage() {
  const router = useRouter()

  const handlePlanSelect = (planId: string) => {
    // Redirect to payment upload page with plan parameter
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-blue-200 mb-2">
            Select the subscription that best fits your society needs
          </p>
        </motion.div>

        {/* Plans Section */}
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
                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                        <p className="text-blue-100 text-sm">{plan.description}</p>
                      </div>
                    </div>
                    {getPopularBadge(plan)}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-2xl font-bold text-white">{formatPrice(plan.price)}</div>
                    </div>
                    <div className="text-sm text-white">
                      <span className="text-blue-100">/{plan.duration}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <ul className="space-y-2 text-sm text-white">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button 
                    className="w-full mt-6 bg-white text-blue-600 hover:bg-blue-50"
                    onClick={() => handlePlanSelect(plan.id)}
                  >
                    Choose Plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-8">Why Choose Saanify?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <Shield className="w-8 h-8 text-blue-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Secure & Reliable</h3>
              <p className="text-blue-100">Bank-level security with 99.9% uptime guarantee</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <Zap className="w-8 h-8 text-blue-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Lightning Fast</h3>
              <p className="text-blue-100">Optimized performance for seamless experience</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <Star className="w-8 h-8 text-blue-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">5-Star Support</h3>
              <p className="text-blue-100">Dedicated support team ready to help you 24/7</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}