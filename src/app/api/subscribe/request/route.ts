import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/auth-middleware'

interface PaymentRequest {
  plan: string
  transactionId: string
  additionalInfo?: string
  paymentMethod: string
  screenshotUrl?: string
  userId: string
  societyName: string
  societyAccountId: string
  amount: number
  status: 'pending'
  createdAt: Date
  updatedAt: Date
}

interface SubscriptionData {
  plan: string
  planExpiry: Date
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔥 Payment request received:', body)

    const { 
      plan, 
      transactionId, 
      additionalInfo, 
      paymentMethod, 
      screenshotUrl 
    } = body

    // Validate required fields
    if (!plan || !transactionId) {
      return NextResponse.json(
        { error: 'Plan and transaction ID are required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: body.userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if society account exists
    const societyAccount = await db.societyAccount.findUnique({
      where: { id: user.societyAccountId }
    })

    if (!societyAccount) {
      return NextResponse.json(
        { error: 'Society account not found' },
        { status: 404 }
      )
    }

    // Get plan details
    let planDetails: any = null
    try {
      const plans = await db.subscriptionPlan.findMany()
      planDetails = plans.find((p: any) => p.id === plan)
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    }

    if (!planDetails) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    // Calculate subscription expiry
    const now = new Date()
    let planExpiry: Date | null = null

    switch (plan.toLowerCase()) {
      case 'basic':
        planExpiry = new Date(now.getTime() + 30 * 24 * 60 * 1000) // 30 days
        break
      case 'pro':
        planExpiry = new Date(now.getTime() + 90 * 24 * 60 * 1000) // 90 days
        break
      case 'enterprise':
        planExpiry = new Date(now.getTime() + 365 * 24 * 60 * 1000) // 1 year
        break
      default:
        planExpiry = new Date(now.getTime() + 15 * 24 * 60 * 1000) // 15 days (default trial)
        break
    }

    // Calculate amount based on plan
    let amount = 0
    try {
      const planAmount = planDetails?.price || 0
      const multiplier = PRICING_TIERS.find(tier => tier.id === duration)?.multiplier || 1
      amount = planAmount * multiplier
    } catch (error) {
      console.error('Error calculating amount:', error)
      amount = planDetails?.price || 0
    }

    // Create payment request
    const paymentRequest: PaymentRequest = {
      plan,
      transactionId,
      additionalInfo: additionalInfo || '',
      paymentMethod: paymentMethod || 'upi',
      screenshotUrl: screenshotUrl || '',
      userId: user.id,
      societyName: societyAccount.name,
      societyAccountId: user.societyAccountId,
      amount,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    }

    // Save payment request to database
    const savedRequest = await db.paymentRequest.create({
      data: {
        ...paymentRequest,
        status: 'pending'
      }
    })

    console.log('💳 Payment request saved:', savedRequest.id)

    // Update user's subscription
    let subscriptionData: SubscriptionData | null = null
    try {
      subscriptionData = await db.societyAccount.findUnique({
        where: { id: user.societyAccountId }
      })
    } catch (error) {
      console.error('Error finding society account:', error)
    }

    if (subscriptionData) {
      // Update subscription
      await db.societyAccount.update({
        where: { id: user.societyAccountId },
        data: {
          subscriptionPlan: plan.toUpperCase(),
          status: 'ACTIVE',
          subscriptionEndsAt: planExpiry,
          trialEndsAt: plan.toLowerCase() === 'basic' ? planExpiry : null,
          updatedAt: now
        }
      })
    } else {
      // Create new subscription
      subscriptionData = await db.societyAccount.create({
        data: {
          userId: user.id,
          societyName: societyAccount.name,
          societyAccountId: user.societyAccountId,
          subscriptionPlan: plan.toUpperCase(),
          status: 'ACTIVE',
          subscriptionEndsAt: planExpiry,
          trialEndsAt: plan.toLowerCase() === 'basic' ? planExpiry : null,
          createdAt: now,
          updatedAt: now
        }
      })
    }

    console.log('📊 Subscription updated:', subscriptionData?.id)

    // Create payment proof
    const paymentProof = await db.paymentProof.create({
      data: {
        userId: user.id,
        amount,
        plan,
        txnId: transactionId,
        status: 'pending',
        screenshotUrl: screenshotUrl || '',
        createdAt: now,
        updatedAt: now
      }
    })

    console.log('💳 Payment proof created:', paymentProof.id)

    return NextResponse.json({
      success: true,
      message: 'Payment submitted successfully. Your payment is now under review.',
      paymentId: pendingPayment.id,
      paymentData: {
        id: pendingPayment.id,
        amount: pendingPayment.amount,
        plan: pendingPayment.plan,
        transactionId: pendingPayment.txnId,
        status: pendingPayment.status,
        expiresAt: pendingPayment.expiresAt,
        createdAt: pendingPayment.createdAt
      }
    })
  } catch (error) {
    console.error('Payment request error:', error)
    return NextResponse.json(
      { error: 'Failed to process payment request' },
      { status: 500 }
    )
  }
}