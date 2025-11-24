import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { clientId, newPlan, duration = 'monthly', autoRenew = false } = await request.json()

    if (!clientId || !newPlan) {
      return NextResponse.json(
        { success: false, message: 'Client ID and new plan are required' },
        { status: 400 }
      )
    }

    // Calculate subscription duration in days
    let subscriptionDuration = 30 // Default 30 days
    if (newPlan === 'Trial') {
      subscriptionDuration = 14
    } else if (duration === 'yearly') {
      subscriptionDuration = 365
    }

    const newEndDate = new Date(Date.now() + subscriptionDuration * 24 * 60 * 60 * 1000)

    // Get current client info for notification
    const currentClient = await db.societyAccount.findUnique({
      where: { id: clientId },
      select: { name: true, email: true, subscriptionPlan: true }
    })

    if (!currentClient) {
      return NextResponse.json(
        { success: false, message: 'Client not found' },
        { status: 404 }
      )
    }

    // Update subscription
    const updatedClient = await db.societyAccount.update({
      where: { id: clientId },
      data: { 
        subscriptionPlan: newPlan.toUpperCase(),
        subscriptionEndsAt: newEndDate,
        status: 'ACTIVE',
        isActive: true,
        autoRenew: autoRenew,
        updatedAt: new Date()
      }
    })

    // Log renewal activity
    console.log(`Subscription renewed for ${currentClient.name} (${currentClient.email}): ${currentClient.subscriptionPlan} → ${newPlan}, Auto-Renew: ${autoRenew ? 'ON' : 'OFF'}`)

    return NextResponse.json({ 
      success: true, 
      message: `Subscription renewed successfully for ${currentClient.name}`,
      data: {
        clientId: updatedClient.id,
        previousPlan: currentClient.subscriptionPlan,
        newPlan: newPlan,
        newEndDate: newEndDate,
        duration: subscriptionDuration,
        autoRenew: autoRenew
      }
    })

  } catch (error) {
    console.error('Renew subscription API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get all subscriptions that are expiring soon (within 7 days)
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    
    const expiringSubscriptions = await db.societyAccount.findMany({
      where: {
        subscriptionEndsAt: {
          lte: sevenDaysFromNow
        },
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionPlan: true,
        subscriptionEndsAt: true
      },
      orderBy: {
        subscriptionEndsAt: 'asc'
      }
    })

    // Calculate days left for each
    const subscriptionsWithDaysLeft = expiringSubscriptions.map(sub => ({
      ...sub,
      daysLeft: Math.ceil((new Date(sub.subscriptionEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }))

    return NextResponse.json({ 
      success: true, 
      expiringSoon: subscriptionsWithDaysLeft 
    })
  } catch (error) {
    console.error('Get expiring subscriptions API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}