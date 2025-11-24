import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const subscriptionPlans = [
      { 
        name: 'Trial', 
        price: 0, 
        duration: '14 days', 
        features: ['Up to 50 members', 'Basic support', 'Limited storage'],
        color: 'bg-gray-500',
        description: 'Perfect for getting started with our platform'
      },
      { 
        name: 'Basic', 
        price: 99, 
        duration: 'monthly', 
        features: ['Up to 200 members', 'Email support', '10GB storage', 'Basic analytics'],
        color: 'bg-blue-500',
        description: 'Great for small societies and organizations'
      },
      { 
        name: 'Pro', 
        price: 299, 
        duration: 'monthly', 
        features: ['Unlimited members', 'Priority support', '100GB storage', 'Advanced analytics', 'API access'],
        color: 'bg-cyan-500',
        description: 'Ideal for growing societies with advanced needs'
      },
      { 
        name: 'Enterprise', 
        price: 599, 
        duration: 'monthly', 
        features: ['Unlimited everything', '24/7 phone support', 'Unlimited storage', 'Custom features', 'Dedicated account manager'],
        color: 'bg-purple-500',
        description: 'Complete solution for large organizations'
      }
    ]

    return NextResponse.json({ 
      success: true, 
      plans: subscriptionPlans 
    })
  } catch (error) {
    console.error('Subscription plans API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}