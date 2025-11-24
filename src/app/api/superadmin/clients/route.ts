import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { action, clientId, name, email, plan } = await request.json()

    // Use the same database operations as the main clients API
    switch (action) {
      case 'create':
        // For now, redirect to the main clients API for creation
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/clients`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            societyName: name || 'New Client',
            adminName: 'Admin',
            email: email || 'client@example.com',
            subscriptionType: plan || 'TRIAL'
          })
        })
        
        const result = await response.json()
        return NextResponse.json(result)

      case 'lock':
        // Lock a client account
        await db.societyAccount.update({
          where: { id: clientId },
          data: { status: 'LOCKED' }
        })
        return NextResponse.json({ 
          success: true, 
          message: 'Client locked successfully' 
        })

      case 'unlock':
        // Unlock a client account
        await db.societyAccount.update({
          where: { id: clientId },
          data: { status: 'ACTIVE' }
        })
        return NextResponse.json({ 
          success: true, 
          message: 'Client unlocked successfully' 
        })

      case 'renew_subscription':
        // Renew subscription with new plan
        const { newPlan } = await request.json()
        
        // Calculate new end date based on plan
        let subscriptionDuration = 30 // Default 30 days for paid plans
        if (newPlan === 'Trial') {
          subscriptionDuration = 14 // 14 days for trial
        } else if (newPlan === 'Enterprise' || newPlan === 'Pro' || newPlan === 'Basic') {
          subscriptionDuration = 30 // 30 days for paid plans
        }
        
        const newEndDate = new Date(Date.now() + subscriptionDuration * 24 * 60 * 60 * 1000)
        
        await db.societyAccount.update({
          where: { id: clientId },
          data: { 
            subscriptionPlan: newPlan.toUpperCase(),
            subscriptionEndsAt: newEndDate,
            status: 'ACTIVE',
            isActive: true
          }
        })
        
        return NextResponse.json({ 
          success: true, 
          message: `Subscription renewed successfully with ${newPlan} plan`,
          newPlan: newPlan,
          endDate: newEndDate
        })

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Clients API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { clientId } = await request.json()

    if (!clientId) {
      return NextResponse.json(
        { success: false, message: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Delete client from society accounts
    await db.societyAccount.delete({
      where: { id: clientId }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Client deleted successfully' 
    })
  } catch (error) {
    console.error('Delete client API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Fetch from society accounts
    const clients = await db.societyAccount.findMany({
      select: {
        id: true,
        name: true,
        adminName: true,
        email: true,
        phone: true,
        subscriptionPlan: true,
        status: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform data to match expected format
    const transformedClients = clients.map(client => ({
      id: client.id,
      name: client.name,
      adminName: client.adminName,
      email: client.email,
      phone: client.phone,
      plan: client.subscriptionPlan,
      status: client.status.toLowerCase(),
      renewDate: client.subscriptionEndsAt || client.trialEndsAt ? 
        new Date(client.subscriptionEndsAt || client.trialEndsAt).toLocaleDateString() : 
        'Not set',
      users: Math.floor(Math.random() * 100) + 10, // Mock user count
      trialEndsAt: client.trialEndsAt,
      subscriptionEndsAt: client.subscriptionEndsAt,
      isActive: client.isActive,
      createdAt: client.createdAt
    }))

    return NextResponse.json({ 
      success: true, 
      clients: transformedClients 
    })
  } catch (error) {
    console.error('Get clients API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}