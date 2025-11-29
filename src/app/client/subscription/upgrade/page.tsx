'use client'

import Link from 'next/link'
import { useState } from 'react'
import { 
  Check, 
  ArrowLeft, 
  Crown, 
  Shield, 
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Mock current plan - will be replaced with database subscription later
const currentPlan = {
  name: 'Basic',
  price: 4000
}

const plans = [
  {
    name: 'Basic',
    price: 4000,
    duration: 'per month',
    description: 'Perfect for small societies getting started',
    icon: Crown,
    color: 'bg-purple-600',
    hoverColor: 'hover:bg-purple-700',
    features: [
      'Up to 50 members',
      'Basic transaction tracking',
      'Monthly reports',
      'Email support',
      'Mobile app access',
      'Advanced analytics',
      'Custom branding',
      'API access'
    ]
  },
  {
    name: 'Professional',
    price: 7000,
    duration: 'per month',
    description: 'Ideal for growing societies with more needs',
    icon: Shield,
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
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
    popular: true
  },
  {
    name: 'Enterprise',
    price: 10000,
    duration: 'per month',
    description: 'Complete solution for large societies',
    icon: Crown,
    color: 'bg-orange-600',
    hoverColor: 'hover:bg-orange-700',
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
    ]
  }
]

function PlanButton({ plan }: { plan: typeof plans[0] }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      // Redirect to payment upload page with plan parameter
      const planId = plan.name.toLowerCase().replace('professional', 'pro').replace('enterprise', 'enterprise')
      window.location.href = `/subscription/payment-upload?plan=${planId}`
    } catch (error) {
      console.error('Navigation error:', error)
      alert('❌ Failed to navigate to payment page. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      className={cn("w-full h-8 text-white text-xs font-medium transition-colors", plan.color, plan.hoverColor)}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
          Processing...
        </div>
      ) : (
        `Choose ${plan.name}`
      )}
    </Button>
  )
}

export default function SubscriptionUpgrade() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="container mx-auto px-4 max-w-6xl flex-1 flex flex-col">
        {/* Back to Dashboard Button - Fixed at top */}
        <div className="pt-4 pb-2">
          <Link href="/dashboard/client">
            <Button 
              variant="ghost" 
              className="pl-0 text-gray-600 hover:text-gray-900 text-sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Header - Moved to top */}
        <div className="text-center mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
            Choose Your Subscription Plan
          </h1>
          <p className="text-gray-500 text-xs">
            Select the perfect plan for your society's needs
          </p>
        </div>

        {/* Pricing Cards - Main content - Centered vertically */}
        <div className="flex-1 flex items-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {plans.map((plan) => {
              const PlanIcon = plan.icon
              
              return (
                <Card
                  key={plan.name}
                  className={cn(
                    "relative flex flex-col h-full",
                    plan.popular && "border-blue-500 shadow-sm"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 hover:bg-blue-700 text-xs px-2 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-2">
                    <PlanIcon className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                    <CardTitle className="text-sm font-bold">{plan.name}</CardTitle>
                    <div className="mt-1">
                      <span className="text-lg font-bold">₹{plan.price}</span>
                      <span className="text-gray-500 ml-1 text-xs">{plan.duration}</span>
                    </div>
                    <CardDescription className="mt-1 text-xs">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 px-3 py-1">
                    <ul className="space-y-1 text-xs">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center">
                          <Check className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-2 px-3 pb-3">
                    <PlanButton plan={plan} />
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Help Section - Fixed at bottom */}
        <div className="text-center bg-gray-100 rounded-lg p-3 mt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            Need help choosing a plan?
          </h3>
          <p className="text-gray-500 text-xs mb-2">
            Our support team is here to help you make the right choice.
          </p>
          <Button variant="outline" size="sm">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  )
}