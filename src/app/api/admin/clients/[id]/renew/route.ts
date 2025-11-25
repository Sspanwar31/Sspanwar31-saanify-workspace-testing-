import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { plan } = await request.json()

    console.log(`Renewing subscription for client ${id} to plan: ${plan}`)

    if (!plan || !['BASIC', 'PRO', 'ENTERPRISE'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan specified' },
        { status: 400 }
      )
    }

    // Calculate subscription end date
    const subscriptionEndsAt = new Date()
    const planDurations = {
      BASIC: 30, // 1 month
      PRO: 90,   // 3 months
      ENTERPRISE: 365 // 1 year
    }
    subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + planDurations[plan as keyof typeof planDurations])

    // Try to find the society account by ID first
    let updatedClient
    try {
      updatedClient = await db.societyAccount.update({
        where: { id },
        data: {
          subscriptionPlan: plan,
          status: 'ACTIVE',
          subscriptionEndsAt: subscriptionEndsAt,
          trialEndsAt: null, // Clear trial end date
          isActive: true
        }
      })
    } catch (error) {
      console.log('Failed to update by society account ID, trying by user ID...')
      
      // If that fails, try to find the society account by user ID
      const user = await db.user.findUnique({
        where: { id }
      })
      
      if (!user || !user.societyAccountId) {
        return NextResponse.json(
          { error: 'Client not found or no associated society account' },
          { status: 404 }
        )
      }
      
      updatedClient = await db.societyAccount.update({
        where: { id: user.societyAccountId },
        data: {
          subscriptionPlan: plan,
          status: 'ACTIVE',
          subscriptionEndsAt: subscriptionEndsAt,
          trialEndsAt: null, // Clear trial end date
          isActive: true
        }
      })
    }

    console.log('Subscription renewed successfully:', updatedClient)

    return NextResponse.json({
      success: true,
      message: `Subscription renewed to ${plan} plan successfully`,
      client: updatedClient
    })

  } catch (error) {
    console.error('Renew subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to renew subscription: ' + error.message },
      { status: 500 }
    )
  }
}