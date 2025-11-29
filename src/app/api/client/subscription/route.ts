import { NextRequest, NextResponse } from 'next/server'
import { getClientAuth } from '@/lib/client-auth'

export async function GET(request: NextRequest) {
  try {
    // Verify client authentication using the same method as client verify
    const auth = await getClientAuth(request)
    
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user details with society account
    const { db } = await import('@/lib/db')
    const userDetails = await db.user.findUnique({
      where: { id: auth.user.id },
      include: { 
        societyAccount: true,
        paymentProofs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!userDetails) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Determine subscription status
    let subscriptionStatus = 'TRIAL'
    let trialEndsAt = userDetails.trialEndsAt
    let subscriptionEndsAt = userDetails.subscriptionEndsAt
    let daysRemaining = 0

    const now = new Date()

    // Check trial status
    if (userDetails.trialEndsAt) {
      const trialEndDate = new Date(userDetails.trialEndsAt)
      if (trialEndDate > now) {
        subscriptionStatus = 'TRIAL'
        const timeDiff = trialEndDate.getTime() - now.getTime()
        daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24))
      } else {
        // Trial expired
        subscriptionStatus = 'EXPIRED'
      }
    }

    // Check society account status
    if (userDetails.societyAccount) {
      const societyStatus = userDetails.societyAccount.status
      if (societyStatus === 'ACTIVE') {
        subscriptionStatus = 'ACTIVE'
        subscriptionEndsAt = userDetails.societyAccount.subscriptionEndsAt
      } else if (societyStatus === 'PENDING_PAYMENT') {
        subscriptionStatus = 'PENDING_PAYMENT'
      }
    }

    // Check if there are any active subscriptions from payment proofs
    const activePayment = userDetails.paymentProofs.find(payment => 
      payment.status === 'approved'
    )

    if (activePayment) {
      subscriptionStatus = 'ACTIVE'
      // Calculate subscription end date (30 days from approval)
      const approvalDate = new Date(activePayment.createdAt)
      subscriptionEndsAt = new Date(approvalDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    }

    // Format payment history
    const paymentHistory = userDetails.paymentProofs.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      plan: payment.plan,
      status: payment.status,
      createdAt: payment.createdAt.toISOString(),
      transactionId: payment.txnId
    }))

    // Format notifications
    const notifications = []

    // Determine current plan
    let currentPlan = 'TRIAL'
    if (userDetails.societyAccount) {
      currentPlan = userDetails.societyAccount.subscriptionPlan || 'TRIAL'
    } else if (activePayment) {
      currentPlan = activePayment.plan
    }

    const subscriptionData = {
      plan: currentPlan,
      status: subscriptionStatus,
      trialEndsAt: trialEndsAt?.toISOString(),
      subscriptionEndsAt: subscriptionEndsAt?.toISOString(),
      daysRemaining,
      paymentHistory,
      notifications
    }

    return NextResponse.json(subscriptionData)

  } catch (error) {
    console.error('Error fetching subscription data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}