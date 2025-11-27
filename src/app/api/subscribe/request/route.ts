import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { NotificationService } from '@/lib/notifications'

interface PaymentRequest {
  plan: string
  transactionId: string
  additionalInfo: string
  paymentMethod: string
  screenshotUrl: string
  userId: string
  societyName: string
  societyAccountId: string
  amount: number
}

const PRICING_TIERS = [
  { id: '1', name: '1 Month', multiplier: 1, popular: true },
  { id: '3', name: '3 Months', multiplier: 2.8, popular: true },
  { id: '6', name: '6 Months', multiplier: 5, popular: false },
  { id: '12', name: '1 Year', multiplier: 10, popular: false }
]

const SUBSCRIPTION_PLANS = {
  basic: { price: 4000, name: 'Basic' },
  professional: { price: 8000, name: 'Professional' },
  enterprise: { price: 15000, name: 'Enterprise' }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const cookies = request.cookies.getAll()
    const authCookie = cookies.find(cookie => cookie.name === 'auth-token')
    const token = authCookie?.value

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify token
    let user = null
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!)
      user = decoded as any
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get form data
    const formData = await request.formData()
    const plan = formData.get('plan') as string
    const transactionId = formData.get('transactionId') as string
    const additionalInfo = formData.get('additionalInfo') as string
    const paymentMethod = formData.get('paymentMethod') as string
    const screenshot = formData.get('screenshot') as File

    if (!plan || !transactionId) {
      return NextResponse.json({ error: 'Plan and transaction ID are required' }, { status: 400 })
    }

    // Get user's society account
    const societyAccount = await db.societyAccount.findFirst({
      where: { userId: user.userId }
    })

    if (!societyAccount) {
      return NextResponse.json({ error: 'Society account not found' }, { status: 404 })
    }

    // Get plan details
    const planDetails = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]
    if (!planDetails) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }

    // Calculate amount based on plan
    let amount = 0
    try {
      const planAmount = planDetails?.price || 0
      const multiplier = PRICING_TIERS.find(tier => tier.multiplier) || 1
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
      screenshotUrl: '',
      userId: user.id,
      societyName: societyAccount.name,
      societyAccountId: user.societyAccountId,
      amount,
      updatedAt: new Date()
    }

    // Save payment request to database
    const savedRequest = await db.paymentRequest.create({
      data: {
        ...paymentRequest,
        status: 'pending'
      }
    })

    console.log('💳 Payment request saved:', savedRequest.id)

    // Update user's subscription status
    await db.user.update({
      where: { id: user.userId },
      data: {
        subscriptionStatus: 'PENDING',
        plan: plan,
        updatedAt: new Date()
      }
    })

    // Update society account status
    await db.societyAccount.update({
      where: { id: societyAccount.id },
      data: {
        status: 'PENDING',
        updatedAt: new Date()
      }
    })

    // Handle screenshot upload
    let screenshotUrl = ''
    if (screenshot) {
      try {
        const buffer = Buffer.from(await screenshot.arrayBuffer())
        const base64 = buffer.toString('base64')
        screenshotUrl = `data:${screenshot.type};base64,${base64}`
      } catch (error) {
        console.error('Failed to process screenshot:', error)
      }
    }

    // Create payment proof record
    const paymentProof = await db.paymentProof.create({
      data: {
        userId: user.id,
        amount,
        plan,
        txnId: transactionId,
        screenshotUrl,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log('💳 Payment proof created:', paymentProof.id)

    // Calculate subscription end date
    const now = new Date()
    const subscriptionEndsAt = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days from now

    // Prepare subscription data
    const subscriptionData = {
      plan,
      status: 'PENDING',
      subscriptionEndsAt,
      trialEndsAt: null
    }

    // Send notification to admin
    try {
      const notificationService = new NotificationService()
      await notificationService.sendPaymentNotification({
        type: 'PAYMENT_RECEIVED',
        userId: user.userId,
        title: 'New Payment Request',
        message: `New payment request of ₹${amount} for ${planDetails.name} plan`,
        data: {
          paymentRequestId: savedRequest.id,
          paymentProofId: paymentProof.id,
          amount,
          plan,
          transactionId,
          user: {
            name: user.name,
            email: user.email
          },
          societyAccount: {
            name: societyAccount.name
          }
        },
        createdAt: new Date()
      })
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError)
    }

    return NextResponse.json({
      success: true,
      message: 'Payment request submitted successfully',
      requestId: savedRequest.id,
      paymentProofId: paymentProof.id,
      subscriptionData
    })
  } catch (error) {
    console.error('Payment request error:', error)
    return NextResponse.json(
      { error: 'Failed to process payment request' },
      { status: 500 }
    )
  }
}